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
// https://github.com/JedWatson/react-select/issues/4201#issuecomment-874098561
export const REACT_SELECT_STYLE = {
  menu: (base) => ({
    ...base,
    width: 'max-content',
    minWidth: '100%',
    zIndex: 5,
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 9999,
  }),
};

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
    value: 'margins',
  },
];

export const DEFAULT_SELECTED_DATA = {
  naics: '',
  depth: 0,
  label: '',
  terminalNode: false,
  column: '',
  pieRadius: 0,
  selectedEmissions: 'total',
  selectedGas: 'Carbon dioxide',
};

export const GHGS = [
  'Carbon dioxide',
  'HFC-23',
  'HFC-236fa',
  'Carbon tetrafluoride',
  'HFC-32',
  'Hexafluoroethane',
  'HFCs and PFCs, unspecified',
  'HFC-125',
  'Methane',
  'HFC-134a',
  'Nitrogen trifluoride',
  'HFC-143a',
  'Nitrous oxide',
  'Perfluorobutane',
  'Perfluorocyclobutane',
  'Perfluorohexane',
  'Perfluoropropane',
  'Sulfur hexafluoride',
];

export const GHG_FACTS = new Map([
  [
    'HFC-23',
    {
      iupacName: 'Trifluoromethane',
      chemFormula: 'CHF3',
      gwp: 12400,
      lifetime: '222 years',
      conc: 'Trace',
      sources: ['refrigeration', 'air conditioning'],
      impacts: ['global warming', 'ozone depletion'],
      image: 'images/chf3.png',
      blurb: 'HFC-23 is a potent greenhouse gas used as a refrigerant.',
    },
  ],
  [
    'Carbon dioxide',
    {
      iupacName: 'Carbon dioxide',
      chemFormula: 'CO2',
      gwp: 1,
      lifetime: 'variable',
      conc: '~410 ppm',
      sources: ['fossil fuels', 'deforestation', 'cement production'],
      impacts: ['global warming', 'ocean acidification'],
      image: 'images/co2.png',
      blurb:
        'Carbon dioxide is the most prevalent greenhouse gas emitted by human activities.',
    },
  ],
  [
    'HFC-236fa',
    {
      iupacName: '1,1,1,3,3,3-Hexafluoropropane',
      chemFormula: 'C3H2F6',
      gwp: 8060,
      lifetime: '242 years',
      conc: 'Trace',
      sources: ['fire suppression systems', 'refrigerants'],
      impacts: ['global warming'],
      image: 'images/c3h2f6.png',
      blurb:
        'HFC-236fa is used primarily in fire suppression and refrigeration.',
    },
  ],
  [
    'Carbon tetrafluoride',
    {
      iupacName: 'Tetrafluoromethane',
      chemFormula: 'CF4',
      gwp: 6630,
      lifetime: '50,000 years',
      conc: 'Trace',
      sources: ['semiconductor industry'],
      impacts: ['global warming', 'long-term atmospheric persistence'],
      image: 'images/cf4.png',
      blurb: 'Carbon tetrafluoride is an extremely long-lived greenhouse gas.',
    },
  ],
  [
    'HFC-32',
    {
      iupacName: 'Difluoromethane',
      chemFormula: 'CH2F2',
      gwp: 677,
      lifetime: '4.9 years',
      conc: 'Trace',
      sources: ['refrigeration'],
      impacts: ['global warming'],
      image: 'images/ch2f2.png',
      blurb: 'HFC-32 is commonly used in air conditioning systems.',
    },
  ],
  [
    'Hexafluoroethane',
    {
      iupacName: 'Hexafluoroethane',
      chemFormula: 'C2F6',
      gwp: 11100,
      lifetime: '10,000 years',
      conc: 'Trace',
      sources: ['aluminum production', 'semiconductors'],
      impacts: ['global warming', 'long-term atmospheric persistence'],
      image: 'images/c2f6.png',
      blurb:
        'Hexafluoroethane is a potent greenhouse gas with a very long atmospheric lifetime.',
    },
  ],
  [
    'HFCs and PFCs, unspecified',
    {
      iupacName: 'Unspecified Hydrofluorocarbons and Perfluorocarbons',
      chemFormula: 'varies',
      gwp: 'varies',
      lifetime: 'varies',
      conc: 'Trace',
      sources: ['industrial processes'],
      impacts: ['global warming'],
      image: 'images/hfc.png',
      blurb:
        'HFCs and PFCs are greenhouse gases used in various industrial applications.',
    },
  ],
  [
    'HFC-125',
    {
      iupacName: 'Pentafluoroethane',
      chemFormula: 'C2HF5',
      gwp: 3170,
      lifetime: '29 years',
      conc: 'Trace',
      sources: ['refrigerants'],
      impacts: ['global warming'],
      image: 'images/c2hf5.png',
      blurb: 'HFC-125 is used in refrigeration systems and air conditioning.',
    },
  ],
  [
    'Methane',
    {
      iupacName: 'Methane',
      chemFormula: 'CH4',
      gwp: 28,
      lifetime: '12 years',
      conc: '~1.9 ppm',
      sources: ['agriculture', 'landfills', 'natural gas leaks'],
      impacts: ['global warming', 'ozone formation'],
      image: 'images/ch4.png',
      blurb: 'Methane is a potent short-lived greenhouse gas.',
    },
  ],
  [
    'HFC-134a',
    {
      iupacName: '1,1,1,2-Tetrafluoroethane',
      chemFormula: 'C2H2F4',
      gwp: 1300,
      lifetime: '14 years',
      conc: 'Trace',
      sources: ['refrigerants', 'air conditioning'],
      impacts: ['global warming'],
      image: 'images/c2h2f4.png',
      blurb: 'HFC-134a is widely used in vehicle air conditioning systems.',
    },
  ],
  [
    'Nitrogen trifluoride',
    {
      iupacName: 'Nitrogen trifluoride',
      chemFormula: 'NF3',
      gwp: 16100,
      lifetime: '500 years',
      conc: 'Trace',
      sources: ['semiconductor industry'],
      impacts: ['global warming'],
      image: 'images/nf3.png',
      blurb: 'Nitrogen trifluoride is used in electronics manufacturing.',
    },
  ],
  [
    'HFC-143a',
    {
      iupacName: '1,1,1-Trifluoroethane',
      chemFormula: 'C2H3F3',
      gwp: 4800,
      lifetime: '52 years',
      conc: 'Trace',
      sources: ['refrigerants'],
      impacts: ['global warming'],
      image: 'images/c2h3f3.png',
      blurb: 'HFC-143a is used in refrigerant blends for cooling systems.',
    },
  ],
  [
    'Nitrous oxide',
    {
      iupacName: 'Nitrous oxide',
      chemFormula: 'N2O',
      gwp: 265,
      lifetime: '114 years',
      conc: '~0.3 ppm',
      sources: ['fertilizers', 'industrial processes'],
      impacts: ['global warming', 'ozone depletion'],
      image: 'images/n2o.png',
      blurb:
        'Nitrous oxide is a greenhouse gas that also depletes the ozone layer.',
    },
  ],
  [
    'Perfluorobutane',
    {
      iupacName: 'Decafluorobutane',
      chemFormula: 'C4F10',
      gwp: 9200,
      lifetime: '2600 years',
      conc: 'Trace',
      sources: ['semiconductor industry'],
      impacts: ['global warming'],
      image: 'images/c4f10.png',
      blurb: 'Perfluorobutane is a long-lived greenhouse gas.',
    },
  ],
  [
    'Perfluorocyclobutane',
    {
      iupacName: 'Octafluorocyclobutane',
      chemFormula: 'C4F8',
      gwp: 9540,
      lifetime: '3200 years',
      conc: 'Trace',
      sources: ['industrial processes'],
      impacts: ['global warming'],
      image: 'images/c4f8.png',
      blurb: 'Perfluorocyclobutane has a significant global warming potential.',
    },
  ],
  [
    'Perfluorohexane',
    {
      iupacName: 'Tetradecafluorohexane',
      chemFormula: 'C6F14',
      gwp: 9300,
      lifetime: '3000 years',
      conc: 'Trace',
      sources: ['industrial processes'],
      impacts: ['global warming'],
      image: 'images/c6f14.png',
      blurb:
        'Perfluorohexane is a long-lived greenhouse gas used in specific industrial processes.',
    },
  ],
  [
    'Perfluoropropane',
    {
      iupacName: 'Octafluoropropane',
      chemFormula: 'C3F8',
      gwp: 8900,
      lifetime: '2600 years',
      conc: 'Trace',
      sources: ['semiconductor industry'],
      impacts: ['global warming'],
      image: 'images/c3f8.png',
      blurb: 'Perfluoropropane is a long-lived greenhouse gas.',
    },
  ],
  [
    'Sulfur hexafluoride',
    {
      iupacName: 'Sulfur hexafluoride',
      chemFormula: 'SF6',
      gwp: 23500,
      lifetime: '3200 years',
      conc: 'Trace',
      sources: ['electric equipment', 'semiconductor industry'],
      impacts: ['global warming'],
      image: 'images/sf6.png',
      blurb:
        'Sulfur hexafluoride is the most potent greenhouse gas with industrial applications.',
    },
  ],
]);
