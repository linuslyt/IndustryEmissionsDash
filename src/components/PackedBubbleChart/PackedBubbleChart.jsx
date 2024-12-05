import { Button } from '@mui/material';
import useResizeObserver from '@react-hook/resize-observer';
import * as d3 from 'd3';
import { debounce, isEmpty } from 'lodash';
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Select from 'react-select';
import SelectedDataContext from '../../stores/SelectedDataContext';

import './index.css';

// TODO: add buttons for return to root/recenter at selected node in corner
// TODO: If no children set opacity to 0 and display pie chart instead.

function PackedBubbleChart({ data, labels }) {
  const [selectedBubble, setSelectedBubble] = useState(null); // TODO: hoist into react context to allow for use in other components
  const { selectedData, setSelectedData } = useContext(SelectedDataContext);
  const bubbleDisplayed = (d) => d.depth <= selectedBubble.depth + 1;
  const labelDisplayed = (d) => d.depth === selectedBubble.depth + 1; // TODO: hide if font size < 1. move to tooltip.
  const color = d3
    .scaleLinear()
    .domain([0, 5])
    .range(['hsl(152,80%,80%)', 'hsl(228,30%,40%)']) // TODO: placeholder color scheme. replace as necessary
    .interpolate(d3.interpolateHcl);

  const hierarchyData = useMemo(() => {
    if (isEmpty(data)) return;
    const emissionsBySector = d3.rollup(
      data,
      (v) => d3.sum(v, (d) => d.total),
      (d) => d.sector,
      (d) => d.subsector,
      (d) => d.indGroup,
      (d) => d.industry,
      (d) => d.naics,
    );

    const root = d3
      .hierarchy(emissionsBySector, ([, value]) =>
        value instanceof Map ? Array.from(value.entries()) : null,
      )
      .sum(([key, value]) => (typeof value === 'number' ? value : 0))
      .sort((a, b) => b.value - a.value);

    function flattenSingleChildren(node) {
      if (!node || !node.children) return;
      if (node.children.length === 1) {
        const c = node.children[0];
        flattenSingleChildren(c);
        node.data = c.data;
        node.height = c.height;
        node.depth = c.depth;
        node.children = c.children;
      } else {
        node.children.forEach(flattenSingleChildren);
      }
    }

    flattenSingleChildren(root);
    setSelectedBubble(root);
    return root;
  }, [data]);

  useEffect(() => {
    if (!selectedBubble || !selectedBubble.data) return;
    setSelectedData({
      ...selectedData,
      naics: selectedBubble.data[0],
      depth: selectedBubble.depth,
      label: labels.get(selectedBubble.data[0]),
    });
  }, [selectedBubble]);

  const [size, setSize] = useState({ width: 0, height: 0 });
  const graphRef = useRef(null); // When ref is created as null, React will map it to the JSX node it's assigned to on render.
  const handleResize = useCallback(
    debounce((entry) => setSize(entry.contentRect), 100), // On window resize, call setSize with debounce of 50ms
    [],
  );
  useResizeObserver(graphRef, handleResize);

  // Cancel pending debounced calls on component unmount
  useEffect(() => {
    return () => {
      handleResize.cancel();
    };
  }, [handleResize]);

  const renderGraph = () => {
    if (!hierarchyData) return;
    if (size.width === 0) return;
    const pack = d3.pack().size([size.width, size.height]).padding(1);
    const root = hierarchyData.copy();
    pack(root);
    // console.log(size.width, size.height);
    // console.log(root);
    const svgRoot = d3
      .select('#packed-bubble-chart')
      .attr('width', size.width)
      .attr('height', size.height)
      .attr('viewbox', `0 0 ${size.width} ${size.height}`);

    // Additional nesting level to prevent jitters while panning. See https://stackoverflow.com/questions/10988445/d3-behavior-zoom-jitters-shakes-jumps-and-bounces-when-dragging
    const svg = svgRoot.append('g').attr('id', 'zoom-container');

    const bubbles = svg
      .append('g')
      .attr('id', 'bubbles')
      .selectAll('circle')
      .data(root.descendants())
      .join('circle')
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y)
      .attr('r', (d) => Math.max(d.r - 1, 0)) // shave off stroke width to prevent clipping
      .attr('fill', (d) => color(d.depth))
      .attr('opacity', (d) => (bubbleDisplayed(d) ? 100 : 0))
      .attr('pointer-events', (d) => (bubbleDisplayed(d) ? 'auto' : 'none'))
      .on('mouseover', function () {
        d3.select(this).attr('stroke', '#000');
      })
      .on('mouseout', function () {
        d3.select(this).attr('stroke', 'none');
      })
      .attr('stroke-width', 1)
      .on('click', (e, d) => zoomAndCenterBubble(d));

    // Add labels to leaf nodes
    const labelDivs = svg
      .append('g')
      .attr('id', 'labels')
      .selectAll('foreignObject')
      .data(root.descendants())
      .join('foreignObject')
      .attr('x', (d) => d.x - d.r)
      .attr('y', (d) => d.y - d.r)
      .attr('width', (d) => d.r * 2)
      .attr('height', (d) => d.r * 2)
      .attr('pointer-events', 'none')
      .attr('display', (d) => (labelDisplayed(d) ? 'auto' : 'none'));

    // TODO: Make naics code a tooltip
    labelDivs
      .append('xhtml:div')
      .attr('class', 'label-div')
      .style('font-size', (d) => `${d.r / 6}px`)
      .text((d) => labels.get(d.data[0])); // make labels click-through
    return svgRoot;
  };

  function zoomAndCenterBubble(b) {
    setSelectedBubble(b);
    console.log('zooming to bubble', b);
    const x = b.x;
    const y = b.y;
    const r = b.r;

    const scale = Math.min(size.width, size.height) / (r * 2);
    const dx = size.width / 2 - x * scale;
    const dy = size.height / 2 - y * scale;

    svgRoot
      .transition()
      .duration(500)
      .call(zoom.transform, d3.zoomIdentity.translate(dx, dy).scale(scale));
  }

  useEffect(() => {
    d3.select('#bubbles')
      .selectAll('circle')
      .transition()
      .duration(500)
      .attr('opacity', (d) => (bubbleDisplayed(d) ? 100 : 0))
      .attr('pointer-events', (d) => (bubbleDisplayed(d) ? 'auto' : 'none'));

    d3.select('#labels')
      .selectAll('foreignObject')
      .transition()
      .duration(250)
      .attr('display', (d) => (labelDisplayed(d) ? 'auto' : 'none'));
  }, [selectedBubble]);

  const svgRoot = useMemo(() => {
    // console.log('rerendering');
    d3.select('#packed-bubble-chart').selectAll('*').remove();
    return renderGraph();
  }, [data, size]);

  const zoom = useMemo(() => {
    if (!svgRoot) return;
    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 50])
      // TODO: smooth zoom even more. See https://observablehq.com/@d3/programmatic-zoom
      .on('zoom', (e) => {
        d3.select('#zoom-container').attr('transform', e.transform);
        // Scale borders by inverse of zoom scale so the stroke width is constant.
        // e.transform.k represents the scale factor k.
        d3.select('#bubbles')
          .selectAll('circle')
          .attr('stroke-width', 1 / e.transform.k);
        d3.select('#labels')
          .selectAll('text')
          .style('font-size', (d) => `${d.r / 6 / e.transform.k}px`);
      });

    svgRoot.call(zoom);
    svgRoot.node().zoom = zoom;
    // .on('wheel.zoom', null);
    return zoom;
  }, [svgRoot]);

  // For react-select
  const selectedEmissionsOptions = [
    {
      label: 'Total emissions',
      value: 'all',
    },
    {
      label: 'Production emissions',
      value: 'base',
    },
    {
      label: 'Margins emissions',
      value: 'margin',
    },
  ];

  // https://github.com/JedWatson/react-select/issues/4201#issuecomment-874098561
  const reactSelectStyle = {
    menu: (base) => ({
      ...base,
      width: 'max-content',
      minWidth: '100%',
      zIndex: 5,
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 9999,
    }),
  };

  const handleReset = () => {
    svgRoot.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
    setSelectedBubble(hierarchyData);
  };
  return (
    <>
      <Select
        options={selectedEmissionsOptions}
        value={selectedEmissionsOptions.label}
        menuPortalTarget={document.body}
        onChange={(e) =>
          setSelectedData({ ...selectedData, selectedEmissions: e.value })
        }
        styles={reactSelectStyle}
        defaultValue={selectedEmissionsOptions[0]}
      />
      <Button
        variant="contained"
        onClick={handleReset}
        style={{
          whiteSpace: 'nowrap',
          minWidth: 'auto',
          textTransform: 'none',
        }}
      >
        Back to root
      </Button>
      <Button
        variant="contained"
        onClick={() => zoomAndCenterBubble(selectedBubble.parent)}
        style={{
          whiteSpace: 'nowrap',
          minWidth: 'auto',
          textTransform: 'none',
        }}
      >
        Go to parent
      </Button>
      <div ref={graphRef} className="main-container">
        <svg id="packed-bubble-chart" className="chart-container" />
      </div>
    </>
  );
}

export default PackedBubbleChart;
