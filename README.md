# Industry Emissions Dashboard

A dashboard to visualize the ['Supply Chain Greenhouse Gas Emission Factors v1.3 by NAICS-6'](https://catalog.data.gov/dataset/supply-chain-greenhouse-gas-emission-factors-v1-3-by-naics-6) dataset provided by the EPA.

Final project for ECS 272 - Information Visualization at UC Davis, Fall 2024.

Created by Linus Lam and Mahima Rudrapati.

---

Dev setup:

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
