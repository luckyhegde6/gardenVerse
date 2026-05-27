# Backend Architecture

## NestJS Module Structure

```
packages/backend/src/
├── app.module.ts                    # Root module
├── main.ts                         # Bootstrap, middleware, swagger
├── config/
│   └── index.ts                    # AppConfigService (env vars)
├── prisma/
│   └── prisma.service.ts           # Prisma client singleton
├── common/
│   ├── constants/                  # App-wide constants
│   ├── decorators/                 # Custom decorators (@CurrentUser, etc.)
│   ├── filters/                    # Exception filters
│   ├── guards/                     # Auth & role guards
│   ├── interceptors/               # Logging, transformation
│   ├── pipes/                      # Validation pipes
│   └── utils/                      # Shared utilities
└── modules/
    ├── auth/                       # Authentication (JWT, OTP, Telegram)
    ├── users/                      # User profiles & leaderboards
    ├── gardens/                    # Garden management
    ├── crops/                      # Crop lifecycle & actions
    ├── marketplace/                # P2P marketplace (listings, escrow)
    ├── weather/                    # Weather data fetching & caching
    ├── ai/                         # AI scan & recommendation proxy
    ├── iot/                        # IoT device management & readings
    ├── notifications/              # Push/in-app notifications
    ├── geo/                        # Geospatial queries
    ├── intelligence/               # Government schemes & advisories
    ├── moderation/                 # Content moderation
    ├── blockchain/                 # Smart contract interaction
    ├── reputation/                 # Reputation & scoring engine
    ├── invite-system/              # Invite codes & referral
    ├── community/                  # Groups & community features
    ├── chat/                       # Encrypted messaging
    ├── qr/                         # QR code generation & validation
    ├── feature-flags/              # Feature toggle system
    ├── analytics/                  # Usage analytics
    ├── admin/                      # Admin dashboard API
    └── health/                     # Health checks
```

## API Gateway Pattern

```
                    ┌─────────────────────┐
                    │     Nginx Reverse    │
                    │        Proxy         │
                    │   SSL Termination    │
                    │   Rate Limiting      │
                    │   Static Files       │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   NestJS API Layer   │
                    │                      │
                    │  ┌────────────────┐  │
                    │  │ Global Prefix   │  │
                    │  │ /api/v1         │  │
                    │  └────────────────┘  │
                    │  ┌────────────────┐  │
                    │  │ Helmet (Sec)   │  │
                    │  │ CORS           │  │
                    │  │ Compression    │  │
                    │  └────────────────┘  │
                    │  ┌────────────────┐  │
                    │  │ ValidationPipe  │  │
                    │  │ whitelist=true  │  │
                    │  │ transform=true  │  │
                    │  └────────────────┘  │
                    │  ┌────────────────┐  │
                    │  │ ThrottlerGuard  │  │
                    │  │ 100 req/min    │  │
                    │  └────────────────┘  │
                    │  ┌────────────────┐  │
                    │  │ Swagger Docs   │  │
                    │  │ /api/docs      │  │
                    │  └────────────────┘  │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Module Router      │
                    │   ┌──────────────┐   │
                    │   │ AuthController│  │
                    │   ├──────────────┤   │
                    │   │ UserController│  │
                    │   ├──────────────┤   │
                    │   │ ... (22 more)│   │
                    │   └──────────────┘   │
                    └─────────────────────┘
```

## Event-Driven Architecture

```
                     ┌─────────────────────────┐
                     │     Event Bus (BullMQ)   │
                     │                          │
                     │  ┌────────────────────┐  │
                     │  │  crop.growth        │  │
                     │  │  crop.harvest       │  │
                     │  │  weather.updated    │  │
                     │  │  notification.send  │  │
                     │  │  ai.scan.complete   │  │
                     │  │  iot.sensor.update  │  │
                     │  │  user.levelup       │  │
                     │  │  marketplace.sold   │  │
                     │  │  geolocation.change │  │
                     │  │  reputation.change  │  │
                     │  └────────────────────┘  │
                     └────────────┬────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              ▼                   ▼                   ▼
     ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
     │  Growth       │   │  Notification│   │  Analytics   │
     │  Processor    │   │  Processor   │   │  Processor   │
     └──────────────┘   └──────────────┘   └──────────────┘
              │                   │                   │
              ▼                   ▼                   ▼
        Garden Update       Push Notification    Record Event
        + WebSocket         + Email/SMS          + DB Write
```

## Queue System (BullMQ)

```
┌────────────────────────────────────────────────────────┐
│                    REDIS (BullMQ Backend)                │
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │  growth-queue│  │  notify-queue│  │  ai-queue        │ │
│  │              │  │             │  │                  │ │
│  │  ┌─────────┐ │  │ ┌─────────┐ │  │ ┌──────────────┐ │ │
│  │  │Growth   │ │  │ │Push     │ │  │ │Scan           │ │ │
│  │  │Scheduler│ │  │ │Jobs     │ │  │ │Diagnosis      │ │ │
│  │  └─────────┘ │  │ └─────────┘ │  │ │Recommendation │ │ │
│  └─────────────┘  └─────────────┘  │ └──────────────┘ │ │
│                                     └─────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │  weather-    │  │  iot-       │  │  blockchain-    │ │
│  │  queue       │  │  ingest-    │  │  queue          │ │
│  │              │  │  queue      │  │                 │ │
│  │  ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────────┐│ │
│  │  │Fetch    │ │  │ │Ingest   │ │  │ │Confirm      ││ │
│  │  │Forecast │ │  │ │Validate │ │  │ │Submit       ││ │
│  │  └─────────┘ │  │ └─────────┘ │  │ └─────────────┘│ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
└────────────────────────────────────────────────────────┘
```

## Realtime (Socket.IO) Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    SOCKET.IO SERVER                         │
│                                                             │
│  Namespaces:                                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  /gardens                                             │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Events: garden:sync, crop:update,               │  │  │
│  │  │          sensor:live, growth:complete             │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  /chat                                                │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Events: message:send, message:receive,          │  │  │
│  │  │          typing:start, typing:stop               │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  /notifications                                       │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Events: notification:new, notification:read     │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Redis Adapter: socket.io-redis (horizontal scaling)        │
│  Authentication: JWT token in handshake query               │
└────────────────────────────────────────────────────────────┘
```

## Authentication Flow (JWT + OTP)

```
REGISTRATION:
┌──────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│Client│     │  Auth    │     │  Email   │     │   DB     │
│      │     │ Service  │     │ Service  │     │          │
├──────┤     ├──────────┤     ├──────────┤     ├──────────┤
│Register│──►│Hash pw   │     │          │     │          │
│        │   │(bcrypt12)│     │          │     │          │
│        │   │Create user│───►│Send OTP  │     │          │
│        │   │          │     │          │───►│Save user │
│        │   │          │     │          │     │+ OTP hash│
│◄─pending│◄─│──────────│◄────│──────────│◄────│──────────│
└──────┘     └──────────┘     └──────────┘     └──────────┘

VERIFY OTP:
┌──────┐     ┌──────────┐     ┌──────────┐
│Client│     │  Auth    │     │   Redis  │
│      │     │ Service  │     │          │
├──────┤     ├──────────┤     ├──────────┤
│Verify│──►│Verify OTP │───►│Check rate │
│ OTP  │   │          │     │ limit     │
│      │   │          │◄───│ OK        │
│      │   │Mark verified│   │          │
│      │   │Generate JWT │   │          │
│      │   │Store session│──►│Cache     │
│◄─tokens│◄─│──────────│     │          │
└──────┘   └──────────┘     └──────────┘

LOGIN:
┌──────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│Client│     │  Auth    │     │   DB     │     │   Redis  │
│      │     │ Service  │     │          │     │          │
├──────┤     ├──────────┤     ├──────────┤     ├──────────┤
│Login │──►│Find user │───►│Query     │     │          │
│      │   │by email  │◄───│User+role │     │          │
│      │   │Compare pw │     │          │     │          │
│      │   │(bcrypt)  │     │          │     │          │
│      │   │Gen access │     │          │     │          │
│      │   │(RS256,15m)│    │          │     │          │
│      │   │Gen refresh│    │          │     │          │
│      │   │(7d)      │    │          │───►│Cache     │
│      │   │Store sess │    │          │     │session   │
│◄─tokens│◄─│──────────│◄────│──────────│◄────│──────────│
└──────┘   └──────────┘     └──────────┘     └──────────┘
```

## Database Architecture (PostgreSQL Schema Relationships)

```
┌───────────┐     ┌───────────┐     ┌───────────┐
│   User    │1──1│  Garden   │1──N│   Crop    │
│           │     │           │     │           │
│PK id      │     │PK id      │     │PK id      │
│ email     │     │ name      │     │ name      │
│ username  │     │ type      │     │ species   │
│ password  │     │ lat/lng   │     │ status    │
│ role      │     │ soilQual  │     │ health    │
│ geohash   │     │ userId FK │     │ gardenIdFK│
│ scores(*) │     └───────────┘     │ userId FK │
│ trustScore│                      └───────────┘
│ streak    │     ┌────────────────────┐
└─────┬─────┘     │  Marketplace        │
      │           │  Listing            │
      │           │ PK id               │
      │           │ title, price        │
      │           │ category, status    │
      │           │ sellerId FK         │
      │           └──────────┬──────────┘
      │                      │
      │           ┌──────────▼──────────┐
      │           │ MarketplaceTx        │
      │           │ PK id                │
      ├──────────►│ listingId FK         │
      │           │ buyerId FK           │
      │           │ sellerId FK          │
      │           │ blockchainTxId       │
      │           └─────────────────────┘
      │
      ├──────────►┌───────────┐
      │           │ IotDevice │
      │           ├───────────┤────┌──────────────┐
      │           │PK id      │    │ SensorReading │
      │           │name, type │    ├──────────────┤
      │           │publicKey  │───►│PK id         │
      │           │userId FK  │    │sensorType    │
      │           └───────────┘    │value, unit   │
      │                            │deviceId FK   │
      ├──────────►┌──────────┐     │userId FK     │
      │           │Invite    │     └──────────────┘
      │           ├──────────┤
      │           │code      │     ┌──────────┐
      │           │createdBy │     │Group     │
      │           │redeemBy  │     ├──────────┤
      │           └──────────┘     │name, type│
      │                            │region    │
      ├──────────►┌──────────┐     └────┬─────┘
      │           │ Message  │          │
      │           ├──────────┤    ┌─────▼─────┐
      │           │encrypted │    │GroupMember│
      │           │senderId  │    ├───────────┤
      │           │receiverId│    │role       │
      │           │groupId   │    │groupId FK │
      │           └──────────┘    │userId FK  │
      │                           └───────────┘
      ├──────────►┌──────────────────┐
      │           │ Notification      │
      │           │ type, title, body │
      │           │ userId FK         │
      │           └──────────────────┘
      │
      ├──────────►┌───────────────┐
      │           │ AiScan        │
      │           │ imageUrl      │
      │           │ healthScore   │
      │           │ diagnoses     │
      │           └───────────────┘
      │
      ├──────────►┌──────────────────┐
      │           │  Session         │
      │           │  token (unique)  │
      │           │  refreshToken    │
      │           │  isRevoked       │
      │           │  expiresAt       │
      │           └──────────────────┘
      │
      ├──────────►┌──────────────────┐
      │           │  AuditLog        │
      │           │  action, entity  │
      │           │  changes (JSON)  │
      │           │  ipAddress       │
      │           └──────────────────┘
      │
      ├──────────►┌─────────────┐
      │           │ Reputation  │
      │           │ Log         │
      │           └─────────────┘
      │
      └──────────►┌────────────────┐
                   │ Moderation     │
                   │ Report         │
                   │ reporterId FK  │
                   │ actionedBy FK  │
                   └────────────────┘
```

## Redis Usage Patterns

```
┌──────────────────────────────────────────────────────────────┐
│                    REDIS USAGE MAP                            │
│                                                               │
│  1. CACHING                                                   │
│     ├── Session Tokens              EXPIRE: 7d                │
│     ├── Weather Data                EXPIRE: 30min             │
│     ├── AI Scan Results             EXPIRE: 1h                │
│     ├── Leaderboards                Sorted Set                │
│     ├── User Profiles               EXPIRE: 5min              │
│     ├── Geo Queries                 EXPIRE: 10min             │
│     └── Garden Stats                EXPIRE: 5min              │
│                                                               │
│  2. RATE LIMITING                                              │
│     ├── API Throttling              INCR + EXPIRE             │
│     ├── OTP Rate Limit              EXPIRE: 60s               │
│     ├── Login Attempts              EXPIRE: 15min             │
│     └── QR Use Limit                EXPIRE: permanent         │
│                                                               │
│  3. QUEUES (BullMQ)                                           │
│     ├── growth-queue                Crop lifecycle            │
│     ├── notify-queue                Push/email/SMS            │
│     ├── ai-queue                    Image processing          │
│     ├── iot-ingest-queue            Sensor data               │
│     ├── weather-queue               Forecast fetching         │
│     └── blockchain-queue            Transaction submission    │
│                                                               │
│  4. PUB/SUB                                                    │
│     ├── Socket.IO Adapter           Horizontal scaling        │
│     └── Internal Events             Cross-module events       │
│                                                               │
│  5. REAL-TIME DATA                                             │
│     ├── Active Users Set            SISMEMBER                  │
│     ├── User Presence               Last seen                  │
│     └── Sensor Latest               String (current value)    │
│                                                               │
│  6. DISTRIBUTED LOCKS                                          │
│     ├── Crop Growth Lock            Prevent double-process    │
│     ├── Transaction Lock            Escrow concurrency        │
│     └── Invite Redeem Lock          Race condition prevent    │
└──────────────────────────────────────────────────────────────┘
```

## Module Interaction Diagram

```
                    ┌────────────┐
                    │  Gateway   │
                    │  (Nginx)   │
                    └─────┬──────┘
                          │
              ┌───────────┴───────────┐
              │                       │
     ┌────────▼────────┐    ┌────────▼────────┐
     │  Auth Module    │    │  ThrottlerGuard  │
     │  JWT Strategy   │    │  (Global)        │
     │  OTP Service    │    └─────────────────┘
     │  Telegram Auth  │
     └────────┬────────┘
              │
     ┌────────▼─────────────────────────────────────────────┐
     │                  API Controllers Layer                │
     │                                                       │
     │  Users    Gardens   Crops   Market   Weather    AI    │
     │  IoT      Notif     Geo     Intel    Mod       Chat   │
     │  Comm     Invite    QR      Feature  Blockchain      │
     │  Rep      Admin     Analytics Health                  │
     └────────┬────────────────────────────────┬────────────┘
              │                                │
              ▼                                ▼
     ┌──────────────────┐          ┌──────────────────┐
     │  Prisma Service   │          │  Redis Service    │
     │  (PostgreSQL)     │          │  (Cache/Queue)    │
     └──────────────────┘          └──────────────────┘
              │
     ┌────────┴────────┐
     │  External APIs   │
     │  Weather API     │
     │  Govt Intel API  │
     │  AI Service      │
     │  Telegram Bot    │
     │  FCM (Push)      │
     │  Blockchain RPC  │
     └─────────────────┘
```
