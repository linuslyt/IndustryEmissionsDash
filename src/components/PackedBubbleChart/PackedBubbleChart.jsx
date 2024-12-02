import useResizeObserver from '@react-hook/resize-observer';
import * as d3 from 'd3';
import { debounce, isEmpty } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './index.css';

function PackedBubbleChart({ data }) {
  // TODO: Prototype packed bubble chart.
  //       See https://observablehq.com/@d3/pack/2 and d3.pack(), d3.hierarchy().
  const FONT_SIZE_CUTOFF = 16;
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
    console.log(root);
    const svgRoot = d3
      .select('#packed-bubble-chart')
      .attr('width', size.width)
      .attr('height', size.height)
      .attr('viewbox', `0 0 ${size.width} ${size.height}`);

    // Additional nesting level to prevent jitters while panning. See https://stackoverflow.com/questions/10988445/d3-behavior-zoom-jitters-shakes-jumps-and-bounces-when-dragging
    const svg = svgRoot.append('g').attr('id', 'zoom-container');

    svg
      .selectAll('circle')
      .data(root.descendants())
      .join('circle')
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y)
      .attr('r', (d) => Math.max(d.r - 1, 0)) // shave off stroke width to prevent clipping
      .attr('fill', (d) =>
        // TODO: color nodes by NAICS level
        d.data[0] ? (d.children ? '#69b3a2' : '#ffcc00') : 'ghostwhite',
      )
      .attr('stroke', (d) => (d.data[0] ? 'black' : 'ghostwhite'))
      .attr('stroke-width', 1)
      .on('click', (e, d) => zoomAndCenterBubble(d));

    // Add labels to leaf nodes
    svg
      .selectAll('text')
      .data(root.descendants())
      .join('text')
      .attr('x', (d) => d.x)
      .attr('y', (d) => d.y)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.3em')
      .text((d) => d.data[0]) // TODO: change to sector label. Get mappings from .xlsx in /data
      .style('font-size', (d) => d.r / 4)
      .style('display', (d) => (d.r / 4 > FONT_SIZE_CUTOFF ? 'block' : 'none'))
      .style('display'); // Scale font size based on radius
    // TODO: add selected bubble state + hide labels where depth < selectedBubble.depth

    return svgRoot;
  };

  function zoomAndCenterBubble(b) {
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
      .on('zoom', (e) => {
        d3.select('#zoom-container').attr('transform', e.transform);
        // Scale borders by inverse of zoom scale so the stroke width is constant.
        // e.transform.k represents the scale factor k.
        d3.selectAll('circle').style('stroke-width', 1 / e.transform.k);
        d3.selectAll('text')
          .transition()
          .duration(1000)
          .style('display', (d) =>
            (e.transform.k * d.r) / 4 > FONT_SIZE_CUTOFF ? 'block' : 'none',
          );
      });

    svgRoot.call(zoom);
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
