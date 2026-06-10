import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Avatar } from "../../components/ui/Avatar";
import { Badge } from "../../components/ui/Badge";
import { SkeletonLoader } from "../../components/ui/SkeletonLoader";
import api from "../../services/api";
import { triggerHaptic } from "../../utils/haptics";
import { colors, spacing, typography, borderRadius } from "../../styles/theme";

// ─── Types ──────────────────────────────────────────────────────────────────

interface SearchResult {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  level: number;
  isFriend: boolean;
  requestPending: boolean;
}

// ─── Component ──────────────────────────────────────────────────────────────

export function AddFriendScreen() {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ─── Search ─────────────────────────────────────────────────────────────

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    Keyboard.dismiss();
    setSearching(true);
    setError(null);
    setSuccessMessage(null);
    setResults([]);

    try {
      await triggerHaptic("light");
      // Use the friends endpoint with identifier to search
      // The API will return a 404 if user not found, or create a friend if found
      // We first try to find the user via a search approach
      // Since the API uses POST /friends with identifier to directly add,
      // we simulate a search by attempting to look up the user
      const res = await api.get(`/users/search?q=${encodeURIComponent(trimmed)}`);
      const data = res.data?.data || res.data;
      const users = Array.isArray(data) ? data : Array.isArray(data?.users) ? data.users : [];

      setResults(
        users.map((u: SearchResult) => ({
          id: u.id,
          username: u.username,
          displayName: u.displayName,
          avatarUrl: u.avatarUrl,
          level: u.level,
          isFriend: u.isFriend || false,
          requestPending: u.requestPending || false,
        })),
      );
      setHasSearched(true);
    } catch {
      // If the search endpoint doesn't exist, we'll use the direct add approach
      // Store the query and show a "send request" form instead
      setHasSearched(true);
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [query]);

  // ─── Send Friend Request ────────────────────────────────────────────────

  const handleSendRequest = useCallback(async (identifier: string) => {
    if (!identifier.trim()) return;

    setSendingId(identifier);
    setError(null);
    setSuccessMessage(null);

    try {
      await triggerHaptic("success");
      const res = await api.post("/friends/requests", { toUserId: identifier });
      setSuccessMessage(
        `Friend request sent to ${res.data?.request?.toUser?.username || identifier}!`,
      );
      // Update results to show pending
      setResults((prev) =>
        prev.map((r) =>
          r.username === identifier || r.id === identifier
            ? { ...r, requestPending: true }
            : r,
        ),
      );
    } catch {
      await triggerHaptic("error");
      // If the requests endpoint needs a toUserId but we only have a username,
      // fall back to the direct friends endpoint
      try {
        const res = await api.post("/friends", { identifier: identifier.trim() });
        setSuccessMessage(
          `Friend request sent to ${res.data?.friend?.username || identifier}!`,
        );
      } catch (fallbackErr: unknown) {
        const message =
          fallbackErr instanceof Error
            ? fallbackErr.message
            : "Failed to send friend request";
        setError(message);
      }
    } finally {
      setSendingId(null);
    }
  }, []);

  const handleDirectAdd = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    await handleSendRequest(trimmed);
  }, [query, handleSendRequest]);

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Add Friend"
        onBack={() => router.back()}
        showBack={true}
      />

      <View style={styles.content}>
        {/* Search Input */}
        <Card style={styles.searchCard}>
          <Text style={styles.label}>Search by username or email</Text>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Enter username or email..."
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={(text) => {
                setQuery(text);
                setError(null);
                setSuccessMessage(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
            />
            <Button
              title="Search"
              variant="primary"
              size="sm"
              onPress={handleSearch}
              isLoading={searching}
              disabled={!query.trim()}
            />
          </View>
        </Card>

        {/* Error Message */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Success Message */}
        {successMessage ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        ) : null}

        {/* Search Results */}
        {searching && (
          <View style={styles.resultsContainer}>
            <SkeletonLoader height={72} style={{ marginBottom: 8, borderRadius: 12 }} />
            <SkeletonLoader height={72} style={{ marginBottom: 8, borderRadius: 12 }} />
            <SkeletonLoader height={72} style={{ borderRadius: 12 }} />
          </View>
        )}

        {!searching && hasSearched && results.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>
              {results.length} result{results.length !== 1 ? "s" : ""}
            </Text>
            {results.map((user) => (
              <Card key={user.id} style={styles.resultCard}>
                <View style={styles.resultRow}>
                  <Avatar
                    uri={user.avatarUrl || undefined}
                    name={user.displayName || user.username}
                    size="md"
                    showOnline={false}
                  />
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName} numberOfLines={1}>
                      {user.displayName || user.username}
                    </Text>
                    <Text style={styles.resultUsername} numberOfLines={1}>
                      @{user.username}
                    </Text>
                    <Badge label={`Lvl ${user.level}`} variant="primary" size="sm" />
                  </View>
                  {user.isFriend ? (
                    <Badge label="Friends" variant="success" size="sm" />
                  ) : user.requestPending ? (
                    <Badge label="Pending" variant="warning" size="sm" />
                  ) : (
                    <Button
                      title="Add"
                      variant="primary"
                      size="sm"
                      onPress={() => handleSendRequest(user.id)}
                      isLoading={sendingId === user.id}
                    />
                  )}
                </View>
              </Card>
            ))}
          </View>
        )}

        {/* No results from search */}
        {hasSearched && !searching && results.length === 0 && !error && !successMessage && (
          <Card style={styles.noResultsCard}>
            <Text style={styles.noResultsIcon}>🔍</Text>
            <Text style={styles.noResultsTitle}>No users found</Text>
            <Text style={styles.noResultsText}>
              Try searching with a different username or email address.
            </Text>
          </Card>
        )}

        {/* Direct Add (fallback when search endpoint is unavailable) */}
        {hasSearched && !searching && results.length === 0 && !error && !successMessage && (
          <Card style={styles.directAddCard}>
            <Text style={styles.directAddTitle}>Send Request Directly</Text>
            <Text style={styles.directAddText}>
              Can't find the user? Send a friend request directly by username or email.
            </Text>
            <Button
              title={`Send to "${query.trim()}"`}
              variant="outline"
              fullWidth
              onPress={handleDirectAdd}
              isLoading={sendingId === query.trim()}
              disabled={!query.trim()}
            />
          </Card>
        )}

        {/* Initial state */}
        {!hasSearched && !searching && (
          <View style={styles.initialState}>
            <Text style={styles.initialIcon}>🤝</Text>
            <Text style={styles.initialTitle}>Find Your Friends</Text>
            <Text style={styles.initialText}>
              Search by username or email to send a friend request. You'll be able to visit each other's gardens and exchange gifts!
            </Text>
          </View>
        )}

        {/* Loading state */}
        {searching && (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Searching...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  searchCard: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  searchRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  errorBox: {
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    lineHeight: 20,
  },
  successBox: {
    backgroundColor: colors.successBg,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  successText: {
    color: colors.primaryDark,
    fontSize: 14,
    lineHeight: 20,
  },
  resultsContainer: {
    marginBottom: spacing.md,
  },
  resultsTitle: {
    ...typography.label,
    marginBottom: spacing.sm,
  },
  resultCard: {
    marginBottom: spacing.sm,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  resultInfo: {
    flex: 1,
    gap: 2,
  },
  resultName: {
    ...typography.label,
    color: colors.text,
  },
  resultUsername: {
    ...typography.caption,
  },
  noResultsCard: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  noResultsIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  noResultsTitle: {
    ...typography.h4,
    marginBottom: spacing.xs,
  },
  noResultsText: {
    ...typography.bodySmall,
    textAlign: "center",
  },
  directAddCard: {
    alignItems: "center",
    paddingVertical: spacing.lg,
    marginTop: spacing.sm,
  },
  directAddTitle: {
    ...typography.h4,
    marginBottom: spacing.xs,
  },
  directAddText: {
    ...typography.bodySmall,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  initialState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  initialIcon: {
    fontSize: 56,
    marginBottom: spacing.md,
  },
  initialTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  initialText: {
    ...typography.bodySmall,
    textAlign: "center",
    lineHeight: 22,
  },
  loadingState: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  loadingText: {
    ...typography.bodySmall,
    marginTop: spacing.sm,
  },
});

export default AddFriendScreen;
