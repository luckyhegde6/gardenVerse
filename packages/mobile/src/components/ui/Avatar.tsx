import React from "react";
import { View, Image, Text } from "react-native";

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showOnline?: boolean;
  isOnline?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { container: 32, font: "text-xs" },
  md: { container: 40, font: "text-sm" },
  lg: { container: 56, font: "text-lg" },
  xl: { container: 80, font: "text-2xl" },
};

const onlineDotSize = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
};

function getInitials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getColorFromName(name?: string): string {
  if (!name) return "#9ca3af";
  const colors = [
    "#16a34a",
    "#15803d",
    "#166534",
    "#14532d",
    "#ca8a04",
    "#a16207",
    "#854d0e",
    "#06b6d4",
    "#14b8a6",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({
  uri,
  name,
  size = "md",
  showOnline = false,
  isOnline = false,
  className = "",
}: AvatarProps) {
  const dim = sizeMap[size];
  const dotSize = onlineDotSize[size];

  return (
    <View className={`relative ${className}`}>
      {uri ? (
        <Image
          source={{ uri }}
          className="rounded-full"
          style={{ width: dim.container, height: dim.container }}
        />
      ) : (
        <View
          className="rounded-full items-center justify-center"
          style={{
            width: dim.container,
            height: dim.container,
            backgroundColor: getColorFromName(name),
          }}
        >
          <Text className={`text-white font-bold ${dim.font}`}>
            {getInitials(name)}
          </Text>
        </View>
      )}
      {showOnline && (
        <View
          className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white"
          style={{
            width: dotSize,
            height: dotSize,
            backgroundColor: isOnline ? "#22c55e" : "#9ca3af",
          }}
        />
      )}
    </View>
  );
}
