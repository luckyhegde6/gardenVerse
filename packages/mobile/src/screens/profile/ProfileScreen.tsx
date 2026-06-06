import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../stores/authStore";
import { Avatar } from "../../components/ui/Avatar";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { SkeletonLoader } from "../../components/ui/SkeletonLoader";
import { UserRole } from "../../types";
import api from "../../services/api";
import {
  ensurePermission,
  requestCameraPermission,
  requestLocationPermission,
  requestNotificationPermission,
} from "../../utils/permissions";
import { Camera } from "expo-camera";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";

interface UserStats {
  gardenCount: number;
  cropCount: number;
  matureCrops: number;
  wiltingCrops: number;
  harvestCount: number;
  totalCollections: number;
  totalSpecies: number;
  activeStreak: number;
  longestStreak: number;
  groupCount: number;
  recentActivity: { type: string; description: string; timestamp: string }[];
}

export function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  const [permCamera, setPermCamera] = useState<boolean | null>(null);
  const [permLocation, setPermLocation] = useState<boolean | null>(null);
  const [permNotifications, setPermNotifications] = useState<boolean | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/users/me/stats");
      setStats(res.data.data || res.data);
    } catch {
      // Stats are non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ─── Permission Status Check (read-only, no requests) ──────────────────
  useEffect(() => {
    (async () => {
      const camera = await Camera.getCameraPermissionsAsync();
      setPermCamera(camera.granted);
      const location = await Location.getForegroundPermissionsAsync();
      setPermLocation(location.granted);
      const notif = await Notifications.getPermissionsAsync();
      setPermNotifications(notif.granted);
    })();
  }, []);

  if (!user) return null;

  const menuItems: { icon: string; label: string; path: string }[] = [
    { icon: "🎁", label: "Daily Rewards", path: "/daily-rewards" },
    { icon: "📜", label: "Quests", path: "/quests" },
    { icon: "🌱", label: "My Garden", path: "/(tabs)/garden" },
    { icon: "🎒", label: "Inventory", path: "/inventory" },
    { icon: "🏆", label: "Achievements", path: "/achievements" },
    { icon: "🤝", label: "Friends", path: "/friends" },
    { icon: "📨", label: "Invites", path: "/invites" },
    { icon: "⚙️", label: "Settings", path: "/settings" },
  ];

  if (user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR) {
    menuItems.push({ icon: "🛡️", label: "Admin Panel", path: "/admin" });
  }

  const discoveredPct = stats
    ? Math.round((stats.totalCollections / Math.max(stats.totalSpecies, 1)) * 100)
    : 0;

  function getActivityIcon(type: string): string {
    switch (type.toUpperCase()) {
      case "HARVEST": return "🌾";
      case "MATURE": return "✅";
      case "WILTED": return "⚠️";
      case "PLANTED": return "🌱";
      case "welcome": return "👋";
      case "harvest_ready": return "🌾";
      case "weather_alert": return "🌤️";
      case "marketplace": return "🏪";
      case "community": return "💬";
      case "streak": return "🔥";
      case "achievement": return "🏆";
      case "plant_care": return "💧";
      case "ai_scan": return "🔍";
      case "invite": return "📨";
      case "system": return "ℹ️";
      default: return "📌";
    }
  }

  function timeAgo(ts: string): string {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header */}
      {loading ? (
        <View className="bg-white items-center py-8 px-4">
          <SkeletonLoader
            width={96}
            height={96}
            borderRadius={48}
            style={{ marginBottom: 12 }}
          />
          <SkeletonLoader
            width="40%"
            height={22}
            borderRadius={6}
            style={{ marginBottom: 6 }}
          />
          <SkeletonLoader
            width="30%"
            height={14}
            borderRadius={4}
            style={{ marginBottom: 10 }}
          />
          <SkeletonLoader width={70} height={24} borderRadius={12} />
        </View>
      ) : (
        <View className="bg-white items-center py-8 px-4">
          <Avatar
            uri={user.avatarUrl}
            name={user.displayName || user.username}
            size="xl"
            showOnline
            isOnline
          />
          <Text className="text-xl font-bold text-gray-900 mt-3">
            {user.displayName || user.username}
          </Text>
          <Text className="text-sm text-gray-500">@{user.username}</Text>
          <Badge
            label={user.role}
            variant={
              user.role === "ADMIN"
                ? "error"
                : user.role === "MODERATOR"
                  ? "warning"
                  : "primary"
            }
            className="mt-2"
          />
        </View>
      )}

      {/* Level & XP */}
      {loading ? (
        <Card className="mx-4 mt-4">
          <View className="flex-row items-center justify-between mb-2">
            <SkeletonLoader width="30%" height={18} borderRadius={6} />
            <SkeletonLoader width="35%" height={14} borderRadius={4} />
          </View>
          <SkeletonLoader width="100%" height={10} borderRadius={5} />
        </Card>
      ) : (
        <Card className="mx-4 mt-4">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-base font-bold text-gray-900">
              Level {user.level ?? 1}
            </Text>
            <Text className="text-sm text-gray-500">
              {user.experience ?? 0} / 1000 XP
            </Text>
          </View>
          <ProgressBar value={user.experience ?? 0} maxValue={1000} height={10} />
        </Card>
      )}

      {/* Stats Grid */}
      {loading ? (
        <View className="flex-row flex-wrap px-4 mt-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className="w-[47%] items-center py-4">
              <SkeletonLoader width={24} height={24} borderRadius={4} style={{ marginBottom: 4 }} />
              <SkeletonLoader width={40} height={20} borderRadius={4} style={{ marginBottom: 4 }} />
              <SkeletonLoader width="60%" height={10} borderRadius={4} />
            </Card>
          ))}
        </View>
      ) : (
        <View className="flex-row flex-wrap px-4 mt-4 gap-3">
          <StatCard icon="💰" label="Green Credits" value={String(user.greenCredits ?? 0)} />
          <StatCard icon="♻️" label="Eco Points" value={String(user.ecoPoints ?? 0)} />
          <StatCard icon="🌍" label="Sustainability" value={`${user.sustainabilityScore ?? 0}`} />
          <StatCard icon="🤝" label="Trust Score" value={`${user.trustScore ?? 100}`} />
        </View>
      )}

      {/* Garden Stats */}
      {loading ? (
        <>
          <Card className="mx-4 mt-4">
            <SkeletonLoader width="45%" height={18} borderRadius={6} style={{ marginBottom: 16 }} />
            <View className="flex-row flex-wrap">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <View key={i} className="w-1/3 items-center py-2">
                  <SkeletonLoader width={20} height={20} borderRadius={4} style={{ marginBottom: 4 }} />
                  <SkeletonLoader width={24} height={16} borderRadius={4} style={{ marginBottom: 2 }} />
                  <SkeletonLoader width="70%" height={10} borderRadius={4} />
                </View>
              ))}
            </View>
            <SkeletonLoader width="100%" height={8} borderRadius={4} style={{ marginTop: 12 }} />
          </Card>
          <Card className="mx-4 mt-4 flex-row items-center">
            <SkeletonLoader width={36} height={36} borderRadius={18} style={{ marginRight: 12 }} />
            <View className="flex-1">
              <SkeletonLoader width="60%" height={18} borderRadius={4} style={{ marginBottom: 4 }} />
              <SkeletonLoader width="40%" height={12} borderRadius={4} />
            </View>
            <SkeletonLoader width={70} height={24} borderRadius={12} />
          </Card>
          <Card className="mx-4 mt-4 mb-2">
            <SkeletonLoader width="40%" height={18} borderRadius={6} style={{ marginBottom: 12 }} />
            {[0, 1, 2].map((i) => (
              <View key={i} className="flex-row items-center py-2.5">
                <SkeletonLoader width={20} height={20} borderRadius={4} style={{ marginRight: 12 }} />
                <SkeletonLoader width="65%" height={14} borderRadius={4} style={{ marginRight: 8 }} />
                <SkeletonLoader width={40} height={12} borderRadius={4} />
              </View>
            ))}
          </Card>
          {/* Menu skeleton */}
          <View className="px-4 mt-4 mb-8">
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                className="flex-row items-center bg-white px-4 py-4 border-b border-gray-100"
              >
                <SkeletonLoader width={20} height={20} borderRadius={4} style={{ marginRight: 12 }} />
                <SkeletonLoader width="40%" height={16} borderRadius={4} />
              </View>
            ))}
          </View>
        </>
      ) : stats ? (
        <>
          <Card className="mx-4 mt-4">
            <Text className="text-base font-bold text-gray-900 mb-3">
              🌻 Garden Summary
            </Text>
            <View className="flex-row flex-wrap">
              <MiniStat icon="🏡" label="Gardens" value={String(stats.gardenCount)} />
              <MiniStat icon="🌱" label="Total Crops" value={String(stats.cropCount)} />
              <MiniStat icon="✅" label="Mature" value={String(stats.matureCrops)} />
              <MiniStat icon="🌾" label="Harvested" value={String(stats.harvestCount)} />
              <MiniStat icon="🔴" label="Wilting" value={String(stats.wiltingCrops)} warning={stats.wiltingCrops > 0} />
              <MiniStat icon="🔬" label="Discovered" value={`${stats.totalCollections}/${stats.totalSpecies}`} />
            </View>
            {/* Collection progress */}
            <View className="mt-3">
              <View className="flex-row justify-between mb-1">
                <Text className="text-xs text-gray-500">Species collection</Text>
                <Text className="text-xs font-semibold text-gray-700">{discoveredPct}%</Text>
              </View>
              <ProgressBar value={discoveredPct} maxValue={100} height={8} color="#6366f1" />
            </View>
          </Card>

          {/* Streaks */}
          <Card className="mx-4 mt-4 flex-row items-center">
            <Text className="text-3xl mr-3">
              {stats.activeStreak >= 30 ? "🔥" : stats.activeStreak >= 14 ? "⭐" : stats.activeStreak >= 7 ? "💪" : "👍"}
            </Text>
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900">
                {stats.activeStreak} Day Streak
              </Text>
              {stats.longestStreak > 0 && (
                <Text className="text-xs text-gray-500">
                  Longest: {stats.longestStreak} days
                </Text>
              )}
            </View>
            <Badge label={`${stats.groupCount} Groups`} variant="primary" size="sm" />
          </Card>

          {/* Recent Activity */}
          {stats.recentActivity.length > 0 && (
            <Card className="mx-4 mt-4 mb-2">
              <Text className="text-base font-bold text-gray-900 mb-3">
                📋 Recent Activity
              </Text>
              {stats.recentActivity.map((item, idx) => (
                <View
                  key={idx}
                  className="flex-row items-center py-2.5 border-b border-gray-50"
                >
                  <Text className="text-lg mr-3">{getActivityIcon(item.type)}</Text>
                  <View className="flex-1">
                    <Text className="text-sm text-gray-800">{item.description}</Text>
                  </View>
                  <Text className="text-xs text-gray-400 ml-2">{timeAgo(item.timestamp)}</Text>
                </View>
              ))}
            </Card>
          )}
        </>
      ) : null}

      {/* Menu Items */}
      <View className="px-4 mt-4 mb-8">
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={item.label}
            onPress={() => {
              router.push(item.path);
            }}
            className={`flex-row items-center bg-white px-4 py-4 ${
              index === 0
                ? "rounded-t-2xl"
                : index === menuItems.length - 1
                  ? "rounded-b-2xl"
                  : ""
            } border-b border-gray-100`}
          >
            <Text className="text-xl mr-3">{item.icon}</Text>
            <Text className="text-base text-gray-900 flex-1">{item.label}</Text>
            <Text className="text-gray-300 text-lg">›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Permissions Section */}
      <View className="px-4 mb-8">
        <Text className="text-base font-bold text-gray-900 mb-3">
          🔒 Permissions
        </Text>
        <View className="bg-white rounded-2xl overflow-hidden border border-gray-100">
          {[
            { label: "Camera", icon: "📷", granted: permCamera, onPress: requestCameraPermission },
            { label: "Location", icon: "📍", granted: permLocation, onPress: requestLocationPermission },
            { label: "Notifications", icon: "🔔", granted: permNotifications, onPress: requestNotificationPermission },
          ].map((p, idx) => (
            <View
              key={p.label}
              className={`flex-row items-center justify-between px-4 py-3.5 ${
                idx < 2 ? "border-b border-gray-100" : ""
              }`}
            >
              <View className="flex-row items-center">
                <Text className="text-lg mr-3">{p.icon}</Text>
                <Text className="text-sm text-gray-800">{p.label}</Text>
              </View>
              <TouchableOpacity onPress={p.onPress} activeOpacity={0.7}>
                <Text className="text-sm font-medium">
                  {p.granted === null
                    ? "⏳ Checking..."
                    : p.granted
                      ? "✅ Granted"
                      : "❌ Denied"}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <Card className="w-[47%] items-center py-4">
      <Text className="text-2xl mb-1">{icon}</Text>
      <Text className="text-lg font-bold text-gray-900">{value}</Text>
      <Text className="text-xs text-gray-500">{label}</Text>
    </Card>
  );
}

function MiniStat({ icon, label, value, warning }: { icon: string; label: string; value: string; warning?: boolean }) {
  return (
    <View className="w-1/3 items-center py-2">
      <Text className="text-lg mb-0.5">{icon}</Text>
      <Text className={`text-base font-bold ${warning ? 'text-red-500' : 'text-gray-900'}`}>{value}</Text>
      <Text className="text-xs text-gray-500">{label}</Text>
    </View>
  );
}
