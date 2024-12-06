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
import { GHG_FACTS } from '../../consts';
import SelectedDataContext from '../../stores/SelectedDataContext';

// get x, y, r from selected Bubble. pass as prop.
// get total vs base emission from select. pass as prop.
// TODO: update on resize without rerendering entire chart/resetting zoom/pan. https://stackoverflow.com/questions/39735367/d3-zoom-behavior-when-window-is-resized

const PieChart = ({ ghgdata }) => {
  const { selectedData, setSelectedData } = useContext(SelectedDataContext);
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
    if (isEmpty(ghgdata) || !selectedData.terminalNode) return [];

    const filter =
      selectedData.depth > 0
        ? (d) => d[selectedData.column] === selectedData.naics
        : () => false;
    console.log(
      'filtering on column ',
      selectedData.column,
      ' == ',
      selectedData.naics,
    );

    // Filter data
    const filteredData = ghgdata.filter(filter);

    const emissionsByGHG = filteredData.map((d) => ({
      ghg: d.ghg,
      // Convert to equivalent CO2 amounts, i.e. CO2e units.
      // CO2e = Mass of GHG x GWP. 100-year GWP values from the 2014 IPCC 5th report (AR5) were used.
      total: parseFloat(
        d[selectedData.selectedEmissions] * GHG_FACTS.get(d.ghg).gwp,
      ),
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
  }, [ghgdata, selectedData.naics, selectedData.selectedEmissions]);

  useEffect(() => {
    d3.select(svgRef.current).selectAll('*').remove();
    if (isEmpty(aggregatedData) || size.width === 0 || size.height === 0)
      return;

    const width = size.width;
    const height = size.height;
    const margin = 40;
    const radius = selectedData.pieRadius;

    const svg = d3
      .select(svgRef.current)
      .attr('width', width + 200)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const legendGroup = d3
      .select(svgRef.current)
      .append('g')
      .attr('transform', `translate(${width * 0.82}, ${height * 0.8})`)
      .style('opacity', 0);

    legendGroup
      .transition()
      .delay(500) // Duration of the fade-in effect
      .duration(500)
      .style('opacity', selectedData.terminalNode * 100);
    const color = d3
      .scaleOrdinal()
      .domain(Array.from(new Set(aggregatedData.map((d) => d.ghg).sort())))
      .range(d3.schemeCategory10);

    // pie generator
    const pie = d3
      .pie()
      .value((d) => {
        console.log('slice', d);
        return d.total;
      })
      .sort((a, b) => b.total - a.total);

    const data_ready = pie(aggregatedData);

    // arc generator
    const arc = d3.arc().innerRadius(1).outerRadius(radius);

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

    const sectors = svg
      .selectAll('path')
      .data(data_ready)
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', (d) => color(d.data.ghg))
      .attr('stroke', (d) => color(d.data.ghg))
      .style('stroke-width', '1px')
      .style('pointer-events', 'none')
      .style('opacity', 0);

    // Fade in each slice
    sectors
      .transition()
      .delay(500) // Duration of the fade-in effect
      .duration(500)
      .style('opacity', selectedData.terminalNode * 100);

    sectors.transition().delay(1000).style('pointer-events', 'all');

    sectors
      .on('mouseover', function (event, d) {
        const [x, y] = d3.pointer(event);
        d3.select(this).transition().duration(200).style('opacity', 0.8);
        tooltip.transition().duration(200).style('opacity', 0.9);
        tooltip.html(
          `<div><strong>Emitted Gas:</strong> ${d.data.ghg}
          <br><strong>Percent emissions:</strong> ${(((d.endAngle - d.startAngle) / (2 * Math.PI)) * 100).toFixed(2)}%
          <br><strong>Total emissions:</strong> ${d.data.total.toLocaleString()} kg CO2e/2022 USD` +
            `${d.data.ghg === 'Other gases' ? '' : '<br>Click to examine gas facts in side panel.</div>'}`,
        );
      })
      .on('mousemove', function (event) {
        const [x, y] = d3.pointer(event);
        tooltip
          .style('left', `${x + width / 2 + 15}px`)
          .style('top', `${y + height / 2 + 10}px`);
      })
      .on('mouseout', function () {
        d3.select(this).transition().duration(200).style('opacity', 1);
        tooltip.transition().duration(50).style('opacity', 0);
      })
      .on('click', function (e, d) {
        console.log(d);
        if (!d || !d.data || !d.data.ghg || d.data.ghg === 'Other gases')
          return;
        setSelectedData((prevData) => ({
          ...prevData,
          selectedGas: d.data.ghg,
        }));
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
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 99,
        pointerEvents: 'none',
      }}
    >
      <svg ref={svgRef} />
      <style>{`
        .tooltip {
          position: absolute;
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
