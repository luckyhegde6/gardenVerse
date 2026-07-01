import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { LoadingSpinner } from "@components/ui/LoadingSpinner";
import { Card } from "@components/ui/Card";
import { Badge } from "@components/ui/Badge";
import { PlantSpecies } from "@/types";
import debounce from "@utils/debounce";
import HapticFeedback from "@utils/haptics";
import api from "@services/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 32 - CARD_GAP) / 2;

const DIFFICULTY_BADGES: Record<
  string,
  { label: string; variant: "primary" | "secondary" | "danger" }
> = {
  EASY: { label: "Easy", variant: "primary" },
  MEDIUM: { label: "Medium", variant: "secondary" },
  HARD: { label: "Hard", variant: "danger" },
  EXPERT: { label: "Expert", variant: "danger" },
};

function getDifficultyColor(difficulty: string): string {
  if (difficulty === "EASY") return "#22c55e";
  if (difficulty === "MEDIUM") return "#eab308";
  if (difficulty === "HARD") return "#ef4444";
  return "#6b7280";
}

const SEASON_COLORS: Record<string, string> = {
  spring: "#4ade80",
  summer: "#fbbf24",
  fall: "#fb923c",
  winter: "#60a5fa",
};

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
      const resp = await api.get("/plants?season=" + getCurrentSeason() + "&limit=30");
      const plantsList = resp.data?.data || resp.data || [];
      setPlants(Array.isArray(plantsList) ? plantsList : []);
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
    debounce(async (query: unknown) => {
      if ((query as string).length < 2) {
        fetchPopularPlants();
        return;
      }
      setLoading(true);
      try {
        const resp = await api.get("/plants?q=" + encodeURIComponent(query as string) + "&limit=30");
        const plantsList = resp.data?.data || resp.data || [];
        setPlants(Array.isArray(plantsList) ? plantsList : []);
      } catch {
        setPlants([]);
      } finally {
        setLoading(false);
      }
    }, 400),
    [],
  );

  if (selectedPlant) {
    const diffColor = getDifficultyColor(selectedPlant.difficulty);
    return (
      <ScrollView
        className="flex-1 bg-gray-50"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 py-4">
          <TouchableOpacity
            onPress={() => { HapticFeedback.light(); setSelectedPlant(null); }}
            className="mb-4 flex-row items-center"
          >
            <Text className="text-primary-600 font-medium text-base">
              ← Back to search
            </Text>
          </TouchableOpacity>

          <Card className="p-6 mb-4">
            <View className="items-center mb-4">
              {selectedPlant.thumbnailUrl ? (
                <Image
                  source={{ uri: selectedPlant.thumbnailUrl }}
                  className="w-24 h-24 rounded-2xl"
                  resizeMode="contain"
                />
              ) : (
                <View
                  className="w-24 h-24 rounded-2xl items-center justify-center"
                  style={{ backgroundColor: diffColor + "20" }}
                >
                  <Text style={{ fontSize: 40, color: diffColor }}>
                    {(selectedPlant.commonName || "?").charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <Text className="text-2xl font-bold text-gray-900 text-center mb-1">
              {selectedPlant.commonName}
            </Text>
            <Text className="text-sm text-gray-400 italic text-center mb-4">
              {selectedPlant.scientificName}
            </Text>

            <View className="flex-row flex-wrap justify-center gap-2 mb-4">
              <Badge
                label={selectedPlant.difficulty}
                variant={DIFFICULTY_BADGES[selectedPlant.difficulty]?.variant || "primary"}
                size="sm"
              />
              {selectedPlant.edible && (
                <Badge label="Edible" variant="primary" size="sm" />
              )}
              {selectedPlant.medicinal && (
                <Badge label="Medicinal" variant="secondary" size="sm" />
              )}
              {(selectedPlant.seasons || []).map((s) => (
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
                  <Text className="text-sm text-gray-500">💧 Water</Text>
                  <Text className="text-sm font-medium text-gray-900">
                    {selectedPlant.waterNeeds}
                  </Text>
                </View>
              )}
              {selectedPlant.sunlightNeeds && (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-gray-500">☀️ Sunlight</Text>
                  <Text className="text-sm font-medium text-gray-900">
                    {selectedPlant.sunlightNeeds.replace(/_/g, " ")}
                  </Text>
                </View>
              )}
              {selectedPlant.growingDays && (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-gray-500">📅 Maturity</Text>
                  <Text className="text-sm font-medium text-gray-900">
                    {selectedPlant.growingDays} days
                  </Text>
                </View>
              )}
              {selectedPlant.difficulty && (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-gray-500">⭐ Difficulty</Text>
                  <Text
                    className="text-sm font-medium"
                    style={{ color: diffColor }}
                  >
                    {selectedPlant.difficulty}
                  </Text>
                </View>
              )}
              {selectedPlant.family && (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-gray-500">🏷️ Family</Text>
                  <Text className="text-sm font-medium text-gray-900">
                    {selectedPlant.family}
                  </Text>
                </View>
              )}
              {(selectedPlant.seasons || []).length > 0 && (
                <View className="flex-row justify-between">
                  <Text className="text-sm text-gray-500">🗓️ Seasons</Text>
                  <View className="flex-row gap-1">
                    {(selectedPlant.seasons || []).map((s) => (
                      <View
                        key={s}
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: SEASON_COLORS[s] || "#9ca3af" }}
                      />
                    ))}
                  </View>
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
      <View className="px-4 pt-4 pb-3 bg-white border-b border-gray-100">
        <View className="flex-row items-center gap-2 mb-2">
          <Text style={{ fontSize: 20 }}>🌱</Text>
          <Text className="text-lg font-bold text-gray-900">Plant Browser</Text>
        </View>
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-2">
          <Text className="text-gray-400 mr-2">🔍</Text>
          <TextInput
            placeholder="Search plants by name..."
            value={searchQuery}
            onChangeText={(t) => {
              setSearchQuery(t);
              debouncedSearch(t);
            }}
            className="flex-1 text-sm text-gray-900 py-1"
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => { setSearchQuery(""); fetchPopularPlants(); }}>
              <Text className="text-gray-400 text-lg">✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {loading ? (
        <LoadingSpinner fullScreen message="Loading plant database..." />
      ) : (
        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
        >
          {plants.length === 0 ? (
            <View className="items-center py-16">
              <Text className="text-5xl mb-4">🔍</Text>
              <Text className="text-gray-500 text-base mb-2">No plants found</Text>
              <Text className="text-gray-400 text-sm">Try a different search term</Text>
            </View>
          ) : (
            <View className="py-4">
              <Text className="text-sm text-gray-500 mb-3 font-medium">
                {searchQuery ? `Search results (${plants.length})` : `Popular plants for ${getCurrentSeason()}`}
              </Text>
              <View className="flex-row flex-wrap" style={{ gap: CARD_GAP }}>
                {plants.map((plant) => {
                  const diffColor = getDifficultyColor(plant.difficulty);
                  return (
                    <TouchableOpacity
                      key={plant.id}
                      onPress={() => { HapticFeedback.light(); setSelectedPlant(plant); }}
                      activeOpacity={0.7}
                      style={{ width: CARD_WIDTH }}
                      className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
                    >
                      <View
                        className="h-24 items-center justify-center"
                        style={{ backgroundColor: diffColor + "15" }}
                      >
                        {plant.thumbnailUrl ? (
                          <Image
                            source={{ uri: plant.thumbnailUrl }}
                            className="w-16 h-16"
                            resizeMode="contain"
                          />
                        ) : (
                          <Text style={{ fontSize: 36, color: diffColor }}>
                            {(plant.commonName || "?").charAt(0).toUpperCase()}
                          </Text>
                        )}
                      </View>
                      <View className="p-3">
                        <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
                          {plant.commonName}
                        </Text>
                        <Text className="text-xs text-gray-400 mb-2" numberOfLines={1}>
                          {plant.scientificName}
                        </Text>
                        <View className="flex-row items-center gap-1">
                          <View
                            className="px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: diffColor + "20" }}
                          >
                            <Text style={{ fontSize: 10, color: diffColor, fontWeight: "600" }}>
                              {DIFFICULTY_BADGES[plant.difficulty]?.label || plant.difficulty}
                            </Text>
                          </View>
                          {plant.edible && (
                            <Text style={{ fontSize: 12 }}>🍽️</Text>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

export { PlantBrowserScreen };
