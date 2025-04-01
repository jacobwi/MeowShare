import { useContext } from "react";
import ThemeContext from "../ThemeContext";
import { ThemeContextType } from "../types/theme";

/**
 * Custom hook to access the theme context
 */
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
