import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { useParticleSystem } from '../components/garden/ParticleSystem';

export type FeedbackType = 'plant' | 'water' | 'fertilize' | 'harvest' | 'levelUp' | 'growthTick';

interface FeedbackConfig {
  haptic: Haptics.ImpactFeedbackStyle | Haptics.NotificationFeedbackType;
  soundFile?: any;
  particleType?: 'water' | 'fertilize' | 'harvest' | 'plant' | 'confetti' | 'growthTick';
  particleCount?: number;
}

const FEEDBACK_CONFIG: Record<FeedbackType, FeedbackConfig> = {
  plant: {
    haptic: Haptics.ImpactFeedbackStyle.Medium,
    soundFile: null,
    particleType: 'plant',
    particleCount: 6,
  },
  water: {
    haptic: Haptics.ImpactFeedbackStyle.Medium,
    soundFile: null,
    particleType: 'water',
    particleCount: 8,
  },
  fertilize: {
    haptic: Haptics.ImpactFeedbackStyle.Medium,
    soundFile: null,
    particleType: 'fertilize',
    particleCount: 12,
  },
  harvest: {
    haptic: Haptics.ImpactFeedbackStyle.Heavy,
    soundFile: null,
    particleType: 'harvest',
    particleCount: 20,
  },
  levelUp: {
    haptic: Haptics.NotificationFeedbackType.Success,
    soundFile: null,
    particleType: 'confetti',
    particleCount: 30,
  },
  growthTick: {
    haptic: Haptics.ImpactFeedbackStyle.Light,
    particleType: 'growthTick',
    particleCount: 1,
  },
};

const soundCache: Record<string, Audio.Sound | null> = {};

async function loadSound(file: any): Promise<Audio.Sound | null> {
  try {
    const { sound } = await Audio.Sound.createAsync(file, { shouldPlay: false });
    return sound;
  } catch (e) {
    console.warn('Failed to load sound:', e);
    return null;
  }
}

async function playSound(file: any): Promise<void> {
  if (!file) return;
  const key = file.toString();
  let sound = soundCache[key];
  if (!sound) {
    sound = await loadSound(file);
    if (sound) soundCache[key] = sound;
  }
  if (sound) {
    try {
      await sound.replayAsync();
    } catch (e) {
      console.warn('Failed to play sound:', e);
    }
  }
}

export function useGameFeedback(): { trigger: (type: FeedbackType, position?: { x: number; y: number }) => Promise<void>; triggerAtCrop: (type: FeedbackType, crop: { plotX?: number; plotY?: number }) => Promise<void> } {
  const { emit } = useParticleSystem();

  const trigger = async (type: FeedbackType, position?: { x: number; y: number }): Promise<void> => {
    const config = FEEDBACK_CONFIG[type];

    // Haptic feedback
    if (config.haptic in Haptics.ImpactFeedbackStyle) {
      await Haptics.impactAsync(config.haptic as Haptics.ImpactFeedbackStyle);
    } else {
      await Haptics.notificationAsync(config.haptic as Haptics.NotificationFeedbackType);
    }

    // Sound
    if (config.soundFile) {
      playSound(config.soundFile).catch(() => {});
    }

    // Particles
    if (config.particleType && position) {
      emit(config.particleType, position);
    }
  };

  const triggerAtCrop = async (type: FeedbackType, crop: { plotX?: number; plotY?: number }) => {
    const position = positionFromGrid(crop.plotX ?? 0, crop.plotY ?? 0);
    await trigger(type, position);
  };

  return { trigger, triggerAtCrop };
}

export function positionFromGrid(plotX: number, plotY: number): { x: number; y: number } {
  return { x: 50 + plotX * 60, y: 50 + plotY * 60 };
}

export async function preloadGameSounds(): Promise<void> {
  await Promise.all(
    Object.values(FEEDBACK_CONFIG)
      .filter((c) => c.soundFile)
      .map((c) => loadSound(c.soundFile!))
  );
}