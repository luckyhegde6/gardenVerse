import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { WeatherData } from "@/types";
import { spacing, borderRadius } from "@/styles/theme";

// ─── Types ──────────────────────────────────────────────────────────────────

interface WeatherBarProps {
  weather: WeatherData | null;
  timezone?: string;
}

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

function getConditionBgColor(condition: string): string {
  const c = condition.toLowerCase();
  if (c.includes("thunder") || c.includes("storm")) return "rgba(139, 92, 246, 0.25)";
  if (c.includes("rain") || c.includes("drizzle") || c.includes("shower"))
    return "rgba(59, 130, 246, 0.20)";
  if (c.includes("snow") || c.includes("sleet") || c.includes("ice"))
    return "rgba(186, 230, 253, 0.20)";
  if (c.includes("fog") || c.includes("mist") || c.includes("haze"))
    return "rgba(148, 163, 184, 0.20)";
  if (c.includes("cloud") || c.includes("overcast")) return "rgba(100, 116, 139, 0.20)";
  if (c.includes("partly") || c.includes("mostly cloud")) return "rgba(251, 191, 36, 0.15)";
  if (c.includes("clear") || c.includes("sunny")) return "rgba(250, 204, 21, 0.20)";
  return "rgba(255, 255, 255, 0.08)";
}

function getLocalTime(timezone?: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: timezone,
      hour12: true,
    });
    return formatter.format(now);
  } catch {
    // Fallback: local time when an invalid timezone is provided
    return new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }
}

function getTimezoneAbbreviation(timezone?: string): string {
  if (!timezone) return "";
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short",
    });
    const parts = formatter.formatToParts(new Date());
    const tzPart = parts.find((p) => p.type === "timeZoneName");
    return tzPart?.value ?? "";
  } catch {
    return "";
  }
}

// ─── Sub-Components ─────────────────────────────────────────────────────────

function getDisplayTemp(temp: number | { min: number; max: number }): number {
  if (typeof temp === "number") return Math.round(temp);
  return Math.round((temp.min + temp.max) / 2);
}

function ForecastChip({ forecast }: { forecast: WeatherData["forecast"][0] }) {
  const date = new Date(forecast.date);
  const dayLabel = date.toLocaleDateString("en-US", { weekday: "short" });

  return (
    <View style={styles.forecastChip}>
      <Text style={styles.forecastDay}>{dayLabel}</Text>
      <Text style={styles.forecastEmoji}>
        {getConditionEmoji(forecast.condition)}
      </Text>
      <Text style={styles.forecastTemp}>
        {getDisplayTemp(forecast.temperature)}°
      </Text>
    </View>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function WeatherBar({ weather, timezone }: WeatherBarProps) {
  if (!weather) return null;

  const bgColor = getConditionBgColor(weather.condition);
  const localTime = getLocalTime(timezone);
  const tzAbbr = getTimezoneAbbreviation(timezone);

  return (
    <View style={styles.container}>
      {/* Background gradient layers */}
      <View style={[styles.bgLayer, { backgroundColor: bgColor }]} />
      <View style={[styles.bgLayerSecondary, { backgroundColor: "rgba(255,255,255,0.04)" }]} />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        bounces={false}
      >
        {/* Condition emoji + temperature */}
        <View style={styles.primaryBlock}>
          <Text style={styles.conditionEmoji}>
            {getConditionEmoji(weather.condition)}
          </Text>
          <View style={styles.primaryInfo}>
            <Text style={styles.temperature}>
              {Math.round(weather.temperature)}°
            </Text>
            <Text style={styles.conditionLabel} numberOfLines={1}>
              {weather.condition}
            </Text>
          </View>
        </View>

        {/* Vertical divider */}
        <View style={styles.divider} />

        {/* Humidity */}
        <View style={styles.statBlock}>
          <Text style={styles.statIcon}>💧</Text>
          <View>
            <Text style={styles.statValue}>{Math.round(weather.humidity)}%</Text>
            <Text style={styles.statLabel}>Humidity</Text>
          </View>
        </View>

        {/* Vertical divider */}
        <View style={styles.divider} />

        {/* Rain */}
        <View style={styles.statBlock}>
          <Text style={styles.statIcon}>🌧️</Text>
          <View>
            <Text style={styles.statValue}>
              {weather.rainfall > 0 ? `${weather.rainfall.toFixed(1)}mm` : "—"}
            </Text>
            <Text style={styles.statLabel}>Rainfall</Text>
          </View>
        </View>

        {/* Vertical divider */}
        <View style={styles.divider} />

        {/* Timezone clock */}
        <View style={styles.statBlock}>
          <Text style={styles.statIcon}>🕐</Text>
          <View>
            <Text style={styles.statValue}>{localTime}</Text>
            <Text style={styles.statLabel}>{tzAbbr || "Local"}</Text>
          </View>
        </View>

        {/* Forecast chips */}
        {weather.forecast && weather.forecast.length > 0 && (
          <>
            <View style={styles.divider} />
            {weather.forecast.map((f, idx) => (
              <ForecastChip key={f.date || idx} forecast={f} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: "relative",
    borderRadius: borderRadius.md,
    overflow: "hidden",
  },
  bgLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  bgLayerSecondary: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.sm,
  },

  // Primary block: emoji + temp + condition
  primaryBlock: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  conditionEmoji: {
    fontSize: 28,
    marginRight: spacing.sm,
  },
  primaryInfo: {
    alignItems: "flex-start",
  },
  temperature: {
    fontSize: 22,
    fontWeight: "800",
    color: "#f8fafc",
    lineHeight: 26,
  },
  conditionLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "rgba(255,255,255,0.65)",
    maxWidth: 80,
  },

  // Vertical divider
  divider: {
    width: 1,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginHorizontal: spacing.sm,
  },

  // Stat block
  statBlock: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacing.sm - 2,
  },
  statIcon: {
    fontSize: 18,
    marginRight: spacing.xs + 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#f8fafc",
  },
  statLabel: {
    fontSize: 10,
    fontWeight: "500",
    color: "rgba(255,255,255,0.55)",
  },

  // Forecast chip
  forecastChip: {
    alignItems: "center",
    marginHorizontal: spacing.xs,
    paddingHorizontal: spacing.sm - 2,
    paddingVertical: spacing.xs,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: borderRadius.sm,
    minWidth: 44,
  },
  forecastDay: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.55)",
    marginBottom: 2,
  },
  forecastEmoji: {
    fontSize: 16,
    marginBottom: 2,
  },
  forecastTemp: {
    fontSize: 12,
    fontWeight: "700",
    color: "#f8fafc",
  },
});
