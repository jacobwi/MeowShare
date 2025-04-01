import { ThemeMode, AppearanceSettings } from "../types";

export const THEME_STORAGE_KEY = "meowshare-appearance-settings";

// Helper to get system theme preference
export const getSystemThemePreference = (): ThemeMode => {
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }
  return "light";
};

// Get saved appearance settings from local storage
export const getSavedAppearance = (): AppearanceSettings => {
  try {
    const savedSettings = localStorage.getItem(THEME_STORAGE_KEY);
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings) as Partial<AppearanceSettings>;

      // Validate mode
      if (!parsed.mode || !["light", "dark"].includes(parsed.mode)) {
        parsed.mode = getSystemThemePreference();
      }

      // Validate font size
      if (
        !parsed.fontSize ||
        !["small", "medium", "large"].includes(parsed.fontSize)
      ) {
        parsed.fontSize = "medium";
      }

      // Validate compact mode
      if (typeof parsed.compactMode !== "boolean") {
        parsed.compactMode = false;
      }

      // Validate show profile info
      if (typeof parsed.showProfileInfo !== "boolean") {
        parsed.showProfileInfo = true;
      }

      // Validate share activity
      if (typeof parsed.shareActivity !== "boolean") {
        parsed.shareActivity = false;
      }

      // Validate language
      if (!parsed.language) {
        parsed.language = "English";
      }

      return parsed as AppearanceSettings;
    }
  } catch (error) {
    console.error("Error parsing saved appearance settings:", error);
  }

  // Default settings
  return {
    mode: getSystemThemePreference(),
    fontSize: "medium",
    compactMode: false,
    showProfileInfo: true,
    shareActivity: false,
    language: "English",
  };
};

// Toast configuration
export const TOAST_CONFIG = {
  position: "top-center",
  autoClose: 3000,
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "colored",
} as const;
