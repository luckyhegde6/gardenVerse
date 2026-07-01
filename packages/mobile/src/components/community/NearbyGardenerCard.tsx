import React, { useState, useCallback } from "react";
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
} from "react-native-reanimated";
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from "@/styles/tokens";
import { NearbyGardener } from "@/types";

interface NearbyGardenerCardProps {
  gardener: NearbyGardener;
  isFollowing: boolean;
  onFollow: () => void;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function formatLocation(gardener: NearbyGardener): string | null {
  if (gardener.latitude != null && gardener.longitude != null) {
    return `${gardener.latitude.toFixed(2)}°, ${gardener.longitude.toFixed(2)}°`;
  }
  return null;
}

function getSustainabilityColor(score: number): string {
  if (score >= 80) return COLORS.leafGreen;
  if (score >= 50) return COLORS.skyBlue;
  if (score >= 20) return COLORS.sunYellow;
  return COLORS.dangerRed;
}

const avatarColors = [
  COLORS.primary,
  "#15803d",
  "#166534",
  "#14532d",
  COLORS.skyBlue,
  "#14b8a6",
  "#ca8a04",
  "#a16207",
];

function getColorFromName(name?: string): string {
  if (!name) return "#9ca3af";
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

function NearbyGardenerCardComponent({
  gardener,
  isFollowing,
  onFollow,
  onPress,
}: NearbyGardenerCardProps) {
  const [imageError, setImageError] = useState(false);
  const scale = useSharedValue(1);
  const followScale = useSharedValue(1);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedFollowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: followScale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handleFollowPressIn = useCallback(() => {
    followScale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  }, [followScale]);

  const handleFollowPressOut = useCallback(() => {
    followScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [followScale]);

  const handleFollowPress = useCallback(() => {
    onFollow();
  }, [onFollow]);

  const displayName = gardener.displayName || gardener.username;
  const location = formatLocation(gardener);
  const showImage = gardener.avatarUrl && !imageError;
  const bgColor = getColorFromName(displayName);
  const sustainabilityColor = getSustainabilityColor(gardener.sustainabilityScore);

  return (
    <AnimatedPressable
      style={[styles.card, animatedCardStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
    >
      <View style={styles.row}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {showImage ? (
            <Image
              source={{ uri: gardener.avatarUrl }}
              style={styles.avatar}
              onError={() => setImageError(true)}
            />
          ) : (
            <View style={[styles.avatarFallback, { backgroundColor: bgColor }]}>
              <Text style={styles.avatarEmoji}>🌱</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          {/* Name row */}
          <View style={styles.nameRow}>
            <View style={styles.nameGroup}>
              <Text style={styles.username} numberOfLines={1}>
                {gardener.username}
              </Text>
              {gardener.displayName ? (
                <Text style={styles.displayName} numberOfLines={1}>
                  {gardener.displayName}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Location */}
          {location ? (
            <Text style={styles.location} numberOfLines={1}>
              📍 {location}
            </Text>
          ) : null}

          {/* Sustainability Score */}
          <View style={styles.scoreRow}>
            <View style={styles.scoreBarTrack}>
              <View
                style={[
                  styles.scoreBarFill,
                  {
                    width: `${Math.min(gardener.sustainabilityScore, 100)}%`,
                    backgroundColor: sustainabilityColor,
                  },
                ]}
              />
            </View>
            <Text style={[styles.scoreLabel, { color: sustainabilityColor }]}>
              {gardener.sustainabilityScore}
            </Text>
          </View>
        </View>

        {/* Follow Button */}
        <AnimatedPressable
          style={[
            styles.followButton,
            isFollowing ? styles.followingButton : styles.notFollowingButton,
            animatedFollowStyle,
          ]}
          onPress={handleFollowPress}
          onPressIn={handleFollowPressIn}
          onPressOut={handleFollowPressOut}
          accessibilityRole="button"
          accessibilityLabel={isFollowing ? "Unfollow" : "Follow"}
        >
          <Text
            style={[
              styles.followButtonText,
              isFollowing ? styles.followingText : styles.notFollowingText,
            ]}
          >
            {isFollowing ? "Following" : "Follow"}
          </Text>
        </AnimatedPressable>
      </View>
    </AnimatedPressable>
  );
}

export const NearbyGardenerCard = React.memo(NearbyGardenerCardComponent);

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
  avatarContainer: {
    marginRight: SPACING.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: {
    fontSize: 20,
  },
  infoContainer: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  nameGroup: {
    flex: 1,
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
  location: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  scoreBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: BORDER_RADIUS.full,
    overflow: "hidden",
  },
  scoreBarFill: {
    height: "100%",
    borderRadius: BORDER_RADIUS.full,
  },
  scoreLabel: {
    ...TYPOGRAPHY.caption,
    fontWeight: "600",
    minWidth: 24,
    textAlign: "right",
  },
  followButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  notFollowingButton: {
    backgroundColor: COLORS.primary,
  },
  followingButton: {
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  followButtonText: {
    ...TYPOGRAPHY.label,
    fontWeight: "600",
  },
  notFollowingText: {
    color: COLORS.white,
  },
  followingText: {
    color: COLORS.text,
  },
});

export default NearbyGardenerCard;
