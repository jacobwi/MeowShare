import { AppearanceSettings } from "../../types";

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
