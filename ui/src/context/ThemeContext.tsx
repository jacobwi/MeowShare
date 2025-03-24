import React, {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { THEME_STORAGE_KEY, getSavedAppearance } from "../constants/theme";
import { AppearanceSettings } from "../types";
import { ThemeContextType, defaultThemeContext } from "./types/theme";

const ThemeContext = createContext<ThemeContextType>(defaultThemeContext);

// Moved to a separate file to avoid the react-refresh/only-export-components warning
import { useTheme } from "./hooks/useTheme";
export { useTheme };

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Initialize state with saved settings
  const [appearance, setAppearance] =
    useState<AppearanceSettings>(getSavedAppearance());

  const updateAppearance = useCallback(
    (newSettings: Partial<AppearanceSettings>) => {
      const updatedSettings = { ...appearance, ...newSettings };
      setAppearance(updatedSettings);
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(updatedSettings));
    },
    [appearance],
  );

  const toggleTheme = useCallback(() => {
    updateAppearance({ mode: appearance.mode === "light" ? "dark" : "light" });
  }, [appearance.mode, updateAppearance]);

  const setMode = useCallback(
    (mode: AppearanceSettings["mode"]) => {
      updateAppearance({ mode });
    },
    [updateAppearance],
  );

  const setFontSize = useCallback(
    (fontSize: AppearanceSettings["fontSize"]) => {
      updateAppearance({ fontSize });
    },
    [updateAppearance],
  );

  const setCompactMode = useCallback(
    (compactMode: boolean) => {
      updateAppearance({ compactMode });
    },
    [updateAppearance],
  );

  const setShowProfileInfo = useCallback(
    (showProfileInfo: boolean) => {
      updateAppearance({ showProfileInfo });
    },
    [updateAppearance],
  );

  const setShareActivity = useCallback(
    (shareActivity: boolean) => {
      updateAppearance({ shareActivity });
    },
    [updateAppearance],
  );

  const setLanguage = useCallback(
    (language: string) => {
      updateAppearance({ language });
    },
    [updateAppearance],
  );

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      // Only apply if user hasn't explicitly set a preference
      const savedSettings = localStorage.getItem(THEME_STORAGE_KEY);
      if (!savedSettings || !JSON.parse(savedSettings).mode) {
        updateAppearance({ mode: e.matches ? "dark" : "light" });
      }
    };

    // Add listener for system theme changes
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      // For Safari < 14
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        // For Safari < 14
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [updateAppearance]);

  // Effect for syncing theme across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        try {
          const newSettings = JSON.parse(e.newValue) as AppearanceSettings;
          setAppearance(newSettings);
        } catch (error) {
          console.error(
            "Error parsing appearance settings from storage event:",
            error,
          );
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // Apply font size effect
  useEffect(() => {
    document.documentElement.dataset.fontSize = appearance.fontSize;

    // Apply CSS variables for font sizes
    const root = document.documentElement;
    if (appearance.fontSize === "small") {
      root.style.setProperty("--font-size-base", "14px");
    } else if (appearance.fontSize === "medium") {
      root.style.setProperty("--font-size-base", "16px");
    } else if (appearance.fontSize === "large") {
      root.style.setProperty("--font-size-base", "18px");
    }
  }, [appearance.fontSize]);

  // Apply compact mode effect
  useEffect(() => {
    document.documentElement.dataset.compactMode = appearance.compactMode
      ? "true"
      : "false";

    // Apply CSS variables for spacing
    const root = document.documentElement;
    if (appearance.compactMode) {
      root.style.setProperty("--spacing-multiplier", "0.8");
    } else {
      root.style.setProperty("--spacing-multiplier", "1");
    }
  }, [appearance.compactMode]);

  // Apply theme changes
  useEffect(() => {
    document.documentElement.dataset.theme = appearance.mode;
  }, [appearance.mode]);

  return (
    <ThemeContext.Provider
      value={{
        ...appearance,
        toggleTheme,
        setMode,
        setFontSize,
        setCompactMode,
        setShowProfileInfo,
        setShareActivity,
        setLanguage,
        updateAppearance,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
