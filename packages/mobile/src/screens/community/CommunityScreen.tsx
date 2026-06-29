import { View, Text, ScrollView, RefreshControl, Pressable, StyleSheet, Alert } from "react-native";
import { useCallback, useState, useEffect } from "react";
import Animated, {
  withSpring,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CommunitySearchBar } from "../../components/community/CommunitySearchBar";
import { NearbyGardenerCard } from "../../components/community/NearbyGardenerCard";
import { LeaderboardCard } from "../../components/community/LeaderboardCard";
import { CommunityGroupCard } from "../../components/community/CommunityGroupCard";
import { EventCard } from "../../components/community/EventCard";
import { ActivityFeed } from "../../components/community/ActivityFeed";

import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from "../../styles/tokens";

import type {
  Group,
  NearbyGardener,
  LeaderboardEntry,
  ActivityEntry,
  CommunityEvent,
} from "../../types";

// ─── Sample Data ────────────────────────────────────────────────────────────

const SAMPLE_GROUPS: Group[] = [
  {
    id: "g1",
    name: "Bengaluru Organic Farmers",
    description:
      "A community of organic farmers in and around Bengaluru sharing tips, seeds, and fresh produce.",
    type: "regional",
    region: "Bengaluru",
    memberCount: 234,
    isJoined: true,
  },
  {
    id: "g2",
    name: "Herb Garden Enthusiasts",
    description:
      "Everything about growing culinary herbs — basil, mint, coriander, rosemary and more!",
    type: "topic",
    memberCount: 89,
    isJoined: false,
  },
  {
    id: "g3",
    name: "Mumbai Terrace Gardeners",
    description:
      "Terrace gardening in the city that never sleeps. Share space-saving tips and urban hacks.",
    type: "regional",
    region: "Mumbai",
    memberCount: 156,
    isJoined: false,
  },
  {
    id: "g4",
    name: "Composting Champions",
    description:
      "Master the art of composting — from kitchen scrap bins to large-scale pit composting.",
    type: "topic",
    memberCount: 312,
    isJoined: true,
  },
  {
    id: "g5",
    name: "Monsoon Gardeners Club",
    description:
      "Planning and caring for gardens during the monsoon season. Rain-ready techniques.",
    type: "events",
    region: "Kerala",
    memberCount: 78,
    isJoined: false,
  },
];

const SAMPLE_GARDENERS: NearbyGardener[] = [
  {
    id: "ng1",
    username: "green_thumb",
    displayName: "Priya Sharma",
    bio: "Organic gardening since 2019",
    latitude: 12.9716,
    longitude: 77.5946,
    sustainabilityScore: 92,
  },
  {
    id: "ng2",
    username: "urban_farmer",
    displayName: "Rahul Patel",
    bio: "Grows vegetables on my balcony",
    latitude: 12.9352,
    longitude: 77.6105,
    sustainabilityScore: 78,
  },
];

const SAMPLE_LEADERBOARD: LeaderboardEntry[] = [
  { id: "l1", username: "garden_guru", displayName: "Ananya Reddy", score: 15420, rank: 1, level: 42 },
  { id: "l2", username: "eco_warrior", displayName: "Vikram Singh", score: 13280, rank: 2, level: 38 },
  { id: "l3", username: "seed_saver", displayName: "Lakshmi Iyer", score: 11950, rank: 3, level: 35 },
  { id: "l4", username: "terrace_queen", displayName: "Meera Nair", score: 9870, rank: 4, level: 31 },
  { id: "l5", username: "compost_king", displayName: "Arun Kumar", score: 8520, rank: 5, level: 28 },
  { id: "l6", username: "herb_hacker", displayName: "Divya Joseph", score: 7410, rank: 6, level: 25 },
  { id: "l7", username: "water_wise", displayName: "Ravi Deshmukh", score: 6350, rank: 7, level: 22 },
  { id: "l8", username: "pollinator_pal", displayName: "Sunita Verma", score: 5240, rank: 8, level: 19 },
  { id: "l9", username: "soil_sage", displayName: "Karthik Rao", score: 4180, rank: 9, level: 17 },
  { id: "l10", username: "green_bean", displayName: "Neha Gupta", score: 3120, rank: 10, level: 14 },
];

const SAMPLE_EVENTS: CommunityEvent[] = [
  {
    id: "e1",
    title: "Community Seed Swap",
    description: "Bring your extra seeds and trade with fellow gardeners! All organic seeds welcome.",
    date: "2026-07-15T09:00:00Z",
    rewards: ["🌱 Rare Seeds", "🏅 Event Badge"],
    participants: 47,
  },
  {
    id: "e2",
    title: "Permaculture Workshop",
    description: "Learn the principles of permaculture design for urban spaces.",
    date: "2026-07-22T10:30:00Z",
    rewards: ["📜 Certificate", "🎍 Bamboo Planter"],
    participants: 28,
  },
  {
    id: "e3",
    title: "Garden Photography Contest",
    description: "Show off your most beautiful garden photos. Winners featured in our newsletter!",
    date: "2026-08-01T00:00:00Z",
    rewards: ["🏆 Featured Spot", "🎁 Surprise Seed Pack"],
    participants: 112,
  },
  {
    id: "e4",
    title: "Composting Masterclass",
    description: "From kitchen scraps to black gold — a hands-on composting demonstration.",
    date: "2026-08-12T08:00:00Z",
    rewards: ["🪴 Compost Starter Kit", "📖 Guide Book"],
    participants: 15,
  },
];

function makeTimestamps(): ActivityEntry[] {
  const now = Date.now();
  const min = (m: number) => new Date(now - m * 60 * 1000).toISOString();
  const hours = (h: number) => new Date(now - h * 60 * 60 * 1000).toISOString();
  const days = (d: number) => new Date(now - d * 24 * 60 * 60 * 1000).toISOString();

  return [
    { id: "a1", type: "plant", text: "planted Tomato in their garden", timestamp: min(5), userId: "u1", username: "green_thumb" },
    { id: "a2", type: "harvest", text: "harvested 2 kg of Spinach", timestamp: min(18), userId: "u2", username: "urban_farmer" },
    { id: "a3", type: "water", text: "watered their raised beds", timestamp: hours(1), userId: "u3", username: "seed_saver" },
    { id: "a4", type: "badge", text: "earned the 'Compost Master' badge", timestamp: hours(3), userId: "u4", username: "compost_king" },
    { id: "a5", type: "levelup", text: "reached Level 42!", timestamp: hours(5), userId: "u1", username: "garden_guru" },
    { id: "a6", type: "trade", text: "traded Coriander seeds with terrace_queen", timestamp: hours(8), userId: "u5", username: "herb_hacker" },
    { id: "a7", type: "join", text: "joined Bengaluru Organic Farmers", timestamp: days(1), userId: "u6", username: "water_wise" },
    { id: "a8", type: "fertilize", text: "applied vermicompost to their Tulsi plants", timestamp: days(2), userId: "u7", username: "soil_sage" },
  ];
}

// ─── Segments ───────────────────────────────────────────────────────────────

const SEGMENTS = ["Groups", "Leaderboard", "Events", "Activity"] as const;
type Segment = (typeof SEGMENTS)[number];

// ─── Sub-components ─────────────────────────────────────────────────────────

function SectionHeader({
  title,
  showSeeAll,
  onSeeAll,
}: {
  title: string;
  showSeeAll?: boolean;
  onSeeAll?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {showSeeAll && (
        <Pressable
          onPress={onSeeAll}
          accessibilityRole="button"
          accessibilityLabel="See all"
        >
          <Text style={styles.seeAllText}>See All</Text>
        </Pressable>
      )}
    </View>
  );
}

function SegmentButton({
  label,
  isActive,
  onPress,
}: {
  label: Segment;
  isActive: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.94, { damping: 15, stiffness: 300 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, [scale]);

  return (
    <AnimatedPressable
      style={[
        styles.segment,
        isActive ? styles.segmentActive : styles.segmentInactive,
        animatedStyle,
      ]}
      onPress={() => {
        onPress();
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={`${label} tab`}
    >
      <Text
        style={[
          styles.segmentText,
          isActive ? styles.segmentTextActive : styles.segmentTextInactive,
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

function LeaderboardSkeleton() {
  return (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3].map((key) => (
        <View key={key} style={styles.skeletonRow}>
          <View style={styles.skeletonRank} />
          <View style={styles.skeletonAvatar} />
          <View style={styles.skeletonTextBlock}>
            <View style={styles.skeletonLine} />
            <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
          </View>
          <View style={styles.skeletonScore} />
        </View>
      ))}
    </View>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// ─── Screen ─────────────────────────────────────────────────────────────────

export function CommunityScreen() {
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeSegment, setActiveSegment] = useState<Segment>("Groups");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [nearbyGardeners] = useState<NearbyGardener[]>(SAMPLE_GARDENERS);
  const [groups, setGroups] = useState<Group[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);

  // Simulate async data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setGroups(SAMPLE_GROUPS);
      setLeaderboard(SAMPLE_LEADERBOARD);
      setEvents(SAMPLE_EVENTS);
      setActivities(makeTimestamps());
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setLoading(true);
    // Simulate reload
    setTimeout(() => {
      setGroups(SAMPLE_GROUPS);
      setLeaderboard(SAMPLE_LEADERBOARD);
      setEvents(SAMPLE_EVENTS);
      setActivities(makeTimestamps());
      setLoading(false);
      setRefreshing(false);
    }, 600);
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleGroupPress = useCallback((group: Group) => {
    Alert.alert(group.name, group.description ?? "No description");
  }, []);

  const handleGroupJoin = useCallback((group: Group) => {
    Alert.alert(
      group.isJoined ? "Leave Group" : "Join Group",
      group.isJoined
        ? `You have left "${group.name}"`
        : `You joined "${group.name}"!`,
    );
  }, []);

  const handleGardenerPress = useCallback((gardener: NearbyGardener) => {
    Alert.alert(gardener.displayName ?? gardener.username, gardener.bio ?? "Bio not available");
  }, []);

  const handleGardenerFollow = useCallback((gardener: NearbyGardener) => {
    Alert.alert("Follow", `You followed ${gardener.displayName ?? gardener.username}`);
  }, []);

  const handleEventPress = useCallback((event: CommunityEvent) => {
    Alert.alert(event.title, event.description ?? "No description");
  }, []);

  const handleEventParticipate = useCallback((event: CommunityEvent) => {
    Alert.alert("Participate", `You signed up for "${event.title}"`);
  }, []);

  // ── Render helpers ───────────────────────────────────────────────────

  const renderGroupsContent = () => (
    <View>
      {/* Nearby Gardeners */}
      <SectionHeader title="🌍 Nearby Gardeners" />
      {nearbyGardeners.map((gardener) => (
        <NearbyGardenerCard
          key={gardener.id}
          gardener={gardener}
          isFollowing={false}
          onFollow={() => handleGardenerFollow(gardener)}
          onPress={() => handleGardenerPress(gardener)}
        />
      ))}

      {/* All Groups */}
      <SectionHeader title="👥 All Groups" showSeeAll onSeeAll={() => Alert.alert("Groups", "See all groups")} />
      {loading ? (
        <View style={styles.skeletonContainer}>
          {[1, 2, 3].map((key) => (
            <View key={key} style={styles.groupSkeleton}>
              <View style={styles.groupSkeletonImage} />
              <View style={styles.groupSkeletonText}>
                <View style={styles.skeletonLine} />
                <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
              </View>
            </View>
          ))}
        </View>
      ) : groups.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🌐</Text>
          <Text style={styles.emptyText}>No groups yet. Create the first one!</Text>
        </View>
      ) : (
        groups.map((group) => (
          <CommunityGroupCard
            key={group.id}
            group={group}
            onPress={() => handleGroupPress(group)}
            onJoin={() => handleGroupJoin(group)}
          />
        ))
      )}
    </View>
  );

  const renderLeaderboardContent = () => (
    <View>
      <SectionHeader title="🏆 Leaderboard" showSeeAll onSeeAll={() => Alert.alert("Leaderboard", "Full leaderboard")} />
      {loading ? (
        <LeaderboardSkeleton />
      ) : leaderboard.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🏅</Text>
          <Text style={styles.emptyText}>No leaderboard data yet</Text>
        </View>
      ) : (
        leaderboard.map((entry, index) => (
          <LeaderboardCard key={entry.id} entry={entry} index={index} />
        ))
      )}
    </View>
  );

  const renderEventsContent = () => (
    <View>
      <SectionHeader title="🎉 Upcoming Events" showSeeAll onSeeAll={() => Alert.alert("Events", "All events")} />
      {loading ? (
        <LeaderboardSkeleton />
      ) : events.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📅</Text>
          <Text style={styles.emptyText}>No upcoming events</Text>
          <Text style={styles.emptySubtext}>Check back later for new events!</Text>
        </View>
      ) : (
        events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onPress={() => handleEventPress(event)}
            onParticipate={() => handleEventParticipate(event)}
          />
        ))
      )}
    </View>
  );

  const renderActivityContent = () => (
    <ActivityFeed activities={activities} isLoading={loading} />
  );

  const renderContent = () => {
    switch (activeSegment) {
      case "Groups":
        return renderGroupsContent();
      case "Leaderboard":
        return renderLeaderboardContent();
      case "Events":
        return renderEventsContent();
      case "Activity":
        return renderActivityContent();
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Community</Text>
          <AnimatedPressable
            style={styles.bellButton}
            onPress={() => Alert.alert("Notifications", "No new notifications")}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Text style={styles.bellIcon}>🔔</Text>
          </AnimatedPressable>
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrapper}>
          <CommunitySearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search gardeners, groups, events..."
          />
        </View>

        {/* Segmented Control */}
        <View style={styles.segmentedControl}>
          {SEGMENTS.map((segment) => (
            <SegmentButton
              key={segment}
              label={segment}
              isActive={activeSegment === segment}
              onPress={() => setActiveSegment(segment)}
            />
          ))}
        </View>

        {/* Content Area */}
        <View style={styles.contentArea}>{renderContent()}</View>
      </ScrollView>
    </View>
  );
}

export default CommunityScreen;

// ─── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxl,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerTitle: {
    ...TYPOGRAPHY.headingXL,
    color: COLORS.text,
  },
  bellButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOWS.sm,
  },
  bellIcon: {
    fontSize: 20,
  },

  // Search
  searchWrapper: {
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },

  // Segmented Control
  segmentedControl: {
    flexDirection: "row",
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xs,
  },
  segment: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BORDER_RADIUS.sm,
  },
  segmentActive: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  segmentInactive: {
    backgroundColor: "transparent",
  },
  segmentText: {
    ...TYPOGRAPHY.label,
    fontWeight: "600",
  },
  segmentTextActive: {
    color: COLORS.white,
  },
  segmentTextInactive: {
    color: COLORS.textSecondary,
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.headingS,
    color: COLORS.text,
  },
  seeAllText: {
    ...TYPOGRAPHY.label,
    color: COLORS.primary,
    fontWeight: "600",
  },

  // Content Area
  contentArea: {
    paddingBottom: SPACING.lg,
  },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    paddingVertical: SPACING.xl,
    marginHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    fontWeight: "600",
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  emptySubtext: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: SPACING.xs,
  },

  // Skeleton (shared)
  skeletonContainer: {
    paddingHorizontal: SPACING.md,
    gap: SPACING.sm,
  },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  skeletonRank: {
    width: 32,
    height: 24,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceSecondary,
  },
  skeletonAvatar: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceSecondary,
  },
  skeletonTextBlock: {
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
  skeletonScore: {
    width: 60,
    height: 20,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceSecondary,
  },

  // Group skeleton
  groupSkeleton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    gap: SPACING.md,
    ...SHADOWS.sm,
  },
  groupSkeletonImage: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceSecondary,
  },
  groupSkeletonText: {
    flex: 1,
    gap: SPACING.xs,
  },
});
