import React, { useState } from "react";
import { View, Image, Text, StyleSheet } from "react-native";
import { COLORS, BORDER_RADIUS } from "../../styles/tokens";

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showOnline?: boolean;
  isOnline?: boolean;
}

const sizeMap: Record<string, { container: number; font: number }> = {
  sm: { container: 32, font: 12 },
  md: { container: 40, font: 16 },
  lg: { container: 56, font: 24 },
  xl: { container: 80, font: 32 },
};

const onlineDotSize: Record<string, number> = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
};

const avatarColors = [
  COLORS.primary,
  "#15803d",
  "#166534",
  "#14532d",
  "#ca8a04",
  "#a16207",
  "#854d0e",
  COLORS.skyBlue,
  "#14b8a6",
];

function getInitials(name?: string): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getColorFromName(name?: string): string {
  if (!name) return "#9ca3af";
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function Avatar({
  uri,
  name,
  size = "md",
  showOnline = false,
  isOnline = false,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const dim = sizeMap[size];
  const dotSize = onlineDotSize[size];
  const showImage = uri && !imageError;

  return (
    <View style={styles.container}>
      {showImage ? (
        <Image
          source={{ uri }}
          style={[
            styles.image,
            { width: dim.container, height: dim.container },
          ]}
          onError={() => setImageError(true)}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: dim.container,
              height: dim.container,
              backgroundColor: getColorFromName(name),
            },
          ]}
        >
          <Text
            style={[
              styles.initials,
              { fontSize: dim.font * 0.6, lineHeight: dim.font * 0.8 },
            ]}
          >
            {getInitials(name)}
          </Text>
        </View>
      )}
      {showOnline && (
        <View
          style={[
            styles.onlineDot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: isOnline ? COLORS.leafGreen : "#9ca3af",
            },
          ]}
        />
      )}
    </View>
  );
}

export default Avatar;

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  image: {
    borderRadius: BORDER_RADIUS.full,
  },
  fallback: {
    borderRadius: BORDER_RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    color: COLORS.white,
    fontWeight: "700",
  },
  onlineDot: {
    position: "absolute",
    bottom: -1,
    right: -1,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
});
