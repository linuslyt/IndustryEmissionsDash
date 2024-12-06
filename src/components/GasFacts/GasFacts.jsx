import React from 'react';
import './GasFacts.css';

// TODO: collect gas facts

const GasFacts = () => {
  return (
    <div className="card-container">
      <h1 className="card-title">Carbon Dioxide</h1>
      <p className="card-subtitle">Serves the baseline GWP of 1</p>
      <div className="diagram-section">
        <div className="diagram-center">
          <img src="images\co2.png" alt="Gas Icon" />
        </div>
      </div>
      <div className="info-section">
        <div className="info-box">
          <h2>Key Metrics</h2>
          <div className="info-row">
            <div className="info-label">Global Warming Potential</div>
            <div className="info-value">1.7</div>
          </div>
          <div className="info-row">
            <div className="info-label">Lifetime in atmosphere</div>
            <div className="info-value">1.7</div>
          </div>
          <div className="info-row">
            <div className="info-label">Atmospheric Concentration</div>
            <div className="info-value">1.7</div>
          </div>
        </div>

        <div className="info-box">
          <h2>Useful info</h2>
          <div className="info-row">
            <div className="info-label">Common sources</div>
            <div className="info-value">Agriculture</div>
          </div>
          <div className="info-row">
            <div className="info-label">Impacts</div>
            <div className="info-value">
              Global Warming, Deforestation, Ocean Activities
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GasFacts;
