import React, { useCallback } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useGarden } from '@hooks/useGarden';
import { Crop } from "@/types";
import HapticFeedback from '@utils/haptics';

const GRID = 6;
const CELL = 24;
const GAP = 2;
const _PANEL_W = CELL * GRID + GAP * (GRID - 1) + 24;

const CROP_COLORS: Record<string, string> = {
  Tomato: '#ef4444', Basil: '#22c55e', Lettuce: '#a3e635', Carrot: '#f97316',
  Strawberry: '#fb7185', Mint: '#4ade80', Sunflower: '#facc15', BellPepper: '#f97316',
  Cucumber: '#22d3ee', Lavender: '#c084fc', Corn: '#fde047', Wheat: '#eab308',
  Pumpkin: '#fb923c', Watermelon: '#22c55e', Rose: '#fb7185', Marigold: '#fbbf24',
  Coriander: '#22c55e', Broccoli: '#166534', Kale: '#15803d', Onion: '#d4a574',
  Garlic: '#e5e7eb', Chilli: '#dc2626', Turmeric: '#d97706', Rice: '#fef3c7',
  Okra: '#22c55e', Brinjal: '#7c3aed',
};

function getCropColor(name: string): string {
  const key = Object.keys(CROP_COLORS).find(k => name.toLowerCase().includes(k.toLowerCase()));
  return CROP_COLORS[key || ''] || '#8b4513';
}

export function Minimap() {
  const { crops, selectedGarden } = useGarden();
  const router = useRouter();
  const soilQuality = selectedGarden?.soilQuality ?? 50;
  const _irrigationLevel = selectedGarden?.irrigationLevel ?? 50;

  const healthyCount = crops.filter((c: Crop) => (c.health ?? 100) >= 70).length;
  const wiltingCount = crops.filter((c: Crop) => (c.health ?? 100) < 40).length;

  const handleCellPress = useCallback((col: number, row: number, crop?: Crop) => {
    HapticFeedback.light();
    if (crop) {
      router.push({ pathname: '/crop-detail/[cropId]', params: { cropId: crop.id } });
    }
  }, [router]);

  return (
    <View style={styles.wrapper}>
      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{crops.length}</Text>
          <Text style={styles.statLabel}>Crops</Text>
        </View>
        <View style={styles.stat}>
          <View style={[styles.healthDot, { backgroundColor: '#22c55e' }]} />
          <Text style={styles.statValue}>{healthyCount}</Text>
          <Text style={styles.statLabel}>Healthy</Text>
        </View>
        {wiltingCount > 0 && (
          <View style={styles.stat}>
            <View style={[styles.healthDot, { backgroundColor: '#ef4444' }]} />
            <Text style={[styles.statValue, { color: '#ef4444' }]}>{wiltingCount}</Text>
            <Text style={styles.statLabel}>Wilting</Text>
          </View>
        )}
        <View style={styles.stat}>
          <Text style={styles.statValue}>{soilQuality}%</Text>
          <Text style={styles.statLabel}>Soil</Text>
        </View>
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {Array.from({ length: GRID }, (_, row) => (
          <View key={row} style={styles.gridRow}>
            {Array.from({ length: GRID }, (_, col) => {
              const crop = crops.find((c: Crop) => c.plotX === col && c.plotY === row);
              const isEmpty = !crop;
              const health = crop?.health ?? 100;
              const isHydrated = (crop?.hydration ?? 0) > 40;

              const bgColor = isEmpty
                ? `hsl(33, ${30 + soilQuality * 0.3}%, ${48 - soilQuality * 0.15}%)`
                : getCropColor(crop.name);

              return (
                <TouchableOpacity
                  key={cellKey(col, row)}
                  style={[
                    styles.cell,
                    { backgroundColor: bgColor },
                    !isEmpty && health < 40 && styles.cellWilting,
                    !isEmpty && isHydrated && styles.cellHydrated,
                  ]}
                  activeOpacity={0.6}
                  onPress={() => handleCellPress(col, row, crop)}
                >
                  {!isEmpty && (
                    <>
                      {/* Health bar */}
                      <View style={styles.healthBarBg}>
                        <View
                          style={[
                            styles.healthBarFill,
                            {
                              width: `${Math.max(0, health)}%`,
                              backgroundColor: health >= 70 ? '#22c55e' : health >= 40 ? '#eab308' : '#ef4444',
                            },
                          ]}
                        />
                      </View>
                      {/* Water indicator */}
                      {isHydrated && <View style={styles.waterDot} />}
                    </>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

function cellKey(col: number, row: number): string {
  return `mm-${row}-${col}`;
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 10,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  healthDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  statLabel: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '500',
  },
  grid: {
    gap: GAP,
  },
  gridRow: {
    flexDirection: 'row',
    gap: GAP,
  },
  cell: {
    width: CELL,
    height: CELL,
    borderRadius: 4,
    justifyContent: 'flex-end',
    alignItems: 'center',
    overflow: 'hidden',
  },
  cellWilting: {
    opacity: 0.6,
  },
  cellHydrated: {
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.4)',
  },
  healthBarBg: {
    width: '80%',
    height: 3,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 1.5,
    marginBottom: 2,
    overflow: 'hidden',
  },
  healthBarFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  waterDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#60a5fa',
  },
});
