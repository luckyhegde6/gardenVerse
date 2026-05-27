import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Group } from '../../types';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';

interface GroupCardProps {
  group: Group;
  onPress: () => void;
}

export function GroupCard({ group, onPress }: GroupCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100"
      activeOpacity={0.7}
    >
      <View className="flex-row items-start">
        <Avatar
          name={group.name}
          size="lg"
        />
        <View className="flex-1 ml-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-gray-900 flex-1">
              {group.name}
            </Text>
            <Badge label={group.type} variant="info" size="sm" />
          </View>
          {group.description && (
            <Text className="text-sm text-gray-500 mt-1" numberOfLines={2}>
              {group.description}
            </Text>
          )}
          <View className="flex-row items-center mt-2">
            <Text className="text-xs text-gray-400">👥</Text>
            <Text className="text-xs text-gray-400 ml-1">
              {group.memberCount} members
            </Text>
            {group.region && (
              <>
                <Text className="text-xs text-gray-400 ml-3">📍</Text>
                <Text className="text-xs text-gray-400 ml-1">{group.region}</Text>
              </>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
