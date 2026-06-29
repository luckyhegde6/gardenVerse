import React, { useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  SHADOWS,
  BORDER_RADIUS,
} from "@/styles/tokens";
import { CommunityEvent } from "@/types";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface EventCardProps {
  event: CommunityEvent;
  onPress: () => void;
  onParticipate?: () => void;
}

function formatDateBadge(dateStr: string): { day: string; month: string } {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return { day: "--", month: "---" };
    }
    const day = date.getDate().toString();
    const month = date.toLocaleString("en-US", { month: "short" });
    return { day, month };
  } catch {
    return { day: "--", month: "---" };
  }
}

function formatParticipantCount(count?: number): string {
  if (count === undefined || count === null) return "";
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toString();
}

function EventCardComponent({ event, onPress, onParticipate }: EventCardProps) {
  const scale = useSharedValue(1);
  const buttonScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handleButtonPressIn = useCallback(() => {
    buttonScale.value = withSpring(0.96, { damping: 15, stiffness: 300 });
  }, [buttonScale]);

  const handleButtonPressOut = useCallback(() => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [buttonScale]);

  const { day, month } = formatDateBadge(event.date);
  const participantText = formatParticipantCount(event.participants);

  return (
    <AnimatedPressable
      style={[styles.container, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityLabel={`${event.title}, ${month} ${day}`}
    >
      <View style={styles.header}>
        <View style={styles.dateBadge}>
          <Text style={styles.dateDay}>{day}</Text>
          <Text style={styles.dateMonth}>{month}</Text>
        </View>

        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={2}>
            {event.title}
          </Text>
          {event.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {event.description}
            </Text>
          ) : null}
        </View>
      </View>

      {event.rewards && event.rewards.length > 0 ? (
        <View style={styles.rewardsRow}>
          {event.rewards.map((reward, index) => (
            <View key={`${reward}-${index}`} style={styles.rewardChip}>
              <Text style={styles.rewardChipText}>{reward}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.footer}>
        <View style={styles.participantsRow}>
          <Text style={styles.participantsIcon}>👥</Text>
          {participantText ? (
            <Text style={styles.participantsText}>
              {participantText} participant{event.participants !== 1 ? "s" : ""}
            </Text>
          ) : (
            <Text style={styles.participantsText}>No participants yet</Text>
          )}
        </View>

        {onParticipate ? (
          <AnimatedPressable
            style={[styles.participateButton, buttonAnimatedStyle]}
            onPress={(e: any) => {
              e.stopPropagation?.();
              onParticipate();
            }}
            onPressIn={handleButtonPressIn}
            onPressOut={handleButtonPressOut}
            accessibilityRole="button"
            accessibilityLabel="Participate in event"
          >
            <Text style={styles.participateButtonText}>Participate</Text>
          </AnimatedPressable>
        ) : null}
      </View>
    </AnimatedPressable>
  );
}

export const EventCard = React.memo(EventCardComponent);
export default EventCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  dateBadge: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  dateDay: {
    ...TYPOGRAPHY.headingS,
    color: COLORS.white,
    fontWeight: "700",
    lineHeight: 22,
  },
  dateMonth: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: "600",
    textTransform: "uppercase",
    lineHeight: 14,
  },
  headerText: {
    flex: 1,
    gap: SPACING.xs,
  },
  title: {
    ...TYPOGRAPHY.headingS,
    color: COLORS.text,
  },
  description: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.textSecondary,
  },
  rewardsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.xs,
    marginTop: SPACING.md,
  },
  rewardChip: {
    backgroundColor: COLORS.surfaceVariant,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
  },
  rewardChipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COLORS.border,
  },
  participantsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  participantsIcon: {
    fontSize: 14,
  },
  participantsText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
  },
  participateButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm - 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  participateButtonText: {
    ...TYPOGRAPHY.label,
    color: COLORS.white,
    fontWeight: "600",
  },
});
