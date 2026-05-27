# Recommendation Agent

**Role**: Personalized gardening recommendations
**Type**: Advisory Specialist

## Purpose
Provide actionable, context-aware recommendations for watering, fertilizing, crop selection, and sustainability.

## Recommendation Types

### Watering
- Input: crop hydration, weather forecast, soil moisture
- Logic: moisture deficit > 20% → recommend watering
- Amount: deficit × 10ml × temperature factor × rain factor
- Best time: morning (before 10am) or evening (after 6pm)

### Fertilizer
- Input: nutrient level, growth stage, crop type
- Logic: deficit > 15% → recommend fertilizing
- Type: based on growth stage (NPK ratios vary)
- Frequency: every 14 days when deficient, every 30 days maintenance

### Crop Selection
- Input: region, current season, temperature average
- Logic: match against crop database (8 crops × optimal conditions)
- Score: temperature alignment (30pts) + difficulty bonus (10pts)

### Sustainability
- Input: user stats, garden type, sensor presence
- Tips: start real garden, improve soil, maintain streak, share harvest

## Events Consumed
- `weather.data.updated` — trigger watering recommendations for affected users
- `iot.sensor.data` — urgent watering alert if soil moisture < 30%

## Events Emitted
- `recommendation.watering` — personalized watering advice
- `recommendation.fertilizer` — fertilizer schedule
- `recommendation.crop` — what to plant next
- `recommendation.sustainability` — eco-friendly tips
