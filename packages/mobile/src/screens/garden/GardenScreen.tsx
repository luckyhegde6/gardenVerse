import React, { useCallback, useState, useEffect, useMemo, useRef, Suspense } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  StyleSheet,
  AppState,
  AppStateStatus,
  Dimensions,
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
const Garden3D = React.lazy(() =>
  import('../../components/garden/Garden3D').then(m => ({ default: m.Garden3D }))
);
import { GardenAnalytics } from '../../components/garden/GardenAnalytics';
import { WaterButton } from '../../components/garden/WaterButton';
import { FertilizeButton } from '../../components/garden/FertilizeButton';
import { HarvestButton } from '../../components/garden/HarvestButton';
import { WeatherBar } from '../../components/garden/WeatherBar';
import { WalkthroughOverlay, useWalkthrough } from '../../components/garden/WalkthroughOverlay';
import { PlantSelectionSheet } from '../../components/garden/PlantSelectionSheet';
import { CropDetailModal } from '../../components/garden/CropDetailModal';
import { LevelUpModal } from '../../components/garden/LevelUpModal';
import { XPFloatingManager } from '../../components/garden/XPFloatingText';
import { ParticleProvider, useParticleSystem } from '../../components/garden/ParticleSystem';
import { QuestTrackerWidget } from '../../components/garden/QuestTrackerWidget';
import { GardenViewport } from '../../components/garden/GardenViewport';
import { FloatingActionButton } from '../../components/garden/FloatingActionButton';
import { PlantHealthBadge } from '../../components/garden/PlantHealthBadge';
import { SyncWidget } from '../../components/garden/SyncWidget';
import { XpBar } from '../../components/garden/XpBar';
import { StreakDisplay } from '../../components/garden/StreakDisplay';
import { CollapsibleSection } from '../../components/ui/CollapsibleSection';
import { LoadingCard } from '../../components/ui/LoadingCard';
import { Badge } from '../../components/ui/Badge';
import { useGameFeedback } from '../../utils/gameFeedback';
import { Crop, CollectionStats, GardenType, WeatherData, PlantSpecies } from '../../types';
import GamificationService from '../../services/gamification';
import { growthEngine, GrowthState, WeatherCondition } from '../../services/growthEngine';
import { useGardenStore } from '../../stores/gardenStore';
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
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY, SHADOWS } from '../../styles/tokens';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const GARDEN_VIEWPORT_HEIGHT = SCREEN_HEIGHT * 0.6;

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
    gardens,
    canPurchaseMore,
    selectGarden,
    selectedGardenId,
  } = useGarden();
  const user = useAuthStore((s) => s.user);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedCropId, setSelectedCropId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [, setEngineState] = useState<GrowthState | null>(null);

  const { showWalkthrough, checking: walkthroughChecking, completeWalkthrough, skipWalkthrough } = useWalkthrough();

  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [, setNotificationPermission] = useState<boolean>(false);

  const [collectionStats, setCollectionStats] = useState<CollectionStats>({
    discovered: 0,
    total: 0,
    completion: 0,
  });

  const [recentIdentifications, setRecentIdentifications] = useState<IdentifiedPlantPhoto[]>([]);
  const [speciesIdentifiedCount, setSpeciesIdentifiedCount] = useState(0);

  const { show: showToast, ToastComponent } = useToast();
  const autoSaveDone = useRef(false);

  const [showCropDetail, setShowCropDetail] = useState(false);

  const [xpEvents, setXpEvents] = useState<Array<{ id: string; amount: number; position: { x: number; y: number } }>>([]);
  const xpCounterRef = useRef(0);

  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel] = useState(1);

  const addXpEvent = useCallback((amount: number, position?: { x: number; y: number }) => {
    const id = `xp-${++xpCounterRef.current}`;
    setXpEvents(prev => [...prev, { id, amount, position: position || { x: 150, y: 300 } }]);
  }, []);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
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

  const fetchCollectionStats = useCallback(async () => {
    try {
      const stats = await GamificationService.getCollectionStats();
      setCollectionStats(stats);
    } catch {
      // Silent fail
    }
  }, []);

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
      (growingCropIds) => {
        growingCropIds.forEach(cropId => {
          const crop = crops.find(c => c.id === cropId)
          if (crop && crop.plotX !== undefined && crop.plotY !== undefined) {
            const pos = { x: 50 + crop.plotX * 60, y: 50 + crop.plotY * 60 }
            emit('growthTick', pos)
          }
        })
      },
    )
    return () => { growthEngine.stop(); engineStarted.current = false }
  }, [!!selectedGarden])

  useEffect(() => {
    if (engineStarted.current && crops.length > 0) {
      growthEngine.updateCrops(crops)
    }
  }, [crops])

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

  useEffect(() => {
    const interval = setInterval(() => {
      if (engineStarted.current) {
        setEngineState({ lastTickAt: Date.now(), ticksElapsed: growthEngine['timer'] ? 1 : 0 })
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [])

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

  const selectedCrop = selectedCropId ? crops.find((c) => c.id === selectedCropId) : null;
  const soilQuality = selectedGarden?.soilQuality ?? 50;
  const irrigationLevel = selectedGarden?.irrigationLevel ?? 50;

  const handleTilePress = useCallback(
    (col: number, row: number, crop?: Crop) => {
      HapticFeedback.light();
      if (crop) {
        if (selectedCropId === crop.id) {
          setShowCropDetail(true);
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

  const { emit } = useParticleSystem();
  const feedback = useGameFeedback();

  const [showPlantSheet, setShowPlantSheet] = useState(false);
  const [plantSheetPosition, setPlantSheetPosition] = useState<{ plotX: number; plotY: number } | null>(null);

  useEffect(() => {
    if (!isLoading && crops.length === 0 && !showWalkthrough) {
      setPlantSheetPosition({ plotX: 3, plotY: 3 });
      setShowPlantSheet(true);
    }
  }, [isLoading, crops.length, showWalkthrough]);

  const handleWater = useCallback(
    async (cropId: string) => {
      try {
        await waterCrop(cropId);
        growthEngine.onCropAction(cropId, 'water');
        feedback.trigger('water', { x: 150, y: 300 }).catch(() => {});
        addXpEvent(10, { x: 150, y: 250 });
        const crop = crops.find(c => c.id === cropId);
        if (crop && crop.plotX !== undefined && crop.plotY !== undefined) {
          addXpEvent(10, { x: 50 + crop.plotX * 60, y: 50 + crop.plotY * 60 });
        }
      } catch {
        // Error handled upstream
      }
    },
    [waterCrop, feedback, addXpEvent, crops],
  );

  const handleFertilize = useCallback(
    async (cropId: string) => {
      try {
        await fertilizeCrop(cropId);
        growthEngine.onCropAction(cropId, 'fertilize');
        feedback.trigger('fertilize', { x: 150, y: 300 }).catch(() => {});
        addXpEvent(15, { x: 150, y: 250 });
        const crop = crops.find(c => c.id === cropId);
        if (crop && crop.plotX !== undefined && crop.plotY !== undefined) {
          addXpEvent(15, { x: 50 + crop.plotX * 60, y: 50 + crop.plotY * 60 });
        }
      } catch {
        // Error handled upstream
      }
    },
    [fertilizeCrop, feedback, addXpEvent, crops],
  );

  const handleHarvest = useCallback(
    async (cropId: string) => {
      try {
        await harvestCrop(cropId);
        feedback.trigger('harvest', { x: 150, y: 300 }).catch(() => {});
        addXpEvent(50, { x: 150, y: 250 });
        const crop = crops.find(c => c.id === cropId);
        if (crop && crop.plotX !== undefined && crop.plotY !== undefined) {
          addXpEvent(50, { x: 50 + crop.plotX * 60, y: 50 + crop.plotY * 60 });
        }
      } catch {
        // Error handled upstream
      }
    },
    [harvestCrop, feedback, addXpEvent, crops],
  );

  const [availableSeeds, setAvailableSeeds] = useState<{ species: PlantSpecies; quantity: number }[]>([]);

  const fetchAvailableSeeds = useCallback(async () => {
    try {
      const res = await api.get('/shop?category=seeds');
      const items = res.data?.data || res.data;
      const seeds = items
        .filter((item: any) => item.category === 'seeds')
        .map((item: any) => ({
          species: {
            id: item.id,
            commonName: item.name,
            scientificName: item.description || '',
            difficulty: 'Easy',
            waterNeeds: 'Medium',
            sunlightNeeds: 'Full Sun',
            seasons: ['Spring', 'Summer'],
            edible: true,
            tags: [],
          } as PlantSpecies,
          quantity: item.stock || 99,
        }));
      setAvailableSeeds(seeds);
    } catch {
      setAvailableSeeds([
        { species: { id: 'tomato', commonName: 'Tomato', scientificName: 'Solanum lycopersicum', difficulty: 'Easy', waterNeeds: 'High', sunlightNeeds: 'Full Sun', seasons: ['Spring', 'Summer'], edible: true, tags: [] } as PlantSpecies, quantity: 10 },
        { species: { id: 'chilli', commonName: 'Chilli', scientificName: 'Capsicum annuum', difficulty: 'Easy', waterNeeds: 'Medium', sunlightNeeds: 'Full Sun', seasons: ['Spring', 'Summer'], edible: true, tags: [] } as PlantSpecies, quantity: 10 },
        { species: { id: 'mint', commonName: 'Mint', scientificName: 'Mentha', difficulty: 'Easy', waterNeeds: 'Medium', sunlightNeeds: 'Partial Shade', seasons: ['Spring', 'Summer', 'Fall'], edible: true, tags: [] } as PlantSpecies, quantity: 10 },
      ]);
    }
  }, []);

  useEffect(() => {
    fetchAvailableSeeds();
  }, [fetchAvailableSeeds]);

  const handlePlantFromSheet = useCallback(async (species: PlantSpecies) => {
    if (!plantSheetPosition || !selectedGardenId) return;
    try {
      await useGardenStore.getState().plantCrop(selectedGardenId, species.commonName, species.id, plantSheetPosition.plotX, plantSheetPosition.plotY);
      const pos = { x: 50 + plantSheetPosition.plotX * 60, y: 50 + plantSheetPosition.plotY * 60 };
      (emit as (type: 'plant' | 'water' | 'fertilize' | 'harvest' | 'confetti' | 'growthTick', position: { x: number; y: number }) => void)('plant', pos);
      growthEngine.onCropAction('', 'plant');
    } catch (e) {
      console.warn('Failed to plant crop:', e);
    }
    setShowPlantSheet(false);
    setPlantSheetPosition(null);
  }, [plantSheetPosition, selectedGardenId, emit]);

  const weatherCondition = weather?.condition
    ? (weather.condition === 'Clear' ? 'clear' as const
      : weather.condition === 'Clouds' ? 'clouds' as const
      : weather.condition === 'Rain' || weather.condition === 'Drizzle' ? 'rain' as const
      : weather.condition === 'Thunderstorm' ? 'storm' as const
      : weather.condition === 'Fog' || weather.condition === 'Mist' || weather.condition === 'Haze' ? 'haze' as const
      : 'clear' as const)
    : undefined;

  const xpToNext = (user?.level ?? 1) * 100;

  const topStreak = useMemo(() => {
    return Math.max(0, ...crops.map(c => c.careStreak ?? 0));
  }, [crops]);

  const selectedCropHealth = selectedCrop
    ? (selectedCrop.health > 70 ? 'healthy' as const
      : selectedCrop.health > 40 ? 'dry' as const
      : 'sick' as const)
    : undefined;

  return (
    <ParticleProvider>
      <View testID="garden-screen" style={[styles.root, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
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
              <QuestTrackerWidget onPress={() => router.push('/quests')} />
            </View>
          </View>
        </View>

        {gardens.length > 1 && (
          <View style={styles.plotSelector}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.plotSelectorContent}>
              {gardens.map((g) => (
                <TouchableOpacity
                  key={g.id}
                  onPress={() => selectGarden(g.id)}
                  style={[
                    styles.plotChip,
                    g.id === selectedGardenId && styles.plotChipActive,
                  ]}
                >
                  <Text style={[styles.plotChipText, g.id === selectedGardenId && styles.plotChipTextActive]}>
                    Plot #{g.plotNumber ?? gardens.indexOf(g) + 1}
                  </Text>
                  {g.isPurchased && (
                    <Text style={styles.plotChipCoin}>🪙</Text>
                  )}
                </TouchableOpacity>
              ))}
              {canPurchaseMore && (
                <TouchableOpacity
                  onPress={() => router.push('/plots')}
                  style={styles.plotBuyChip}
                >
                  <Text style={styles.plotBuyIcon}>+</Text>
                  <Text style={styles.plotBuyText}>Buy Plot</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}

        <WeatherBar weather={weather} timezone={selectedGarden?.timezone} />

        {selectedGarden?.type === 'REAL' && !locationPermission && (
          <View style={styles.permissionBanner}>
            <Text style={styles.permissionBannerText}>📍 Enable location for REAL garden features</Text>
            <TouchableOpacity onPress={() => requestLocationPermission().then(setLocationPermission)} style={styles.permissionBannerButton}>
              <Text style={styles.permissionBannerButtonText}>Enable</Text>
            </TouchableOpacity>
          </View>
        )}

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
            <TouchableOpacity onPress={onRefresh} style={styles.errorBannerButton}>
              <Text style={styles.errorBannerButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}
          style={styles.scroll}
        >
          {isVirtual && (
            <View style={styles.virtualBanner}>
              <Text style={styles.virtualBannerIcon}>⚡</Text>
              <View style={styles.virtualBannerContent}>
                <Text style={styles.virtualBannerTitle}>Virtual Garden — 100x Speed</Text>
                <Text style={styles.virtualBannerSub}>Crops grow 100x faster than real-time</Text>
              </View>
              <Badge label="VIRTUAL" variant="warning" size="sm" />
            </View>
          )}

          <View style={styles.viewportWrapper}>
            <GardenViewport environmentCondition={weatherCondition}>
              {viewMode === '2d' ? (
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
              ) : (
                <Suspense fallback={
                  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d2818' }}>
                    <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Loading 3D Garden...</Text>
                  </View>
                }>
                  <Garden3D
                    selectedCropId={selectedCropId}
                    onTilePress={handleTilePress}
                    onPlantPress={(col, row) => router.push({ pathname: '/plant-crop', params: { plotX: String(col), plotY: String(row) } })}
                  />
                </Suspense>
              )}
            </GardenViewport>

            <View style={styles.hudOverlay}>
              <XpBar currentXP={user?.experience ?? 0} xpToNext={xpToNext} level={masteryLevel} />
              <View style={styles.hudRow}>
                <StreakDisplay streak={topStreak} />
                <SyncWidget isOnline />
              </View>
            </View>
          </View>

          <View style={styles.viewToggleBar}>
            <View style={styles.viewToggleRow}>
              <View style={styles.viewToggleButtons}>
                <TouchableOpacity onPress={() => switchView('2d')} style={[styles.viewToggleBtn, viewMode === '2d' && styles.viewToggleBtnActive]}>
                  <Text style={[styles.viewToggleBtnText, viewMode === '2d' && styles.viewToggleBtnTextActive]}>▦ 2D</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => switchView('3d')} style={[styles.viewToggleBtn, viewMode === '3d' && styles.viewToggleBtnActive]}>
                  <Text style={[styles.viewToggleBtnText, viewMode === '3d' && styles.viewToggleBtnTextActive]}>◈ 3D</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity onPress={() => setShowAnalytics(v => !v)} style={styles.analyticsToggle}>
                <Text style={styles.analyticsToggleText}>📊</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => router.push('/plant-crop')} style={styles.plantButton}>
              <Text style={styles.plantButtonText}>+ Plant</Text>
            </TouchableOpacity>
          </View>

          {showAnalytics && (
            <View style={styles.analyticsContainer}>
              <GardenAnalytics
                crops={crops}
                gridWidth={6}
                gridHeight={6}
                soilQuality={soilQuality}
                onClose={() => setShowAnalytics(false)}
              />
            </View>
          )}

          <Animated.View style={[styles.gardenCard, viewToggleStyle]}>
            {crops.length === 0 && (
              <View style={styles.emptyGridHint}>
                <Text style={styles.emptyGridHintText}>
                  Tap any empty plot or press + Plant to start growing
                </Text>
              </View>
            )}
          </Animated.View>

          {selectedCrop && (
            <View style={styles.cropActions}>
              <View style={styles.cropActionsHeader}>
                <PlantHealthBadge status={selectedCropHealth || 'growing'} />
                <Text style={styles.cropActionsTitle}>{selectedCrop.name}</Text>
              </View>
              <View style={styles.cropActionsRow}>
                <WaterButton onPress={() => handleWater(selectedCrop.id)} crop={selectedCrop} />
                <FertilizeButton onPress={() => handleFertilize(selectedCrop.id)} crop={selectedCrop} />
                <HarvestButton onPress={() => handleHarvest(selectedCrop.id)} crop={selectedCrop} />
              </View>
            </View>
          )}

          {isLoading && (
            <View style={styles.skeletonSection}>
              <LoadingCard lines={3} />
              <LoadingCard lines={2} />
              <LoadingCard lines={3} />
            </View>
          )}

          {!isLoading && (
            <>
              <CollapsibleSection
                title="🌿 Plant Collections"
                badge={`${collectionStats.completion}%`}
              >
                <View style={styles.compactSection}>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Species discovered</Text>
                    <Text style={styles.statValue}>{collectionStats.discovered} / {collectionStats.total}</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${Math.min(100, collectionStats.completion)}%` }]} />
                  </View>
                  <Text style={styles.statHint}>
                    {collectionStats.total - collectionStats.discovered > 0
                      ? `${collectionStats.total - collectionStats.discovered} more species to discover!`
                      : 'All species discovered! 🌟'}
                  </Text>
                </View>
              </CollapsibleSection>

              {careStreakCrops.length > 0 && (
                <CollapsibleSection title="💚 Care Streaks">
                  {careStreakCrops.map((crop: Crop) => {
                    const streak = crop.careStreak;
                    let streakLabel = `${streak} day${streak !== 1 ? 's' : ''}`;
                    let streakColor: string = COLORS.textMuted;
                    if (streak >= 30) { streakLabel += ' 🔥'; streakColor = COLORS.dangerRed; }
                    else if (streak >= 14) { streakLabel += ' ⭐'; streakColor = COLORS.sunYellow; }
                    else if (streak >= 7) { streakLabel += ' 💪'; streakColor = COLORS.leafGreen; }
                    else if (streak >= 3) { streakLabel += ' 👍'; }
                    return (
                      <TouchableOpacity key={crop.id} style={styles.streakRow} onPress={() => setSelectedCropId(crop.id)} activeOpacity={0.7}>
                        <View style={styles.streakLeft}>
                          <Text style={styles.streakIcon}>🌱</Text>
                          <View>
                            <Text style={styles.streakName}>{crop.name}</Text>
                            <Text style={styles.streakSub}>Stage {crop.growthStage} · Health {crop.health}%</Text>
                          </View>
                        </View>
                        <View style={styles.streakRight}>
                          <Text style={[styles.streakCount, { color: streakColor }]}>{streak}</Text>
                          <Text style={styles.streakLabel}>{streakLabel}</Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </CollapsibleSection>
              )}

              <CollapsibleSection title="🏆 Species Mastery">
                <View style={styles.compactSection}>
                  <View style={styles.masteryRow}>
                    <View style={styles.masteryStat}>
                      <Text style={styles.masteryStatValue}>{masteredCount}</Text>
                      <Text style={styles.masteryStatLabel}>Mastered</Text>
                    </View>
                    <View style={styles.masteryStat}>
                      <Text style={[styles.masteryStatValue, { color: COLORS.sunYellow }]}>{collectionStats.discovered}</Text>
                      <Text style={styles.masteryStatLabel}>Discovered</Text>
                    </View>
                    <View style={styles.masteryStat}>
                      <Text style={[styles.masteryStatValue, { color: COLORS.leafGreen }]}>{crops.length}</Text>
                      <Text style={styles.masteryStatLabel}>Growing</Text>
                    </View>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Level progression</Text>
                    <Text style={styles.statValue}>{user?.experience ?? 0} / {xpToNext} XP</Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${Math.min(100, ((user?.experience ?? 0) / xpToNext) * 100)}%`, backgroundColor: COLORS.skyBlue }]} />
                  </View>
                  <TouchableOpacity style={styles.masteryButton} onPress={() => { const id = crops[0]?.id; if (id) router.push({ pathname: '/crop-detail/[cropId]', params: { cropId: id } }); }} activeOpacity={0.7}>
                    <Text style={styles.masteryButtonText}>View All Masteries →</Text>
                  </TouchableOpacity>
                </View>
              </CollapsibleSection>
            </>
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>

        <View style={[styles.fabContainer, { top: GARDEN_VIEWPORT_HEIGHT - 80 }]}>
          <FloatingActionButton icon="📸" color="#7c3aed" onPress={() => { HapticFeedback.medium(); router.push("/ai-scanner" as any); }} />
          <FloatingActionButton icon="💧" color={COLORS.skyBlue} onPress={() => { if (selectedCrop) handleWater(selectedCrop.id); }} position={{ bottom: 0, right: 70 }} />
          <FloatingActionButton icon="🌱" color={COLORS.soilBrown} onPress={() => router.push('/soil-check/' + (selectedCropId || ''))} position={{ bottom: 0, right: 0 }} />
        </View>

        {!walkthroughChecking && (
          <WalkthroughOverlay visible={showWalkthrough} onComplete={completeWalkthrough} onSkip={skipWalkthrough} />
        )}

        {recentIdentifications.length > 0 && (
          <View style={styles.idBadgeContainer}>
            {recentIdentifications.slice(0, 3).map((photo, idx) => (
              <View key={photo.id} style={[styles.idBadge, { right: 16 + idx * 44 }]}>
                <Text style={styles.idBadgeText}>{photo.speciesName.charAt(0).toUpperCase()}</Text>
              </View>
            ))}
            {speciesIdentifiedCount > 0 && (
              <View style={[styles.idBadge, styles.idBadgeCount, { right: 16 + Math.min(recentIdentifications.length, 3) * 44 }]}>
                <Text style={styles.idBadgeCountText}>+{speciesIdentifiedCount}</Text>
              </View>
            )}
          </View>
        )}

        <SaveGameButton />
        <XPFloatingManager xpEvents={xpEvents} />
        {ToastComponent}
      </View>
      <PlantSelectionSheet
        visible={showPlantSheet}
        onClose={() => setShowPlantSheet(false)}
        onPlant={handlePlantFromSheet}
        plotX={plantSheetPosition?.plotX ?? 0}
        plotY={plantSheetPosition?.plotY ?? 0}
        availableSeeds={availableSeeds}
      />
      <CropDetailModal
        visible={showCropDetail}
        crop={selectedCrop ?? null}
        onClose={() => setShowCropDetail(false)}
      />
      <LevelUpModal
        visible={showLevelUp}
        newLevel={newLevel}
        onClose={() => setShowLevelUp(false)}
      />
    </ParticleProvider>
  );
}

export default GardenScreen;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    backgroundColor: COLORS.darkForest,
    paddingTop: 12,
    paddingHorizontal: SPACING.md,
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
    ...TYPOGRAPHY.headingS,
    color: COLORS.white,
    fontWeight: '800',
  },
  headerSubtitle: {
    ...TYPOGRAPHY.caption,
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
  plotSelector: {
    backgroundColor: '#0a1f12',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1a4a2a',
  },
  plotSelectorContent: {
    gap: 8,
  },
  plotChip: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  plotChipActive: {
    backgroundColor: '#1a4a2a',
    borderColor: '#2d8a4e',
  },
  plotChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  plotChipTextActive: {
    color: '#a5f0b0',
  },
  plotChipCoin: {
    fontSize: 9,
    color: 'rgba(255,215,0,0.6)',
    textAlign: 'center',
    marginTop: 1,
  },
  plotBuyChip: {
    backgroundColor: 'rgba(99,102,241,0.2)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(99,102,241,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  plotBuyIcon: {
    fontSize: 14,
    fontWeight: '700',
    color: '#a5b4fc',
  },
  plotBuyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a5b4fc',
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fef3cd',
    paddingHorizontal: SPACING.md,
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
    color: COLORS.white,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#fecaca',
  },
  errorBannerText: {
    color: '#dc2626',
    fontSize: 13,
    flex: 1,
  },
  errorBannerButton: {
    backgroundColor: '#fecaca',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 12,
  },
  errorBannerButtonText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  virtualBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#fde68a',
  },
  virtualBannerIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  virtualBannerContent: {
    flex: 1,
  },
  virtualBannerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400e',
  },
  virtualBannerSub: {
    fontSize: 11,
    color: '#a16207',
  },
  viewportWrapper: {
    height: GARDEN_VIEWPORT_HEIGHT,
  },
  hudOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.sm,
    paddingTop: SPACING.xs,
  },
  hudRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  viewToggleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: 8,
    paddingBottom: 4,
  },
  viewToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewToggleButtons: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: BORDER_RADIUS.md,
    padding: 2,
  },
  viewToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.sm,
  },
  viewToggleBtnActive: {
    backgroundColor: COLORS.surface,
    ...SHADOWS.sm,
  },
  viewToggleBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  viewToggleBtnTextActive: {
    color: COLORS.primary,
  },
  analyticsToggle: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: COLORS.surfaceVariant,
    borderRadius: BORDER_RADIUS.sm,
  },
  analyticsToggleText: {
    fontSize: 14,
  },
  plantButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: BORDER_RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  plantButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
  analyticsContainer: {
    paddingHorizontal: SPACING.md,
    marginBottom: 8,
  },
  gardenCard: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: 0,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyGridHint: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  emptyGridHintText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  cropActions: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    ...SHADOWS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cropActionsHeader: {
    marginBottom: SPACING.sm,
  },
  cropActionsTitle: {
    ...TYPOGRAPHY.headingS,
    color: COLORS.text,
    marginTop: 4,
  },
  cropActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  skeletonSection: {
    paddingHorizontal: SPACING.md,
    gap: 12,
    marginBottom: SPACING.md,
  },
  compactSection: {
    paddingTop: SPACING.xs,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  statValue: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    color: COLORS.text,
  },
  statHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
    marginTop: 6,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
  streakName: {
    ...TYPOGRAPHY.bodySmall,
    fontWeight: '500',
    color: COLORS.text,
  },
  streakSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
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
    color: COLORS.textMuted,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  masteryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  masteryStat: {
    alignItems: 'center',
  },
  masteryStatValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  masteryStatLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textMuted,
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
  bottomSpacer: {
    height: 120,
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    width: 60,
    height: 200,
    alignItems: 'flex-end',
    gap: 12,
  },
  idBadgeContainer: {
    position: 'absolute',
    top: 100,
    right: 0,
    flexDirection: 'row',
  },
  idBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
    ...SHADOWS.md,
  },
  idBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.white,
  },
  idBadgeCount: {
    backgroundColor: '#6366f1',
    width: 'auto' as unknown as number,
    paddingHorizontal: 8,
    borderRadius: 18,
  },
  idBadgeCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.white,
  },
});
