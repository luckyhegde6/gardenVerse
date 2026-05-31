import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface StreakBadgeProps {
  streak: number
}

/**
 * Displays a care streak badge on crop tiles.
 * Color-coded: gray (<3), orange (3-6), fiery orange (7+).
 * Returns null when streak is 0 or negative.
 */
export default function StreakBadge({ streak }: StreakBadgeProps) {
  if (streak <= 0) return null

  const color = streak >= 7 ? '#FF6B35' : streak >= 3 ? '#FFB347' : '#AAAAAA'

  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.text}>
        🔥 {streak}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})
