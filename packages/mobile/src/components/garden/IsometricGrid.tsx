import React, { useMemo, useEffect, useState, useRef, useCallback } from "react";
import { Pressable, LayoutChangeEvent } from "react-native";
import Svg, {
  G,
  Polygon,
  Rect,
  Circle,
  Defs,
  LinearGradient,
  Stop,
  Ellipse,
} from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { Crop, CropStatus } from "../../types";
import HapticFeedback from "../../utils/haptics";
import { CropSpriteSVG } from "./CropSpriteSVG";

interface IsometricGridProps {
  crops: Crop[];
  gridWidth?: number;
  gridHeight?: number;
  selectedCropId?: string | null;
  onTilePress?: (col: number, row: number, crop?: Crop) => void;
  onWaterCrop?: (cropId: string) => void;
  onFertilizeCrop?: (cropId: string) => void;
  soilQuality?: number;
  irrigationLevel?: number;
}

const MIN_TILE_W = 44;
const MAX_TILE_W = 120;
const TILE_ASPECT = 2;

function getSoilColor(
  baseQuality: number,
  isEmpty: boolean,
  hasIrrigation: boolean,
): string {
  const q = Math.max(0, Math.min(100, baseQuality));
  const r = Math.round(165 - (q / 100) * 60);
  const g = Math.round(124 - (q / 100) * 40);
  const b = Math.round(84 - (q / 100) * 30);
  const color = `rgb(${r},${g},${b})`;
  if (isEmpty && hasIrrigation) {
    return `rgb(${Math.round(r * 0.85)},${Math.round(g * 0.9)},${Math.min(255, Math.round(b * 1.5))})`;
  }
  if (isEmpty) {
    return `rgb(${Math.min(255, r + 15)},${Math.min(255, g + 12)},${Math.min(255, b + 10)})`;
  }
  return color;
}

function getSoilTextureLines(col: number, row: number, isEmpty: boolean, sx: number, sy: number, halfW: number, halfH: number) {
  if (!isEmpty) return null;
  const seed = (col * 7 + row * 13) % 5;
  const lines = [];
  const offsets = [
    { x: -halfW * 0.4, y: -halfH * 0.2 },
    { x: halfW * 0.2, y: halfH * 0.15 },
    { x: -halfW * 0.1, y: halfH * 0.35 },
  ];
  for (let i = 0; i < seed + 1; i++) {
    const off = offsets[i % offsets.length];
    lines.push(
      <Rect
        key={`soil-line-${col}-${row}-${i}`}
        x={sx + off.x}
        y={sy + off.y - 0.5}
        width={halfW * 0.5 + (i * 3)}
        height={1.5}
        rx={0.75}
        fill="#7c5c3a"
        opacity={0.25 - i * 0.05}
      />
    );
  }
  return lines;
}

function getTileBorderColor(isSelected: boolean, crop?: Crop): string {
  if (isSelected) return "#fbbf24";
  if (!crop) return "#a0825a";
  if (crop.status === CropStatus.MATURE) return "#86efac";
  if (crop.status === CropStatus.WILTED || crop.status === CropStatus.DISEASED)
    return "#fca5a5";
  if (crop.status === CropStatus.SPROUTING) return "#a7f3d0";
  return "#a0825a";
}

function getTileStatusDot(crop?: Crop): [string, string, number] | null {
  if (!crop) return null;
  if (crop.status === CropStatus.MATURE) return ["#22c55e", "#fff", 4];
  if (crop.status === CropStatus.WILTED) return ["#ef4444", "#fff", 4];
  if (crop.status === CropStatus.DISEASED) return ["#f59e0b", "#fff", 4];
  return null;
}

function WaterOverlay({ size, amount }: { size: number; amount?: number }) {
  const opacity = Math.min(0.25, 0.08 + ((amount ?? 50) / 100) * 0.17);
  return (
    <Rect
      x={-size * 0.35}
      y={-size * 0.2}
      width={size * 0.7}
      height={size * 0.4}
      rx={size * 0.05}
      fill="#60a5fa"
      opacity={opacity}
    />
  );
}

function PlantShadow({ sx, sy, size, halfH }: { sx: number; sy: number; size: number; halfH: number }) {
  return (
    <Ellipse
      cx={sx}
      cy={sy + halfH * 0.25}
      rx={size * 0.22}
      ry={size * 0.07}
      fill="rgba(0,0,0,0.15)"
    />
  );
}

function GrowthStageDots({ sx, sy, gs, size: _size, halfH }: { sx: number; sy: number; gs: number; size: number; halfH: number }) {
  const stageCount = 4;
  const dotSize = 3;
  const gap = 1.5;
  const totalW = stageCount * (dotSize * 2 + gap) - gap;
  const startX = -totalW / 2 + dotSize;
  const stage = gs < 25 ? 0 : gs < 50 ? 1 : gs < 75 ? 2 : 3;
  const dots = [];
  for (let i = 0; i < stageCount; i++) {
    const filled = i <= stage;
    dots.push(
      <Circle
        key={`gd-${i}`}
        cx={sx + startX + i * (dotSize * 2 + gap)}
        cy={sy + halfH * 0.3}
        r={dotSize}
        fill={filled ? "#22c55e" : "rgba(255,255,255,0.3)"}
        stroke={filled ? "#16a34a" : "rgba(255,255,255,0.1)"}
        strokeWidth={0.5}
      />
    );
  }
  return <G>{dots}</G>;
}

function HealthBar({ sx, sy, health, halfH }: { sx: number; sy: number; health: number; halfH: number }) {
  const barW = 24;
  const barH = 3;
  const h = Math.max(0, Math.min(100, health ?? 100));
  const color = h >= 70 ? "#22c55e" : h >= 40 ? "#eab308" : "#ef4444";
  return (
    <G>
      <Rect
        x={sx - barW / 2}
        y={sy + halfH * 0.35}
        width={barW}
        height={barH}
        rx={1.5}
        fill="rgba(0,0,0,0.15)"
      />
      <Rect
        x={sx - barW / 2}
        y={sy + halfH * 0.35}
        width={barW * (h / 100)}
        height={barH}
        rx={1.5}
        fill={color}
      />
    </G>
  );
}

interface AnimatedTileProps {
  children: React.ReactNode;
  index: number;
  delay: number;
}

function _AnimatedTile({ children, index, delay }: AnimatedTileProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    opacity.value = withDelay(index * delay, withSpring(1, { damping: 15 }));
    scale.value = withDelay(index * delay, withSpring(1, { damping: 12 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

export function IsometricGrid({
  crops,
  gridWidth = 6,
  gridHeight = 6,
  selectedCropId,
  onTilePress,
  onWaterCrop,
  onFertilizeCrop: _onFertilizeCrop,
  soilQuality = 50,
  irrigationLevel = 50,
}: IsometricGridProps) {
  const [containerWidth, setContainerWidth] = useState(0);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setContainerWidth(w);
  }, []);

  const tileDims = useMemo(() => {
    const avail = containerWidth || 400;
    const tileW = Math.max(MIN_TILE_W, Math.min(MAX_TILE_W, Math.floor(avail / (gridWidth + gridHeight + 1))));
    const tileH = Math.round(tileW / TILE_ASPECT);
    return { tileW, tileH };
  }, [containerWidth, gridWidth, gridHeight]);

  const { tileW: TILE_W, tileH: TILE_H } = tileDims;
  const HALF_W = TILE_W / 2;
  const HALF_H = TILE_H / 2;

  const totalW = (gridWidth + gridHeight) * HALF_W + TILE_W;
  const totalH = (gridWidth + gridHeight) * HALF_H + TILE_H + 40;
  const vbWidth = Math.max(360, totalW);
  const vbHeight = Math.max(260, totalH);
  const viewBox = `0 0 ${vbWidth} ${vbHeight}`;
  const svgWidth = containerWidth || 400;
  const svgHeight = Math.round(svgWidth * (vbHeight / vbWidth));

  const offsetX = vbWidth / 2;
  const offsetY = (gridHeight + 1) * HALF_H + 20;

  // ─── Pulse animation for empty plots ───────────────────────────────────────
  const pulseAnim = useSharedValue(0);
  useEffect(() => {
    pulseAnim.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  // ─── Cross-platform grid press handler ────────────────────────────────
  function isInsideDiamond(px: number, py: number, cx: number, sy: number, hw: number, hh: number): boolean {
    return Math.abs((px - cx) / hw) + Math.abs((py - sy) / hh) <= 1
  }

  const lastTapRef = useRef<Map<string, number>>(new Map());

  const handleTileTap = useCallback((col: number, row: number, crop?: Crop) => {
    const key = `${col}-${row}`;
    const now = Date.now();
    const lastTap = lastTapRef.current.get(key);

    if (crop && lastTap && now - lastTap < 300) {
      lastTapRef.current.set(key, 0);
      HapticFeedback.medium();
      onWaterCrop?.(crop.id);
      return;
    }

    lastTapRef.current.set(key, now);
    HapticFeedback.light();
    onTilePress?.(col, row, crop);
  }, [onTilePress, onWaterCrop]);

  const handleGridPress = useCallback((event: any) => {
    const { locationX, locationY } = event.nativeEvent
    const vbX = (locationX / svgWidth) * vbWidth
    const vbY = (locationY / svgHeight) * vbHeight
    for (let row = gridHeight - 1; row >= 0; row--) {
      for (let col = 0; col < gridWidth; col++) {
        const { sx, sy } = getTileCenter(col, row)
        if (isInsideDiamond(vbX, vbY, sx, sy, HALF_W, HALF_H)) {
          const crop = crops.find((c) => c.plotX === col && c.plotY === row)
          handleTileTap(col, row, crop)
          return
        }
      }
    }
  }, [crops, gridWidth, gridHeight, svgWidth, svgHeight, vbWidth, vbHeight, HALF_W, HALF_H, handleTileTap])

  function getTileCenter(col: number, row: number): { sx: number; sy: number } {
    return {
      sx: offsetX + (col - row) * HALF_W,
      sy: offsetY + (col + row) * HALF_H,
    };
  }

  function getDiamondPoints(col: number, row: number): string {
    const { sx, sy } = getTileCenter(col, row);
    return `${sx},${sy - HALF_H} ${sx + HALF_W},${sy} ${sx},${sy + HALF_H} ${sx - HALF_W},${sy}`;
  }

  const grid = useMemo(() => {
    const tiles = [];
    for (let row = 0; row < gridHeight; row++) {
      for (let col = 0; col < gridWidth; col++) {
        const crop = crops.find((c) => c.plotX === col && c.plotY === row);
        const isEmpty = !crop;
        const isSelected = selectedCropId === crop?.id;
        const { sx, sy } = getTileCenter(col, row);
        const hasIrrigation = irrigationLevel > 30;
        const soilColor = getSoilColor(soilQuality, isEmpty, hasIrrigation);
        const borderColor = getTileBorderColor(isSelected, crop);

        tiles.push(
          <G key={`${row}-${col}`}>
            {/* Shadow */}
            <Polygon
              points={getDiamondPoints(col, row)}
              fill="rgba(0,0,0,0.08)"
              transform={`translate(3, 3)`}
            />

            {/* Soil tile */}
            <Polygon
              points={getDiamondPoints(col, row)}
              fill={soilColor}
              stroke={borderColor}
              strokeWidth={isSelected ? 3 : 1.5}
              strokeOpacity={isSelected ? 1 : 0.6}
            />

            {/* Soil texture lines for empty plots */}
            {getSoilTextureLines(col, row, isEmpty, sx, sy, HALF_W, HALF_H)}

            {/* Inner soil detail lines for empty plots - legacy style */}
            {isEmpty && (
              <G opacity={0.3}>
                <Rect
                  x={sx - HALF_W * 0.6}
                  y={sy - 1}
                  width={HALF_W * 1.2}
                  height={2}
                  rx={1}
                  fill="#7c5c3a"
                />
                <Rect
                  x={sx - 1}
                  y={sy - HALF_H * 0.5}
                  width={2}
                  height={HALF_H}
                  rx={1}
                  fill="#7c5c3a"
                  opacity={0.4}
                />
                {/* Plus icon for empty plots */}
                <Rect
                  x={sx - 6}
                  y={sy - 1}
                  width={12}
                  height={2}
                  rx={1}
                  fill="#a0825a"
                  opacity={0.6}
                />
                <Rect
                  x={sx - 1}
                  y={sy - 6}
                  width={2}
                  height={12}
                  rx={1}
                  fill="#a0825a"
                  opacity={0.6}
                />
                {/* Pulsing hint for center plot on empty garden */}
                {crops.length === 0 && col === Math.floor(gridWidth / 2) && row === Math.floor(gridHeight / 2) && (
                  <G>
                    <Rect
                      x={sx - 8}
                      y={sy - 8}
                      width={16}
                      height={16}
                      rx={4}
                      fill="#3b82f6"
                      opacity={0.3}
                    />
                    <Rect
                      x={sx - 6}
                      y={sy - 1}
                      width={12}
                      height={2}
                      rx={1}
                      fill="#3b82f6"
                      opacity={interpolate(pulseAnim.value, [0, 1], [0.3, 0.9])}
                    />
                    <Rect
                      x={sx - 1}
                      y={sy - 6}
                      width={2}
                      height={12}
                      rx={1}
                      fill="#3b825a"
                      opacity={interpolate(pulseAnim.value, [0, 1], [0.3, 0.9])}
                    />
                  </G>
                )}
              </G>
            )}

            {/* Irrigation overlay */}
            {hasIrrigation && !isEmpty && crop && crop.hydration > 50 && (
              <WaterOverlay size={TILE_W} amount={crop.hydration} />
            )}

            {/* Plant shadow */}
            {crop && <PlantShadow sx={sx} sy={sy} size={40} halfH={HALF_H} />}

            {/* Crop sprite */}
            {crop && (
              <G transform={`translate(${sx}, ${sy + HALF_H * 0.2})`}>
                <CropSpriteSVG crop={crop} size={40} />
              </G>
            )}

            {/* Status dot */}
            {crop && (() => {
              const dot = getTileStatusDot(crop);
              return dot ? (
                <Circle cx={sx + HALF_W * 0.5} cy={sy - HALF_H * 0.5} r={dot[2]} fill={dot[0]} stroke={dot[1]} strokeWidth={1} />
              ) : null;
            })()}

            {/* Growth stage dots */}
            {crop && crop.growthStage !== undefined && (
              <GrowthStageDots sx={sx} sy={sy} gs={crop.growthStage} size={40} halfH={HALF_H} />
            )}

            {/* Health bar */}
            {crop && crop.health !== undefined && (
              <HealthBar sx={sx} sy={sy} health={crop.health} halfH={HALF_H} />
            )}

          </G>,
        );
      }
    }
    return tiles;
  }, [crops, gridWidth, gridHeight, selectedCropId, soilQuality, irrigationLevel, HALF_W, HALF_H, TILE_W, handleTileTap]);

  return (
    <Pressable onPress={handleGridPress} style={{ width: '100%', alignItems: 'center' }} onLayout={onLayout}>
      <Svg width={svgWidth} height={svgHeight} viewBox={viewBox}>
        <Defs>
          <LinearGradient id="grassGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#86efac" stopOpacity="1" />
            <Stop offset="1" stopColor="#4ade80" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Grass background */}
        <Rect x="0" y="0" width={viewBox.split(" ")[2]} height={viewBox.split(" ")[3]} fill="url(#grassGrad)" />

        {/* Decorative grass tufts */}
        <G opacity={0.25}>
          {[
            [30, 30], [330, 20], [20, 200], [360, 220], [50, 250],
            [180, 10], [270, 50], [80, 60], [300, 80], [40, 120],
            [320, 140], [150, 280], [280, 270], [100, 290],
          ].map(([x, y], i) => (
            <Rect
              key={`grass-${i}`}
              x={x}
              y={y}
              width={4}
              height={10}
              rx={2}
              fill="#15803d"
              transform={`rotate(${i * 25 - 30}, ${x + 2}, ${y})`}
              opacity={0.5}
            />
          ))}
        </G>

        {/* Rendered tiles */}
        {grid}
      </Svg>
    </Pressable>
  );
}
