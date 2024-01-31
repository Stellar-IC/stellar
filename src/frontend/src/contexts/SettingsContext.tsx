import { createContext, useContext, useState } from 'react';

type SettingsContextProviderProps = {
  children: React.ReactNode;
};

// eslint-disable-next-line no-spaced-func
export const SettingsContext = createContext<{
  getSettingValue: (path: string) => boolean | null;
  updateSettings: (path: string, value: boolean) => void;
} | null>(null);

export const SettingsContextProvider = ({
  children,
}: SettingsContextProviderProps) => {
  const [settings, setSettings] = useState([
    { path: 'application.developerSettingsEnabled', value: true },
    { path: 'developer.showBlockIds', value: false },
  ]);

  const updateSettings = (path: string, value: boolean) => {
    setSettings((prev) => {
      const newSettings = [...prev];
      const index = newSettings.findIndex((s) => s.path === path);
      if (index === -1) throw new Error(`Unrecognized setting ${path}`);
      newSettings[index].value = value;
      return newSettings;
    });
  };

  const getSettingValue = (path: string) => {
    const setting = settings.find((s) => s.path === path);
    if (!setting) throw new Error(`Unrecognized setting ${path}`);
    return setting.value;
  };

  return (
    <SettingsContext.Provider value={{ getSettingValue, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettingsContext = () => {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error('useSettingsContext must be used within a SettingsContext');
  }

  return context;
};
