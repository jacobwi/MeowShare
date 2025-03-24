import { AppearanceSettings, ThemeMode, FontSize } from "../../types";

export interface ThemeContextType extends AppearanceSettings {
  toggleTheme: () => void;
  setMode: (mode: AppearanceSettings["mode"]) => void;
  setFontSize: (size: AppearanceSettings["fontSize"]) => void;
  setCompactMode: (isCompact: boolean) => void;
  setShowProfileInfo: (show: boolean) => void;
  setShareActivity: (share: boolean) => void;
  setLanguage: (language: string) => void;
  updateAppearance: (settings: Partial<AppearanceSettings>) => void;
}

export const defaultThemeContext: ThemeContextType = {
  mode: "light" as ThemeMode,
  fontSize: "medium" as FontSize,
  compactMode: false,
  showProfileInfo: true,
  shareActivity: false,
  language: "English",
  toggleTheme: () => {},
  setMode: () => {},
  setFontSize: () => {},
  setCompactMode: () => {},
  setShowProfileInfo: () => {},
  setShareActivity: () => {},
  setLanguage: () => {},
  updateAppearance: () => {},
};
