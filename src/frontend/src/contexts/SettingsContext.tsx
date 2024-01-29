import { createContext, useContext, useState } from 'react';

type SettingsContextProviderProps = {
  children: React.ReactNode;
};

// eslint-disable-next-line no-spaced-func
export const SettingsContext = createContext<{
  settings: {
    path: string;
    value: boolean;
  }[];
  updateSettings: (path: string, value: boolean) => void;
} | null>(null);

export const SettingsContextProvider = ({
  children,
}: SettingsContextProviderProps) => {
  const [settings, setSettings] = useState([
    { path: 'application.developerSettingsEnabled', value: true },
    { path: 'developer.showDeletedBlocks', value: false },
  ]);

  const updateSettings = (path: string, value: boolean) => {
    setSettings((prev) => {
      const newSettings = [...prev];
      const index = newSettings.findIndex((s) => s.path === path);
      newSettings[index].value = value;

      return newSettings;
    });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
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
