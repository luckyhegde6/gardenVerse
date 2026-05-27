# System Architecture Overview

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             CLIENT LAYER                                    │
│                                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐  │
│  │   Mobile App        │  │   Web Admin         │  │   IoT Devices       │  │
│  │   (React Native)    │  │   (Next.js)         │  │   (ESP32/etc.)      │  │
│  │   Expo + NativeWind │  │   Tailwind + TS     │  │   MQTT Protocol     │  │
│  └─────────┬───────────┘  └──────────┬──────────┘  └──────────┬──────────┘  │
│            │                         │                         │             │
└────────────┼─────────────────────────┼─────────────────────────┼─────────────┘
             │         HTTPS           │         HTTPS           │    MQTT
             │                         │                         │
┌────────────┼─────────────────────────┼─────────────────────────┼─────────────┐
│            ▼                         ▼                         ▼             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    API GATEWAY (Nginx / NestJS)                     │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │    │
│  │  │  Auth    │ │  Rate    │ │  Request │ │  API     │ │  Load    │  │    │
│  │  │  Guard   │ │  Limiter │ │  Logger  │ │  Version │ │  Balancer│  │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                              │                                              │
│              ┌───────────────┼───────────────┐                              │
│              ▼               ▼               ▼                              │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐            │
│  │  Backend Service │ │  AI Service      │ │  IoT Gateway     │            │
│  │  (NestJS)        │ │  (FastAPI/PyTorch)│ │  (MQTT Bridge)   │            │
│  │  REST + WebSocket│ │  Plant Diagnosis │ │  Device Auth     │            │
│  └────────┬─────────┘ └────────┬─────────┘ └────────┬─────────┘            │
│           │                    │                     │                      │
│  ┌────────┼────────────────────┼─────────────────────┼──────────────────┐   │
│  │        ▼                    ▼                     ▼                  │   │
│  │                      DATA & INFRASTRUCTURE LAYER                    │   │
│  │                                                                     │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │   │
│  │  │  PostgreSQL   │  │   Redis      │  │   Message Queue (BullMQ) │  │   │
│  │  │  (Primary DB) │  │  (Cache +    │  │   ┌──────────────────┐  │  │   │
│  │  │  + Prisma ORM │  │   Session)   │  │   │ Crop Growth      │  │  │   │
│  │  └──────────────┘  └──────────────┘  │   │ Notification      │  │  │   │
│  │                                       │   │ Weather Update    │  │  │   │
│  │  ┌──────────────┐  ┌──────────────┐  │   │ AI Processing     │  │  │   │
│  │  │   S3 / MinIO  │  │   MQTT       │  │   │ IoT Ingest        │  │  │   │
│  │  │  (File Store) │  │   (IoT Msgs) │  │   └──────────────────┘  │  │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                     MODULE DEPENDENCY GRAPH                     │
│                                                                 │
│  Auth ───► Users ───► Gardens ───► Crops                       │
│   │                   │            │                            │
│   │                   │            ▼                            │
│   │                   │        Weather ◄──── AI                 │
│   │                   │            │         │                  │
│   │                   ▼            ▼         ▼                  │
│   │               Intelligence   IoT       Scanner              │
│   │                                      │                      │
│   │                                      ▼                      │
│   └──► Reputation ◄── Marketplace ◄── Blockchain               │
│        │                    │                                    │
│        ▼                    ▼                                    │
│   Community ──► Chat ──► Notifications                          │
│        │                    │                                    │
│        ▼                    ▼                                    │
│   Moderation           Geo/Location                             │
│                                                                 │
│  Shared:                                                        │
│   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌──────────┐    │
│   │Prisma  │ │ Redis  │ │ Guards │ │Pipes   │ │Intercepts│    │
│   └────────┘ └────────┘ └────────┘ └────────┘ └──────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### Authentication Flow
```
Mobile App              API Gateway            Auth Service          PostgreSQL
    │                       │                      │                    │
    │  POST /auth/login     │                      │                    │
    │──────────────────────►│  Validate & Forward  │                    │
    │                       │─────────────────────►│  Find user by      │
    │                       │                      │──────────────────►│
    │                       │                      │◄───── User ──────│
    │                       │                      │                    │
    │                       │              Verify password (bcrypt)    │
    │                       │              Generate JWT + Refresh      │
    │                       │              Store session in Redis      │
    │                       │◄─────────────────────────────────────────│
    │◄──── Tokens ─────────│                      │                    │
    │                       │                      │                    │
```

### Crop Growth Cycle
```
User Plant → Queue Job → Growth Timer → Update DB → WS Event → Mobile
    │          │            │              │            │          │
    │          │            │              │            │          │
    ▼          ▼            ▼              ▼            ▼          ▼
  POST      BullMQ      BullMQ         Prisma       Socket.IO   Zustand
 /crops    Processor    Scheduler      Update       Emit        Store
                                                    Update
```

### IoT Data Pipeline
```
Sensor ──MQTT──► IoT Gateway ──► Redis Stream ──► Queue Processor ──► DB
  │               │                                    │                │
  │               │                                    │                │
  ▼               ▼                                    ▼                ▼
ESP32        mosquitto                              Verify +         PostgreSQL
             broker                    Transform + Store Readings
```

## Deployment Topology

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PRODUCTION CLUSTER                          │
│                                                                     │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐        │
│  │  Nginx   │   │  Nginx   │   │  Nginx   │   │  Nginx   │        │
│  │  LB 1    │   │  LB 2    │   │  LB 3    │   │  LB 4    │        │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘   └────┬─────┘        │
│       │              │              │              │               │
│       └──────────────┼──────────────┼──────────────┘               │
│                      │              │                              │
│              ┌───────▼───────┐ ┌────▼────────┐                    │
│              │  Backend API  │ │  Backend API │                    │
│              │  Instance 1   │ │  Instance 2  │                    │
│              │  (NestJS)     │ │  (NestJS)    │                    │
│              └───────┬───────┘ └──────┬────────┘                   │
│                      │                │                            │
│         ┌────────────┼────────────────┼───────────┐               │
│         │            ▼                ▼            │               │
│         │  ┌──────────────────────────────────┐    │               │
│         │  │     PostgreSQL Primary           │    │               │
│         │  └────────────┬─────────────────────┘    │               │
│         │               │                          │               │
│         │  ┌────────────▼──────────────────────┐   │               │
│         │  │     PostgreSQL Replica            │   │               │
│         │  └───────────────────────────────────┘   │               │
│         │                                          │               │
│         │  ┌──────────┐  ┌──────────┐             │               │
│         │  │ Redis    │  │ Redis    │             │               │
│         │  │ Primary  │  │ Replica  │             │               │
│         │  └──────────┘  └──────────┘             │               │
│         └──────────────────────────────────────────┘               │
│                                                                     │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐                       │
│  │  AI      │   │  IoT     │   │  Admin   │                       │
│  │  Service │   │  Gateway │   │  Panel   │                       │
│  │(GPU Pod) │   │ (CPU)    │   │ (Next.js)│                       │
│  └──────────┘   └──────────┘   └──────────┘                       │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │  Monitoring Stack                                         │      │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐        │      │
│  │  │Prometheus│ │Grafana  │ │ELK Stack│ │Sentry   │        │      │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘        │      │
│  └──────────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────────────┘
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Backend Runtime | Node.js 22, NestJS 10 |
| API | REST (Swagger/OpenAPI) + WebSocket (Socket.IO) |
| Database | PostgreSQL 16 + Prisma ORM |
| Cache | Redis 7 |
| Queue | BullMQ |
| Mobile | React Native 0.74, Expo 51 |
| AI/ML | FastAPI, PyTorch, Transformers |
| IoT | MQTT (Mosquitto), ESP32 |
| Blockchain | Solidity, Hardhat, OpenZeppelin |
| Admin | Next.js 14, TailwindCSS |
| Monitoring | Prometheus, Grafana, Sentry |
| CI/CD | GitHub Actions |
| Container | Docker, Docker Compose |
| Cloud | AWS (or equivalent) |

## Key Design Decisions

1. **Monorepo with workspaces** - Shared types, unified versioning, simplified CI
2. **NestJS modular architecture** - Domain-driven module organization, each module is self-contained
3. **Event-driven with BullMQ** - Decoupled async processing for crop growth, notifications, AI tasks
4. **Real-time via Socket.IO** - Live garden updates, chat, sensor data streaming
5. **Hybrid online/offline** - Mobile app supports offline state with sync on reconnect
6. **Prisma ORM** - Type-safe database access, migrations, and schema management
7. **Redis as cache + queue + pub/sub** - Multi-purpose caching layer
8. **Microservices for AI/IoT** - Separate services for compute-heavy or protocol-specific workloads

## Failure Handling by Layer

### 1. Client Layer (Mobile / Web)
- **Network failure**: All API calls wrapped in retry with exponential backoff (3 retries, 1s/2s/4s)
- **Offline mode**: Zustand stores with persisted state; queue mutations for replay on reconnect
- **Stale data**: React Query `staleTime` configured per-entity (weather: 3min, garden: 30s, user: 5min)
- **UI degradation**: Components render loading skeleton → error state → empty state if all fail

### 2. API Gateway (NestJS)
- **Throttling**: Global rate limiter (100 req/min per IP, 1000 req/min for authenticated)
- **Validation failure**: `class-validator` DTOs reject malformed input with 400 + field-level errors
- **Auth failure**: JWT guard returns 401; expired tokens trigger refresh flow; invalid tokens reject
- **Graceful degradation**: External API failures return cached/fallback data rather than 5xx

### 3. Service Layer (Business Logic)
- **Database errors**: All Prisma queries wrapped in try/catch; return `NotFoundException` or `InternalServerError`
- **External API timeout**: 5s timeout on all outbound HTTP calls (OpenWeatherMap, Google Maps, AI)
- **BullMQ job failures**: Failed jobs retry up to 3 times with exponential backoff; dead-letter after max retries
- **Event bus errors**: Events wrapped in try/catch; orchestrator logs + continues on per-agent failure

### 4. Database Layer (PostgreSQL)
- **Connection pool**: Pool exhaustion returns 503 immediately; pool size = 20 connections per instance
- **Query timeout**: 10s query timeout; slow queries logged and terminated
- **Replication lag**: Read replicas for reporting/analytics; writes always go to primary
- **Deadlock protection**: Prisma retry on serialization failures; all mutations use transactions
- **Migration safety**: Backward-compatible migrations only; no destructive changes without feature flags

### 5. Cache Layer (Redis)
- **Connection failure**: Cache misses fall through to database; no crash on Redis downtime
- **Key eviction**: LRU eviction policy; critical keys (sessions, rate limits) have priority
- **Cluster mode**: Redis cluster for production; data sharded across nodes

### 6. External Integrations
| Service | Failure Mode | Fallback Behavior |
|---------|------------|-------------------|
| OpenWeatherMap | Timeout / 5xx | Return cached weather (if available) or simulated data |
| Google Maps | Rate limited | Disable geolocation features; return cached geohash |
| OpenFarm / Trefle | Unreachable | Serve from local PlantSpecies cache; weekly sync |
| AI Python Service | Down | Fallback to mock analysis with disclaimer |
| MQTT Broker | Disconnected | Buffer sensor readings; replay on reconnect |

## Idempotency Strategy

All mutation endpoints are idempotent using the following patterns:

### Idempotency Key Pattern (POST endpoints)
```
POST /api/v1/marketplace/transactions
Header: Idempotency-Key: <UUID-v4>

Response 200: Previously created resource (replay-safe)
Response 201: Newly created resource
Response 422: Invalid key format
```

### Natural Idempotency (UPSERT-style)
```
POST /api/v1/gardens  →  unique per user (one garden per user)
POST /api/v1/iot/readings  →  deviceId + timestamp deduplication
POST /api/v1/crops  →  gardenId + plantId + plotPosition unique constraint
```

### Safe Retry Pattern (Queued operations)
```
BullMQ job deduplication: jobId = hash(payload) ensures same job not enqueued twice
Crop growth ticks: idempotent UPDATE (stage only advances, never regresses)
Wallet transfers: nonce-based dedup prevents double-spend
```

### Endpoint Idempotency Matrix
| Method | Endpoint Group | Idempotent? | Mechanism |
|--------|---------------|-------------|-----------|
| GET | All | ✅ Naturally | Read-only |
| PUT | All | ✅ Naturally | Full replacement |
| PATCH | All | ✅ Naturally | Partial update |
| DELETE | All | ✅ Naturally | Soft-delete + 404 on repeat |
| POST | /auth/* | ❌ Not idempotent | Creates new session each time |
| POST | /gardens | ✅ Natural | One garden per user constraint |
| POST | /crops | ✅ Natural | Unique position constraint |
| POST | /marketplace/transactions | ✅ Key-based | Idempotency-Key header |
| POST | /iot/readings | ✅ Natural | deviceId + timestamp unique |
| POST | /invites | ✅ Natural | Unique code generation |
| POST | /upload | ❌ Not idempotent | Creates new file each upload |

## Scalability & Fault Tolerance

### Horizontal Scaling
- **API instances**: Stateless NestJS servers behind Nginx round-robin; session state in Redis
- **BullMQ workers**: Separate worker processes for crop growth, notifications, AI tasks; scale independently
- **Read replicas**: PostgreSQL read replicas for reporting queries; primary handles writes
- **Redis cluster**: Data sharded; sentinel for automatic failover

### Fault Tolerance Patterns
```
┌─────────────────────────────────────────────────────┐
│              CIRCUIT BREAKER PATTERN                 │
│                                                     │
│  Request ──► Closed (pass) ──► failure count > 5    │
│                  │                  │                │
│                  │                  ▼                │
│                  │            Open (reject)          │
│                  │                  │                │
│                  │            timeout 30s            │
│                  │                  │                │
│                  ▼                  ▼                │
│           Half-Open (probe) ──► success → Closed     │
└─────────────────────────────────────────────────────┘
```

### Bulkhead Pattern
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  API Threads │  │  Queue Wkrs  │  │  WS Connections│
│  Pool: 10    │  │  Pool: 5     │  │  Pool: 1000  │
├──────────────┤  ├──────────────┤  ├──────────────┤
│ CPU-bound    │  │ Crop Growth  │  │ Chat Rooms   │
│ I/O-bound    │  │ AI Tasks     │  │ Garden Sync  │
│ Auth         │  │ Notifications│  │ Sensor Data  │
└──────────────┘  └──────────────┘  └──────────────┘
```

### Retry with Exponential Backoff
```
Attempt 1:  wait 1s
Attempt 2:  wait 2s
Attempt 3:  wait 4s
Attempt 4:  wait 8s  (BullMQ max retries)
Max total: ~15s before dead-letter queue
```

### Database Connection Scaling
- **Pool per service**: Each NestJS instance gets 20 connections; max 100 concurrent across 5 instances
- **Connection limiting**: Prisma middleware limits concurrent queries; queues overflow to BullMQ
- **Read/write splitting**: Reporting queries routed to replica; OLTP writes to primary

### Monitoring & Recovery
- **Health checks**: `/api/v1/health` returns DB, Redis, queue status (used by k8s liveness probes)
- **Alert thresholds**: p99 latency > 500ms → alert; error rate > 1% → alert; queue depth > 1000 → scale workers
- **Auto-recovery**: Stuck BullMQ jobs moved to stalled set after 30s; reprocessed automatically
- **Database backups**: WAL-level continuous archiving; point-in-time recovery to last 5 minutes
- **Disaster recovery**: Cross-region replication for PostgreSQL (async); Redis AOF persistence

See [`docs/architecture/flow-payloads.md`](./flow-payloads.md) for example API request/response payloads.
