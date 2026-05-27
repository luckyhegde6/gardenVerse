import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Chip } from '../../components/ui/Chip';

const TABS = ['Seeds', 'Fertilizers', 'Tools', 'Cosmetics'] as const;
type TabType = (typeof TABS)[number];

interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  icon: string;
  description?: string;
}

const ITEMS: Record<TabType, InventoryItem[]> = {
  Seeds: [
    { id: 's1', name: 'Tomato Seeds', quantity: 10, rarity: 'common', icon: '🍅' },
    { id: 's2', name: 'Carrot Seeds', quantity: 8, rarity: 'common', icon: '🥕' },
    { id: 's3', name: 'Sunflower Seeds', quantity: 5, rarity: 'uncommon', icon: '🌻' },
    { id: 's4', name: 'Wheat Seeds', quantity: 15, rarity: 'common', icon: '🌾' },
    { id: 's5', name: 'Blue Rose Seeds', quantity: 2, rarity: 'legendary', icon: '🌹' },
    { id: 's6', name: 'Golden Corn Seeds', quantity: 3, rarity: 'rare', icon: '🌽' },
  ],
  Fertilizers: [
    { id: 'f1', name: 'Organic Compost', quantity: 5, rarity: 'common', icon: '🌿' },
    { id: 'f2', name: 'Growth Booster', quantity: 3, rarity: 'uncommon', icon: '⚡' },
    { id: 'f3', name: 'Super Bloom', quantity: 1, rarity: 'rare', icon: '🌸' },
  ],
  Tools: [
    { id: 't1', name: 'Watering Can', quantity: 1, rarity: 'common', icon: '🚿' },
    { id: 't2', name: 'Golden Trowel', quantity: 1, rarity: 'legendary', icon: '🔧' },
    { id: 't3', name: 'Pruning Shears', quantity: 1, rarity: 'uncommon', icon: '✂️' },
  ],
  Cosmetics: [
    { id: 'c1', name: 'Garden Gnome', quantity: 1, rarity: 'rare', icon: '🧙' },
    { id: 'c2', name: 'Rainbow Planter', quantity: 1, rarity: 'legendary', icon: '🌈' },
    { id: 'c3', name: 'Wooden Sign', quantity: 3, rarity: 'common', icon: '🪧' },
  ],
};

const rarityColors: Record<string, string> = {
  common: 'bg-gray-100',
  uncommon: 'bg-green-100',
  rare: 'bg-blue-100',
  legendary: 'bg-amber-100',
};

export function InventoryScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('Seeds');

  const items = ITEMS[activeTab];

  return (
    <View className="flex-1 bg-gray-50">
      {/* Tabs */}
      <View className="flex-row px-4 py-3 bg-white border-b border-gray-100">
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`mr-4 pb-2 ${
              activeTab === tab ? 'border-b-2 border-primary-600' : ''
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                activeTab === tab ? 'text-primary-600' : 'text-gray-500'
              }`}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
      >
        {items.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Text className="text-4xl mb-3">📦</Text>
            <Text className="text-gray-500 text-sm">
              No items in this category
            </Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap gap-3">
            {items.map((item) => (
              <TouchableOpacity
                key={item.id}
                className="w-[48%] bg-white rounded-2xl p-4 border border-gray-100"
                activeOpacity={0.7}
              >
                <View
                  className={`w-12 h-12 rounded-xl items-center justify-center mb-2 ${rarityColors[item.rarity]}`}
                >
                  <Text className="text-2xl">{item.icon}</Text>
                </View>
                <Text className="text-sm font-semibold text-gray-900">
                  {item.name}
                </Text>
                <View className="flex-row items-center justify-between mt-1">
                  <Badge label={item.rarity} variant="primary" size="sm" />
                  <Text className="text-xs text-gray-500">×{item.quantity}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </View>
  );
}
