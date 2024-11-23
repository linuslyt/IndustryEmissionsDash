import * as d3 from 'd3';
import { useEffect, useState } from 'react';
import './App.css';
import PackedBubbleChart from './components/PackedBubbleChart/PackedBubbleChart';
import { COLUMN_NAMES, DATAFILES } from './consts';

function App() {
  const [data, setData] = useState({
    allEmissions: null,
    equivEmissions: null,
  });

  // TODO: Context/state for selected data
  // TODO: Compute derived data here e.g. emissions by sector/industry/gas
  useEffect(() => {
    const readCSV = async () => {
      const colMapper = (r) => {
        return {
          naics: r[COLUMN_NAMES.NAICS],
          sector: r[COLUMN_NAMES.NAICS].slice(0, 2).padEnd(6, '0'),
          subsector: r[COLUMN_NAMES.NAICS].slice(0, 3).padEnd(6, '0'),
          indGroup: r[COLUMN_NAMES.NAICS].slice(0, 4).padEnd(6, '0'),
          industry: r[COLUMN_NAMES.NAICS].slice(0, 5).padEnd(6, '0'),
          title: r[COLUMN_NAMES.NAICS_TITLE],
          ghg: r[COLUMN_NAMES.GHG],
          unit: r[COLUMN_NAMES.UNIT],
          base: +r[COLUMN_NAMES.BASE_EMISSIONS],
          margins: +r[COLUMN_NAMES.MARGINS_EMISSIONS],
          total: +r[COLUMN_NAMES.TOTAL_EMISSIONS],
          useeio: r[COLUMN_NAMES.USEEIO],
        };
      };

      try {
        // Stretch goal: interactivity to toggle between math and portugese datasets
        const PATH_TO_DATA = '../data/';
        const allEmissionsData = await d3.csv(
          PATH_TO_DATA + DATAFILES.ALL_EMISSIONS,
          colMapper,
        );
        const equivCO2EmissionsData = await d3.csv(
          PATH_TO_DATA + DATAFILES.EQUIV_CO2_EMISSIONS,
          colMapper,
        );
        setData({
          allEmissions: allEmissionsData,
          equivEmissions: equivCO2EmissionsData,
        });
      } catch (error) {
        console.error('Error loading CSV:', error);
      }
    };
    readCSV();
  }, []);

  useEffect(() => {
    // console.log(
    //   `Loaded ${data.allEmissions?.length || 0} allEmissions rows and ${data.equivEmissions?.length || 0} equivEmissions rows.`,
    // );
    // data.allEmissions && console.log(data);
  }, [data]);

  return (
    <>
      <div className="root-grid">
        <div className="header">
          <h1>Header ribbon</h1>
        </div>
        <div className="main-grid">
          <PackedBubbleChart data={data.equivEmissions} />
        </div>
        <div className="sidebar-grid">
          <div className="sidebar-item">
            <h2>Sidebar header</h2>
          </div>
          <div className="sidebar-item">Sidebar item 1</div>
          <div className="sidebar-item">Sidebar item 2</div>
          <div className="sidebar-item">Sidebar item 3</div>
        </div>
      </div>
    </>
  );
}

export default App;
