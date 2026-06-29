import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
  Platform,
  Dimensions,
  StyleSheet,
} from "react-native";
import { colors, spacing, borderRadius, typography } from "@/styles/theme";

// ─── Debug global store ─────────────────────────────────────────────────────

declare global {
  interface Window {
    __DEBUG_API_LOGS?: DebugApiLog[];
    __DEBUG_VISIBLE?: boolean;
  }
}

interface DebugApiLog {
  url: string;
  method: string;
  status: number;
  timestamp: string;
}

interface DebugAppLog {
  level: string;
  message: string;
  source?: string;
  context?: string;
  timestamp?: string;
}

let debugVisible = false;
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

/**
 * Call this function to toggle the debug overlay programmatically
 * (e.g., from a 5-long-press gesture on the garden logo).
 */
export function onDebugModeTrigger(): void {
  debugVisible = !debugVisible;
  notifyListeners();
}

// ─── Component ──────────────────────────────────────────────────────────────

interface DebugOverlayProps {
  /** Optional Zustand store state to display in the Store State section */
  storeState?: Record<string, unknown>;
}

export function DebugOverlay({ storeState }: DebugOverlayProps) {
  const [visible, setVisible] = useState(false);
  const [forceApiError, setForceApiError] = useState(false);
  const [apiLogs, setApiLogs] = useState<DebugApiLog[]>([]);
  const [appLogs, setAppLogs] = useState<DebugAppLog[]>([]);
  const [currentStoreState, setCurrentStoreState] =
    useState<Record<string, unknown>>({});

  // Subscribe to debug visibility toggles
  useEffect(() => {
    const handler = () => setVisible(debugVisible);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  // Poll debug data from globals
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      const apiLogsData = (globalThis as any).__DEBUG_API_LOGS || [];
      setApiLogs(apiLogsData);
      const appLogsData = (globalThis as any).__DEBUG_APP_LOGS || [];
      setAppLogs(appLogsData);
      if (storeState) {
        setCurrentStoreState(storeState);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [visible, storeState]);

  const handleClose = useCallback(() => {
    debugVisible = false;
    notifyListeners();
  }, []);

  const handleClearStorage = useCallback(() => {
    // Clear relevant storage keys — in React Native this would
    // typically use AsyncStorage. For now we just clear window debug logs.
    (globalThis as any).__DEBUG_API_LOGS = [];
    setApiLogs([]);
  }, []);

  const handleToggleForceError = useCallback(() => {
    setForceApiError((prev) => !prev);
    (globalThis as any).__DEBUG_FORCE_API_ERROR = !forceApiError;
  }, [forceApiError]);

  // ── Build auth state summary ─────────────────────────────────────────
  const authStateLines: { label: string; value: string }[] = [];
  try {
    const raw = (globalThis as any).__DEBUG_AUTH_STATE;
    if (raw) {
      authStateLines.push({
        label: "User",
        value: raw.user ? raw.user.email || raw.user.id || "logged in" : "none",
      });
      authStateLines.push({
        label: "Token",
        value: raw.accessToken
          ? `${raw.accessToken.slice(0, 12)}…${raw.accessToken.slice(-4)}`
          : "none",
      });
      authStateLines.push({
        label: "Authenticated",
        value: String(!!raw.isAuthenticated),
      });
    } else {
      authStateLines.push({ label: "User", value: "not loaded" });
      authStateLines.push({ label: "Token", value: "not loaded" });
      authStateLines.push({ label: "Authenticated", value: "not loaded" });
    }
  } catch {
    authStateLines.push({ label: "Error", value: "failed to read auth state" });
  }

  // ── Sections ─────────────────────────────────────────────────────────
  const sections = [
    {
      title: "🔐 Auth State",
      content: (
        <View style={styles.sectionContent}>
          {authStateLines.map((line, i) => (
            <View key={i} style={styles.kvRow}>
              <Text style={styles.kvLabel}>{line.label}</Text>
              <Text style={styles.kvValue}>{line.value}</Text>
            </View>
          ))}
        </View>
      ),
    },
    {
      title: "📡 API Log (last 20)",
      content: (
        <View style={styles.sectionContent}>
          {apiLogs.length === 0 ? (
            <Text style={styles.mutedText}>No API calls recorded yet.</Text>
          ) : (
            apiLogs
              .slice(-20)
              .reverse()
              .map((log, i) => (
                <View key={i} style={styles.logRow}>
                  <View style={styles.logLeft}>
                    <Text
                      style={[
                        styles.logMethod,
                        {
                          color:
                            log.method === "GET"
                              ? colors.info
                              : log.method === "POST"
                              ? colors.success
                              : log.method === "DELETE"
                              ? colors.error
                              : colors.warning,
                        },
                      ]}
                    >
                      {log.method}
                    </Text>
                    <Text style={styles.logUrl} numberOfLines={1}>
                      {log.url}
                    </Text>
                  </View>
                  <View style={styles.logRight}>
                    <Text
                      style={[
                        styles.logStatus,
                        {
                          color:
                            log.status < 300
                              ? colors.success
                              : log.status < 500
                              ? colors.warning
                              : colors.error,
                        },
                      ]}
                    >
                      {log.status}
                    </Text>
                    <Text style={styles.logTime}>{log.timestamp}</Text>
                  </View>
                </View>
              ))
          )}
        </View>
      ),
    },
    {
      title: "📝 App Logs (last 50)",
      content: (
        <View style={styles.sectionContent}>
          {appLogs.length === 0 ? (
            <Text style={styles.mutedText}>No app logs recorded yet.</Text>
          ) : (
            appLogs
              .slice(-50)
              .reverse()
              .map((log, i) => (
                <View key={i} style={styles.logRow}>
                  <View style={styles.logLeft}>
                    <Text
                      style={[
                        styles.logLevel,
                        {
                          color:
                            log.level === 'ERROR'
                              ? colors.error
                              : log.level === 'WARN'
                              ? colors.warning
                              : log.level === 'INFO'
                              ? colors.info
                              : colors.debugText,
                        },
                      ]}
                    >
                      {log.level}
                    </Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.appLogMessage} numberOfLines={2}>
                        {log.message}
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 4 }}>
                        {log.source && (
                          <Text style={styles.appLogMeta}>{log.source}</Text>
                        )}
                        {log.context && (
                          <Text style={styles.appLogMeta}>{log.context}</Text>
                        )}
                      </View>
                    </View>
                  </View>
                  {log.timestamp && (
                    <Text style={styles.logTime}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </Text>
                  )}
                </View>
              ))
          )}
        </View>
      ),
    },
    {
      title: "🗄️ Store State",
      content: (
        <View style={styles.sectionContent}>
          {Object.keys(currentStoreState).length === 0 ? (
            <Text style={styles.mutedText}>
              No store state provided. Pass storeState prop to DebugOverlay.
            </Text>
          ) : (
            Object.entries(currentStoreState).map(([key, val]) => (
              <View key={key} style={styles.kvRow}>
                <Text style={styles.kvLabel}>{key}</Text>
                <Text style={styles.kvValue} numberOfLines={2}>
                  {typeof val === "object"
                    ? JSON.stringify(val).slice(0, 80)
                    : String(val)}
                </Text>
              </View>
            ))
          )}
        </View>
      ),
    },
    {
      title: "⚡ Actions",
      content: (
        <View style={styles.sectionContent}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleClearStorage}
          >
            <Text style={styles.actionButtonText}>🗑️ Clear Storage</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.actionButton,
              forceApiError && styles.actionButtonActive,
            ]}
            onPress={handleToggleForceError}
          >
            <Text style={styles.actionButtonText}>
              {forceApiError ? "⚠️ Force API Error (ON)" : "❌ Force API Error (OFF)"}
            </Text>
          </TouchableOpacity>
        </View>
      ),
    },
    {
      title: "🖥️ Environment",
      content: (
        <View style={styles.sectionContent}>
          <View style={styles.kvRow}>
            <Text style={styles.kvLabel}>Platform</Text>
            <Text style={styles.kvValue}>{Platform.OS}</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={styles.kvLabel}>Version</Text>
            <Text style={styles.kvValue}>{Platform.Version}</Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={styles.kvLabel}>Screen</Text>
            <Text style={styles.kvValue}>
              {Dimensions.get("window").width} ×{" "}
              {Dimensions.get("window").height}
            </Text>
          </View>
          <View style={styles.kvRow}>
            <Text style={styles.kvLabel}>SDK</Text>
            <Text style={styles.kvValue}>
              {Platform.constants?.reactNativeVersion
                ? `${Platform.constants.reactNativeVersion.major}.${Platform.constants.reactNativeVersion.minor}.${Platform.constants.reactNativeVersion.patch}`
                : "N/A"}
            </Text>
          </View>
        </View>
      ),
    },
  ];

  // Do not render in production
  if (!(__DEV__ === true)) {
    return null;
  }

  return (
    <>
      {/* Floating debug button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          debugVisible = true;
          notifyListeners();
        }}
        accessibilityLabel="Open debug overlay"
        activeOpacity={0.7}
      >
        <Text style={styles.fabIcon}>🐛</Text>
      </TouchableOpacity>

      {/* Full-screen overlay modal */}
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleClose}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🐛 Debug Overlay</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              accessibilityLabel="Close debug overlay"
            >
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Scrollable sections */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            {sections.map((section, idx) => (
              <View key={idx} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                {section.content}
              </View>
            ))}
            <View style={styles.spacer} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
}

export default DebugOverlay;

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 24,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.debugBg,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  fabIcon: {
    fontSize: 22,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: colors.debugBg,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  modalTitle: {
    ...typography.h3,
    color: colors.debugText,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    fontSize: 16,
    color: colors.debugText,
    fontWeight: "700",
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },

  // Sections
  section: {
    marginBottom: spacing.lg,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: borderRadius.md,
    overflow: "hidden",
  },
  sectionTitle: {
    ...typography.label,
    color: colors.debugAccent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  sectionContent: {
    padding: spacing.md,
  },

  // Key-value rows
  kvRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 3,
  },
  kvLabel: {
    fontSize: 13,
    color: colors.debugText,
    fontWeight: "600",
    opacity: 0.7,
    marginRight: spacing.sm,
  },
  kvValue: {
    fontSize: 13,
    color: colors.debugText,
    flexShrink: 1,
    textAlign: "right",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },

  // Log rows
  logRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  logLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: spacing.sm,
  },
  logMethod: {
    fontSize: 11,
    fontWeight: "700",
    width: 40,
  },
  logUrl: {
    fontSize: 11,
    color: colors.debugText,
    flexShrink: 1,
  },
  logRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  logStatus: {
    fontSize: 11,
    fontWeight: "700",
    width: 32,
    textAlign: "right",
    marginRight: spacing.xs,
  },
  logTime: {
    fontSize: 10,
    color: colors.debugText,
    opacity: 0.5,
  },

  // App log styles
  logLevel: {
    fontSize: 10,
    fontWeight: '700',
    width: 44,
  },
  appLogMessage: {
    fontSize: 11,
    color: colors.debugText,
    flexShrink: 1,
  },
  appLogMeta: {
    fontSize: 9,
    color: colors.debugText,
    opacity: 0.5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    overflow: 'hidden',
  },

  // Muted text
  mutedText: {
    fontSize: 13,
    color: colors.debugText,
    opacity: 0.5,
    fontStyle: "italic",
  },

  // Action buttons
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.debugAccent,
    marginBottom: spacing.sm,
  },
  actionButtonActive: {
    backgroundColor: "rgba(239,68,68,0.2)",
    borderColor: colors.error,
  },
  actionButtonText: {
    fontSize: 14,
    color: colors.debugText,
    fontWeight: "600",
  },

  // Spacer
  spacer: {
    height: 60,
  },
});
