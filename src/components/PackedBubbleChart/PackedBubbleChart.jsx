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

import {
  DEFAULT_SELECTED_DATA,
  SELECTED_EMISSIONS_DROPDOWN_OPTIONS,
} from '../../consts';
import PieChart from '../PieChart/PieChart';
import './index.css';

// TODO: update on resize without rerendering entire chart/resetting zoom/pan. https://stackoverflow.com/questions/39735367/d3-zoom-behavior-when-window-is-resized
function PackedBubbleChart({ data }) {
  const { equivEmissions: totalData, naicsLabels: labels } = data;

  const [selectedBubble, setSelectedBubble] = useState(null);
  const { selectedData, setSelectedData } = useContext(SelectedDataContext);
  const bubbleDisplayed = (d) => d.depth <= selectedBubble.depth + 1;
  const labelDisplayed = (d) => d.depth === selectedBubble.depth + 1;
  const color = d3
    .scaleLinear()
    .domain([0, 5])
    .range(['hsl(152,80%,80%)', 'hsl(228,30%,40%)']) // TODO: placeholder color scheme. replace as necessary
    .interpolate(d3.interpolateHcl);

  function getNaicsLevel(naics) {
    if (!naics) return;
    const depthToColumnMap = [
      'naics', // 6 full digits, 0 trailing zeroes
      'industry', // 5 full digits, 1 trailing zero
      'indGroup', // etc
      'subsector',
      'sector',
    ];

    // Count trailing zeroes to get NAICS level
    const trailingZeroes = naics.match(/0+$/);
    return depthToColumnMap[trailingZeroes ? trailingZeroes[0].length : 0];
  }

  const hierarchyData = useMemo(() => {
    if (isEmpty(totalData)) return;
    const emissionsBySector = d3.rollup(
      totalData,
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
  }, [totalData]);

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
    const root = hierarchyData
      .copy()
      .each((n) => (n.column = getNaicsLevel(n.data[0])));
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
      .attr('r', (d) => Math.max(d.r, 0)) // shave off stroke width to prevent clipping
      .attr('fill', (d) => color(d.depth))
      .attr('opacity', (d) => (bubbleDisplayed(d) ? 100 : 0))
      .attr('pointer-events', (d) => (bubbleDisplayed(d) ? 'auto' : 'none'));

    bubbles
      .on('mouseover', function (event, d) {
        if (!d?.data[0]) return;
        d3.select(this).attr('stroke', '#000');
        tooltip.transition().duration(200).style('opacity', 0.9);
        tooltip.html(
          `<strong>${d.data[0]} - ${labels.get(d.data[0])}</strong><br>${d.value.toFixed(2)} kg CO2e per 2022 USD purchased`,
        );
      })
      .on('mousemove', function (event, d) {
        if (!d?.data[0]) return;

        const transform = d3.zoomTransform(svg.node());

        // Get the mouse position relative to the SVG
        const [mouseX, mouseY] = d3.pointer(event, svg.node());

        // Adjust the position with the current zoom transform
        const x = transform.applyX(mouseX);
        const y = transform.applyY(mouseY);

        // const [x, y] = d3.pointer(event);
        tooltip
          .style(
            'left',
            `${Math.min(x + 15, size.width - tooltip.node().offsetWidth)}px`,
          )
          .style(
            'top',
            `${Math.min(y + 5, size.height - tooltip.node().offsetHeight)}px`,
          );
      })
      .on('mouseout', function () {
        d3.select(this).attr('stroke', 'none');
        tooltip
          .interrupt() // Prevent tooltip from staying open if pointer exits while mouseon transition is still firing
          .style('opacity', 0);
      })
      .attr('stroke-width', 1.5)
      .on('click', (e, d) => {
        // TODO: disable tooltip if target is pie chart
        handleBubbleClick(e, d);
      });

    // // tooltip
    const tooltip = d3.select('#tooltip');
    //   .append('div')
    //   .attr('id', 'tooltip2');

    // Add labels to leaf nodes
    const labelDivs = svg
      .append('g')
      .attr('id', 'labels')
      .selectAll('foreignObject')
      .data(root.descendants())
      .join('foreignObject')
      .attr('x', (d) => d.x - d.r / Math.sqrt(2))
      .attr('y', (d) => d.y - d.r / Math.sqrt(2))
      .attr('width', (d) => (2 * d.r) / Math.sqrt(2))
      .attr('height', (d) => (2 * d.r) / Math.sqrt(2))
      .attr('pointer-events', 'none')
      .attr('opacity', (d) => (labelDisplayed(d) ? '100%' : '0%'));

    labelDivs
      .append('xhtml:div')
      .attr('class', 'label-div')
      .style('font-size', (d) => `${Math.max(d.r / 6, 1)}px`)
      .text((d) => (d.r / 6 > 1 ? labels.get(d.data[0]) : '...')); // Clamp labels to 1px minimum, move to tooltip
    return svgRoot;
  };

  function handleBubbleClick(e, b) {
    const scale = (Math.min(size.width, size.height) * 0.95) / (b.r * 2);
    const circleHTML = e.currentTarget;
    const pieRadius = circleHTML.getAttribute('r') * scale;
    setSelectedData((prevState) => ({
      ...prevState,
      naics: b.data[0],
      depth: b.depth,
      label: labels.get(b.data[0]),
      terminalNode: !('children' in b),
      column: b.column,
      pieRadius: pieRadius,
    }));
    zoomAndCenterBubble(b);
  }

  function zoomAndCenterBubble(b) {
    if (!b) return;
    setSelectedBubble(b);
    const x = b.x;
    const y = b.y;
    const r = b.r;

    const scale =
      (Math.min(size.width, size.height) * (b.data[0] ? 0.95 : 1)) / (r * 2);
    const dx = size.width / 2 - x * scale;
    const dy = size.height / 2 - y * scale;

    console.log('zooming to bubble', b);

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
      .attr('opacity', (d) => (bubbleDisplayed(d) ? '100%' : '0%'))
      .attr('pointer-events', (d) => (bubbleDisplayed(d) ? 'auto' : 'none'));

    d3.select('#labels')
      .selectAll('foreignObject')
      .transition()
      .duration(250)
      .attr('opacity', (d) => (labelDisplayed(d) ? '100%' : '0%'));
  }, [selectedBubble]);

  const svgRoot = useMemo(() => {
    // console.log('rerendering');
    d3.select('#packed-bubble-chart').selectAll('*').remove();
    return renderGraph();
  }, [totalData, size]);

  const zoom = useMemo(() => {
    if (!svgRoot) return;
    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 150])
      .on('zoom', (e) => {
        d3.select('#zoom-container').attr('transform', e.transform);
        // Scale borders by inverse of zoom scale so the stroke width is constant.
        // e.transform.k represents the scale factor k.
        d3.select('#bubbles')
          .selectAll('circle')
          .attr('stroke-width', 1.5 / e.transform.k);
        d3.select('#labels')
          .selectAll('text')
          .style('font-size', (d) => `${d.r / 6 / e.transform.k}px`);
      });

    svgRoot.call(zoom).on('.zoom', null);
    svgRoot.node().zoom = zoom;
    return zoom;
  }, [svgRoot]);

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

  function handleReset() {
    svgRoot.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
    setSelectedData((prevState) => ({
      ...DEFAULT_SELECTED_DATA,
      selectedEmissions: prevState.selectedEmissions,
    }));
    setSelectedBubble(hierarchyData);
  }

  function handleGoUp() {
    const b = selectedBubble.parent;
    setSelectedData((prevState) => ({
      ...prevState,
      naics: b.data[0],
      depth: b.depth,
      label: labels.get(b.data[0]),
      terminalNode: false,
      column: b.column,
      pieRadius: 0,
    }));

    zoomAndCenterBubble(b);
  }

  return (
    <>
      <Select
        options={SELECTED_EMISSIONS_DROPDOWN_OPTIONS}
        value={SELECTED_EMISSIONS_DROPDOWN_OPTIONS.label}
        menuPortalTarget={document.body}
        onChange={(e) =>
          setSelectedData((prevState) => ({
            ...prevState,
            selectedEmissions: e.value,
          }))
        }
        defaultValue={SELECTED_EMISSIONS_DROPDOWN_OPTIONS[0]}
        styles={reactSelectStyle}
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
        disabled={!selectedBubble?.parent}
        onClick={handleGoUp}
        style={{
          whiteSpace: 'nowrap',
          minWidth: 'auto',
          textTransform: 'none',
        }}
      >
        Go to parent
      </Button>
      <div ref={graphRef} className="main-container">
        <PieChart ghgdata={data.allEmissions} />
        <div id="tooltip"></div>
        <svg id="packed-bubble-chart" className="chart-container" />
      </div>
    </>
  );
}

export default PackedBubbleChart;
