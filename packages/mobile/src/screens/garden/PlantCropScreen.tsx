import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { useGarden } from "../../hooks/useGarden";
import { PlantSpecies } from "../../types";
import api from "../../services/api";
import debounce from "../../utils/debounce";
import HapticFeedback from "../../utils/haptics";

const CATEGORIES = [
  { key: "all", label: "All", icon: "🌱" },
  { key: "vegetable", label: "Vegetables", icon: "🥬" },
  { key: "herb", label: "Herbs", icon: "🌿" },
  { key: "fruit", label: "Fruits", icon: "🍓" },
  { key: "flower", label: "Flowers", icon: "🌸" },
  { key: "tree", label: "Trees", icon: "🌳" },
  { key: "grain", label: "Grains", icon: "🌾" },
];

const CATEGORY_TAGS: Record<string, string[]> = {
  vegetable: ["tomato", "lettuce", "carrot", "pepper", "cucumber", "broccoli", "kale", "onion", "garlic", "squash", "pumpkin", "cauliflower", "spinach", "pea", "bean"],
  herb: ["basil", "mint", "rosemary", "thyme", "coriander", "oregano"],
  fruit: ["strawberry", "watermelon", "blueberry"],
  flower: ["sunflower", "lavender", "rose", "marigold", "tulip", "daisy"],
  tree: ["oak", "maple", "apple", "cherry", "orange", "lemon", "palm", "pine"],
  grain: ["corn", "wheat", "rice", "barley", "oat"],
};

function detectCategory(name: string): string {
  const lower = name.toLowerCase();
  for (const [cat, tags] of Object.entries(CATEGORY_TAGS)) {
    if (tags.some(t => lower.includes(t))) return cat;
  }
  return "vegetable";
}

// const DIFFICULTY_COLORS: Record<string, string> = {
//   EASY: "bg-green-100 text-green-700",
//   MEDIUM: "bg-amber-100 text-amber-700",
//   HARD: "bg-red-100 text-red-700",
//   EXPERT: "bg-purple-100 text-purple-700",
// };

const PLANT_EMOJIS: Record<string, string> = {
  tomato: "🍅", basil: "🌿", lettuce: "🥬", carrot: "🥕", spinach: "🥬",
  pepper: "🫑", cucumber: "🥒", mint: "🌱", strawberry: "🍓", sunflower: "🌻",
  lavender: "💜", rosemary: "🌿", thyme: "🌿", kale: "🥬", broccoli: "🥦",
  cauliflower: "🥦", onion: "🧅", garlic: "🧄", pea: "🫛", bean: "🫘",
  corn: "🌽", squash: "🎃", watermelon: "🍉", pumpkin: "🎃", rose: "🌹",
  marigold: "🌸", coriander: "🌿", wheat: "🌾", blueberry: "🫐",
  oregano: "🌿", apple: "🍎", cherry: "🍒", orange: "🍊", lemon: "🍋",
  palm: "🌴", pine: "🌲", oak: "🌳", maple: "🍁", daisy: "🌼", tulip: "🌷",
};

function getPlantEmoji(name: string): string {
  const key = name.toLowerCase().split(" ")[0];
  return PLANT_EMOJIS[key] || "🌱";
}

function getCategoryIcon(name: string): string {
  const cat = detectCategory(name);
  const c = CATEGORIES.find(c => c.key === cat);
  return c?.icon || "🌱";
}

export function PlantCropScreen() {
  const router = useRouter();
  const { plotX, plotY } = useLocalSearchParams<{ plotX?: string; plotY?: string }>();
  const { crops, plantCrop, isLoading, selectedGarden } = useGarden();
  const [selectedSeed, setSelectedSeed] = useState<PlantSpecies | null>(null);
  const [selectedPlot, setSelectedPlot] = useState<{ x: number; y: number } | null>(
    plotX && plotY ? { x: parseInt(plotX, 10), y: parseInt(plotY, 10) } : null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [plants, setPlants] = useState<PlantSpecies[]>([]);
  const [loadingPlants, setLoadingPlants] = useState(true);
  const [season, setSeason] = useState("");
  const [category, setCategory] = useState("all");
  const [_showCoinsAnimation, setShowCoinsAnimation] = useState(false);

  const isVirtual = selectedGarden?.type === "VIRTUAL";

  useEffect(() => {
    const month = new Date().getMonth();
    const s = month >= 2 && month <= 4 ? "spring" : month >= 5 && month <= 7 ? "summer" : month >= 8 && month <= 10 ? "fall" : "winter";
    setSeason(s);
    fetchPlants(s);
  }, []);

  const fetchPlants = useCallback(async (seasonFilter: string, query = "") => {
    setLoadingPlants(true);
    try {
      let endpoint: string;
      if (query) {
        endpoint = `/plants?q=${encodeURIComponent(query)}&limit=50`;
      } else {
        endpoint = `/plants?season=${encodeURIComponent(seasonFilter)}`;
      }
      const resp = await api.get(endpoint);
      const plantsList = resp.data?.data || resp.data || [];
      setPlants(Array.isArray(plantsList) ? plantsList : []);
    } catch {
      setPlants([]);
    } finally {
      setLoadingPlants(false);
    }
  }, []);

  const debouncedSearch = useCallback(
    debounce((query: unknown) => {
      if ((query as string).length >= 2) fetchPlants(season, query as string);
      else fetchPlants(season);
    }, 400),
    [season, fetchPlants],
  );

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    debouncedSearch(text);
  };

  const filteredPlants = category === "all" ? plants : plants.filter(p => detectCategory(p.commonName) === category);

  const handlePlant = async () => {
    if (!selectedSeed || !selectedPlot) return;
    HapticFeedback.success();
    try {
      await plantCrop(selectedSeed.commonName, selectedSeed.scientificName, selectedPlot.x, selectedPlot.y);
      setShowCoinsAnimation(true);
      setTimeout(() => {
        setShowCoinsAnimation(false);
        router.back();
      }, 1200);
    } catch {
      // noop
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      <View className="px-4 py-4">
        {isVirtual && (
          <View className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex-row items-center">
            <Text className="text-lg mr-2">⚡</Text>
            <Text className="text-amber-800 text-sm flex-1">
              Virtual garden — crops grow 100x faster! Harvest in hours, not days.
            </Text>
          </View>
        )}

        {/* Plot Selection - 6×6 Grid */}
        <Card className="mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-semibold text-gray-900">
              Select Plot Position
            </Text>
            {selectedPlot && (
              <Text className="text-xs text-primary-600 font-medium">
                Plot ({selectedPlot.x + 1}, {selectedPlot.y + 1})
              </Text>
            )}
          </View>
          <View className="gap-1.5">
            {Array.from({ length: 6 }, (_, row) => (
              <View key={row} className="flex-row gap-1.5">
                {Array.from({ length: 6 }, (_, col) => {
                  const isSelected = selectedPlot?.x === col && selectedPlot?.y === row;
                  const existingCrop = crops.find(c => c.plotX === col && c.plotY === row);
                  return (
                    <TouchableOpacity
                      key={`${row}-${col}`}
                      onPress={() => { if (!existingCrop) { HapticFeedback.light(); setSelectedPlot({ x: col, y: row }); } }}
                      disabled={!!existingCrop}
                      className={`flex-1 aspect-square rounded-lg items-center justify-center border-2 ${
                        isSelected
                          ? "bg-primary-100 border-primary-500"
                          : existingCrop
                            ? "bg-gray-100 border-gray-200 opacity-50"
                            : "bg-amber-50 border-amber-200"
                      }`}
                    >
                      {existingCrop ? (
                        <Text className="text-lg">{getPlantEmoji(existingCrop.name)}</Text>
                      ) : isSelected ? (
                        <Text className="text-primary-600 text-xs font-bold">✓</Text>
                      ) : (
                        <View className="w-3 h-3 rounded-full bg-amber-200" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
          <Text className="text-xs text-gray-400 mt-2 text-center">
            {selectedPlot
              ? `Ready to plant at plot (${selectedPlot.x + 1}, ${selectedPlot.y + 1})`
              : "Tap an empty plot to select it"}
          </Text>
        </Card>

        {/* Season + Garden Type */}
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-2">
            <Text className="text-base font-semibold text-gray-900">Choose a Plant</Text>
            <Badge label={season.charAt(0).toUpperCase() + season.slice(1)} variant="primary" size="sm" />
          </View>
          {isVirtual && <Badge label="100x Speed" variant="warning" size="sm" />}
        </View>

        {/* Category Pills - Farmville Style */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
          <View className="flex-row gap-2">
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.key}
                onPress={() => { HapticFeedback.light(); setCategory(cat.key); }}
                className={`flex-row items-center px-3 py-2 rounded-full border ${
                  category === cat.key ? "bg-primary-600 border-primary-600" : "bg-white border-gray-200"
                }`}
              >
                <Text className="text-sm mr-1">{cat.icon}</Text>
                <Text className={`text-xs font-medium ${category === cat.key ? "text-white" : "text-gray-600"}`}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Search */}
        <TextInput
          placeholder="Search plants..."
          value={searchQuery}
          onChangeText={handleSearch}
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-4 text-sm text-gray-900"
          placeholderTextColor="#9CA3AF"
        />

        {/* Plant Grid */}
        {loadingPlants ? (
          <LoadingSpinner message="Searching plant database..." />
        ) : filteredPlants.length === 0 ? (
          <Card className="mb-4 p-6 items-center">
            <Text className="text-4xl mb-2">🌱</Text>
            <Text className="text-gray-500 text-sm text-center">No plants found in this category. Try a different search.</Text>
          </Card>
        ) : (
          <View className="flex-row flex-wrap gap-3 mb-6">
            {filteredPlants.map((plant) => {
              const isSelected = selectedSeed?.id === plant.id;
              const categoryIcon = getCategoryIcon(plant.commonName);
              return (
                <TouchableOpacity
                  key={plant.id}
                  onPress={() => { HapticFeedback.light(); setSelectedSeed(plant); }}
                  activeOpacity={0.7}
                  className={`bg-white rounded-2xl p-4 border-2 w-[48%] ${isSelected ? "border-primary-500" : "border-gray-100"}`}
                >
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-2xl">{getPlantEmoji(plant.commonName)}</Text>
                    <Badge label={categoryIcon} variant="info" size="sm" />
                  </View>
                  <Text className="text-sm font-semibold text-gray-900">{plant.commonName}</Text>
                  <Text className="text-xs text-gray-400 mb-1" numberOfLines={1}>
                    {plant.scientificName}
                  </Text>
                  <View className="flex-row items-center justify-between flex-wrap gap-1">
                    <Badge label={plant.difficulty} variant="primary" size="sm" />
                    {plant.sunlightNeeds === "FULL_SUN" && <Text className="text-xs text-amber-500">☀️</Text>}
                    {plant.waterNeeds === "HIGH" && <Text className="text-xs text-blue-500">💧</Text>}
                  </View>
                  {plant.growingDays && (
                    <View className="flex-row items-center mt-1">
                      <Text className="text-xs text-gray-400">
                        {isVirtual
                          ? `${(plant.growingDays / 100).toFixed(1)}h ⚡`
                          : `${plant.growingDays} days`}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Farmville-Style Mastery Info */}
        {selectedSeed && (
          <Card className="mb-4 p-4">
            <Text className="text-sm font-semibold text-gray-900 mb-2">
              🌟 Growing Tip
            </Text>
            <Text className="text-xs text-gray-500 leading-5">
              {isVirtual
                ? `This ${selectedSeed.commonName} normally takes ${selectedSeed.growingDays || 30} days to mature. In virtual mode, it'll be ready in about ${((selectedSeed.growingDays || 30) / 100).toFixed(1)} hours! Keep it watered for best yield.`
                : `${selectedSeed.commonName} takes ${selectedSeed.growingDays || 30} days to grow. Water daily and fertilize weekly for maximum harvest.`}
            </Text>
          </Card>
        )}

        {/* Plant Button */}
        <Button
          title={isVirtual ? "⚡ Plant (100x Speed)" : "🌱 Plant Crop"}
          onPress={handlePlant}
          isLoading={isLoading}
          size="lg"
          disabled={!selectedSeed || !selectedPlot}
        />

        <View className="h-8" />
      </View>
    </ScrollView>
  );
}


