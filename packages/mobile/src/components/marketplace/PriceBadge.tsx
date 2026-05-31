import React from "react";
import { View, Text } from "react-native";

interface PriceBadgeProps {
  price: number;
  currency?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PriceBadge({
  price,
  currency = "GVC",
  size = "md",
  className = "",
}: PriceBadgeProps) {
  const sizeStyles = {
    sm: { container: "px-2 py-0.5", text: "text-xs" },
    md: { container: "px-3 py-1", text: "text-sm" },
    lg: { container: "px-4 py-2", text: "text-lg" },
  };

  const s = sizeStyles[size];

  return (
    <View
      className={`bg-primary-100 rounded-full flex-row items-center ${s.container} ${className}`}
    >
      <Text className={`font-bold text-primary-800 ${s.text}`}>
        {price.toLocaleString()}
      </Text>
      <Text className={`text-primary-600 ml-1 ${s.text}`}>{currency}</Text>
    </View>
  );
}
