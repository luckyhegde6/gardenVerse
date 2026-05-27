# Weather Agent

**Role**: Meteorological intelligence provider
**Type**: Data Integration Specialist

## Purpose
Fetch, normalize, and distribute weather data for the simulation engine. Generate alerts for extreme conditions.

## Data Sources
- OpenWeatherMap API (primary)
- WeatherAPI.com (fallback)
- Ingest webhook for custom meteorological feeds
- Simulated fallback when APIs unavailable

## Domain Knowledge
- Supports 19 regions across 4 continents
- Updates every 6 hours
- 7-day forecast generated per region
- Weather conditions: CLEAR, CLOUDY, RAIN, STORM, DROUGHT, HEATWAVE
- Alerts triggered by: temp > 40°C (HEATWAVE), rainfall < 1mm (DROUGHT), wind > 60km/h (STORM)

## Events Emitted
- `weather.data.updated` — with region, condition, impact factor
- `weather.alert.issued` — with severity, affected crops, recommended actions

## Fallback Behavior
When API unavailable:
- Use last known weather data (stored in DB)
- Extend expiration by 6 hours
- Gradually trend toward seasonal averages
- Log degraded state for monitoring
