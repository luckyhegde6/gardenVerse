import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
// import { ScreenHeader } from "../../components/ui/ScreenHeader";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { useAuthStore } from "../../stores/authStore";
import { useTheme } from "../../styles/ThemeContext";
import { lightTheme } from "../../styles/theme";
import { gameSaveSync } from "../../services/gameSaveSync";
import { useGardenStore } from "../../stores/gardenStore";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";
import { useToast } from "../../components/ui/Toast";
import { getItem, removeItem } from "../../utils/storage";

export function SettingsScreen() {
  const _router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { user, updateProfile, logout } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [notifications, setNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ─── Game Data state ────────────────────────────────────────────────────
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [hasPendingSync, setHasPendingSync] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [storageUsage, setStorageUsage] = useState<string>('Unknown');
  const { isOnline } = useNetworkStatus();
  const { show: showToast, ToastComponent } = useToast();

  const gardens = useGardenStore((s) => s.gardens);
  const crops = useGardenStore((s) => s.crops);

  // Load sync status on mount
  useEffect(() => {
    const loadSyncStatus = async () => {
      const lastSync = await gameSaveSync.getLastSyncTime();
      const pending = await gameSaveSync.hasPendingSync();
      setLastSyncTime(lastSync);
      setHasPendingSync(pending);

      // Estimate storage usage
      try {
        const gameState = await getItem('game_state_local');
        const token = await getItem('access_token');
        const userData = await getItem('user_data');
        const totalBytes = (gameState?.length || 0) + (token?.length || 0) + (userData?.length || 0);
        if (totalBytes < 1024) {
          setStorageUsage(`${totalBytes} B`);
        } else if (totalBytes < 1024 * 1024) {
          setStorageUsage(`${(totalBytes / 1024).toFixed(1)} KB`);
        } else {
          setStorageUsage(`${(totalBytes / (1024 * 1024)).toFixed(1)} MB`);
        }
      } catch {
        setStorageUsage('Unknown');
      }
    };
    loadSyncStatus();
  }, []);

  const handleSaveGameNow = useCallback(async () => {
    setIsSyncing(true);
    try {
      const result = await gameSaveSync.manualSaveAndSync({
        crops,
        gardens,
        questProgress: [],
        collections: [],
      });
      if (result.success) {
        showToast({ message: 'Game saved successfully', type: 'success', duration: 2000 });
        setLastSyncTime(result.syncedAt);
        setHasPendingSync(false);
      } else {
        showToast({ message: result.message || 'Save failed', type: 'warning', duration: 2000 });
        setHasPendingSync(true);
      }
    } catch {
      showToast({ message: 'Save failed', type: 'error', duration: 2000 });
    } finally {
      setIsSyncing(false);
    }
  }, [crops, gardens, showToast]);

  const handleSyncWithServer = useCallback(async () => {
    setIsSyncing(true);
    try {
      const result = await gameSaveSync.syncWithServer();
      if (result.success) {
        showToast({ message: 'Synced with server', type: 'success', duration: 2000 });
        setLastSyncTime(result.syncedAt);
        setHasPendingSync(false);
      } else {
        showToast({ message: result.message || 'Sync failed', type: 'warning', duration: 2000 });
        setHasPendingSync(true);
      }
    } catch {
      showToast({ message: 'Sync failed - offline?', type: 'error', duration: 2000 });
    } finally {
      setIsSyncing(false);
    }
  }, [showToast]);

  const handleClearLocalData = useCallback(() => {
    Alert.alert(
      'Clear Local Data',
      'This will remove all locally saved game data. Your server data will not be affected. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeItem('game_state_local');
              await removeItem('last_game_sync');
              await removeItem('pending_game_sync');
              setLastSyncTime(null);
              setHasPendingSync(false);
              setStorageUsage('0 B');
              showToast({ message: 'Local data cleared', type: 'success', duration: 2000 });
            } catch {
              showToast({ message: 'Failed to clear data', type: 'error', duration: 2000 });
            }
          },
        },
      ],
    );
  }, [showToast]);

  const formatSyncTime = (iso: string | null): string => {
    if (!iso) return 'Never';
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHrs = Math.floor(diffMins / 60);
      if (diffHrs < 24) return `${diffHrs}h ago`;
      const diffDays = Math.floor(diffHrs / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Unknown';
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfile({ displayName });
    } catch {
      // noop
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This action is irreversible. All your data will be permanently deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {},
        },
      ],
    );
  };

  const SettingToggle = ({
    label,
    description,
    value,
    onToggle,
  }: {
    label: string;
    description?: string;
    value: boolean;
    onToggle: () => void;
  }) => (
    <TouchableOpacity
      onPress={onToggle}
      className="flex-row items-center justify-between py-4 border-b border-gray-100"
    >
      <View className="flex-1 mr-3">
        <Text className="text-sm font-medium text-gray-900">{label}</Text>
        {description && (
          <Text className="text-xs text-gray-500 mt-0.5">{description}</Text>
        )}
      </View>
      <View
        className={`w-12 h-7 rounded-full p-1 ${
          value ? "bg-primary-600" : "bg-gray-300"
        }`}
      >
        <View
          className={`w-5 h-5 rounded-full bg-white shadow-sm ${
            value ? "ml-5" : ""
          }`}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      showsVerticalScrollIndicator={false}
    >
      <View className="px-4 py-4">
        {/* Profile Section */}
        <Card className="mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-4">
            Edit Profile
          </Text>
          <Input
            label="Display Name"
            placeholder="Your display name"
            value={displayName}
            onChangeText={setDisplayName}
          />
          <Input
            label="Username"
            value={`@${user?.username}`}
            editable={false}
            onChangeText={() => {}}
          />
          <Button
            title="Save Changes"
            onPress={handleSaveProfile}
            isLoading={isSaving}
            size="sm"
          />
        </Card>

        {/* Notification Preferences */}
        <Card className="mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">
            Notifications
          </Text>
          <SettingToggle
            label="Push Notifications"
            description="Garden growth updates, weather alerts"
            value={notifications}
            onToggle={() => setNotifications(!notifications)}
          />
          <SettingToggle
            label="Marketplace Updates"
            description="When someone buys your listing"
            value={notifications}
            onToggle={() => setNotifications(!notifications)}
          />
        </Card>

        {/* Privacy */}
        <Card className="mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">
            Privacy
          </Text>
          <SettingToggle
            label="Location Sharing"
            description="Show nearby gardeners your general area"
            value={locationSharing}
            onToggle={() => setLocationSharing(!locationSharing)}
          />
          <SettingToggle
            label="Geohash Privacy"
            description="Obscure your exact location"
            value={locationSharing}
            onToggle={() => setLocationSharing(!locationSharing)}
          />
        </Card>

        {/* Security */}
        <Card className="mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">
            Security
          </Text>
          <SettingToggle
            label="Two-Factor Authentication"
            description="Extra security for your account"
            value={twoFactor}
            onToggle={() => setTwoFactor(!twoFactor)}
          />
          <TouchableOpacity className="py-4 border-b border-gray-100">
            <Text className="text-sm font-medium text-gray-900">
              Link Telegram Account
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Theme */}
        <Card className="mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">
            Appearance
          </Text>
          <TouchableOpacity className="py-4 border-b border-gray-100" onPress={toggleTheme}>
            <Text className="text-sm font-medium text-gray-900">
              Theme: {theme === lightTheme ? 'Light' : 'Dark'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity className="py-4 border-b border-gray-100">
            <Text className="text-sm font-medium text-gray-900">
              Language: English
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Legal */}
        <Card className="mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">
            Legal
          </Text>
          <TouchableOpacity className="py-3 border-b border-gray-100">
            <Text className="text-sm text-gray-700">Terms of Service</Text>
          </TouchableOpacity>
          <TouchableOpacity className="py-3 border-b border-gray-100">
            <Text className="text-sm text-gray-700">Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity className="py-3">
            <Text className="text-sm text-gray-700">Data Deletion Request</Text>
          </TouchableOpacity>
        </Card>

        {/* Game Data */}
        <Card className="mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">
            Game Data
          </Text>

          {/* Sync status row */}
          <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
            <View className="flex-row items-center">
              <View
                className={`w-2.5 h-2.5 rounded-full mr-2 ${
                  isOnline ? (hasPendingSync ? 'bg-yellow-500' : 'bg-green-500') : 'bg-red-500'
                }`}
              />
              <Text className="text-sm text-gray-800">
                {isOnline ? (hasPendingSync ? 'Pending sync' : 'Synced') : 'Offline'}
              </Text>
            </View>
            <Text className="text-xs text-gray-400">
              Last sync: {formatSyncTime(lastSyncTime)}
            </Text>
          </View>

          {/* Storage usage */}
          <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
            <Text className="text-sm text-gray-800">Local storage used</Text>
            <Text className="text-sm font-medium text-gray-600">{storageUsage}</Text>
          </View>

          {/* Pending indicator */}
          {hasPendingSync && (
            <View className="flex-row items-center py-2 mb-2">
              <Text className="text-xs text-yellow-600 font-medium">
                Changes queued for next sync
              </Text>
            </View>
          )}

          {/* Action buttons */}
          <View className="mt-2">
            <Button
              title={isSyncing ? 'Saving...' : 'Save Game Now'}
              onPress={handleSaveGameNow}
              isLoading={isSyncing}
              variant="outline"
              className="mb-3"
            />
            <Button
              title={isSyncing ? 'Syncing...' : 'Sync with Server'}
              onPress={handleSyncWithServer}
              isLoading={isSyncing}
              variant="outline"
              className="mb-3"
            />
            <Button
              title="Clear Local Data"
              onPress={handleClearLocalData}
              variant="ghost"
            />
          </View>
        </Card>

        {/* Danger Zone */}
        <Card className="mb-4 border border-red-200">
          <Text className="text-base font-semibold text-red-600 mb-4">
            Danger Zone
          </Text>
          <Button
            title="Logout"
            onPress={handleLogout}
            variant="outline"
            className="mb-3"
          />
          <Button
            title="Delete Account"
            onPress={handleDeleteAccount}
            variant="ghost"
          />
        </Card>
      </View>

      {/* Toast for game data actions */}
      {ToastComponent}
    </ScrollView>
  );
}
