import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Modal,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native";
import { useAuthStore } from "../../stores/authStore";
import { useShopStore } from "../../stores/shopStore";
import { ShopItem, InventoryItem, CouponRedemption } from "../../types";
import { SkeletonLoader } from "../../components/ui/SkeletonLoader";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";

const { width } = Dimensions.get("window");
const CARD_GAP = 12;
const CARD_WIDTH = (width - 32 - CARD_GAP) / 2;

const CATEGORY_EMOJIS: Record<string, string> = {
  seeds: "🌱",
  tools: "🔧",
  decorations: "🎨",
  packs: "📦",
  special: "⭐",
};

const CATEGORIES = [
  { key: "All", label: "All", icon: "🛍️" },
  { key: "seeds", label: "Seeds", icon: "🌱" },
  { key: "tools", label: "Tools", icon: "🔧" },
  { key: "decorations", label: "Decorations", icon: "🎨" },
  { key: "packs", label: "Packs", icon: "📦" },
  { key: "special", label: "Special", icon: "⭐" },
] as const;

type TabType = "browse" | "inventory";

export function ShopScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const {
    items,
    inventory,
    isLoading,
    isBuying,
    error,
    fetchItems,
    buyItem,
    loadInventory,
    clearError,
  } = useShopStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeTab, setActiveTab] = useState<TabType>("browse");

  // Buy modal state
  const [buyModalVisible, setBuyModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [couponCode, setCouponCode] = useState("");
  const [couponResult, setCouponResult] = useState<CouponRedemption | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);

  useEffect(() => {
    fetchItems();
    loadInventory();
  }, [fetchItems, loadInventory]);

  const filteredItems = useMemo(() => {
    let filtered = items;

    if (selectedCategory !== "All") {
      filtered = filtered.filter(
        (item) => item.category?.toLowerCase() === selectedCategory.toLowerCase(),
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q),
      );
    }

    return filtered;
  }, [items, selectedCategory, searchQuery]);

  const handleOpenBuyModal = useCallback((item: ShopItem) => {
    setSelectedItem(item);
    setBuyQuantity(1);
    setCouponCode("");
    setCouponResult(null);
    setPurchaseError(null);
    setPurchaseSuccess(false);
    clearError();
    setBuyModalVisible(true);
  }, [clearError]);

  const handleCloseBuyModal = useCallback(() => {
    setBuyModalVisible(false);
    setSelectedItem(null);
    setBuyQuantity(1);
    setCouponCode("");
    setCouponResult(null);
    setPurchaseError(null);
    setPurchaseSuccess(false);
  }, []);

  const handleValidateCoupon = useCallback(async () => {
    if (!couponCode.trim() || !selectedItem) return;
    setIsValidatingCoupon(true);
    try {
      const total = selectedItem.effectivePrice * buyQuantity;
      const result = await useShopStore.getState().redeemCoupon(couponCode.trim(), total);
      setCouponResult(result);
    } catch {
      setCouponResult({
        valid: false,
        code: couponCode.trim(),
        discountType: "PERCENTAGE",
        discountValue: 0,
        discountAmount: 0,
        originalAmount: selectedItem.effectivePrice * buyQuantity,
        finalAmount: selectedItem.effectivePrice * buyQuantity,
        errors: ["Failed to validate coupon"],
      });
    } finally {
      setIsValidatingCoupon(false);
    }
  }, [couponCode, selectedItem, buyQuantity]);

  const handleConfirmBuy = useCallback(async () => {
    if (!selectedItem) return;
    setPurchaseError(null);
    setPurchaseSuccess(false);

    // Level check
    if (user && user.level < selectedItem.levelRequired) {
      setPurchaseError(`Level ${selectedItem.levelRequired} required to buy this item. Your level: ${user.level}`);
      return;
    }

    try {
      const result = await buyItem(
        selectedItem.id,
        buyQuantity,
        couponResult?.valid ? couponCode.trim() : undefined,
      );
      setPurchaseSuccess(true);
      // Update auth store balance from response
      if (result?.greenCredits !== undefined && user) {
        useAuthStore.setState({
          user: { ...user, greenCredits: result.greenCredits },
        });
      }
      // Refresh inventory
      loadInventory();
    } catch (err: any) {
      setPurchaseError(err?.message || "Purchase failed. Please try again.");
    }
  }, [selectedItem, buyQuantity, couponResult, couponCode, buyItem, loadInventory, user]);

  const totalPrice = useMemo(() => {
    if (!selectedItem) return 0;
    const base = selectedItem.effectivePrice * buyQuantity;
    if (couponResult?.valid) {
      return Math.max(0, base - couponResult.discountAmount);
    }
    return base;
  }, [selectedItem, buyQuantity, couponResult]);

  const canAfford = user ? (user.greenCredits ?? 0) >= totalPrice : false;

  const renderItemCard = useCallback(
    ({ item }: { item: ShopItem }) => {
      const isLevelLocked = user ? user.level < item.levelRequired : true;
      const displayPrice =
        item.onSale && item.discountPrice ? item.discountPrice : item.effectivePrice;

      return (
        <TouchableOpacity
          activeOpacity={0.8}
          className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
          style={{ width: CARD_WIDTH, marginBottom: CARD_GAP }}
          onPress={() => handleOpenBuyModal(item)}
        >
          {/* Icon area */}
          <View className="h-28 items-center justify-center bg-gradient-to-br from-primary-50 to-green-50">
            <Text className="text-4xl">{item.icon || CATEGORY_EMOJIS[item.category?.toLowerCase()] || "🪴"}</Text>
          </View>

          {/* Content */}
          <View className="p-3">
            <Text className="font-semibold text-gray-900 text-sm" numberOfLines={1}>
              {item.name}
            </Text>

            {/* Sale badge */}
            {item.onSale && item.discountPrice ? (
              <View className="flex-row items-center mt-1">
                <Badge label="SALE" variant="warning" size="sm" />
                <Text className="text-xs text-gray-400 line-through ml-2">
                  {item.price} 🪙
                </Text>
              </View>
            ) : null}

            {/* Price row */}
            <View className="flex-row items-center justify-between mt-1.5">
              <Text className="text-sm font-bold text-primary-600">
                {displayPrice} 🪙
              </Text>

              {isLevelLocked ? (
                <Badge label={`Lv.${item.levelRequired}`} variant="neutral" size="sm" />
              ) : null}
            </View>

            {/* Buy button */}
            <TouchableOpacity
              onPress={() => handleOpenBuyModal(item)}
              disabled={isLevelLocked}
              className={`mt-2 py-1.5 rounded-lg items-center ${
                isLevelLocked ? "bg-gray-200" : "bg-primary-600"
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  isLevelLocked ? "text-gray-400" : "text-white"
                }`}
              >
                {isLevelLocked ? `Lv.${item.levelRequired} Required` : "Buy"}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    },
    [user, handleOpenBuyModal],
  );

  const renderInventoryItem = useCallback(
    ({ item }: { item: InventoryItem }) => (
      <View className="bg-white rounded-2xl p-4 border border-gray-100 mb-3 flex-row items-center">
        <View className="w-14 h-14 rounded-xl bg-primary-50 items-center justify-center">
          <Text className="text-2xl">{item.itemIcon || "📦"}</Text>
        </View>
        <View className="flex-1 ml-3">
          <Text className="font-semibold text-gray-900 text-sm">{item.itemName}</Text>
          <View className="flex-row items-center mt-1">
            <Text className="text-xs text-gray-400">
              Purchased {new Date(item.purchasedAt).toLocaleDateString()}
            </Text>
            <Text className="text-xs text-gray-400 ml-2">×{item.quantity}</Text>
          </View>
          {item.isActive ? (
            <Badge label="Active" variant="success" size="sm" />
          ) : null}
        </View>
      </View>
    ),
    [],
  );

  // --- RENDER ---
  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#f9fafb'}}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-xl">←</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">Shop</Text>
        </View>
        <View className="flex-row items-center bg-amber-50 px-3 py-1.5 rounded-full">
          <Text className="text-sm mr-1">🪙</Text>
          <Text className="text-sm font-bold text-amber-700">
            {user?.greenCredits ?? 0}
          </Text>
        </View>
      </View>

      {activeTab === "browse" ? (
        <>
          {/* Search Bar */}
          <View className="px-4 pt-3 pb-2">
            <View className="flex-row items-center bg-white border border-gray-200 rounded-xl px-4 py-2.5">
              <Text className="text-gray-400 mr-2">🔍</Text>
              <TextInput
                className="flex-1 text-base text-gray-900"
                placeholder="Search items..."
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Text className="text-gray-400">✕</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Category Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-4 pb-3"
            contentContainerStyle={{ gap: 8 }}
          >
            {CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  onPress={() => setSelectedCategory(cat.key)}
                  className={`flex-row items-center px-4 py-2 rounded-full ${
                    isSelected ? "bg-primary-600" : "bg-white border border-gray-200"
                  }`}
                >
                  <Text className="mr-1.5">{cat.icon}</Text>
                  <Text
                    className={`text-sm font-medium ${
                      isSelected ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Error banner */}
          {error ? (
            <View className="mx-4 mb-3 bg-red-50 border border-red-200 rounded-xl p-3 flex-row items-center">
              <Text className="text-red-600 text-sm flex-1">{error}</Text>
              <TouchableOpacity onPress={clearError}>
                <Text className="text-red-400">✕</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Loading skeleton */}
          {isLoading && items.length === 0 ? (
            <View className="flex-1 px-4">
              <View className="flex-row flex-wrap" style={{ gap: CARD_GAP }}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <View key={i} style={{ width: CARD_WIDTH }}>
                    <SkeletonLoader width="100%" height={112} borderRadius={16} />
                    <View className="p-2">
                      <SkeletonLoader
                        width="80%"
                        height={14}
                        borderRadius={4}
                        style={{ marginTop: 8 }}
                      />
                      <SkeletonLoader
                        width="50%"
                        height={12}
                        borderRadius={4}
                        style={{ marginTop: 6 }}
                      />
                      <SkeletonLoader
                        width="100%"
                        height={32}
                        borderRadius={8}
                        style={{ marginTop: 8 }}
                      />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : filteredItems.length === 0 ? (
            <EmptyState
              title="No items found"
              description={
                searchQuery
                  ? `No results for "${searchQuery}"`
                  : "No items available in this category"
              }
              icon="🛍️"
            />
          ) : (
            <FlatList
              data={filteredItems}
              keyExtractor={(item: ShopItem) => item.id}
              numColumns={2}
              columnWrapperStyle={{
                justifyContent: "space-between",
                paddingHorizontal: 16,
              }}
              showsVerticalScrollIndicator={false}
              renderItem={renderItemCard}
              contentContainerStyle={{ paddingBottom: 120 }}
            />
          )}
        </>
      ) : (
        /* Inventory Tab */
        <View className="flex-1 px-4 pt-4">
          {inventory.length === 0 ? (
            <EmptyState
              title="No items yet"
              description="Items you purchase will appear here"
              icon="📦"
            />
          ) : (
            <FlatList
              data={inventory}
              keyExtractor={(item: InventoryItem) => item.id}
              renderItem={renderInventoryItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 120 }}
            />
          )}
        </View>
      )}

      {/* Bottom Tabs */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex-row">
        <TouchableOpacity
          onPress={() => setActiveTab("browse")}
          className={`flex-1 items-center py-3 ${
            activeTab === "browse" ? "border-t-2 border-primary-600" : ""
          }`}
        >
          <Text
            className={`text-sm font-medium ${
              activeTab === "browse" ? "text-primary-600" : "text-gray-500"
            }`}
          >
            🛍️ Browse
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("inventory")}
          className={`flex-1 items-center py-3 ${
            activeTab === "inventory" ? "border-t-2 border-primary-600" : ""
          }`}
        >
          <Text
            className={`text-sm font-medium ${
              activeTab === "inventory" ? "text-primary-600" : "text-gray-500"
            }`}
          >
            📦 Inventory ({inventory.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Buy Modal */}
      <Modal
        visible={buyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseBuyModal}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[85%]">
            {/* Handle */}
            <View className="w-10 h-1 bg-gray-300 rounded-full self-center mt-3 mb-2" />

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
            >
              {selectedItem && (
                <>
                  {/* Item header */}
                  <View className="flex-row items-center mb-5">
                    <View className="w-16 h-16 rounded-2xl bg-primary-50 items-center justify-center mr-4">
                      <Text className="text-3xl">
                        {selectedItem.icon || CATEGORY_EMOJIS[selectedItem.category?.toLowerCase()] || "🪴"}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-gray-900">
                        {selectedItem.name}
                      </Text>
                      {selectedItem.description ? (
                        <Text className="text-sm text-gray-500 mt-0.5">
                          {selectedItem.description}
                        </Text>
                      ) : null}
                      <View className="flex-row items-center mt-1">
                        {selectedItem.onSale && selectedItem.discountPrice ? (
                          <>
                            <Text className="text-sm text-gray-400 line-through mr-2">
                              {selectedItem.price} 🪙
                            </Text>
                            <Text className="text-sm font-bold text-primary-600">
                              {selectedItem.effectivePrice} 🪙 each
                            </Text>
                          </>
                        ) : (
                          <Text className="text-sm font-bold text-primary-600">
                            {selectedItem.effectivePrice} 🪙 each
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Level requirement warning */}
                  {user && user.level < selectedItem.levelRequired ? (
                    <View className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4">
                      <Text className="text-orange-700 text-sm font-medium">
                        ⚠️ Level {selectedItem.levelRequired} required to purchase. Your level: {user.level}
                      </Text>
                    </View>
                  ) : null}

                  {/* Stock info */}
                  {selectedItem.stock !== undefined && selectedItem.stock >= 0 ? (
                    <Text className="text-xs text-gray-400 mb-4">
                      Stock: {selectedItem.stock} remaining
                    </Text>
                  ) : null}

                  {/* Quantity selector */}
                  <View className="mb-5">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Quantity</Text>
                    <View className="flex-row items-center">
                      <TouchableOpacity
                        onPress={() => setBuyQuantity(Math.max(1, buyQuantity - 1))}
                        disabled={buyQuantity <= 1}
                        className={`w-10 h-10 rounded-lg items-center justify-center border ${
                          buyQuantity <= 1
                            ? "border-gray-200 bg-gray-100"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        <Text
                          className={`text-lg font-bold ${
                            buyQuantity <= 1 ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          −
                        </Text>
                      </TouchableOpacity>
                      <Text className="mx-4 text-lg font-bold text-gray-900 min-w-[30px] text-center">
                        {buyQuantity}
                      </Text>
                      <TouchableOpacity
                        onPress={() => setBuyQuantity(buyQuantity + 1)}
                        className="w-10 h-10 rounded-lg items-center justify-center border border-gray-300 bg-white"
                      >
                        <Text className="text-lg font-bold text-gray-700">+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Coupon code */}
                  <View className="mb-5">
                    <Text className="text-sm font-semibold text-gray-700 mb-2">
                      Coupon Code (optional)
                    </Text>
                    <View className="flex-row items-center">
                      <TextInput
                        className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-base text-gray-900 bg-white mr-2"
                        placeholder="Enter coupon code"
                        placeholderTextColor="#9ca3af"
                        value={couponCode}
                        onChangeText={(text) => {
                          setCouponCode(text);
                          setCouponResult(null);
                        }}
                        autoCapitalize="characters"
                      />
                      <TouchableOpacity
                        onPress={handleValidateCoupon}
                        disabled={!couponCode.trim() || isValidatingCoupon}
                        className={`px-4 py-2.5 rounded-xl ${
                          !couponCode.trim() || isValidatingCoupon
                            ? "bg-gray-200"
                            : "bg-primary-600"
                        }`}
                      >
                        {isValidatingCoupon ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <Text
                            className={`text-sm font-semibold ${
                              !couponCode.trim() ? "text-gray-400" : "text-white"
                            }`}
                          >
                            Apply
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>

                    {/* Coupon result */}
                    {couponResult ? (
                      couponResult.valid ? (
                        <View className="mt-2 bg-green-50 border border-green-200 rounded-xl p-3">
                          <Text className="text-green-700 text-sm font-medium">
                            ✅ Coupon applied!
                          </Text>
                          <Text className="text-green-600 text-xs mt-1">
                            Discount: {couponResult.discountType === "PERCENTAGE"
                              ? `${couponResult.discountValue}%`
                              : `${couponResult.discountValue} 🪙`}{" "}
                            (−{couponResult.discountAmount} 🪙)
                          </Text>
                        </View>
                      ) : (
                        <View className="mt-2 bg-red-50 border border-red-200 rounded-xl p-3">
                          <Text className="text-red-700 text-sm font-medium">
                            ❌ Invalid coupon
                          </Text>
                          {couponResult.errors?.map((err, i) => (
                            <Text key={i} className="text-red-600 text-xs mt-0.5">
                              {err}
                            </Text>
                          ))}
                        </View>
                      )
                    ) : null}
                  </View>

                  {/* Price breakdown */}
                  <View className="bg-gray-50 rounded-xl p-4 mb-5">
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-sm text-gray-600">
                        Price ({buyQuantity} × {selectedItem.effectivePrice} 🪙)
                      </Text>
                      <Text className="text-sm text-gray-900">
                        {selectedItem.effectivePrice * buyQuantity} 🪙
                      </Text>
                    </View>
                    {couponResult?.valid ? (
                      <View className="flex-row justify-between mb-2">
                        <Text className="text-sm text-green-600">Discount</Text>
                        <Text className="text-sm text-green-600">
                          −{couponResult.discountAmount} 🪙
                        </Text>
                      </View>
                    ) : null}
                    <View className="border-t border-gray-200 pt-2 flex-row justify-between">
                      <Text className="text-base font-bold text-gray-900">Total</Text>
                      <Text className="text-base font-bold text-primary-600">
                        {totalPrice} 🪙
                      </Text>
                    </View>
                  </View>

                  {/* Purchase error */}
                  {purchaseError ? (
                    <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                      <Text className="text-red-700 text-sm">{purchaseError}</Text>
                    </View>
                  ) : null}

                  {/* Purchase success */}
                  {purchaseSuccess ? (
                    <View className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4 items-center">
                      <Text className="text-3xl mb-2">🎉</Text>
                      <Text className="text-green-700 text-base font-semibold">
                        Purchase Successful!
                      </Text>
                      <Text className="text-green-600 text-sm mt-1 text-center">
                        Your item has been added to inventory.
                      </Text>
                    </View>
                  ) : null}

                  {/* Confirm button */}
                  {!purchaseSuccess ? (
                    <TouchableOpacity
                      onPress={handleConfirmBuy}
                      disabled={
                        isBuying ||
                        (user ? user.level < selectedItem.levelRequired : true) ||
                        !canAfford
                      }
                      className={`py-3.5 rounded-xl items-center ${
                        isBuying ||
                        (user && user.level < selectedItem.levelRequired) ||
                        !canAfford
                          ? "bg-gray-300"
                          : "bg-primary-600"
                      }`}
                    >
                      {isBuying ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text className="text-white font-bold text-base">
                          {user && user.level < selectedItem.levelRequired
                            ? `Level ${selectedItem.levelRequired} Required`
                            : !canAfford
                              ? `Insufficient 🪙 (need ${totalPrice})`
                              : `Confirm Purchase — ${totalPrice} 🪙`}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={handleCloseBuyModal}
                      className="py-3.5 rounded-xl items-center bg-primary-600"
                    >
                      <Text className="text-white font-bold text-base">Done</Text>
                    </TouchableOpacity>
                  )}

                  {/* Insufficient balance detail */}
                  {!canAfford && !purchaseSuccess && user ? (
                    <Text className="text-xs text-gray-400 text-center mt-2">
                      Your balance: {user.greenCredits} 🪙
                    </Text>
                  ) : null}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
