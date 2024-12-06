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

const StackedBarChart = ({ data, ghgdata, labels }) => {
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

  // TODO: get from selectedData.columns
  // Map depth to the corresponding field names
  const map = {
    0: 'sector',
    1: 'subsector',
    2: 'indGroup',
    3: 'industry',
  };

  const level = map[selectedData.depth];
  const upperlevel =
    selectedData.depth > 0 ? map[selectedData.depth - 1] : null;

  const modifiedData = useMemo(() => {
    return selectedData.depth === 4 ? ghgdata : data;
  }, [selectedData.depth, ghgdata, data]);

  const filteredData = useMemo(() => {
    if (selectedData.naics == null || upperlevel == null) {
      return modifiedData;
    } else {
      return modifiedData.filter((d) => d[upperlevel] === selectedData.naics);
    }
  }, [modifiedData, selectedData.naics, upperlevel]);

  const aggregatedData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return [];

    if (selectedData.depth === 4) {
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
      const finalData = [...top4Ghgs];

      if (otherGhgs.length > 0) {
        finalData.push({
          ghg: 'Other gases',
          base: otherGhgsSum.base,
          margin: otherGhgsSum.margin,
        });
      }

      // Map to required structure with labels
      return finalData.map((d) => ({
        level: d.ghg,
        label: d.ghg,
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
            label: labels.get(v[0][level]) || 'Unknown GHG',
          }),
          (d) => d[level],
        ),
        ([levelKey, values]) => ({
          level: levelKey,
          label: values.label,
          base: values.base,
          margin: values.margin,
        }),
      );

      // Sort the aggregated data in descending order of total emissions
      const sortedAggregatedData = emissionsByLevel.sort(
        (a, b) => b.base + b.margin - (a.base + a.margin),
      );

      return sortedAggregatedData;
    }
  }, [filteredData, level, selectedData.depth, labels]);

  // Stack series
  const series = useMemo(() => {
    if (isEmpty(aggregatedData)) return [];

    let keys = [];
    if (selectedData.selectedEmissions === 'base') {
      keys = ['base'];
    } else if (selectedData.selectedEmissions === 'margin') {
      keys = ['margin'];
    } else {
      keys = ['margin', 'base']; // note: the reverse of this is stacking improperly
    }

    return d3
      .stack()
      .keys(keys)
      .order(d3.stackOrderNone)
      .offset(d3.stackOffsetNone)(aggregatedData);
  }, [aggregatedData, selectedData.selectedEmissions]);

  // Compute chart dimensions based on data and container size
  const width = size.width || 628;
  const height = aggregatedData.length * 13 + 30 + 30;

  // Scales
  const x = useMemo(() => {
    const maxValue = d3.max(series, (layer) => d3.max(layer, (d) => d[1]));
    return d3
      .scaleLinear()
      .domain([0, maxValue || 0])
      .nice()
      .range([120, width - 10]);
  }, [series, width]);

  const y = useMemo(() => {
    return d3
      .scaleBand()
      .domain(aggregatedData.map((d) => d.label))
      .range([30, height - 30])
      .padding(0.2);
  }, [aggregatedData, height]);

  const color = useMemo(() => {
    return d3
      .scaleOrdinal()
      .domain(['base', 'margin'])
      .range(['#1f77b4', '#ff7f0e']) // Specific colors for 'base' and 'margin'
      .unknown('#ccc');
  }, []);

  const formatValue = (x) => (isNaN(x) ? 'N/A' : x.toLocaleString('en'));

  useEffect(() => {
    if (isEmpty(aggregatedData) || size.width === 0) return;

    // Clear the SVG
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg
      .attr('width', width)
      .attr('height', height + 20)
      .attr('viewBox', [0, -40, width, height])
      .attr('style', 'height: auto;');

    // Draw the chart
    const chart = svg.append('g');

    // Draw the bars
    chart
      .selectAll('g.layer')
      .data(series)
      .join('g')
      .attr('class', 'layer')
      .attr('fill', (d) => color(d.key))
      .selectAll('rect')
      .data((d) => d)
      .join('rect')
      .attr('x', (d) => x(d[0]))
      .attr('y', (d) => y(d.data.label))
      .attr('height', y.bandwidth())
      .attr('width', (d) => x(d[1]) - x(d[0]))
      .append('title')
      .text((d) => {
        const total = formatValue(d.data.base + d.data.margin);
        const base = d.data.base.toFixed(3); // Round base
        const margin = d.data.margin.toFixed(3); // Round margin
        return `${d.data.label}\nMargin: ${margin}\nBase: ${base}\nTotal: ${total}`;
      });

    // Horizontal axis
    chart
      .append('g')
      .attr('transform', `translate(0,30)`)
      .call(d3.axisTop(x).ticks(width / 100, 's'))
      .call((g) => g.selectAll('.domain').remove());

    // Vertical axis
    const yAxis = chart
      .append('g')
      .attr('transform', `translate(${x.range()[0]},0)`)
      .call(d3.axisLeft(y).tickSizeOuter(0))
      .call((g) => g.selectAll('.domain').remove());

    yAxis
      .selectAll('text')
      .text((d) => {
        // truncate label to avoid overflow. Add tooltip for full title.
        const maxLength = 18;
        const label = d.toString();
        return label.length > maxLength
          ? `${label.slice(0, maxLength)}…`
          : label;
      })
      .append('title')
      .text((d) => d);

    chart
      .append('text')
      .attr('x', size.width / 2 + 40)
      .attr('y', 0)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .text((d) => {
        const allGHGlabel = 'kg CO2e/2022 USD, purchaser price';
        const specificGHGlabel = 'kg/2022 USD, purchaser price';

        return selectedData.depth === 4 ? specificGHGlabel : allGHGlabel;
      });

    // Dynamic Legend
    const activeKeys = series.length > 0 ? series.map((s) => s.key) : [];

    const legendItemSize = 18;
    const legendSpacing = 4;

    const legendGroup = chart
      .append('g')
      .attr('transform', `translate(${width - 370}, -40)`); // adjust as needed

    activeKeys.forEach((key, i) => {
      const legendRow = legendGroup
        .append('g')
        .attr('transform', `translate(${i * 150},0)`);

      // Color box
      legendRow
        .append('rect')
        .attr('width', legendItemSize)
        .attr('height', legendItemSize)
        .attr('fill', color(key));

      // Legend text
      const labelText = key === 'base' ? 'Base Emissions' : 'Margin Emissions';

      legendRow
        .append('text')
        .attr('x', legendItemSize + legendSpacing)
        .attr('y', legendItemSize / 2)
        .attr('dy', '0.35em')
        .text(labelText)
        .style('font-size', '12px')
        .attr('text-anchor', 'start');
    });
  }, [aggregatedData, series, x, y, color, width, height, size.width]);

  return (
    <div ref={graphRef} className="bar-chart-container">
      {isEmpty(aggregatedData) ? (
        <div>No data available</div>
      ) : (
        <svg ref={svgRef}></svg>
      )}
    </div>
  );
};

export default StackedBarChart;
