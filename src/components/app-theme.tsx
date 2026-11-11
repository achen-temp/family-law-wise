"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

const primary = {
  main: "var(--primary)",
  light: "var(--primary-soft)",
  dark: "var(--primary-hover)",
  contrastText: "var(--surface)",
};

const theme = createTheme({
  // Native color operations let MUI consume the same CSS tokens as native controls.
  cssVariables: { nativeColor: true },
  palette: {
    primary,
    secondary: { main: "var(--text-secondary)", light: "var(--neutral-bg)", dark: "var(--text-primary)", contrastText: "var(--surface)" },
    success: primary,
    warning: { main: "var(--review-text)", light: "var(--review-bg)", dark: "var(--review-text)", contrastText: "var(--surface)" },
    error: { main: "var(--error-text)", light: "var(--error-bg)", dark: "var(--error-text)", contrastText: "var(--surface)" },
    info: { main: "var(--neutral-text)", light: "var(--neutral-bg)", dark: "var(--text-primary)", contrastText: "var(--surface)" },
    text: { primary: "var(--text-primary)", secondary: "var(--text-secondary)", disabled: "var(--neutral-text)" },
    background: { default: "var(--canvas)", paper: "var(--surface)" },
    divider: "var(--border)",
    action: { hover: "var(--surface-subtle)", selected: "var(--primary-soft)", disabled: "var(--neutral-text)", disabledBackground: "var(--neutral-bg)" },
  },
  typography: {
    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
    fontSize: 14,
    h1: { fontSize: 28, lineHeight: "36px", fontWeight: 600 },
    h2: { fontSize: 16, lineHeight: "24px", fontWeight: 600 },
    body1: { fontSize: 14, lineHeight: "21px" },
    body2: { fontSize: 12, lineHeight: "18px" },
    button: { fontSize: 14, lineHeight: "21px", textTransform: "none", fontWeight: 600 },
    caption: { fontSize: 12, lineHeight: "18px" },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButtonBase: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: {
          "&.Mui-focusVisible": { outline: "2px solid var(--focus-ring)", outlineOffset: 2 },
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          minHeight: 36,
          padding: "6.5px 14px",
          borderRadius: 6,
          transition: "background-color 120ms ease, border-color 120ms ease, color 120ms ease",
          "&.Mui-disabled": { color: "var(--neutral-text)", backgroundColor: "var(--neutral-bg)", borderColor: "var(--border)" },
          "@media (prefers-reduced-motion: reduce)": { transition: "none" },
        },
        contained: { "&.MuiButton-colorPrimary:hover": { backgroundColor: "var(--primary-hover)" } },
        outlined: {
          borderColor: "var(--border-strong)",
          "&:hover": { backgroundColor: "var(--surface-subtle)" },
          "&.MuiButton-colorPrimary": { color: "var(--text-primary)" },
          "&.MuiButton-colorError": { borderColor: "var(--error-text)", "&:hover": { backgroundColor: "var(--error-bg)" } },
        },
        text: { color: "var(--text-secondary)", "&.MuiButton-colorError": { color: "var(--error-text)" } },
      },
    },
    MuiIconButton: {
      styleOverrides: { root: { width: 32, height: 32, borderRadius: 6, "& svg": { width: 16, height: 16 } } },
    },
    MuiTextField: { defaultProps: { size: "small", fullWidth: true } },
    MuiFormControl: { defaultProps: { size: "small" } },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          minHeight: 40,
          borderRadius: 6,
          fontSize: 14,
          lineHeight: "21px",
          backgroundColor: "var(--surface)",
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "var(--primary)" },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderWidth: 1, borderColor: "var(--focus)" },
          "&:has(:focus-visible)": { outline: "2px solid var(--focus-ring)", outlineOffset: 2 },
          "&.Mui-error": { backgroundColor: "var(--error-bg)" },
          "&.Mui-error .MuiOutlinedInput-notchedOutline": { borderColor: "var(--error-text)" },
          "&.Mui-disabled": { backgroundColor: "var(--neutral-bg)" },
          "&.Mui-disabled .MuiOutlinedInput-notchedOutline": { borderColor: "var(--border-strong)" },
        },
        input: { padding: "8.5px 12px", "&::placeholder": { color: "var(--muted)", opacity: 1 } },
        multiline: { padding: "8.5px 12px", "& textarea": { padding: 0 } },
        notchedOutline: { borderColor: "var(--border-strong)" },
      },
    },
    MuiSelect: {
      defaultProps: { IconComponent: ChevronDown },
      styleOverrides: { select: { minHeight: "21px", paddingTop: 8.5, paddingBottom: 8.5 }, icon: { width: 16, height: 16, top: "calc(50% - 8px)" } },
    },
    MuiToggleButton: {
      styleOverrides: { root: { minHeight: 40, borderRadius: 6, borderColor: "var(--border-strong)", padding: "8px 12px", textTransform: "none", "&.Mui-selected": { backgroundColor: "var(--primary-soft)", color: "var(--primary)" } } },
    },
    MuiTab: {
      styleOverrides: { root: { textTransform: "none", minHeight: 48, fontSize: 14, fontWeight: 600 } },
    },
    MuiChip: {
      styleOverrides: {
        root: { height: 24, borderRadius: 4, fontSize: 12, fontWeight: 500, backgroundColor: "var(--neutral-bg)", color: "var(--neutral-text)" },
        colorSuccess: { backgroundColor: "var(--success-bg)", color: "var(--success-text)" },
        colorWarning: { backgroundColor: "var(--review-bg)", color: "var(--review-text)" },
        colorError: { backgroundColor: "var(--error-bg)", color: "var(--error-text)" },
        colorInfo: { backgroundColor: "var(--neutral-bg)", color: "var(--neutral-text)" },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 6, fontSize: 14, lineHeight: "21px", "& .MuiAlert-icon": { color: "inherit" } },
        standard: {
          "&.MuiAlert-colorInfo": { backgroundColor: "var(--neutral-bg)", color: "var(--neutral-text)" },
          "&.MuiAlert-colorSuccess": { backgroundColor: "var(--success-bg)", color: "var(--success-text)" },
          "&.MuiAlert-colorWarning": { backgroundColor: "var(--review-bg)", color: "var(--review-text)" },
          "&.MuiAlert-colorError": { backgroundColor: "var(--error-bg)", color: "var(--error-text)" },
        },
      },
    },
    MuiPaper: { styleOverrides: { outlined: { boxShadow: "none", borderColor: "var(--border)" } } },
    MuiTableCell: {
      styleOverrides: { root: { borderColor: "var(--border)", fontSize: 14, lineHeight: "21px" }, head: { backgroundColor: "var(--surface-subtle)", fontSize: 12, lineHeight: "16px", fontWeight: 600 } },
    },
    MuiPopover: { styleOverrides: { paper: { boxShadow: "var(--shadow-popover)" } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 12, border: "1px solid var(--border)", boxShadow: "var(--shadow-dialog)" } } },
    MuiDrawer: { styleOverrides: { anchorRight: { "& .MuiDrawer-paper": { boxShadow: "var(--shadow-dialog)" } } } },
  },
});

export function AppTheme({ children }: { children: ReactNode }) {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
