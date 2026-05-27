import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../stores/authStore';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { ProfileStackParamList, UserRole } from '../../types';

type ProfileNavProp = NativeStackNavigationProp<
  ProfileStackParamList,
  'ProfileHome'
>;

export function ProfileScreen() {
  const navigation = useNavigation<ProfileNavProp>();
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  const menuItems = [
    { icon: '🌱', label: 'My Garden', screen: 'GardenHome' as string },
    { icon: '🎒', label: 'Inventory', screen: 'Inventory' },
    { icon: '🏆', label: 'Achievements', screen: 'Achievements' },
    { icon: '📨', label: 'Invites', screen: 'Invites' },
    { icon: '⚙️', label: 'Settings', screen: 'Settings' },
  ];

  if (user.role === UserRole.ADMIN || user.role === UserRole.MODERATOR) {
    menuItems.push({ icon: '🛡️', label: 'Admin Panel', screen: 'AdminPanel' });
  }

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
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
          variant={user.role === 'ADMIN' ? 'error' : user.role === 'MODERATOR' ? 'warning' : 'primary'}
          className="mt-2"
        />
      </View>

      {/* Level & XP */}
      <Card className="mx-4 mt-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-base font-bold text-gray-900">
            Level {user.level}
          </Text>
          <Text className="text-sm text-gray-500">
            {user.experience} / 1000 XP
          </Text>
        </View>
        <ProgressBar value={user.experience} maxValue={1000} height={10} />
      </Card>

      {/* Stats Grid */}
      <View className="flex-row flex-wrap px-4 mt-4 gap-3">
        <StatCard icon="💰" label="Green Credits" value={user.greenCredits.toString()} />
        <StatCard icon="♻️" label="Eco Points" value={user.ecoPoints.toString()} />
        <StatCard icon="🌍" label="Sustainability" value={`${user.sustainabilityScore}`} />
        <StatCard icon="🤝" label="Trust Score" value={`${user.trustScore}`} />
      </View>

      {/* Streak */}
      <Card className="mx-4 mt-4 flex-row items-center">
        <Text className="text-3xl mr-3">🔥</Text>
        <View>
          <Text className="text-lg font-bold text-gray-900">
            {user.currentStreak} Day Streak
          </Text>
          <Text className="text-xs text-gray-500">
            Keep logging in daily to increase your streak!
          </Text>
        </View>
      </Card>

      {/* Menu Items */}
      <View className="px-4 mt-4 mb-8">
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={item.label}
            onPress={() => {
              if (item.screen === 'GardenHome') {
                (navigation as any).navigate('GardenTab');
              } else {
                (navigation as any).navigate(item.screen);
              }
            }}
            className={`flex-row items-center bg-white px-4 py-4 ${
              index === 0
                ? 'rounded-t-2xl'
                : index === menuItems.length - 1
                ? 'rounded-b-2xl'
                : ''
            } border-b border-gray-100`}
          >
            <Text className="text-xl mr-3">{item.icon}</Text>
            <Text className="text-base text-gray-900 flex-1">{item.label}</Text>
            <Text className="text-gray-300 text-lg">›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <Card className="w-[47%] items-center py-4">
      <Text className="text-2xl mb-1">{icon}</Text>
      <Text className="text-lg font-bold text-gray-900">{value}</Text>
      <Text className="text-xs text-gray-500">{label}</Text>
    </Card>
  );
}
