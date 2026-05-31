import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useGarden } from '../../hooks/useGarden';
import { Crop } from '../../types';

const MINIMAP_SIZE = 150;
const TILE_SIZE = MINIMAP_SIZE / 4; // Assuming 4x4 grid

// Color mapping for crop types (same as in Garden3D but for minimap)
const cropColors: Record<string, string> = {
  Tomato: '#ff0000',
  Basil: '#008000',
  Lettuce: '#90ee90',
  Carrot: '#ffa500',
  Strawberry: '#ff69b4',
  Mint: '#98fb98',
  Sunflower: '#ffff00',
  BellPepper: '#ff4500',
  Cucumber: '#00ffff',
  Lavender: '#ee82ee',
  default: '#8b4513'
};

export function Minimap() {
  const { crops, selectedGarden } = useGarden();
  const soilQuality = selectedGarden?.soilQuality ?? 50;
  const irrigationLevel = selectedGarden?.irrigationLevel ?? 50;
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCropForTagging, setSelectedCropForTagging] = useState<Crop | null>(null);
  const [tagNote, setTagNote] = useState('');

  // Create a 4x4 grid initialized with empty (soil)
  const grid: ('empty' | Crop)[][] = Array(4).fill(null).map(() => Array(4).fill('empty'));

  // Fill in the crops
  crops.forEach(crop => {
    if (crop.plotX !== undefined && crop.plotY !== undefined && 
        crop.plotX >= 0 && crop.plotX < 4 && 
        crop.plotY >= 0 && crop.plotY < 4) {
      grid[crop.plotY][crop.plotX] = crop;
    }
  });

  const handleTagCrop = (crop: Crop) => {
    setSelectedCropForTagging(crop);
    setTagNote('');
    setModalVisible(true);
  };

  const handleSaveTag = () => {
    // In a real app, we would save this tag to a database or state
    // For now, we'll just show an alert
    if (selectedCropForTagging) {
      alert(`Tag saved for ${selectedCropForTagging.name}: ${tagNote}`);
    }
    setModalVisible(false);
  };

  const handleCancelTag = () => {
    setModalVisible(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.minimapTitle}>
          <Text style={styles.minimapTitleText}>Garden Map</Text>
        </View>
        <View style={styles.minimapContainer}>
          {grid.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.minimapRow}>
              {row.map((cell, colIndex) => {
                let backgroundColor = '#8b4513'; // Default soil color
                let borderWidth = StyleSheet.hairlineWidth;
                let borderColor = '#ddd';
                
                if (cell !== 'empty') {
                  backgroundColor = cropColors[cell.name] || cropColors.default;
                  
                  // Add a visual indicator for tagged crops (for demo, we'll tag crops with low health)
                  if (cell.health && cell.health < 50) {
                    borderWidth = 2;
                    borderColor = '#ff0000'; // Red border for unhealthy crops
                  }
                }
                
                return (
                  <TouchableOpacity
                    key={`cell-${rowIndex}-${colIndex}`}
                    style={[styles.minimapTile, { backgroundColor, borderWidth, borderColor }]}
                    onPress={() => {
                      if (cell !== 'empty') {
                        handleTagCrop(cell);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    {/* Show a small dot for very young crops */}
                    {cell !== 'empty' && 
                     cell.growthStage !== undefined && 
                     cell.growthStage < 0.2 && 
                     (<View style={styles.sproutIndicator} />)}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
        <View style={styles.minimapLegend}>
          <Text style={styles.minimapLegendText}>
            Soil: {soilQuality}% | Water: {irrigationLevel}%
          </Text>
        </View>
      </View>
      
      {/* Tagging Modal */}
      <Modal
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCancelTag}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Tag Crop</Text>
            {selectedCropForTagging !== null && (
              <View style={styles.modalBody}>
                <Text style={styles.modalSubtitle}>Tag for {selectedCropForTagging.name}</Text>
                <Text style={styles.modalText}>Add a note or reminder:</Text>
                <TextInput
                  placeholder="Enter your note here..."
                  value={tagNote}
                  onChangeText={setTagNote}
                  style={styles.tagInput}
                  maxLength={100}
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelTag}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveTag}
                  >
                    <Text style={styles.saveButtonText}>Save Tag</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
  minimapTitle: {
    marginBottom: 4,
  },
  minimapTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  minimapContainer: {
    width: MINIMAP_SIZE,
    height: MINIMAP_SIZE,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  minimapRow: {
    flexDirection: 'row',
  },
  minimapTile: {
    width: TILE_SIZE,
    height: TILE_SIZE,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
  minimapLegend: {
    marginTop: 4,
  },
  minimapLegendText: {
    fontSize: 12,
    color: '#666',
  },
  // Modal styles
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    maxWidth: 300,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalBody: {
    gap: 12,
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  modalText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  tagInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007aff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  // Sprout indicator for young crops
  sproutIndicator: {
    position: 'absolute',
    bottom: 2,
    left: '50%',
    width: 4,
    height: 4,
    backgroundColor: '#90ee90',
    borderRadius: 2,
    transform: [{ translateX: -2 }],
  }
});