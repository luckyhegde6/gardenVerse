import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useGarden } from '../../hooks/useGarden';
import { PlantSpecies } from '../../types';
import debounce from '../../utils/debounce';

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: 'bg-green-100 text-green-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  HARD: 'bg-red-100 text-red-700',
  EXPERT: 'bg-purple-100 text-purple-700',
};

const PLANT_EMOJIS: Record<string, string> = {
  tomato: '🍅', basil: '🌿', lettuce: '🥬', carrot: '🥕',
  spinach: '🥬', pepper: '🫑', cucumber: '🥒', mint: '🌱',
  strawberry: '🍓', sunflower: '🌻', lavender: '💜', rosemary: '🌿',
  thyme: '🌿', kale: '🥬', broccoli: '🥦', cauliflower: '🥦',
  onion: '🧅', garlic: '🧄', pea: '🫛', bean: '🫘',
  corn: '🌽', squash: '🎃', watermelon: '🍉', pumpkin: '🎃',
  rose: '🌹', marigold: '🌸', coriander: '🌿', wheat: '🌾',
};

function getPlantEmoji(name: string): string {
  const key = name.toLowerCase().split(' ')[0];
  return PLANT_EMOJIS[key] || '🌱';
}

function PlantCropScreen() {
  const navigation = useNavigation();
  const { plantCrop, isLoading } = useGarden();
  const [selectedSeed, setSelectedSeed] = useState<PlantSpecies | null>(null);
  const [selectedPlot, setSelectedPlot] = useState<{ x: number; y: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [plants, setPlants] = useState<PlantSpecies[]>([]);
  const [loadingPlants, setLoadingPlants] = useState(true);
  const [season, setSeason] = useState('');

  useEffect(() => {
    const month = new Date().getMonth();
    const s = month >= 2 && month <= 4 ? 'spring' : month >= 5 && month <= 7 ? 'summer' : month >= 8 && month <= 10 ? 'fall' : 'winter';
    setSeason(s);
    fetchPlants(s);
  }, []);

  const fetchPlants = useCallback(async (seasonFilter: string, query = '') => {
    setLoadingPlants(true);
    try {
      const baseUrl = 'http://localhost:3001/api/v1';
      let url: string;
      let params: any = {};

      if (query) {
        url = `${baseUrl}/plants/search`;
        params = { q: query, limit: 30 };
      } else {
        url = `${baseUrl}/plants/by-season`;
        params = { season: seasonFilter };
      }

      const { data } = await axios.get(url, { params });
      const plantsList = data.data || data || [];
      setPlants(Array.isArray(plantsList) ? plantsList : []);
    } catch {
      setPlants([]);
    } finally {
      setLoadingPlants(false);
    }
  }, []);

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (query.length >= 2) {
        fetchPlants(season, query);
      } else {
        fetchPlants(season);
      }
    }, 400),
    [season, fetchPlants],
  );

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    debouncedSearch(text);
  };

  const handlePlant = async () => {
    if (!selectedSeed || !selectedPlot) return;
    try {
      await plantCrop(selectedSeed.id, selectedPlot.x, selectedPlot.y);
      navigation.goBack();
    } catch {}
  };

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      <View className="px-4 py-4">
        {/* Plot Selection */}
        <Card className="mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-3">Select Plot Position</Text>
          <View className="gap-2">
            {Array.from({ length: 4 }, (_, row) => (
              <View key={row} className="flex-row gap-2">
                {Array.from({ length: 4 }, (_, col) => {
                  const isSelected = selectedPlot?.x === col && selectedPlot?.y === row;
                  return (
                    <TouchableOpacity
                      key={`${row}-${col}`}
                      onPress={() => setSelectedPlot({ x: col, y: row })}
                      className={`flex-1 aspect-square rounded-xl items-center justify-center border-2 ${
                        isSelected ? 'bg-primary-100 border-primary-500' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      {isSelected && <Text className="text-primary-600 text-sm font-bold">Selected</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </Card>

        {/* Season Info */}
        <View className="flex-row items-center mb-3">
          <Text className="text-base font-semibold text-gray-900">Choose a Plant</Text>
          <Badge label={season.charAt(0).toUpperCase() + season.slice(1)} variant="primary" size="sm" />
        </View>

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
        ) : plants.length === 0 ? (
          <Card className="mb-4 p-6 items-center">
            <Text className="text-4xl mb-2">🌱</Text>
            <Text className="text-gray-500 text-sm text-center">No plants found. Try a different search or check your connection.</Text>
          </Card>
        ) : (
          <View className="flex-row flex-wrap gap-3 mb-6">
            {plants.map((plant) => {
              const isSelected = selectedSeed?.id === plant.id;
              const difficultyColor = DIFFICULTY_COLORS[plant.difficulty] || DIFFICULTY_COLORS.MEDIUM;
              return (
                <TouchableOpacity
                  key={plant.id}
                  onPress={() => setSelectedSeed(plant)}
                  activeOpacity={0.7}
                  className={`bg-white rounded-2xl p-4 border-2 w-[48%] ${isSelected ? 'border-primary-500' : 'border-gray-100'}`}
                >
                  <Text className="text-2xl mb-2">{getPlantEmoji(plant.commonName)}</Text>
                  <Text className="text-sm font-semibold text-gray-900">{plant.commonName}</Text>
                  <Text className="text-xs text-gray-400 mb-1" numberOfLines={1}>{plant.scientificName}</Text>
                  <View className="flex-row items-center justify-between flex-wrap gap-1">
                    <Badge label={plant.difficulty} variant="primary" size="sm" />
                    {plant.sunlightNeeds === 'FULL_SUN' && <Text className="text-xs text-amber-500">☀️</Text>}
                    {plant.waterNeeds === 'HIGH' && <Text className="text-xs text-blue-500">💧</Text>}
                  </View>
                  {plant.growingDays && (
                    <Text className="text-xs text-gray-400 mt-1">{plant.growingDays} days to maturity</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Plant Button */}
        <Button
          title="Plant Crop"
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

export { PlantCropScreen };
