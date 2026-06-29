import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from "../../styles/tokens";

interface SyncWidgetProps {
  isOnline?: boolean;
  moisture?: number;
  humidity?: number;
  temperature?: number;
  lastSync?: string;
}

function getRelativeTime(isoDate: string): string {
  const now = Date.now();
  const date = new Date(isoDate).getTime();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function SyncWidget({
  isOnline = false,
  moisture,
  humidity,
  temperature,
  lastSync,
}: SyncWidgetProps) {
  const relativeTime = useMemo(() => {
    if (!lastSync) return null;
    try {
      return getRelativeTime(lastSync);
    } catch {
      return null;
    }
  }, [lastSync]);

  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>IoT Sensors</Text>
        <View style={[styles.statusDot, { backgroundColor: isOnline ? COLORS.leafGreen : COLORS.textMuted }]} />
      </View>
      {isOnline ? (
        <View style={styles.valuesRow}>
          <Text style={styles.valueItem}>{'\uD83D\uDCA7'} {moisture ?? "--"}%</Text>
          <Text style={styles.separator}>|</Text>
          <Text style={styles.valueItem}>{'\uD83D\uDCA8'} {humidity ?? "--"}%</Text>
          <Text style={styles.separator}>|</Text>
          <Text style={styles.valueItem}>{'\uD83C\uDF21\uFE0F'} {temperature ?? "--"}{'\u00B0'}</Text>
        </View>
      ) : (
        <Text style={styles.offlineText}>Offline</Text>
      )}
      {relativeTime ? (
        <Text style={styles.syncTime}>Last sync: {relativeTime}</Text>
      ) : null}
    </Animated.View>
  );
}

export default SyncWidget;

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    ...SHADOWS.sm as Record<string, unknown>,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.xs,
  },
  headerLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.text,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  valuesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  valueItem: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  separator: {
    color: COLORS.border,
    fontSize: 12,
  },
  offlineText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  syncTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: SPACING.xs,
  },
});
