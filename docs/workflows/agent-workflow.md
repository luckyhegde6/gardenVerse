# Agent Workflow

## Overview
GardenVerse uses 7 specialized agents coordinated by an orchestrator. Each agent owns a domain and communicates via events.

## Agent Communication Pattern
```
Agent A                  Orchestrator                Agent B
    │                         │                         │
    │── emit(event) ────────►│                         │
    │                         │── event ──────────────►│
    │                         │                         │── process()
    │                         │◄──── ack ──────────────│
    │◄──── ack ──────────────│                         │
```

## Event Flow (Real Example)
```
GameplayAgent                                 WeatherAgent
    │                                              │
    │  (scheduled cron every 6h)                   │
    │                                              │── fetchWeather()
    │                                              │── emit(WEATHER_UPDATED)
    │                                              │
    │◄── WEATHER_UPDATED ─────────────────────────│
    │                                              │
    │── getWeatherImpact(region)                   │
    │── simulateCropGrowth(crops)                  │
    │── emit(CROP_GROWTH_TICK)                     │
    │                                              │
RecommendationAgent                                │
    │                                              │
    │◄── WEATHER_UPDATED ─────────────────────────│
    │                                              │
    │── getWateringRecommendation(users)           │
    │── emit(RECOMMENDATION_WATERING)              │
```

## Agent Lifecycle
```
INIT ──► LISTENING ──► PROCESSING ──► IDLE
            │               │
            ▼               ▼
          ERROR ──────► RETRY ──────► LISTENING
            │
            ▼
         SHUTDOWN
```

## Scaling Rules
| Agent | Scale Trigger | Max Replicas | Resource Profile |
|-------|---------------|-------------|-----------------|
| Gameplay | Per 10K gardens | 10 | 2 CPU / 4GB RAM |
| Weather | Per API rate limit | 3 | 1 CPU / 2GB RAM |
| IoT | Per 10K devices | 20 | 1 CPU / 2GB RAM |
| Vision | GPU dependent | 5 | GPU T4+ / 8GB RAM |
| Marketplace | Per 100K listings | 5 | 2 CPU / 4GB RAM |
| Safety | Per 1M msgs/day | 3 | 4 CPU / 8GB RAM |
| Recommendation | Per 50K users | 3 | 2 CPU / 4GB RAM |

## Health Monitoring
Each agent exports:
- `agent_events_processed_total` — event count
- `agent_processing_duration_seconds` — latency histogram
- `agent_queue_depth` — pending work
- `agent_error_total` — error count
- `agent_last_heartbeat` — liveness
