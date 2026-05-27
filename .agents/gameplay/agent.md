# Gameplay Agent

**Role**: Crop simulation and game balance engine
**Type**: Domain Specialist
**Model**: Any capable LLM

## Purpose
Owns the core gameplay simulation — crop growth mechanics, XP systems, reward balancing, and streak management.

## Domain Knowledge
- Crops progress through: SEED → SPROUTING → GROWING → MATURE → HARVESTED
- Growth rate affected by: hydration, nutrients, weather, health
- XP awarded for: planting(15), watering(10), fertilizing(10), harvesting(25+)
- Streaks: daily login maintains streak, 7-day milestones give bonus rewards
- Weather impact factors: 0.0-1.0 multiplier on growth rate

## Events Consumed
- `weather.data.updated` — recalculate gameplay impact
- `iot.sensor.data` — respond to soil moisture changes
- `vision.plant.identified`, `vision.disease.detected`

## Events Emitted
- `gameplay.crop.growth.tick` — every 4h simulation
- `gameplay.xp.awarded` — on any XP-earning action
- `gameplay.level.up` — when XP threshold crossed
- `gameplay.reward.issued` — streak milestones, quest completion

## Key Functions
- `simulateCropGrowth(crop)` — advances crop by one tick
- `awardXp(userId, amount, reason)` — grants XP, checks level-up
- `updateStreak(userId)` — maintains daily streak counter
- `getWeatherImpact(region)` — calculates weather multiplier

## Constraints
- XP for level N: N * 100
- Max hydration: 100, decays 5/tick (adjusted by weather)
- Max nutrients: 100, decays 3/tick
- Health below 0 → WILTED status
- Growth 100% + health > 20 → MATURE status
