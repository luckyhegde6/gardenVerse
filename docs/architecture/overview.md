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
