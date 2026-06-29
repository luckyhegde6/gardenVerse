import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { PlantSpecies } from "@/types";

const { width: _SCREEN_WIDTH } = Dimensions.get('window');
const SHEET_HEIGHT = 280;
const CARD_WIDTH = 120;
const CARD_HEIGHT = 200;

interface SeedOption {
  species: PlantSpecies;
  quantity: number;
}

interface PlantSelectionSheetProps {
  visible: boolean;
  onClose: () => void;
  onPlant: (species: PlantSpecies, plotX: number, plotY: number) => void;
  plotX: number;
  plotY: number;
  availableSeeds: SeedOption[];
}

export function PlantSelectionSheet({
  visible,
  onClose,
  onPlant,
  plotX,
  plotY,
  availableSeeds,
}: PlantSelectionSheetProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [animation] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.timing(animation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, animation]);

  const handlePlant = useCallback(
    (species: PlantSpecies) => {
      onPlant(species, plotX, plotY);
      // Emit planting particles at the plot position
      // The actual position will be calculated in GardenScreen
      onClose();
    },
    [onPlant, onClose, plotX, plotY]
  );

  if (!visible) return null;

  const starterSeeds = availableSeeds.filter((s) => s.quantity > 0);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [SHEET_HEIGHT, 0] }) }],
        },
      ]}
    >
      {/* Handle bar */}
      <View style={styles.handleContainer}>
        <View style={styles.handle} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Select a Seed</Text>
        <Text style={styles.subtitle}>Tap a seed to plant at ({plotX}, {plotY})</Text>
      </View>

      {/* Seed Carousel */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={CARD_WIDTH + 16}
        decelerationRate="fast"
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / (CARD_WIDTH + 16));
          setSelectedIndex(index);
        }}
      >
        {starterSeeds.map((seed, index) => (
          <TouchableOpacity
            key={seed.species.id}
            style={[
              styles.seedCard,
              index === selectedIndex && styles.seedCardSelected,
            ]}
            onPress={() => handlePlant(seed.species)}
            activeOpacity={0.8}
          >
            <View style={styles.seedCardContent}>
              {/* Plant Preview */}
              <View style={styles.previewContainer}>
                <Text style={styles.previewEmoji}>
                  {getSeedEmoji(seed.species.commonName)}
                </Text>
              </View>

              {/* Seed Info */}
              <Text style={styles.seedName} numberOfLines={1}>
                {seed.species.commonName}
              </Text>
              <Text style={styles.seedScientific}>{seed.species.scientificName}</Text>

              {/* Stats Row */}
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Growth</Text>
                  <Text style={styles.statValue}>
                    {seed.species.growingDays} days
                  </Text>
                </View>
                <View style={styles.stat}>
                  <Text style={styles.statLabel}>Yield</Text>
                  <Text style={styles.statValue}>
                    {getEstimatedYield(seed.species)}
                  </Text>
                </View>
              </View>

              {/* Quantity Badge */}
              <View style={styles.quantityBadge}>
                <Text style={styles.quantityText}>
                  {seed.quantity}x
                </Text>
              </View>

              {/* Difficulty */}
              <View style={styles.difficultyContainer}>
                <Text style={styles.difficultyLabel}>Difficulty:</Text>
                <View style={styles.difficultyStars}>
                  {[...Array(5)].map((_, i) => (
                    <Text
                      key={i}
                      style={[
                        styles.difficultyStar,
                        i < getDifficultyRating(seed.species.difficulty)
                          ? styles.difficultyStarFilled
                          : styles.difficultyStarEmpty,
                      ]}
                    >
                      ★
                    </Text>
                  ))}
                </View>
              </View>

              {/* Plant Button */}
              <View style={styles.plantButton}>
                <Text style={styles.plantButtonText}>Plant</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Empty state */}
      {starterSeeds.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No seeds available</Text>
          <Text style={styles.emptySubtext}>Visit the Shop to buy seeds</Text>
        </View>
      )}

      {/* Close button */}
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Text style={styles.closeButtonText}>Cancel</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function getSeedEmoji(name: string): string {
  const emojiMap: Record<string, string> = {
    Tomato: '🍅',
    Carrot: '🥕',
    Sunflower: '🌻',
    Strawberry: '🍓',
    'Bell Pepper': '🫑',
    Cucumber: '🥒',
    Lettuce: '🥬',
    Basil: '🌿',
    Chilli: '🌶️',
    Turmeric: '🟡',
    Rice: '🌾',
    Okra: '🫛',
    Brinjal: '🍆',
    Corn: '🌽',
    Watermelon: '🍉',
    Onion: '🧅',
    Potato: '🥔',
    Spinach: '🥬',
    Mint: '🌿',
    Marigold: '🌼',
  };
  return emojiMap[name] || '🌱';
}

function getEstimatedYield(species: PlantSpecies): string {
  // Simple yield estimation based on plant type
  const yieldMap: Record<string, string> = {
    Tomato: '5-8',
    Carrot: '8-12',
    Sunflower: '1 (seeds)',
    Strawberry: '10-20',
    'Bell Pepper': '4-6',
    Cucumber: '6-10',
    Lettuce: '1 head',
    Basil: '20+ leaves',
    Chilli: '15-20',
    Turmeric: '500g+',
    Rice: '200g+',
    Okra: '10-15',
    Brinjal: '4-6',
    Corn: '2-4 ears',
    Watermelon: '1-2',
    Onion: '4-6',
    Potato: '8-12',
    Spinach: '30+ leaves',
    Mint: '50+ leaves',
    Marigold: '20+ flowers',
  };
  return yieldMap[species.commonName] || '5-10';
}

function getDifficultyRating(difficulty: string): number {
  const ratings: Record<string, number> = {
    Easy: 1,
    Beginner: 1,
    Medium: 3,
    Intermediate: 3,
    Hard: 5,
    Expert: 5,
  };
  return ratings[difficulty] || 2;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#475569',
    borderRadius: 2,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 12,
  },
  seedCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#334155',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
  },
  seedCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#1e3a5f',
  },
  seedCardContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  previewContainer: {
    alignItems: 'center',
    height: 60,
  },
  previewEmoji: {
    fontSize: 36,
  },
  seedName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
  },
  seedScientific: {
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#e2e8f0',
  },
  quantityBadge: {
    alignSelf: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginVertical: 4,
  },
  quantityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f8fafc',
  },
  difficultyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  difficultyLabel: {
    fontSize: 9,
    color: '#64748b',
  },
  difficultyStars: {
    flexDirection: 'row',
  },
  difficultyStar: {
    fontSize: 10,
  },
  difficultyStarFilled: {
    color: '#fbbf24',
  },
  difficultyStarEmpty: {
    color: '#475569',
  },
  plantButton: {
    backgroundColor: '#3b82f6',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  plantButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
  },
  closeButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
});