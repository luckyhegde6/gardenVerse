import React, { useEffect } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  StyleSheet,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from "react-native-reanimated";
import { useThemeColors, COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from "@/styles/tokens";
import { LeaderboardEntry } from "@/types";

interface LeaderboardCardProps {
  entry: LeaderboardEntry;
  index: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function getRankBadge(rank: number): string {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

function getRankColor(rank: number, textSecondaryColor: string): string {
  if (rank === 1) return "#d4a017";
  if (rank === 2) return "#9ca3af";
  if (rank === 3) return "#cd7f32";
  return textSecondaryColor;
}

function formatScore(score: number): string {
  if (score >= 1_000_000) return `${(score / 1_000_000).toFixed(1)}M`;
  if (score >= 1_000) return `${(score / 1_000).toFixed(1)}K`;
  return score.toLocaleString();
}

function getInitials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getColorFromName(name: string | undefined, colors: { primary: string; skyBlue: string }): string {
  if (!name) return "#9ca3af";
  const avatarColors = [
    colors.primary,
    "#15803d",
    "#166534",
    colors.skyBlue,
    "#14b8a6",
    "#ca8a04",
    "#a16207",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function LeaderboardCardComponent({ entry, index }: LeaderboardCardProps) {
  const colors = useThemeColors();
  const [imageError, setImageError] = React.useState(false);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    const delay = index * 80;
    opacity.value = withDelay(delay, withSpring(1, { damping: 18, stiffness: 200 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 18, stiffness: 200 }));
  }, [index, opacity, translateY]);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const displayName = entry.displayName || entry.username;
  const showImage = entry.avatarUrl && !imageError;
  const bgColor = getColorFromName(displayName, colors);
  const isTopThree = entry.rank <= 3;
  const rankColor = getRankColor(entry.rank, colors.textSecondary);
  const rankBadge = getRankBadge(entry.rank);
  const formattedScore = formatScore(entry.score);

  return (
    <AnimatedPressable
      style={[styles.card, { backgroundColor: colors.surface }, animatedCardStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
    >
      <View style={styles.row}>
        {/* Rank Badge */}
        <View style={styles.rankContainer}>
          {isTopThree ? (
            <Text style={styles.rankEmoji}>{rankBadge}</Text>
          ) : (
            <View style={[styles.rankNumberBadge, { backgroundColor: rankColor }]}>
              <Text style={[styles.rankNumberText, { color: colors.white }]}>{rankBadge}</Text>
            </View>
          )}
        </View>

        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {showImage ? (
            <Image
              source={{ uri: entry.avatarUrl }}
              style={styles.avatar}
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: bgColor }]}>
              <Text style={[styles.avatarInitials, { color: colors.white }]}>{getInitials(displayName)}</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Text style={[styles.username, { color: colors.text }]} numberOfLines={1}>
            {entry.username}
          </Text>
          {entry.displayName ? (
            <Text style={[styles.displayName, { color: colors.textSecondary }]} numberOfLines={1}>
              {entry.displayName}
            </Text>
          ) : null}
          {entry.level != null ? (
            <View style={styles.levelRow}>
              <Text style={styles.levelIcon}>⭐</Text>
              <Text style={[styles.levelText, { color: colors.textSecondary }]}>Level {entry.level}</Text>
            </View>
          ) : null}
        </View>

        {/* Score */}
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreValue, { color: rankColor }]}>
            {formattedScore}
          </Text>
          <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>pts</Text>
        </View>
      </View>
    </AnimatedPressable>
  );
}

export const LeaderboardCard = React.memo(LeaderboardCardComponent);

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  rankContainer: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.sm,
  },
  rankEmoji: {
    fontSize: 28,
  },
  rankNumberBadge: {
    width: 32,
    height: 24,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  rankNumberText: {
    ...TYPOGRAPHY.caption,
    fontWeight: "700",
    color: COLORS.white,
  },
  avatarContainer: {
    marginRight: SPACING.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    ...TYPOGRAPHY.caption,
    fontWeight: "700",
    color: COLORS.white,
  },
  infoContainer: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  username: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: "600",
    color: COLORS.text,
  },
  displayName: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  levelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.xs,
    gap: SPACING.xs,
  },
  levelIcon: {
    fontSize: 12,
  },
  levelText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  scoreContainer: {
    alignItems: "flex-end",
    minWidth: 60,
  },
  scoreValue: {
    ...TYPOGRAPHY.headingS,
    fontWeight: "700",
  },
  scoreLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: -2,
  },
});

export default LeaderboardCard;
