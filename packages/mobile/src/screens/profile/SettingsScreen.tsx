import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { useAuthStore } from '../../stores/authStore';

export function SettingsScreen() {
  const navigation = useNavigation();
  const { user, updateProfile, logout } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [notifications, setNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateProfile({ displayName });
    } catch {} finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is irreversible. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {},
        },
      ]
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
          value ? 'bg-primary-600' : 'bg-gray-300'
        }`}
      >
        <View
          className={`w-5 h-5 rounded-full bg-white shadow-sm ${
            value ? 'ml-5' : ''
          }`}
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
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
          <TouchableOpacity className="py-4 border-b border-gray-100">
            <Text className="text-sm font-medium text-gray-900">
              Theme: Light
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
            <Text className="text-sm text-gray-700">
              Data Deletion Request
            </Text>
          </TouchableOpacity>
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
    </ScrollView>
  );
}
