import React from "react";
import { View, Dimensions } from "react-native";
import Svg, {
  G,
  Polygon,
  Rect,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { Crop, CropStatus } from "../../types";
import { CropSpriteSVG } from "./CropSpriteSVG";

interface IsometricGridProps {
  crops: Crop[];
  gridWidth?: number;
  gridHeight?: number;
  selectedCropId?: string | null;
  onTilePress?: (col: number, row: number, crop?: Crop) => void;
  soilQuality?: number;
  irrigationLevel?: number;
}

const TILE_W = 88;
const TILE_H = 44;
const HALF_W = TILE_W / 2;
const HALF_H = TILE_H / 2;

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

function getTileBorderColor(isSelected: boolean, crop?: Crop): string {
  if (isSelected) return "#fbbf24";
  if (!crop) return "#a0825a";
  if (crop.status === CropStatus.MATURE) return "#86efac";
  if (crop.status === CropStatus.WILTED || crop.status === CropStatus.DISEASED)
    return "#fca5a5";
  if (crop.status === CropStatus.SPROUTING) return "#a7f3d0";
  return "#a0825a";
}

function getTileStatusDot(crop?: Crop): [string, string] | null {
  if (!crop) return null;
  if (crop.status === CropStatus.MATURE) return ["#22c55e", "#fff"];
  if (crop.status === CropStatus.WILTED) return ["#ef4444", "#fff"];
  if (crop.status === CropStatus.DISEASED) return ["#f59e0b", "#fff"];
  return null;
}

function WaterOverlay({ size }: { size: number }) {
  return (
    <Rect
      x={-size * 0.3}
      y={-size * 0.15}
      width={size * 0.6}
      height={size * 0.3}
      rx={size * 0.05}
      fill="#60a5fa"
      opacity={0.15}
    />
  );
}

export function IsometricGrid({
  crops,
  gridWidth = 4,
  gridHeight = 4,
  selectedCropId,
  onTilePress,
  soilQuality = 50,
  irrigationLevel = 50,
}: IsometricGridProps) {
  const screenWidth = Dimensions.get("window").width;
  const svgWidth = Math.min(screenWidth - 32, 360);
  const svgHeight = 260;
  const viewBox = "0 0 360 260";

  const offsetX = 180;
  const offsetY = 90;

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

  const grid = [];
  for (let row = 0; row < gridHeight; row++) {
    for (let col = 0; col < gridWidth; col++) {
      const crop = crops.find((c) => c.plotX === col && c.plotY === row);
      const isEmpty = !crop;
      const isSelected = selectedCropId === crop?.id;
      const { sx, sy } = getTileCenter(col, row);
      const hasIrrigation = irrigationLevel > 30;

      const soilColor = getSoilColor(soilQuality, isEmpty, hasIrrigation);
      const borderColor = getTileBorderColor(isSelected, crop);

      const zIndex = row + col;

      grid.push(
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
            onPress={() => onTilePress?.(col, row, crop)}
          />

          {/* Inner soil detail lines for empty plots */}
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
            </G>
          )}

          {/* Irrigation overlay */}
          {hasIrrigation && !isEmpty && crop && crop.hydration > 50 && (
            <WaterOverlay size={TILE_W} />
          )}

          {/* Crop sprite */}
          {crop && (
            <G transform={`translate(${sx}, ${sy + HALF_H * 0.2})`}>
              <CropSpriteSVG crop={crop} size={40} />
            </G>
          )}
        </G>,
      );
    }
  }

  return (
    <View className="items-center">
      <Svg width={svgWidth} height={svgHeight} viewBox={viewBox}>
        <Defs>
          <LinearGradient id="grassGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#86efac" stopOpacity="1" />
            <Stop offset="1" stopColor="#4ade80" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Grass background */}
        <Rect x="0" y="0" width="360" height="260" fill="url(#grassGrad)" />

        {/* Decorative grass tufts */}
        <G opacity={0.25}>
          {[
            [30, 30],
            [330, 20],
            [20, 200],
            [340, 220],
            [50, 240],
            [180, 10],
            [270, 50],
            [80, 60],
            [300, 80],
            [40, 120],
            [320, 140],
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
    </View>
  );
}
