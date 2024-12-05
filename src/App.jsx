import * as d3 from 'd3';
import { useEffect, useState } from 'react';
import './App.css';
import PackedBubbleChart from './components/PackedBubbleChart/PackedBubbleChart';
import StackedBarChart from './components/StackedBarChart/StackedBarChart';
import {
  DATAFILES,
  EMISSIONS_COLUMN_NAMES,
  LABEL_COLUMN_NAMES,
} from './consts';
import SelectedDataContext from './stores/SelectedDataContext';

function App() {
  const [data, setData] = useState({
    allEmissions: null,
    equivEmissions: null,
    labels: null,
  });

  const [selectedData, setSelectedData] = useState({
    naics: '',
    depth: 0,
    label: '',
    selectedEmissions: 'all',
  });

  // TODO: Context/state for selected data
  // TODO: Compute derived data here e.g. emissions by sector/industry/gas
  useEffect(() => {
    const readCSV = async () => {
      const emissionsColMapper = (r) => {
        return {
          naics: r[EMISSIONS_COLUMN_NAMES.NAICS],
          sector: r[EMISSIONS_COLUMN_NAMES.NAICS].slice(0, 2).padEnd(6, '0'),
          subsector: r[EMISSIONS_COLUMN_NAMES.NAICS].slice(0, 3).padEnd(6, '0'),
          indGroup: r[EMISSIONS_COLUMN_NAMES.NAICS].slice(0, 4).padEnd(6, '0'),
          industry: r[EMISSIONS_COLUMN_NAMES.NAICS].slice(0, 5).padEnd(6, '0'),
          title: r[EMISSIONS_COLUMN_NAMES.NAICS_TITLE],
          ghg: r[EMISSIONS_COLUMN_NAMES.GHG],
          unit: r[EMISSIONS_COLUMN_NAMES.UNIT],
          base: +r[EMISSIONS_COLUMN_NAMES.BASE_EMISSIONS],
          margins: +r[EMISSIONS_COLUMN_NAMES.MARGINS_EMISSIONS],
          total: +r[EMISSIONS_COLUMN_NAMES.TOTAL_EMISSIONS],
          useeio: r[EMISSIONS_COLUMN_NAMES.USEEIO],
        };
      };
      const labelsColMapper = (r) => {
        return [
          r[LABEL_COLUMN_NAMES.NAICS].padEnd(6, '0'),
          r[LABEL_COLUMN_NAMES.TITLE],
        ];
      };

      try {
        // Stretch goal: interactivity to toggle between math and portugese datasets
        const PATH_TO_DATA = '../data/';
        const allEmissionsData = await d3.csv(
          PATH_TO_DATA + DATAFILES.ALL_EMISSIONS,
          emissionsColMapper,
        );
        const equivCO2EmissionsData = await d3.csv(
          PATH_TO_DATA + DATAFILES.EQUIV_CO2_EMISSIONS,
          emissionsColMapper,
        );
        const naicsLabels = await d3.csv(
          PATH_TO_DATA + DATAFILES.NAICS_LABELS,
          labelsColMapper,
        );
        setData({
          // TODO: hoist into react context to allow for use in other components
          allEmissions: allEmissionsData,
          equivEmissions: equivCO2EmissionsData,
          naicsLabels: new Map(naicsLabels),
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
      <SelectedDataContext.Provider
        value={{
          selectedData,
          setSelectedData,
        }}
      >
        <div className="root-grid">
          <div className="header">
            <h1>Header ribbon</h1>
          </div>
          <div className="main-grid">
            <PackedBubbleChart
              data={data.equivEmissions}
              labels={data.naicsLabels}
            />
            {/* <PieChart ghgdata={data.allEmissions}/> The chart only shows for 'Soybean Farming using the code' */}
          </div>
          <div className="sidebar-grid">
            <div className="sidebar-item">
              <h2>Gas Emissions by Sector</h2>
            </div>
            <div className="sidebar-item">
              <StackedBarChart data={data.equivEmissions} ghgdata={data.allEmissions} labels={data.naicsLabels}/>
            </div>
            <div className="sidebar-item">Sidebar item 2</div>
          </div>
        </div>
      </SelectedDataContext.Provider>
    </>
  );
}

export default App;
