import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { gameSaveSync } from '@services/gameSaveSync';
import { useGardenStore } from '@stores/gardenStore';
import { useNetworkStatus } from '@hooks/useNetworkStatus';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

interface SaveGameButtonProps {
  onSaveComplete?: () => void;
}

export function SaveGameButton({ onSaveComplete }: SaveGameButtonProps) {
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const { isOnline } = useNetworkStatus();
  const crops = useGardenStore((s) => s.crops);
  const gardens = useGardenStore((s) => s.gardens);

  const pulseAnim = useSharedValue(1);
  const scaleAnim = useSharedValue(1);

  // Gentle periodic pulse to remind users to save
  useEffect(() => {
    const pulse = () => {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 1200 }),
          withTiming(1, { duration: 1200 })
        ),
        -1,
        true
      );
    };

    // Start pulsing after 30 seconds of no save
    const timer = setTimeout(pulse, 30000);
    return () => clearTimeout(timer);
  }, []);

  // Reset pulse after save
  useEffect(() => {
    if (saveState === 'saved') {
      pulseAnim.value = withTiming(1, { duration: 200 });
      const timer = setTimeout(() => setSaveState('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [saveState]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
  }));

  const handleSave = useCallback(async () => {
    if (saveState === 'saving') return;

    setSaveState('saving');
    scaleAnim.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );

    try {
      const result = await gameSaveSync.manualSaveAndSync({
        crops,
        gardens,
        questProgress: [],
        collections: [],
      });

      if (result.success) {
        setSaveState('saved');
      } else if (!isOnline) {
        setSaveState('saved'); // Locally saved counts
      } else {
        setSaveState('error');
      }

      onSaveComplete?.();
    } catch {
      setSaveState('error');
      onSaveComplete?.();
    }
  }, [crops, gardens, isOnline, saveState, onSaveComplete]);

  const handleLongPress = useCallback(async () => {
    const lastSync = await gameSaveSync.getLastSyncTime();
    const hasPending = await gameSaveSync.hasPendingSync();

    let message = 'Connectivity: ' + (isOnline ? 'Online' : 'Offline') + '\n';
    if (lastSync) {
      try {
        const d = new Date(lastSync);
        message += 'Last sync: ' + d.toLocaleString() + '\n';
      } catch {
        message += 'Last sync: Unknown\n';
      }
    } else {
      message += 'Last sync: Never\n';
    }
    message += 'Pending changes: ' + (hasPending ? 'Yes' : 'No');

    Alert.alert('Sync Status', message);
  }, [isOnline]);

  const getIcon = (): string => {
    switch (saveState) {
      case 'saving':
        return '⏳';
      case 'saved':
        return '✓';
      case 'error':
        return '✕';
      default:
        return isOnline ? '☁' : '💾';
    }
  };

  const getLabel = (): string => {
    switch (saveState) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return 'Saved';
      case 'error':
        return 'Failed';
      default:
        return isOnline ? 'Save' : 'Save';
    }
  };

  const getButtonColor = (): string => {
    switch (saveState) {
      case 'saving':
        return '#f59e0b';
      case 'saved':
        return '#22c55e';
      case 'error':
        return '#ef4444';
      default:
        return '#16a34a';
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={handleSave}
        onLongPress={handleLongPress}
        activeOpacity={0.8}
        style={styles.touchable}
      >
        <Animated.View
          style={[
            styles.button,
            { backgroundColor: getButtonColor() },
            animatedButtonStyle,
          ]}
        >
          <Animated.Text style={[styles.icon, animatedIconStyle]}>
            {getIcon()}
          </Animated.Text>
          <Text style={styles.label}>{getLabel()}</Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 70,
    right: 16,
    zIndex: 10,
  },
  touchable: {
    borderRadius: 28,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
  icon: {
    fontSize: 18,
    marginRight: 6,
    color: '#ffffff',
  },
  label: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default SaveGameButton;
