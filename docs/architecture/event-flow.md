# Event-Driven Architecture

## Event Types

```
┌────────────────────────────────────────────────────────────┐
│                    EVENT CATALOG                            │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Domain: CROP                                         │  │
│  │  ├── crop.planted         │ Crop was planted          │  │
│  │  ├── crop.watered         │ Crop was watered          │  │
│  │  ├── crop.fertilized      │ Crop was fertilized       │  │
│  │  ├── crop.growth_tick     │ Growth timer triggered    │  │
│  │  ├── crop.growth_stage    │ Growth stage advanced     │  │
│  │  ├── crop.matured         │ Ready to harvest          │  │
│  │  ├── crop.harvested       │ Crop was harvested        │  │
│  │  ├── crop.wilted          │ Crop withered (neglect)   │  │
│  │  └── crop.diseased        │ Disease detected          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Domain: GARDEN                                        │  │
│  │  ├── garden.created        │ Garden created           │  │
│  │  ├── garden.updated        │ Garden updated           │  │
│  │  ├── garden.deleted        │ Garden deleted           │  │
│  │  └── garden.stats_updated  │ Garden stats recalculated│  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Domain: NOTIFICATION                                  │  │
│  │  ├── notification.send        │ Send push/in-app      │  │
│  │  ├── notification.email       │ Send email            │  │
│  │  ├── notification.telegram    │ Send Telegram          │  │
│  │  └── notification.broadcast   │ Broadcast to region   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Domain: MARKETPLACE                                   │  │
│  │  ├── marketplace.listed       │ New listing created   │  │
│  │  ├── marketplace.purchased    │ Item purchased        │  │
│  │  ├── marketplace.shipped      │ Item shipped          │  │
│  │  ├── marketplace.completed    │ Transaction complete  │  │
│  │  ├── marketplace.disputed     │ Dispute opened        │  │
│  │  └── marketplace.resolved     │ Dispute resolved      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Domain: USER                                          │  │
│  │  ├── user.registered         │ Account created        │  │
│  │  ├── user.verified           │ Email verified         │  │
│  │  ├── user.onboarded          │ Onboarding complete    │  │
│  │  ├── user.level_up           │ Level increased        │  │
│  │  ├── user.streak_updated     │ Daily streak changed   │  │
│  │  └── user.deleted            │ Account deleted        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Domain: AI                                            │  │
│  │  ├── ai.scan.requested        │ Scan queued           │  │
│  │  ├── ai.scan.completed        │ Scan finished         │  │
│  │  ├── ai.scan.failed           │ Scan error            │  │
│  │  ├── ai.recommendation.ready  │ Recommendations ready │  │
│  │  └── ai.model.updated         │ New model deployed    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Domain: IOT                                           │  │
│  │  ├── iot.device_connected      │ Device online        │  │
│  │  ├── iot.device_disconnected   │ Device offline       │  │
│  │  ├── iot.reading_ingested      │ Sensor reading saved │  │
│  │  ├── iot.reading_anomaly       │ Abnormal reading     │  │
│  │  └── iot.device_removed        │ Device unregistered  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Domain: WEATHER                                       │  │
│  │  ├── weather.updated           │ Weather data fetched │  │
│  │  ├── weather.alert_issued      │ New weather alert   │  │
│  │  └── weather.forecast_ready    │ Forecast available  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Domain: CHAT                                          │  │
│  │  ├── chat.message_sent         │ Message delivered   │  │
│  │  └── chat.typing               │ User typing         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Domain: REPUTATION                                    │  │
│  │  ├── reputation.changed         │ Score updated       │  │
│  │  └── reputation.badge_earned    │ Badge awarded       │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## Event Flow Diagrams

### Crop Growth Cycle (Async)

```
                    TIME (hours) ──────────────────────────►
                                                                                
User    │ Plant      │                    │ Harvest                             
Action  │            │                    │                                     
        ▼            ▼                    ▼                                     
┌────────────┐ ┌────────────┐     ┌────────────┐                               
│ POST       │ │ Queue      │     │ POST       │                               
│ /api/crops │ │ Check      │     │ /harvest   │                               
└─────┬──────┘ └────────────┘     └────────────┘                               
      │                                                                         
      ▼                                                                         
┌────────────────────────────────────────────────────────────────────────────┐
│  BullMQ Queue: growth-queue                                                 │
│                                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  crop        │  │  growth_tick │  │  growth_tick │  │  crop.matured│   │
│  │  .planted    │─►│  (1hr delay) │─►│  (3hr delay) │─►│  (emit)      │   │
│  └──────────────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│                           │                  │                  │           │
└───────────────────────────┼──────────────────┼──────────────────┼───────────┘
                            │                  │                  │
                            ▼                  ▼                  ▼
                     ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
                     │ Update DB    │  │ Update DB    │  │ Update DB    │
                     │ Stage: 2     │  │ Stage: 4     │  │ Status: MATURE
                     └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
                            │                  │                  │
                            ▼                  ▼                  ▼
                     ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
                     │ WS Emit      │  │ WS Emit      │  │ WS Emit      │
                     │ crop:update  │  │ crop:update  │  │ crop:update  │
                     └──────────────┘  └──────────────┘  └──────────────┘
```

### AI Scan Pipeline

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Mobile   │     │  Backend │     │  AI      │     │  BullMQ  │
│  App      │     │  (NestJS)│     │  Service │     │  Queue   │
├──────────┤     ├──────────┤     ├──────────┤     ├──────────┤
│┌────────┐│     │┌────────┐│     │┌────────┐│     │┌────────┐│
││Take    ││────►││Validate ││────►││Process ││     ││        ││
││Photo   ││     ││Upload   ││     ││Image   ││     ││        ││
│└────────┘│     ││to S3    ││     ││(PyTorch)││     ││        ││
│          │     │└───┬────┘│     │└───┬────┘│     ││        ││
│          │     │    │     │     │    │     │     ││        ││
│          │     │    ▼     │     │    ▼     │     ││        ││
│          │     │┌────────┐│     │┌────────┐│     │┌────────┐│
│          │     ││Queue   ││────►││Model   ││────►││        ││
│          │     ││AI Job  ││     ││Infers  ││     ││        ││
│          │     │└────────┘│     │└───┬────┘│     │└────────┘│
│          │     │          │     │    │     │     │          │
│          │     │          │     │    ▼     │     │          │
│          │     │┌────────┐│     │┌────────┐│     │          │
│◄─────────│─────││Save    ││◄────││Return  ││◄────│──────────│
│ Show     │     ││Results ││     ││Results ││     │          │
│ Results  │     │└────────┘│     │└────────┘│     │          │
└──────────┘     └──────────┘     └──────────┘     └──────────┘

┌────────────────────────────────────────────────────────────────┐
│  AI Processing Pipeline (FastAPI)                               │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Image    │─►│ Plant    │─►│ Disease  │─►│ Treatment    │  │
│  │ Preproc  │  │ Species  │  │ Detection│  │ Recommender  │  │
│  └──────────┘  │ Classifier│  └──────────┘  └──────────────┘  │
│                │ (ViT)    │                                     │
│                └──────────┘                                     │
└────────────────────────────────────────────────────────────────┘
```

### Notification Flow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Any Event   │───►│  Notif       │───►│  Queue       │
│  (crop.mature)│   │  Service     │    │  notify-queue│
└──────────────┘    └──────┬───────┘    └──────┬───────┘
                           │                   │
                           ▼                   ▼
                    ┌──────────────┐    ┌──────────────┐
                    │ Create       │    │ Push via     │
                    │ Notification │    │ FCM          │
                    │ In DB        │    │              │
                    └──────┬───────┘    └──────┬───────┘
                           │                   │
                           ▼                   ▼
                    ┌──────────────┐    ┌──────────────┐
                    │ WS Emit to   │    │ Deliver to   │
                    │ User Room    │    │ Device       │
                    └──────────────┘    └──────────────┘
```

---

## Queue/Topic Structure

```
┌────────────────────────────────────────────────────────────┐
│  BULLMQ QUEUE CONFIGURATION                                 │
│                                                             │
│  Queue: growth-queue                                        │
│  ├── Concurrency: 5 processors                              │
│  ├── Default job options: { attempts: 3, backoff: 60s }    │
│  └── Jobs: crop.growth_tick, crop.water_evaporate          │
│                                                             │
│  Queue: notify-queue                                        │
│  ├── Concurrency: 10 processors                             │
│  ├── Default job options: { attempts: 3, backoff: 30s }    │
│  └── Jobs: notification.send, notification.email            │
│                                                             │
│  Queue: ai-queue                                            │
│  ├── Concurrency: 3 processors                              │
│  ├── Default job options: { attempts: 2, timeout: 30000 }  │
│  └── Jobs: ai.scan.process, ai.recommend.generate           │
│                                                             │
│  Queue: iot-ingest-queue                                    │
│  ├── Concurrency: 20 processors                             │
│  ├── Default job options: { attempts: 1 }                   │
│  └── Jobs: iot.reading.save, iot.reading.verify             │
│                                                             │
│  Queue: weather-queue                                       │
│  ├── Concurrency: 2 processors                              │
│  ├── Default job options: { attempts: 3, backoff: 120s }   │
│  └── Jobs: weather.fetch, weather.forecast.fetch            │
│                                                             │
│  Queue: blockchain-queue                                    │
│  ├── Concurrency: 1 processor (sequential)                  │
│  ├── Default job options: { attempts: 5, backoff: 60s }    │
│  └── Jobs: blockchain.submit, blockchain.confirm            │
└────────────────────────────────────────────────────────────┘
```

---

## Event Handlers

| Event | Handler | Side Effects |
|-------|---------|-------------|
| crop.planted | GrowthScheduler | Schedule growth_tick jobs, emit WS |
| crop.growth_tick | GrowthProcessor | Update growth stage, check health, check weather |
| crop.matured | HarvestNotifier | Send notification, emit WS, check achievement |
| crop.harvested | RewardDistributor | Award XP, Eco Points, emit WS |
| user.registered | WelcomeProcessor | Send welcome email, create default garden |
| user.level_up | LevelProcessor | Check unlocks, award rewards, emit WS |
| marketplace.purchased | EscrowProcessor | Create escrow, deduct funds, emit WS |
| ai.scan.completed | ScanResultHandler | Save results, check achievements, emit WS |
| weather.alert_issued | AlertNotifier | Check affected regions, send notifications |
| iot.reading_anomaly | AnomalyHandler | Flag reading, reduce trust score, notify user |

---

## Error Handling Patterns

```
┌────────────────────────────────────────────────────────────┐
│  ERROR HANDLING STRATEGIES                                  │
│                                                             │
│  1. Queue Retry with Backoff                                │
│     ┌──────┐    ┌──────┐    ┌──────┐    ┌──────────┐     │
│     │ Job  │───►│ Retry│───►│ Retry│───►│ Dead     │     │
│     │      │    │ 1    │    │ 2    │    │ Letter Q │     │
│     └──────┘    └──────┘    └──────┘    └──────────┘     │
│     Exponential backoff: 60s, 120s, 240s                  │
│                                                             │
│  2. Dead Letter Queue                                       │
│     Jobs that exhaust retries go to DLQ                    │
│     DLQ monitored by admin (Slack alert)                   │
│     Manual replay or discard                               │
│                                                             │
│  3. Fallback Values                                         │
│     Weather fetch fails → cached data                      │
│     AI service down → return generic advice                │
│     IoT ingestion fails → buffer in Redis                  │
│                                                             │
│  4. Circuit Breaker                                         │
│     External API failures → circuit opens after 5 failures │
│     Circuit half-open after 30s for retry                  │
│     Full open → fail fast, alert ops                       │
│                                                             │
│  5. Event Sourcing (Partial)                                │
│     Critical events stored in audit_log table              │
│     Used for debugging, compliance, analytics              │
└────────────────────────────────────────────────────────────┘
```
