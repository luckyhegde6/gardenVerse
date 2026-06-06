import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenHeader } from "../src/components/ui/ScreenHeader";
import { Card } from "../src/components/ui/Card";
import { Badge } from "../src/components/ui/Badge";
import { Button } from "../src/components/ui/Button";
import { SkeletonLoader } from "../src/components/ui/SkeletonLoader";
import api from "../src/services/api";
import { useAuthStore } from "../src/stores/authStore";
import { UserRole } from "../src/types";
import { spacing, typography } from "../src/styles/theme";
import { useTheme } from "../src/styles/ThemeContext";

interface AdminStats {
  users: number;
  gardens: number;
}

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN;

  const fetchStats = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const [usersRes, gardensRes] = await Promise.all([
        api.get("/users?limit=1"),
        api.get("/gardens"),
      ]);
      setStats({
        users: usersRes.data.total ?? 0,
        gardens: gardensRes.data.data?.length ?? gardensRes.data.length ?? 0,
      });
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (!isAdmin) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background }}>
        <ScreenHeader title="Admin" onBack={() => router.back()} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl }}>
          <Text style={{ fontSize: 48, marginBottom: spacing.md }}>🔒</Text>
          <Text style={[typography.h3, { textAlign: "center", marginBottom: spacing.sm }]}>
            Access Restricted
          </Text>
          <Text style={[typography.body, { color: theme.textSecondary, textAlign: "center" }]}>
            You need admin privileges to access this panel.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScreenHeader title="Admin Panel" onBack={() => router.back()} />

      {loading ? (
        <View style={{ padding: spacing.lg }}>
          <SkeletonLoader width="100%" height={100} style={{ marginBottom: spacing.md }} />
          <SkeletonLoader width="100%" height={100} style={{ marginBottom: spacing.md }} />
          <SkeletonLoader width="100%" height={100} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: spacing.lg }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchStats(true)} />
          }
        >
          <Card style={{ marginBottom: spacing.md }}>
            <Text style={[typography.h3, { marginBottom: spacing.md }]}>Platform Stats</Text>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm }}>
              <Text style={[typography.body, { color: theme.textSecondary }]}>Users</Text>
              <Text style={[typography.body, { fontWeight: "600" }]}>{stats?.users ?? 0}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm }}>
              <Text style={[typography.body, { color: theme.textSecondary }]}>Gardens</Text>
              <Text style={[typography.body, { fontWeight: "600" }]}>{stats?.gardens ?? 0}</Text>
            </View>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={[typography.body, { color: theme.textSecondary }]}>Role</Text>
              <Badge label={user?.role ?? "USER"} variant="primary" />
            </View>
          </Card>

          <Card style={{ marginBottom: spacing.md }}>
            <Text style={[typography.h3, { marginBottom: spacing.md }]}>Quick Actions</Text>
            <View style={{ marginBottom: spacing.sm }}>
              <Button
                title="Manage Users"
                onPress={() => {}}
                variant="outline"
              />
            </View>
            <Button
              title="View Reports"
              onPress={() => {}}
              variant="outline"
            />
          </Card>
        </ScrollView>
      )}
    </View>
  );
}
