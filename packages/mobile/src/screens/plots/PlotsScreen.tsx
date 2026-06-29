import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useRouter } from "expo-router";
import { usePlotsStore } from "@stores/plotsStore";
import { useGardenStore } from "@stores/gardenStore";
import { useAuthStore } from "@stores/authStore";
import { Garden, GardenType } from "@/types";
import { SkeletonLoader } from "@components/ui/SkeletonLoader";
import { ProgressBar } from "@components/ui/ProgressBar";
import { Badge } from "@components/ui/Badge";

const GARDEN_TYPE_COLORS: Record<GardenType, string> = {
  [GardenType.VIRTUAL]: "#3b82f6",
  [GardenType.REAL]: "#22c55e",
  [GardenType.HYBRID]: "#a855f7",
};

function getSoilColor(quality: number): string {
  if (quality >= 70) return "#22c55e";
  if (quality >= 40) return "#eab308";
  return "#ef4444";
}

function getSoilLabel(quality: number): string {
  if (quality >= 70) return "Excellent";
  if (quality >= 40) return "Moderate";
  return "Poor";
}

function PlotCard({
  plot,
  onPress,
}: {
  plot: Garden;
  onPress: () => void;
}) {
  const cropCount = plot.crops?.length ?? plot.cropCount ?? 0;
  const typeColor = GARDEN_TYPE_COLORS[plot.type] ?? "#6b7280";

  return (
    <TouchableOpacity
      className="bg-white mx-4 mb-3 rounded-xl shadow-sm border border-gray-100 overflow-hidden active:opacity-80"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="p-4">
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-row items-center">
            <View
              className="w-10 h-10 rounded-lg items-center justify-center mr-3"
              style={{ backgroundColor: typeColor + "20" }}
            >
              <Text style={{ fontSize: 18, color: typeColor }}>
                {plot.type === GardenType.VIRTUAL
                  ? "🏠"
                  : plot.type === GardenType.REAL
                    ? "🌿"
                    : "🔄"}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900">
                Plot #{plot.plotNumber ?? "-"}
              </Text>
              <Text className="text-sm text-gray-500 mt-0.5" numberOfLines={1}>
                {plot.name}
              </Text>
            </View>
          </View>
          <Badge
            label={plot.type}
            variant={
              plot.type === GardenType.VIRTUAL
                ? "info"
                : plot.type === GardenType.REAL
                  ? "success"
                  : "secondary"
            }
            size="sm"
          />
        </View>

        <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-gray-100">
          <View className="flex-row items-center">
            <Text className="text-xs text-gray-500 mr-1">Soil</Text>
            <View
              className="w-2.5 h-2.5 rounded-full mr-1"
              style={{ backgroundColor: getSoilColor(plot.soilQuality) }}
            />
            <Text
              className="text-xs font-medium"
              style={{ color: getSoilColor(plot.soilQuality) }}
            >
              {getSoilLabel(plot.soilQuality)}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-xs text-gray-400 mr-1">🌾</Text>
            <Text className="text-xs text-gray-600">
              {cropCount} crop{cropCount !== 1 ? "s" : ""}
            </Text>
          </View>
          {plot.isPurchased && plot.purchasePrice ? (
            <Text className="text-xs text-gray-400">
              {plot.purchasePrice} GC
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function SkeletonPlotCard() {
  return (
    <View className="bg-white mx-4 mb-3 rounded-xl shadow-sm border border-gray-100 p-4">
      <View className="flex-row items-center mb-3">
        <SkeletonLoader width={40} height={40} borderRadius={8} />
        <View className="ml-3 flex-1">
          <SkeletonLoader width={120} height={16} borderRadius={4} />
          <View className="mt-1.5">
            <SkeletonLoader width={80} height={12} borderRadius={4} />
          </View>
        </View>
      </View>
      <SkeletonLoader width="100%" height={14} borderRadius={4} />
    </View>
  );
}

export function PlotsScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const {
    plots,
    pricing,
    isPurchasing,
    isLoading,
    error: storeError,
    fetchPlots,
    fetchPricing,
    purchasePlot,
    clearError,
  } = usePlotsStore();
  const { gardens } = useGardenStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchaseLoading, setPurchaseLoading] = useState(false);

  const maxPlots = user?.maxPlots ?? 10;
  const plotCount = plots.length;
  const canPurchase =
    (pricing?.canPurchase ?? plotCount < maxPlots) && plotCount < maxPlots;

  useEffect(() => {
    fetchPlots();
    fetchPricing();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchPlots(), fetchPricing()]);
    setRefreshing(false);
  }, [fetchPlots, fetchPricing]);

  const handleBuyPlot = useCallback(async () => {
    setPurchaseLoading(true);
    setPurchaseError(null);
    try {
      await purchasePlot();
      setShowBuyModal(false);
      // Refresh plots after purchase
      await fetchPlots();
      await fetchPricing();
    } catch (err: any) {
      setPurchaseError(err?.message || "Purchase failed. Please try again.");
    } finally {
      setPurchaseLoading(false);
    }
  }, [purchasePlot, fetchPlots, fetchPricing]);

  const handlePlotPress = useCallback(
    (plotId: string) => {
      router.push({
        pathname: "/plot-detail/[plotId]",
        params: { plotId },
      });
    },
    [router],
  );

  // Merge plot data from garden store for additional info
  const mergedPlots = plots.map((plot) => {
    const gardenPlot = gardens.find((g) => g.id === plot.id);
    return gardenPlot ? { ...plot, ...gardenPlot } : plot;
  });

  const nextPrice = pricing?.nextPlotPrice ?? 100;
  const pricingTiers = pricing?.pricingTiers ?? [];

  // Error banner
  const renderErrorBanner = () => {
    if (!storeError) return null;
    return (
      <View className="mx-4 mb-3 bg-red-50 border border-red-200 rounded-xl p-3 flex-row items-center">
        <Text className="text-red-500 mr-2">⚠️</Text>
        <Text className="flex-1 text-red-700 text-sm">{storeError}</Text>
        <TouchableOpacity onPress={clearError}>
          <Text className="text-red-500 font-medium">✕</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Loading skeleton
  if (isLoading && plots.length === 0) {
    return (
      <SafeAreaView style={{flex: 1, backgroundColor: '#f9fafb'}}>
        <View className="flex-row items-center px-4 py-3 border-b border-gray-200 bg-white">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3 p-1"
          >
            <Text className="text-2xl text-gray-700">←</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">My Plots</Text>
        </View>
        <ScrollView className="flex-1 pt-4">
          <View className="mx-4 mb-4 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <SkeletonLoader width={180} height={18} borderRadius={4} />
            <View className="mt-2">
              <SkeletonLoader width="100%" height={8} borderRadius={4} />
            </View>
            <View className="mt-1">
              <SkeletonLoader width={60} height={12} borderRadius={4} />
            </View>
          </View>
          {[1, 2, 3].map((i) => (
            <SkeletonPlotCard key={i} />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Empty state
  if (!isLoading && mergedPlots.length === 0) {
    return (
      <SafeAreaView style={{flex: 1, backgroundColor: '#f9fafb'}}>
        <View className="flex-row items-center px-4 py-3 border-b border-gray-200 bg-white">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3 p-1"
          >
            <Text className="text-2xl text-gray-700">←</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">My Plots</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 rounded-full bg-blue-100 items-center justify-center mb-4">
            <Text className="text-3xl">🏡</Text>
          </View>
          <Text className="text-xl font-bold text-gray-800 text-center mb-2">
            No Plots Yet
          </Text>
          <Text className="text-sm text-gray-500 text-center leading-5 mb-6">
            Plots are sections of your garden. Purchase your first plot to start
            planting and managing your crops!
          </Text>
          <TouchableOpacity
            className="bg-blue-500 rounded-xl py-3.5 px-8 shadow-sm"
            onPress={() => setShowBuyModal(true)}
          >
            <Text className="text-white font-semibold text-base">
              Buy Your First Plot
            </Text>
          </TouchableOpacity>
        </View>

        {/* Purchase Modal */}
        <PurchaseModal
          visible={showBuyModal}
          onClose={() => {
            setShowBuyModal(false);
            setPurchaseError(null);
          }}
          onConfirm={handleBuyPlot}
          isLoading={purchaseLoading}
          error={purchaseError}
          price={nextPrice}
          currentPlots={plotCount}
          maxPlots={maxPlots}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#f9fafb'}}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200 bg-white">
        <TouchableOpacity
          onPress={() => router.back()}
          className="mr-3 p-1"
        >
          <Text className="text-2xl text-gray-700">←</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">My Plots</Text>
      </View>

      <FlatList
        className="flex-1"
        data={mergedPlots}
        keyExtractor={(item: Garden) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
          />
        }
        ListHeaderComponent={
          <>
            {/* Summary Card */}
            <View className="mx-4 mt-4 mb-3 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-base font-semibold text-gray-800">
                  {plotCount} / {maxPlots} Plots Owned
                </Text>
                <Text className="text-xs text-gray-400">
                  {maxPlots - plotCount} remaining
                </Text>
              </View>
              <ProgressBar
                value={plotCount}
                maxValue={maxPlots}
                height={10}
                color={plotCount === maxPlots ? "#ef4444" : "#22c55e"}
              />
              {pricing && (
                <Text className="text-xs text-gray-400 mt-1.5">
                  {plotCount >= maxPlots
                    ? "Maximum plots reached"
                    : `Next plot: ${nextPrice} Green Credits`}
                </Text>
              )}
            </View>

            {/* Error Banner */}
            {renderErrorBanner()}

            {/* Pricing Info Card */}
            {pricingTiers.length > 0 && (
              <View className="mx-4 mb-3 bg-blue-50 border border-blue-200 rounded-xl p-3">
                <Text className="text-xs font-semibold text-blue-700 mb-1">
                  📊 Pricing Tiers
                </Text>
                <Text className="text-xs text-blue-600">
                  {pricingTiers
                    .slice(0, maxPlots)
                    .map((price, i) => `#${i + 1}: ${price} GC`)
                    .join("  ·  ")}
                </Text>
              </View>
            )}
          </>
        }
        renderItem={({ item }: { item: Garden }) => (
          <PlotCard
            plot={item}
            onPress={() => handlePlotPress(item.id)}
          />
        )}
        ListFooterComponent={
          <View className="px-4 pt-2 pb-8">
            <TouchableOpacity
              className={`rounded-xl py-3.5 items-center shadow-sm ${
                canPurchase ? "bg-blue-500" : "bg-gray-300"
              }`}
              onPress={() => {
                if (canPurchase) setShowBuyModal(true);
              }}
              disabled={!canPurchase}
              activeOpacity={0.7}
            >
              {isPurchasing ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text
                  className={`font-semibold text-base ${
                    canPurchase ? "text-white" : "text-gray-500"
                  }`}
                >
                  {plotCount >= maxPlots
                    ? "Max Plots Reached"
                    : `Buy New Plot (${nextPrice} GC)`}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        }
      />

      {/* Purchase Modal */}
      <PurchaseModal
        visible={showBuyModal}
        onClose={() => {
          setShowBuyModal(false);
          setPurchaseError(null);
        }}
        onConfirm={handleBuyPlot}
        isLoading={purchaseLoading}
        error={purchaseError}
        price={nextPrice}
        currentPlots={plotCount}
        maxPlots={maxPlots}
      />
    </SafeAreaView>
  );
}

// Purchase confirmation modal sub-component
function PurchaseModal({
  visible,
  onClose,
  onConfirm,
  isLoading,
  error,
  price,
  currentPlots,
  maxPlots,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
  error: string | null;
  price: number;
  currentPlots: number;
  maxPlots: number;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <View className="bg-white rounded-2xl w-full max-w-sm overflow-hidden">
          {/* Header */}
          <View className="items-center pt-6 pb-2">
            <View className="w-14 h-14 rounded-full bg-blue-100 items-center justify-center mb-3">
              <Text className="text-2xl">🏡</Text>
            </View>
            <Text className="text-lg font-bold text-gray-900">
              Purchase New Plot
            </Text>
          </View>

          {/* Body */}
          <View className="px-6 pb-4">
            <View className="bg-gray-50 rounded-xl p-4 mb-4">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-sm text-gray-600">Price</Text>
                <Text className="text-lg font-bold text-blue-600">
                  {price} GC
                </Text>
              </View>
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-sm text-gray-600">Current Plots</Text>
                <Text className="text-sm font-semibold text-gray-800">
                  {currentPlots}
                </Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-sm text-gray-600">Max Plots</Text>
                <Text className="text-sm font-semibold text-gray-800">
                  {maxPlots}
                </Text>
              </View>
            </View>

            {error ? (
              <View className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                <Text className="text-red-700 text-xs">{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              className={`rounded-xl py-3 items-center ${
                isLoading ? "bg-blue-400" : "bg-blue-500"
              }`}
              onPress={onConfirm}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  Confirm Purchase
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              className="py-3 items-center mt-1"
              onPress={onClose}
              disabled={isLoading}
            >
              <Text className="text-gray-500 text-sm">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default PlotsScreen;
