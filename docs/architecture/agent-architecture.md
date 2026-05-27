# GardenVerse Agent Architecture

## Why Agents Instead of Modules?

The current modular monolith architecture is sufficient for MVP but creates coupling that prevents independent scaling. Agent-based architecture solves this by:

- **Domain Autonomy**: Each agent owns its data and logic completely
- **Event-Driven Communication**: Agents never import each other directly — they emit and consume events
- **Independent Scaling**: High-load agents (IoT, AI Vision) scale independently from low-load agents (Gameplay, Community)
- **Isolated Failure**: One agent crashing doesn't cascade to others
- **Language Agnostic**: Agents can be rewritten in different languages if needed

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   API Gateway                       │
│          (NestJS Controllers — thin layer)           │
└──────────┬──────────┬──────────┬────────────────────┘
           │          │          │
           ▼          ▼          ▼
┌─────────────────────────────────────────────────────┐
│              Message Broker (Redis/BullMQ)           │
│         Events: domain.action.type                  │
│         Queues: agent.<name>.task                    │
└──┬──────────┬──────────┬──────────┬─────────────────┘
   │          │          │          │
   ▼          ▼          ▼          ▼
┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     ┌──────────┐
│Game- │ │Weath-│ │ IoT  │ │Vision│ ... │Recommen- │
│play  │ │er    │ │Agent │ │Agent │     │dation    │
│Agent │ │Agent │ │      │ │      │     │Agent     │
└──┬───┘ └──┬───┘ └──┬───┘ └──┬───┘     └────┬─────┘
   │        │        │        │               │
   └────────┴────────┴────────┴───────────────┘
                      │
                      ▼
           ┌──────────────────┐
           │   Data Layer     │
           │  (Postgres/Redis)│
           └──────────────────┘
```

## Agent Communication Protocol

Every agent follows the same protocol:

1. **Listen**: Subscribe to relevant events via BullMQ queue
2. **Process**: Execute domain logic, potentially querying database
3. **Emit**: Publish result events for other agents to consume
4. **Store**: Persist state changes to database

### Event Contract Format

```typescript
interface AgentEvent<T = unknown> {
  id: string;              // UUID v4
  source: string;          // agent name: 'gameplay', 'weather', etc.
  type: string;            // 'domain.action.type'
  version: number;         // schema version for forward compat
  timestamp: string;       // ISO 8601
  payload: T;
  traceId: string;         // distributed tracing
  correlationId?: string;  // for request-response patterns
}
```

### Event Catalogue

```
gameplay.crop.planted      → weather.simulate, recommendation.optimize
gameplay.crop.watered      → gameplay.simulate
gameplay.crop.harvested    → marketplace.list, reputation.update
gameplay.xp.awarded        → gameplay.level.check
gameplay.level.up          → reputation.update, invite.check

weather.data.updated       → gameplay.simulate, recommendation.optimize
weather.alert.issued       → notifications.send, gameplay.simulate

iot.sensor.data            → gameplay.simulate, vision.analyze
iot.device.online          → gameplay.simulate
iot.device.offline         → gameplay.simulate
iot.device.trust.updated   → gameplay.simulate

vision.plant.identified    → gameplay.crop.update, recommendation.optimize
vision.disease.detected    → gameplay.crop.health, notifications.send
vision.growth.analyzed     → gameplay.crop.update

marketplace.listing.created → notifications.send, community.feed
marketplace.trade.complete  → reputation.update, gameplay.reward
marketplace.dispute.raised  → safety.analyze

safety.report.created      → safety.moderate
safety.action.taken        → reputation.update, notifications.send
safety.user.restricted     → marketplace.listing.review, gameplay.restrict

recommendation.watering    → notifications.send
recommendation.fertilizer  → notifications.send
recommendation.sustainability → gameplay.reward
```

## Agent Definitions

### 1. Gameplay Agent
**Responsibility**: Core simulation engine — crop mechanics, XP systems, balancing, rewards

```
Input Events:
  - weather.data.updated
  - iot.sensor.data
  - vision.plant.identified
  - vision.disease.detected

Output Events:
  - gameplay.crop.growth.tick
  - gameplay.crop.health.changed
  - gameplay.xp.awarded
  - gameplay.level.up
  - gameplay.reward.issued

State: crops, gardens, user_progress, inventories
Scale: Medium — 1 replica per 10K active users
```

### 2. Weather Intelligence Agent
**Responsibility**: Meteorological APIs, weather normalization, crop impact calculations

```
Input Events:
  - gameplay.crop.planted (for location tracking)

Output Events:
  - weather.data.updated (with crop impact metadata)
  - weather.alert.issued

State: weather_records, forecasts, alerts
Scale: Low — 1 replica (API key limited)
```

### 3. IoT Agent
**Responsibility**: MQTT ingestion, sensor validation, realtime device management

```
Input Events:
  - (none — MQTT subscription direct)

Output Events:
  - iot.sensor.data (parsed + validated)
  - iot.device.online
  - iot.device.offline
  - iot.device.trust.updated

State: iot_devices, sensor_readings
Scale: High — 5+ replicas per 10K devices
```

### 4. AI Vision Agent
**Responsibility**: Plant identification, disease detection, growth analysis

```
Input Events:
  - (HTTP request from scan action)

Output Events:
  - vision.plant.identified
  - vision.disease.detected
  - vision.growth.analyzed

State: ai_scans
Scale: Medium-High — GPU dependent, 2-3 replicas
```

### 5. Marketplace Agent
**Responsibility**: Listings, token economics, blockchain logging

```
Input Events:
  - gameplay.crop.harvested (auto-list suggestion)
  - reputation.update (for trust checks)

Output Events:
  - marketplace.listing.created
  - marketplace.trade.complete
  - marketplace.dispute.raised

State: listings, transactions, inventories
Scale: Medium — 2 replicas
```

### 6. Community Safety Agent
**Responsibility**: Moderation, toxicity analysis, spam detection

```
Input Events:
  - safety.report.created
  - marketplace.dispute.raised
  - (scheduled scans for active content)

Output Events:
  - safety.action.taken
  - safety.user.restricted
  - safety.content.flagged

State: moderation_reports, actions, flags
Scale: Low-Medium — 1 replica
```

### 7. Recommendation Agent
**Responsibility**: Watering suggestions, fertilizer advice, sustainability optimization

```
Input Events:
  - gameplay.crop.planted
  - weather.data.updated
  - iot.sensor.data
  - vision.plant.identified

Output Events:
  - recommendation.watering
  - recommendation.fertilizer
  - recommendation.crop
  - recommendation.sustainability

State: (stateless — computed on demand, cached in Redis)
Scale: Low — 1 replica (compute per request)
```

## Agent Lifecycle

```
1. INIT      → Agent registers with orchestrator
2. LISTEN    → Agent subscribes to event queues
3. PROCESS   → Agent processes incoming events
4. EMIT      → Agent publishes result events
5. IDLE      → Agent waits for next event
6. ERROR     → Agent retries with exponential backoff
7. SHUTDOWN  → Agent drains queue, persists state, unregisters
```

## Independent Scaling Rules

| Agent | Scale Trigger | Max Replicas | Resource Profile |
|-------|---------------|-------------|-----------------|
| Gameplay | Per 10K active gardens | 10 | CPU: 2 cores, RAM: 4GB |
| Weather | Per API rate limit | 3 | CPU: 1 core, RAM: 2GB |
| IoT | Per 10K devices | 20 | CPU: 1 core, RAM: 2GB |
| Vision | Per GPU availability | 5 | GPU: T4+, RAM: 8GB |
| Marketplace | Per 100K listings | 5 | CPU: 2 cores, RAM: 4GB |
| Safety | Per 1M messages/day | 3 | CPU: 4 cores, RAM: 8GB |
| Recommendation | Per 50K users | 3 | CPU: 2 cores, RAM: 4GB |

## Migration Strategy

```
Phase 1 (Current): Modular monolith with event stubs
    ↓
Phase 2: Agent interfaces defined, events instrumented
    ↓
Phase 3: High-load agents extracted (IoT, Vision)
    ↓
Phase 4: All agents independent, monolith becomes gateway
```

## Monitoring

Each agent exports:
- `agent_events_processed_total` — counter
- `agent_processing_duration_seconds` — histogram
- `agent_queue_depth` — gauge
- `agent_last_heartbeat` — gauge
- `agent_error_total` — counter

## Failure Modes

| Failure | Impact | Mitigation |
|---------|--------|------------|
| Gameplay down | Crops stop growing | Queue accumulates, replay on restart |
| Weather down | Simulated fallback | Use last known + seasonal averages |
| IoT down | No realtime sensor data | Gardens continue with simulated data |
| Vision down | AI scan unavailable | Graceful degradate to manual entry |
| Marketplace down | No trading | Read-only listing view |
| Safety down | Delayed moderation | Queue reports, auto-flag patterns |
| Recommendation down | No suggestions | Use rule-based fallback |
