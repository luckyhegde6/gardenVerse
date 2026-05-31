import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

interface CompanionHintProps {
  companions: string[]
}

/**
 * Displays companion planting information.
 * Shows "🤝 Grows well with: basil, tomato" when companions are nearby.
 * Returns null when no companions are provided.
 */
export default function CompanionHint({ companions }: CompanionHintProps) {
  if (!companions || companions.length === 0) return null

  return (
    <View style={styles.container}>
      <Text style={styles.label}>🤝 </Text>
      <Text style={styles.text}>
        Grows well with <Text style={styles.companions}>{companions.join(', ')}</Text>
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  label: {
    fontSize: 13,
  },
  text: {
    fontSize: 12,
    color: '#4b5563',
    flex: 1,
    flexWrap: 'wrap',
  },
  companions: {
    fontWeight: '600',
    color: '#2563eb',
  },
})
