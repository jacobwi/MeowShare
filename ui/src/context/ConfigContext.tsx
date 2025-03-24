import React, { createContext, useState, useEffect, ReactNode } from "react";
import defaultConfig from "../config/env";
import { ConfigContextType, defaultConfigContext } from "./types/config";
import { AppConfig } from "../types";

// Create the context
const ConfigContext = createContext<ConfigContextType>(defaultConfigContext);

// Export the hook from a separate file to avoid the react-refresh/only-export-components warning
import { useConfig } from "./hooks/useConfig";
export { useConfig };

// Config provider component
interface ConfigProviderProps {
  children: ReactNode;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ children }) => {
  // Try to load saved config from localStorage, otherwise use defaults
  const loadSavedConfig = (): AppConfig => {
    try {
      const savedConfig = localStorage.getItem("app_config");
      if (savedConfig) {
        return JSON.parse(savedConfig);
      }
    } catch (error) {
      console.error("Error loading saved config:", error);
    }

    // Use defaults if no saved config or error
    return {
      ...defaultConfig,
      DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === "true",
    };
  };

  // Initialize with saved or default config
  const [config, setConfig] = useState<AppConfig>(loadSavedConfig);

  // Save config to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("app_config", JSON.stringify(config));
  }, [config]);

  // Update config values
  const updateConfig = (newConfig: Partial<AppConfig>) => {
    setConfig((prevConfig: AppConfig) => {
      // Create a clean copy without undefined values
      const cleanConfig: AppConfig = { ...prevConfig };

      // Apply new values, filtering out undefined
      Object.entries(newConfig).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanConfig[key] = value;
        }
      });

      return cleanConfig;
    });
  };

  // Reset to default values
  const resetConfig = () => {
    setConfig({
      ...defaultConfig,
      DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === "true",
    });
    localStorage.removeItem("app_config");
  };

  return (
    <ConfigContext.Provider value={{ config, updateConfig, resetConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};

export default ConfigContext;
