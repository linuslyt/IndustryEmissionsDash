import React, { useContext } from 'react';
import Select from 'react-select';
import { GHG_FACTS, GHGS, REACT_SELECT_STYLE } from '../../consts';
import SelectedDataContext from '../../stores/SelectedDataContext';
import './GasFacts.css';

const GasFacts = () => {
  const ghgOptions = GHGS.map((d) => ({ label: d, value: d }));
  const { selectedData, setSelectedData } = useContext(SelectedDataContext);
  const ghg = GHG_FACTS.get(selectedData.selectedGas);

  return (
    <div className="card-container">
      <div className="info-section">
        <div className="select-header">
          {/* TODO: maintain scroll position on dropdown open/close */}
          <Select
            options={ghgOptions}
            value={{
              label: selectedData.selectedGas,
              value: selectedData.selectedGas,
            }}
            menuPortalTarget={document.body}
            onChange={(e) =>
              setSelectedData((prevState) => ({
                ...prevState,
                selectedGas: e.value,
              }))
            }
            defaultValue={ghgOptions[0]}
            styles={REACT_SELECT_STYLE}
          />
        </div>
        <div className="diagram-section">
          <div className="diagram-center">
            <img src={ghg.image} alt={`${ghg.iupacName} structure`} />
          </div>
        </div>
        <p className="card-subtitle">{ghg.blurb}</p>
      </div>

      <div className="info-section">
        <div className="info-box">
          <h2>Key Facts</h2>
          <div className="info-row">
            <div className="info-label">Preferred IUPAC name</div>
            <div className="info-value">{ghg.iupacName}</div>
          </div>
          <div className="info-row">
            <div className="info-label">Chemical formula</div>
            <div className="info-value">{ghg.chemFormula}</div>
          </div>
          <div className="info-row">
            <div className="info-label">Global Warming Potential</div>
            <div className="info-value">{ghg.gwp}</div>
          </div>
          <div className="info-row">
            <div className="info-label">Atmospheric lifetime</div>
            <div className="info-value">{ghg.lifetime}</div>
          </div>
          <div className="info-row">
            <div className="info-label">Atmospheric Concentration</div>
            <div className="info-value">{ghg.conc}</div>
          </div>
          <div className="info-row">
            <div className="info-label">Common sources</div>
            <div className="info-value">{ghg.sources.join(', ')}</div>
          </div>
          <div className="info-row">
            <div className="info-label">Impacts</div>
            <div className="info-value">{ghg.impacts.join(', ')}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GasFacts;
