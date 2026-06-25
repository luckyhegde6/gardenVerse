import React, { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  AppState,
  AppStateStatus,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useGarden } from '../../hooks/useGarden';
import { useAuthStore } from '../../stores/authStore';
import { IsometricGrid } from '../../components/garden/IsometricGrid';
import { Garden3D } from '../../components/garden/Garden3D';

import { GardenAnalytics } from '../../components/garden/GardenAnalytics';
import { WaterButton } from '../../components/garden/WaterButton';
import { FertilizeButton } from '../../components/garden/FertilizeButton';
import { HarvestButton } from '../../components/garden/HarvestButton';
import { Badge } from '../../components/ui/Badge';
// import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
// import { EmptyState } from '../../components/ui/EmptyState';
import { GrowthOverlay } from '../../components/garden/GrowthOverlay';
import { WeatherBar } from '../../components/garden/WeatherBar';
import { WalkthroughOverlay, useWalkthrough } from '../../components/garden/WalkthroughOverlay';
import { Crop, CollectionStats, GardenType, WeatherData } from '../../types';
import GamificationService from '../../services/gamification';
import { growthEngine, GrowthState, WeatherCondition } from '../../services/growthEngine';
import { useGardenStore } from '../../stores/gardenStore';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';
import api from '../../services/api';
import { requestLocationPermission, requestNotificationPermission } from '../../utils/permissions';
import HapticFeedback from '../../utils/haptics';
import { useTheme } from '../../styles/ThemeContext';
import { plantIdQuest } from '../../services/plantIdentificationQuest';
import type { IdentifiedPlantPhoto } from '../../types';
import { SyncStatusIndicator } from '../../components/SyncStatusIndicator';
import { SaveGameButton } from '../../components/SaveGameButton';
import { gameSaveSync } from '../../services/gameSaveSync';
import { useToast } from '../../components/ui/Toast';

export function GardenScreen() {
  const { theme } = useTheme();
  const router = useRouter();
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
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [engineState, setEngineState] = useState<GrowthState | null>(null);

  const {
    showWalkthrough,
    checking: walkthroughChecking,
    completeWalkthrough,
    skipWalkthrough,
  } = useWalkthrough();

  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [, setNotificationPermission] = useState<boolean>(false);

  const [collectionStats, setCollectionStats] = useState<CollectionStats>({
    discovered: 0,
    total: 0,
    completion: 0,
  });

  // ─── Plant-ID quest state ──────────────────────────────────────────────
  const [recentIdentifications, setRecentIdentifications] = useState<IdentifiedPlantPhoto[]>([]);
  const [speciesIdentifiedCount, setSpeciesIdentifiedCount] = useState(0);

  // ─── Save & Sync ────────────────────────────────────────────────────────
  const { show: showToast, hide: _hideToast, ToastComponent } = useToast();
  const autoSaveDone = useRef(false);

  // Auto-save on app background/resume
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // App going to background: save and sync
        try {
          await gameSaveSync.saveAndSyncOnBackground({
            crops,
            gardens: useGardenStore.getState().gardens,
            questProgress: [],
            collections: [],
          });
        } catch {
          // Silent fail on background save
        }
      } else if (nextAppState === 'active') {
        // App coming to foreground: sync
        autoSaveDone.current = false;
        try {
          const result = await gameSaveSync.syncWithServer();
          if (result.success && !autoSaveDone.current) {
            autoSaveDone.current = true;
            showToast({ message: 'Game saved', type: 'success', duration: 2000 });
          }
        } catch {
          // Silent fail on resume sync
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [crops, showToast]);

  const animatedProgress = useSharedValue(0);
  const viewTransition = useSharedValue(0);

  const isVirtual = selectedGarden?.type === 'VIRTUAL';

  // ─── Fetch Collection Stats ────────────────────────────────────────────────

  const fetchCollectionStats = useCallback(async () => {
    try {
      const stats = await GamificationService.getCollectionStats();
      setCollectionStats(stats);
    } catch {
      // Silent fail
    }
  }, []);

  // ─── Fetch recent plant identifications ────────────────────────────────────

  const fetchRecentIdentifications = useCallback(async () => {
    try {
      const photos = await plantIdQuest.getPlantPhotoCollection();
      setRecentIdentifications(photos.slice(0, 5));
      const count = await plantIdQuest.getSpeciesIdentifiedCount();
      setSpeciesIdentifiedCount(count);
    } catch {
      // Silent fail
    }
  }, []);

  // ─── Fetch Weather ─────────────────────────────────────────────────────────

  const fetchWeather = useCallback(async () => {
    if (!selectedGarden?.timezone) return;
    try {
      const region = selectedGarden?.address?.split(',').pop()?.trim() || 'IN-KA';
      const resp = await api.get(`/weather?region=${encodeURIComponent(region)}`);
      setWeather(resp.data?.data || resp.data);
    } catch {
      // Silent fail — weather is non-critical
    }
  }, [selectedGarden]);

  useEffect(() => {
    if (user?.experience) {
      animatedProgress.value = withTiming(user.experience / 1000, {
        duration: 1000,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [user?.experience]);

  useEffect(() => {
    fetchCollectionStats();
    fetchWeather();
    fetchRecentIdentifications();
  }, [fetchCollectionStats, fetchWeather, fetchRecentIdentifications]);

  // ─── Growth Engine Integration ──────────────────────────────────────────
  const engineStarted = useRef(false)

  useEffect(() => {
    if (crops.length === 0 || !selectedGarden || engineStarted.current) return
    engineStarted.current = true
    const sync = useGardenStore.getState().syncCrops
    growthEngine.start(
      crops,
      selectedGarden.type as GardenType,
      selectedGarden.sunlightExposure,
      (updated) => {
        sync(updated)
        setEngineState({ lastTickAt: Date.now(), ticksElapsed: growthEngine['timer'] ? 1 : 0 })
      },
    )
    return () => { growthEngine.stop(); engineStarted.current = false }
  }, [!!selectedGarden])

  useEffect(() => {
    if (engineStarted.current && crops.length > 0) {
      growthEngine.updateCrops(crops)
    }
  }, [crops])

  // ─── Feed weather data to growth engine ─────────────────────────────────
  useEffect(() => {
    if (!weather || !engineStarted.current) return
    const conditionMap: Record<string, WeatherCondition> = {
      Clear: "clear", Clouds: "cloudy", Rain: "rain", Drizzle: "rain",
      Thunderstorm: "heavy_rain", Snow: "frost", Mist: "cloudy",
      Fog: "cloudy", Haze: "cloudy", Wind: "wind",
    }
    const condition = conditionMap[weather.condition] || "clear"
    const isHeatwave = weather.temperature > 38 && condition === "clear"
    growthEngine.setWeather({
      condition: isHeatwave ? "heatwave" : condition,
      temperature: weather.temperature,
      humidity: weather.humidity,
      rainfall: weather.rainfall,
    })
  }, [weather])

  // ─── Engine state polling ───────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (engineStarted.current) {
        setEngineState({ lastTickAt: Date.now(), ticksElapsed: growthEngine['timer'] ? 1 : 0 })
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // ─── Permission Requests for REAL Gardens ─────────────────────────────
  useEffect(() => {
    if (selectedGarden?.type === 'REAL') {
      requestLocationPermission().then(setLocationPermission);
      requestNotificationPermission().then(setNotificationPermission);
    }
  }, [selectedGarden?.type])

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([refreshGardens(), fetchCollectionStats(), fetchWeather()])
      .then(() => setRefreshing(false))
      .catch(() => setRefreshing(false));
  }, [refreshGardens, fetchCollectionStats, fetchWeather]);

  const switchView = useCallback((mode: '2d' | '3d') => {
    HapticFeedback.light();
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
      HapticFeedback.light();
      if (crop) {
        if (selectedCropId === crop.id) {
          router.push({ pathname: '/crop-detail/[cropId]', params: { cropId: crop.id } });
        } else {
          setSelectedCropId(crop.id);
        }
      } else {
        setSelectedCropId(null);
        router.push({ pathname: '/plant-crop', params: { plotX: String(col), plotY: String(row) } });
      }
    },
    [selectedCropId, router],
  );

  // ─── Plant-Centric Computations ────────────────────────────────────────────

  const careStreakCrops = useMemo(() => {
    return [...crops]
      .filter((c: Crop) => c.careStreak > 0)
      .sort((a: Crop, b: Crop) => b.careStreak - a.careStreak)
      .slice(0, 5);
  }, [crops]);

  const masteryLevel = user?.level ?? 1;
  const masteredCount = collectionStats.total > 0
    ? Math.round((collectionStats.completion / 100) * collectionStats.total)
    : 0;

  // ─── Action Handlers ─────────────────────────────────────────────────────

  const handleWater = useCallback(
    async (cropId: string) => {
      HapticFeedback.medium();
      try {
        await waterCrop(cropId);
        growthEngine.onCropAction(cropId, 'water');
      } catch {
        // Error handled upstream
      }
    },
    [waterCrop],
  );

  const handleFertilize = useCallback(
    async (cropId: string) => {
      HapticFeedback.medium();
      try {
        await fertilizeCrop(cropId);
        growthEngine.onCropAction(cropId, 'fertilize');
      } catch {
        // Error handled upstream
      }
    },
    [fertilizeCrop],
  );

  const handleHarvest = useCallback(
    async (cropId: string) => {
      HapticFeedback.success();
      try {
        await harvestCrop(cropId);
      } catch {
        // Error handled upstream
      }
    },
    [harvestCrop],
  );

  const selectedCropForOverlay = selectedCropId
    ? crops.find((c: Crop) => c.id === selectedCropId) || null
    : null;

  return (
    <View testID="garden-screen" style={{ flex: 1, backgroundColor: theme.background }}>
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
            <SyncStatusIndicator compact />
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

      {/* Weather Bar */}
      <WeatherBar weather={weather} timezone={selectedGarden?.timezone} />

      {/* Permission Banner for REAL Gardens */}
      {selectedGarden?.type === 'REAL' && !locationPermission && (
        <View style={styles.permissionBanner}>
          <Text style={styles.permissionBannerText}>📍 Enable location for REAL garden features</Text>
          <TouchableOpacity
            onPress={() => requestLocationPermission().then(setLocationPermission)}
            style={styles.permissionBannerButton}
          >
            <Text style={styles.permissionBannerButtonText}>Enable</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Error Banner */}
      {error && (
        <View className="bg-red-50 border-b border-red-200 px-4 py-3 flex-row items-center">
          <Text className="text-red-700 text-sm flex-1">{error}</Text>
          <TouchableOpacity
            onPress={onRefresh}
            className="bg-red-100 px-3 py-1 rounded-lg"
          >
            <Text className="text-red-700 text-xs font-semibold">Retry</Text>
          </TouchableOpacity>
        </View>
      )}

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

        {/* Garden View Toggle Bar */}
        <View className="px-4 mt-3 mb-2">
          <View className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="bg-gray-100 rounded-xl p-1 flex-row">
                <TouchableOpacity
                  onPress={() => switchView('2d')}
                  className={`px-3 py-1.5 rounded-lg flex-row items-center gap-1 ${viewMode === '2d' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Text className={`text-xs ${viewMode === '2d' ? 'text-primary-600' : 'text-gray-400'}`}>
                    {viewMode === '2d' ? '▦' : '▦'}
                  </Text>
                  <Text className={`text-xs font-semibold ${viewMode === '2d' ? 'text-primary-600' : 'text-gray-500'}`}>
                    2D
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => switchView('3d')}
                  className={`px-3 py-1.5 rounded-lg flex-row items-center gap-1 ${viewMode === '3d' ? 'bg-white shadow-sm' : ''}`}
                >
                  <Text className={`text-xs ${viewMode === '3d' ? 'text-primary-600' : 'text-gray-400'}`}>
                    {viewMode === '3d' ? '◈' : '◈'}
                  </Text>
                  <Text className={`text-xs font-semibold ${viewMode === '3d' ? 'text-primary-600' : 'text-gray-500'}`}>
                    3D
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                onPress={() => setShowAnalytics(v => !v)}
                className={`px-2.5 py-1.5 rounded-lg ${showAnalytics ? 'bg-primary-50' : 'bg-gray-50'}`}
              >
                <Text className={`text-xs font-medium ${showAnalytics ? 'text-primary-600' : 'text-gray-500'}`}>
                  📊
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/plant-crop')}
              className="bg-primary-600 px-4 py-2 rounded-xl active:bg-primary-700 flex-row items-center gap-1"
            >
              <Text className="text-white text-sm font-bold">+</Text>
              <Text className="text-white text-sm font-semibold">Plant</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Analytics Panel */}
        {showAnalytics && (
          <View className="px-4 mb-3">
            <GardenAnalytics
              crops={crops}
              gridWidth={6}
              gridHeight={6}
              soilQuality={soilQuality}
              onClose={() => setShowAnalytics(false)}
            />
          </View>
        )}

        {/* Garden Grid — always visible */}
        <View className="px-4 mb-4">
          <Animated.View
            style={viewToggleStyle}
            className="bg-white rounded-2xl p-2 shadow-sm border border-gray-100"
          >
            {viewMode === '2d' ? (
              <View>
                <IsometricGrid
                  crops={crops}
                  gridWidth={6}
                  gridHeight={6}
                  selectedCropId={selectedCropId}
                  onTilePress={handleTilePress}
                  onWaterCrop={(cid) => handleWater(cid)}
                  onFertilizeCrop={(cid) => handleFertilize(cid)}
                  soilQuality={soilQuality}
                  irrigationLevel={irrigationLevel}
                />
                {crops.length === 0 && (
                  <View className="items-center py-4">
                    <Text className="text-gray-400 text-xs">
                      Tap any empty plot or press + Plant to start growing
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View>
                <Garden3D
                  selectedCropId={selectedCropId}
                  onTilePress={handleTilePress}
                  onPlantPress={(col, row) => router.push({ pathname: '/plant-crop', params: { plotX: String(col), plotY: String(row) } })}
                />
                {crops.length === 0 && (
                  <View className="items-center py-4">
                    <Text className="text-gray-400 text-xs">
                      Tap any empty plot or press + Plant to start growing
                    </Text>
                  </View>
                )}
              </View>
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
                  onPress={() => handleWater(selectedCrop.id)}
                  crop={selectedCrop}
                  className="flex-1"
                />
                <FertilizeButton
                  onPress={() => handleFertilize(selectedCrop.id)}
                  crop={selectedCrop}
                  className="flex-1"
                />
                <HarvestButton
                  onPress={() => handleHarvest(selectedCrop.id)}
                  crop={selectedCrop}
                  className="flex-1"
                />
              </View>
            </View>
          </View>
        )}

        {/* ─── Loading Skeletons (while data loads) ─────────────────────────── */}
        {isLoading && (
          <View className="px-4 mb-4">
            <View style={styles.sectionCard}>
              <SkeletonLoader width="50%" height={20} borderRadius={6} style={{ marginBottom: 12 }} />
              <SkeletonLoader width={60} height={22} borderRadius={11} style={{ marginBottom: 12 }} />
              <View style={{ marginBottom: 8 }}>
                <SkeletonLoader width="100%" height={8} borderRadius={4} />
              </View>
              <SkeletonLoader width="70%" height={12} borderRadius={4} />
            </View>
          </View>
        )}

        {isLoading && (
          <View className="px-4 mb-4">
            <View style={styles.sectionCard}>
              <SkeletonLoader width="40%" height={20} borderRadius={6} style={{ marginBottom: 12 }} />
              {[0, 1, 2].map((i) => (
                <View key={i} style={[styles.streakRow, { borderBottomColor: '#f3f4f6', borderBottomWidth: 1 }]}>
                  <View style={styles.streakLeft}>
                    <SkeletonLoader width={20} height={20} borderRadius={10} />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <SkeletonLoader width="80%" height={14} borderRadius={4} style={{ marginBottom: 4 }} />
                      <SkeletonLoader width="50%" height={10} borderRadius={4} />
                    </View>
                  </View>
                  <SkeletonLoader width={30} height={20} borderRadius={6} />
                </View>
              ))}
            </View>
          </View>
        )}

        {isLoading && (
          <View className="px-4 mb-6">
            <View style={styles.sectionCard}>
              <View className="flex-row items-center justify-between mb-2">
                <SkeletonLoader width="45%" height={20} borderRadius={6} />
                <SkeletonLoader width={50} height={22} borderRadius={11} />
              </View>
              <View className="flex-row items-center justify-between mb-2">
                <SkeletonLoader width={60} height={28} borderRadius={6} />
                <SkeletonLoader width={60} height={28} borderRadius={6} />
                <SkeletonLoader width={60} height={28} borderRadius={6} />
              </View>
              <SkeletonLoader width="100%" height={8} borderRadius={4} style={{ marginTop: 12 }} />
              <SkeletonLoader width={80} height={28} borderRadius={10} style={{ marginTop: 16 }} />
            </View>
          </View>
        )}

        {/* ─── Collections Section ─────────────────────────────────────────── */}
        {!isLoading && (
          <>
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
                  // streakColor = '#6366f1';
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
                      <Text style={styles.streakLabel}>{streakLabel}</Text>
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
                const firstCropId = crops[0]?.id;
                if (firstCropId) {
                  router.push({ pathname: '/crop-detail/[cropId]', params: { cropId: firstCropId } });
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.masteryButtonText}>
                View All Masteries →
              </Text>
            </TouchableOpacity>
          </View>
        </View>
          </>
        )}

        {/* Bottom padding for overlay */}
        <View className="h-96" />
      </ScrollView>

      {/* ─── Walkthrough Overlay (first-time users) ─────────────────────── */}
      {!walkthroughChecking && (
        <WalkthroughOverlay
          visible={showWalkthrough}
          onComplete={completeWalkthrough}
          onSkip={skipWalkthrough}
        />
      )}

      {/* ─── Floating Growth Overlay ───────────────────────────────────────── */}
      <GrowthOverlay
        crop={selectedCropForOverlay}
        garden={selectedGarden || null}
        weather={weather}
        engineState={engineState}
        isVirtual={isVirtual}
      />

      {/* ─── Floating "Identify Plant" Button ──────────────────────────────── */}
      <TouchableOpacity
        style={styles.floatingIdentifyButton}
        onPress={() => {
          HapticFeedback.medium();
          router.push("/ai-scanner" as any);
        }}
        activeOpacity={0.85}
        accessibilityLabel="Identify a plant"
        accessibilityRole="button"
      >
        <Text style={styles.floatingIdentifyIcon}>📸</Text>
        <Text style={styles.floatingIdentifyText}>Identify Plant</Text>
      </TouchableOpacity>

      {/* ─── Recent Identification Badges ──────────────────────────────────── */}
      {recentIdentifications.length > 0 && (
        <View style={styles.idBadgeContainer}>
          {recentIdentifications.slice(0, 3).map((photo, idx) => (
            <View
              key={photo.id}
              style={[
                styles.idBadge,
                { right: 16 + idx * 44 },
              ]}
            >
              <Text style={styles.idBadgeText}>
                {photo.speciesName.charAt(0).toUpperCase()}
              </Text>
            </View>
          ))}
          {speciesIdentifiedCount > 0 && (
            <View style={[styles.idBadge, styles.idBadgeCount, { right: 16 + Math.min(recentIdentifications.length, 3) * 44 }]}>
              <Text style={styles.idBadgeCountText}>+{speciesIdentifiedCount}</Text>
            </View>
          )}
        </View>
      )}

      {/* ─── Save Game FAB ──────────────────────────────────────────────────── */}
      <SaveGameButton />

      {/* ─── Auto-save Toast ────────────────────────────────────────────────── */}
      {ToastComponent}
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

  // Permission Banner
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fef3cd',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
  },
  permissionBannerText: {
    fontSize: 13,
    color: '#92400e',
    flex: 1,
  },
  permissionBannerButton: {
    backgroundColor: '#d97706',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginLeft: 12,
  },
  permissionBannerButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },

  // ─── Floating Identify Button ────────────────────────────────────────────
  floatingIdentifyButton: {
    position: "absolute",
    bottom: 24,
    right: 16,
    backgroundColor: "#0d2818",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  floatingIdentifyIcon: {
    fontSize: 18,
  },
  floatingIdentifyText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },

  // ─── Recent ID Badges ────────────────────────────────────────────────────
  idBadgeContainer: {
    position: "absolute",
    top: 8,
    right: 0,
    flexDirection: "row",
  },
  idBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  idBadgeText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#ffffff",
  },
  idBadgeCount: {
    backgroundColor: "#6366f1",
    width: "auto" as any,
    paddingHorizontal: 8,
    borderRadius: 18,
  },
  idBadgeCountText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#ffffff",
  },
});
