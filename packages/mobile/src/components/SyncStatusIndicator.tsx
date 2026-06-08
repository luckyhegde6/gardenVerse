import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { gameSaveSync } from '../services/gameSaveSync';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

type SyncStatus = 'synced' | 'syncing' | 'offline' | 'pending';

interface SyncStatusIndicatorProps {
  compact?: boolean;
}

const STATUS_CONFIG: Record<
  SyncStatus,
  { color: string; label: string; pulse: boolean }
> = {
  synced: { color: '#22c55e', label: 'Synced', pulse: false },
  syncing: { color: '#f59e0b', label: 'Syncing...', pulse: true },
  offline: { color: '#ef4444', label: 'Offline', pulse: false },
  pending: { color: '#9ca3af', label: 'Pending', pulse: true },
};

export function SyncStatusIndicator({ compact = false }: SyncStatusIndicatorProps) {
  const { isOnline } = useNetworkStatus();
  const [status, setStatus] = useState<SyncStatus>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [pendingSync, setPendingSync] = useState(false);

  const pulseAnim = useSharedValue(1);
  const tooltipOpacity = useSharedValue(0);

  useEffect(() => {
    // Determine initial status
    const checkStatus = async () => {
      const isSyncing = gameSaveSync.getSyncing();
      const hasPending = await gameSaveSync.hasPendingSync();
      const lastSync = await gameSaveSync.getLastSyncTime();
      setLastSyncTime(lastSync);
      setPendingSync(hasPending);

      if (!isOnline) {
        setStatus('offline');
      } else if (isSyncing) {
        setStatus('syncing');
      } else if (hasPending) {
        setStatus('pending');
      } else {
        setStatus('synced');
      }
    };

    checkStatus();

    // Poll for status changes
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [isOnline]);

  // Pulse animation for syncing/pending states
  useEffect(() => {
    const config = STATUS_CONFIG[status];
    if (config.pulse) {
      pulseAnim.value = withRepeat(
        withSequence(
          withTiming(0.5, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        false
      );
    } else {
      pulseAnim.value = withTiming(1, { duration: 200 });
    }
  }, [status]);

  // Tooltip animation
  useEffect(() => {
    tooltipOpacity.value = withTiming(showTooltip ? 1 : 0, { duration: 200 });
    if (showTooltip) {
      const timer = setTimeout(() => setShowTooltip(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showTooltip]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: pulseAnim.value,
  }));

  const tooltipStyle = useAnimatedStyle(() => ({
    opacity: tooltipOpacity.value,
    transform: [{ scale: tooltipOpacity.value }],
  }));

  const config = STATUS_CONFIG[status];

  const handlePress = () => {
    setShowTooltip(!showTooltip);
  };

  const formatTime = (iso: string | null): string => {
    if (!iso) return 'Never';
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHrs = Math.floor(diffMins / 60);
      if (diffHrs < 24) return `${diffHrs}h ago`;
      const diffDays = Math.floor(diffHrs / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Unknown';
    }
  };

  return (
    <View style={styles.container}>
      {/* Tooltip */}
      {showTooltip && (
        <Animated.View style={[styles.tooltip, tooltipStyle]}>
          <Text style={styles.tooltipText}>
            Last sync: {formatTime(lastSyncTime)}
          </Text>
          {pendingSync && (
            <Text style={styles.tooltipWarning}>Pending changes</Text>
          )}
        </Animated.View>
      )}

      {/* Indicator */}
      <TouchableOpacity
        onPress={handlePress}
        style={styles.indicator}
        activeOpacity={0.7}
      >
        <View style={styles.dotContainer}>
          <Animated.View
            style={[
              styles.dot,
              { backgroundColor: config.color },
              dotStyle,
            ]}
          />
        </View>
        {!compact && (
          <Text style={[styles.label, { color: config.color }]}>
            {config.label}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'flex-end',
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  dotContainer: {
    width: 8,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 5,
  },
  tooltip: {
    position: 'absolute',
    top: -44,
    right: 0,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    zIndex: 99,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  tooltipText: {
    color: '#f1f5f9',
    fontSize: 11,
    fontWeight: '500',
  },
  tooltipWarning: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
});

export default SyncStatusIndicator;
