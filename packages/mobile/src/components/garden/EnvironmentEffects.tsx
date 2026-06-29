import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import { Canvas, Circle, Line, Rect, Fill } from "@shopify/react-native-skia";

type WeatherCondition = "clear" | "rain" | "clouds" | "night" | "storm" | "haze";

interface EnvironmentEffectsProps {
  condition: WeatherCondition;
}

interface Raindrop {
  x: number;
  y: number;
  speed: number;
  length: number;
  opacity: number;
}

interface Cloud {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

interface Star {
  x: number;
  y: number;
  r: number;
  opacity: number;
}

function generateRaindrops(width: number, height: number, count: number): Raindrop[] {
  const drops: Raindrop[] = [];
  for (let i = 0; i < count; i++) {
    drops.push({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: 200 + Math.random() * 400,
      length: 15 + Math.random() * 20,
      opacity: 0.2 + Math.random() * 0.4,
    });
  }
  return drops;
}

function generateClouds(width: number, count: number): Cloud[] {
  const clouds: Cloud[] = [];
  for (let i = 0; i < count; i++) {
    clouds.push({
      x: Math.random() * width,
      y: 20 + Math.random() * 80,
      size: 40 + Math.random() * 60,
      speed: 8 + Math.random() * 12,
      opacity: 0.15 + Math.random() * 0.2,
    });
  }
  return clouds;
}

function generateStars(width: number, height: number, count: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 0.5 + Math.random() * 1.5,
      opacity: 0.3 + Math.random() * 0.7,
    });
  }
  return stars;
}

export function EnvironmentEffects({ condition }: EnvironmentEffectsProps) {
  const { width, height } = useWindowDimensions();
  const raindrops = useRef<Raindrop[]>([]);
  const clouds = useRef<Cloud[]>([]);
  const stars = useRef<Star[]>([]);
  const [time, setTime] = useState(0);
  const [flashVisible, setFlashVisible] = useState(false);

  useEffect(() => {
    raindrops.current = generateRaindrops(width, height, 80);
    clouds.current = generateClouds(width, 3);
    stars.current = generateStars(width, height, 50);
  }, [width, height]);

  useEffect(() => {
    let animId: number;
    let lastTime = Date.now();

    const loop = () => {
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      setTime((t) => t + dt);

      if (condition === "rain" || condition === "storm") {
        const drops = raindrops.current;
        for (let i = 0; i < drops.length; i++) {
          const d = drops[i];
          d.y += d.speed * dt;
          d.x += d.speed * dt * 0.27;
          if (d.y > height) {
            d.y = -d.length;
            d.x = Math.random() * width;
          }
          if (d.x > width) {
            d.x = -10;
          }
        }
      }

      if (condition === "clouds") {
        const c = clouds.current;
        for (let i = 0; i < c.length; i++) {
          c[i].x += c[i].speed * dt;
          if (c[i].x > width + 100) {
            c[i].x = -100;
          }
        }
      }

      if (condition === "storm" && Math.random() < 0.005) {
        setFlashVisible(true);
        setTimeout(() => setFlashVisible(false), 100);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [condition, width, height]);

  const now = time;

  if (condition === "clear") {
    const sunPulse = Math.sin(now * 2) * 0.15 + 0.85;
    return (
      <Canvas style={styles.container} pointerEvents="none">
        <Circle cx={width * 0.8} cy={60} r={45} color={`rgba(251, 191, 36, ${sunPulse * 0.3})`} />
        <Circle cx={width * 0.8} cy={60} r={30} color={`rgba(251, 191, 36, ${sunPulse * 0.5})`} />
        <Circle cx={width * 0.8} cy={60} r={18} color="rgba(251, 191, 36, 0.8)" />
      </Canvas>
    );
  }

  if (condition === "rain") {
    const drops = raindrops.current;
    return (
      <Canvas style={styles.container} pointerEvents="none">
        {drops.map((d, i) => (
          <Line
            key={i}
            p1={{ x: d.x, y: d.y }}
            p2={{ x: d.x + 10, y: d.y - d.length }}
            color={`rgba(148, 199, 255, ${d.opacity})`}
            style="stroke"
            strokeWidth={1}
          />
        ))}
      </Canvas>
    );
  }

  if (condition === "clouds") {
    const c = clouds.current;
    return (
      <Canvas style={styles.container} pointerEvents="none">
        {c.map((cloud, i) => (
          <React.Fragment key={i}>
            <Circle cx={cloud.x} cy={cloud.y} r={cloud.size * 0.6} color={`rgba(255, 255, 255, ${cloud.opacity})`} />
            <Circle cx={cloud.x + cloud.size * 0.5} cy={cloud.y - cloud.size * 0.15} r={cloud.size * 0.5} color={`rgba(255, 255, 255, ${cloud.opacity * 1.1})`} />
            <Circle cx={cloud.x + cloud.size} cy={cloud.y} r={cloud.size * 0.4} color={`rgba(255, 255, 255, ${cloud.opacity})`} />
          </React.Fragment>
        ))}
      </Canvas>
    );
  }

  if (condition === "night") {
    const s = stars.current;
    return (
      <Canvas style={styles.container} pointerEvents="none">
        <Fill color="rgba(15, 23, 42, 0.5)" />
        {s.map((star, i) => (
          <Circle
            key={i}
            cx={star.x}
            cy={star.y}
            r={star.r}
            color={`rgba(255, 255, 255, ${star.opacity})`}
          />
        ))}
      </Canvas>
    );
  }

  if (condition === "storm") {
    const drops = raindrops.current;
    const s = stars.current;
    return (
      <Canvas style={styles.container} pointerEvents="none">
        {drops.map((d, i) => (
          <Line
            key={i}
            p1={{ x: d.x, y: d.y }}
            p2={{ x: d.x + 10, y: d.y - d.length }}
            color={`rgba(148, 199, 255, ${d.opacity})`}
            style="stroke"
            strokeWidth={1.5}
          />
        ))}
        {flashVisible ? (
          <Rect x={0} y={0} width={width} height={height} color="rgba(255, 255, 255, 0.3)" />
        ) : null}
        <Fill color="rgba(15, 23, 42, 0.2)" />
        {s.slice(0, 10).map((star, i) => (
          <Circle
            key={i}
            cx={star.x}
            cy={star.y}
            r={star.r}
            color={`rgba(255, 255, 255, ${star.opacity * 0.5})`}
          />
        ))}
      </Canvas>
    );
  }

  return (
    <Canvas style={styles.container} pointerEvents="none">
      <Fill color="rgba(148, 163, 184, 0.25)" />
    </Canvas>
  );
}

export default EnvironmentEffects;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
