import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import { Crop } from '../../types';
import { CropSprite } from './CropSprite';

interface PlotCellProps {
  crop?: Crop | null;
  isEmpty?: boolean;
  isSelected?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  size?: number;
}

export function PlotCell({
  crop,
  isEmpty = false,
  isSelected = false,
  onPress,
  onLongPress,
  size = 80,
}: PlotCellProps) {
  const borderColor = isSelected
    ? 'border-primary-500'
    : isEmpty
    ? 'border-dashed border-gray-300'
    : 'border-gray-200';

  const bgColor = isEmpty
    ? 'bg-gray-50'
    : crop?.status === 'WILTED' || crop?.status === 'DISEASED'
    ? 'bg-red-50'
    : 'bg-white';

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={isEmpty && !onPress}
      activeOpacity={0.7}
      className={`
        items-center justify-center rounded-xl border-2 ${borderColor} ${bgColor}
      `}
      style={{ width: size, height: size }}
    >
      {crop ? (
        <View className="items-center justify-center">
          <CropSprite crop={crop} />
        </View>
      ) : isEmpty ? (
        <View className="items-center justify-center">
          <View className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300 items-center justify-center">
            <View className="w-1 h-1 bg-gray-300 rounded-full" />
          </View>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}
