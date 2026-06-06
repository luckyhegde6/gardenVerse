import React, { useState, useMemo } from "react"
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native"
import Svg, { Rect } from "react-native-svg"
import { Crop, CropStatus } from "../../types"
import { colors, spacing, borderRadius } from "../../styles/theme"
import HapticFeedback from "../../utils/haptics"

type AnalyticsTab = "overview" | "hydration" | "health"

interface GardenAnalyticsProps {
  crops: Crop[]
  gridWidth?: number
  gridHeight?: number
  soilQuality?: number
  irrigationLevel?: number
  onClose?: () => void
}

function getHydrationColor(h: number): string {
  if (h >= 80) return "#1d4ed8"
  if (h >= 60) return "#3b82f6"
  if (h >= 40) return "#93c5fd"
  if (h >= 20) return "#fde68a"
  return "#fca5a5"
}

function getHealthColor(h: number): string {
  if (h >= 80) return "#16a34a"
  if (h >= 60) return "#22c55e"
  if (h >= 40) return "#eab308"
  if (h >= 20) return "#f97316"
  return "#ef4444"
}

function statusLabel(s: CropStatus): string {
  switch (s) {
    case CropStatus.SEED: return "Seed"
    case CropStatus.SPROUTING: return "Sprouting"
    case CropStatus.GROWING: return "Growing"
    case CropStatus.MATURE: return "Mature"
    case CropStatus.HARVESTED: return "Harvested"
    case CropStatus.WILTED: return "Wilted"
    case CropStatus.DISEASED: return "Diseased"
  }
}

export function GardenAnalytics({
  crops,
  gridWidth = 6,
  gridHeight = 6,
  soilQuality,
  onClose,
}: GardenAnalyticsProps) {
  const [tab, setTab] = useState<AnalyticsTab>("overview")

  const stats = useMemo(() => {
    const total = crops.length
    if (total === 0) return { total: 0, avgHealth: 0, avgHydration: 0, avgNutrient: 0, mature: 0, wilting: 0, diseased: 0, growing: 0, seed: 0, sprouting: 0, harvested: 0, healthyCount: 0 }

    const avgHealth = Math.round(crops.reduce((s, c) => s + c.health, 0) / total)
    const avgHydration = Math.round(crops.reduce((s, c) => s + c.hydration, 0) / total)
    const avgNutrient = Math.round(crops.reduce((s, c) => s + (c.nutrientLevel ?? 50), 0) / total)

    const mature = crops.filter(c => c.status === CropStatus.MATURE).length
    const wilting = crops.filter(c => c.status === CropStatus.WILTED).length
    const diseased = crops.filter(c => c.status === CropStatus.DISEASED).length
    const growing = crops.filter(c => c.status === CropStatus.GROWING).length
    const seed = crops.filter(c => c.status === CropStatus.SEED).length
    const sprouting = crops.filter(c => c.status === CropStatus.SPROUTING).length
    const harvested = crops.filter(c => c.status === CropStatus.HARVESTED).length
    const healthyCount = crops.filter(c => c.health >= 60).length

    return { total, avgHealth, avgHydration, avgNutrient, mature, wilting, diseased, growing, seed, sprouting, harvested, healthyCount }
  }, [crops])

  const cellSize = 28
  const gap = 3
  const gridPixelW = gridWidth * (cellSize + gap) - gap
  const gridPixelH = gridHeight * (cellSize + gap) - gap

  function renderHeatmap(getColor: (val: number) => string, getVal: (c: Crop) => number) {
    const cells: React.ReactNode[] = []
    for (let row = 0; row < gridHeight; row++) {
      for (let col = 0; col < gridWidth; col++) {
        const crop = crops.find(c => c.plotX === col && c.plotY === row)
        const x = col * (cellSize + gap)
        const y = row * (cellSize + gap)
        const color = crop ? getColor(getVal(crop)) : "#e5e7eb"
        const label = crop ? `${getVal(crop)}%` : ""
        cells.push(
          <Rect key={`${row}-${col}`} x={x} y={y} width={cellSize} height={cellSize} rx={4} fill={color} />
        )
      }
    }
    return (
      <View className="items-center">
        <Svg width={gridPixelW} height={gridPixelH}>{cells}</Svg>
        <View className="flex-row items-center justify-between w-full mt-2">
          <View className="flex-row items-center gap-1"><View className="w-3 h-3 rounded-sm" style={{ backgroundColor: getColor(90) }} /><Text className="text-xs text-gray-400">High</Text></View>
          <View className="flex-row items-center gap-1"><View className="w-3 h-3 rounded-sm" style={{ backgroundColor: getColor(30) }} /><Text className="text-xs text-gray-400">Low</Text></View>
        </View>
      </View>
    )
  }

  function renderBar(label: string, value: number, max: number, color: string) {
    const pct = max > 0 ? Math.round((value / max) * 100) : 0
    return (
      <View className="flex-row items-center mb-1.5">
        <Text className="text-xs text-gray-500 w-20">{label}</Text>
        <View className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden mx-2">
          <View style={{ width: `${pct}%`, backgroundColor: color }} className="h-full rounded-full" />
        </View>
        <Text className="text-xs font-semibold text-gray-600 w-8 text-right">{value}</Text>
      </View>
    )
  }

  return (
    <View className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
      <View className="flex-row items-center justify-between px-4 pt-3 pb-2">
        <Text className="text-base font-bold text-gray-900">📊 Garden Analytics</Text>
        {onClose && (
          <TouchableOpacity onPress={() => { HapticFeedback.light(); onClose?.(); }} className="p-1">
            <Text className="text-gray-400 text-lg">✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View className="flex-row px-3 pb-2 gap-1">
        {(["overview", "hydration", "health"] as AnalyticsTab[]).map(t => (
          <TouchableOpacity
            key={t}
            onPress={() => { HapticFeedback.light(); setTab(t); }}
            className={`px-3 py-1.5 rounded-full ${tab === t ? "bg-primary-600" : "bg-gray-100"}`}
          >
            <Text className={`text-xs font-medium ${tab === t ? "text-white" : "text-gray-500"}`}>
              {t === "overview" ? "📋 Overview" : t === "hydration" ? "💧 Hydration" : "❤️ Health"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView className="px-4 pb-4" showsVerticalScrollIndicator={false}>
        {tab === "overview" && (
          <>
            <View className="flex-row flex-wrap gap-2 mb-3">
              <StatBox label="Total Crops" value={stats.total} color="#6366f1" />
              <StatBox label="Avg Health" value={`${stats.avgHealth}%`} color={stats.avgHealth >= 60 ? "#16a34a" : stats.avgHealth >= 30 ? "#eab308" : "#ef4444"} />
              <StatBox label="Avg Hydration" value={`${stats.avgHydration}%`} color="#3b82f6" />
              <StatBox label="Avg Nutrients" value={`${stats.avgNutrient}%`} color="#d97706" />
            </View>

            <View className="mb-3">
              <Text className="text-xs font-semibold text-gray-700 mb-2">Growth Distribution</Text>
              {renderBar("🌱 Seed", stats.seed, stats.total, "#9ca3af")}
              {renderBar("🌿 Sprouting", stats.sprouting, stats.total, "#86efac")}
              {renderBar("🌳 Growing", stats.growing, stats.total, "#22c55e")}
              {renderBar("🍅 Mature", stats.mature, stats.total, "#16a34a")}
              {renderBar("🥀 Wilted", stats.wilting, stats.total, "#ef4444")}
              {renderBar("⚠️ Diseased", stats.diseased, stats.total, "#f59e0b")}
              {renderBar("🧺 Harvested", stats.harvested, stats.total, "#a855f7")}
            </View>

            <View className="bg-gray-50 rounded-xl p-3">
              <Text className="text-xs font-semibold text-gray-700 mb-2">Soil & Irrigation</Text>
              <View className="flex-row justify-between">
                <Text className="text-xs text-gray-500">Soil Quality: <Text className="font-semibold text-gray-700">{soilQuality ?? 50}%</Text></Text>
                <Text className="text-xs text-gray-500">Healthy Crops: <Text className="font-semibold text-green-600">{stats.healthyCount}/{stats.total}</Text></Text>
              </View>
            </View>
          </>
        )}

        {tab === "hydration" && (
          <>
            <Text className="text-xs text-gray-500 mb-2">Tile hydration levels — darker blue = more hydrated</Text>
            {renderHeatmap(getHydrationColor, c => c.hydration)}
            <View className="flex-row flex-wrap gap-2 mt-3">
              <StatBox label="Avg Hydration" value={`${stats.avgHydration}%`} color="#3b82f6" />
              <StatBox label="Low (<40%)" value={crops.filter(c => c.hydration < 40).length} color="#fca5a5" />
              <StatBox label="Optimal (60-100%)" value={crops.filter(c => c.hydration >= 60).length} color="#1d4ed8" />
            </View>
          </>
        )}

        {tab === "health" && (
          <>
            <Text className="text-xs text-gray-500 mb-2">Tile health levels — greener = healthier</Text>
            {renderHeatmap(getHealthColor, c => c.health)}
            <View className="flex-row flex-wrap gap-2 mt-3">
              <StatBox label="Avg Health" value={`${stats.avgHealth}%`} color="#16a34a" />
              <StatBox label="Critical (<40%)" value={crops.filter(c => c.health < 40).length} color="#ef4444" />
              <StatBox label="Good (60-100%)" value={crops.filter(c => c.health >= 60).length} color="#16a34a" />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}

function StatBox({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <View className="bg-gray-50 rounded-xl px-3 py-2.5 flex-1 min-w-[45%]">
      <Text className="text-[10px] text-gray-400 uppercase tracking-wider mb-0.5">{label}</Text>
      <Text className="text-lg font-bold" style={{ color }}>{value}</Text>
    </View>
  )
}
