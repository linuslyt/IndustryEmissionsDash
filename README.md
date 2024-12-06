# Industry Emissions Dashboard

A dashboard to visualize the ['Supply Chain Greenhouse Gas Emission Factors v1.3 by NAICS-6'](https://catalog.data.gov/dataset/supply-chain-greenhouse-gas-emission-factors-v1-3-by-naics-6) dataset provided by the EPA.

Final project for ECS 272 - Information Visualization at UC Davis, Fall 2024.

Created by Linus Lam and Mahima Rudrapati.
![image](https://github.com/user-attachments/assets/25e2574b-9fb1-4b56-bfbf-2346d270f522)

## Usage

The dashboard is separated into two sections - the main viewbox on the left containing the packed bubble chart, and the information panel on the right containing the stacked bar chart and the Gas Facts panel.

### Packed bubble chart

The packed bubble chart is the main visualization and also the main method of interacting with the dashboard. The bubbles display **total emissions** (i.e. both base and margins emissions - see [next section](#stacked-bar-chart)) by group in each level of the NAICS hierarchy. The ratios of the **areas** of the circles correspond to the ratios of total emissions of their encoded group.

1. Hover over a bubble for a tooltip displaying the corresponding NAICS code, the full NAICS label, and the emissions of the group in equivalent CO2 kgs per price of goods purchased in 2022 USD.
2. Click on a bubble to drill down into the group.
3. Once a bubble has been clicked, controls in the top right become available. Click on the blue buttons to navigate to the top bubble or to the parent bubble respectively.

### Stacked bar chart

1. As you navigate through the hierarchy, the stacked bar chart on the top right updates dynamically to show the breakdown in emissions for the current selected group at the current level of the hierarchy.
2. The stacked bars display the breakdown between base and margin emissions for each subcategory. Base emissions is emissions created from production of the good, while Margins emissions is emisssions created from transporting the good to the end buyer/consumer.
3. Use the `<Select/>` dropdown in the top right to toggle between Total Emissions, Production Emissions and Margins Emissions. The latter two converts it to a standard bar chart.
4. Hover over each bar for exact values.

### Pie chart

Once a terminal node is reached in the packed bubble chart, i.e. a bubble with no further child bubbles, a pie chart is shown. This displays the breakdown in emissions by greenhouse gas type for the selected industry. **All emissions values are converted to equivalent CO2 emissions, using the 100-year Global Warming Potential (GWP) values from the 2014 IPCC 5th report (AR5).** Thus the size of a sector represents the proportion of the contribution to global warming of the corresponding gas.**

1. Hover over each sector for a tooltip that displays the percentage/quantity of equivalent emissions for the corresponding gas.
2. To learn more about the gas, click on the sector and view the Gas Facts card on the bottom right.

### Gas facts card

The section in the bottom right displays facts about the current selected gas. There are 17 named gases in total in the dataset, with one category for unspecified HFCs (Hydrofluorocarbons) and PFCs (Perfluorocarbons).

1. The selected gas can be chosen by clicking on a sector in the pie chart.
2. To view facts about different gases without drilling down to the pie chart level, use the `<Select/>` dropdown on the top left of the card to change the selected gas.

---

## Dev setup

1. Install [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) and [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) extensions in VSCode.
2. Open User Settings JSON (`Cmd+Shift+P` or `Ctrl+Shift+P` > `Preferences: Open User Settings (JSON)`) and append the following:

    ```
    "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"],
    "prettier.requireConfig": true,
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": "explicit",
        "source.organizeImports": "always",
        "source.fixAll": "explicit"
    },
    "[javascriptreact]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    }

    ```

    This will auto-lint and reformat the file on save.
