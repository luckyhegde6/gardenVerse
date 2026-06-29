import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, shadows } from '@/styles/theme';

interface LevelProgressProps {
  level: number;
  experience: number;
  xpForNextLevel: number;
}

export default function LevelProgress({
  level,
  experience,
  xpForNextLevel,
}: LevelProgressProps) {
  const percentage = Math.min(100, (experience / xpForNextLevel) * 100);

  return (
    <View style={styles.container}>
      <View style={styles.levelBadge}>
        <Text style={styles.levelText}>{level}</Text>
      </View>
      <View style={styles.barContainer}>
        <View style={styles.barBg}>
          <View
            style={[styles.barFill, { width: `${percentage}%` as unknown as number }]}
          />
        </View>
        <Text style={styles.xpText}>
          {experience.toLocaleString()}/{xpForNextLevel.toLocaleString()} XP
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  levelBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    ...shadows.sm,
  },
  levelText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
  barContainer: {
    flex: 1,
  },
  barBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#86efac',
    borderRadius: borderRadius.full,
  },
  xpText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    fontWeight: '500',
  },
});
