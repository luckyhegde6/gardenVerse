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

function Chilli(size: number): PlantDef {
  return {
    seed: (
      <G>
        <Ellipse cx={0} cy={size * 0.15} rx={size * 0.08} ry={size * 0.05} fill="#8B4513" />
      </G>
    ),
    sprouting: (
      <G>
        <Path d={`M0,${size * 0.2} Q${-size * 0.05},${-size * 0.05} ${-size * 0.1},${-size * 0.15}`} stroke="#4ade80" strokeWidth={2} fill="none" strokeLinecap="round" />
        <Path d={`M0,${size * 0.2} Q${size * 0.05},${-size * 0.05} ${size * 0.1},${-size * 0.15}`} stroke="#4ade80" strokeWidth={2} fill="none" strokeLinecap="round" />
        <Ellipse cx={-size * 0.1} cy={-size * 0.15} rx={size * 0.06} ry={size * 0.04} fill="#4ade80" />
        <Ellipse cx={size * 0.1} cy={-size * 0.15} rx={size * 0.06} ry={size * 0.04} fill="#4ade80" />
      </G>
    ),
    growing: (
      <G>
        <Path d={`M0,${size * 0.25} L0,${-size * 0.15}`} stroke="#22c55e" strokeWidth={2.5} strokeLinecap="round" />
        <Path d={`M0,${0} Q${-size * 0.2},${-size * 0.05} ${-size * 0.18},${-size * 0.15}`} stroke="#22c55e" strokeWidth={2} fill="none" strokeLinecap="round" />
        <Path d={`M0,${0} Q${size * 0.2},${-size * 0.05} ${size * 0.18},${-size * 0.15}`} stroke="#22c55e" strokeWidth={2} fill="none" strokeLinecap="round" />
        <Ellipse cx={-size * 0.18} cy={-size * 0.15} rx={size * 0.1} ry={size * 0.06} fill="#22c55e" />
        <Ellipse cx={size * 0.18} cy={-size * 0.15} rx={size * 0.1} ry={size * 0.06} fill="#22c55e" />
      </G>
    ),
    mature: (
      <G>
        <Path d={`M0,${size * 0.3} L0,${-size * 0.2}`} stroke="#15803d" strokeWidth={3} strokeLinecap="round" />
        <Path d={`M0,${-size * 0.05} Q${-size * 0.25},${-size * 0.1} ${-size * 0.22},${-size * 0.2}`} stroke="#15803d" strokeWidth={2} fill="none" strokeLinecap="round" />
        <Path d={`M0,${-size * 0.05} Q${size * 0.25},${-size * 0.1} ${size * 0.22},${-size * 0.2}`} stroke="#15803d" strokeWidth={2} fill="none" strokeLinecap="round" />
        <Ellipse cx={-size * 0.22} cy={-size * 0.2} rx={size * 0.12} ry={size * 0.07} fill="#15803d" />
        <Ellipse cx={size * 0.22} cy={-size * 0.2} rx={size * 0.12} ry={size * 0.07} fill="#15803d" />
        <Ellipse cx={-size * 0.05} cy={-size * 0.35} rx={size * 0.04} ry={size * 0.06} fill="#dc2626" />
        <Ellipse cx={size * 0.05} cy={-size * 0.32} rx={size * 0.035} ry={size * 0.055} fill="#b91c1c" />
        <Ellipse cx={0} cy={-size * 0.38} rx={size * 0.03} ry={size * 0.05} fill="#ef4444" />
        <Ellipse cx={-size * 0.1} cy={-size * 0.3} rx={size * 0.025} ry={size * 0.04} fill="#dc2626" />
      </G>
    ),
  };
}

function Turmeric(size: number): PlantDef {
  return {
    seed: (
      <G>
        <Ellipse cx={0} cy={size * 0.15} rx={size * 0.08} ry={size * 0.05} fill="#8B4513" />
      </G>
    ),
    sprouting: (
      <G>
        <Path d={`M0,${size * 0.2} Q${-size * 0.05},${-size * 0.05} ${-size * 0.1},${-size * 0.15}`} stroke="#4ade80" strokeWidth={2} fill="none" strokeLinecap="round" />
        <Path d={`M0,${size * 0.2} Q${size * 0.05},${-size * 0.05} ${size * 0.1},${-size * 0.15}`} stroke="#4ade80" strokeWidth={2} fill="none" strokeLinecap="round" />
        <Ellipse cx={-size * 0.1} cy={-size * 0.15} rx={size * 0.06} ry={size * 0.04} fill="#4ade80" />
        <Ellipse cx={size * 0.1} cy={-size * 0.15} rx={size * 0.06} ry={size * 0.04} fill="#4ade80" />
      </G>
    ),
    growing: (
      <G>
        <Path d={`M0,${size * 0.25} L0,${-size * 0.2}`} stroke="#22c55e" strokeWidth={3} strokeLinecap="round" />
        <Path d={`M0,${-size * 0.05} Q${-size * 0.25},${-size * 0.1} ${-size * 0.2},${-size * 0.2}`} stroke="#22c55e" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        <Path d={`M0,${-size * 0.05} Q${size * 0.25},${-size * 0.1} ${size * 0.2},${-size * 0.2}`} stroke="#22c55e" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        <Ellipse cx={-size * 0.2} cy={-size * 0.2} rx={size * 0.12} ry={size * 0.07} fill="#22c55e" />
        <Ellipse cx={size * 0.2} cy={-size * 0.2} rx={size * 0.12} ry={size * 0.07} fill="#22c55e" />
      </G>
    ),
    mature: (
      <G>
        <Path d={`M0,${size * 0.3} L0,${-size * 0.3}`} stroke="#15803d" strokeWidth={3.5} strokeLinecap="round" />
        <Path d={`M0,${-size * 0.08} Q${-size * 0.3},${-size * 0.15} ${-size * 0.25},${-size * 0.25}`} stroke="#15803d" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        <Path d={`M0,${-size * 0.08} Q${size * 0.3},${-size * 0.15} ${size * 0.25},${-size * 0.25}`} stroke="#15803d" strokeWidth={2.5} fill="none" strokeLinecap="round" />
        <Ellipse cx={-size * 0.25} cy={-size * 0.25} rx={size * 0.14} ry={size * 0.08} fill="#15803d" />
        <Ellipse cx={size * 0.25} cy={-size * 0.25} rx={size * 0.14} ry={size * 0.08} fill="#15803d" />
        <Ellipse cx={0} cy={-size * 0.05} rx={size * 0.08} ry={size * 0.12} fill="#d97706" opacity={0.4} />
        <Path d={`M-${size * 0.04},${-size * 0.05} L-${size * 0.04},${-size * 0.4} M${size * 0.04},${-size * 0.05} L${size * 0.04},${-size * 0.4}`} stroke="#d97706" strokeWidth={3} strokeLinecap="round" opacity={0.3} />
      </G>
    ),
  };
}

function Rice(size: number): PlantDef {
  return {
    seed: (
      <G>
        <Ellipse cx={0} cy={size * 0.15} rx={size * 0.08} ry={size * 0.05} fill="#8B4513" />
      </G>
    ),
    sprouting: (
      <G>
        <Path d={`M0,${size * 0.2} Q${-size * 0.05},${-size * 0.05} ${-size * 0.1},${-size * 0.15}`} stroke="#4ade80" strokeWidth={2} fill="none" strokeLinecap="round" />
        <Path d={`M0,${size * 0.2} Q${size * 0.05},${-size * 0.05} ${size * 0.1},${-size * 0.15}`} stroke="#4ade80" strokeWidth={2} fill="none" strokeLinecap="round" />
        <Ellipse cx={-size * 0.1} cy={-size * 0.15} rx={size * 0.06} ry={size * 0.04} fill="#4ade80" />
        <Ellipse cx={size * 0.1} cy={-size * 0.15} rx={size * 0.06} ry={size * 0.04} fill="#4ade80" />
      </G>
    ),
    growing: (
      <G>
        <Path d={`M0,${size * 0.25} L0,${-size * 0.25}`} stroke="#22c55e" strokeWidth={2.5} strokeLinecap="round" />
        <Path d={`M-${size * 0.04},${-size * 0.05} Q${-size * 0.15},${-size * 0.1} ${-size * 0.12},${-size * 0.2}`} stroke="#22c55e" strokeWidth={2} fill="none" strokeLinecap="round" />
        <Path d={`M${size * 0.04},${-size * 0.05} Q${size * 0.15},${-size * 0.1} ${size * 0.12},${-size * 0.2}`} stroke="#22c55e" strokeWidth={2} fill="none" strokeLinecap="round" />
        <Ellipse cx={-size * 0.12} cy={-size * 0.2} rx={size * 0.07} ry={size * 0.05} fill="#22c55e" />
        <Ellipse cx={size * 0.12} cy={-size * 0.2} rx={size * 0.07} ry={size * 0.05} fill="#22c55e" />
      </G>
    ),
    mature: (
      <G>
        <Path d={`M0,${size * 0.3} L0,${-size * 0.35}`} stroke="#a3a635" strokeWidth={2.5} strokeLinecap="round" />
        <Path d={`M-${size * 0.05},${-size * 0.05} Q${-size * 0.2},${-size * 0.12} ${-size * 0.15},${-size * 0.25}`} stroke="#a3a635" strokeWidth={2} fill="none" strokeLinecap="round" />
        <Path d={`M${size * 0.05},${-size * 0.05} Q${size * 0.2},${-size * 0.12} ${size * 0.15},${-size * 0.25}`} stroke="#a3a635" strokeWidth={2} fill="none" strokeLinecap="round" />
        <Ellipse cx={-size * 0.15} cy={-size * 0.25} rx={size * 0.08} ry={size * 0.06} fill="#a3a635" />
        <Ellipse cx={size * 0.15} cy={-size * 0.25} rx={size * 0.08} ry={size * 0.06} fill="#a3a635" />
        {/* Rice grains */}
        <Ellipse cx={-size * 0.06} cy={-size * 0.38} rx={size * 0.03} ry={size * 0.05} fill="#fef3c7" />
        <Ellipse cx={size * 0.06} cy={-size * 0.38} rx={size * 0.03} ry={size * 0.05} fill="#fef3c7" />
        <Ellipse cx={0} cy={-size * 0.42} rx={size * 0.025} ry={size * 0.04} fill="#fde68a" />
        <Ellipse cx={-size * 0.1} cy={-size * 0.35} rx={size * 0.025} ry={size * 0.04} fill="#fef3c7" />
        <Ellipse cx={size * 0.1} cy={-size * 0.35} rx={size * 0.025} ry={size * 0.04} fill="#fef3c7" />
      </G>
    ),
  };
}

function Okra(size: number): PlantDef {
  return {
    seed: (
      <G>
        <Ellipse cx={0} cy={size * 0.15} rx={size * 0.08} ry={size * 0.05} fill="#8B4513" />
      </G>
    ),
    sprouting: (
      <G>
        <Path d={`M0,${size * 0.2} Q${-size * 0.05},${-size * 0.05} ${-size * 0.1},${-size * 0.15}`} stroke="#4ade80" strokeWidth={2} fill="none" strokeLinecap="round" />
        <Path d={`M0,${size * 0.2} Q${size * 0.05},${-size * 0.05} ${size * 0.1},${-size * 0.15}`} stroke="#4ade80" strokeWidth={2} fill="none" strokeLinecap="round" />
        <Ellipse cx={-size * 0.1} cy={-size * 0.15} rx={size * 0.06} ry={size * 0.04} fill="#4ade80" />
        <Ellipse cx={size * 0.1} cy={-size * 0.15} rx={size * 0.06} ry={size * 0.04} fill="#4ade80" />
      </G>
    ),
    growing: (
      <G>
        <Path d={`M0,${size * 0.25} L0,${-size * 0.2}`} stroke="#22c55e" strokeWidth={3} strokeLinecap="round" />
        <Path d={`M0,${-size * 0.05} Q${-size * 0.18},${-size * 0.1} ${-size * 0.15},${-size * 0.18}`} stroke="#22c55e" strokeWidth={2} fill="none" strokeLinecap="round" />
        <Path d={`M0,${-size * 0.05} Q${size * 0.18},${-size * 0.1} ${size * 0.15},${-size * 0.18}`} stroke="#22c55e" strokeWidth={2} fill="none" strokeLinecap="round" />
        <Ellipse cx={-size * 0.15} cy={-size * 0.18} rx={size * 0.09} ry={size * 0.06} fill="#22c55e" />
        <Ellipse cx={size * 0.15} cy={-size * 0.18} rx={size * 0.09} ry={size * 0.06} fill="#22c55e" />
      </G>
    ),
    mature: (
      <G>
        <Path d={`M0,${size * 0.3} L0,${-size * 0.3}`} stroke="#15803d" strokeWidth={3} strokeLinecap="round" />
        <Path d={`M0,${-size * 0.05} Q${-size * 0.22},${-size * 0.1} ${-size * 0.2},${-size * 0.22}`} stroke="#15803d" strokeWidth={2} fill="none" strokeLinecap="round" />
        <Path d={`M0,${-size * 0.05} Q${size * 0.22},${-size * 0.1} ${size * 0.2},${-size * 0.22}`} stroke="#15803d" strokeWidth={2} fill="none" strokeLinecap="round" />
        <Ellipse cx={-size * 0.2} cy={-size * 0.22} rx={size * 0.11} ry={size * 0.07} fill="#15803d" />
        <Ellipse cx={size * 0.2} cy={-size * 0.22} rx={size * 0.11} ry={size * 0.07} fill="#15803d" />
        {/* Okra pod */}
        <Path d={`M-${size * 0.02},${-size * 0.25} L-${size * 0.02},${-size * 0.45} Q0,${-size * 0.48} ${size * 0.02},${-size * 0.45} L${size * 0.02},${-size * 0.25} Z`} fill="#22c55e" />
        <Ellipse cx={0} cy={-size * 0.35} rx={size * 0.025} ry={size * 0.08} fill="#16a34a" />
      </G>
    ),
  };
}

function Brinjal(size: number): PlantDef {
  return {
    seed: (
      <G>
        <Ellipse cx={0} cy={size * 0.15} rx={size * 0.08} ry={size * 0.05} fill="#8B4513" />
      </G>
    ),
    sprouting: (
      <G>
        <Path d={`M0,${size * 0.2} Q${-size * 0.05},${-size * 0.05} ${-size * 0.1},${-size * 0.15}`} stroke="#4ade80" strokeWidth={2} fill="none" strokeLinecap="round" />
        <Path d={`M0,${size * 0.2} Q${size * 0.05},${-size * 0.05} ${size * 0.1},${-size * 0.15}`} stroke="#4ade80" strokeWidth={2} fill="none" strokeLinecap="round" />
        <Ellipse cx={-size * 0.1} cy={-size * 0.15} rx={size * 0.06} ry={size * 0.04} fill="#4ade80" />
        <Ellipse cx={size * 0.1} cy={-size * 0.15} rx={size * 0.06} ry={size * 0.04} fill="#4ade80" />
      </G>
    ),
    growing: (
      <G>
        <Path d={`M0,${size * 0.25} L0,${-size * 0.18}`} stroke="#22c55e" strokeWidth={3} strokeLinecap="round" />
        <Path d={`M0,${-size * 0.05} Q${-size * 0.2},${-size * 0.1} ${-size * 0.18},${-size * 0.18}`} stroke="#22c55e" strokeWidth={2} fill="none" strokeLinecap="round" />
        <Path d={`M0,${-size * 0.05} Q${size * 0.2},${-size * 0.1} ${size * 0.18},${-size * 0.18}`} stroke="#22c55e" strokeWidth={2} fill="none" strokeLinecap="round" />
        <Ellipse cx={-size * 0.18} cy={-size * 0.18} rx={size * 0.1} ry={size * 0.06} fill="#22c55e" />
        <Ellipse cx={size * 0.18} cy={-size * 0.18} rx={size * 0.1} ry={size * 0.06} fill="#22c55e" />
      </G>
    ),
    mature: (
      <G>
        <Path d={`M0,${size * 0.3} L0,${-size * 0.25}`} stroke="#15803d" strokeWidth={3} strokeLinecap="round" />
        <Path d={`M0,${-size * 0.05} Q${-size * 0.25},${-size * 0.1} ${-size * 0.22},${-size * 0.22}`} stroke="#15803d" strokeWidth={2} fill="none" strokeLinecap="round" />
        <Path d={`M0,${-size * 0.05} Q${size * 0.25},${-size * 0.1} ${size * 0.22},${-size * 0.22}`} stroke="#15803d" strokeWidth={2} fill="none" strokeLinecap="round" />
        <Ellipse cx={-size * 0.22} cy={-size * 0.22} rx={size * 0.12} ry={size * 0.08} fill="#15803d" />
        <Ellipse cx={size * 0.22} cy={-size * 0.22} rx={size * 0.12} ry={size * 0.08} fill="#15803d" />
        {/* Brinjal/eggplant fruit */}
        <Ellipse cx={0} cy={-size * 0.38} rx={size * 0.08} ry={size * 0.12} fill="#7c3aed" />
        <Ellipse cx={0} cy={-size * 0.38} rx={size * 0.06} ry={size * 0.1} fill="#8b5cf6" opacity={0.5} />
        <Ellipse cx={0} cy={-size * 0.48} rx={size * 0.025} ry={size * 0.02} fill="#166534" />
      </G>
    ),
  };
}

function Corn(size: number): PlantDef {
  return {
    seed: (<G><Ellipse cx={0} cy={size * 0.15} rx={size * 0.08} ry={size * 0.05} fill="#8B4513" /></G>),
    sprouting: (<G><Path d={`M0,${size * 0.2} Q${-size * 0.05},${-size * 0.05} ${-size * 0.1},${-size * 0.15}`} stroke="#4ade80" strokeWidth={2} fill="none" strokeLinecap="round" /><Path d={`M0,${size * 0.2} Q${size * 0.05},${-size * 0.05} ${size * 0.1},${-size * 0.15}`} stroke="#4ade80" strokeWidth={2} fill="none" strokeLinecap="round" /><Ellipse cx={-size * 0.1} cy={-size * 0.15} rx={size * 0.06} ry={size * 0.04} fill="#4ade80" /><Ellipse cx={size * 0.1} cy={-size * 0.15} rx={size * 0.06} ry={size * 0.04} fill="#4ade80" /></G>),
    growing: (<G><Path d={`M0,${size * 0.25} L0,${-size * 0.25}`} stroke="#22c55e" strokeWidth={3} strokeLinecap="round" /><Path d={`M-${size * 0.03},${-size * 0.1} Q${-size * 0.2},${-size * 0.15} ${-size * 0.15},${-size * 0.25}`} stroke="#22c55e" strokeWidth={2.5} fill="none" strokeLinecap="round" /><Path d={`M${size * 0.03},${-size * 0.1} Q${size * 0.2},${-size * 0.15} ${size * 0.15},${-size * 0.25}`} stroke="#22c55e" strokeWidth={2.5} fill="none" strokeLinecap="round" /><Ellipse cx={-size * 0.15} cy={-size * 0.25} rx={size * 0.09} ry={size * 0.06} fill="#22c55e" /><Ellipse cx={size * 0.15} cy={-size * 0.25} rx={size * 0.09} ry={size * 0.06} fill="#22c55e" /></G>),
    mature: (<G><Path d={`M0,${size * 0.3} L0,${-size * 0.4}`} stroke="#15803d" strokeWidth={3} strokeLinecap="round" /><Path d={`M-${size * 0.04},${-size * 0.1} Q${-size * 0.25},${-size * 0.15} ${-size * 0.2},${-size * 0.28}`} stroke="#15803d" strokeWidth={2.5} fill="none" strokeLinecap="round" /><Path d={`M${size * 0.04},${-size * 0.1} Q${size * 0.25},${-size * 0.15} ${size * 0.2},${-size * 0.28}`} stroke="#15803d" strokeWidth={2.5} fill="none" strokeLinecap="round" /><Ellipse cx={-size * 0.2} cy={-size * 0.28} rx={size * 0.1} ry={size * 0.07} fill="#15803d" /><Ellipse cx={size * 0.2} cy={-size * 0.28} rx={size * 0.1} ry={size * 0.07} fill="#15803d" /><Ellipse cx={0} cy={-size * 0.42} rx={size * 0.04} ry={size * 0.05} fill="#fbbf24" /><Ellipse cx={0} cy={-size * 0.35} rx={size * 0.055} ry={size * 0.08} fill="#f59e0b" /><Path d={`M-${size * 0.04},${-size * 0.42} Q-${size * 0.06},${-size * 0.48} 0,${-size * 0.5} Q${size * 0.06},${-size * 0.48} ${size * 0.04},${-size * 0.42}`} stroke="#92400e" strokeWidth={1.5} fill="none" /><Circle cx={-size * 0.02} cy={-size * 0.35} r={size * 0.02} fill="#fbbf24" /><Circle cx={0} cy={-size * 0.38} r={size * 0.02} fill="#fbbf24" /><Circle cx={size * 0.02} cy={-size * 0.37} r={size * 0.02} fill="#fbbf24" /></G>),
  };
}

function Watermelon(size: number): PlantDef {
  return {
    seed: (<G><Ellipse cx={0} cy={size * 0.15} rx={size * 0.08} ry={size * 0.05} fill="#8B4513" /></G>),
    sprouting: (<G><Path d={`M0,${size * 0.2} Q${-size * 0.05},${-size * 0.05} ${-size * 0.1},${-size * 0.15}`} stroke="#4ade80" strokeWidth={2} fill="none" strokeLinecap="round" /><Path d={`M0,${size * 0.2} Q${size * 0.05},${-size * 0.05} ${size * 0.1},${-size * 0.15}`} stroke="#4ade80" strokeWidth={2} fill="none" strokeLinecap="round" /><Ellipse cx={-size * 0.1} cy={-size * 0.15} rx={size * 0.06} ry={size * 0.04} fill="#4ade80" /><Ellipse cx={size * 0.1} cy={-size * 0.15} rx={size * 0.06} ry={size * 0.04} fill="#4ade80" /></G>),
    growing: (<G><Path d={`M0,${size * 0.25} L0,${-size * 0.12}`} stroke="#22c55e" strokeWidth={2.5} strokeLinecap="round" /><Path d={`M0,${0} Q${-size * 0.2},${-size * 0.05} ${-size * 0.18},${-size * 0.15}`} stroke="#22c55e" strokeWidth={2} fill="none" strokeLinecap="round" /><Path d={`M0,${0} Q${size * 0.2},${-size * 0.05} ${size * 0.18},${-size * 0.15}`} stroke="#22c55e" strokeWidth={2} fill="none" strokeLinecap="round" /><Ellipse cx={-size * 0.18} cy={-size * 0.15} rx={size * 0.1} ry={size * 0.06} fill="#22c55e" /><Ellipse cx={size * 0.18} cy={-size * 0.15} rx={size * 0.1} ry={size * 0.06} fill="#22c55e" /></G>),
    mature: (<G><Path d={`M0,${size * 0.3} L0,${-size * 0.1}`} stroke="#15803d" strokeWidth={3} strokeLinecap="round" /><Path d={`M0,${-size * 0.05} Q${-size * 0.22},${-size * 0.1} ${-size * 0.2},${-size * 0.2}`} stroke="#15803d" strokeWidth={2.5} fill="none" strokeLinecap="round" /><Path d={`M0,${-size * 0.05} Q${size * 0.22},${-size * 0.1} ${size * 0.2},${-size * 0.2}`} stroke="#15803d" strokeWidth={2.5} fill="none" strokeLinecap="round" /><Ellipse cx={-size * 0.2} cy={-size * 0.2} rx={size * 0.11} ry={size * 0.07} fill="#15803d" /><Ellipse cx={size * 0.2} cy={-size * 0.2} rx={size * 0.11} ry={size * 0.07} fill="#15803d" /><Ellipse cx={0} cy={-size * 0.32} rx={size * 0.12} ry={size * 0.09} fill="#22c55e" /><Path d={`M-${size * 0.09},${-size * 0.36} Q-${size * 0.05},${-size * 0.28} ${size * 0.09},${-size * 0.28}`} stroke="#155e75" strokeWidth={2} fill="none" /><Path d={`M-${size * 0.06},${-size * 0.33} Q0,${-size * 0.25} ${size * 0.06},${-size * 0.27}`} stroke="#155e75" strokeWidth={2} fill="none" /><Ellipse cx={0} cy={-size * 0.28} rx={size * 0.015} ry={size * 0.02} fill="#dc2626" /></G>),
  };
}

function Onion(size: number): PlantDef {
  return {
    seed: (<G><Ellipse cx={0} cy={size * 0.15} rx={size * 0.08} ry={size * 0.05} fill="#8B4513" /></G>),
    sprouting: (<G><Path d={`M0,${size * 0.2} Q${-size * 0.03},${-size * 0.05} ${-size * 0.06},${-size * 0.15}`} stroke="#4ade80" strokeWidth={1.5} fill="none" strokeLinecap="round" /><Path d={`M0,${size * 0.2} Q${size * 0.03},${-size * 0.05} ${size * 0.06},${-size * 0.15}`} stroke="#4ade80" strokeWidth={1.5} fill="none" strokeLinecap="round" /></G>),
    growing: (<G><Path d={`M0,${size * 0.25} L0,${-size * 0.15}`} stroke="#22c55e" strokeWidth={2} strokeLinecap="round" /><Path d={`M-${size * 0.02},${-size * 0.05} Q${-size * 0.12},${-size * 0.1} ${-size * 0.1},${-size * 0.18}`} stroke="#22c55e" strokeWidth={1.5} fill="none" strokeLinecap="round" /><Path d={`M${size * 0.02},${-size * 0.05} Q${size * 0.12},${-size * 0.1} ${size * 0.1},${-size * 0.18}`} stroke="#22c55e" strokeWidth={1.5} fill="none" strokeLinecap="round" /></G>),
    mature: (<G><Ellipse cx={0} cy={size * 0.05} rx={size * 0.07} ry={size * 0.09} fill="#c084fc" /><Ellipse cx={0} cy={size * 0.05} rx={size * 0.05} ry={size * 0.07} fill="#d8b4fe" opacity={0.5} /><Path d={`M0,${size * 0.05} L0,${-size * 0.35}`} stroke="#22c55e" strokeWidth={2.5} strokeLinecap="round" /><Path d={`M-${size * 0.02},${-size * 0.1} Q${-size * 0.15},${-size * 0.15} ${-size * 0.12},${-size * 0.25}`} stroke="#22c55e" strokeWidth={2} fill="none" strokeLinecap="round" /><Path d={`M${size * 0.02},${-size * 0.1} Q${size * 0.15},${-size * 0.15} ${size * 0.12},${-size * 0.25}`} stroke="#22c55e" strokeWidth={2} fill="none" strokeLinecap="round" /><Ellipse cx={-size * 0.12} cy={-size * 0.25} rx={size * 0.06} ry={size * 0.04} fill="#22c55e" /><Ellipse cx={size * 0.12} cy={-size * 0.25} rx={size * 0.06} ry={size * 0.04} fill="#22c55e" /><Path d={`M0,${-size * 0.15} Q${-size * 0.08},${-size * 0.2} ${-size * 0.06},${-size * 0.3}`} stroke="#22c55e" strokeWidth={1.5} fill="none" strokeLinecap="round" /></G>),
  };
}

function Broccoli(size: number): PlantDef {
  return {
    seed: (<G><Ellipse cx={0} cy={size * 0.15} rx={size * 0.08} ry={size * 0.05} fill="#8B4513" /></G>),
    sprouting: (<G><Path d={`M0,${size * 0.2} Q${-size * 0.05},${-size * 0.05} ${-size * 0.1},${-size * 0.15}`} stroke="#4ade80" strokeWidth={2} fill="none" strokeLinecap="round" /><Path d={`M0,${size * 0.2} Q${size * 0.05},${-size * 0.05} ${size * 0.1},${-size * 0.15}`} stroke="#4ade80" strokeWidth={2} fill="none" strokeLinecap="round" /><Ellipse cx={-size * 0.1} cy={-size * 0.15} rx={size * 0.06} ry={size * 0.04} fill="#4ade80" /><Ellipse cx={size * 0.1} cy={-size * 0.15} rx={size * 0.06} ry={size * 0.04} fill="#4ade80" /></G>),
    growing: (<G><Path d={`M0,${size * 0.25} L0,${-size * 0.15}`} stroke="#22c55e" strokeWidth={3} strokeLinecap="round" /><Path d={`M0,${-size * 0.05} Q${-size * 0.18},${-size * 0.1} ${-size * 0.15},${-size * 0.18}`} stroke="#22c55e" strokeWidth={2.5} fill="none" strokeLinecap="round" /><Path d={`M0,${-size * 0.05} Q${size * 0.18},${-size * 0.1} ${size * 0.15},${-size * 0.18}`} stroke="#22c55e" strokeWidth={2.5} fill="none" strokeLinecap="round" /><Ellipse cx={-size * 0.15} cy={-size * 0.18} rx={size * 0.09} ry={size * 0.06} fill="#22c55e" /><Ellipse cx={size * 0.15} cy={-size * 0.18} rx={size * 0.09} ry={size * 0.06} fill="#22c55e" /></G>),
    mature: (<G><Path d={`M0,${size * 0.3} L0,${-size * 0.2}`} stroke="#15803d" strokeWidth={3.5} strokeLinecap="round" /><Path d={`M0,${-size * 0.05} Q${-size * 0.22},${-size * 0.12} ${-size * 0.18},${-size * 0.22}`} stroke="#15803d" strokeWidth={2.5} fill="none" strokeLinecap="round" /><Path d={`M0,${-size * 0.05} Q${size * 0.22},${-size * 0.12} ${size * 0.18},${-size * 0.22}`} stroke="#15803d" strokeWidth={2.5} fill="none" strokeLinecap="round" /><Ellipse cx={-size * 0.18} cy={-size * 0.22} rx={size * 0.1} ry={size * 0.07} fill="#15803d" /><Ellipse cx={size * 0.18} cy={-size * 0.22} rx={size * 0.1} ry={size * 0.07} fill="#15803d" /><Circle cx={0} cy={-size * 0.32} r={size * 0.09} fill="#166534" /><Circle cx={-size * 0.05} cy={-size * 0.28} r={size * 0.05} fill="#15803d" /><Circle cx={size * 0.05} cy={-size * 0.28} r={size * 0.05} fill="#15803d" /><Circle cx={0} cy={-size * 0.38} r={size * 0.05} fill="#15803d" /><Circle cx={-size * 0.07} cy={-size * 0.34} r={size * 0.04} fill="#166534" /><Circle cx={size * 0.07} cy={-size * 0.34} r={size * 0.04} fill="#166534" /></G>),
  };
}

function Mint(size: number): PlantDef {
  return {
    seed: (<G><Ellipse cx={0} cy={size * 0.15} rx={size * 0.08} ry={size * 0.05} fill="#8B4513" /></G>),
    sprouting: (<G><Path d={`M0,${size * 0.2} Q${-size * 0.05},${-size * 0.05} ${-size * 0.1},${-size * 0.15}`} stroke="#4ade80" strokeWidth={2} fill="none" strokeLinecap="round" /><Path d={`M0,${size * 0.2} Q${size * 0.05},${-size * 0.05} ${size * 0.1},${-size * 0.15}`} stroke="#4ade80" strokeWidth={2} fill="none" strokeLinecap="round" /><Ellipse cx={-size * 0.1} cy={-size * 0.15} rx={size * 0.06} ry={size * 0.04} fill="#4ade80" /><Ellipse cx={size * 0.1} cy={-size * 0.15} rx={size * 0.06} ry={size * 0.04} fill="#4ade80" /></G>),
    growing: (<G><Path d={`M0,${size * 0.25} L0,${-size * 0.15}`} stroke="#22c55e" strokeWidth={2.5} strokeLinecap="round" /><Path d={`M0,${0} Q${-size * 0.2},${-size * 0.05} ${-size * 0.18},${-size * 0.15}`} stroke="#22c55e" strokeWidth={2} fill="none" strokeLinecap="round" /><Path d={`M0,${0} Q${size * 0.2},${-size * 0.05} ${size * 0.18},${-size * 0.15}`} stroke="#22c55e" strokeWidth={2} fill="none" strokeLinecap="round" /><Ellipse cx={-size * 0.18} cy={-size * 0.15} rx={size * 0.1} ry={size * 0.06} fill="#22c55e" /><Ellipse cx={size * 0.18} cy={-size * 0.15} rx={size * 0.1} ry={size * 0.06} fill="#22c55e" /></G>),
    mature: (<G><Path d={`M0,${size * 0.3} L0,${-size * 0.25}`} stroke="#15803d" strokeWidth={3} strokeLinecap="round" /><Path d={`M0,${-size * 0.05} Q${-size * 0.25},${-size * 0.1} ${-size * 0.22},${-size * 0.2}`} stroke="#15803d" strokeWidth={2.5} fill="none" strokeLinecap="round" /><Path d={`M0,${-size * 0.05} Q${size * 0.25},${-size * 0.1} ${size * 0.22},${-size * 0.2}`} stroke="#15803d" strokeWidth={2.5} fill="none" strokeLinecap="round" /><Ellipse cx={-size * 0.22} cy={-size * 0.2} rx={size * 0.12} ry={size * 0.07} fill="#15803d" /><Ellipse cx={size * 0.22} cy={-size * 0.2} rx={size * 0.12} ry={size * 0.07} fill="#15803d" /><Ellipse cx={-size * 0.08} cy={-size * 0.35} rx={size * 0.05} ry={size * 0.03} fill="#a855f7" opacity={0.6} /><Ellipse cx={size * 0.08} cy={-size * 0.35} rx={size * 0.05} ry={size * 0.03} fill="#a855f7" opacity={0.6} /></G>),
  };
}

function Pumpkin(size: number): PlantDef {
  return {
    seed: (<G><Ellipse cx={0} cy={size * 0.15} rx={size * 0.08} ry={size * 0.05} fill="#8B4513" /></G>),
    sprouting: (<G><Path d={`M0,${size * 0.2} Q${-size * 0.05},${-size * 0.05} ${-size * 0.1},${-size * 0.15}`} stroke="#4ade80" strokeWidth={2} fill="none" strokeLinecap="round" /><Path d={`M0,${size * 0.2} Q${size * 0.05},${-size * 0.05} ${size * 0.1},${-size * 0.15}`} stroke="#4ade80" strokeWidth={2} fill="none" strokeLinecap="round" /><Ellipse cx={-size * 0.1} cy={-size * 0.15} rx={size * 0.06} ry={size * 0.04} fill="#4ade80" /><Ellipse cx={size * 0.1} cy={-size * 0.15} rx={size * 0.06} ry={size * 0.04} fill="#4ade80" /></G>),
    growing: (<G><Path d={`M0,${size * 0.25} L0,${-size * 0.1}`} stroke="#22c55e" strokeWidth={2.5} strokeLinecap="round" /><Path d={`M0,${0} Q${-size * 0.22},${-size * 0.05} ${-size * 0.2},${-size * 0.15}`} stroke="#22c55e" strokeWidth={2} fill="none" strokeLinecap="round" /><Path d={`M0,${0} Q${size * 0.22},${-size * 0.05} ${size * 0.2},${-size * 0.15}`} stroke="#22c55e" strokeWidth={2} fill="none" strokeLinecap="round" /><Ellipse cx={-size * 0.2} cy={-size * 0.15} rx={size * 0.1} ry={size * 0.06} fill="#22c55e" /><Ellipse cx={size * 0.2} cy={-size * 0.15} rx={size * 0.1} ry={size * 0.06} fill="#22c55e" /></G>),
    mature: (<G><Path d={`M0,${size * 0.3} L0,${-size * 0.1}`} stroke="#15803d" strokeWidth={3} strokeLinecap="round" /><Path d={`M0,${-size * 0.05} Q${-size * 0.25},${-size * 0.1} ${-size * 0.22},${-size * 0.2}`} stroke="#15803d" strokeWidth={2.5} fill="none" strokeLinecap="round" /><Path d={`M0,${-size * 0.05} Q${size * 0.25},${-size * 0.1} ${size * 0.22},${-size * 0.2}`} stroke="#15803d" strokeWidth={2.5} fill="none" strokeLinecap="round" /><Ellipse cx={-size * 0.22} cy={-size * 0.2} rx={size * 0.11} ry={size * 0.07} fill="#15803d" /><Ellipse cx={size * 0.22} cy={-size * 0.2} rx={size * 0.11} ry={size * 0.07} fill="#15803d" /><Ellipse cx={0} cy={-size * 0.32} rx={size * 0.12} ry={size * 0.09} fill="#f97316" /><Ellipse cx={0} cy={-size * 0.32} rx={size * 0.1} ry={size * 0.075} fill="#fb923c" opacity={0.5} /><Path d={`M-${size * 0.04},${-size * 0.32} Q0,${-size * 0.38} ${size * 0.04},${-size * 0.32}`} stroke="#d97706" strokeWidth={1.5} fill="none" /></G>),
  };
}

function Potato(size: number): PlantDef {
  return {
    seed: (<G><Ellipse cx={0} cy={size * 0.15} rx={size * 0.08} ry={size * 0.05} fill="#8B4513" /></G>),
    sprouting: (<G><Path d={`M0,${size * 0.2} Q${-size * 0.05},${-size * 0.05} ${-size * 0.1},${-size * 0.15}`} stroke="#4ade80" strokeWidth={2} fill="none" strokeLinecap="round" /><Path d={`M0,${size * 0.2} Q${size * 0.05},${-size * 0.05} ${size * 0.1},${-size * 0.15}`} stroke="#4ade80" strokeWidth={2} fill="none" strokeLinecap="round" /><Ellipse cx={-size * 0.1} cy={-size * 0.15} rx={size * 0.06} ry={size * 0.04} fill="#4ade80" /><Ellipse cx={size * 0.1} cy={-size * 0.15} rx={size * 0.06} ry={size * 0.04} fill="#4ade80" /></G>),
    growing: (<G><Path d={`M0,${size * 0.25} L0,${-size * 0.12}`} stroke="#22c55e" strokeWidth={2.5} strokeLinecap="round" /><Path d={`M0,${-size * 0.02} Q${-size * 0.18},${-size * 0.08} ${-size * 0.15},${-size * 0.15}`} stroke="#22c55e" strokeWidth={2} fill="none" strokeLinecap="round" /><Path d={`M0,${-size * 0.02} Q${size * 0.18},${-size * 0.08} ${size * 0.15},${-size * 0.15}`} stroke="#22c55e" strokeWidth={2} fill="none" strokeLinecap="round" /><Ellipse cx={-size * 0.15} cy={-size * 0.15} rx={size * 0.09} ry={size * 0.06} fill="#22c55e" /><Ellipse cx={size * 0.15} cy={-size * 0.15} rx={size * 0.09} ry={size * 0.06} fill="#22c55e" /></G>),
    mature: (<G><Path d={`M0,${size * 0.3} L0,${-size * 0.25}`} stroke="#15803d" strokeWidth={3} strokeLinecap="round" /><Path d={`M0,${-size * 0.05} Q${-size * 0.22},${-size * 0.12} ${-size * 0.2},${-size * 0.2}`} stroke="#15803d" strokeWidth={2.5} fill="none" strokeLinecap="round" /><Path d={`M0,${-size * 0.05} Q${size * 0.22},${-size * 0.12} ${size * 0.2},${-size * 0.2}`} stroke="#15803d" strokeWidth={2.5} fill="none" strokeLinecap="round" /><Ellipse cx={-size * 0.2} cy={-size * 0.2} rx={size * 0.11} ry={size * 0.07} fill="#15803d" /><Ellipse cx={size * 0.2} cy={-size * 0.2} rx={size * 0.11} ry={size * 0.07} fill="#15803d" /><Ellipse cx={-size * 0.06} cy={size * 0.05} rx={size * 0.04} ry={size * 0.03} fill="#d4a574" /><Ellipse cx={size * 0.06} cy={size * 0.05} rx={size * 0.045} ry={size * 0.035} fill="#c4956a" /><Ellipse cx={0} cy={size * 0.08} rx={size * 0.05} ry={size * 0.035} fill="#d4a574" /><Circle cx={-size * 0.06} cy={size * 0.045} r={size * 0.015} fill="#a0724a" /></G>),
  };
}

function GreenBean(size: number): PlantDef {
  return {
    seed: (<G><Ellipse cx={0} cy={size * 0.15} rx={size * 0.08} ry={size * 0.05} fill="#8B4513" /></G>),
    sprouting: (<G><Path d={`M0,${size * 0.2} Q${-size * 0.05},${-size * 0.05} ${-size * 0.1},${-size * 0.15}`} stroke="#4ade80" strokeWidth={2} fill="none" strokeLinecap="round" /><Path d={`M0,${size * 0.2} Q${size * 0.05},${-size * 0.05} ${size * 0.1},${-size * 0.15}`} stroke="#4ade80" strokeWidth={2} fill="none" strokeLinecap="round" /><Ellipse cx={-size * 0.1} cy={-size * 0.15} rx={size * 0.06} ry={size * 0.04} fill="#4ade80" /><Ellipse cx={size * 0.1} cy={-size * 0.15} rx={size * 0.06} ry={size * 0.04} fill="#4ade80" /></G>),
    growing: (<G><Path d={`M0,${size * 0.25} L0,${-size * 0.2}`} stroke="#22c55e" strokeWidth={2} strokeLinecap="round" /><Path d={`M0,${-size * 0.05} Q${-size * 0.18},${-size * 0.1} ${-size * 0.15},${-size * 0.18}`} stroke="#22c55e" strokeWidth={2} fill="none" strokeLinecap="round" /><Path d={`M0,${-size * 0.05} Q${size * 0.18},${-size * 0.1} ${size * 0.15},${-size * 0.18}`} stroke="#22c55e" strokeWidth={2} fill="none" strokeLinecap="round" /><Ellipse cx={-size * 0.15} cy={-size * 0.18} rx={size * 0.08} ry={size * 0.05} fill="#22c55e" /><Ellipse cx={size * 0.15} cy={-size * 0.18} rx={size * 0.08} ry={size * 0.05} fill="#22c55e" /></G>),
    mature: (<G><Path d={`M0,${size * 0.3} L0,${-size * 0.35}`} stroke="#15803d" strokeWidth={2} strokeLinecap="round" /><Path d={`M0,${-size * 0.05} Q${-size * 0.2},${-size * 0.12} ${-size * 0.18},${-size * 0.22}`} stroke="#15803d" strokeWidth={2} fill="none" strokeLinecap="round" /><Path d={`M0,${-size * 0.05} Q${size * 0.2},${-size * 0.12} ${size * 0.18},${-size * 0.22}`} stroke="#15803d" strokeWidth={2} fill="none" strokeLinecap="round" /><Ellipse cx={-size * 0.18} cy={-size * 0.22} rx={size * 0.09} ry={size * 0.06} fill="#15803d" /><Ellipse cx={size * 0.18} cy={-size * 0.22} rx={size * 0.09} ry={size * 0.06} fill="#15803d" /><Path d={`M0,${-size * 0.05} L0,${-size * 0.35}`} stroke="#65a30d" strokeWidth={1.5} strokeLinecap="round" /><Ellipse cx={-size * 0.04} cy={-size * 0.32} rx={size * 0.025} ry={size * 0.06} fill="#65a30d" /><Ellipse cx={size * 0.04} cy={-size * 0.28} rx={size * 0.025} ry={size * 0.055} fill="#65a30d" /><Ellipse cx={0} cy={-size * 0.24} rx={size * 0.025} ry={size * 0.05} fill="#4d7c0f" /></G>),
  };
}

function Blueberry(size: number): PlantDef {
  return {
    seed: (<G><Ellipse cx={0} cy={size * 0.15} rx={size * 0.08} ry={size * 0.05} fill="#8B4513" /></G>),
    sprouting: (<G><Path d={`M0,${size * 0.2} Q${-size * 0.05},${-size * 0.05} ${-size * 0.1},${-size * 0.15}`} stroke="#4ade80" strokeWidth={2} fill="none" strokeLinecap="round" /><Path d={`M0,${size * 0.2} Q${size * 0.05},${-size * 0.05} ${size * 0.1},${-size * 0.15}`} stroke="#4ade80" strokeWidth={2} fill="none" strokeLinecap="round" /><Ellipse cx={-size * 0.1} cy={-size * 0.15} rx={size * 0.06} ry={size * 0.04} fill="#4ade80" /><Ellipse cx={size * 0.1} cy={-size * 0.15} rx={size * 0.06} ry={size * 0.04} fill="#4ade80" /></G>),
    growing: (<G><Path d={`M0,${size * 0.25} L0,${-size * 0.15}`} stroke="#22c55e" strokeWidth={2.5} strokeLinecap="round" /><Path d={`M0,${0} Q${-size * 0.2},${-size * 0.05} ${-size * 0.18},${-size * 0.15}`} stroke="#22c55e" strokeWidth={2} fill="none" strokeLinecap="round" /><Path d={`M0,${0} Q${size * 0.2},${-size * 0.05} ${size * 0.18},${-size * 0.15}`} stroke="#22c55e" strokeWidth={2} fill="none" strokeLinecap="round" /><Ellipse cx={-size * 0.18} cy={-size * 0.15} rx={size * 0.1} ry={size * 0.06} fill="#22c55e" /><Ellipse cx={size * 0.18} cy={-size * 0.15} rx={size * 0.1} ry={size * 0.06} fill="#22c55e" /></G>),
    mature: (<G><Path d={`M0,${size * 0.3} L0,${-size * 0.2}`} stroke="#15803d" strokeWidth={3} strokeLinecap="round" /><Path d={`M0,${-size * 0.05} Q${-size * 0.22},${-size * 0.1} ${-size * 0.2},${-size * 0.2}`} stroke="#15803d" strokeWidth={2.5} fill="none" strokeLinecap="round" /><Path d={`M0,${-size * 0.05} Q${size * 0.22},${-size * 0.1} ${size * 0.2},${-size * 0.2}`} stroke="#15803d" strokeWidth={2.5} fill="none" strokeLinecap="round" /><Ellipse cx={-size * 0.2} cy={-size * 0.2} rx={size * 0.11} ry={size * 0.07} fill="#15803d" /><Ellipse cx={size * 0.2} cy={-size * 0.2} rx={size * 0.11} ry={size * 0.07} fill="#15803d" /><Circle cx={-size * 0.03} cy={-size * 0.32} r={size * 0.05} fill="#3b82f6" /><Circle cx={size * 0.06} cy={-size * 0.3} r={size * 0.04} fill="#2563eb" /><Circle cx={-size * 0.07} cy={-size * 0.28} r={size * 0.035} fill="#1d4ed8" /><Circle cx={size * 0.02} cy={-size * 0.26} r={size * 0.03} fill="#3b82f6" /></G>),
  };
}

function Lemon(size: number): PlantDef {
  return {
    seed: (<G><Ellipse cx={0} cy={size * 0.15} rx={size * 0.08} ry={size * 0.05} fill="#8B4513" /></G>),
    sprouting: (<G><Path d={`M0,${size * 0.2} Q${-size * 0.05},${-size * 0.05} ${-size * 0.1},${-size * 0.15}`} stroke="#4ade80" strokeWidth={2} fill="none" strokeLinecap="round" /><Path d={`M0,${size * 0.2} Q${size * 0.05},${-size * 0.05} ${size * 0.1},${-size * 0.15}`} stroke="#4ade80" strokeWidth={2} fill="none" strokeLinecap="round" /><Ellipse cx={-size * 0.1} cy={-size * 0.15} rx={size * 0.06} ry={size * 0.04} fill="#4ade80" /><Ellipse cx={size * 0.1} cy={-size * 0.15} rx={size * 0.06} ry={size * 0.04} fill="#4ade80" /></G>),
    growing: (<G><Path d={`M0,${size * 0.25} L0,${-size * 0.2}`} stroke="#15803d" strokeWidth={3} strokeLinecap="round" /><Path d={`M0,${-size * 0.05} Q${-size * 0.2},${-size * 0.12} ${-size * 0.18},${-size * 0.2}`} stroke="#15803d" strokeWidth={2.5} fill="none" strokeLinecap="round" /><Path d={`M0,${-size * 0.05} Q${size * 0.2},${-size * 0.12} ${size * 0.18},${-size * 0.2}`} stroke="#15803d" strokeWidth={2.5} fill="none" strokeLinecap="round" /><Ellipse cx={-size * 0.18} cy={-size * 0.2} rx={size * 0.1} ry={size * 0.06} fill="#15803d" /><Ellipse cx={size * 0.18} cy={-size * 0.2} rx={size * 0.1} ry={size * 0.06} fill="#15803d" /></G>),
    mature: (<G><Path d={`M0,${size * 0.3} L0,${-size * 0.35}`} stroke="#78350f" strokeWidth={3} strokeLinecap="round" /><Path d={`M0,${-size * 0.08} Q${-size * 0.22},${-size * 0.15} ${-size * 0.2},${-size * 0.25}`} stroke="#15803d" strokeWidth={2.5} fill="none" strokeLinecap="round" /><Path d={`M0,${-size * 0.08} Q${size * 0.22},${-size * 0.15} ${size * 0.2},${-size * 0.25}`} stroke="#15803d" strokeWidth={2.5} fill="none" strokeLinecap="round" /><Ellipse cx={-size * 0.2} cy={-size * 0.25} rx={size * 0.1} ry={size * 0.07} fill="#15803d" /><Ellipse cx={size * 0.2} cy={-size * 0.25} rx={size * 0.1} ry={size * 0.07} fill="#15803d" /><Ellipse cx={-size * 0.07} cy={-size * 0.35} rx={size * 0.05} ry={size * 0.065} fill="#facc15" /><Ellipse cx={size * 0.07} cy={-size * 0.38} rx={size * 0.045} ry={size * 0.06} fill="#eab308" /><Ellipse cx={0} cy={-size * 0.32} rx={size * 0.04} ry={size * 0.05} fill="#fde047" /></G>),
  };
}

function AloeVera(size: number): PlantDef {
  return {
    seed: (<G><Ellipse cx={0} cy={size * 0.15} rx={size * 0.08} ry={size * 0.05} fill="#8B4513" /></G>),
    sprouting: (<G><Path d={`M0,${size * 0.2} L0,${-size * 0.1}`} stroke="#4ade80" strokeWidth={2} strokeLinecap="round" /><Path d={`M0,${-size * 0.1} L${-size * 0.06},${-size * 0.05} M0,${-size * 0.1} L${size * 0.06},${-size * 0.05}`} stroke="#4ade80" strokeWidth={1.5} fill="none" strokeLinecap="round" /></G>),
    growing: (<G><Path d={`M0,${size * 0.25} L0,${-size * 0.05}`} stroke="#15803d" strokeWidth={3} strokeLinecap="round" /><Path d={`M0,${0} L${-size * 0.12},${-size * 0.15} M0,${0} L${size * 0.12},${-size * 0.15}`} stroke="#15803d" strokeWidth={3} strokeLinecap="round" /><Path d={`M0,${-size * 0.05} L0,${-size * 0.2}`} stroke="#15803d" strokeWidth={2.5} strokeLinecap="round" /></G>),
    mature: (<G><Path d={`M0,${size * 0.3} L0,${-size * 0.05}`} stroke="#166534" strokeWidth={3.5} strokeLinecap="round" /><Path d={`M0,${0} L${-size * 0.16},${-size * 0.2} M0,${0} L${size * 0.16},${-size * 0.2}`} stroke="#166534" strokeWidth={3.5} strokeLinecap="round" /><Path d={`M0,${-size * 0.05} L0,${-size * 0.35}`} stroke="#166534" strokeWidth={3} strokeLinecap="round" /><Path d={`M-${size * 0.05},${-size * 0.15} L${-size * 0.08},${-size * 0.28} M${size * 0.05},${-size * 0.15} L${size * 0.08},${-size * 0.28}`} stroke="#166534" strokeWidth={2.5} strokeLinecap="round" /><Ellipse cx={-size * 0.16} cy={-size * 0.2} rx={size * 0.04} ry={size * 0.13} fill="#22c55e" transform={`rotate(-30, ${-size * 0.16}, ${-size * 0.2})`} /><Ellipse cx={size * 0.16} cy={-size * 0.2} rx={size * 0.04} ry={size * 0.13} fill="#22c55e" transform={`rotate(30, ${size * 0.16}, ${-size * 0.2})`} /><Ellipse cx={0} cy={-size * 0.35} rx={size * 0.035} ry={size * 0.12} fill="#15803d" /></G>),
  };
}

function Mushroom(size: number): PlantDef {
  return {
    seed: (<G><Ellipse cx={0} cy={size * 0.15} rx={size * 0.08} ry={size * 0.05} fill="#8B4513" /></G>),
    sprouting: (<G><Path d={`M0,${size * 0.2} L0,${-size * 0.08}`} stroke="#d4d4d4" strokeWidth={2} strokeLinecap="round" /><Ellipse cx={0} cy={-size * 0.08} rx={size * 0.06} ry={size * 0.04} fill="#e5e5e5" /></G>),
    growing: (<G><Path d={`M0,${size * 0.25} L0,${-size * 0.12}`} stroke="#d4d4d4" strokeWidth={2.5} strokeLinecap="round" /><Ellipse cx={0} cy={-size * 0.12} rx={size * 0.09} ry={size * 0.055} fill="#e5e5e5" /><Ellipse cx={-size * 0.04} cy={-size * 0.1} rx={size * 0.015} ry={size * 0.01} fill="#a3a3a3" /><Ellipse cx={size * 0.03} cy={-size * 0.14} rx={size * 0.012} ry={size * 0.008} fill="#a3a3a3" /></G>),
    mature: (<G><Path d={`M0,${size * 0.3} L0,${-size * 0.15}`} stroke="#d4d4d4" strokeWidth={3} strokeLinecap="round" /><Path d={`M0,${-size * 0.05} L${-size * 0.03},${-size * 0.15} M0,${-size * 0.05} L${size * 0.03},${-size * 0.15}`} stroke="#d4d4d4" strokeWidth={1.5} fill="none" strokeLinecap="round" /><Ellipse cx={0} cy={-size * 0.22} rx={size * 0.13} ry={size * 0.08} fill="#e5e5e5" /><Ellipse cx={0} cy={-size * 0.2} rx={size * 0.11} ry={size * 0.06} fill="#f5f5f5" /><Ellipse cx={0} cy={-size * 0.25} rx={size * 0.1} ry={size * 0.05} fill="#f87171" /><Circle cx={-size * 0.04} cy={-size * 0.25} r={size * 0.015} fill="#fff" /><Circle cx={size * 0.05} cy={-size * 0.24} r={size * 0.012} fill="#fff" /><Circle cx={0} cy={-size * 0.27} r={size * 0.01} fill="#fff" /></G>),
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
    case "chilli":
      return Chilli(size);
    case "turmeric":
      return Turmeric(size);
    case "rice":
      return Rice(size);
    case "okra":
      return Okra(size);
    case "brinjal":
      return Brinjal(size);
    case "eggplant":
      return Brinjal(size);
    case "corn":
    case "sweet corn":
      return Corn(size);
    case "watermelon":
      return Watermelon(size);
    case "onion":
      return Onion(size);
    case "broccoli":
      return Broccoli(size);
    case "mint":
    case "cilantro":
      return Mint(size);
    case "pumpkin":
    case "squash":
      return Pumpkin(size);
    case "potato":
      return Potato(size);
    case "green bean":
    case "grape":
      return GreenBean(size);
    case "blueberry":
      return Blueberry(size);
    case "lemon":
      return Lemon(size);
    case "aloe vera":
      return AloeVera(size);
    case "mushroom":
      return Mushroom(size);
    case "spinach":
    case "kale":
    case "thyme":
    case "tea plant":
    case "sage":
      return LeafyGreen(size);
    case "rosemary":
      return Basil(size);
    case "radish":
      return Carrot(size);
    case "lily":
    case "daisy":
      return Sunflower(size);
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
