import { useRef, useCallback } from 'react';
import { Particle, ParticleType, createParticles, PARTICLE_CONFIG } from '@components/garden/ParticlePresets';

interface ParticleState {
  particles: Particle[];
  nextId: number;
}

export function useParticles() {
  const stateRef = useRef<ParticleState>({
    particles: [],
    nextId: 0,
  });

  const listenersRef = useRef<Set<(particles: Particle[]) => void>>(new Set());

  const notify = useCallback(() => {
    const particles = stateRef.current.particles;
    listenersRef.current.forEach((listener) => listener(particles));
  }, []);

  const subscribe = useCallback((listener: (particles: Particle[]) => void) => {
    listenersRef.current.add(listener);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []) as (listener: (particles: Particle[]) => void) => void;

  const emit = useCallback(
    (type: ParticleType, position: { x: number; y: number }) => {
      const config = PARTICLE_CONFIG[type];
      if (!config) return;

      const newParticles = createParticles(type, position.x, position.y, config.count);
      const now = Date.now();
      stateRef.current.particles = [
        ...stateRef.current.particles,
        ...newParticles.map((p) => ({ ...p, id: stateRef.current.nextId++, _createdAt: now })),
      ];
      notify();
    },
    [notify]
  );

  const update = useCallback((dt: number) => {
    if (dt <= 0 || dt > 0.1) return;
    const now = Date.now();

    stateRef.current.particles = stateRef.current.particles
      .map((p) => {
        const age = (now - (p as any)._createdAt) / 1000;
        if (age >= p.maxLife) return null;

        const t = age / p.maxLife;
        const newP = { ...p };
        newP.x += p.vx * dt;
        newP.y += p.vy * dt;
        newP.vy += p.gravity * dt;
        newP.rotation += p.rotationSpeed * dt;
        newP.life = 1 - t;

        if (p.fadeOut) {
          const alpha = newP.color[3] * (1 - t);
          newP.color = new Float32Array([newP.color[0], newP.color[1], newP.color[2], alpha]);
        }

        return newP;
      })
      .filter((p): p is Particle => p !== null);

    notify();
  }, [notify]);

  const clear = useCallback(() => {
    stateRef.current.particles = [];
    notify();
  }, [notify]);

  return { subscribe, emit, update, clear };
}

export type ParticleSystem = ReturnType<typeof useParticles>;