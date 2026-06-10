import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { Avatar } from "../../components/ui/Avatar";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { SkeletonLoader } from "../../components/ui/SkeletonLoader";
import api from "../../services/api";
import { HapticFeedback } from "../../utils/haptics";
import { colors, spacing, typography } from "../../styles/theme";

// ─── Types ──────────────────────────────────────────────────────────────────

interface FriendItem {
  id: string;
  friendId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  level: number;
  isOnline: boolean;
  friendsSince: string;
}

interface FriendRequestUser {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  level: number;
}

interface IncomingRequest {
  id: string;
  fromUser: FriendRequestUser;
  createdAt: string;
}

interface OutgoingRequest {
  id: string;
  toUser: FriendRequestUser;
  createdAt: string;
}

type TabKey = "friends" | "requests";

interface SectionHeader {
  __section: "incoming" | "outgoing";
  count: number;
}

type RequestListItem = SectionHeader | IncomingRequest | OutgoingRequest;

// ─── Component ──────────────────────────────────────────────────────────────

export function FriendsScreen() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabKey>("friends");
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<IncomingRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<OutgoingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ─── Data Fetching ──────────────────────────────────────────────────────

  const fetchFriends = useCallback(async () => {
    try {
      const res = await api.get("/friends");
      const data = res.data?.data || res.data;
      setFriends(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : []);
    } catch {
      setFriends([]);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await api.get("/friends/requests");
      const data = res.data?.data || res.data;
      setIncomingRequests(Array.isArray(data?.incoming) ? data.incoming : []);
      setOutgoingRequests(Array.isArray(data?.outgoing) ? data.outgoing : []);
    } catch {
      setIncomingRequests([]);
      setOutgoingRequests([]);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchFriends(), fetchRequests()]);
    setLoading(false);
  }, [fetchFriends, fetchRequests]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchFriends(), fetchRequests()]);
    setRefreshing(false);
  }, [fetchFriends, fetchRequests]);

  // ─── Actions ────────────────────────────────────────────────────────────

  const handleAcceptRequest = async (requestId: string, _friendName: string) => {
    setActionLoading(requestId);
    try {
      HapticFeedback.success();
      await api.patch("/friends/requests", { requestId, action: "accept" });
      await Promise.all([fetchFriends(), fetchRequests()]);
    } catch {
      HapticFeedback.error();
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      HapticFeedback.warning();
      await api.patch("/friends/requests", { requestId, action: "reject" });
      await fetchRequests();
    } catch {
      HapticFeedback.error();
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelRequest = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      HapticFeedback.warning();
      // Cancel = reject from the outgoing side
      await api.patch("/friends/requests", { requestId, action: "reject" });
      await fetchRequests();
    } catch {
      HapticFeedback.error();
    } finally {
      setActionLoading(null);
    }
  };

  const handleVisitGarden = async (friendId: string, _friendName: string) => {
    HapticFeedback.light();
    router.push({ pathname: "/garden-visit/[friendId]", params: { friendId } });
  };

  const handleAddFriend = () => {
    HapticFeedback.light();
    router.push("/add-friend");
  };

  // ─── Render Helpers ─────────────────────────────────────────────────────

  const renderFriendItem = ({ item }: { item: FriendItem }) => (
    <Card style={styles.friendCard}>
      <View style={styles.friendRow}>
        <Avatar
          uri={item.avatarUrl || undefined}
          name={item.displayName || item.username}
          size="md"
          showOnline
          isOnline={item.isOnline}
        />
        <View style={styles.friendInfo}>
          <Text style={styles.friendName} numberOfLines={1}>
            {item.displayName || item.username}
          </Text>
          <Text style={styles.friendUsername} numberOfLines={1}>
            @{item.username}
          </Text>
          <Badge label={`Lvl ${item.level}`} variant="primary" size="sm" />
        </View>
        <Button
          title="Visit"
          variant="outline"
          size="sm"
          onPress={() => handleVisitGarden(item.friendId, item.displayName || item.username)}
          icon="🏠"
        />
      </View>
    </Card>
  );

  const renderIncomingRequest = ({ item }: { item: IncomingRequest }) => (
    <Card style={styles.requestCard}>
      <View style={styles.friendRow}>
        <Avatar
          uri={item.fromUser.avatarUrl || undefined}
          name={item.fromUser.displayName || item.fromUser.username}
          size="md"
          showOnline={false}
        />
        <View style={styles.friendInfo}>
          <Text style={styles.friendName} numberOfLines={1}>
            {item.fromUser.displayName || item.fromUser.username}
          </Text>
          <Text style={styles.friendUsername} numberOfLines={1}>
            @{item.fromUser.username} • Lvl {item.fromUser.level}
          </Text>
          <Text style={styles.requestTime}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <View style={styles.requestActions}>
        <Button
          title="Accept"
          variant="primary"
          size="sm"
          fullWidth
          onPress={() => handleAcceptRequest(item.id, item.fromUser.displayName || item.fromUser.username)}
          isLoading={actionLoading === item.id}
        />
        <Button
          title="Reject"
          variant="danger"
          size="sm"
          fullWidth
          onPress={() => handleRejectRequest(item.id)}
          isLoading={actionLoading === item.id}
        />
      </View>
    </Card>
  );

  const renderOutgoingRequest = ({ item }: { item: OutgoingRequest }) => (
    <Card style={styles.requestCard}>
      <View style={styles.friendRow}>
        <Avatar
          uri={item.toUser.avatarUrl || undefined}
          name={item.toUser.displayName || item.toUser.username}
          size="md"
          showOnline={false}
        />
        <View style={styles.friendInfo}>
          <Text style={styles.friendName} numberOfLines={1}>
            {item.toUser.displayName || item.toUser.username}
          </Text>
          <Text style={styles.friendUsername} numberOfLines={1}>
            @{item.toUser.username} • Lvl {item.toUser.level}
          </Text>
          <Text style={styles.requestTime}>
            Sent {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <Button
          title="Cancel"
          variant="secondary"
          size="sm"
          onPress={() => handleCancelRequest(item.id)}
          isLoading={actionLoading === item.id}
        />
      </View>
    </Card>
  );

  const renderFriendSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[0, 1, 2, 3].map((i) => (
        <Card key={i} style={styles.friendCard}>
          <View style={styles.friendRow}>
            <SkeletonLoader width={40} height={40} borderRadius={20} />
            <View style={styles.skeletonTextBlock}>
              <SkeletonLoader width="60%" height={14} borderRadius={4} style={{ marginBottom: 4 }} />
              <SkeletonLoader width="40%" height={12} borderRadius={4} style={{ marginBottom: 4 }} />
              <SkeletonLoader width={50} height={18} borderRadius={9} />
            </View>
            <SkeletonLoader width={60} height={32} borderRadius={6} />
          </View>
        </Card>
      ))}
    </View>
  );

  // ─── Tab Content ────────────────────────────────────────────────────────

  const renderFriendsTab = () => {
    if (loading) return renderFriendSkeleton();
    if (friends.length === 0) {
      return (
        <EmptyState
          icon="🤝"
          title="No friends yet"
          description="Add friends to visit their gardens and exchange gifts!"
          actionLabel="Add Friend"
          onAction={handleAddFriend}
        />
      );
    }
    return (
      <FlatList
        data={friends}
        keyExtractor={(item: FriendItem) => item.id}
        renderItem={renderFriendItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    );
  };

  const renderRequestsTab = () => {
    if (loading) {
      return (
        <View style={styles.skeletonContainer}>
          <SkeletonLoader width="30%" height={16} borderRadius={4} style={{ marginTop: spacing.md, marginBottom: spacing.sm }} />
          {[0, 1].map((i) => (
            <Card key={i} style={styles.requestCard}>
              <View style={styles.friendRow}>
                <SkeletonLoader width={40} height={40} borderRadius={20} />
                <View style={styles.skeletonTextBlock}>
                  <SkeletonLoader width="60%" height={14} borderRadius={4} style={{ marginBottom: 4 }} />
                  <SkeletonLoader width="40%" height={12} borderRadius={4} />
                </View>
              </View>
              <View style={styles.requestActions}>
                <SkeletonLoader width="48%" height={36} borderRadius={6} />
                <SkeletonLoader width="48%" height={36} borderRadius={6} />
              </View>
            </Card>
          ))}
        </View>
      );
    }

    const hasIncoming = incomingRequests.length > 0;
    const hasOutgoing = outgoingRequests.length > 0;

    if (!hasIncoming && !hasOutgoing) {
      return (
        <EmptyState
          icon="📬"
          title="No pending requests"
          description="When someone sends you a friend request, it will appear here."
        />
      );
    }

    return (
      <FlatList
        data={([
          ...(hasIncoming ? [{ __section: "incoming" as const, count: incomingRequests.length }] : []),
          ...incomingRequests,
          ...(hasOutgoing ? [{ __section: "outgoing" as const, count: outgoingRequests.length }] : []),
          ...outgoingRequests,
        ] as RequestListItem[])}
        keyExtractor={(item: RequestListItem, index: number) => {
          if ("__section" in item) return `section-${item.__section}`;
          if ("fromUser" in item) return `incoming-${item.id}`;
          return `outgoing-${(item as OutgoingRequest).id}-${index}`;
        }}
        renderItem={({ item }: { item: RequestListItem }) => {
          if ("__section" in item && item.__section === "incoming") {
            return (
              <Text style={styles.sectionHeader}>
                Incoming Requests ({item.count})
              </Text>
            );
          }
          if ("__section" in item && item.__section === "outgoing") {
            return (
              <Text style={styles.sectionHeader}>
                Sent Requests ({item.count})
              </Text>
            );
          }
          if ("fromUser" in item) {
            return renderIncomingRequest({ item });
          }
          return renderOutgoingRequest({ item: item as OutgoingRequest });
        }}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    );
  };

  // ─── Main Render ────────────────────────────────────────────────────────

  const requestCount = incomingRequests.length;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Friends"
        onBack={() => router.back()}
        showBack={true}
      />

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "friends" && styles.tabActive]}
          onPress={() => { setActiveTab("friends"); HapticFeedback.light(); }}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === "friends" && styles.tabTextActive]}>
            Friends ({friends.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "requests" && styles.tabActive]}
          onPress={() => { setActiveTab("requests"); HapticFeedback.light(); }}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === "requests" && styles.tabTextActive]}>
            Requests
            {requestCount > 0 ? ` (${requestCount})` : ""}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View style={styles.content}>
        {activeTab === "friends" ? renderFriendsTab() : renderRequestsTab()}
      </View>

      {/* FAB */}
      {activeTab === "friends" && (
        <TouchableOpacity
          style={styles.fab}
          onPress={handleAddFriend}
          activeOpacity={0.8}
          accessibilityLabel="Add friend"
          accessibilityRole="button"
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    ...typography.label,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  content: {
    flex: 1,
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl + 60,
  },
  sectionHeader: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  friendCard: {
    marginBottom: spacing.sm,
  },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  friendInfo: {
    flex: 1,
    gap: 2,
  },
  friendName: {
    ...typography.label,
    color: colors.text,
  },
  friendUsername: {
    ...typography.caption,
  },
  requestCard: {
    marginBottom: spacing.sm,
  },
  requestActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  requestTime: {
    ...typography.caption,
  },
  skeletonContainer: {
    padding: spacing.md,
  },
  skeletonTextBlock: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  fab: {
    position: "absolute",
    bottom: spacing.lg,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  fabIcon: {
    fontSize: 28,
    color: colors.white,
    fontWeight: "600",
  },
});

export default FriendsScreen;
