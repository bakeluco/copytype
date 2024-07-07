/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext } from "react";

// These settings should match JSON and backend
export interface Settings {
  recentBooks: string[];
}

export const defaultSettings: Settings = {
  recentBooks: [],
};

type SettingsContextType = {
  settings: Settings;
  setSettings: (settings: Settings) => void;
};

export const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  setSettings: () => {},
});

export const useSettings = () => {
  return useContext(SettingsContext);
};
