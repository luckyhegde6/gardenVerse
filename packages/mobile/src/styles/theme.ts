import { StyleSheet, Platform, Dimensions } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// ─── Color Palette ──────────────────────────────────────────────────────────

export const colors = {
  primary: "#16a34a",
  primaryDark: "#15803d",
  primaryLight: "#22c55e",
  primaryBg: "#f0fdf4",

  background: "#f8fafc",
  surface: "#ffffff",
  surfaceSecondary: "#f1f5f9",

  text: "#0f172a",
  textSecondary: "#64748b",
  textMuted: "#94a3b8",

  border: "#e2e8f0",
  borderFocus: "#16a34a",

  error: "#ef4444",
  errorBg: "#fef2f2",
  success: "#22c55e",
  successBg: "#f0fdf4",
  warning: "#f59e0b",
  warningBg: "#fffbeb",
  info: "#3b82f6",
  infoBg: "#eff6ff",

  white: "#ffffff",
  black: "#000000",
  overlay: "rgba(0, 0, 0, 0.5)",

  // Debug mode specific
  debugBg: "#1e1b4b",
  debugText: "#c7d2fe",
  debugAccent: "#818cf8",
} as const;

// ─── Spacing ────────────────────────────────────────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ─── Border Radius ──────────────────────────────────────────────────────────

export const borderRadius = {
  sm: 6,
  md: 12,
  lg: 20,
  xl: 24,
  full: 9999,
} as const;

// ─── Typography ─────────────────────────────────────────────────────────────

export const typography = {
  h1: {
    fontSize: 28,
    fontWeight: "700" as const,
    lineHeight: 34,
    letterSpacing: -0.5,
    color: colors.text,
  },
  h2: {
    fontSize: 24,
    fontWeight: "700" as const,
    lineHeight: 30,
    letterSpacing: -0.3,
    color: colors.text,
  },
  h3: {
    fontSize: 20,
    fontWeight: "600" as const,
    lineHeight: 26,
    color: colors.text,
  },
  h4: {
    fontSize: 18,
    fontWeight: "600" as const,
    lineHeight: 24,
    color: colors.text,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    lineHeight: 24,
    color: colors.text,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: "400" as const,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: "400" as const,
    lineHeight: 16,
    color: colors.textMuted,
  },
  button: {
    fontSize: 16,
    fontWeight: "600" as const,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "500" as const,
    lineHeight: 18,
    color: colors.text,
  },
} as const;

// ─── Shadows ────────────────────────────────────────────────────────────────

export const shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    android: {
      elevation: 1,
    },
    default: {},
  }),
  md: Platform.select({
    ios: {
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    android: {
      elevation: 3,
    },
    default: {},
  }),
  lg: Platform.select({
    ios: {
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
    },
    android: {
      elevation: 6,
    },
    default: {},
  }),
  xl: Platform.select({
    ios: {
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
    },
    android: {
      elevation: 10,
    },
    default: {},
  }),
} as const;

// ─── Screen ─────────────────────────────────────────────────────────────────

export const screen = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmall: SCREEN_WIDTH < 375,
  isMedium: SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 768,
  isLarge: SCREEN_WIDTH >= 768,
} as const;

// ─── Global Styles ──────────────────────────────────────────────────────────

export const globalStyles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  containerCentered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  containerPadded: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
  },

  // Surface / Card
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  cardElevated: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.lg,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },

  // Input
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  inputContainerFocused: {
    borderColor: colors.borderFocus,
  },
  inputContainerError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    height: "100%",
    paddingVertical: 0,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.text,
    marginBottom: spacing.xs + 2,
  },
  inputError: {
    fontSize: 12,
    color: colors.error,
    marginTop: spacing.xs,
  },

  // Button
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.md,
    height: 52,
    paddingHorizontal: spacing.lg,
  },
  buttonSm: {
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },
  buttonLg: {
    height: 56,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
  },
  buttonFullWidth: {
    width: "100%",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.surfaceSecondary,
  },
  buttonOutline: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.primary,
  },
  buttonGhost: {
    backgroundColor: "transparent",
  },
  buttonDanger: {
    backgroundColor: colors.error,
  },
  buttonText: {
    ...typography.button,
    color: colors.white,
  },
  buttonTextSecondary: {
    ...typography.button,
    color: colors.text,
  },
  buttonTextOutline: {
    ...typography.button,
    color: colors.primary,
  },
  buttonTextGhost: {
    ...typography.button,
    color: colors.primary,
  },
  buttonTextDanger: {
    ...typography.button,
    color: colors.white,
  },

  // Badge
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeSm: {
    paddingHorizontal: spacing.sm - 2,
    paddingVertical: 2,
  },
  badgeLg: {
    paddingHorizontal: spacing.md - 4,
    paddingVertical: spacing.sm - 2,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.xs,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  dividerLabeled: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "500",
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  loadingContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingMessage: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.textSecondary,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
    marginBottom: spacing.xs,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.lg,
  },

  // Screen Header
  screenHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  screenHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    minWidth: 80,
  },
  screenHeaderCenter: {
    flex: 1,
    alignItems: "center",
  },
  screenHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    minWidth: 80,
  },
  screenHeaderTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
  },
  screenHeaderBackButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },

  // Error message box
  errorBox: {
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 4,
    marginBottom: spacing.md,
  },
  errorBoxText: {
    color: colors.error,
    fontSize: 14,
    lineHeight: 20,
  },
  successBox: {
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md - 4,
    marginBottom: spacing.md,
  },
  successBoxText: {
    color: colors.primaryDark,
    fontSize: 14,
    lineHeight: 20,
  },

  // Row helpers
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowCentered: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  // Spacer
  spacer: {
    height: spacing.md,
  },
  spacerSm: {
    height: spacing.sm,
  },
  spacerLg: {
    height: spacing.lg,
  },
});
