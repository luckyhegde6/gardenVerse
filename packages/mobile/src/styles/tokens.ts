import { Platform } from "react-native";

export const COLORS = {
  primary: "#16a34a",
  darkForest: "#0d2818",
  leafGreen: "#22c55e",
  soilBrown: "#8B4513",
  skyBlue: "#0ea5e9",
  sunYellow: "#fbbf24",
  dangerRed: "#ef4444",

  white: "#ffffff",
  black: "#000000",
  background: "#f8fafc",
  surface: "#ffffff",
  surfaceSecondary: "#e2e8f0",
  surfaceVariant: "#f1f5f9",
  text: "#0f172a",
  textSecondary: "#64748b",
  textMuted: "#94a3b8",
  border: "#e2e8f0",
  overlay: "rgba(0,0,0,0.5)",
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BORDER_RADIUS = {
  sm: 6,
  md: 12,
  lg: 20,
  xl: 24,
  full: 9999,
} as const;

export const TYPOGRAPHY = {
  headingXL: { fontSize: 28, fontWeight: "700" as const, lineHeight: 34, letterSpacing: -0.5 },
  headingL: { fontSize: 24, fontWeight: "700" as const, lineHeight: 30, letterSpacing: -0.3 },
  headingM: { fontSize: 20, fontWeight: "600" as const, lineHeight: 26 },
  headingS: { fontSize: 18, fontWeight: "600" as const, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: "400" as const, lineHeight: 24 },
  bodySmall: { fontSize: 14, fontWeight: "400" as const, lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: "400" as const, lineHeight: 16 },
  button: { fontSize: 16, fontWeight: "600" as const, lineHeight: 20 },
  label: { fontSize: 14, fontWeight: "500" as const, lineHeight: 18 },
} as const;

export const SHADOWS = {
  sm: Platform.select({
    ios: { shadowColor: COLORS.black, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
    android: { elevation: 1 },
    default: {},
  }) as Record<string, unknown>,
  md: Platform.select({
    ios: { shadowColor: COLORS.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    android: { elevation: 3 },
    default: {},
  }) as Record<string, unknown>,
  lg: Platform.select({
    ios: { shadowColor: COLORS.black, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
    android: { elevation: 6 },
    default: {},
  }) as Record<string, unknown>,
  xl: Platform.select({
    ios: { shadowColor: COLORS.black, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16 },
    android: { elevation: 10 },
    default: {},
  }) as Record<string, unknown>,
} as const;
