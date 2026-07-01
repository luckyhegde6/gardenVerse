import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Canvas, Circle, Rect, Group, Skia } from '@shopify/react-native-skia';
import { StyleSheet } from 'react-native';
import { Particle, ParticleType, createWaterParticle, createFertilizeParticle, createHarvestParticle, createPlantParticle, createConfettiParticle, createGrowthTickParticle } from '@components/garden/ParticlePresets';

const styles = StyleSheet.create({
  absolute: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

interface ParticleState {
  particles: Particle[];
  addParticle: (particle: Particle) => void;
  updateParticles: (dt: number) => void;
}

function createParticleState(): ParticleState {
  const particles: Particle[] = [];
  let nextId = 0;

  return {
    particles,
    addParticle: (p: Particle) => {
      particles.push({ ...p, id: nextId++ });
    },
    updateParticles: (dt: number) => {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += p.gravity * dt;
        p.life -= dt / p.maxLife;
        p.rotation += p.rotationSpeed * dt;
        if (p.life <= 0) {
          particles.splice(i, 1);
        }
      }
    },
  };
}

const particleState = createParticleState();

export function useParticles() {
  const [, forceUpdate] = useState(0);
  const subscribers = useMemo(() => new Set<(particles: Particle[]) => void>(), []);

  const subscribe = React.useCallback((callback: (particles: Particle[]) => void) => {
    subscribers.add(callback);
    callback(particleState.particles);
    return () => subscribers.delete(callback);
  }, []);

  const emit = React.useCallback((type: ParticleType, position: { x: number; y: number }): void => {
    let particle: Particle;
    switch (type) {
      case 'water':
        particle = createWaterParticle(position.x, position.y);
        break;
      case 'fertilize':
        particle = createFertilizeParticle(position.x, position.y);
        break;
      case 'harvest':
        particle = createHarvestParticle(position.x, position.y);
        break;
      case 'plant':
        particle = createPlantParticle(position.x, position.y);
        break;
      case 'confetti':
        particle = createConfettiParticle(position.x, position.y);
        break;
      case 'growthTick':
        particle = createGrowthTickParticle(position.x, position.y);
        break;
      default:
        return;
    }
    particleState.addParticle(particle);
    forceUpdate((n) => n + 1);
    subscribers.forEach((cb) => cb(particleState.particles));
  }, []);

  const update = React.useCallback((dt: number) => {
    if (dt <= 0 || dt > 0.1) return;
    particleState.updateParticles(dt);
    forceUpdate((n) => n + 1);
    subscribers.forEach((cb) => cb(particleState.particles));
  }, []);

  return { subscribe, emit, update };
}

function ParticleRenderer({ particles }: { particles: Particle[] }) {
  return (
    <Canvas style={styles.absolute}>
      {particles.map((p) => (
        <Group
          key={p.id}
          transform={[
            { translateX: p.x },
            { translateY: p.y },
            { rotate: p.rotation },
          ]}
        >
          {p.type === 'confetti' ? (
            <Rect
              x={-p.size / 2}
              y={-p.size / 2}
              width={p.size}
              height={p.size * 0.6}
              color={Skia.Color(p.color)}
            />
          ) : (
            <Circle
              cx={0}
              cy={0}
              r={p.size * Math.max(0.3, p.life)}
              color={Skia.Color(p.color)}
            />
          )}
        </Group>
      ))}
    </Canvas>
  );
}

interface ParticleContextValue {
  particles: Particle[];
  emit: (type: ParticleType, position: { x: number; y: number }) => void;
  subscribe: (callback: (particles: Particle[]) => void) => () => void;
  update: (dt: number) => void;
}

const ParticleContext = createContext<ParticleContextValue | null>(null);

export function ParticleProvider({ children }: { children: ReactNode }) {
  const { subscribe, emit, update } = useParticles();
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const unsub = subscribe(setParticles);
    return () => { unsub(); };
  }, [subscribe]);

  useEffect(() => {
    let lastTime = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      if (dt > 0 && dt < 0.1) {
        update(dt);
      }
    }, 16);
    return () => clearInterval(interval);
  }, [update]);

  const value = useMemo(() => ({ particles, emit, subscribe, update }), [particles, emit, subscribe, update]);

  return (
    <ParticleContext.Provider value={value}>
      {children}
      <ParticleRenderer particles={particles} />
    </ParticleContext.Provider>
  );
}

export function useParticleSystem(): { subscribe: (callback: (particles: Particle[]) => void) => () => void; emit: (type: ParticleType, position: { x: number; y: number }) => void; update: (dt: number) => void } {
  const context = useContext(ParticleContext);
  if (!context) {
    throw new Error('useParticleSystem must be used within ParticleProvider');
  }
  return context;
}