import { createTheme, PaletteMode, Theme } from "@mui/material/styles";
import { ThemeOptions } from "@mui/material/styles";

// Common typography settings
const typography = {
  fontFamily: [
    "Inter",
    "-apple-system",
    "BlinkMacSystemFont",
    '"Segoe UI"',
    "Roboto",
    '"Helvetica Neue"',
    "Arial",
    "sans-serif",
  ].join(","),
  h1: {
    fontWeight: 600,
    fontSize: "2.5rem",
  },
  h2: {
    fontWeight: 600,
    fontSize: "2rem",
  },
  h3: {
    fontWeight: 600,
    fontSize: "1.75rem",
  },
  h4: {
    fontWeight: 600,
    fontSize: "1.5rem",
  },
  h5: {
    fontWeight: 600,
    fontSize: "1.25rem",
  },
  h6: {
    fontWeight: 600,
    fontSize: "1rem",
  },
  button: {
    textTransform: "none" as const,
    fontWeight: 500,
  },
};

// Common components overrides
const components = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 4,
        textTransform: "none" as const,
        fontWeight: 500,
        boxShadow: "none",
        "&:hover": {
          boxShadow: "none",
        },
      },
      contained: {
        boxShadow: "none",
        "&:hover": {
          boxShadow: "none",
        },
      },
    },
    defaultProps: {
      disableElevation: true,
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 8,
      },
      elevation1: {
        boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.05)",
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        boxShadow: "0px 1px 3px rgba(0, 0, 0, 0.05)",
      },
    },
    defaultProps: {
      color: "default" as const,
      elevation: 0,
    },
  },
  MuiTableCell: {
    styleOverrides: {
      root: ({ theme }: { theme: Theme }) => ({
        borderBottom: `1px solid ${theme.palette.divider}`,
      }),
      head: ({ theme }: { theme: Theme }) => ({
        fontWeight: 600,
        color: theme.palette.text.primary,
      }),
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 4,
      },
    },
  },
  MuiCssBaseline: {
    styleOverrides: {
      body: ({ theme }: { theme: Theme }) => ({
        transition: "background-color 0.3s ease, color 0.3s ease",
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        scrollbarWidth: "thin",
        scrollbarColor: `${theme.palette.mode === "dark" ? "#555" : "#ddd"} transparent`,
        "&::-webkit-scrollbar": {
          width: "8px",
          height: "8px",
        },
        "&::-webkit-scrollbar-track": {
          background: "transparent",
        },
        "&::-webkit-scrollbar-thumb": {
          background: theme.palette.mode === "dark" ? "#555" : "#ddd",
          borderRadius: "4px",
        },
        "&::-webkit-scrollbar-thumb:hover": {
          background: theme.palette.mode === "dark" ? "#777" : "#bbb",
        },
      }),
    },
  },
};

// Define light theme palette
const lightPalette = {
  mode: "light" as PaletteMode,
  primary: {
    main: "#000000",
    light: "#333333",
    dark: "#000000",
    contrastText: "#ffffff",
  },
  secondary: {
    main: "#424242",
    light: "#6d6d6d",
    dark: "#1b1b1b",
    contrastText: "#ffffff",
  },
  background: {
    default: "#ffffff",
    paper: "#f5f5f5",
  },
  text: {
    primary: "#212121",
    secondary: "#757575",
    disabled: "#9e9e9e",
  },
  divider: "#e0e0e0",
};

// Define dark theme palette
const darkPalette = {
  mode: "dark" as PaletteMode,
  primary: {
    main: "#ffffff",
    light: "#e0e0e0",
    dark: "#f5f5f5",
    contrastText: "#121212",
  },
  secondary: {
    main: "#a0a0a0",
    light: "#d1d1d1",
    dark: "#707070",
    contrastText: "#121212",
  },
  background: {
    default: "#121212",
    paper: "#1e1e1e",
  },
  text: {
    primary: "#e0e0e0",
    secondary: "#a0a0a0",
    disabled: "#6c6c6c",
  },
  divider: "#303030",
};

// Create theme factory function to generate theme based on mode
export const createAppTheme = (
  mode: PaletteMode,
  fontSize: string = "medium",
  compactMode: boolean = false,
): Theme => {
  // Get the current font size from document element if available
  const documentFontSize =
    document.documentElement.dataset.fontSize || fontSize;
  const documentCompactMode =
    document.documentElement.dataset.compactMode === "true" || compactMode;

  // Apply spacing based on compact mode
  const spacingFactor = documentCompactMode ? 0.85 : 1;

  // Adjust typography based on font size
  const fontSizeMultiplier =
    documentFontSize === "small" ? 0.9 : documentFontSize === "large" ? 1.1 : 1;

  // Adjust the typography settings based on the fontSize preference
  const adjustedTypography = {
    ...typography,
    h1: {
      ...typography.h1,
      fontSize: `${parseFloat(typography.h1.fontSize as string) * fontSizeMultiplier}rem`,
    },
    h2: {
      ...typography.h2,
      fontSize: `${parseFloat(typography.h2.fontSize as string) * fontSizeMultiplier}rem`,
    },
    h3: {
      ...typography.h3,
      fontSize: `${parseFloat(typography.h3.fontSize as string) * fontSizeMultiplier}rem`,
    },
    h4: {
      ...typography.h4,
      fontSize: `${parseFloat(typography.h4.fontSize as string) * fontSizeMultiplier}rem`,
    },
    h5: {
      ...typography.h5,
      fontSize: `${parseFloat(typography.h5.fontSize as string) * fontSizeMultiplier}rem`,
    },
    h6: {
      ...typography.h6,
      fontSize: `${parseFloat(typography.h6.fontSize as string) * fontSizeMultiplier}rem`,
    },
    body1: {
      fontSize:
        documentFontSize === "small"
          ? "0.875rem"
          : documentFontSize === "large"
            ? "1.125rem"
            : "1rem",
    },
    body2: {
      fontSize:
        documentFontSize === "small"
          ? "0.75rem"
          : documentFontSize === "large"
            ? "1rem"
            : "0.875rem",
    },
  };

  const themeOptions: ThemeOptions = {
    palette: mode === "light" ? lightPalette : darkPalette,
    typography: adjustedTypography,
    shape: {
      borderRadius: 8,
    },
    spacing: (factor: number) => `${0.5 * factor * spacingFactor}rem`,
    components: {
      ...components,
      MuiButton: {
        ...components.MuiButton,
        styleOverrides: {
          ...components.MuiButton.styleOverrides,
          root: {
            ...components.MuiButton.styleOverrides.root,
            padding: documentCompactMode ? "6px 12px" : "8px 16px",
          },
        },
      },
      MuiCard: {
        ...components.MuiCard,
        styleOverrides: {
          ...components.MuiCard.styleOverrides,
          root: {
            ...components.MuiCard.styleOverrides.root,
            padding: documentCompactMode ? "12px" : "16px",
          },
        },
      },
    },
  };

  return createTheme(themeOptions);
};

// Export both themes with default settings
export const lightTheme = createAppTheme("light");
export const darkTheme = createAppTheme("dark");

// Default export is light theme for backward compatibility
export default lightTheme;
