import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useRealGardenerStore } from "../../stores/realGardenerStore";

function formatDate(iso?: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

export function RealGardenerScreen() {
  const router = useRouter();

  const status = useRealGardenerStore((s) => s.status);
  const encouragement = useRealGardenerStore((s) => s.encouragement);
  const isVerifying = useRealGardenerStore((s) => s.isVerifying);
  const isLoading = useRealGardenerStore((s) => s.isLoading);
  const error = useRealGardenerStore((s) => s.error);

  const fetchStatus = useRealGardenerStore((s) => s.fetchStatus);
  const verify = useRealGardenerStore((s) => s.verify);
  const fetchEncouragement = useRealGardenerStore((s) => s.fetchEncouragement);
  const clearError = useRealGardenerStore((s) => s.clearError);

  const [gardenPhotoUrl, setGardenPhotoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    fetchStatus();
    fetchEncouragement();
  }, [fetchStatus, fetchEncouragement]);

  const handleVerify = useCallback(async () => {
    if (!gardenPhotoUrl.trim() && !description.trim() && !location.trim()) {
      Alert.alert("Missing Info", "Please fill in at least one field to verify.");
      return;
    }
    try {
      clearError();
      const result = await verify({
        gardenPhotoUrl: gardenPhotoUrl.trim() || undefined,
        description: description.trim() || undefined,
        location: location.trim() || undefined,
      });
      if (result && (result as any).isRealGardener) {
        setHasSubmitted(true);
        Alert.alert("🎉 Verified!", "You are now a Real Gardener!");
      } else {
        Alert.alert("Submitted", "Your verification has been submitted for review.");
        setHasSubmitted(true);
      }
    } catch {
      Alert.alert("Error", "Failed to submit verification. Please try again.");
    }
  }, [gardenPhotoUrl, description, location, verify, clearError]);

  const tips = Array.isArray(encouragement) ? encouragement : [];

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="bg-white px-4 pt-12 pb-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center mb-2"
          activeOpacity={0.7}
        >
          <Text className="text-2xl mr-2">‹</Text>
          <Text className="text-base text-gray-600">Back</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-900">Real Gardener</Text>
        <Text className="text-sm text-gray-500 mt-1">
          Verify your real-world garden and get exclusive tips
        </Text>
      </View>

      {isLoading && !status ? (
        /* Loading state */
        <View className="items-center justify-center py-20">
          <ActivityIndicator size="large" color="#22c55e" />
          <Text className="text-sm text-gray-500 mt-3">Loading...</Text>
        </View>
      ) : (
        <>
          {/* Status Card */}
          <View className="px-4 mt-4">
            {status?.isRealGardener ? (
              <View className="bg-green-50 border border-green-200 rounded-2xl p-5">
                <View className="flex-row items-center">
                  <Text className="text-4xl mr-3">🏡</Text>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-green-800">
                      Verified Real Gardener
                    </Text>
                    <Text className="text-sm text-green-600 mt-0.5">
                      Verified on {formatDate(status.verifiedAt)}
                    </Text>
                  </View>
                </View>
                {status.badge && (
                  <View className="mt-3 flex-row items-center">
                    <View className="bg-green-100 rounded-full px-3 py-1.5">
                      <Text className="text-sm font-semibold text-green-700">
                        🏅 {status.badge}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <View className="bg-gray-100 border border-gray-200 rounded-2xl p-5">
                <View className="flex-row items-center">
                  <Text className="text-3xl mr-3">🌱</Text>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-700">
                      Not Yet Verified
                    </Text>
                    <Text className="text-sm text-gray-500 mt-0.5">
                      Show us your real garden to unlock exclusive tips and
                      badges!
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Stats Row */}
          <View className="flex-row px-4 mt-4 gap-3">
            <View className="flex-1 bg-white rounded-xl p-4 items-center border border-gray-100">
              <Text className="text-2xl mb-1">🏡</Text>
              <Text className="text-lg font-bold text-gray-900">
                {status?.gardenCount ?? 0}
              </Text>
              <Text className="text-xs text-gray-500">Gardens</Text>
            </View>
            <View className="flex-1 bg-white rounded-xl p-4 items-center border border-gray-100">
              <Text className="text-2xl mb-1">🔬</Text>
              <Text className="text-lg font-bold text-gray-900">
                {status?.soilCheckCount ?? 0}
              </Text>
              <Text className="text-xs text-gray-500">Soil Checks</Text>
            </View>
          </View>

          {/* Verification Form (only if not verified) */}
          {!status?.isRealGardener && (
            <View className="bg-white mx-4 mt-4 rounded-2xl p-5 border border-gray-100">
              <Text className="text-base font-bold text-gray-900 mb-4">
                📋 Submit Verification
              </Text>

              {error ? (
                <View className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4">
                  <Text className="text-sm text-red-700">{error}</Text>
                </View>
              ) : null}

              {hasSubmitted ? (
                <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 items-center">
                  <Text className="text-3xl mb-2">✅</Text>
                  <Text className="text-base font-semibold text-blue-800 text-center">
                    Verification Submitted
                  </Text>
                  <Text className="text-sm text-blue-600 text-center mt-1">
                    Our team will review your submission. You will be notified
                    once verified.
                  </Text>
                </View>
              ) : (
                <>
                  <Text className="text-sm text-gray-500 mb-4">
                    Share details about your real garden to get verified.
                  </Text>

                  {/* Garden Photo URL */}
                  <Text className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Garden Photo URL
                  </Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 mb-3"
                    placeholder="https://example.com/my-garden.jpg"
                    placeholderTextColor="#9ca3af"
                    value={gardenPhotoUrl}
                    onChangeText={setGardenPhotoUrl}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />

                  {/* Description */}
                  <Text className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Description
                  </Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 mb-3"
                    placeholder="Describe your garden — what do you grow?"
                    placeholderTextColor="#9ca3af"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />

                  {/* Location */}
                  <Text className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">
                    Location
                  </Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 mb-5"
                    placeholder="City, State"
                    placeholderTextColor="#9ca3af"
                    value={location}
                    onChangeText={setLocation}
                    autoCapitalize="words"
                  />

                  <TouchableOpacity
                    onPress={handleVerify}
                    disabled={isVerifying}
                    className={`rounded-xl py-3.5 items-center ${
                      isVerifying ? "bg-gray-300" : "bg-green-600"
                    }`}
                    activeOpacity={0.8}
                  >
                    {isVerifying ? (
                      <View className="flex-row items-center">
                        <ActivityIndicator size="small" color="#ffffff" />
                        <Text className="text-white font-semibold text-base ml-2">
                          Submitting...
                        </Text>
                      </View>
                    ) : (
                      <Text className="text-white font-semibold text-base">
                        Submit Verification
                      </Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* Encouragement Tips */}
          <View className="mx-4 mt-6 mb-8">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold text-gray-900">
                🌿 Daily Gardening Tips
              </Text>
              {tips.length > 0 && (
                <Text className="text-xs text-gray-400">
                  {tips.length} tips
                </Text>
              )}
            </View>

            {tips.length === 0 ? (
              <View className="bg-white rounded-2xl p-6 items-center border border-gray-100">
                <Text className="text-3xl mb-2">🌱</Text>
                <Text className="text-sm text-gray-500 text-center">
                  No tips available right now. Check back later!
                </Text>
              </View>
            ) : (
              tips.map((tip, idx) => (
                <View
                  key={`tip-${idx}`}
                  className="bg-white rounded-2xl p-4 mb-3 border border-gray-100"
                >
                  <View className="flex-row">
                    <Text className="text-2xl mr-3">{tip.icon}</Text>
                    <View className="flex-1">
                      <View className="flex-row items-center flex-wrap gap-1.5">
                        <Text className="text-base font-bold text-gray-900 flex-shrink">
                          {tip.title}
                        </Text>
                        {tip.isRealGardener && (
                          <View className="bg-amber-100 rounded-full px-2 py-0.5">
                            <Text className="text-xs font-medium text-amber-700">
                              For Real Gardeners
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-sm text-gray-600 mt-1 leading-5">
                        {tip.content}
                      </Text>
                      <View className="flex-row items-center mt-2">
                        <View className="bg-green-50 rounded-full px-2.5 py-0.5">
                          <Text className="text-xs font-medium text-green-700">
                            {tip.category}
                          </Text>
                        </View>
                        {tip.badge && (
                          <View className="bg-blue-50 rounded-full px-2.5 py-0.5 ml-2">
                            <Text className="text-xs font-medium text-blue-700">
                              {tip.badge}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}
