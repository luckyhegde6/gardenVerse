import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { MemberListItem } from '../../components/community/MemberListItem';
import { CommunityStackParamList } from '../../types';

type GroupDetailRouteProp = RouteProp<CommunityStackParamList, 'GroupDetail'>;
type GroupDetailNavProp = NativeStackNavigationProp<
  CommunityStackParamList,
  'GroupDetail'
>;

export function GroupDetailScreen() {
  const navigation = useNavigation<GroupDetailNavProp>();
  const route = useRoute<GroupDetailRouteProp>();
  const { groupId } = route.params;

  const mockMembers = [
    { username: 'greenmaster', displayName: 'Green Master', role: 'ADMIN', isOnline: true, level: 42 },
    { username: 'ecowarrior', displayName: 'Eco Warrior', role: 'MODERATOR', isOnline: true, level: 38 },
    { username: 'seedking', displayName: 'Seed King', role: 'MEMBER', isOnline: false, level: 35 },
    { username: 'plantlover', displayName: 'Plant Lover', role: 'MEMBER', isOnline: true, level: 28 },
    { username: 'gardenqueen', displayName: 'Garden Queen', role: 'MEMBER', isOnline: false, level: 31 },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      {/* Group Info */}
      <View className="bg-white items-center py-6 px-4">
        <View className="w-20 h-20 bg-primary-100 rounded-full items-center justify-center mb-3">
          <Text className="text-3xl">🌿</Text>
        </View>
        <Text className="text-xl font-bold text-gray-900">
          SF Bay Gardeners
        </Text>
        <Text className="text-sm text-gray-500 text-center mt-1 px-4">
          Local gardening community in the Bay Area. Share tips, trade seeds,
          and organize meetups.
        </Text>
        <View className="flex-row mt-3 gap-2">
          <Badge label="Regional" variant="info" size="sm" />
          <Badge label="234 members" variant="primary" size="sm" />
        </View>
      </View>

      <View className="px-4 py-4">
        {/* Actions */}
        <View className="flex-row gap-3 mb-4">
          <Button
            title="💬 Chat"
            onPress={() =>
              navigation.navigate('ChatScreen', { groupId })
            }
            className="flex-1"
          />
          <Button
            title="Leave"
            onPress={() => {}}
            variant="outline"
            className="flex-1"
          />
        </View>

        {/* Members */}
        <Card>
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-semibold text-gray-900">
              Members
            </Text>
            <Text className="text-sm text-gray-400">234 total</Text>
          </View>
          {mockMembers.map((member) => (
            <MemberListItem
              key={member.username}
              username={member.username}
              displayName={member.displayName}
              role={member.role}
              isOnline={member.isOnline}
              level={member.level}
            />
          ))}
        </Card>
      </View>
    </ScrollView>
  );
}
