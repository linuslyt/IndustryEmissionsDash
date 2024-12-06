import { createContext } from 'react';
import { DEFAULT_SELECTED_DATA } from '../consts';

const SelectedDataContext = createContext(DEFAULT_SELECTED_DATA);
export default SelectedDataContext;
