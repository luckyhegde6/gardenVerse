import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native";
import { useShopStore } from "../../stores/shopStore";
import { CouponRedemption } from "../../types";

export function CouponRedeemScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ purchaseAmount?: string }>();
  const purchaseAmount = params.purchaseAmount
    ? parseFloat(params.purchaseAmount) || 0
    : 0;

  const [couponCode, setCouponCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [result, setResult] = useState<CouponRedemption | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRedeem = useCallback(async () => {
    if (!couponCode.trim()) {
      setError("Please enter a coupon code");
      return;
    }

    if (purchaseAmount <= 0) {
      setError("No purchase amount provided. Please specify a purchase amount.");
      return;
    }

    setIsRedeeming(true);
    setError(null);
    setResult(null);

    try {
      const redemption = await useShopStore
        .getState()
        .redeemCoupon(couponCode.trim(), purchaseAmount);
      setResult(redemption);
    } catch {
      setError("An error occurred while redeeming the coupon");
    } finally {
      setIsRedeeming(false);
    }
  }, [couponCode, purchaseAmount]);

  const handleUseCoupon = useCallback(() => {
    // Navigate back — the calling screen can detect we're returning from here
    // and read the applied coupon from local state/params if needed.
    router.back();
  }, [router]);

  const handleTryAgain = useCallback(() => {
    setResult(null);
    setError(null);
    setCouponCode("");
  }, []);

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#f9fafb'}}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-xl">←</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-gray-900">Redeem Coupon</Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Purchase amount display */}
        {purchaseAmount > 0 ? (
          <View className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
            <Text className="text-sm text-gray-500 mb-1">Purchase Amount</Text>
            <Text className="text-2xl font-bold text-gray-900">
              {purchaseAmount} 🪙
            </Text>
          </View>
        ) : (
          <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
            <Text className="text-amber-700 text-sm font-medium">
              ⚠️ No purchase amount specified
            </Text>
            <Text className="text-amber-600 text-xs mt-1">
              Coupon validation requires a purchase amount. Some discounts may
              not calculate correctly.
            </Text>
          </View>
        )}

        {/* Coupon code input */}
        <View className="mb-6">
          <Text className="text-sm font-semibold text-gray-700 mb-2">
            Coupon Code
          </Text>
          <TextInput
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-900 bg-white"
            placeholder="Enter your coupon code"
            placeholderTextColor="#9ca3af"
            value={couponCode}
            onChangeText={(text) => {
              setCouponCode(text.toUpperCase());
              setError(null);
              setResult(null);
            }}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="go"
            onSubmitEditing={handleRedeem}
          />
        </View>

        {/* Error message */}
        {error ? (
          <View className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <View className="flex-row items-center mb-1">
              <Text className="text-lg mr-2">❌</Text>
              <Text className="text-red-700 text-sm font-medium">Error</Text>
            </View>
            <Text className="text-red-600 text-sm ml-7">{error}</Text>
          </View>
        ) : null}

        {/* Result display */}
        {result ? (
          result.valid ? (
            <View className="bg-green-50 border border-green-200 rounded-2xl p-5 mb-6">
              <View className="items-center mb-4">
                <Text className="text-4xl mb-2">🎉</Text>
                <Text className="text-green-800 text-lg font-bold">
                  Coupon Applied!
                </Text>
                {result.description ? (
                  <Text className="text-green-600 text-sm mt-1 text-center">
                    {result.description}
                  </Text>
                ) : null}
              </View>

              {/* Price breakdown */}
              <View className="bg-white rounded-xl p-4">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-gray-600">Original</Text>
                  <Text className="text-sm text-gray-900">
                    {result.originalAmount} 🪙
                  </Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm text-green-600">Discount</Text>
                  <Text className="text-sm text-green-600 font-medium">
                    −{result.discountAmount} 🪙
                    {result.discountType === "PERCENTAGE"
                      ? ` (${result.discountValue}%)`
                      : ""}
                  </Text>
                </View>
                <View className="border-t border-gray-100 pt-2 flex-row justify-between">
                  <Text className="text-base font-bold text-gray-900">Final</Text>
                  <Text className="text-base font-bold text-primary-600">
                    {result.finalAmount} 🪙
                  </Text>
                </View>
              </View>

              {/* Use coupon button */}
              <TouchableOpacity
                onPress={handleUseCoupon}
                className="mt-5 py-3.5 rounded-xl items-center bg-primary-600"
              >
                <Text className="text-white font-bold text-base">
                  Use This Coupon
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6">
              <View className="items-center mb-3">
                <Text className="text-4xl mb-2">😕</Text>
                <Text className="text-red-800 text-lg font-bold">
                  Invalid Coupon
                </Text>
              </View>

              {result.errors && result.errors.length > 0 ? (
                <View className="bg-white rounded-xl p-4">
                  {result.errors.map((err, i) => (
                    <View key={i} className="flex-row items-start mb-1.5 last:mb-0">
                      <Text className="text-red-500 mr-2">•</Text>
                      <Text className="text-red-700 text-sm flex-1">{err}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text className="text-red-600 text-sm text-center">
                  The coupon code you entered is not valid or has expired.
                </Text>
              )}

              {/* Try again button */}
              <TouchableOpacity
                onPress={handleTryAgain}
                className="mt-5 py-3.5 rounded-xl items-center bg-white border border-gray-300"
              >
                <Text className="text-gray-700 font-bold text-base">
                  Try Another Code
                </Text>
              </TouchableOpacity>
            </View>
          )
        ) : null}

        {/* Redeem button */}
        {!result ? (
          <TouchableOpacity
            onPress={handleRedeem}
            disabled={isRedeeming || !couponCode.trim()}
            className={`py-3.5 rounded-xl items-center ${
              isRedeeming || !couponCode.trim()
                ? "bg-gray-300"
                : "bg-primary-600"
            }`}
          >
            {isRedeeming ? (
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
                <Text className="text-white font-bold text-base">Validating...</Text>
              </View>
            ) : (
              <Text className="text-white font-bold text-base">Redeem</Text>
            )}
          </TouchableOpacity>
        ) : null}

        {/* Info card */}
        {!result ? (
          <View className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <Text className="text-blue-700 text-sm font-medium mb-1">
              💡 How coupons work
            </Text>
            <Text className="text-blue-600 text-xs leading-5">
              Enter a valid coupon code above to receive a discount on your
              purchase. Coupons may offer percentage-based or fixed discounts.
              Check the terms and expiry date of your coupon.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
