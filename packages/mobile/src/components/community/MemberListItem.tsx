import React from "react";
import { View, Text } from "react-native";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";

interface MemberListItemProps {
  username: string;
  displayName?: string;
  avatarUrl?: string;
  role?: string;
  isOnline?: boolean;
  level?: number;
}

export function MemberListItem({
  username,
  displayName,
  avatarUrl,
  role,
  isOnline = false,
  level,
}: MemberListItemProps) {
  return (
    <View className="flex-row items-center py-3 border-b border-gray-100">
      <Avatar
        uri={avatarUrl}
        name={displayName || username}
        size="md"
        showOnline
        isOnline={isOnline}
      />
      <View className="flex-1 ml-3">
        <View className="flex-row items-center">
          <Text className="text-sm font-semibold text-gray-900">
            {displayName || username}
          </Text>
          {level && (
            <Text className="text-xs text-gray-400 ml-2">Lv.{level}</Text>
          )}
        </View>
        <Text className="text-xs text-gray-500">@{username}</Text>
      </View>
      {role && role !== "MEMBER" && (
        <Badge
          label={
            role === "ADMIN" ? "Admin" : role === "MODERATOR" ? "Mod" : role
          }
          variant={
            role === "ADMIN"
              ? "error"
              : role === "MODERATOR"
                ? "warning"
                : "info"
          }
          size="sm"
        />
      )}
    </View>
  );
}
