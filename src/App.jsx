import * as d3 from 'd3';
import { useEffect, useState } from 'react';
import './App.css';
import GasFacts from './components/GasFacts/GasFacts';
import PackedBubbleChart from './components/PackedBubbleChart/PackedBubbleChart';
import StackedBarChart from './components/StackedBarChart/StackedBarChart';
import {
  COLUMN_TO_CHART_LABEL,
  DATAFILES,
  DEFAULT_SELECTED_DATA,
  EMISSIONS_COLUMN_NAMES,
  GHG_FACTS,
  LABEL_COLUMN_NAMES,
} from './consts';
import SelectedDataContext from './stores/SelectedDataContext';

function App() {
  const [data, setData] = useState({
    allEmissions: null,
    equivEmissions: null,
    labels: null,
  });

  const [selectedData, setSelectedData] = useState(DEFAULT_SELECTED_DATA);

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
        console.log(GHG_FACTS);
        setData({
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
            2022 Supply Chain Emissions by NAICS-6 classification
          </div>
          <div className="main-grid">
            <PackedBubbleChart data={data} />
            {/* <PieChart ghgdata={data.allEmissions} /> The chart only shows for 'Soybean Farming using the code' */}
          </div>
          <div className="sidebar-card">
            <div className="sidebar-grid">
              {/* <div className="sidebar-item">Test content</div> */}
              <div className="sidebar-heading"></div>
              <div className="sidebar-item" id="stacked-chart">
                <h3>
                  {selectedData.column
                    ? `[${selectedData.naics}] ${selectedData.label} Emissions by ${selectedData.terminalNode ? 'Gas' : COLUMN_TO_CHART_LABEL.get(selectedData.column)}`
                    : `Total Emissions by Sector`}
                </h3>
                <StackedBarChart
                  data={data.equivEmissions}
                  ghgdata={data.allEmissions}
                  labels={data.naicsLabels}
                />
              </div>
              <div id="gas-facts">
                <GasFacts />
              </div>
            </div>
          </div>
        </div>
      </SelectedDataContext.Provider>
    </>
  );
}

export default App;
