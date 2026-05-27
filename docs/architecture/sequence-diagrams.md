# Sequence Diagrams — GardenVerse Workflows & Service Calls

> Top-level Mermaid sequence diagrams documenting key user workflows, feature interactions, and cross-service communication patterns.

---

## 1. User Onboarding & Authentication

```mermaid
sequenceDiagram
    actor User
    participant Mobile as Mobile App
    participant API as Backend API
    participant Auth as Auth Module
    participant DB as PostgreSQL
    participant Redis as Redis Cache

    User->>Mobile: Open app / Register
    Mobile->>API: POST /api/v1/auth/register
    API->>Auth: validate DTO + hash password (bcrypt 12)
    Auth->>DB: INSERT user
    DB-->>Auth: user record
    Auth->>Auth: generate JWT (15m) + refresh token (7d)
    Auth->>Redis: store session
    Redis-->>Auth: OK
    Auth-->>API: tokens + user profile
    API-->>Mobile: 201 Created
    Mobile-->>User: Show dashboard

    User->>Mobile: Login (existing)
    Mobile->>API: POST /api/v1/auth/login
    API->>Auth: validate credentials
    Auth->>DB: SELECT user by email
    DB-->>Auth: user + passwordHash
    Auth->>Auth: bcrypt.compare()
    Auth->>Redis: create session
    Auth-->>API: JWT + refresh
    API-->>Mobile: tokens
```

---

## 2. Garden Creation & Crop Planting

```mermaid
sequenceDiagram
    actor User
    participant Mobile as Mobile App
    participant API as Backend API
    participant GardenSvc as Garden Service
    participant CropSvc as Crop Service
    participant Agent as Gameplay Agent
    participant DB as PostgreSQL

    User->>Mobile: Create Garden
    Mobile->>API: POST /api/v1/gardens
    API->>GardenSvc: validate + create garden
    GardenSvc->>DB: INSERT garden
    DB-->>GardenSvc: garden record
    GardenSvc-->>API: garden response
    API-->>Mobile: 201 Created
    Mobile-->>User: Garden dashboard

    User->>Mobile: Browse plants → Select crop
    Mobile->>API: GET /api/v1/plants?season=summer
    API->>GardenSvc: query plant species
    GardenSvc->>DB: SELECT species filtered by season
    DB-->>GardenSvc: matching plants
    GardenSvc-->>API: plant list
    API-->>Mobile: [...plants]

    Mobile->>API: POST /api/v1/crops
    API->>CropSvc: validate + create crop
    CropSvc->>DB: INSERT crop (status: SEED)
    DB-->>CropSvc: crop record
    CropSvc->>Agent: emit garden.crop.planted
    Agent->>Agent: schedule growth timer
    CropSvc-->>API: crop response
    API-->>Mobile: 201 Created
    Mobile-->>User: Crop placed in garden
```

---

## 3. Crop Growth Cycle (Event-Driven)

```mermaid
sequenceDiagram
    participant Agent as Gameplay Agent
    participant Queue as BullMQ Queue
    participant Processor as Growth Processor
    participant CropSvc as Crop Service
    participant WS as WebSocket Gateway
    participant Mobile as Mobile App
    participant DB as PostgreSQL

    Note over Agent,Queue: Scheduled task runs every 5 min
    Agent->>Queue: add growth check job
    Queue->>Processor: process job
    Processor->>DB: SELECT crops WHERE status = GROWING
    DB-->>Processor: [crops due for update]
    loop Each crop
        Processor->>CropSvc: calculate growth increment
        CropSvc->>CropSvc: apply weather modifier
        CropSvc->>CropSvc: check health/hydration
        CropSvc->>DB: UPDATE crop (stage + health)
        alt Status changed
            CropSvc->>WS: emit crop.status.changed
            WS->>Mobile: push notification
        end
        alt Harvest ready
            CropSvc->>WS: emit crop.harvest.ready
            WS->>Mobile: "Your tomatoes are ready!"
        end
        alt Stress detected
            CropSvc->>WS: emit crop.stress.alert
            WS->>Mobile: "Crop needs attention!"
        end
    end
    Processor-->>Queue: job complete
```

---

## 4. Weather Data Pipeline

```mermaid
sequenceDiagram
    participant Cron as Cron Job (weekly)
    participant WeatherSvc as Weather Service
    participant OWM as OpenWeatherMap API
    participant Cache as WeatherRecord (DB)
    participant Mobile as Mobile App
    participant Agent as Weather Agent

    Note over Cron,Agent: Sync schedule
    Cron->>WeatherSvc: sync weather data
    WeatherSvc->>OWM: GET /data/2.5/weather?q=region
    OWM-->>WeatherSvc: current weather JSON
    WeatherSvc->>OWM: GET /data/2.5/forecast?q=region
    OWM-->>WeatherSvc: 7-day forecast JSON
    WeatherSvc->>Cache: upsert WeatherRecord (TTL: 3h)
    WeatherSvc->>Agent: check for extreme alerts
    Agent->>Agent: evaluate heatwave/freeze/wind
    alt Alert triggered
        Agent->>Mobile: push weather alert
    end

    Note over Mobile,Cache: On-demand request
    Mobile->>WeatherSvc: GET /api/v1/weather?region=IN-MH
    WeatherSvc->>Cache: SELECT where region + not expired
    alt Cache hit
        Cache-->>WeatherSvc: cached weather
    else Cache miss
        WeatherSvc->>OWM: fetch fresh data
        OWM-->>WeatherSvc: weather data
        WeatherSvc->>Cache: upsert new record
    end
    WeatherSvc-->>Mobile: weather + forecast + alerts
```

---

## 5. Plant Identification (AI Vision Pipeline)

```mermaid
sequenceDiagram
    actor User
    participant Mobile as Mobile App
    participant UploadSvc as Upload Service
    participant VisionAgent as Vision Agent
    participant AI as Python AI Service (FastAPI)
    participant DB as PostgreSQL

    User->>Mobile: Take plant photo
    Mobile->>Mobile: compress image
    Mobile->>UploadSvc: POST /api/v1/upload (multipart)
    UploadSvc->>UploadSvc: validate type + size
    UploadSvc->>UploadSvc: save to disk/S3
    UploadSvc-->>Mobile: { imageUrl, id }

    Mobile->>VisionAgent: POST /api/v1/vision/analyze
    VisionAgent->>AI: POST /api/v1/plant/identify
    Note over VisionAgent,AI: imageUrl + metadata

    alt AI service available
        AI->>AI: OpenCV analysis
        AI->>AI: leaf metrics (green/yellow/brown %)
        AI->>AI: curl index, disease probability
        AI-->>VisionAgent: { plantName, health, diseases }
    else AI service down
        VisionAgent->>VisionAgent: local mock analysis
        VisionAgent-->>Mobile: fallback result
    end

    VisionAgent->>DB: INSERT AiScan
    DB-->>VisionAgent: scan record
    VisionAgent-->>Mobile: { scanId, plantName, health, recommendations }
    Mobile-->>User: "Identified: Tomato - 92% healthy"
```

---

## 6. Marketplace Transaction

```mermaid
sequenceDiagram
    actor Buyer
    actor Seller
    participant API as Backend API
    participant MarketSvc as Marketplace Service
    participant TokenSvc as Token Service
    participant DB as PostgreSQL
    participant WS as WebSocket

    Seller->>API: POST /api/v1/marketplace/listings
    API->>MarketSvc: validate + create listing
    MarketSvc->>DB: INSERT listing (status: ACTIVE)
    DB-->>MarketSvc: listing record
    MarketSvc-->>API: listing created

    Buyer->>API: GET /api/v1/marketplace/listings?category=SEEDS
    API->>MarketSvc: query active listings
    MarketSvc->>DB: SELECT listings WHERE status = ACTIVE
    DB-->>MarketSvc: [...listings]
    MarketSvc-->>API: [...listings]
    API-->>Buyer: listings

    Buyer->>API: POST /api/v1/marketplace/transactions
    API->>MarketSvc: initiate purchase
    MarketSvc->>TokenSvc: transfer GREEN_CREDITS
    TokenSvc->>DB: UPDATE buyer balance
    TokenSvc->>DB: UPDATE seller balance
    TokenSvc->>DB: INSERT TokenTransaction (buyer)
    TokenSvc->>DB: INSERT TokenTransaction (seller)
    MarketSvc->>DB: UPDATE listing (status: SOLD)
    MarketSvc->>DB: INSERT transaction record
    MarketSvc->>WS: emit marketplace.item.sold
    WS-->>Seller: "Your item was purchased!"
    MarketSvc-->>API: transaction receipt
    API-->>Buyer: 201 Created + receipt
```

---

## 7. Community & Real-Time Chat

```mermaid
sequenceDiagram
    actor Alice
    actor Bob
    participant Mobile as Mobile App
    participant WS as WebSocket Gateway
    participant ChatSvc as Chat Service
    participant DB as PostgreSQL
    participant Redis as Redis Pub/Sub

    Alice->>Mobile: Open chat → Select Bob
    Mobile->>WS: connect (JWT auth)
    WS->>Redis: subscribe user:alice channel

    Bob->>Mobile: Open chat → reply
    Bob->>WS: send message { receiverId: alice, content, nonce }
    WS->>ChatSvc: validate + encrypt
    ChatSvc->>DB: INSERT message (encrypted, nonce)
    DB-->>ChatSvc: message record
    ChatSvc->>Redis: publish to user:alice
    Redis-->>WS: new message event
    WS-->>Alice: receive message (decrypt client-side)
    WS-->>Bob: delivery confirmation
```

---

## 8. IoT Sensor Data Pipeline

```mermaid
sequenceDiagram
    participant Sensor as ESP32 Sensor
    participant MQTT as MQTT Broker (Mosquitto)
    participant IoT as IoT Gateway Service
    participant Queue as BullMQ
    participant Processor as IoT Processor
    participant Agent as IoT Agent
    participant DB as PostgreSQL

    Sensor->>Sensor: read soil moisture
    Sensor->>MQTT: publish gardenverse/sensor/moisture
    Note over Sensor,MQTT: payload: { deviceId, value, timestamp, signature }

    MQTT->>IoT: subscribe to gardenverse/#
    IoT->>IoT: verify device signature
    IoT->>IoT: check device trust score
    alt Low trust score
        IoT->>IoT: flag as suspicious
        IoT-->>MQTT: ignore reading
    else Valid
        IoT->>Queue: add sensor reading job
        Queue->>Processor: process reading
        Processor->>DB: INSERT sensor_reading
        DB-->>Processor: OK
        Processor->>Agent: update device metrics
        Agent->>Agent: evaluate fake data heuristics
        alt Anomaly detected
            Agent->>Agent: decrease device trust score
            Agent->>MQTT: alert device owner
        end
    end
```

---

## 9. QR Invite System

```mermaid
sequenceDiagram
    actor Owner
    actor Guest
    participant Mobile as Mobile App
    participant InviteSvc as Invite Service
    participant Crypt as Encryption Service
    participant DB as PostgreSQL

    Owner->>Mobile: Generate invite
    Mobile->>InviteSvc: POST /api/v1/invites
    InviteSvc->>DB: INSERT invite (code, type)
    InviteSvc->>Crypt: encrypt + sign payload
    Crypt->>Crypt: AES-256-GCM(payload, secret)
    Crypt->>Crypt: HMAC-SHA256(signature)
    Crypt-->>InviteSvc: { encrypted, signature, expiresAt }
    InviteSvc-->>Mobile: QR data (encrypted + signed)

    Mobile->>Mobile: render QR code on screen

    Guest->>Mobile: Scan QR code
    Mobile->>Mobile: extract encrypted payload
    Mobile->>InviteSvc: POST /api/v1/invites/redeem
    InviteSvc->>Crypt: verify signature
    Crypt->>InviteSvc: valid/invalid
    InviteSvc->>Crypt: decrypt payload
    Crypt-->>InviteSvc: { inviteId, code }
    InviteSvc->>DB: UPDATE invite (useCount + 1)
    alt Max uses reached
        InviteSvc->>DB: UPDATE invite (isActive: false)
    end
    InviteSvc-->>Mobile: { invite redeemed, garden access }
    Guest->>Mobile: View shared garden
```

---

## 10. Admin Dashboard UX Flow

```mermaid
sequenceDiagram
    actor Admin as Admin User
    participant Browser as Web Browser
    participant NextJS as Next.js Admin (SSR)
    participant API as Backend API (NestJS)
    participant Auth as Auth Module
    participant DB as PostgreSQL
    participant Cache as Redis Cache

    Admin->>Browser: Navigate to /login
    Browser->>NextJS: GET /login
    NextJS-->>Browser: Login page (SSR)

    Admin->>Browser: Enter credentials
    Browser->>NextJS: POST /api/auth/callback/credentials
    NextJS->>API: POST /api/v1/auth/login
    API->>Auth: validate credentials
    Auth->>DB: SELECT user by email
    DB-->>Auth: user + passwordHash + role
    Auth->>Auth: bcrypt.compare() + check role
    Auth->>Cache: create session
    Auth-->>API: JWT + user profile
    API-->>NextJS: session token
    NextJS-->>Browser: Set cookie, redirect to /dashboard

    Admin->>Browser: View Dashboard
    Browser->>NextJS: GET /dashboard (authenticated)
    NextJS->>API: GET /api/v1/admin/dashboard/stats
    API->>DB: SELECT counts (users, gardens, transactions, reports)
    DB-->>API: aggregated stats
    API-->>NextJS: { totalUsers, activeGardens, marketplaceVolume, reports }
    NextJS-->>Browser: Dashboard with StatCards + Charts

    Admin->>Browser: Manage Users
    Browser->>NextJS: GET /users
    NextJS->>API: GET /api/v1/admin/users?page=1&limit=20
    API->>DB: SELECT users ORDER BY createdAt DESC
    DB-->>API: [users] + total count
    API-->>NextJS: paginated user list
    NextJS-->>Browser: DataTable with search + pagination

    Admin->>Browser: Moderation Queue
    Browser->>NextJS: GET /moderation
    NextJS->>API: GET /api/v1/moderation/queue?status=PENDING
    API->>DB: SELECT flagged content WHERE status = PENDING
    DB-->>API: [reports with content]
    API-->>NextJS: moderation queue
    NextJS-->>Browser: Moderation review panel

    Admin->>Browser: Analytics
    Browser->>NextJS: GET /analytics
    NextJS->>API: GET /api/v1/analytics/overview?period=30d
    API->>DB: query aggregated metrics over time
    DB-->>API: time-series data
    API-->>NextJS: analytics payload
    NextJS-->>Browser: Recharts visualizations

    Admin->>Browser: Feature Flags
    Browser->>NextJS: GET /features
    NextJS->>API: GET /api/v1/feature-flags
    API->>DB: SELECT all flags
    DB-->>API: [flags with rollout percentage]
    API-->>NextJS: feature flag list
    NextJS-->>Browser: Toggle switches per flag

    Admin->>Browser: Super Admin Panel
    Browser->>NextJS: GET /super-admin/dashboard
    NextJS->>API: GET /api/v1/admin/super-admin/dashboard
    API->>API: verify SUPER_ADMIN role
    API->>DB: SELECT system-wide stats
    DB-->>API: { userGrowth, revenue, systemHealth }
    API-->>NextJS: super admin payload
    NextJS-->>Browser: Super Admin dashboard
```

---

## 11. Cross-Module Event Flow (Agent Orchestration)

```mermaid
sequenceDiagram
    participant App as Application
    participant Orchestrator as AgentOrchestrator
    participant Bus as Event Bus (EventEmitter)
    participant Agents as Specialized Agents
    participant BullMQ as BullMQ Queue
    participant Services as Backend Services

    App->>Orchestrator: initialize()
    Orchestrator->>Orchestrator: load AGENT_CONFIGS
    Orchestrator->>Agents: register event handlers
    Orchestrator->>Bus: subscribe to all events

    Note over App,Services: Runtime event flow
    Services->>Bus: emit garden.crop.planted
    Bus->>Orchestrator: route garden.crop.planted
    Orchestrator->>Orchestrator: determine target agents
    Orchestrator->>Agents: GameplayAgent.handle(event)
    Orchestrator->>BullMQ: enqueue growth job
    Orchestrator->>Agents: RecommendationAgent.handle(event)

    Services->>Bus: emit weather.alert.extreme
    Bus->>Orchestrator: route weather.alert.extreme
    Orchestrator->>Agents: WeatherAgent.handle(event)
    Orchestrator->>Agents: SafetyAgent.handle(event)

    Services->>Bus: emit marketplace.item.listed
    Bus->>Orchestrator: route marketplace.item.listed
    Orchestrator->>Agents: MarketplaceAgent.handle(event)
```
