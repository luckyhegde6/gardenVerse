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
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, TYPOGRAPHY } from "../../styles/tokens";
import { Group } from "../../types";

interface CommunityGroupCardProps {
  group: Group;
  onPress: () => void;
  onJoin?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function getCategoryEmoji(type: string): string {
  switch (type.toLowerCase()) {
    case "regional":
      return "🌍";
    case "topic":
      return "💬";
    case "events":
      return "🎉";
    default:
      return "👥";
  }
}

function getCategoryColor(type: string): string {
  switch (type.toLowerCase()) {
    case "regional":
      return COLORS.skyBlue;
    case "topic":
      return COLORS.skyBlue;
    case "events":
      return COLORS.sunYellow;
    default:
      return COLORS.primary;
  }
}

function CommunityGroupCardComponent({ group, onPress, onJoin }: CommunityGroupCardProps) {
  const [imageError, setImageError] = useState(false);
  const scale = useSharedValue(1);
  const joinScale = useSharedValue(1);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedJoinStyle = useAnimatedStyle(() => ({
    transform: [{ scale: joinScale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handleJoinPressIn = useCallback(() => {
    joinScale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  }, [joinScale]);

  const handleJoinPressOut = useCallback(() => {
    joinScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [joinScale]);

  const handleJoinPress = useCallback(() => {
    onJoin?.();
  }, [onJoin]);

  const showImage = group.imageUrl && !imageError;
  const categoryEmoji = getCategoryEmoji(group.type);
  const categoryColor = getCategoryColor(group.type);
  const isJoined = group.isJoined ?? false;

  return (
    <AnimatedPressable
      style={[styles.card, animatedCardStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
    >
      <View style={styles.row}>
        {/* Image / Fallback */}
        <View style={styles.imageContainer}>
          {showImage ? (
            <Image
              source={{ uri: group.imageUrl }}
              style={styles.image}
              onError={() => setImageError(true)}
            />
          ) : (
            <View
              style={[
                styles.imageFallback,
                { backgroundColor: categoryColor + "20" },
              ]}
            >
              <Text style={styles.imageEmoji}>{categoryEmoji}</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {group.name}
          </Text>
          {group.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {group.description}
            </Text>
          ) : null}
          <View style={styles.metaRow}>
            <Text style={styles.metaIcon}>👥</Text>
            <Text style={styles.metaText}>
              {group.memberCount} {group.memberCount === 1 ? "member" : "members"}
            </Text>
            {group.region ? (
              <>
                <Text style={styles.metaIcon}>📍</Text>
                <Text style={styles.metaText} numberOfLines={1}>
                  {group.region}
                </Text>
              </>
            ) : null}
          </View>
        </View>

        {/* Join Button */}
        {onJoin ? (
          <AnimatedPressable
            style={[
              styles.joinButton,
              isJoined ? styles.joinedButton : styles.notJoinedButton,
              animatedJoinStyle,
            ]}
            onPress={handleJoinPress}
            onPressIn={handleJoinPressIn}
            onPressOut={handleJoinPressOut}
            accessibilityRole="button"
            accessibilityLabel={isJoined ? "Leave group" : "Join group"}
          >
            <Text
              style={[
                styles.joinButtonText,
                isJoined ? styles.joinedText : styles.notJoinedText,
              ]}
            >
              {isJoined ? "Joined" : "Join"}
            </Text>
          </AnimatedPressable>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

export const CommunityGroupCard = React.memo(CommunityGroupCardComponent);

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
  imageContainer: {
    marginRight: SPACING.md,
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
  },
  imageFallback: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
    justifyContent: "center",
  },
  imageEmoji: {
    fontSize: 28,
  },
  infoContainer: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  name: {
    ...TYPOGRAPHY.body,
    fontWeight: "600",
    color: COLORS.text,
  },
  description: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  metaIcon: {
    fontSize: 12,
  },
  metaText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginRight: SPACING.sm,
  },
  joinButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  notJoinedButton: {
    backgroundColor: COLORS.primary,
  },
  joinedButton: {
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  joinButtonText: {
    ...TYPOGRAPHY.label,
    fontWeight: "600",
  },
  notJoinedText: {
    color: COLORS.white,
  },
  joinedText: {
    color: COLORS.text,
  },
});

export default CommunityGroupCard;
