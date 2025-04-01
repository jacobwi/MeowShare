import defaultConfig from "../../config/env";
import { AppConfig } from "../../types";

// Define the context type
export interface ConfigContextType {
  config: AppConfig;
  updateConfig: (newConfig: Partial<AppConfig>) => void;
  resetConfig: () => void;
}

// Create a default context value
export const defaultConfigContext: ConfigContextType = {
  config: {
    ...defaultConfig,
    DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === "true",
    // Ensure APP_VERSION is always set
    APP_VERSION:
      defaultConfig.APP_VERSION || "0.1.0-prealpha (Very Early Pre-Alpha)",
  },
  updateConfig: () => {},
  resetConfig: () => {},
};
