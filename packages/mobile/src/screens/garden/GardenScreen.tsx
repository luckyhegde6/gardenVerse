import React, { useCallback, useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGarden } from '../../hooks/useGarden';
import { useAuthStore } from '../../stores/authStore';
import { IsometricGrid } from '../../components/garden/IsometricGrid';
import { Garden3D } from '../../components/garden/Garden3D';
import { Minimap } from '../../components/garden/Minimap';
import { WaterButton } from '../../components/garden/WaterButton';
import { FertilizeButton } from '../../components/garden/FertilizeButton';
import { HarvestButton } from '../../components/garden/HarvestButton';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { GardenStackParamList, Crop, CollectionStats } from '../../types';
import GamificationService from '../../services/gamification';

type GardenNavProp = NativeStackNavigationProp<GardenStackParamList, 'GardenHome'>;

export function GardenScreen() {
  const navigation = useNavigation<GardenNavProp>();
  const {
    crops,
    selectedGarden,
    isLoading,
    error,
    refreshGardens,
    waterCrop,
    fertilizeCrop,
    harvestCrop,
  } = useGarden();
  const user = useAuthStore((s) => s.user);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedCropId, setSelectedCropId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  // ─── Plant-Centric State ───────────────────────────────────────────────────

  const [collectionStats, setCollectionStats] = useState<CollectionStats>({
    discovered: 0,
    total: 0,
    completion: 0,
  });

  const animatedProgress = useSharedValue(0);
  const viewTransition = useSharedValue(0);

  const isVirtual = selectedGarden?.type === 'VIRTUAL';

  // ─── Fetch Collection Stats ────────────────────────────────────────────────

  const fetchCollectionStats = useCallback(async () => {
    try {
      const stats = await GamificationService.getCollectionStats();
      setCollectionStats(stats);
    } catch {
      // Silent fail — collections are non-critical
    }
  }, []);

  useEffect(() => {
    if (user?.experience) {
      animatedProgress.value = withTiming(user.experience / 1000, {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [user?.experience]);

  // Fetch collection stats on mount
  useEffect(() => {
    fetchCollectionStats();
  }, [fetchCollectionStats]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([refreshGardens(), fetchCollectionStats()])
      .then(() => setRefreshing(false))
      .catch(() => setRefreshing(false));
  }, [refreshGardens, fetchCollectionStats]);

  const switchView = useCallback((mode: '2d' | '3d') => {
    viewTransition.value = withSpring(0, { damping: 15 });
    setTimeout(() => {
      setViewMode(mode);
      viewTransition.value = withSpring(1, { damping: 12, stiffness: 120 });
    }, 100);
  }, []);

  const viewToggleStyle = useAnimatedStyle(() => ({
    opacity: viewTransition.value,
    transform: [
      { scale: interpolate(viewTransition.value, [0, 1], [0.95, 1]) },
    ],
  }));

  const selectedCrop = selectedCropId
    ? crops.find((c) => c.id === selectedCropId)
    : null;
  const soilQuality = selectedGarden?.soilQuality ?? 50;
  const irrigationLevel = selectedGarden?.irrigationLevel ?? 50;

  const handleTilePress = useCallback(
    (col: number, row: number, crop?: Crop) => {
      if (crop) {
        if (selectedCropId === crop.id) {
          navigation.navigate('CropDetail', { cropId: crop.id });
        } else {
          setSelectedCropId(crop.id);
        }
      } else {
        setSelectedCropId(null);
        navigation.navigate('PlantCrop', { plotX: col, plotY: row });
      }
    },
    [selectedCropId, navigation],
  );

  // ─── Plant-Centric Computations ────────────────────────────────────────────

  /** Top crops sorted by care streak (descending) for the care streaks section */
  const careStreakCrops = useMemo(() => {
    return [...crops]
      .filter((c: Crop) => c.careStreak > 0)
      .sort((a: Crop, b: Crop) => b.careStreak - a.careStreak)
      .slice(0, 5);
  }, [crops]);

  /** Compute average mastery level from user level (proxy for now) */
  const masteryLevel = user?.level ?? 1;
  const masteredCount = collectionStats.total > 0
    ? Math.round((collectionStats.completion / 100) * collectionStats.total)
    : 0;

  // ─── Simple Harvest Handler (no XP popup) ──────────────────────────────────

  const handleHarvest = useCallback(
    async (cropId: string) => {
      try {
        await harvestCrop(cropId);
      } catch {
        // Error handled by existing harvest flow
      }
    },
    [harvestCrop],
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* ─── Plant-Centric Header ──────────────────────────────────────────── */}
      <View style={styles.plantHeader}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>
              {selectedGarden?.name || 'My Garden'}
            </Text>
            <Text style={styles.headerSubtitle}>
              Level {masteryLevel} Gardener
            </Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.collectionBadge}>
              <Text style={styles.collectionBadgeText}>
                🌿 {collectionStats.discovered}/{collectionStats.total}
              </Text>
            </View>
            {user && (
              <View style={styles.creditsBadge}>
                <Text style={styles.creditsBadgeText}>
                  🪙 {user.greenCredits}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* ─── Main Scrollable Content ──────────────────────────────────────── */}
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        {isVirtual && (
          <View className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex-row items-center">
            <Text className="text-lg mr-2">⚡</Text>
            <View className="flex-1">
              <Text className="text-amber-800 text-sm font-semibold">
                Virtual Garden — 100x Speed
              </Text>
              <Text className="text-amber-600 text-xs">
                Crops grow 100x faster than real-time
              </Text>
            </View>
            <Badge label="VIRTUAL" variant="warning" size="sm" />
          </View>
        )}

        {/* Garden View Toggle */}
        <View className="px-4 mt-3 mb-2 flex-row justify-between items-center">
          <Text className="text-sm font-medium text-gray-600">Garden View</Text>
          <View className="flex-row gap-2 bg-gray-200 rounded-full p-0.5">
            <TouchableOpacity
              onPress={() => switchView('2d')}
              className={`px-4 py-1.5 rounded-full ${viewMode === '2d' ? 'bg-white shadow-sm' : ''}`}
            >
              <Animated.Text
                className={`text-xs font-medium ${viewMode === '2d' ? 'text-primary-600' : 'text-gray-500'}`}
              >
                2D
              </Animated.Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => switchView('3d')}
              className={`px-4 py-1.5 rounded-full ${viewMode === '3d' ? 'bg-white shadow-sm' : ''}`}
            >
              <Animated.Text
                className={`text-xs font-medium ${viewMode === '3d' ? 'text-primary-600' : 'text-gray-500'}`}
              >
                3D
              </Animated.Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Minimap */}
        <View className="px-4 mb-2">
          <Minimap />
        </View>

        {/* Garden Grid */}
        <View className="px-4 mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center gap-2">
              <Text className="text-lg font-bold text-gray-900">
                {selectedGarden?.name || 'My Garden'}
              </Text>
              {isVirtual && (
                <Text className="text-xs text-amber-600">⚡100x</Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => navigation.navigate('PlantCrop', {})}
              className="bg-primary-600 px-4 py-2 rounded-xl active:bg-primary-700"
            >
              <Text className="text-white text-sm font-semibold">+ Plant</Text>
            </TouchableOpacity>
          </View>

          <Animated.View
            style={viewToggleStyle}
            className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100"
          >
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
            ) : viewMode === '2d' ? (
              <IsometricGrid
                crops={crops}
                gridWidth={4}
                gridHeight={4}
                selectedCropId={selectedCropId}
                onTilePress={handleTilePress}
                soilQuality={soilQuality}
                irrigationLevel={irrigationLevel}
              />
            ) : (
              <Garden3D />
            )}
          </Animated.View>
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
                  onPress={() => handleHarvest(selectedCrop.id)}
                  className="flex-1"
                />
              </View>
            </View>
          </View>
        )}

        {/* ─── Collections Section ─────────────────────────────────────────── */}
        <View className="px-4 mb-4">
          <View style={styles.sectionCard}>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-bold text-gray-900">
                🌿 Plant Collections
              </Text>
              <Badge
                label={`${collectionStats.completion}%`}
                variant={
                  collectionStats.completion >= 75
                    ? 'success'
                    : collectionStats.completion >= 25
                      ? 'warning'
                      : 'neutral'
                }
                size="sm"
              />
            </View>
            <View className="mb-2">
              <View className="flex-row justify-between mb-1">
                <Text className="text-xs text-gray-500">
                  Species discovered
                </Text>
                <Text className="text-xs font-semibold text-gray-700">
                  {collectionStats.discovered} / {collectionStats.total}
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(100, collectionStats.completion)}%`,
                      backgroundColor:
                        collectionStats.completion >= 75
                          ? '#16a34a'
                          : collectionStats.completion >= 25
                            ? '#d97706'
                            : '#6366f1',
                    },
                  ]}
                />
              </View>
            </View>
            <Text className="text-xs text-gray-400">
              {collectionStats.total - collectionStats.discovered > 0
                ? `${collectionStats.total - collectionStats.discovered} more species to discover!`
                : 'All species discovered! 🌟'}
            </Text>
          </View>
        </View>

        {/* ─── Care Streaks Section ────────────────────────────────────────── */}
        {careStreakCrops.length > 0 && (
          <View className="px-4 mb-4">
            <View style={styles.sectionCard}>
              <Text className="text-base font-bold text-gray-900 mb-3">
                💚 Care Streaks
              </Text>
              {careStreakCrops.map((crop: Crop) => {
                const streak = crop.careStreak;
                let streakLabel = `${streak} day${streak !== 1 ? 's' : ''}`;
                let streakColor = '#6b7280';
                if (streak >= 30) {
                  streakLabel += ' 🔥';
                  streakColor = '#dc2626';
                } else if (streak >= 14) {
                  streakLabel += ' ⭐';
                  streakColor = '#d97706';
                } else if (streak >= 7) {
                  streakLabel += ' 💪';
                  streakColor = '#16a34a';
                } else if (streak >= 3) {
                  streakLabel += ' 👍';
                  streakColor = '#6366f1';
                }
                return (
                  <TouchableOpacity
                    key={crop.id}
                    style={styles.streakRow}
                    onPress={() => {
                      setSelectedCropId(crop.id);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.streakLeft}>
                      <Text style={styles.streakIcon}>🌱</Text>
                      <View>
                        <Text className="text-sm font-medium text-gray-800">
                          {crop.name}
                        </Text>
                        <Text className="text-xs text-gray-400">
                          Stage {crop.growthStage} · Health {crop.health}%
                        </Text>
                      </View>
                    </View>
                    <View style={styles.streakRight}>
                      <Text
                        style={[styles.streakCount, { color: streakColor }]}
                      >
                        {streak}
                      </Text>
                      <Text style={styles.streakLabel}>days</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ─── Mastery Summary Section ─────────────────────────────────────── */}
        <View className="px-4 mb-6">
          <View style={styles.sectionCard}>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-base font-bold text-gray-900">
                🏆 Species Mastery
              </Text>
              <Badge
                label={`Level ${masteryLevel}`}
                variant="primary"
                size="sm"
              />
            </View>
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center gap-3">
                <View style={styles.masteryStat}>
                  <Text className="text-lg font-bold text-primary-600">
                    {masteredCount}
                  </Text>
                  <Text className="text-xs text-gray-400">Mastered</Text>
                </View>
                <View style={styles.masteryStat}>
                  <Text className="text-lg font-bold text-amber-600">
                    {collectionStats.discovered}
                  </Text>
                  <Text className="text-xs text-gray-400">Discovered</Text>
                </View>
                <View style={styles.masteryStat}>
                  <Text className="text-lg font-bold text-green-600">
                    {crops.length}
                  </Text>
                  <Text className="text-xs text-gray-400">Growing</Text>
                </View>
              </View>
            </View>
            <View className="mt-1">
              <View className="flex-row justify-between mb-1">
                <Text className="text-xs text-gray-500">
                  Level progression
                </Text>
                <Text className="text-xs font-semibold text-gray-700">
                  {user?.experience ?? 0} / {(user?.level ?? 1) * 100} XP
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(100, ((user?.experience ?? 0) / ((user?.level ?? 1) * 100)) * 100)}%`,
                      backgroundColor: '#6366f1',
                    },
                  ]}
                />
              </View>
            </View>
            <TouchableOpacity
              style={styles.masteryButton}
              onPress={() => {
                // Navigate to mastery summary — placeholder for now
                navigation.navigate('CropDetail', {
                  cropId: crops[0]?.id ?? '',
                });
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.masteryButtonText}>
                View All Masteries →
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Plant-Centric Styles ────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Header
  plantHeader: {
    backgroundColor: '#0d2818',
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a4a2a',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  collectionBadge: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  collectionBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#a5b4fc',
  },
  creditsBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
  },
  creditsBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD700',
  },

  // Section Card
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },

  // Progress Bar
  progressBarBg: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },

  // Care Streaks
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  streakIcon: {
    fontSize: 20,
  },
  streakRight: {
    alignItems: 'center',
    minWidth: 48,
  },
  streakCount: {
    fontSize: 18,
    fontWeight: '800',
  },
  streakLabel: {
    fontSize: 9,
    color: '#9ca3af',
    fontWeight: '500',
    textTransform: 'uppercase',
  },

  // Mastery
  masteryStat: {
    alignItems: 'center',
  },
  masteryButton: {
    marginTop: 12,
    backgroundColor: '#f0f0ff',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  masteryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366f1',
  },
});
