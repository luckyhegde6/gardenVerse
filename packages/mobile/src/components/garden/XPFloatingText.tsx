import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Text,
  StyleSheet,
} from 'react-native';

interface XPFloatingTextProps {
  xpAmount: number;
  position: { x: number; y: number };
  onComplete: () => void;
}

export function XPFloatingText({ xpAmount, position, onComplete }: XPFloatingTextProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -80,
        duration: 1200,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1.2,
          damping: 10,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(800),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => onComplete());
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: position.x - 30,
          top: position.y - 10,
          transform: [
            { translateY },
            { scale },
          ],
          opacity,
        },
      ]}
      pointerEvents="none"
    >
      <Text style={styles.text}>+{xpAmount} XP</Text>
    </Animated.View>
  );
}

interface XPFloatingManagerProps {
  xpEvents: Array<{ id: string; amount: number; position: { x: number; y: number } }>;
}

export function XPFloatingManager({ xpEvents }: XPFloatingManagerProps) {
  const [active, setActive] = React.useState(xpEvents);

  useEffect(() => {
    setActive(xpEvents);
  }, [xpEvents]);

  const removeEvent = (id: string) => {
    setActive(prev => prev.filter(e => e.id !== id));
  };

  return (
    <>
      {active.map(event => (
        <XPFloatingText
          key={event.id}
          xpAmount={event.amount}
          position={event.position}
          onComplete={() => removeEvent(event.id)}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 1000,
  },
  text: {
    fontSize: 18,
    fontWeight: '800',
    color: '#6366f1',
    textShadowColor: 'rgba(0,0,0,0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
