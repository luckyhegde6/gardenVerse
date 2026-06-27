import { Skia } from '@shopify/react-native-skia';

export type ParticleType =
  | 'water'
  | 'fertilize'
  | 'harvest'
  | 'plant'
  | 'confetti'
  | 'growthTick';

export interface Particle {
  id: number;
  type: ParticleType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: Float32Array;
  life: number;
  maxLife: number;
  rotation: number;
  rotationSpeed: number;
  gravity: number;
  fadeOut: boolean;
}

const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export function createWaterParticle(x: number, y: number): Particle {
  const angle = randomRange(-Math.PI / 3, -2 * Math.PI / 3);
  const speed = randomRange(80, 150);
  return {
    id: Date.now() + Math.random(),
    type: 'water',
    x,
    y,
    vx: Math.cos(angle) * speed * 0.3,
    vy: Math.sin(angle) * speed,
    size: randomRange(4, 8),
    color: Skia.Color('#3b82f6'),
    life: 1.0,
    maxLife: randomRange(0.8, 1.5),
    rotation: 0,
    rotationSpeed: 0,
    gravity: 400,
    fadeOut: true,
  };
}

export function createFertilizeParticle(x: number, y: number): Particle {
  const angle = randomRange(0, Math.PI * 2);
  const speed = randomRange(60, 120);
  const isGold = Math.random() < 0.3;
  return {
    id: Date.now() + Math.random(),
    type: 'fertilize',
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size: randomRange(3, 6),
    color: Skia.Color(isGold ? '#fbbf24' : '#22c55e'),
    life: 1.0,
    maxLife: randomRange(0.6, 1.0),
    rotation: randomRange(0, Math.PI * 2),
    rotationSpeed: randomRange(-Math.PI, Math.PI),
    gravity: -50,
    fadeOut: true,
  };
}

export function createHarvestParticle(x: number, y: number): Particle {
  const angle = randomRange(-Math.PI / 4, -3 * Math.PI / 4);
  const speed = randomRange(100, 200);
  const isCoin = Math.random() < 0.4;
  return {
    id: Date.now() + Math.random(),
    type: 'harvest',
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size: randomRange(isCoin ? 6 : 4, isCoin ? 10 : 7),
    color: Skia.Color(isCoin ? '#fbbf24' : '#fef3c7'),
    life: 1.0,
    maxLife: randomRange(1.0, 1.8),
    rotation: randomRange(0, Math.PI * 2),
    rotationSpeed: randomRange(-2 * Math.PI, 2 * Math.PI),
    gravity: isCoin ? 300 : 200,
    fadeOut: true,
  };
}

export function createPlantParticle(x: number, y: number): Particle {
  const angle = randomRange(-Math.PI / 6, -5 * Math.PI / 6);
  const speed = randomRange(40, 80);
  return {
    id: Date.now() + Math.random(),
    type: 'plant',
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size: randomRange(5, 10),
    color: Skia.Color('#8b5e3c'),
    life: 1.0,
    maxLife: randomRange(0.5, 0.9),
    rotation: 0,
    rotationSpeed: 0,
    gravity: 200,
    fadeOut: true,
  };
}

export function createConfettiParticle(x: number, y: number): Particle {
  const colors = ['#ef4444', '#3b82f6', '#22c55e', '#fbbf24', '#a855f7', '#ec4899', '#06b6d4'];
  const angle = randomRange(-Math.PI / 3, -2 * Math.PI / 3);
  const speed = randomRange(150, 300);
  const size = randomRange(6, 12);
  return {
    id: Date.now() + Math.random(),
    type: 'confetti',
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size,
    color: Skia.Color(colors[randomInt(0, colors.length - 1)]),
    life: 1.0,
    maxLife: randomRange(2.0, 3.5),
    rotation: randomRange(0, Math.PI * 2),
    rotationSpeed: randomRange(-4 * Math.PI, 4 * Math.PI),
    gravity: 500,
    fadeOut: true,
  };
}

export function createGrowthTickParticle(x: number, y: number): Particle {
  return {
    id: Date.now() + Math.random(),
    type: 'growthTick',
    x,
    y,
    vx: 0,
    vy: -10,
    size: randomRange(8, 14),
    color: Skia.Color('#4ade80'),
    life: 1.0,
    maxLife: 0.4,
    rotation: 0,
    rotationSpeed: 0,
    gravity: 0,
    fadeOut: true,
  };
}

export function createParticles(
  type: ParticleType,
  x: number,
  y: number,
  count: number
): Particle[] {
  const creators: Record<ParticleType, (x: number, y: number) => Particle> = {
    water: createWaterParticle,
    fertilize: createFertilizeParticle,
    harvest: createHarvestParticle,
    plant: createPlantParticle,
    confetti: createConfettiParticle,
    growthTick: createGrowthTickParticle,
  };
  const creator = creators[type];
  return Array.from({ length: count }, () => creator(x, y));
}

export const PARTICLE_CONFIG: Record<ParticleType, { count: number; emitDelay?: number }> = {
  water: { count: 8 },
  fertilize: { count: 12 },
  harvest: { count: 20 },
  plant: { count: 6 },
  confetti: { count: 30 },
  growthTick: { count: 1 },
};