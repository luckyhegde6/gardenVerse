import React, { useCallback, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ListRenderItemInfo,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  SHADOWS,
  BORDER_RADIUS,
} from "../../styles/tokens";
import { ActivityEntry } from "../../types";

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<ActivityEntry>);

interface ActivityFeedProps {
  activities: ActivityEntry[];
  isLoading?: boolean;
}

const ACTIVITY_EMOJI: Record<ActivityEntry["type"], string> = {
  plant: "🌱",
  harvest: "🌾",
  water: "💧",
  fertilize: "🧪",
  badge: "🏆",
  levelup: "⬆️",
  trade: "🤝",
  join: "👋",
};

function getTypeEmoji(type: ActivityEntry["type"]): string {
  return ACTIVITY_EMOJI[type] || "📝";
}

function getAvatarFallback(username: string): string {
  return username.charAt(0).toUpperCase();
}

function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Unknown";

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();

    if (diffMs < 0) return "Just now";

    const seconds = Math.floor(diffMs / 1000);
    if (seconds < 60) return "Just now";

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;

    const month = date.toLocaleString("en-US", { month: "short" });
    const day = date.getDate();
    return `${month} ${day}`;
  } catch {
    return "Unknown";
  }
}

function ActivityRowComponent({ item }: { item: ActivityEntry }) {
  const avatarEmoji = item.avatarUrl ? null : getAvatarFallback(item.username);
  const typeEmoji = getTypeEmoji(item.type);

  return (
    <View style={styles.row}>
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarText}>
          {avatarEmoji || "👤"}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.textRow}>
          <Text style={styles.typeEmoji}>{typeEmoji}</Text>
          <Text style={styles.text} numberOfLines={2}>
            <Text style={styles.username}>{item.username}</Text>
            {" "}{item.text}
          </Text>
        </View>
        <Text style={styles.timestamp}>
          {formatRelativeTime(item.timestamp)}
        </Text>
      </View>
    </View>
  );
}

const ActivityRow = React.memo(ActivityRowComponent);

function LoadingSkeleton() {
  return (
    <View style={styles.loadingContainer}>
      {[1, 2, 3, 4, 5].map((key) => (
        <View key={key} style={styles.skeletonRow}>
          <View style={styles.skeletonAvatar} />
          <View style={styles.skeletonContent}>
            <View style={styles.skeletonLine} />
            <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
          </View>
        </View>
      ))}
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>🌿</Text>
      <Text style={styles.emptyText}>No recent activity</Text>
      <Text style={styles.emptySubtext}>
        Start gardening to see your activity here
      </Text>
    </View>
  );
}

function ActivityFeedComponent({
  activities,
  isLoading = false,
}: ActivityFeedProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
  }, [opacity]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ActivityEntry>) => (
      <ActivityRow item={item} />
    ),
    [],
  );

  const keyExtractor = useCallback((item: ActivityEntry) => item.id, []);

  if (isLoading) {
    return (
      <Animated.View style={[styles.wrapper, animatedContainerStyle]}>
        <Text style={styles.sectionTitle}>Activity</Text>
        <LoadingSkeleton />
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.wrapper, animatedContainerStyle]}>
      <Text style={styles.sectionTitle}>Activity</Text>
      {activities.length === 0 ? (
        <EmptyState />
      ) : (
        <AnimatedFlatList
          data={activities}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          scrollEnabled={false}
          ItemSeparatorComponent={Separator}
        />
      )}
    </Animated.View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

export const ActivityFeed = React.memo(ActivityFeedComponent);
export default ActivityFeed;

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.headingS,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.sm,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceVariant,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    ...TYPOGRAPHY.headingS,
    color: COLORS.textSecondary,
    fontWeight: "700",
  },
  content: {
    flex: 1,
    gap: 2,
  },
  textRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: SPACING.xs,
  },
  typeEmoji: {
    fontSize: 14,
    lineHeight: 20,
  },
  text: {
    ...TYPOGRAPHY.bodySmall,
    color: COLORS.text,
    flex: 1,
    lineHeight: 20,
  },
  username: {
    fontWeight: "600",
    color: COLORS.text,
  },
  timestamp: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginLeft: 22,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.sm,
  },
  loadingContainer: {
    gap: SPACING.md,
  },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceSecondary,
  },
  skeletonContent: {
    flex: 1,
    gap: SPACING.xs,
  },
  skeletonLine: {
    height: 12,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceSecondary,
    width: "70%",
  },
  skeletonLineShort: {
    width: "40%",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
    gap: SPACING.sm,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  emptySubtext: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    textAlign: "center",
  },
});
