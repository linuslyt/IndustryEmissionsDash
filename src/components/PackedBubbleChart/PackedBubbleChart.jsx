import useResizeObserver from '@react-hook/resize-observer';
import * as d3 from 'd3';
import { debounce, isEmpty } from 'lodash';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './index.css';

function PackedBubbleChart({ data }) {
  // TODO: Prototype packed bubble chart.
  //       See https://observablehq.com/@d3/pack/2 and d3.pack(), d3.hierarchy().
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

  useEffect(() => {
    // console.log('rerendering');
    d3.select('#packed-bubble-chart').selectAll('*').remove();
    renderGraph();
  }, [data, size]);

  const renderGraph = () => {
    if (!hierarchyData) return;
    if (size.width === 0) return;
    const pack = d3.pack().size([size.width, size.height]).padding(10);
    const root = hierarchyData.copy();
    pack(root);
    // console.log(size.width, size.height);
    console.log(root);
    const svg = d3
      .select('#packed-bubble-chart')
      .attr('width', size.width)
      .attr('height', size.height)
      .attr('viewbox', `0 0 ${size.width} ${size.height}`);

    svg
      .selectAll('circle')
      .data(root.descendants())
      .join('circle')
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y)
      .attr('r', (d) => Math.max(d.r - 1, 0)) // shave off stroke width to prevent clipping
      .attr('fill', (d) =>
        // TODO: color nodes by NAICS level
        d.data[0] ? (d.children ? '#69b3a2' : '#ffcc00') : 'none',
      )
      .attr('stroke', (d) => (d.data[0] ? 'black' : 'none'))
      .attr('stroke-width', 1);

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
      .style('font-size', (d) => d.r / 4); // Scale font size based on radius
  };

  return (
    <>
      <div ref={graphRef} className="main-container">
        <svg id="packed-bubble-chart" className="chart-container" />
      </div>
    </>
  );
}

export default PackedBubbleChart;
