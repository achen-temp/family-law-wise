"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

const theme = createTheme({
  palette: {
    primary: { main: "#2f6fed" },
    text: { primary: "#1a2332", secondary: "#667085" },
    divider: "#e6e8ee",
  },
  typography: {
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
    fontSize: 14,
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          minHeight: 36,
          "&.MuiButton-contained.MuiButton-colorPrimary:not(.Mui-disabled)": {
            backgroundColor: "var(--brand)",
          },
        },
      },
    },
    MuiTextField: { defaultProps: { size: "small", fullWidth: true } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: { fontSize: 14, backgroundColor: "var(--card)" },
        notchedOutline: { borderColor: "var(--line)" },
      },
    },
    MuiSelect: { defaultProps: { IconComponent: ChevronDown } },
    MuiTab: {
      styleOverrides: {
        root: { textTransform: "none", minHeight: 42, fontWeight: 600 },
      },
    },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 16 } } },
  },
});

export function AppTheme({ children }: { children: ReactNode }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
