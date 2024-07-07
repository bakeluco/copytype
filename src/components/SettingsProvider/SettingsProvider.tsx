import { useEffect, useState } from "react";
import { Settings, SettingsContext, defaultSettings } from "./Settings";
import { useBackend } from "../../backends/BackendContext";
import { Optional } from "../options";


export interface SettingsProviderProps {
  children: React.ReactNode
}

const SettingsProvider = ({ children }: SettingsProviderProps) => {
  const [settings, setSettingsState] = useState(defaultSettings);
  const { backend } = useBackend();

  useEffect(() => {
    (async () => {
      const fetchedSettings: Optional<Settings> = await backend.getSettings();
      if (fetchedSettings.isNone()) return;

      setSettingsState(fetchedSettings.unwrap());
    })();
  }, [backend]);

  const setSettings = async (newSettings: Settings) => {
    backend.setSettings(newSettings);
    setSettingsState(newSettings);
  };

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsProvider;
