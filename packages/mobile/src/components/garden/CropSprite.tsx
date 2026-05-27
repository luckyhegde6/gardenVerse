import React from 'react';
import { View, Text } from 'react-native';
import { Crop, CropStatus } from '../../types';

interface CropSpriteProps {
  crop: Crop;
  size?: number;
}

const cropEmojis: Record<string, Record<CropStatus, string>> = {
  tomato: {
    SEED: '🌰',
    SPROUTING: '🌱',
    GROWING: '🌿',
    MATURE: '🍅',
    HARVESTED: '🪹',
    WILTED: '🥀',
    DISEASED: '🍂',
  },
  carrot: {
    SEED: '🌰',
    SPROUTING: '🌱',
    GROWING: '🌿',
    MATURE: '🥕',
    HARVESTED: '🪹',
    WILTED: '🥀',
    DISEASED: '🍂',
  },
  sunflower: {
    SEED: '🌰',
    SPROUTING: '🌱',
    GROWING: '🌿',
    MATURE: '🌻',
    HARVESTED: '🪹',
    WILTED: '🥀',
    DISEASED: '🍂',
  },
  wheat: {
    SEED: '🌰',
    SPROUTING: '🌱',
    GROWING: '🌾',
    MATURE: '🌾',
    HARVESTED: '🪹',
    WILTED: '🥀',
    DISEASED: '🍂',
  },
  corn: {
    SEED: '🌰',
    SPROUTING: '🌱',
    GROWING: '🌿',
    MATURE: '🌽',
    HARVESTED: '🪹',
    WILTED: '🥀',
    DISEASED: '🍂',
  },
};

const defaultEmoji: Record<CropStatus, string> = {
  SEED: '🌰',
  SPROUTING: '🌱',
  GROWING: '🌿',
  MATURE: '🌿',
  HARVESTED: '🪹',
  WILTED: '🥀',
  DISEASED: '🍂',
};

export function CropSprite({ crop, size = 32 }: CropSpriteProps) {
  const nameKey = crop.name.toLowerCase();
  const emojiMap = cropEmojis[nameKey] || null;
  const emoji = emojiMap ? emojiMap[crop.status] : defaultEmoji[crop.status];

  const isUnhealthy =
    crop.status === CropStatus.WILTED || crop.status === CropStatus.DISEASED;
  const isReady =
    crop.status === CropStatus.MATURE || crop.status === CropStatus.HARVESTED;

  return (
    <View className="items-center justify-center" style={{ width: size, height: size }}>
      <Text style={{ fontSize: size * 0.65 }}>{emoji}</Text>
      {crop.status === CropStatus.GROWING && (
        <View className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 border border-white" />
      )}
      {isUnhealthy && (
        <View className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-400 border border-white" />
      )}
      {crop.status === CropStatus.MATURE && (
        <View className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-400 border border-white" />
      )}
    </View>
  );
}
