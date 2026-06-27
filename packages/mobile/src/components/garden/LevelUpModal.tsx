import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal as RNModal,
  Animated,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LevelUpModalProps {
  visible: boolean;
  newLevel: number;
  onClose: () => void;
}

export function LevelUpModal({ visible, newLevel, onClose }: LevelUpModalProps) {
  const scale = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;
  const confetti1 = useRef(new Animated.Value(0)).current;
  const confetti2 = useRef(new Animated.Value(0)).current;
  const confetti3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(fadeIn, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.spring(scale, {
            toValue: 1,
            damping: 8,
            stiffness: 200,
            useNativeDriver: true,
          }),
          Animated.timing(rotate, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(100),
        Animated.parallel([
          Animated.spring(confetti1, {
            toValue: 1,
            damping: 15,
            useNativeDriver: true,
          }),
          Animated.spring(confetti2, {
            toValue: 1,
            damping: 12,
            delay: 100,
            useNativeDriver: true,
          }),
          Animated.spring(confetti3, {
            toValue: 1,
            damping: 10,
            delay: 150,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      scale.setValue(0);
      rotate.setValue(0);
      fadeIn.setValue(0);
      confetti1.setValue(0);
      confetti2.setValue(0);
      confetti3.setValue(0);
    }
  }, [visible]);

  const rotateInterpolation = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-180deg', '0deg'],
  });

  const translateConfetti = (anim: Animated.Value, xOffset: number) => ({
    transform: [
      { translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [0, xOffset] }) },
      { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-SCREEN_WIDTH, 0] }) },
      { scale: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1.5, 1] }) },
    ],
    opacity: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1, 0.8] }),
  });

  const confettiColors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4'];

  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: fadeIn }]} />

        <Animated.View
          style={[
            styles.modal,
            {
              opacity: fadeIn,
              transform: [{ scale }, { rotate: rotateInterpolation }],
            },
          ]}
        >
          <View style={styles.confettiContainer}>
            {confettiColors.map((color, i) => {
              const anim = [confetti1, confetti2, confetti3][i % 3];
              const offset = (i - 2) * 40;
              return (
                <Animated.View
                  key={color}
                  style={[
                    styles.confettiDot,
                    { backgroundColor: color },
                    translateConfetti(anim, offset),
                    { left: SCREEN_WIDTH / 2 - 6 + offset + Math.sin(i * 2) * 20 },
                  ]}
                />
              );
            })}
          </View>

          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>Level Up!</Text>
          <Text style={styles.levelText}>You reached Level {newLevel}</Text>

          <View style={styles.rewards}>
            <Text style={styles.rewardTitle}>Rewards Unlocked:</Text>
            <Text style={styles.rewardItem}>• {100 + newLevel * 10} Green Credits</Text>
            <Text style={styles.rewardItem}>• New garden features</Text>
            <Text style={styles.rewardItem}>• Higher tier shop items</Text>
          </View>

          <TouchableOpacity style={styles.button} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.buttonText}>Awesome! 🚀</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 360,
    zIndex: 10,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  confettiDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    top: '50%',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#6366f1',
    marginBottom: 4,
  },
  levelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 20,
  },
  rewards: {
    backgroundColor: '#f0f0ff',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 20,
  },
  rewardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4f46e5',
    marginBottom: 8,
  },
  rewardItem: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 16,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
