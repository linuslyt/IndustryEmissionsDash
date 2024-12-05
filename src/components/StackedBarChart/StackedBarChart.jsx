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

const StackedBarChart = ({ data, ghgdata }) => {
  const svgRef = useRef(null);
  const graphRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const { selectedData } = useContext(SelectedDataContext);

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

  const map = {
    0: 'sector',
    1: 'subsector',
    2: 'indGroup',
    3: 'industry',
  };

  const level = map[selectedData.depth];
  const upperlevel =
    selectedData.depth > 0 ? map[selectedData.depth - 1] : null;

  // Use useMemo to make modifiedData responsive to changes in selectedData
  const modifiedData = useMemo(() => {
    return selectedData.depth === 4 ? ghgdata : data;
  }, [selectedData.depth, ghgdata, data]);

  const filteredData = useMemo(() => {
    if (selectedData.naics == null || upperlevel == null) {
      return modifiedData;
    } else {
      return modifiedData.filter(
        (d) => d[upperlevel] === selectedData.naics,
      );
    }
  }, [modifiedData, selectedData.naics, upperlevel]);

  const aggregatedData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];

    if (selectedData.depth === 4) {
      // Aggregate data per GHG
      const emissionsByGhg = Array.from(
        d3.rollup(
          filteredData,
          (v) => ({
            base: d3.sum(v, (d) => d.base),
            margin: d3.sum(v, (d) => d.margins),
          }),
          (d) => d.ghg,
        ),
        ([ghgKey, values]) => ({ ghg: ghgKey, ...values }),
      );

      // Sort GHGs by total emissions (base + margin) in descending order
      const sortedEmissions = emissionsByGhg.sort(
        (a, b) => b.base + b.margin - (a.base + a.margin),
      );

      // Get top 4 GHGs
      const top4Ghgs = sortedEmissions.slice(0, 4);

      // Sum the rest into 'Other gases'
      const otherGhgs = sortedEmissions.slice(4);

      const otherGhgsSum = otherGhgs.reduce(
        (acc, curr) => ({
          base: acc.base + curr.base,
          margin: acc.margin + curr.margin,
        }),
        { base: 0, margin: 0 },
      );

      // Build the final array
      const finalData = [...top4Ghgs];

      if (otherGhgs.length > 0) {
        finalData.push({
          ghg: 'Other gases',
          base: otherGhgsSum.base,
          margin: otherGhgsSum.margin,
        });
      }

      // Map to required structure
      return finalData.map((d) => ({
        level: d.ghg,
        base: d.base,
        margin: d.margin,
      }));
    } else {
      const emissionsByLevel = Array.from(
        d3.rollup(
          filteredData,
          (v) => ({
            base: d3.sum(v, (d) => d.base),
            margin: d3.sum(v, (d) => d.margins),
          }),
          (d) => d[level],
        ),
        ([levelKey, values]) => ({ level: levelKey, ...values }),
      );
      return emissionsByLevel;
    }
  }, [filteredData, level, selectedData.depth]);

  // Stack series
  const series = useMemo(() => {
    if (isEmpty(aggregatedData)) return [];

    // Determine the keys based on selectedEmissions
    let keys = [];
    if (selectedData.selectedEmissions === 'base') {
      keys = ['base'];
    } else if (selectedData.selectedEmissions === 'margin') {
      keys = ['margin'];
    } else {
      keys = ['base', 'margin'];
    }

    return d3
      .stack()
      .keys(keys)
      .value((d, key) => d[key])(aggregatedData);
  }, [aggregatedData, selectedData.selectedEmissions]);

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
      .domain(aggregatedData.map((d) => d.level))
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

  const formatValue = (x) =>
    isNaN(x) ? 'N/A' : x.toLocaleString('en');

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
      .attr('y', (d) => y(d.data.level))
      .attr('height', y.bandwidth())
      .attr('width', (d) => x(d[1]) - x(d[0]))
      .append('title')
      .text(
        (d) =>
          `${d.data.level} ${d.key}\n${formatValue(d.data[d.key])}`,
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
  }, [
    aggregatedData,
    series,
    x,
    y,
    color,
    width,
    height,
    size.width,
  ]);

  return (
    <div ref={graphRef} className="bar-chart-container">
      {isEmpty(aggregatedData) ? (
        <div>No data available</div>
      ) : (
        <svg ref={svgRef} style={{ padding: 0, margin: 0 }}></svg>
      )}
      <div>Selected area: {selectedData.naics}</div>
      <div>Area title: {selectedData.label}</div>
      <div>
        Hierarchy depth (0 = all industries, 1 = sector, 2 = subsector,
        etc.): {selectedData.depth}
      </div>
      <div>
        Data to display ('margin', 'base', 'all'):{' '}
        {selectedData.selectedEmissions}
      </div>
    </div>
  );
};

export default StackedBarChart;
