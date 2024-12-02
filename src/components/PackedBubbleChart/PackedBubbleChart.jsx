import useResizeObserver from '@react-hook/resize-observer';
import * as d3 from 'd3';
import { debounce, isEmpty } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './index.css';

// TODO: add buttons for return to root/recenter at selected node in corner
// TODO: add hover highlight/drop shadow to border

function PackedBubbleChart({ data }) {
  const [selectedBubble, setSelectedBubble] = useState(root);
  const bubbleDisplayed = (d) => d.depth <= selectedBubble.depth + 1;
  const labelDisplayed = (d) => d.depth === selectedBubble.depth + 1;
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

    svg
      .append('g')
      .attr('id', 'bubbles')
      .selectAll('circle')
      .data(root.descendants())
      .join('circle')
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y)
      .attr('r', (d) => Math.max(d.r - 1, 0)) // shave off stroke width to prevent clipping
      .attr('fill', (d) =>
        // TODO: color nodes by depth. If no children set opacity to 0 and display pie chart instead.
        d.data[0] ? (d.children ? '#69b3a2' : '#ffcc00') : 'ghostwhite',
      )
      .attr('opacity', (d) => (bubbleDisplayed(d) ? 100 : 0))
      .attr('pointer-events', (d) => (bubbleDisplayed(d) ? 'auto' : 'none'))
      .attr('stroke', (d) => (d.data[0] ? 'black' : 'ghostwhite'))
      .attr('stroke-width', 1)
      .on('click', (e, d) => zoomAndCenterBubble(d));

    // Add labels to leaf nodes
    svg
      .append('g')
      .attr('id', 'bubble-labels')
      .selectAll('text')
      .data(root.descendants())
      .join('text')
      .attr('x', (d) => d.x)
      .attr('y', (d) => d.y)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.3em')
      .text((d) => d.data[0]) // TODO: change to sector label. Get mappings from .xlsx in /data. Make it a tooltip when font size is too small.
      .attr('font-size', (d) => d.r / 4)
      .attr('opacity', (d) => (labelDisplayed(d) ? 100 : 0))
      .attr('pointer-events', 'none'); // make labels click-through
    return svgRoot;
  };

  function zoomAndCenterBubble(b) {
    setSelectedBubble(b);
    // console.log('zooming to bubble', b);
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

    d3.select('#bubble-labels')
      .selectAll('text')
      .transition()
      .duration(250)
      .attr('opacity', (d) => (labelDisplayed(d) ? 100 : 0));
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
      });

    svgRoot.call(zoom);
    // .on('wheel.zoom', null);
    return zoom;
  }, [svgRoot]);

  return (
    <>
      <div ref={graphRef} className="main-container">
        <svg id="packed-bubble-chart" className="chart-container" />
      </div>
    </>
  );
}

export default PackedBubbleChart;
