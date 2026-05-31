import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface CollectionBadgeProps {
  discovered: number
  total: number
}

/**
 * Shows the species discovery progress as a compact badge.
 * e.g. "🌱 5/31" indicating 5 out of 31 species discovered.
 */
export default function CollectionBadge({ discovered, total }: CollectionBadgeProps) {
  const ratio = total > 0 ? discovered / total : 0
  const progressPct = Math.min(100, Math.round(ratio * 100))

  return (
    <View style={styles.badge}>
      <Text style={styles.text}>🌱 {discovered}/{total}</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
  },
  progressTrack: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(22, 163, 74, 0.2)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#16a34a',
  },
})
