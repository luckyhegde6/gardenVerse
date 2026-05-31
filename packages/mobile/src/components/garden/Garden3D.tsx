import React, { useEffect, useRef, useMemo } from 'react'
import { View, StyleSheet, Dimensions } from 'react-native'
import { GLView } from 'expo-gl'
import * as THREE from 'three'
import { useGarden } from '../../hooks/useGarden'

type PlantCategory = 'vegetable' | 'herb' | 'tree' | 'flower' | 'berry' | 'grain' | 'default'

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
}

function getPlantData(name: string): typeof PLANT_DATA[string] {
  const key = Object.keys(PLANT_DATA).find(k => name.toLowerCase().includes(k.toLowerCase()))
  return PLANT_DATA[key || 'default'] || { category: 'default', primaryColor: 0x8b4513, secondaryColor: 0x6b3410, height: 0.3 }
}

function buildVegetable(group: THREE.Group, data: typeof PLANT_DATA[string], growthStage: number, health: number, hueShift: number) {
  const s = 0.3 + growthStage * 0.007
  const color = new THREE.Color(data.primaryColor)
  const h = data.height * s

  const stemGeo = new THREE.CylinderGeometry(0.03, 0.04, h * 0.4, 6)
  const stemMat = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.3 - hueShift / 360, 0.5, 0.25) })
  const stem = new THREE.Mesh(stemGeo, stemMat)
  stem.position.y = h * 0.2
  group.add(stem)

  const leavesGeo = new THREE.SphereGeometry(h * 0.35, 6, 6)
  const leavesMat = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.28 - hueShift / 360, 0.6, 0.35) })
  const leaves = new THREE.Mesh(leavesGeo, leavesMat)
  leaves.position.y = h * 0.5
  leaves.scale.set(1, 0.4, 1)
  group.add(leaves)

  if (growthStage > 60) {
    const fruitGeo = new THREE.SphereGeometry(h * 0.2, 8, 8)
    const fruitMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.05 + (health / 100) * 0.1 })
    const fruit = new THREE.Mesh(fruitGeo, fruitMat)
    fruit.position.set(0.08, h * 0.55, 0.08)
    fruit.scale.set(1, 0.85, 1)
    group.add(fruit)
  }
}

function buildHerb(group: THREE.Group, data: typeof PLANT_DATA[string], growthStage: number, health: number, hueShift: number) {
  const s = 0.3 + growthStage * 0.007
  const h = data.height * s

  for (let i = 0; i < 5; i++) {
    const angle = (i / 5) * Math.PI * 2
    const stemGeo = new THREE.CylinderGeometry(0.015, 0.02, h * 0.6, 4)
    const stemMat = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.3 - hueShift / 360, 0.5, 0.3) })
    const stem = new THREE.Mesh(stemGeo, stemMat)
    stem.position.set(Math.cos(angle) * h * 0.12, h * 0.3, Math.sin(angle) * h * 0.12)
    stem.rotation.z = Math.cos(angle) * 0.2
    stem.rotation.x = Math.sin(angle) * 0.2
    group.add(stem)
  }

  const clusterGeo = new THREE.SphereGeometry(h * 0.25, 6, 6)
  const clusterMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(0.25 - hueShift / 360, 0.5, 0.4 + (health / 100) * 0.2),
  })
  const cluster = new THREE.Mesh(clusterGeo, clusterMat)
  cluster.position.y = h * 0.55
  cluster.scale.set(1, 0.5, 1)
  group.add(cluster)
}

function buildTree(group: THREE.Group, data: typeof PLANT_DATA[string], growthStage: number, health: number) {
  const s = 0.3 + growthStage * 0.007
  const h = 1.5 * s

  const trunkGeo = new THREE.CylinderGeometry(0.04, 0.06, h * 0.5, 6)
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 })
  const trunk = new THREE.Mesh(trunkGeo, trunkMat)
  trunk.position.y = h * 0.25
  group.add(trunk)

  for (let tier = 0; tier < 3; tier++) {
    const canopyGeo = new THREE.SphereGeometry(h * (0.3 - tier * 0.06), 7, 7)
    const canopyMat = new THREE.MeshStandardMaterial({
      color: data.primaryColor,
      emissive: data.primaryColor,
      emissiveIntensity: 0.03,
    })
    const canopy = new THREE.Mesh(canopyGeo, canopyMat)
    canopy.position.y = h * 0.55 + tier * h * 0.18
    canopy.scale.set(1, 0.7 + tier * 0.1, 1)
    group.add(canopy)
  }
}

function buildFlower(group: THREE.Group, data: typeof PLANT_DATA[string], growthStage: number, health: number, hueShift: number) {
  const s = 0.3 + growthStage * 0.007
  const h = data.height * s

  const stemGeo = new THREE.CylinderGeometry(0.02, 0.035, h, 6)
  const stemMat = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.3 - hueShift / 360, 0.5, 0.25) })
  const stem = new THREE.Mesh(stemGeo, stemMat)
  stem.position.y = h * 0.5
  group.add(stem)

  if (growthStage > 30) {
    const color = new THREE.Color(data.primaryColor)
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2
      const petalGeo = new THREE.SphereGeometry(h * 0.08, 6, 6)
      const petalMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.05 })
      const petal = new THREE.Mesh(petalGeo, petalMat)
      petal.position.set(Math.cos(angle) * h * 0.12, h + 0.02, Math.sin(angle) * h * 0.12)
      petal.scale.set(1, 0.3, 1)
      group.add(petal)
    }

    const centerGeo = new THREE.SphereGeometry(h * 0.06, 6, 6)
    const centerMat = new THREE.MeshStandardMaterial({ color: 0xffd700 })
    const center = new THREE.Mesh(centerGeo, centerMat)
    center.position.y = h + 0.02
    group.add(center)
  }
}

function buildBerry(group: THREE.Group, data: typeof PLANT_DATA[string], growthStage: number, health: number, hueShift: number) {
  const s = 0.3 + growthStage * 0.007
  const h = data.height * s

  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + 0.5
    const stemGeo = new THREE.CylinderGeometry(0.015, 0.02, h * 0.4, 4)
    const stemMat = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.3 - hueShift / 360, 0.5, 0.25) })
    const stem = new THREE.Mesh(stemGeo, stemMat)
    stem.position.set(Math.cos(angle) * h * 0.1, h * 0.2, Math.sin(angle) * h * 0.1)
    stem.rotation.z = Math.cos(angle) * 0.3
    stem.rotation.x = Math.sin(angle) * 0.3
    group.add(stem)
  }

  if (growthStage > 50) {
    const color = new THREE.Color(data.primaryColor)
    for (let i = 0; i < 3; i++) {
      const berryGeo = new THREE.SphereGeometry(h * 0.06, 6, 6)
      const berryMat = new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.05 + (health / 100) * 0.1 })
      const berry = new THREE.Mesh(berryGeo, berryMat)
      berry.position.set((i - 1) * h * 0.08, h * 0.42, 0)
      group.add(berry)
    }
  }

  const leafGeo = new THREE.SphereGeometry(h * 0.15, 5, 5)
  const leafMat = new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.3 - hueShift / 360, 0.5, 0.3) })
  const leaf = new THREE.Mesh(leafGeo, leafMat)
  leaf.position.y = h * 0.2
  leaf.scale.set(1.2, 0.2, 0.8)
  group.add(leaf)
}

function buildGrain(group: THREE.Group, data: typeof PLANT_DATA[string], growthStage: number, health: number) {
  const s = 0.3 + growthStage * 0.007
  const h = data.height * s

  for (let i = 0; i < 3; i++) {
    const stalkGeo = new THREE.CylinderGeometry(0.02, 0.025, h * 0.85, 4)
    const stalkMat = new THREE.MeshStandardMaterial({ color: 0xc4a35a })
    const stalk = new THREE.Mesh(stalkGeo, stalkMat)
    stalk.position.set((i - 1) * h * 0.1, h * 0.425, (i % 2 === 0 ? 0.05 : -0.05))
    group.add(stalk)
  }

  if (growthStage > 60) {
    for (let i = 0; i < 3; i++) {
      const headGeo = new THREE.SphereGeometry(h * 0.05, 5, 5)
      const headMat = new THREE.MeshStandardMaterial({ color: data.primaryColor })
      const head = new THREE.Mesh(headGeo, headMat)
      head.position.set((i - 1) * h * 0.1, h * 0.85, (i % 2 === 0 ? 0.05 : -0.05))
      head.scale.set(0.8, 0.4, 0.8)
      group.add(head)
    }
  }

  const leafClusterGeo = new THREE.SphereGeometry(h * 0.08, 5, 5)
  const leafClusterMat = new THREE.MeshStandardMaterial({ color: 0x556b2f })
  const leafCluster = new THREE.Mesh(leafClusterGeo, leafClusterMat)
  leafCluster.position.y = h * 0.2
  leafCluster.scale.set(1.5, 0.3, 0.8)
  group.add(leafCluster)
}

function buildCropMesh(group: THREE.Group, crop: any) {
  const plantData = getPlantData(crop.name)
  const health = crop.health ?? 100
  const growthStage = crop.growthStage ?? 0
  const hueShift = (1 - health / 100) * 30

  switch (plantData.category) {
    case 'vegetable':
      buildVegetable(group, plantData, growthStage, health, hueShift)
      break
    case 'herb':
      buildHerb(group, plantData, growthStage, health, hueShift)
      break
    case 'tree':
      buildTree(group, plantData, growthStage, health)
      break
    case 'flower':
      buildFlower(group, plantData, growthStage, health, hueShift)
      break
    case 'berry':
      buildBerry(group, plantData, growthStage, health, hueShift)
      break
    case 'grain':
      buildGrain(group, plantData, growthStage, health)
      break
    default:
      buildVegetable(group, plantData, growthStage, health, hueShift)
  }
}

export function Garden3D() {
  const { crops, selectedGarden } = useGarden()
  const animationRef = useRef(0)
  const [size, setSize] = React.useState({ width: 0, height: 0 })
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const angleRef = useRef(0)
  const cropGroupsRef = useRef<THREE.Group[]>([])
  const lastCropCountRef = useRef(0)

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [])

  useEffect(() => {
    const updateSize = () => {
      const { width, height } = Dimensions.get('window')
      setSize({ width, height })
    }
    updateSize()
    const sub = Dimensions.addEventListener('change', updateSize)
    return () => sub.remove()
  }, [])

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

  const updateCrops = (scene: THREE.Scene) => {
    cropGroupsRef.current.forEach(g => {
      scene.remove(g)
      g.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose()
          if ((child.material as THREE.Material).dispose) (child.material as THREE.Material).dispose()
        }
      })
    })
    cropGroupsRef.current = []

    crops.forEach(crop => {
      if (crop.plotX === undefined || crop.plotY === undefined) return

      const group = new THREE.Group()
      group.userData.cropId = crop.id

      const growthStage = crop.growthStage ?? 0
      const scale = 0.5 + growthStage * 0.005

      buildCropMesh(group, crop)

      group.scale.set(scale, scale, scale)

      const posX = crop.plotX * 2 - 3
      const posZ = crop.plotY * 2 - 3
      group.position.set(posX, 0, posZ)

      scene.add(group)
      cropGroupsRef.current.push(group)
    })
  }

  return (
    <View style={styles.container}>
      <GLView
        style={{ flex: 1 }}
        onContextCreate={(gl) => {
          const dim = Math.min(size.width, size.height) - 40

          const scene = new THREE.Scene()
          scene.background = new THREE.Color(0x87ceeb)
          sceneRef.current = scene

          const camera = new THREE.PerspectiveCamera(65, dim / dim, 0.1, 1000)
          cameraRef.current = camera

          const renderer = new THREE.WebGLRenderer({ context: gl })
          renderer.setSize(dim, dim)
          renderer.shadowMap.enabled = true
          renderer.shadowMap.type = THREE.PCFSoftShadowMap
          rendererRef.current = renderer

          const ambient = new THREE.AmbientLight(0xffffff, 0.5)
          scene.add(ambient)

          const sun = new THREE.DirectionalLight(0xffffff, 1.0)
          sun.position.set(15, 25, 10)
          sun.castShadow = true
          scene.add(sun)

          const fill = new THREE.DirectionalLight(0x8888ff, 0.3)
          fill.position.set(-5, 10, -5)
          scene.add(fill)

          const rim = new THREE.DirectionalLight(0xffffff, 0.2)
          rim.position.set(-10, 0, 10)
          scene.add(rim)

          const gridHelper = new THREE.GridHelper(12, 12, 0x5a8f3c, 0x4a7a2e)
          gridHelper.position.y = 0.01
          scene.add(gridHelper)

          const groundGeo = new THREE.PlaneGeometry(14, 14)
          const groundMat = new THREE.MeshStandardMaterial({
            color: 0x7cad5c,
            roughness: 0.9,
          })
          const ground = new THREE.Mesh(groundGeo, groundMat)
          ground.rotation.x = -Math.PI / 2
          ground.receiveShadow = true
          scene.add(ground)

          for (let i = 0; i < 20; i++) {
            const tuft = new THREE.Mesh(
              new THREE.CircleGeometry(0.02 + Math.random() * 0.03, 3),
              new THREE.MeshStandardMaterial({ color: new THREE.Color().setHSL(0.28 + Math.random() * 0.05, 0.5, 0.2 + Math.random() * 0.15) })
            )
            tuft.position.set((Math.random() - 0.5) * 12, 0.02, (Math.random() - 0.5) * 12)
            tuft.rotation.x = -Math.PI / 2
            scene.add(tuft)
          }

          lastCropCountRef.current = crops.length
          updateCrops(scene)

          const animate = () => {
            animationRef.current = requestAnimationFrame(animate)

            if (cameraRef.current) {
              angleRef.current += 0.002
              const radius = 6.5
              const height = 4 + Math.sin(angleRef.current * 0.3) * 0.6
              cameraRef.current.position.x = Math.sin(angleRef.current) * radius
              cameraRef.current.position.z = Math.cos(angleRef.current) * radius
              cameraRef.current.position.y = height
              cameraRef.current.lookAt(0, 0.3, 0)
            }

            if (crops.length !== lastCropCountRef.current) {
              updateCrops(scene)
              lastCropCountRef.current = crops.length
            }

            const time = Date.now() / 1000
            cropGroupsRef.current.forEach(group => {
              const cropId = group.userData.cropId
              const crop = crops.find((c: any) => c.id === cropId)
              if (!crop) return
              const gs = crop.growthStage ?? 0
              const bob = Math.sin(time * 0.6 + (cropId?.charCodeAt(0) || 0)) * 0.015 * (0.3 + gs * 0.005)
              group.position.y = bob
              group.rotation.y = Math.sin(time * 0.1 + (cropId?.charCodeAt(0) || 0)) * 0.05
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
  container: { flex: 1, height: 320 },
})
