import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import axios from "axios";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { PlantSpecies } from "../../types";
import debounce from "../../utils/debounce";

const DIFFICULTY_BADGES: Record<
  string,
  { label: string; variant: "primary" | "secondary" | "danger" }
> = {
  EASY: { label: "Easy", variant: "primary" },
  MEDIUM: { label: "Medium", variant: "secondary" },
  HARD: { label: "Hard", variant: "danger" },
  EXPERT: { label: "Expert", variant: "danger" },
};

const PLANT_EMOJIS: Record<string, string> = {
  tomato: "🍅",
  basil: "🌿",
  lettuce: "🥬",
  carrot: "🥕",
  spinach: "🥬",
  pepper: "🫑",
  cucumber: "🥒",
  mint: "🌱",
  strawberry: "🍓",
  sunflower: "🌻",
  lavender: "💜",
};

function getPlantEmoji(name: string): string {
  const key = name.toLowerCase().split(" ")[0];
  return PLANT_EMOJIS[key] || "🌱";
}

function PlantBrowserScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [plants, setPlants] = useState<PlantSpecies[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlant, setSelectedPlant] = useState<PlantSpecies | null>(null);

  useEffect(() => {
    fetchPopularPlants();
  }, []);

  const fetchPopularPlants = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        "http://localhost:3001/api/v1/plants/by-season",
        {
          params: { season: getCurrentSeason() },
        },
      );
      setPlants(Array.isArray(data) ? data : []);
    } catch {
      setPlants([]);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return "spring";
    if (month >= 5 && month <= 7) return "summer";
    if (month >= 8 && month <= 10) return "fall";
    return "winter";
  };

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        fetchPopularPlants();
        return;
      }
      setLoading(true);
      try {
        const { data } = await axios.get(
          "http://localhost:3001/api/v1/plants/search",
          {
            params: { q: query, limit: 30 },
          },
        );
        setPlants(Array.isArray(data.data) ? data.data : []);
      } catch {
        setPlants([]);
      } finally {
        setLoading(false);
      }
    }, 400),
    [],
  );

  if (selectedPlant) {
    return (
      <ScrollView
        className="flex-1 bg-gray-50"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 py-4">
          <TouchableOpacity
            onPress={() => setSelectedPlant(null)}
            className="mb-4"
          >
            <Text className="text-primary-600 font-medium">
              ← Back to search
            </Text>
          </TouchableOpacity>

          <Card className="p-6 mb-4">
            <Text className="text-4xl mb-3">
              {getPlantEmoji(selectedPlant.commonName)}
            </Text>
            <Text className="text-xl font-bold text-gray-900 mb-1">
              {selectedPlant.commonName}
            </Text>
            <Text className="text-sm text-gray-400 italic mb-4">
              {selectedPlant.scientificName}
            </Text>

            <View className="flex-row flex-wrap gap-2 mb-4">
              <Badge
                label={selectedPlant.difficulty}
                variant={
                  DIFFICULTY_BADGES[selectedPlant.difficulty]?.variant ||
                  "primary"
                }
                size="sm"
              />
              {selectedPlant.edible && (
                <Badge label="Edible" variant="primary" size="sm" />
              )}
              {selectedPlant.seasons.map((s) => (
                <Badge key={s} label={s} variant="secondary" size="sm" />
              ))}
            </View>

            {selectedPlant.description && (
              <Text className="text-sm text-gray-600 mb-4 leading-5">
                {selectedPlant.description}
              </Text>
            )}

            <View className="bg-gray-50 rounded-xl p-4 gap-3">
              {selectedPlant.waterNeeds && (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-gray-500">Water</Text>
                  <Text className="text-sm font-medium text-gray-900">
                    {selectedPlant.waterNeeds}
                  </Text>
                </View>
              )}
              {selectedPlant.sunlightNeeds && (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-gray-500">Sunlight</Text>
                  <Text className="text-sm font-medium text-gray-900">
                    {selectedPlant.sunlightNeeds.replace(/_/g, " ")}
                  </Text>
                </View>
              )}
              {selectedPlant.growingDays && (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-gray-500">Maturity</Text>
                  <Text className="text-sm font-medium text-gray-900">
                    {selectedPlant.growingDays} days
                  </Text>
                </View>
              )}
              {selectedPlant.family && (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-gray-500">Family</Text>
                  <Text className="text-sm font-medium text-gray-900">
                    {selectedPlant.family}
                  </Text>
                </View>
              )}
            </View>
          </Card>
        </View>
      </ScrollView>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="px-4 pt-4 pb-2">
        <TextInput
          placeholder="Search plants by name..."
          value={searchQuery}
          onChangeText={(t) => {
            setSearchQuery(t);
            debouncedSearch(t);
          }}
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {loading ? (
        <LoadingSpinner fullScreen message="Loading plant database..." />
      ) : (
        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
        >
          {plants.length === 0 ? (
            <View className="items-center py-12">
              <Text className="text-4xl mb-3">🔍</Text>
              <Text className="text-gray-500 text-sm">No plants found</Text>
            </View>
          ) : (
            <View className="flex-row flex-wrap gap-3 pb-6">
              {plants.map((plant) => (
                <TouchableOpacity
                  key={plant.id}
                  onPress={() => setSelectedPlant(plant)}
                  activeOpacity={0.7}
                  className="bg-white rounded-2xl p-4 border border-gray-100 w-[48%]"
                >
                  <Text className="text-2xl mb-2">
                    {getPlantEmoji(plant.commonName)}
                  </Text>
                  <Text className="text-sm font-semibold text-gray-900">
                    {plant.commonName}
                  </Text>
                  <Text
                    className="text-xs text-gray-400 mb-2"
                    numberOfLines={1}
                  >
                    {plant.scientificName}
                  </Text>
                  <View className="flex-row items-center gap-1">
                    <Badge
                      label={plant.difficulty}
                      variant={
                        DIFFICULTY_BADGES[plant.difficulty]?.variant ||
                        "primary"
                      }
                      size="sm"
                    />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

export { PlantBrowserScreen };
