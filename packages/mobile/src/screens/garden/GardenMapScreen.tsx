import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import axios from "axios";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import HapticFeedback from "../../utils/haptics";
import { NearbyGardener } from "../../types";

const { width } = Dimensions.get("window");

function GardenMapScreen() {
  const [gardeners, setGardeners] = useState<NearbyGardener[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  useEffect(() => {
    loadNearbyGardeners();
  }, []);

  const loadNearbyGardeners = async () => {
    try {
      const { data } = await axios.get(
        "http://localhost:3001/api/v1/geo/nearby",
        {
          params: { geohash: "7zzzzzzzz", limit: 20 },
        },
      );
      setGardeners(data.gardeners || []);
    } catch {
      setGardeners([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading nearby gardens..." />;
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Map placeholder with gardener markers */}
      <View className="flex-1 bg-gray-200 m-4 rounded-2xl overflow-hidden">
        <View className="flex-1 items-center justify-center">
          <Text className="text-4xl mb-2">🗺️</Text>
          <Text className="text-gray-600 text-sm text-center px-8 mb-2">
            Garden Map — Connect a Google Maps API key to see interactive maps
          </Text>
          <Text className="text-gray-400 text-xs text-center px-8">
            {gardeners.length > 0
              ? `${gardeners.length} nearby gardeners found`
              : "No nearby gardeners found yet"}
          </Text>
        </View>

        {/* Gardeners as list cards (placeholder) */}
        {gardeners.length > 0 && (
          <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 max-h-48">
            <Text className="text-sm font-semibold text-gray-900 mb-2">
              Nearby Gardeners
            </Text>
            {gardeners.slice(0, 3).map((g) => (
              <TouchableOpacity
                key={g.id}
                className="flex-row items-center py-2 border-b border-gray-100"
                onPress={() => HapticFeedback.light()}
              >
                <View className="w-8 h-8 rounded-full bg-primary-100 items-center justify-center mr-3">
                  <Text className="text-sm">
                    {g.displayName?.[0] || g.username[0]}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-gray-900">
                    {g.displayName || g.username}
                  </Text>
                  <Text className="text-xs text-gray-400">
                    {g.latitude && g.longitude
                      ? `${g.latitude.toFixed(4)}, ${g.longitude.toFixed(4)}`
                      : "Location unknown"}
                  </Text>
                </View>
                <Text className="text-xs text-primary-600 font-medium">
                  {g.sustainabilityScore} pts
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

export { GardenMapScreen };
