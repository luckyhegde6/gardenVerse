import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Easing,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useGamification } from '../../hooks/useGamification';

interface QuestTrackerWidgetProps {
  onPress?: () => void;
}

interface DailyQuest {
  id: string;
  questKey: string;
  title: string;
  progress: number;
  targetCount: number;
  isCompleted: boolean;
  claimed: boolean;
  claimedAt?: string;
}

export function QuestTrackerWidget({ onPress }: QuestTrackerWidgetProps) {
  const { dailyQuests, claimQuest } = useGamification();
  const [activeQuest, setActiveQuest] = useState<DailyQuest | null>(null);
  const [progressAnim] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const incomplete = (dailyQuests as unknown as DailyQuest[]).filter(
      (q) => !q.claimed && !q.isCompleted
    );
    if (incomplete.length > 0) {
      setActiveQuest(incomplete[0]);
    } else if ((dailyQuests as unknown as DailyQuest[]).length > 0) {
      setActiveQuest((dailyQuests as unknown as DailyQuest[])[0]);
    }
  }, [dailyQuests]);

  useEffect(() => {
    if (activeQuest) {
      const progress = activeQuest.progress / activeQuest.targetCount;
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [activeQuest, progressAnim]);

  if (!activeQuest) {
    return (
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text style={styles.icon}>🏆</Text>
        <Text style={styles.text}>No active quests</Text>
        <Text style={styles.subtext}>Tap to view all quests</Text>
      </TouchableOpacity>
    );
  }

  const progress = activeQuest.progress / activeQuest.targetCount;
  const isComplete = activeQuest.isCompleted || activeQuest.claimed;

  const rotateAnim = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['-90deg', '270deg'],
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.progressRing,
          { transform: [{ rotate: rotateAnim }] },
        ]}
      >
        <View style={styles.progressRingInner} />
        <Text style={styles.progressText}>
          {Math.round(progress * 100)}%
        </Text>
      </Animated.View>

      <View style={styles.content}>
        <View style={styles.questHeader}>
          <Text style={styles.questIcon}>{getQuestIcon(activeQuest.questKey)}</Text>
          <Text style={styles.questTitle} numberOfLines={1}>
            {activeQuest.title}
          </Text>
          {isComplete && <Text style={styles.completeBadge}>✓ Done</Text>}
        </View>

        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBarFill,
              { width: `${Math.min(100, Math.round(progress * 100))}%` },
            ]}
          />
        </View>

        <Text style={styles.progressDetail}>
          {activeQuest.progress} / {activeQuest.targetCount}
        </Text>

        {isComplete && (
          <TouchableOpacity
            style={styles.claimButton}
            onPress={() => {
              claimQuest(activeQuest.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }}
          >
            <Text style={styles.claimButtonText}>Claim Reward</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

function getQuestIcon(questKey: string): string {
  const icons: Record<string, string> = {
    water_crops: '💧',
    harvest_crops: '🌾',
    plant_seeds: '🌱',
    fertilize_crops: '🌿',
    scan_plant: '📸',
  };
  return icons[questKey] || '🎯';
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 200,
    maxWidth: 280,
  },
  progressRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRingInner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  progressText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6366f1',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  questHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  questIcon: {
    fontSize: 16,
  },
  questTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
  },
  completeBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#22c55e',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#6366f1',
    borderRadius: 2,
  },
  progressDetail: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 6,
  },
  claimButton: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  claimButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  icon: {
    fontSize: 20,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6366f1',
  },
  subtext: {
    fontSize: 10,
    color: '#94a3b8',
  },
});