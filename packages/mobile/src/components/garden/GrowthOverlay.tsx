import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Crop, Garden, WeatherData, CropStatus } from "../../types";
import { GrowthState } from "../../services/growthEngine";
import { spacing, borderRadius } from "../../styles/theme";

// ─── Types ──────────────────────────────────────────────────────────────────

interface GrowthOverlayProps {
  crop: Crop | null;
  garden: Garden | null;
  weather: WeatherData | null;
  engineState: GrowthState | null;
  isVirtual: boolean;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const VIRTUAL_TICK_GAME_MINUTES = 50;
const REAL_TICK_GAME_MINUTES = 0.5;

// ─── Helpers ────────────────────────────────────────────────────────────────

function getConditionEmoji(condition: string): string {
  const c = condition.toLowerCase();
  if (c.includes("thunder") || c.includes("storm")) return "⛈️";
  if (c.includes("rain") || c.includes("drizzle") || c.includes("shower"))
    return "🌧️";
  if (c.includes("snow") || c.includes("sleet") || c.includes("ice"))
    return "❄️";
  if (c.includes("fog") || c.includes("mist") || c.includes("haze"))
    return "🌫️";
  if (c.includes("wind") || c.includes("gust")) return "💨";
  if (c.includes("cloud") || c.includes("overcast")) return "☁️";
  if (c.includes("partly") || c.includes("mostly cloud")) return "⛅";
  if (c.includes("clear") || c.includes("sunny")) return "☀️";
  return "🌤️";
}

function getStatusColor(status: CropStatus): string {
  switch (status) {
    case CropStatus.SEED:
      return "#a78bfa";
    case CropStatus.SPROUTING:
      return "#60a5fa";
    case CropStatus.GROWING:
      return "#34d399";
    case CropStatus.MATURE:
      return "#fbbf24";
    case CropStatus.HARVESTED:
      return "#9ca3af";
    case CropStatus.WILTED:
      return "#ef4444";
    case CropStatus.DISEASED:
      return "#f97316";
    default:
      return "#94a3b8";
  }
}

function getStatusLabel(status: CropStatus): string {
  switch (status) {
    case CropStatus.SEED:
      return "Seed";
    case CropStatus.SPROUTING:
      return "Sprouting";
    case CropStatus.GROWING:
      return "Growing";
    case CropStatus.MATURE:
      return "Mature";
    case CropStatus.HARVESTED:
      return "Harvested";
    case CropStatus.WILTED:
      return "Wilted";
    case CropStatus.DISEASED:
      return "Diseased";
    default:
      return "Unknown";
  }
}

function getBarColor(value: number): string {
  if (value >= 60) return "#22c55e";
  if (value >= 30) return "#f59e0b";
  return "#ef4444";
}

function formatGameTime(ticksElapsed: number, isVirtual: boolean): string {
  const minutesPerTick = isVirtual ? VIRTUAL_TICK_GAME_MINUTES : REAL_TICK_GAME_MINUTES;
  const totalGameMinutes = ticksElapsed * minutesPerTick;
  const gameDays = Math.floor(totalGameMinutes / (24 * 60));
  const gameHours = Math.floor((totalGameMinutes % (24 * 60)) / 60);
  const gameMins = Math.round(totalGameMinutes % 60);

  if (gameDays > 0) {
    return `Day ${gameDays}, ${String(gameHours).padStart(2, "0")}:${String(gameMins).padStart(2, "0")}`;
  }
  return `${gameHours}h ${gameMins}m`;
}

function formatDaysSince(isoString: string): string {
  const planted = new Date(isoString).getTime();
  const now = Date.now();
  const diffMs = now - planted;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays < 1) {
    const hours = Math.round(diffDays * 24);
    return `${hours}h ago`;
  }
  return `${diffDays.toFixed(1)}d ago`;
}

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeAgo(isoString: string | undefined): string {
  if (!isoString) return "—";
  const then = new Date(isoString).getTime();
  const now = Date.now();
  const diffMs = now - then;
  if (diffMs < 0) return "just now";
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

function estimatedTimeToNextStage(growthStage: number): string {
  if (growthStage >= 100) return "Ready to harvest!";
  const remaining = 100 - growthStage;
  const estTicks = Math.ceil(remaining / 1.39);
  const estMinutes = estTicks * 0.5;
  if (estMinutes < 60) return `~${estMinutes}m`;
  const estHours = Math.round(estMinutes / 60);
  if (estHours < 24) return `~${estHours}h`;
  return `~${Math.round(estHours / 24)}d`;
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function ProgressBar({
  value,
  color,
  backgroundColor: _bgColor = "rgba(255,255,255,0.15)",
}: {
  value: number;
  color: string;
  backgroundColor?: string;
}) {
  void _bgColor;
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <View style={styles.progressBarTrack}>
      <View
        style={[
          styles.progressBarFill,
          {
            width: `${clamped}%` as unknown as number,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

function WeatherStrip({ weather }: { weather: WeatherData | null }) {
  if (!weather) return null;

  return (
    <View style={styles.weatherStrip}>
      <Text style={styles.weatherEmoji}>
        {getConditionEmoji(weather.condition)}
      </Text>
      <Text style={styles.weatherTemp}>{Math.round(weather.temperature)}°</Text>
      <View style={styles.weatherDivider} />
      <Text style={styles.weatherLabel}>Humidity</Text>
      <Text style={styles.weatherValue}>{Math.round(weather.humidity)}%</Text>
      <View style={styles.weatherDivider} />
      <Text style={styles.weatherLabel}>Condition</Text>
      <Text style={styles.weatherValue} numberOfLines={1}>
        {weather.condition}
      </Text>
    </View>
  );
}

function CropStatusCard({ crop }: { crop: Crop }) {
  const growthPct = Math.min(100, crop.growthStage);

  return (
    <View style={styles.cropCard}>
      {/* Name + Status badge */}
      <View style={styles.cropHeader}>
        <Text style={styles.cropName} numberOfLines={1}>
          {crop.name}
        </Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(crop.status) + "30" },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: getStatusColor(crop.status) },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(crop.status) },
            ]}
          >
            {getStatusLabel(crop.status)}
          </Text>
        </View>
      </View>

      {/* Growth stage progress */}
      <View style={styles.sectionRow}>
        <Text style={styles.sectionLabel}>Growth Stage</Text>
        <Text style={styles.sectionValue}>{Math.round(growthPct)}%</Text>
      </View>
      <ProgressBar
        value={growthPct}
        color={getStatusColor(crop.status)}
        backgroundColor="rgba(255,255,255,0.12)"
      />
      <View style={styles.stageLabels}>
        <Text style={[styles.stageLabel, growthPct <= 0 && styles.stageLabelActive]}>SEED</Text>
        <Text style={[styles.stageLabel, growthPct > 0 && growthPct <= 50 && styles.stageLabelActive]}>SPROUTING</Text>
        <Text style={[styles.stageLabel, growthPct > 50 && growthPct < 100 && styles.stageLabelActive]}>GROWING</Text>
        <Text style={[styles.stageLabel, growthPct >= 100 && styles.stageLabelActive]}>MATURE</Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Days info */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Planted</Text>
          <Text style={styles.infoValue}>
            {formatDaysSince(crop.plantedAt)}
          </Text>
        </View>
        {crop.estimatedHarvest && (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Est. Harvest</Text>
            <Text style={styles.infoValue}>
              {formatDate(crop.estimatedHarvest)}
            </Text>
          </View>
        )}
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Streak</Text>
          <Text style={styles.infoValue}>
            {crop.careStreak > 0 ? `🔥 ${crop.careStreak}d` : "—"}
          </Text>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Health bar */}
      <View style={styles.barRow}>
        <View style={styles.barLabelRow}>
          <View style={styles.barIconContainer}>
            <View style={[styles.barIcon, { backgroundColor: getBarColor(crop.health) }]} />
          </View>
          <Text style={styles.barLabel}>Health</Text>
        </View>
        <Text style={[styles.barValue, { color: getBarColor(crop.health) }]}>
          {Math.round(crop.health)}%
        </Text>
      </View>
      <ProgressBar value={crop.health} color={getBarColor(crop.health)} />

      {/* Hydration bar */}
      <View style={[styles.barRow, styles.barRowOffset]}>
        <View style={styles.barLabelRow}>
          <View style={styles.barIconContainer}>
            <View style={[styles.barIcon, { backgroundColor: getBarColor(crop.hydration) }]} />
          </View>
          <Text style={styles.barLabel}>Hydration</Text>
        </View>
        <Text style={[styles.barValue, { color: getBarColor(crop.hydration) }]}>
          {Math.round(crop.hydration)}%
        </Text>
      </View>
      <ProgressBar value={crop.hydration} color={getBarColor(crop.hydration)} />

      {/* Nutrient bar */}
      <View style={[styles.barRow, styles.barRowOffset]}>
        <View style={styles.barLabelRow}>
          <View style={styles.barIconContainer}>
            <View style={[styles.barIcon, { backgroundColor: getBarColor(crop.nutrientLevel) }]} />
          </View>
          <Text style={styles.barLabel}>Nutrient</Text>
        </View>
        <Text style={[styles.barValue, { color: getBarColor(crop.nutrientLevel) }]}>
          {Math.round(crop.nutrientLevel)}%
        </Text>
      </View>
      <ProgressBar
        value={crop.nutrientLevel}
        color={getBarColor(crop.nutrientLevel)}
      />

      {/* Divider */}
      <View style={styles.divider} />

      {/* Time tracking section */}
      <Text style={styles.sectionTitle}>Time Tracking</Text>
      <View style={styles.timingRow}>
        <Text style={styles.timingLabel}>Last Watered</Text>
        <Text style={styles.timingValue}>
          {formatTimeAgo(crop.lastWateredAt)}
        </Text>
      </View>
      <View style={styles.timingRow}>
        <Text style={styles.timingLabel}>Last Fertilized</Text>
        <Text style={styles.timingValue}>
          {formatTimeAgo(crop.lastFertilizedAt)}
        </Text>
      </View>
      <View style={styles.timingRow}>
        <Text style={styles.timingLabel}>Planted</Text>
        <Text style={styles.timingValue}>
          {formatDaysSince(crop.plantedAt)}
        </Text>
      </View>
      <View style={styles.timingRow}>
        <Text style={styles.timingLabel}>Est. Next Stage</Text>
        <Text style={styles.timingValue}>
          {estimatedTimeToNextStage(crop.growthStage)}
        </Text>
      </View>
      {crop.estimatedHarvest && (
        <View style={styles.timingRow}>
          <Text style={styles.timingLabel}>Est. Harvest Date</Text>
          <Text style={styles.timingValue}>
            {formatDate(crop.estimatedHarvest)}
          </Text>
        </View>
      )}
    </View>
  );
}

function GameTimePanel({
  engineState,
  isVirtual,
}: {
  engineState: GrowthState | null;
  isVirtual: boolean;
}) {
  if (!engineState) return null;

  const ticksElapsed = engineState.ticksElapsed;
  const speedLabel = isVirtual ? "100×" : "1×";
  const gameTime = formatGameTime(ticksElapsed, isVirtual);

  return (
    <View style={styles.gameTimePanel}>
      <View style={styles.gameTimeRow}>
        <Text style={styles.gameTimeLabel}>Game Time</Text>
        <Text style={styles.gameTimeValue}>{gameTime}</Text>
      </View>
      <View style={styles.gameTimeRow}>
        <Text style={styles.gameTimeLabel}>Ticks Elapsed</Text>
        <Text style={styles.gameTimeValue}>{ticksElapsed}</Text>
      </View>
      <View style={styles.gameTimeRow}>
        <Text style={styles.gameTimeLabel}>Speed</Text>
        <Text style={styles.gameTimeValueHighlight}>{speedLabel}</Text>
      </View>
    </View>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function GrowthOverlay({
  crop,
  garden,
  weather,
  engineState,
  isVirtual,
}: GrowthOverlayProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Top row: Garden name + virtual badge + game time */}
        <View style={styles.topRow}>
          <View style={styles.topRowLeft}>
            <Text style={styles.gardenName} numberOfLines={1}>
              {garden?.name ?? "My Garden"}
            </Text>
            {isVirtual && (
              <View style={styles.virtualBadge}>
                <Text style={styles.virtualBadgeText}>VIRTUAL</Text>
              </View>
            )}
          </View>
          {engineState && (
            <Text style={styles.gameTimeEstimate}>
              {formatGameTime(engineState.ticksElapsed, isVirtual)}
            </Text>
          )}
        </View>

        {/* Weather strip */}
        <WeatherStrip weather={weather} />

        {/* Crop status card (only when crop selected) */}
        {crop && <CropStatusCard crop={crop} />}

        {/* No crop selected hint */}
        {!crop && (
          <View style={styles.noCropContainer}>
            <Text style={styles.noCropIcon}>🌱</Text>
            <Text style={styles.noCropText}>
              Tap a crop to see its details
            </Text>
          </View>
        )}

        {/* Game time panel */}
        {engineState && <GameTimePanel engineState={engineState} isVirtual={isVirtual} />}
      </ScrollView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: 340,
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  scrollView: {
    maxHeight: 340,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg + 8,
  },

  // Top row
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  topRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: spacing.sm,
  },
  gardenName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#f8fafc",
    flexShrink: 1,
  },
  virtualBadge: {
    marginLeft: spacing.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: "rgba(96, 165, 250, 0.25)",
    borderRadius: borderRadius.full,
  },
  virtualBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#60a5fa",
    letterSpacing: 0.5,
  },
  gameTimeEstimate: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94a3b8",
  },

  // Weather strip
  weatherStrip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm - 2,
    marginBottom: spacing.sm,
  },
  weatherEmoji: {
    fontSize: 18,
    marginRight: spacing.xs + 2,
  },
  weatherTemp: {
    fontSize: 15,
    fontWeight: "700",
    color: "#f8fafc",
    marginRight: spacing.sm,
  },
  weatherDivider: {
    width: 1,
    height: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginHorizontal: spacing.sm - 2,
  },
  weatherLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#94a3b8",
    marginRight: spacing.xs,
  },
  weatherValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#e2e8f0",
    maxWidth: 100,
  },

  // Crop card
  cropCard: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.sm,
  },
  cropHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  cropName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#f8fafc",
    flex: 1,
    marginRight: spacing.sm,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },

  // Growth stage section
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#cbd5e1",
  },
  sectionValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#e2e8f0",
  },
  stageLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  stageLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: "rgba(148, 163, 184, 0.5)",
    letterSpacing: 0.3,
  },
  stageLabelActive: {
    color: "#94a3b8",
  },

  // Info row
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoItem: {
    alignItems: "center",
    flex: 1,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: "#64748b",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#e2e8f0",
  },

  // Progress bars
  progressBarTrack: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },

  // Bar rows (health, hydration, nutrient)
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  barRowOffset: {
    marginTop: spacing.sm - 2,
  },
  barLabelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  barIconContainer: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  barIcon: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#cbd5e1",
  },
  barValue: {
    fontSize: 12,
    fontWeight: "700",
  },

  // No crop selected
  noCropContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: borderRadius.md,
  },
  noCropIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  noCropText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#64748b",
  },

  // Time tracking rows
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94a3b8",
    marginBottom: spacing.xs + 2,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  timingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  timingLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748b",
  },
  timingValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#e2e8f0",
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: spacing.sm,
  },

  // Game time panel
  gameTimePanel: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
  },
  gameTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  gameTimeLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#94a3b8",
  },
  gameTimeValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#e2e8f0",
  },
  gameTimeValueHighlight: {
    fontSize: 13,
    fontWeight: "700",
    color: "#60a5fa",
  },
});
