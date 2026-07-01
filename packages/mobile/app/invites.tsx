import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Alert,
  Share,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenHeader } from "@components/ui/ScreenHeader";
import { Card } from "@components/ui/Card";
import { Badge } from "@components/ui/Badge";
import { Button } from "@components/ui/Button";
import { EmptyState } from "@components/ui/EmptyState";
import { SkeletonLoader } from "@components/ui/SkeletonLoader";
import api from "@services/api";
import { HapticFeedback } from "@utils/haptics";
import { spacing, typography } from "@/styles/theme";
import { useTheme } from "@/styles/ThemeContext";

interface Invite {
  id: string;
  code: string;
  maxUses: number;
  useCount: number;
  expiresAt: string | null;
  createdAt: string;
  createdBy: { id: string; username: string };
  redeemedBy: { id: string; username: string; avatarUrl: string | null } | null;
}

export default function InvitesPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);

  const fetchInvites = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const res = await api.get("/invites");
      setInvites(res.data.data ?? res.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const handleCreateInvite = async () => {
    setCreating(true);
    try {
      const res = await api.post("/invites", { expiresIn: "7d", maxUses: 5 });
      const newInvite = res.data.data ?? res.data;
      setInvites((prev) => [newInvite, ...prev]);
      HapticFeedback.success();
      Alert.alert("Invite Created", `Code: ${newInvite.code}`, [
        { text: "OK" },
        {
          text: "Share",
          onPress: () =>
            Share.share({
              message: `Join GardenVerse! Use invite code: ${newInvite.code}`,
            }),
        },
      ]);
    } catch {
      Alert.alert("Error", "Failed to create invite");
    } finally {
      setCreating(false);
    }
  };

  const handleCopyCode = (code: string) => {
    HapticFeedback.select();
    Share.share({ message: `Join GardenVerse! Use invite code: ${code}` });
  };

  const activeInvites = invites.filter(
    (i) => !i.redeemedBy && (!i.expiresAt || new Date(i.expiresAt) > new Date())
  );
  const redeemedInvites = invites.filter((i) => i.redeemedBy);

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScreenHeader title="Invites" onBack={() => router.back()} />

      {loading ? (
        <View style={{ padding: spacing.lg }}>
          <SkeletonLoader width="100%" height={80} style={{ marginBottom: spacing.md }} />
          <SkeletonLoader width="100%" height={80} style={{ marginBottom: spacing.md }} />
          <SkeletonLoader width="100%" height={80} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchInvites(true)} />
          }
        >
          <View style={{ marginBottom: spacing.lg }}>
            <Button
              title={creating ? "Creating..." : "Create Invite Code"}
              onPress={handleCreateInvite}
              disabled={creating}
            />
          </View>

          {activeInvites.length > 0 && (
            <>
              <Text style={[typography.h3, { marginBottom: spacing.md }]}>
                Active ({activeInvites.length})
              </Text>
              {activeInvites.map((invite) => (
                <Card key={invite.id} style={{ marginBottom: spacing.md }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View>
                      <Text style={[typography.body, { fontFamily: "monospace", fontWeight: "600" }]}>
                        {invite.code}
                      </Text>
                      <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 4 }]}>
                        {invite.useCount}/{invite.maxUses} uses
                        {invite.expiresAt
                          ? ` · Expires ${new Date(invite.expiresAt).toLocaleDateString()}`
                          : " · No expiry"}
                      </Text>
                    </View>
                    <Button
                      title="Share"
                      onPress={() => handleCopyCode(invite.code)}
                      size="sm"
                      variant="outline"
                    />
                  </View>
                </Card>
              ))}
            </>
          )}

          {redeemedInvites.length > 0 && (
            <>
              <Text style={[typography.h3, { marginTop: spacing.lg, marginBottom: spacing.md }]}>
                Redeemed ({redeemedInvites.length})
              </Text>
              {redeemedInvites.map((invite) => (
                <Card key={invite.id} style={{ marginBottom: spacing.md, opacity: 0.7 }}>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                    <View>
                      <Text style={[typography.body, { fontFamily: "monospace" }]}>
                        {invite.code}
                      </Text>
                      <Text style={[typography.caption, { color: theme.textSecondary, marginTop: 4 }]}>
                        Redeemed by {invite.redeemedBy?.username ?? "unknown"}
                      </Text>
                    </View>
                    <Badge label="Used" variant="secondary" />
                  </View>
                </Card>
              ))}
            </>
          )}

          {invites.length === 0 && (
            <EmptyState
              icon="📨"
              title="No invites yet"
              description="Create an invite code to share with friends"
            />
          )}
        </ScrollView>
      )}
    </View>
  );
}
