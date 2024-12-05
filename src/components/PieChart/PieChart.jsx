import React, {
  useRef,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import * as d3 from 'd3';
import useResizeObserver from '@react-hook/resize-observer';
import { debounce, isEmpty } from 'lodash';

const PieChart = ({ ghgdata }) => {
  const svgRef = useRef(null);
  const graphRef = useRef(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  // Handle resize with debounce to optimize performance
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

  // Aggregate and filter data to include only gases with slice angle >= 1 degree
  const aggregatedData = useMemo(() => {
    if (isEmpty(ghgdata)) return [];

    const predefinedNaicsTitle = '111110';

    // Filter data
    const filteredData = ghgdata.filter(
      (d) => d.naics === predefinedNaicsTitle,
    );

    const emissionsByGHG = filteredData.map((d) => ({
      ghg: d.ghg,
      total: parseFloat(d.total),
    }));

    const totalEmissions = d3.sum(emissionsByGHG, (d) => d.total);

    const minProportion = 0.0174533 / (2 * Math.PI);

    // Separate significant gases and others
    const significantGases = emissionsByGHG.filter(
      (d) => d.total / totalEmissions >= minProportion,
    );

    const otherGases = emissionsByGHG.filter(
      (d) => d.total / totalEmissions < minProportion,
    );

    let finalData = [...significantGases];

    if (otherGases.length > 0) {
      const otherTotal = d3.sum(otherGases, (d) => d.total);
      finalData.push({ ghg: 'Other gases', total: otherTotal });
    }

    return finalData;
  }, [ghgdata]);

  useEffect(() => {
    if (isEmpty(aggregatedData) || size.width === 0 || size.height === 0)
      return;

    d3.select(svgRef.current).selectAll('*').remove();

    const width = size.width;
    const height = size.height;
    const margin = 40;
    const radius = Math.min(width, height) / 2 - margin;

    const svg = d3
      .select(svgRef.current)
      .attr('width', width + 200)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${radius + margin}, ${height / 2})`);

    const legendGroup = d3
      .select(svgRef.current)
      .append('g')
      .attr('transform', `translate(${radius * 2 + margin * 2}, ${20})`);

    const color = d3
      .scaleOrdinal()
      .domain(aggregatedData.map((d) => d.ghg))
      .range(d3.schemeCategory10);

    // pie generator
    const pie = d3
      .pie()
      .value((d) => d.total)
      .sort(null);

    const data_ready = pie(aggregatedData);

    // arc generator
    const arc = d3.arc().innerRadius(0).outerRadius(radius);

    // tooltip
    const tooltip = d3
      .select(graphRef.current)
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.7)')
      .style('color', '#fff')
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('pointer-events', 'none');

    svg
      .selectAll('path')
      .data(data_ready)
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', (d) => color(d.data.ghg))
      .attr('stroke', 'white')
      .style('stroke-width', '2px')
      .style('opacity', 1)
      .on('mouseover', function (event, d) {
        d3.select(this).transition().duration(200).style('opacity', 0.8);
        tooltip.transition().duration(200).style('opacity', 0.9);
        tooltip
          .html(
            `<strong>Gas:</strong> ${d.data.ghg}<br><strong>Total:</strong> ${d.data.total.toLocaleString()}`,
          )
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 28}px`);
      })
      .on('mousemove', function (event) {
        tooltip
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 28}px`);
      })
      .on('mouseout', function () {
        d3.select(this).transition().duration(200).style('opacity', 1);
        tooltip.transition().duration(500).style('opacity', 0);
      });

    // legend
    const legendItemSize = 18;
    const legendSpacing = 4;

    aggregatedData.forEach((d, i) => {
      const legendRow = legendGroup
        .append('g')
        .attr(
          'transform',
          `translate(0, ${i * (legendItemSize + legendSpacing)})`,
        );

      // Color box
      legendRow
        .append('rect')
        .attr('width', legendItemSize)
        .attr('height', legendItemSize)
        .attr('fill', color(d.ghg));

      // Text
      legendRow
        .append('text')
        .attr('x', legendItemSize + legendSpacing)
        .attr('y', legendItemSize / 2)
        .attr('dy', '0.35em')
        .text(d.ghg)
        .style('font-size', '14px')
        .attr('text-anchor', 'start');
    });
  }, [aggregatedData, size]);

  return (
    <div
      ref={graphRef}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      <svg ref={svgRef} />
      <style>{`
        .tooltip {
          position: absolute;
          text-align: center;
          padding: 8px;
          font-size: 14px;
          background: rgba(0, 0, 0, 0.7);
          color: #fff;
          border-radius: 4px;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default PieChart;
