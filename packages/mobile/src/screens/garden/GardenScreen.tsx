import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGarden } from '../../hooks/useGarden';
import { useAuthStore } from '../../stores/authStore';
import { GardenStats } from '../../components/garden/GardenStats';
import { PlotCell } from '../../components/garden/PlotCell';
import { WaterButton } from '../../components/garden/WaterButton';
import { FertilizeButton } from '../../components/garden/FertilizeButton';
import { HarvestButton } from '../../components/garden/HarvestButton';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { GardenStackParamList } from '../../types';

type GardenNavProp = NativeStackNavigationProp<GardenStackParamList, 'GardenHome'>;

const GRID_COLS = 4;
const GRID_ROWS = 4;

export function GardenScreen() {
  const navigation = useNavigation<GardenNavProp>();
  const { crops, selectedGarden, isLoading, error, refreshGardens, waterCrop, fertilizeCrop, harvestCrop } = useGarden();
  const user = useAuthStore((s) => s.user);

  const [refreshing, setRefreshing] = React.useState(false);
  const [selectedCropId, setSelectedCropId] = React.useState<string | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshGardens();
    setRefreshing(false);
  }, [refreshGardens]);

  if (isLoading && crops.length === 0) {
    return <LoadingSpinner fullScreen message="Loading your garden..." />;
  }

  if (error && crops.length === 0) {
    return (
      <EmptyState
        title="Couldn't load garden"
        description={error}
        actionLabel="Retry"
        onAction={refreshGardens}
      />
    );
  }

  const selectedCrop = selectedCropId
    ? crops.find((c) => c.id === selectedCropId)
    : null;

  const soilQuality = selectedGarden?.soilQuality ?? 0;
  const irrigationLevel = selectedGarden?.irrigationLevel ?? 0;

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Header */}
        {user && (
          <GardenStats
            user={user}
            cropCount={crops.length}
            soilQuality={soilQuality}
          />
        )}

        {/* Garden Grid */}
        <View className="px-4 mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold text-gray-900">
              {selectedGarden?.name || 'My Garden'}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('PlantCrop', {})}
              className="bg-primary-600 px-4 py-2 rounded-xl"
            >
              <Text className="text-white text-sm font-semibold">+ Plant</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
            {crops.length === 0 ? (
              <View className="items-center py-12">
                <Text className="text-4xl mb-3">🌱</Text>
                <Text className="text-gray-500 text-sm mb-1">
                  Your garden is empty
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('PlantCrop', {})}
                  className="bg-primary-600 px-6 py-2.5 rounded-xl mt-2"
                >
                  <Text className="text-white font-semibold">
                    Plant Your First Crop
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="gap-2">
                {Array.from({ length: GRID_ROWS }, (_, row) => (
                  <View key={row} className="flex-row gap-2">
                    {Array.from({ length: GRID_COLS }, (_, col) => {
                      const crop = crops.find(
                        (c) => c.plotX === col && c.plotY === row
                      );
                      const isSelected = selectedCropId === crop?.id;
                      return (
                        <PlotCell
                          key={`${row}-${col}`}
                          crop={crop}
                          isEmpty={!crop}
                          isSelected={isSelected}
                          size={72}
                          onPress={() => {
                            if (crop) {
                              if (isSelected) {
                                navigation.navigate('CropDetail', {
                                  cropId: crop.id,
                                });
                              } else {
                                setSelectedCropId(crop.id);
                              }
                            }
                          }}
                        />
                      );
                    })}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Selected Crop Actions */}
        {selectedCrop && (
          <View className="px-4 mb-4">
            <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <Text className="text-base font-semibold text-gray-900 mb-3">
                {selectedCrop.name} Actions
              </Text>
              <View className="flex-row justify-between gap-2">
                <WaterButton
                  onPress={() => waterCrop(selectedCrop.id)}
                  className="flex-1"
                />
                <FertilizeButton
                  onPress={() => fertilizeCrop(selectedCrop.id)}
                  className="flex-1"
                />
                <HarvestButton
                  onPress={() => harvestCrop(selectedCrop.id)}
                  className="flex-1"
                />
              </View>
            </View>
          </View>
        )}

        {/* Daily Quests */}
        <View className="px-4 mb-6">
          <Text className="text-base font-bold text-gray-900 mb-3">
            Daily Quests
          </Text>
          {[
            { icon: '💧', title: 'Water 3 crops', progress: '1/3', xp: 50 },
            { icon: '🌿', title: 'Fertilize a crop', progress: '0/1', xp: 30 },
            { icon: '📸', title: 'Scan a plant', progress: '0/1', xp: 40 },
          ].map((quest, index) => (
            <View
              key={index}
              className="bg-white rounded-xl px-4 py-3 mb-2 flex-row items-center border border-gray-100"
            >
              <Text className="text-xl mr-3">{quest.icon}</Text>
              <View className="flex-1">
                <Text className="text-sm font-medium text-gray-900">
                  {quest.title}
                </Text>
                <View className="flex-row items-center mt-1">
                  <View className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <View
                      className="h-full bg-primary-500 rounded-full"
                      style={{
                        width: quest.progress === '1/3' ? '33%' : '0%',
                      }}
                    />
                  </View>
                  <Text className="text-xs text-gray-400 ml-2">
                    +{quest.xp} XP
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
