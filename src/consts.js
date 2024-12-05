export const DATAFILES = {
  ALL_EMISSIONS: 'SupplyChainGHGEmissionFactors_v1.3.0_NAICS_byGHG_USD2022.csv',
  EQUIV_CO2_EMISSIONS:
    'SupplyChainGHGEmissionFactors_v1.3.0_NAICS_CO2e_USD2022.csv',
  NAICS_LABELS: '2-6 digit_2017_Codes.csv',
};

export const EMISSIONS_COLUMN_NAMES = {
  NAICS: '2017 NAICS Code',
  NAICS_TITLE: '2017 NAICS Title',
  GHG: 'GHG',
  UNIT: 'Unit',
  BASE_EMISSIONS: 'Supply Chain Emission Factors without Margins',
  MARGINS_EMISSIONS: 'Margins of Supply Chain Emission Factors',
  TOTAL_EMISSIONS: 'Supply Chain Emission Factors with Margins',
  USEEIO: 'Reference USEEIO Code',
};

export const LABEL_COLUMN_NAMES = {
  NAICS: '2017 NAICS US Code',
  TITLE: '2017 NAICS US Title',
};

// For react-select
export const SELECTED_EMISSIONS_DROPDOWN_OPTIONS = [
  {
    label: 'Total emissions',
    value: 'total',
  },
  {
    label: 'Production emissions',
    value: 'base',
  },
  {
    label: 'Margins emissions',
    value: 'margin',
  },
];

export const DEFAULT_SELECTED_DATA = {
  naics: '',
  depth: 0,
  label: '',
  terminalNode: false,
  column: 'sector',
  pieRadius: 0,
  selectedEmissions: 'total',
};
