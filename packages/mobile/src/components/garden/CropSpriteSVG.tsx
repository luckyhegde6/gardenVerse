import React from "react";
import { G, Circle, Path, Ellipse, Rect } from "react-native-svg";
import { Crop, CropStatus } from "../../types";

interface CropSpriteSVGProps {
  crop: Crop;
  size?: number;
}

interface PlantDef {
  seed: JSX.Element;
  sprouting: JSX.Element;
  growing: JSX.Element;
  mature: JSX.Element;
}

function Tomato(size: number): PlantDef {
  return {
    seed: (
      <G>
        <Ellipse
          cx={0}
          cy={size * 0.15}
          rx={size * 0.08}
          ry={size * 0.05}
          fill="#8B4513"
        />
      </G>
    ),
    sprouting: (
      <G>
        <Path
          d={`M0,${size * 0.2} Q${-size * 0.05},${-size * 0.05} ${-size * 0.1},${-size * 0.15}`}
          stroke="#4ade80"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={`M0,${size * 0.2} Q${size * 0.05},${-size * 0.05} ${size * 0.1},${-size * 0.15}`}
          stroke="#4ade80"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Ellipse
          cx={-size * 0.1}
          cy={-size * 0.15}
          rx={size * 0.06}
          ry={size * 0.04}
          fill="#4ade80"
        />
        <Ellipse
          cx={size * 0.1}
          cy={-size * 0.15}
          rx={size * 0.06}
          ry={size * 0.04}
          fill="#4ade80"
        />
      </G>
    ),
    growing: (
      <G>
        <Path
          d={`M0,${size * 0.25} L0,${-size * 0.1}`}
          stroke="#22c55e"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <Path
          d={`M0,${size * 0.05} Q${-size * 0.15},${-size * 0.05} ${-size * 0.12},${-size * 0.12}`}
          stroke="#22c55e"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={`M0,${size * 0.05} Q${size * 0.15},${-size * 0.05} ${size * 0.12},${-size * 0.12}`}
          stroke="#22c55e"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Ellipse
          cx={-size * 0.12}
          cy={-size * 0.12}
          rx={size * 0.07}
          ry={size * 0.05}
          fill="#22c55e"
        />
        <Ellipse
          cx={size * 0.12}
          cy={-size * 0.12}
          rx={size * 0.07}
          ry={size * 0.05}
          fill="#22c55e"
        />
        <Ellipse
          cx={0}
          cy={-size * 0.05}
          rx={size * 0.05}
          ry={size * 0.04}
          fill="#22c55e"
        />
      </G>
    ),
    mature: (
      <G>
        <Path
          d={`M0,${size * 0.3} L0,${-size * 0.15}`}
          stroke="#16a34a"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <Path
          d={`M0,${size * 0.05} Q${-size * 0.18},${-size * 0.05} ${-size * 0.15},${-size * 0.15}`}
          stroke="#16a34a"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={`M0,${size * 0.05} Q${size * 0.18},${-size * 0.05} ${size * 0.15},${-size * 0.15}`}
          stroke="#16a34a"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Ellipse
          cx={-size * 0.15}
          cy={-size * 0.15}
          rx={size * 0.08}
          ry={size * 0.06}
          fill="#16a34a"
        />
        <Ellipse
          cx={size * 0.15}
          cy={-size * 0.15}
          rx={size * 0.08}
          ry={size * 0.06}
          fill="#16a34a"
        />
        <Ellipse
          cx={0}
          cy={-size * 0.05}
          rx={size * 0.06}
          ry={size * 0.05}
          fill="#16a34a"
        />
        <Circle
          cx={size * 0.05}
          cy={-size * 0.2}
          r={size * 0.04}
          fill="#ef4444"
        />
        <Circle
          cx={-size * 0.03}
          cy={-size * 0.28}
          r={size * 0.035}
          fill="#ef4444"
        />
        <Ellipse
          cx={size * 0.08}
          cy={-size * 0.3}
          rx={size * 0.045}
          ry={size * 0.04}
          fill="#ef4444"
        />
        <Circle
          cx={-size * 0.08}
          cy={-size * 0.22}
          r={size * 0.025}
          fill="#dc2626"
        />
      </G>
    ),
  };
}

function Carrot(size: number): PlantDef {
  return {
    seed: (
      <G>
        <Ellipse
          cx={0}
          cy={size * 0.15}
          rx={size * 0.08}
          ry={size * 0.05}
          fill="#8B4513"
        />
      </G>
    ),
    sprouting: (
      <G>
        <Path
          d={`M0,${size * 0.2} Q${-size * 0.05},${-size * 0.05} ${-size * 0.1},${-size * 0.15}`}
          stroke="#4ade80"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={`M0,${size * 0.2} Q${size * 0.05},${-size * 0.05} ${size * 0.1},${-size * 0.15}`}
          stroke="#4ade80"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Ellipse
          cx={-size * 0.1}
          cy={-size * 0.15}
          rx={size * 0.06}
          ry={size * 0.04}
          fill="#4ade80"
        />
        <Ellipse
          cx={size * 0.1}
          cy={-size * 0.15}
          rx={size * 0.06}
          ry={size * 0.04}
          fill="#4ade80"
        />
      </G>
    ),
    growing: (
      <G>
        <Path
          d={`M0,${size * 0.25} L0,${-size * 0.1}`}
          stroke="#22c55e"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <Path
          d={`M0,${size * 0.05} Q${-size * 0.1},${0} ${-size * 0.15},${-size * 0.08}`}
          stroke="#22c55e"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={`M0,${size * 0.05} Q${size * 0.1},${0} ${size * 0.15},${-size * 0.08}`}
          stroke="#22c55e"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Ellipse
          cx={-size * 0.15}
          cy={-size * 0.08}
          rx={size * 0.08}
          ry={size * 0.06}
          fill="#22c55e"
        />
        <Ellipse
          cx={size * 0.15}
          cy={-size * 0.08}
          rx={size * 0.08}
          ry={size * 0.06}
          fill="#22c55e"
        />
      </G>
    ),
    mature: (
      <G>
        <Path
          d={`M0,${size * 0.3} L0,${-size * 0.1}`}
          stroke="#16a34a"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <Path
          d={`M0,${0} Q${-size * 0.15},${-size * 0.05} ${-size * 0.2},${-size * 0.12}`}
          stroke="#16a34a"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={`M0,${0} Q${size * 0.15},${-size * 0.05} ${size * 0.2},${-size * 0.12}`}
          stroke="#16a34a"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Ellipse
          cx={-size * 0.2}
          cy={-size * 0.12}
          rx={size * 0.1}
          ry={size * 0.07}
          fill="#16a34a"
        />
        <Ellipse
          cx={size * 0.2}
          cy={-size * 0.12}
          rx={size * 0.1}
          ry={size * 0.07}
          fill="#16a34a"
        />
        <Path
          d={`M0,${-size * 0.05} L0,${-size * 0.35}`}
          stroke="#f97316"
          strokeWidth={4}
          strokeLinecap="round"
        />
        <Ellipse
          cx={0}
          cy={-size * 0.38}
          rx={size * 0.06}
          ry={size * 0.04}
          fill="#f97316"
        />
        <Path
          d={`M${-size * 0.02},${-size * 0.35} L${-size * 0.08},${-size * 0.25} M${size * 0.02},${-size * 0.35} L${size * 0.08},${-size * 0.25}`}
          stroke="#f97316"
          strokeWidth={2}
          strokeLinecap="round"
        />
      </G>
    ),
  };
}

function Sunflower(size: number): PlantDef {
  return {
    seed: (
      <G>
        <Ellipse
          cx={0}
          cy={size * 0.15}
          rx={size * 0.08}
          ry={size * 0.05}
          fill="#8B4513"
        />
      </G>
    ),
    sprouting: (
      <G>
        <Path
          d={`M0,${size * 0.2} Q${-size * 0.05},${-size * 0.05} ${-size * 0.1},${-size * 0.15}`}
          stroke="#4ade80"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={`M0,${size * 0.2} Q${size * 0.05},${-size * 0.05} ${size * 0.1},${-size * 0.15}`}
          stroke="#4ade80"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Ellipse
          cx={-size * 0.1}
          cy={-size * 0.15}
          rx={size * 0.06}
          ry={size * 0.04}
          fill="#4ade80"
        />
        <Ellipse
          cx={size * 0.1}
          cy={-size * 0.15}
          rx={size * 0.06}
          ry={size * 0.04}
          fill="#4ade80"
        />
      </G>
    ),
    growing: (
      <G>
        <Path
          d={`M0,${size * 0.25} L0,${-size * 0.2}`}
          stroke="#22c55e"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <Path
          d={`M0,${-size * 0.05} Q${-size * 0.12},${-size * 0.1} ${-size * 0.1},${-size * 0.18}`}
          stroke="#22c55e"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={`M0,${-size * 0.05} Q${size * 0.12},${-size * 0.1} ${size * 0.1},${-size * 0.18}`}
          stroke="#22c55e"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Ellipse
          cx={-size * 0.1}
          cy={-size * 0.18}
          rx={size * 0.08}
          ry={size * 0.05}
          fill="#22c55e"
        />
        <Ellipse
          cx={size * 0.1}
          cy={-size * 0.18}
          rx={size * 0.08}
          ry={size * 0.05}
          fill="#22c55e"
        />
      </G>
    ),
    mature: (
      <G>
        <Path
          d={`M0,${size * 0.3} L0,${-size * 0.35}`}
          stroke="#16a34a"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <Path
          d={`M0,${-size * 0.1} Q${-size * 0.15},${-size * 0.15} ${-size * 0.12},${-size * 0.25}`}
          stroke="#16a34a"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={`M0,${-size * 0.1} Q${size * 0.15},${-size * 0.15} ${size * 0.12},${-size * 0.25}`}
          stroke="#16a34a"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Ellipse
          cx={-size * 0.12}
          cy={-size * 0.25}
          rx={size * 0.09}
          ry={size * 0.06}
          fill="#16a34a"
        />
        <Ellipse
          cx={size * 0.12}
          cy={-size * 0.25}
          rx={size * 0.09}
          ry={size * 0.06}
          fill="#16a34a"
        />
        <Circle cx={0} cy={-size * 0.4} r={size * 0.16} fill="#fbbf24" />
        <Circle cx={0} cy={-size * 0.4} r={size * 0.07} fill="#92400e" />
        <Ellipse
          cx={-size * 0.08}
          cy={-size * 0.38}
          rx={size * 0.04}
          ry={size * 0.03}
          fill="#ffe4a0"
        />
        <Ellipse
          cx={size * 0.08}
          cy={-size * 0.38}
          rx={size * 0.04}
          ry={size * 0.03}
          fill="#ffe4a0"
        />
        <Ellipse
          cx={0}
          cy={-size * 0.45}
          rx={size * 0.04}
          ry={size * 0.03}
          fill="#ffe4a0"
        />
      </G>
    ),
  };
}

function Generic(size: number): PlantDef {
  return {
    seed: (
      <G>
        <Ellipse
          cx={0}
          cy={size * 0.15}
          rx={size * 0.08}
          ry={size * 0.05}
          fill="#8B4513"
        />
      </G>
    ),
    sprouting: (
      <G>
        <Path
          d={`M0,${size * 0.2} Q${-size * 0.05},${-size * 0.05} ${-size * 0.1},${-size * 0.15}`}
          stroke="#4ade80"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={`M0,${size * 0.2} Q${size * 0.05},${-size * 0.05} ${size * 0.1},${-size * 0.15}`}
          stroke="#4ade80"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Ellipse
          cx={-size * 0.1}
          cy={-size * 0.15}
          rx={size * 0.06}
          ry={size * 0.04}
          fill="#4ade80"
        />
        <Ellipse
          cx={size * 0.1}
          cy={-size * 0.15}
          rx={size * 0.06}
          ry={size * 0.04}
          fill="#4ade80"
        />
      </G>
    ),
    growing: (
      <G>
        <Path
          d={`M0,${size * 0.25} L0,${-size * 0.15}`}
          stroke="#22c55e"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <Path
          d={`M0,${0} Q${-size * 0.15},${-size * 0.05} ${-size * 0.12},${-size * 0.15}`}
          stroke="#22c55e"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={`M0,${0} Q${size * 0.15},${-size * 0.05} ${size * 0.12},${-size * 0.15}`}
          stroke="#22c55e"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Ellipse
          cx={-size * 0.12}
          cy={-size * 0.15}
          rx={size * 0.08}
          ry={size * 0.06}
          fill="#22c55e"
        />
        <Ellipse
          cx={size * 0.12}
          cy={-size * 0.15}
          rx={size * 0.08}
          ry={size * 0.06}
          fill="#22c55e"
        />
        <Ellipse
          cx={0}
          cy={-size * 0.05}
          rx={size * 0.06}
          ry={size * 0.05}
          fill="#16a34a"
        />
      </G>
    ),
    mature: (
      <G>
        <Path
          d={`M0,${size * 0.3} L0,${-size * 0.2}`}
          stroke="#16a34a"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <Path
          d={`M0,${-size * 0.05} Q${-size * 0.18},${-size * 0.1} ${-size * 0.15},${-size * 0.22}`}
          stroke="#16a34a"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={`M0,${-size * 0.05} Q${size * 0.18},${-size * 0.1} ${size * 0.15},${-size * 0.22}`}
          stroke="#16a34a"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Ellipse
          cx={-size * 0.15}
          cy={-size * 0.22}
          rx={size * 0.1}
          ry={size * 0.07}
          fill="#16a34a"
        />
        <Ellipse
          cx={size * 0.15}
          cy={-size * 0.22}
          rx={size * 0.1}
          ry={size * 0.07}
          fill="#16a34a"
        />
        <Path
          d={`M0,${-size * 0.15} L0,${-size * 0.4}`}
          stroke="#16a34a"
          strokeWidth={4}
          strokeLinecap="round"
        />
        <Ellipse
          cx={0}
          cy={-size * 0.42}
          rx={size * 0.05}
          ry={size * 0.04}
          fill="#eab308"
        />
        <Rect
          x={-size * 0.06}
          y={-size * 0.42}
          width={size * 0.12}
          height={size * 0.06}
          rx={2}
          fill="#eab308"
        />
        <Circle cx={0} cy={-size * 0.35} r={size * 0.02} fill="#eab308" />
        <Circle cx={0} cy={-size * 0.3} r={size * 0.02} fill="#eab308" />
        <Circle cx={0} cy={-size * 0.25} r={size * 0.02} fill="#eab308" />
      </G>
    ),
  };
}

function Strawberry(size: number): PlantDef {
  return {
    seed: (
      <G>
        <Ellipse
          cx={0}
          cy={size * 0.15}
          rx={size * 0.08}
          ry={size * 0.05}
          fill="#8B4513"
        />
      </G>
    ),
    sprouting: (
      <G>
        <Path
          d={`M0,${size * 0.2} Q${-size * 0.05},${-size * 0.05} ${-size * 0.1},${-size * 0.15}`}
          stroke="#4ade80"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={`M0,${size * 0.2} Q${size * 0.05},${-size * 0.05} ${size * 0.1},${-size * 0.15}`}
          stroke="#4ade80"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Ellipse
          cx={-size * 0.1}
          cy={-size * 0.15}
          rx={size * 0.06}
          ry={size * 0.04}
          fill="#4ade80"
        />
        <Ellipse
          cx={size * 0.1}
          cy={-size * 0.15}
          rx={size * 0.06}
          ry={size * 0.04}
          fill="#4ade80"
        />
      </G>
    ),
    growing: (
      <G>
        <Path
          d={`M0,${size * 0.25} L0,${-size * 0.1}`}
          stroke="#22c55e"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <Path
          d={`M0,${0} Q${-size * 0.12},${-size * 0.05} ${-size * 0.1},${-size * 0.12}`}
          stroke="#22c55e"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={`M0,${0} Q${size * 0.12},${-size * 0.05} ${size * 0.1},${-size * 0.12}`}
          stroke="#22c55e"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Ellipse
          cx={-size * 0.1}
          cy={-size * 0.12}
          rx={size * 0.08}
          ry={size * 0.05}
          fill="#22c55e"
        />
        <Ellipse
          cx={size * 0.1}
          cy={-size * 0.12}
          rx={size * 0.08}
          ry={size * 0.05}
          fill="#22c55e"
        />
      </G>
    ),
    mature: (
      <G>
        <Path
          d={`M0,${size * 0.3} L0,${-size * 0.15}`}
          stroke="#16a34a"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <Path
          d={`M0,${0} Q${-size * 0.2},${-size * 0.05} ${-size * 0.18},${-size * 0.18}`}
          stroke="#16a34a"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={`M0,${0} Q${size * 0.2},${-size * 0.05} ${size * 0.18},${-size * 0.18}`}
          stroke="#16a34a"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Ellipse
          cx={-size * 0.18}
          cy={-size * 0.18}
          rx={size * 0.1}
          ry={size * 0.07}
          fill="#16a34a"
        />
        <Ellipse
          cx={size * 0.18}
          cy={-size * 0.18}
          rx={size * 0.1}
          ry={size * 0.07}
          fill="#16a34a"
        />
        <Circle
          cx={-size * 0.05}
          cy={-size * 0.25}
          r={size * 0.08}
          fill="#fb7185"
        />
        <Circle
          cx={size * 0.05}
          cy={-size * 0.35}
          r={size * 0.07}
          fill="#fb7185"
        />
        <Circle
          cx={size * 0.08}
          cy={-size * 0.2}
          r={size * 0.06}
          fill="#f43f5e"
        />
      </G>
    ),
  };
}

function BellPepper(size: number): PlantDef {
  return {
    seed: (
      <G>
        <Ellipse
          cx={0}
          cy={size * 0.15}
          rx={size * 0.08}
          ry={size * 0.05}
          fill="#8B4513"
        />
      </G>
    ),
    sprouting: (
      <G>
        <Path
          d={`M0,${size * 0.2} Q${-size * 0.05},${-size * 0.05} ${-size * 0.1},${-size * 0.15}`}
          stroke="#4ade80"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={`M0,${size * 0.2} Q${size * 0.05},${-size * 0.05} ${size * 0.1},${-size * 0.15}`}
          stroke="#4ade80"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Ellipse
          cx={-size * 0.1}
          cy={-size * 0.15}
          rx={size * 0.06}
          ry={size * 0.04}
          fill="#4ade80"
        />
        <Ellipse
          cx={size * 0.1}
          cy={-size * 0.15}
          rx={size * 0.06}
          ry={size * 0.04}
          fill="#4ade80"
        />
      </G>
    ),
    growing: (
      <G>
        <Path
          d={`M0,${size * 0.25} L0,${-size * 0.15}`}
          stroke="#22c55e"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <Path
          d={`M0,${0} Q${-size * 0.15},${-size * 0.05} ${-size * 0.12},${-size * 0.15}`}
          stroke="#22c55e"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={`M0,${0} Q${size * 0.15},${-size * 0.05} ${size * 0.12},${-size * 0.15}`}
          stroke="#22c55e"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Ellipse
          cx={-size * 0.12}
          cy={-size * 0.15}
          rx={size * 0.08}
          ry={size * 0.06}
          fill="#22c55e"
        />
        <Ellipse
          cx={size * 0.12}
          cy={-size * 0.15}
          rx={size * 0.08}
          ry={size * 0.06}
          fill="#22c55e"
        />
      </G>
    ),
    mature: (
      <G>
        <Path
          d={`M0,${size * 0.3} L0,${-size * 0.2}`}
          stroke="#16a34a"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <Path
          d={`M0,${-size * 0.05} Q${-size * 0.2},${-size * 0.1} ${-size * 0.18},${-size * 0.2}`}
          stroke="#16a34a"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={`M0,${-size * 0.05} Q${size * 0.2},${-size * 0.1} ${size * 0.18},${-size * 0.2}`}
          stroke="#16a34a"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Ellipse
          cx={-size * 0.18}
          cy={-size * 0.2}
          rx={size * 0.1}
          ry={size * 0.07}
          fill="#16a34a"
        />
        <Ellipse
          cx={size * 0.18}
          cy={-size * 0.2}
          rx={size * 0.1}
          ry={size * 0.07}
          fill="#16a34a"
        />
        <Ellipse
          cx={0}
          cy={-size * 0.35}
          rx={size * 0.07}
          ry={size * 0.1}
          fill="#22c55e"
        />
        <Ellipse
          cx={0}
          cy={-size * 0.28}
          rx={size * 0.09}
          ry={size * 0.06}
          fill="#16a34a"
        />
        <Circle
          cx={-size * 0.04}
          cy={-size * 0.35}
          r={size * 0.04}
          fill="#22d3ee"
          opacity={0.3}
        />
        <Circle
          cx={size * 0.05}
          cy={-size * 0.38}
          r={size * 0.035}
          fill="#22d3ee"
          opacity={0.3}
        />
      </G>
    ),
  };
}

function Cucumber(size: number): PlantDef {
  return {
    seed: (
      <G>
        <Ellipse
          cx={0}
          cy={size * 0.15}
          rx={size * 0.08}
          ry={size * 0.05}
          fill="#8B4513"
        />
      </G>
    ),
    sprouting: (
      <G>
        <Path
          d={`M0,${size * 0.2} Q${-size * 0.05},${-size * 0.05} ${-size * 0.1},${-size * 0.15}`}
          stroke="#4ade80"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={`M0,${size * 0.2} Q${size * 0.05},${-size * 0.05} ${size * 0.1},${-size * 0.15}`}
          stroke="#4ade80"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Ellipse
          cx={-size * 0.1}
          cy={-size * 0.15}
          rx={size * 0.06}
          ry={size * 0.04}
          fill="#4ade80"
        />
        <Ellipse
          cx={size * 0.1}
          cy={-size * 0.15}
          rx={size * 0.06}
          ry={size * 0.04}
          fill="#4ade80"
        />
      </G>
    ),
    growing: (
      <G>
        <Path
          d={`M0,${size * 0.25} L0,${-size * 0.1}`}
          stroke="#22c55e"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <Path
          d={`M0,${0} Q${-size * 0.15},${-size * 0.05} ${-size * 0.12},${-size * 0.12}`}
          stroke="#22c55e"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={`M0,${0} Q${size * 0.15},${-size * 0.05} ${size * 0.12},${-size * 0.12}`}
          stroke="#22c55e"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Ellipse
          cx={-size * 0.12}
          cy={-size * 0.12}
          rx={size * 0.08}
          ry={size * 0.05}
          fill="#22c55e"
        />
        <Ellipse
          cx={size * 0.12}
          cy={-size * 0.12}
          rx={size * 0.08}
          ry={size * 0.05}
          fill="#22c55e"
        />
      </G>
    ),
    mature: (
      <G>
        <Path
          d={`M0,${size * 0.3} L0,${-size * 0.1}`}
          stroke="#16a34a"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <Path
          d={`M0,${0} Q${-size * 0.2},${-size * 0.08} ${-size * 0.18},${-size * 0.18}`}
          stroke="#16a34a"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={`M0,${0} Q${size * 0.2},${-size * 0.08} ${size * 0.18},${-size * 0.18}`}
          stroke="#16a34a"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Ellipse
          cx={-size * 0.18}
          cy={-size * 0.18}
          rx={size * 0.1}
          ry={size * 0.07}
          fill="#16a34a"
        />
        <Ellipse
          cx={size * 0.18}
          cy={-size * 0.18}
          rx={size * 0.1}
          ry={size * 0.07}
          fill="#16a34a"
        />
        <Ellipse
          cx={-size * 0.05}
          cy={-size * 0.3}
          rx={size * 0.09}
          ry={size * 0.06}
          fill="#16a34a"
        />
        <Ellipse
          cx={size * 0.05}
          cy={-size * 0.28}
          rx={size * 0.08}
          ry={size * 0.055}
          fill="#16a34a"
        />
        <Ellipse
          cx={-size * 0.12}
          cy={-size * 0.28}
          rx={size * 0.045}
          ry={size * 0.05}
          fill="#4ade80"
        />
        <Ellipse
          cx={size * 0.12}
          cy={-size * 0.28}
          rx={size * 0.045}
          ry={size * 0.05}
          fill="#4ade80"
        />
      </G>
    ),
  };
}

function LeafyGreen(size: number): PlantDef {
  return {
    seed: (
      <G>
        <Ellipse
          cx={0}
          cy={size * 0.15}
          rx={size * 0.08}
          ry={size * 0.05}
          fill="#8B4513"
        />
      </G>
    ),
    sprouting: (
      <G>
        <Path
          d={`M0,${size * 0.2} Q${-size * 0.05},${-size * 0.05} ${-size * 0.1},${-size * 0.15}`}
          stroke="#4ade80"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={`M0,${size * 0.2} Q${size * 0.05},${-size * 0.05} ${size * 0.1},${-size * 0.15}`}
          stroke="#4ade80"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Ellipse
          cx={-size * 0.1}
          cy={-size * 0.15}
          rx={size * 0.06}
          ry={size * 0.04}
          fill="#4ade80"
        />
        <Ellipse
          cx={size * 0.1}
          cy={-size * 0.15}
          rx={size * 0.06}
          ry={size * 0.04}
          fill="#4ade80"
        />
      </G>
    ),
    growing: (
      <G>
        <Path
          d={`M0,${size * 0.25} L0,${-size * 0.15}`}
          stroke="#22c55e"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <Path
          d={`M0,${0} Q${-size * 0.2},${-size * 0.05} ${-size * 0.18},${-size * 0.15}`}
          stroke="#22c55e"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={`M0,${0} Q${size * 0.2},${-size * 0.05} ${size * 0.18},${-size * 0.15}`}
          stroke="#22c55e"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Ellipse
          cx={-size * 0.18}
          cy={-size * 0.15}
          rx={size * 0.1}
          ry={size * 0.06}
          fill="#22c55e"
        />
        <Ellipse
          cx={size * 0.18}
          cy={-size * 0.15}
          rx={size * 0.1}
          ry={size * 0.06}
          fill="#22c55e"
        />
      </G>
    ),
    mature: (
      <G>
        <Path
          d={`M0,${size * 0.3} L0,${-size * 0.2}`}
          stroke="#15803d"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <Path
          d={`M0,${-size * 0.05} Q${-size * 0.25},${-size * 0.1} ${-size * 0.22},${-size * 0.2}`}
          stroke="#15803d"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={`M0,${-size * 0.05} Q${size * 0.25},${-size * 0.1} ${size * 0.22},${-size * 0.2}`}
          stroke="#15803d"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Ellipse
          cx={-size * 0.22}
          cy={-size * 0.2}
          rx={size * 0.12}
          ry={size * 0.07}
          fill="#15803d"
        />
        <Ellipse
          cx={size * 0.22}
          cy={-size * 0.2}
          rx={size * 0.12}
          ry={size * 0.07}
          fill="#15803d"
        />
        <Ellipse
          cx={0}
          cy={-size * 0.35}
          rx={size * 0.08}
          ry={size * 0.12}
          fill="#a3e635"
          opacity={0.6}
        />
        <Circle
          cx={-size * 0.05}
          cy={-size * 0.35}
          r={size * 0.03}
          fill="#d9f99d"
        />
        <Circle
          cx={size * 0.05}
          cy={-size * 0.32}
          r={size * 0.025}
          fill="#d9f99d"
        />
      </G>
    ),
  };
}

function Basil(size: number): PlantDef {
  return {
    seed: (
      <G>
        <Ellipse
          cx={0}
          cy={size * 0.15}
          rx={size * 0.08}
          ry={size * 0.05}
          fill="#8B4513"
        />
      </G>
    ),
    sprouting: (
      <G>
        <Path
          d={`M0,${size * 0.2} Q${-size * 0.05},${-size * 0.05} ${-size * 0.1},${-size * 0.15}`}
          stroke="#4ade80"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={`M0,${size * 0.2} Q${size * 0.05},${-size * 0.05} ${size * 0.1},${-size * 0.15}`}
          stroke="#4ade80"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Ellipse
          cx={-size * 0.1}
          cy={-size * 0.15}
          rx={size * 0.06}
          ry={size * 0.04}
          fill="#4ade80"
        />
        <Ellipse
          cx={size * 0.1}
          cy={-size * 0.15}
          rx={size * 0.06}
          ry={size * 0.04}
          fill="#4ade80"
        />
      </G>
    ),
    growing: (
      <G>
        <Path
          d={`M0,${size * 0.25} L0,${-size * 0.15}`}
          stroke="#22c55e"
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <Path
          d={`M0,${0} Q${-size * 0.2},${-size * 0.05} ${-size * 0.18},${-size * 0.15}`}
          stroke="#22c55e"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={`M0,${0} Q${size * 0.2},${-size * 0.05} ${size * 0.18},${-size * 0.15}`}
          stroke="#22c55e"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Ellipse
          cx={-size * 0.18}
          cy={-size * 0.15}
          rx={size * 0.1}
          ry={size * 0.06}
          fill="#22c55e"
        />
        <Ellipse
          cx={size * 0.18}
          cy={-size * 0.15}
          rx={size * 0.1}
          ry={size * 0.06}
          fill="#22c55e"
        />
      </G>
    ),
    mature: (
      <G>
        <Path
          d={`M0,${size * 0.3} L0,${-size * 0.25}`}
          stroke="#15803d"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <Path
          d={`M0,${-size * 0.05} Q${-size * 0.25},${-size * 0.1} ${-size * 0.22},${-size * 0.22}`}
          stroke="#15803d"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d={`M0,${-size * 0.05} Q${size * 0.25},${-size * 0.1} ${size * 0.22},${-size * 0.22}`}
          stroke="#15803d"
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Ellipse
          cx={-size * 0.22}
          cy={-size * 0.22}
          rx={size * 0.12}
          ry={size * 0.08}
          fill="#15803d"
        />
        <Ellipse
          cx={size * 0.22}
          cy={-size * 0.22}
          rx={size * 0.12}
          ry={size * 0.08}
          fill="#15803d"
        />
        <Ellipse
          cx={0}
          cy={-size * 0.38}
          rx={size * 0.06}
          ry={size * 0.08}
          fill="#a855f7"
        />
        <Ellipse
          cx={0}
          cy={-size * 0.38}
          rx={size * 0.025}
          ry={size * 0.04}
          fill="#c084fc"
        />
      </G>
    ),
  };
}

export function getPlantDef(name: string, size: number): PlantDef {
  const key = name.toLowerCase().trim();
  switch (key) {
    case "tomato":
      return Tomato(size);
    case "carrot":
      return Carrot(size);
    case "sunflower":
      return Sunflower(size);
    case "strawberry":
      return Strawberry(size);
    case "bell pepper":
      return BellPepper(size);
    case "cucumber":
      return Cucumber(size);
    case "lavender":
      return LeafyGreen(size);
    case "lettuce":
      return LeafyGreen(size);
    case "basil":
      return Basil(size);
    default:
      return Generic(size);
  }
}

export function CropSpriteSVG({ crop, size = 40 }: CropSpriteSVGProps) {
  const plantDef = getPlantDef(crop.name, size);
  let stageContent: JSX.Element;

  switch (crop.status) {
    case CropStatus.SEED:
      stageContent = plantDef.seed;
      break;
    case CropStatus.SPROUTING:
      stageContent = plantDef.sprouting;
      break;
    case CropStatus.GROWING:
      stageContent = plantDef.growing;
      break;
    case CropStatus.MATURE:
    case CropStatus.HARVESTED:
      stageContent = plantDef.mature;
      break;
    case CropStatus.WILTED:
    case CropStatus.DISEASED:
      stageContent = (
        <G>
          {plantDef.growing}
          <Rect
            x={-size * 0.35}
            y={-size * 0.5}
            width={size * 0.7}
            height={size * 0.7}
            fill="#92400e"
            opacity={0.3}
          />
        </G>
      );
      break;
    default:
      stageContent = plantDef.growing;
  }

  return <G>{stageContent}</G>;
}
