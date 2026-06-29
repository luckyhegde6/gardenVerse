import React, { useEffect, useRef, useMemo, useCallback } from 'react'
import { View, StyleSheet, PanResponder, LayoutChangeEvent, Platform, Text } from 'react-native'
import { GLView } from 'expo-gl'
import * as THREE from 'three'
import { useGarden } from '@hooks/useGarden'
import { Crop } from "@/types"

const GRID_SIZE = 6
const TILE_SPACING = 1.8
const OFFSET = (GRID_SIZE - 1) * TILE_SPACING / 2
const BASE_CAM_RADIUS = 8
const BASE_WIDTH = 400

type PlantCategory = 'vegetable' | 'herb' | 'tree' | 'flower' | 'berry' | 'grain' | 'tropical' | 'default'

const PLANT_DATA: Record<string, { category: PlantCategory; primaryColor: number; secondaryColor: number; height: number }> = {
  Tomato: { category: 'vegetable', primaryColor: 0xff0000, secondaryColor: 0xcc0000, height: 0.5 },
  Basil: { category: 'herb', primaryColor: 0x008000, secondaryColor: 0x00a000, height: 0.25 },
  Lettuce: { category: 'vegetable', primaryColor: 0x90ee90, secondaryColor: 0x7ccc7c, height: 0.15 },
  Carrot: { category: 'vegetable', primaryColor: 0xffa500, secondaryColor: 0xff8c00, height: 0.2 },
  Strawberry: { category: 'berry', primaryColor: 0xff69b4, secondaryColor: 0xff1493, height: 0.15 },
  Mint: { category: 'herb', primaryColor: 0x98fb98, secondaryColor: 0x66cc66, height: 0.2 },
  Sunflower: { category: 'flower', primaryColor: 0xffff00, secondaryColor: 0xffdd00, height: 1.0 },
  BellPepper: { category: 'vegetable', primaryColor: 0xff4500, secondaryColor: 0xff6347, height: 0.4 },
  Cucumber: { category: 'vegetable', primaryColor: 0x00ff00, secondaryColor: 0x00cc00, height: 0.3 },
  Lavender: { category: 'flower', primaryColor: 0xee82ee, secondaryColor: 0xba55d3, height: 0.6 },
  Corn: { category: 'grain', primaryColor: 0xffd700, secondaryColor: 0xdaa520, height: 1.2 },
  Wheat: { category: 'grain', primaryColor: 0xf5deb3, secondaryColor: 0xdeb887, height: 0.8 },
  Pumpkin: { category: 'vegetable', primaryColor: 0xff8c00, secondaryColor: 0xff6600, height: 0.3 },
  Watermelon: { category: 'berry', primaryColor: 0x2e8b57, secondaryColor: 0x006400, height: 0.25 },
  Rose: { category: 'flower', primaryColor: 0xff0066, secondaryColor: 0xcc0055, height: 0.5 },
  Marigold: { category: 'flower', primaryColor: 0xffa500, secondaryColor: 0xff8c00, height: 0.35 },
  Coriander: { category: 'herb', primaryColor: 0x228b22, secondaryColor: 0x006400, height: 0.2 },
  Broccoli: { category: 'vegetable', primaryColor: 0x2e8b57, secondaryColor: 0x228b22, height: 0.4 },
  Kale: { category: 'vegetable', primaryColor: 0x1b5e20, secondaryColor: 0x2e7d32, height: 0.3 },
  Onion: { category: 'vegetable', primaryColor: 0xd4a574, secondaryColor: 0xc4956a, height: 0.35 },
  Garlic: { category: 'vegetable', primaryColor: 0xf5f5dc, secondaryColor: 0xeee8aa, height: 0.3 },
  Chilli: { category: 'tropical', primaryColor: 0xdc2626, secondaryColor: 0xb91c1c, height: 0.35 },
  Turmeric: { category: 'tropical', primaryColor: 0xd97706, secondaryColor: 0xb45309, height: 0.5 },
  Rice: { category: 'grain', primaryColor: 0xfef3c7, secondaryColor: 0xfde68a, height: 0.7 },
  Okra: { category: 'tropical', primaryColor: 0x22c55e, secondaryColor: 0x16a34a, height: 0.6 },
  Brinjal: { category: 'tropical', primaryColor: 0x7c3aed, secondaryColor: 0x6d28d9, height: 0.4 },
}

function getPlantData(name: string) {
  const key = Object.keys(PLANT_DATA).find(k => name.toLowerCase().includes(k.toLowerCase()))
  return PLANT_DATA[key || 'default'] || { category: 'default' as PlantCategory, primaryColor: 0x8b4513, secondaryColor: 0x6b3410, height: 0.3 }
}

function buildVegetable(group: THREE.Group, data: typeof PLANT_DATA[string], gs: number, health: number, hue: number) {
  const s = 0.2 + gs * 0.008
  const h = data.height * s
  const stemMat = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.3 - hue / 360, 0.5, 0.25) })
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, h * 0.4, 6), stemMat)
  stem.position.y = h * 0.2; group.add(stem)

  const leafMat = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.28 - hue / 360, 0.6, 0.35) })
  const leaf = new THREE.Mesh(new THREE.SphereGeometry(h * 0.35, 6, 6), leafMat)
  leaf.position.y = h * 0.5; leaf.scale.set(1, 0.4, 1); group.add(leaf)

  if (gs > 60) {
    const fruitMat = new THREE.MeshStandardMaterial({ color: data.primaryColor, emissive: data.primaryColor, emissiveIntensity: 0.05 + (health / 100) * 0.1 })
    const fruit = new THREE.Mesh(new THREE.SphereGeometry(h * 0.2, 8, 8), fruitMat)
    fruit.position.set(0.08, h * 0.55, 0.08); fruit.scale.set(1, 0.85, 1); group.add(fruit)
  }
}

function buildHerb(group: THREE.Group, data: typeof PLANT_DATA[string], gs: number, health: number, hue: number) {
  const s = 0.2 + gs * 0.008; const h = data.height * s
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, h * 0.6, 4),
      new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.3 - hue / 360, 0.5, 0.3) }))
    stem.position.set(Math.cos(a) * h * 0.12, h * 0.3, Math.sin(a) * h * 0.12)
    stem.rotation.z = Math.cos(a) * 0.2; stem.rotation.x = Math.sin(a) * 0.2; group.add(stem)
  }
  const c = new THREE.Mesh(new THREE.SphereGeometry(h * 0.25, 6, 6),
    new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.25 - hue / 360, 0.5, 0.4 + (health / 100) * 0.2) }))
  c.position.y = h * 0.55; c.scale.set(1, 0.5, 1); group.add(c)
}

function buildTree(group: THREE.Group, data: typeof PLANT_DATA[string], gs: number, _health: number) {
  const s = 0.2 + gs * 0.008; const h = 1.5 * s
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, h * 0.5, 6),
    new THREE.MeshStandardMaterial({ color: 0x8b4513 }))
  trunk.position.y = h * 0.25; group.add(trunk)
  for (let t = 0; t < 3; t++) {
    const c = new THREE.Mesh(new THREE.SphereGeometry(h * (0.3 - t * 0.06), 7, 7),
      new THREE.MeshStandardMaterial({ color: data.primaryColor, emissive: data.primaryColor, emissiveIntensity: 0.03 }))
    c.position.y = h * 0.55 + t * h * 0.18; c.scale.set(1, 0.7 + t * 0.1, 1); group.add(c)
  }
}

function buildFlower(group: THREE.Group, data: typeof PLANT_DATA[string], gs: number, health: number, hue: number) {
  const s = 0.2 + gs * 0.008; const h = data.height * s
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.035, h, 6),
    new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.3 - hue / 360, 0.5, 0.25) }))
  stem.position.y = h * 0.5; group.add(stem)
  if (gs > 30) {
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      const p = new THREE.Mesh(new THREE.SphereGeometry(h * 0.08, 6, 6),
        new THREE.MeshStandardMaterial({ color: data.primaryColor, emissive: data.primaryColor, emissiveIntensity: 0.05 }))
      p.position.set(Math.cos(a) * h * 0.12, h + 0.02, Math.sin(a) * h * 0.12); p.scale.set(1, 0.3, 1); group.add(p)
    }
    const center = new THREE.Mesh(new THREE.SphereGeometry(h * 0.06, 6, 6),
      new THREE.MeshStandardMaterial({ color: 0xffd700 }))
    center.position.y = h + 0.02; group.add(center)
  }
}

function buildBerry(group: THREE.Group, data: typeof PLANT_DATA[string], gs: number, health: number, hue: number) {
  const s = 0.2 + gs * 0.008; const h = data.height * s
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.5
    const str = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, h * 0.4, 4),
      new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.3 - hue / 360, 0.5, 0.25) }))
    str.position.set(Math.cos(a) * h * 0.1, h * 0.2, Math.sin(a) * h * 0.1)
    str.rotation.z = Math.cos(a) * 0.3; str.rotation.x = Math.sin(a) * 0.3; group.add(str)
  }
  if (gs > 50) {
    for (let i = 0; i < 3; i++) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(h * 0.06, 6, 6),
        new THREE.MeshStandardMaterial({ color: data.primaryColor, emissive: data.primaryColor, emissiveIntensity: 0.05 + (health / 100) * 0.1 }))
      b.position.set((i - 1) * h * 0.08, h * 0.42, 0); group.add(b)
    }
  }
  const l = new THREE.Mesh(new THREE.SphereGeometry(h * 0.15, 5, 5),
    new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.3 - hue / 360, 0.5, 0.3) }))
  l.position.y = h * 0.2; l.scale.set(1.2, 0.2, 0.8); group.add(l)
}

function buildGrain(group: THREE.Group, data: typeof PLANT_DATA[string], gs: number, _health: number) {
  const s = 0.2 + gs * 0.008; const h = data.height * s
  for (let i = 0; i < 3; i++) {
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.025, h * 0.85, 4),
      new THREE.MeshStandardMaterial({ color: 0xc4a35a }))
    st.position.set((i - 1) * h * 0.1, h * 0.425, (i % 2 === 0 ? 0.05 : -0.05)); group.add(st)
  }
  if (gs > 60) {
    for (let i = 0; i < 3; i++) {
      const hd = new THREE.Mesh(new THREE.SphereGeometry(h * 0.05, 5, 5),
        new THREE.MeshStandardMaterial({ color: data.primaryColor }))
      hd.position.set((i - 1) * h * 0.1, h * 0.85, (i % 2 === 0 ? 0.05 : -0.05))
      hd.scale.set(0.8, 0.4, 0.8); group.add(hd)
    }
  }
  const lc = new THREE.Mesh(new THREE.SphereGeometry(h * 0.08, 5, 5),
    new THREE.MeshStandardMaterial({ color: 0x556b2f }))
  lc.position.y = h * 0.2; lc.scale.set(1.5, 0.3, 0.8); group.add(lc)
}

function buildTropical(group: THREE.Group, data: typeof PLANT_DATA[string], gs: number, health: number, hue: number) {
  const s = 0.2 + gs * 0.008; const h = data.height * s
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, h * 0.6, 6),
    new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.3 - hue / 360, 0.5, 0.2) }))
  stem.position.y = h * 0.3; group.add(stem)

  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.3
    const lf = new THREE.Mesh(new THREE.SphereGeometry(h * 0.15, 5, 5),
      new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.32 - hue / 360, 0.6, 0.3 + (health / 100) * 0.2) }))
    lf.position.set(Math.cos(a) * h * 0.2, h * 0.4, Math.sin(a) * h * 0.2)
    lf.scale.set(0.6, 0.15, 1.2); group.add(lf)
  }

  if (gs > 50) {
    const fr = new THREE.Mesh(new THREE.SphereGeometry(h * 0.08, 6, 6),
      new THREE.MeshStandardMaterial({ color: data.primaryColor, emissive: data.primaryColor, emissiveIntensity: 0.05 }))
    fr.position.y = h * 0.55; group.add(fr)
  }
}

function buildCropMesh(group: THREE.Group, crop: any) {
  const pd = getPlantData(crop.name)
  const health = crop.health ?? 100
  const gs = crop.growthStage ?? 0
  const hue = (1 - health / 100) * 30
  switch (pd.category) {
    case 'herb': buildHerb(group, pd, gs, health, hue); break
    case 'tree': buildTree(group, pd, gs, health); break
    case 'flower': buildFlower(group, pd, gs, health, hue); break
    case 'berry': buildBerry(group, pd, gs, health, hue); break
    case 'grain': buildGrain(group, pd, gs, health); break
    case 'tropical': buildTropical(group, pd, gs, health, hue); break
    default: buildVegetable(group, pd, gs, health, hue)
  }
}

interface Garden3DProps {
  selectedCropId?: string | null;
  onTilePress?: (col: number, row: number, crop?: any) => void;
  onPlantPress?: (col: number, row: number) => void;
}

export function Garden3D({ selectedCropId, onTilePress, onPlantPress }: Garden3DProps = {}) {
  const { crops, selectedGarden } = useGarden()
  const animationRef = useRef(0)
  const [layoutSize, setLayoutSize] = React.useState({ width: 0, height: 0 })
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const angleRef = useRef(0)
  const camHeightRef = useRef(3)
  const cropGroupsRef = useRef<{ group: THREE.Group; cropId: string; growthStage: number }[]>([])
  const lastCropCountRef = useRef(0)
  const isDraggingRef = useRef(false)
  const lastTouchRef = useRef({ x: 0, y: 0 })
  const waterTilesRef = useRef<THREE.Mesh[]>([])
  const gardenBorderRef = useRef<THREE.Group | null>(null)
  const selectionRingRef = useRef<THREE.Mesh | null>(null)
  const emptyTileHighlightsRef = useRef<THREE.Group | null>(null)
  const tileMeshesRef = useRef<{ mesh: THREE.Mesh; col: number; row: number; hasCrop: boolean }[]>([])
  const isTapRef = useRef(false)
  const camRadiusRef = useRef(BASE_CAM_RADIUS)

  useEffect(() => {
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current) }
  }, [])

  const CAM_RADIUS = useMemo(() => {
    const w = layoutSize.width || BASE_WIDTH
    return Math.max(5, (w / BASE_WIDTH) * BASE_CAM_RADIUS)
  }, [layoutSize.width])

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout
    if (width > 0) {
      const h = Math.round(Math.max(width * 0.88, 280))
      setLayoutSize({ width, height: h })
    }
  }, [])

  useEffect(() => {
    camRadiusRef.current = CAM_RADIUS
  }, [CAM_RADIUS])

  useEffect(() => {
    return () => {
      if (sceneRef.current) {
        sceneRef.current.traverse(obj => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose()
            if ((obj.material as THREE.Material).dispose) (obj.material as THREE.Material).dispose()
          }
        })
      }
      if (rendererRef.current) rendererRef.current.dispose()
    }
  }, [])

  const buildTerrain = (scene: THREE.Scene) => {
    const groundGeo = new THREE.PlaneGeometry(16, 16, 20, 20)
    const positions = groundGeo.attributes.position.array as Float32Array
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]; const z = positions[i + 1]
      const dist = Math.sqrt(x * x + z * z)
      if (dist > 5) positions[i + 2] = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 0.08
    }
    groundGeo.computeVertexNormals()
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x6b8e23, roughness: 0.9, metalness: 0,
      flatShading: false,
    })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.05
    ground.receiveShadow = true
    scene.add(ground)

    // Grass tufts
    for (let i = 0; i < 40; i++) {
      const t = new THREE.Mesh(new THREE.CircleGeometry(0.02 + Math.random() * 0.04, 3),
        new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.28 + Math.random() * 0.05, 0.5, 0.2 + Math.random() * 0.15) }))
      const rx = (Math.random() - 0.5) * 14; const rz = (Math.random() - 0.5) * 14
      if (Math.abs(rx) < OFFSET + 1 && Math.abs(rz) < OFFSET + 1) continue
      t.position.set(rx, 0.01, rz); t.rotation.x = -Math.PI / 2; scene.add(t)
    }
  }

  const buildGardenTile = (col: number, row: number, soilQuality: number, scene: THREE.Scene) => {
    const x = col * TILE_SPACING - OFFSET; const z = row * TILE_SPACING - OFFSET
    const sq = Math.max(0, Math.min(100, soilQuality)) / 100
    const tileR = 0.45 + sq * 0.15; const tileG = 0.25 + sq * 0.1; const tileB = 0.1 - sq * 0.05
    const tileMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(tileR, tileG, tileB), roughness: 0.95, metalness: 0,
    })
    const tile = new THREE.Mesh(new THREE.PlaneGeometry(TILE_SPACING * 0.85, TILE_SPACING * 0.85), tileMat)
    tile.rotation.x = -Math.PI / 2; tile.position.set(x, 0.01, z)
    tile.receiveShadow = true; scene.add(tile)

    // Border
    const borderMat = new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.8 })
    const bx = TILE_SPACING * 0.43; const bz = TILE_SPACING * 0.43
    const b = new THREE.Mesh(new THREE.BoxGeometry(TILE_SPACING * 0.88, 0.04, 0.04), borderMat)
    b.position.set(x, 0.02, z - bz); scene.add(b)
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(TILE_SPACING * 0.88, 0.04, 0.04), borderMat)
    b2.position.set(x, 0.02, z + bz); scene.add(b2)
    const b3 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, TILE_SPACING * 0.88), borderMat)
    b3.position.set(x - bx, 0.02, z); scene.add(b3)
    const b4 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, TILE_SPACING * 0.88), borderMat)
    b4.position.set(x + bx, 0.02, z); scene.add(b4)

    // Track tile for raycasting
    tileMeshesRef.current.push({ mesh: tile, col, row, hasCrop: false })
  }

  const buildWaterTile = (col: number, row: number, hydration: number, scene: THREE.Scene) => {
    const x = col * TILE_SPACING - OFFSET; const z = row * TILE_SPACING - OFFSET
    const wMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6, transparent: true, opacity: 0.08 + (hydration / 100) * 0.12,
      roughness: 0.1, metalness: 0.3,
    })
    const w = new THREE.Mesh(new THREE.PlaneGeometry(TILE_SPACING * 0.75, TILE_SPACING * 0.75), wMat)
    w.rotation.x = -Math.PI / 2; w.position.set(x, 0.03, z)
    w.userData = { col, row, baseOpacity: 0.08 + (hydration / 100) * 0.12 }
    scene.add(w); waterTilesRef.current.push(w)
  }

  const buildFence = (scene: THREE.Scene) => {
    const fenceGroup = new THREE.Group()
    const postMat = new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.8 })
    const railMat = new THREE.MeshStandardMaterial({ color: 0xa0825a, roughness: 0.7 })

    const half = OFFSET + 0.5
    const postCount = 8

    // Posts along perimeter
    for (let i = 0; i < postCount; i++) {
      const a = (i / postCount) * Math.PI * 2 + Math.PI / 4
      const r = half + 0.4
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.3, 4), postMat)
      post.position.set(Math.cos(a) * r, 0.15, Math.sin(a) * r)
      fenceGroup.add(post)
    }

    // Horizontal rails along each side
    const sides = [
      { x: 0, z: -half, dx: 1, dz: 0 },
      { x: 0, z: half, dx: 1, dz: 0 },
      { x: -half, z: 0, dx: 0, dz: 1 },
      { x: half, z: 0, dx: 0, dz: 1 },
    ]
    for (const s of sides) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(s.dx ? half * 2 + 0.8 : 0.03, 0.03, s.dz ? half * 2 + 0.8 : 0.03), railMat)
      rail.position.set(s.x, 0.1, s.z)
      fenceGroup.add(rail)
      const rail2 = new THREE.Mesh(new THREE.BoxGeometry(s.dx ? half * 2 + 0.8 : 0.03, 0.03, s.dz ? half * 2 + 0.8 : 0.03), railMat)
      rail2.position.set(s.x, 0.22, s.z)
      fenceGroup.add(rail2)
    }

    scene.add(fenceGroup)
    gardenBorderRef.current = fenceGroup
  }

  const selectionRingMat = useMemo(() => new THREE.MeshBasicMaterial({
    color: 0x22c55e, wireframe: true, transparent: true, opacity: 0.6,
  }), [])

  const updateSelectionRing = useCallback((scene: THREE.Scene) => {
    if (selectionRingRef.current) {
      scene.remove(selectionRingRef.current)
      selectionRingRef.current.geometry.dispose()
      selectionRingRef.current = null
    }
    if (!selectedCropId) return
    const crop = crops.find((c: Crop) => c.id === selectedCropId)
    if (!crop || crop.plotX === undefined || crop.plotY === undefined) return

    const ring = new THREE.Mesh(new THREE.RingGeometry(0.6, 0.75, 24), selectionRingMat)
    ring.rotation.x = -Math.PI / 2
    ring.position.set(crop.plotX * TILE_SPACING - OFFSET, 0.05, crop.plotY * TILE_SPACING - OFFSET)
    scene.add(ring)
    selectionRingRef.current = ring
  }, [selectedCropId, crops, selectionRingMat])

  const updateEmptyHighlights = useCallback((scene: THREE.Scene) => {
    if (emptyTileHighlightsRef.current) {
      scene.remove(emptyTileHighlightsRef.current)
      emptyTileHighlightsRef.current.traverse(child => {
        if (child instanceof THREE.Mesh) { child.geometry.dispose(); (child.material as THREE.Material).dispose() }
      })
      emptyTileHighlightsRef.current = null
    }
    if (!onPlantPress) return

    const group = new THREE.Group()
    const highlightMat = new THREE.MeshBasicMaterial({
      color: 0xfbbf24, transparent: true, opacity: 0.2, side: THREE.DoubleSide,
    })
    const crossMat = new THREE.MeshBasicMaterial({
      color: 0xa0825a, transparent: true, opacity: 0.4,
    })
    for (let col = 0; col < GRID_SIZE; col++) {
      for (let row = 0; row < GRID_SIZE; row++) {
        const occupied = crops.some((c: Crop) => c.plotX === col && c.plotY === row)
        if (occupied) continue
        const x = col * TILE_SPACING - OFFSET
        const z = row * TILE_SPACING - OFFSET
        const hTile = new THREE.Mesh(new THREE.PlaneGeometry(TILE_SPACING * 0.8, TILE_SPACING * 0.8), highlightMat)
        hTile.rotation.x = -Math.PI / 2
        hTile.position.set(x, 0.04, z)
        group.add(hTile)

        // Cross (plus) indicator
        const barH = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.01, 0.03), crossMat)
        barH.position.set(x, 0.05, z)
        group.add(barH)
        const barV = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.01, 0.15), crossMat)
        barV.position.set(x, 0.05, z)
        group.add(barV)
      }
    }
    scene.add(group)
    emptyTileHighlightsRef.current = group
  }, [crops, onPlantPress])

  const updateCrops = (scene: THREE.Scene) => {
    cropGroupsRef.current.forEach(({ group }) => {
      scene.remove(group)
      group.traverse(child => {
        if (child instanceof THREE.Mesh) { child.geometry.dispose(); if ((child.material as THREE.Material).dispose) (child.material as THREE.Material).dispose() }
      })
    })
    cropGroupsRef.current = []

    waterTilesRef.current.forEach(w => scene.remove(w))
    waterTilesRef.current = []

    tileMeshesRef.current.forEach(t => { t.hasCrop = false })

    crops.forEach(crop => {
      if (crop.plotX === undefined || crop.plotY === undefined) return
      const tm = tileMeshesRef.current.find(t => t.col === crop.plotX && t.row === crop.plotY)
      if (tm) tm.hasCrop = true
      const group = new THREE.Group()
      group.userData.cropId = crop.id

      buildCropMesh(group, crop)

      const gs = crop.growthStage ?? 0
      const scale = 0.3 + gs * 0.007
      group.scale.set(scale, scale, scale)

      const posX = crop.plotX * TILE_SPACING - OFFSET
      const posZ = crop.plotY * TILE_SPACING - OFFSET
      group.position.set(posX, 0, posZ)

      scene.add(group)
      cropGroupsRef.current.push({ group, cropId: crop.id, growthStage: gs })

      // Water shimmer tile
      if (crop.hydration > 40) {
        buildWaterTile(crop.plotX, crop.plotY, crop.hydration, scene)
      }
    })

    updateSelectionRing(scene)
    updateEmptyHighlights(scene)
  }

  const getTileAtScreenPos = (x: number, y: number): { col: number; row: number; hasCrop: boolean } | null => {
    if (!cameraRef.current || !rendererRef.current) return null
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const dim = Math.min(Math.max(layoutSize.width, 200), layoutSize.height) - 40
    pointer.x = (x / dim) * 2 - 1
    pointer.y = -(y / dim) * 2 + 1
    raycaster.setFromCamera(pointer, cameraRef.current)
    const intersects = raycaster.intersectObjects(tileMeshesRef.current.map(t => t.mesh))
    if (intersects.length > 0) {
      const hit = intersects[0].object
      const tileData = tileMeshesRef.current.find(t => t.mesh === hit)
      if (tileData) return { col: tileData.col, row: tileData.row, hasCrop: tileData.hasCrop }
    }
    return null
  }

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      isDraggingRef.current = false
      isTapRef.current = true
      lastTouchRef.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY }
    },
    onPanResponderMove: (e) => {
      const dx = Math.abs(e.nativeEvent.pageX - lastTouchRef.current.x)
      const dy = Math.abs(e.nativeEvent.pageY - lastTouchRef.current.y)
      if (dx > 5 || dy > 5) {
        isDraggingRef.current = true
        isTapRef.current = false
      }
      if (!isDraggingRef.current) return
      const dx2 = e.nativeEvent.pageX - lastTouchRef.current.x
      const dy2 = e.nativeEvent.pageY - lastTouchRef.current.y
      angleRef.current -= dx2 * 0.005
      camHeightRef.current = Math.max(1.5, Math.min(8, camHeightRef.current - dy2 * 0.01))
      lastTouchRef.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY }
    },
    onPanResponderRelease: (e) => {
      isDraggingRef.current = false
      if (isTapRef.current && onTilePress) {
        const tile = getTileAtScreenPos(e.nativeEvent.pageX, e.nativeEvent.pageY)
        if (tile) {
          const crop = crops.find((c: Crop) => c.plotX === tile.col && c.plotY === tile.row)
          onTilePress(tile.col, tile.row, crop)
        }
      }
    },
  }), [crops, onTilePress])

  const soilQuality = selectedGarden?.soilQuality ?? 50
  const _irrigationLevel = selectedGarden?.irrigationLevel ?? 50

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container} onLayout={onLayout}>
        <View style={styles.webFallback}>
          <Text style={styles.webFallbackIcon}>🌿</Text>
          <Text style={styles.webFallbackTitle}>3D Garden View</Text>
          <Text style={styles.webFallbackText}>
            Switch to 2D view for the best experience on web. 3D is available on mobile devices.
          </Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container} onLayout={onLayout} {...panResponder.panHandlers}>
      <GLView
        style={{ width: '100%', height: Math.max(layoutSize.height, 280) }}
        onContextCreate={(gl) => {
          const dim = Math.max(layoutSize.height || 320, 280)

          const scene = new THREE.Scene()
          scene.background = new THREE.Color(0x87ceeb)
          scene.fog = new THREE.Fog(0x87ceeb, 12, 20)
          sceneRef.current = scene

          const camera = new THREE.PerspectiveCamera(55, dim / dim, 0.1, 1000)
          cameraRef.current = camera

          const renderer = new THREE.WebGLRenderer({ context: gl })
          renderer.setSize(dim, dim)
          renderer.shadowMap.enabled = true
          renderer.shadowMap.type = THREE.PCFSoftShadowMap
          rendererRef.current = renderer

          // Hemispheric lighting
          const hemi = new THREE.HemisphereLight(0x87ceeb, 0x3a7d3a, 0.6)
          scene.add(hemi)

          const sun = new THREE.DirectionalLight(0xffeedd, 1.2)
          sun.position.set(15, 25, 10)
          sun.castShadow = true
          sun.shadow.mapSize.width = 1024; sun.shadow.mapSize.height = 1024
          scene.add(sun)

          const fill = new THREE.DirectionalLight(0x8888ff, 0.3)
          fill.position.set(-5, 10, -5); scene.add(fill)

          const rim = new THREE.DirectionalLight(0xffffff, 0.2)
          rim.position.set(-10, 0, 10); scene.add(rim)

          // Build terrain
          buildTerrain(scene)

          // Build 6x6 garden tiles
          tileMeshesRef.current = []
          for (let col = 0; col < GRID_SIZE; col++) {
            for (let row = 0; row < GRID_SIZE; row++) {
              buildGardenTile(col, row, soilQuality, scene)
            }
          }

          // Fence
          buildFence(scene)

          lastCropCountRef.current = crops.length
          updateCrops(scene)

          const startTime = Date.now()

          const animate = () => {
            animationRef.current = requestAnimationFrame(animate)

            if (cameraRef.current && !isDraggingRef.current) {
              angleRef.current += 0.003
              const radius = camRadiusRef.current
              cameraRef.current.position.x = Math.sin(angleRef.current) * radius
              cameraRef.current.position.z = Math.cos(angleRef.current) * radius
              cameraRef.current.position.y = camHeightRef.current
              cameraRef.current.lookAt(0, 0.2, 0)
            }

            if (crops.length !== lastCropCountRef.current) {
              updateCrops(scene)
              lastCropCountRef.current = crops.length
            }

            const time = (Date.now() - startTime) / 1000
            cropGroupsRef.current.forEach(({ group, cropId, growthStage: gs }) => {
              const crop = crops.find((c: any) => c.id === cropId)
              if (!crop) return
              const cgs = crop.growthStage ?? gs
              const bob = Math.sin(time * 0.6 + (cropId?.charCodeAt(0) || 0)) * 0.015 * (0.3 + cgs * 0.005)
              group.position.y = bob
              group.rotation.y = Math.sin(time * 0.1 + (cropId?.charCodeAt(0) || 0)) * 0.03
            })

            // Animate water shimmer
            waterTilesRef.current.forEach((w, i) => {
              const mat = w.material as THREE.MeshStandardMaterial
              const base = w.userData.baseOpacity || 0.1
              mat.opacity = base + Math.sin(time * 0.5 + i) * 0.03
            })

            renderer.render(scene, camera)
          }

          animate()
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  webFallback: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    minHeight: 280,
  },
  webFallbackIcon: { fontSize: 48, marginBottom: 12 },
  webFallbackTitle: { fontSize: 18, fontWeight: '700', color: '#166534', marginBottom: 8 },
  webFallbackText: { fontSize: 13, color: '#6b7280', textAlign: 'center', lineHeight: 20, maxWidth: 280 },
})
