import { useContext } from "react";
import ConfigContext from "../ConfigContext";
import { ConfigContextType } from "../types";

/**
 * Custom hook to access the configuration context
 */
export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error("useConfig must be used within a ConfigProvider");
  }
  return context;
};
