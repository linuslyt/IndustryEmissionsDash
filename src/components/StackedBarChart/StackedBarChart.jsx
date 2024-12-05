import useResizeObserver from '@react-hook/resize-observer';
import * as d3 from 'd3';
import { debounce, isEmpty } from 'lodash';
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import SelectedDataContext from '../../stores/SelectedDataContext.js';

import './StackedBarChart.css';

const StackedBarChart = ({ data }) => {
  // TODO: Make chart dynamic by re-redering on view change to sub-sectors, indgrps, industries and individual gases
  // TODO: Smooth render transition on re-redering
  // Extended TODO: Add tooltip maybe?

  const svgRef = useRef(null);
  const graphRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const { selectedData, _ } = useContext(SelectedDataContext);

  const handleResize = useCallback(
    debounce((entry) => {
      setSize(entry.contentRect);
    }, 100),
    [],
  );

  useResizeObserver(graphRef, handleResize);

  useEffect(() => {
    return () => {
      handleResize.cancel();
    };
  }, [handleResize]);

  const aggregatedData = useMemo(() => {
    if (isEmpty(data)) return [];
    const emissionsBySector = Array.from(
      d3.rollup(
        data,
        (v) => ({
          base: d3.sum(v, (d) => d.base),
          margin: d3.sum(v, (d) => d.margins),
        }),
        (d) => d.sector,
      ),
      ([sector, values]) => ({ sector, ...values }),
    );
    return emissionsBySector;
  }, [data]);

  // Stack series
  const series = useMemo(() => {
    if (isEmpty(aggregatedData)) return [];
    return d3
      .stack()
      .keys(['base', 'margin'])
      .value((d, key) => d[key])(aggregatedData);
  }, [aggregatedData]);

  // Compute chart dimensions based on data and container size
  const width = size.width || 628;
  const height = aggregatedData.length * 15 + 30 + 30;

  // Scales
  const x = useMemo(() => {
    const maxValue = d3.max(series, (layer) => d3.max(layer, (d) => d[1]));
    return d3
      .scaleLinear()
      .domain([0, maxValue || 0])
      .nice()
      .range([100, width - 10]);
  }, [series, width]);

  const y = useMemo(() => {
    return d3
      .scaleBand()
      .domain(
        d3.groupSort(
          aggregatedData,
          (D) => -(D.base + D.margin),
          (d) => d.sector,
        ),
      )
      .range([30, height - 30])
      .padding(0.1);
  }, [aggregatedData, height]);

  const color = useMemo(() => {
    return d3
      .scaleOrdinal()
      .domain(series.map((d) => d.key))
      .range(d3.schemeCategory10.slice(0, series.length))
      .unknown('#ccc');
  }, [series]);

  const formatValue = (x) => (isNaN(x) ? 'N/A' : x.toLocaleString('en'));

  useEffect(() => {
    if (isEmpty(aggregatedData) || size.width === 0) return;

    // Select and clear the SVG
    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto;');

    svg.selectAll('*').remove();

    // Draw the chart
    const chart = svg.append('g');

    chart
      .selectAll('g.layer')
      .data(series)
      .join('g')
      .attr('class', 'layer')
      .attr('fill', (d) => color(d.key))
      .selectAll('rect')
      .data((layer) => layer.map((d) => ({ ...d, key: layer.key })))
      .join('rect')
      .attr('x', (d) => x(d[0]))
      .attr('y', (d) => y(d.data.sector))
      .attr('height', y.bandwidth())
      .attr('width', (d) => x(d[1]) - x(d[0]))
      .append('title')
      .text(
        (d) => `${d.data.sector} ${d.key}\n${formatValue(d.data[d.key])}`, // Tooltip
      );

    // Horizontal axis
    chart
      .append('g')
      .attr('transform', `translate(0,30)`)
      .call(d3.axisTop(x).ticks(width / 100, 's'))
      .call((g) => g.selectAll('.domain').remove());

    // Vertical axis
    chart
      .append('g')
      .attr('transform', `translate(100,0)`)
      .call(d3.axisLeft(y).tickSizeOuter(0))
      .call((g) => g.selectAll('.domain').remove());
  }, [aggregatedData, series, x, y, color, width, height]);

  return (
    <div ref={graphRef} className="bar-chart-container">
      <svg ref={svgRef} style={{ padding: 0, margin: 0 }}></svg>
      <div>Selected area: {selectedData.naics}</div>
      <div>Area title: {selectedData.label}</div>
      <div>
        Hierarchy depth (0 = all industries, 1 = sector, 2 = subsector, etc.):{' '}
        {selectedData.depth}
      </div>
    </div>
  );
};

export default StackedBarChart;
