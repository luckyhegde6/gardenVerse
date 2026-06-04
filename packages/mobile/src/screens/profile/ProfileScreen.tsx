import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useAuthStore } from "../../stores/authStore";
import { Avatar } from "../../components/ui/Avatar";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { ProfileStackParamList, UserRole } from "../../types";
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

type ProfileNavProp = NativeStackNavigationProp<
  ProfileStackParamList,
  "ProfileHome"
>;

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
  const navigation = useNavigation<ProfileNavProp>();
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

  const menuItems = [
    { icon: "🌱", label: "My Garden", screen: "GardenHome" as string },
    { icon: "🎒", label: "Inventory", screen: "Inventory" },
    { icon: "🏆", label: "Achievements", screen: "Achievements" },
    { icon: "📨", label: "Invites", screen: "Invites" },
    { icon: "⚙️", label: "Settings", screen: "Settings" },
  ];

  if (user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR) {
    menuItems.push({ icon: "🛡️", label: "Admin Panel", screen: "AdminPanel" });
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

      {/* Level & XP */}
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

      {/* Stats Grid */}
      <View className="flex-row flex-wrap px-4 mt-4 gap-3">
        <StatCard icon="💰" label="Green Credits" value={String(user.greenCredits ?? 0)} />
        <StatCard icon="♻️" label="Eco Points" value={String(user.ecoPoints ?? 0)} />
        <StatCard icon="🌍" label="Sustainability" value={`${user.sustainabilityScore ?? 0}`} />
        <StatCard icon="🤝" label="Trust Score" value={`${user.trustScore ?? 100}`} />
      </View>

      {/* Garden Stats */}
      {loading ? (
        <View className="py-4 items-center">
          <ActivityIndicator size="small" color="#059669" />
        </View>
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
              if (item.screen === "GardenHome") {
                (navigation as any).navigate("GardenTab");
              } else {
                (navigation as any).navigate(item.screen);
              }
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
