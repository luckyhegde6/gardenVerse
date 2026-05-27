# GardenVerse - Product Requirements Document

**Version:** 1.0.0  
**Status:** Draft  
**Last Updated:** May 2026

---

## 1. Executive Summary

GardenVerse is a hybrid agriculture simulation ecosystem that bridges virtual gardening with real-world farming. It combines AI-powered plant diagnosis, IoT sensor integration, a P2P marketplace for garden produce, and blockchain-verified reputation/rewards into a gamified social platform. Users can create virtual gardens, connect IoT sensors to monitor real plants, trade produce with neighbors, earn reputation tokens for sustainable practices, and access government agricultural schemes — all in one unified experience.

### Vision
To create the world's largest social gardening platform that educates, connects, and rewards people for growing food sustainably.

### Mission
Democratize agriculture knowledge through AI, connect growers locally through marketplace and community features, and incentivize sustainable farming practices through verifiable on-chain reputation.

---

## 2. Problem Statement

| Problem | Impact | Solution |
|---------|--------|----------|
| Urban dwellers lack space/knowledge to garden | Food insecurity, disconnect from food sources | Virtual garden simulation with real-plant mapping |
| New gardeners struggle with plant diseases | Crop loss, frustration, abandonment | AI-powered plant diagnosis |
| Local produce trade is fragmented | Food waste, missed economic opportunity | P2P marketplace with escrow |
| Sustainable practices aren't incentivized | Environmental degradation | Tokenized rewards (Green Credits, Eco Points) |
| Government agri-schemes are hard to access | Low adoption of beneficial programs | Aggregated intelligence feed |
| Gardening is solitary | Low engagement, high churn | Community groups, leaderboards, challenges |

---

## 3. Target Audience

### Primary Users
- **Urban Gardeners** (ages 25-45): Apartment dwellers with balcony/terrace gardens
- **Home Gardeners** (ages 30-60): Homeowners with yard gardens
- **Sustainability Enthusiasts** (all ages): People focused on eco-friendly living

### Secondary Users
- **Small-scale Farmers**: Need AI diagnosis, market access
- **Community Garden Organizers**: Manage shared spaces
- **Students/Educators**: Learning platform for agriculture
- **Government Agencies**: Distribute schemes and advisories

### Tertiary Users
- **Administrators**: Platform management
- **Moderators**: Content moderation
- **IoT Enthusiasts**: Hardware integration

---

## 4. User Personas

### Persona 1: Urban Emma
- **Age:** 32
- **Occupation:** Software engineer
- **Gardening experience:** Beginner
- **Goals:** Grow herbs on balcony, learn plant care
- **Pain points:** Kills plants often, doesn't know when to water
- **Key features:** AI plant scan, watering reminders, simple garden UI

### Persona 2: Community Carl
- **Age:** 45
- **Occupation:** Teacher
- **Gardening experience:** Intermediate
- **Goals:** Connect with local gardeners, trade produce
- **Pain points:** Excess zucchini, wants to share/trade
- **Key features:** Marketplace, community groups, chat

### Persona 3: Sustainable Sarah
- **Age:** 28
- **Occupation:** Environmental consultant
- **Gardening experience:** Intermediate
- **Goals:** Track sustainability impact, earn recognition
- **Pain points:** Wants metrics for eco-friendly practices
- **Key features:** Sustainability score, leaderboards, reputation tokens

### Persona 4: Farmer Raj
- **Age:** 52
- **Occupation:** Small-scale farmer
- **Gardening experience:** Expert
- **Goals:** Disease diagnosis, government scheme access
- **Pain points:** Can't afford agronomist, complex scheme paperwork
- **Key features:** AI diagnosis, government intelligence, IoT soil sensors

---

## 5. Feature Requirements

### 5.1 Authentication & Users

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| AUTH-01 | Email/password registration | P0 | Standard registration with email verification |
| AUTH-02 | JWT + Refresh token auth | P0 | Secure stateless authentication |
| AUTH-03 | OTP verification | P0 | Email OTP for verification and 2FA |
| AUTH-04 | Password reset | P0 | Email-based password reset flow |
| AUTH-05 | Telegram login | P1 | Link Telegram account for notifications |
| AUTH-06 | OAuth (Google/Apple) | P2 | Social login |
| AUTH-07 | User profiles | P0 | Display name, avatar, bio, stats |
| AUTH-08 | Leaderboard | P1 | Rankings by sustainability, level, etc. |
| AUTH-09 | Level/XP system | P0 | Gamification progression |

### 5.2 Gardens & Crops

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| GDN-01 | Create/manage garden | P0 | Virtual, real, or hybrid garden types |
| GDN-02 | Plot-based crop system | P0 | Grid-based planting with X,Y coordinates |
| GDN-03 | Crop lifecycle | P0 | Seed → Sprouting → Growing → Mature → Harvest |
| GDN-04 | Watering mechanic | P0 | Manual watering with cooldown |
| GDN-05 | Fertilizing mechanic | P1 | Nutrient management |
| GDN-06 | Growth timers | P0 | Real-time growth based on plant type |
| GDN-07 | Weather effects | P1 | Weather impacts crop growth |
| GDN-08 | Garden themes/decorations | P2 | Visual customization |
| GDN-09 | Garden stats | P1 | Health scores, yield tracking |

### 5.3 AI Features

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| AI-01 | Plant photo diagnosis | P0 | Identify plant, detect diseases |
| AI-02 | Disease probability scoring | P0 | Confidence scores for each diagnosis |
| AI-03 | Treatment recommendations | P0 | Actionable advice for detected issues |
| AI-04 | Watering recommendations | P1 | AI-optimized watering schedules |
| AI-05 | Fertilizer recommendations | P1 | Nutrient deficiency detection |
| AI-06 | Crop suggestions | P1 | Season/region-appropriate crop recommendations |
| AI-07 | Sustainability tips | P2 | Personalized eco-improvement suggestions |
| AI-08 | Scan history | P1 | User's diagnosis history |

### 5.4 Marketplace

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| MKT-01 | Create listings | P0 | List produce, seeds, tools for trade/sale |
| MKT-02 | Browse/filter listings | P0 | Category, price, location filters |
| MKT-03 | Purchase with escrow | P0 | Secure payment via Green Credits |
| MKT-04 | Transaction history | P0 | Complete record of trades |
| MKT-05 | Local search | P1 | Find nearby listings |
| MKT-06 | Blockchain escrow | P2 | Smart contract escrow (phase 3) |
| MKT-07 | Dispute resolution | P1 | Moderation-assisted dispute handling |

### 5.5 IoT Integration

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| IOT-01 | Device registration | P1 | Connect ESP32/soil sensors |
| IOT-02 | Sensor data ingestion | P1 | Real-time soil moisture, temp, pH |
| IOT-03 | Live readings | P1 | WebSocket-streamed sensor data |
| IOT-04 | Reading history | P1 | Historical data visualization |
| IOT-05 | Public key auth | P1 | Signed sensor readings |
| IOT-06 | MQTT bridge | P1 | MQTT to HTTP translation |

### 5.6 Community & Social

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| COM-01 | Community groups | P1 | Create/join regional or interest-based groups |
| COM-02 | Direct messaging | P1 | E2E encrypted chat |
| COM-03 | Group chat | P1 | Encrypted group messaging |
| COM-04 | Nearby users/gardens | P2 | Discover local gardeners |
| COM-05 | Invite system | P1 | Referral codes with rewards |
| COM-06 | Moderation | P1 | User reporting and moderation system |

### 5.7 Notifications

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| NOT-01 | Push notifications | P0 | FCM push for crop alerts, messages |
| NOT-02 | In-app notifications | P0 | Notification center |
| NOT-03 | Weather alerts | P1 | Extreme weather warnings |
| NOT-04 | Growth milestones | P0 | Notifications when crops grow/harvestable |

### 5.8 Weather & Intelligence

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| WEA-01 | Current weather | P0 | Temperature, humidity, conditions |
| WEA-02 | Forecast | P1 | 7-day weather forecast |
| WEA-03 | Weather alerts | P1 | Extreme weather notifications |
| INT-01 | Government schemes | P2 | Aggregated agri-schemes by region |
| INT-02 | Agricultural advisories | P2 | Pest/disease warnings from govt |
| INT-03 | Agriculture news | P2 | Regional farming news |

### 5.9 Gamification & Economy

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| GAM-01 | Experience points (XP) | P0 | Earn XP for gardening actions |
| GAM-02 | Levels | P0 | Progression system with unlocks |
| GAM-03 | Green Credits | P0 | Marketplace currency |
| GAM-04 | Eco Points | P0 | Sustainability reward points |
| GAM-05 | Streaks | P1 | Daily engagement streaks |
| GAM-06 | Leaderboards | P1 | Community rankings |
| GAM-07 | Reputation tokens | P2 | Blockchain reputation (phase 3) |
| GAM-08 | Sustainability score | P1 | Environmental impact metric |

### 5.10 Admin & Moderation

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| ADM-01 | Admin dashboard | P1 | User, system, moderation stats |
| ADM-02 | User management | P1 | Roles, suspension, bans |
| ADM-03 | Feature flags | P1 | Toggle features per environment/user |
| ADM-04 | Moderation queue | P1 | Report review and action |
| ADM-05 | Audit logs | P1 | Security event logging |

### 5.11 QR Codes

| ID | Feature | Priority | Description |
|----|---------|----------|-------------|
| QR-01 | Generate QR | P1 | Signed QR for trades, garden visits |
| QR-02 | Validate QR | P1 | Server-side validation |
| QR-03 | Use/consume QR | P1 | One-time use with replay protection |
| QR-04 | Encrypted payload | P1 | AES-256-GCM encrypted QR data |

---

## 6. Technical Architecture

### 6.1 System Architecture
- **Backend:** NestJS (Node.js 22) with modular monolith pattern
- **Database:** PostgreSQL 16 with Prisma ORM
- **Cache/Queue:** Redis 7 (BullMQ for queues)
- **Realtime:** Socket.IO with Redis adapter
- **Mobile:** React Native (Expo 51) with NativeWind
- **AI Service:** FastAPI (Python 3.11) with PyTorch
- **IoT Gateway:** MQTT (Mosquitto) bridge
- **Admin Panel:** Next.js 14
- **Blockchain:** Solidity + Hardhat (Ethereum L2)

### 6.2 Database
- **Tables:** 20+ (User, Garden, Crop, MarketplaceListing, MarketplaceTransaction, IotDevice, SensorReading, Message, Group, GroupMember, Notification, AiScan, WeatherRecord, GovernmentAdvisory, Invite, QrSession, BlockchainTransaction, ReputationLog, ModerationReport, FeatureFlag, AuditLog, Session, Inventory)
- **Indexes:** Performance indexes on foreign keys, timestamps, and frequently queried columns
- **Enums:** UserRole, GardenType, CropStatus, TransactionStatus, SensorType, ListingStatus

### 6.3 API Design
- **RESTful:** 60+ endpoints across 18 resource modules
- **WebSocket:** Real-time events for garden sync, chat, notifications
- **Versioning:** /api/v1/ prefix
- **Documentation:** Swagger/OpenAPI at /api/docs

---

## 7. Non-Functional Requirements

### 7.1 Performance
| Metric | Target |
|--------|--------|
| API response time (p95) | < 200ms |
| API response time (p99) | < 500ms |
| WebSocket latency | < 100ms |
| Database query time (p95) | < 50ms |
| First contentful paint (mobile) | < 2s |
| Time to interactive (mobile) | < 3s |
| Concurrent users | 10,000 |
| Daily active users | 50,000 |

### 7.2 Availability
| Metric | Target |
|--------|--------|
| Uptime | 99.9% |
| Planned downtime | < 4 hours/month |
| RPO (Recovery Point Objective) | 6 hours |
| RTO (Recovery Time Objective) | 2 hours |

### 7.3 Security
- TLS 1.3 for all communications
- End-to-end encryption for messages
- AES-256-GCM for QR payloads
- bcrypt (12 rounds) for passwords
- RS256 JWT tokens
- Rate limiting on all endpoints
- Helmet security headers
- CORS whitelist
- SQL injection prevention (Prisma)
- XSS prevention (class-validator)

### 7.4 Scalability
- Horizontal scaling: Stateless backend, add replicas
- Database: Read replicas, connection pooling
- Cache: Redis cluster with replication
- Queue: BullMQ with Redis Cluster
- CDN: Static assets, user uploads

---

## 8. User Stories

### Epic 1: Onboarding
```
As a new user
I want to create an account and set up my garden
So that I can start my gardening journey

Acceptance Criteria:
- Register with email + password
- Verify email with OTP
- Complete onboarding tutorial
- Create first garden (virtual or real)
- Plant first crop
```

### Epic 2: Daily Gardening
```
As a gardener
I want to tend to my crops daily
So that they grow healthy and I can harvest

Acceptance Criteria:
- View garden with all crops
- Water crops (with cooldown)
- See crop health, growth stage
- Receive notifications when crops need care
- Harvest mature crops
```

### Epic 3: Plant Diagnosis
```
As a gardener
I want to scan my sick plant
So that I can identify the disease and treat it

Acceptance Criteria:
- Take/upload plant photo
- AI identifies plant species
- AI detects diseases with probability scores
- Get treatment recommendations
- View scan history
```

### Epic 4: Marketplace
```
As a gardener with excess produce
I want to list it for sale
So that I can earn Green Credits

Acceptance Criteria:
- Create listing with photos, price, quantity
- Browse and search listings
- Purchase with escrow protection
- View transaction history
- Rate transaction partners
```

### Epic 5: Community
```
As a gardener
I want to connect with local gardeners
So that I can share tips and trade produce

Acceptance Criteria:
- Join regional community groups
- Send direct messages (E2EE)
- View nearby gardeners
- Use invite codes to invite friends
- Participate in group chats
```

### Epic 6: IoT Integration
```
As a tech-savvy gardener
I want to connect soil sensors
So that I can monitor my garden conditions in real-time

Acceptance Criteria:
- Register IoT device with public key
- View live sensor readings
- See historical data charts
- Receive alerts for abnormal readings
- Device is verified and trusted
```

---

## 9. Gamification Economy

```
┌────────────────────────────────────────────────────────────┐
│  GARDENVERSE ECONOMY                                        │
│                                                             │
│  Actions → XP + Eco Points                                  │
│  Quality/Sustainability → Sustainability Score              │
│  Marketplace → Green Credits                                │
│  Community → Reputation Tokens (Phase 3)                    │
│                                                             │
│  ┌─────────────┐                                            │
│  │ Experience  │  Level up, unlock features                 │
│  │ Points (XP) │  +10 plant, +5 water, +50 harvest         │
│  └─────────────┘                                            │
│                                                             │
│  ┌─────────────┐                                            │
│  │ Green Credits│ Marketplace currency                      │
│  │ (GC)        │  Earned: selling produce                    │
│  │             │  Spent: buying from others                  │
│  └─────────────┘                                            │
│                                                             │
│  ┌─────────────┐                                            │
│  │ Eco Points  │ Sustainability reward                      │
│  │ (EP)        │  +5 water, +10 compost, +20 harvest        │
│  │             │  Redeem: badges, themes, boosts             │
│  └─────────────┘                                            │
│                                                             │
│  ┌─────────────┐                                            │
│  │ Sustain-    │ Overall environmental impact               │
│  │ ability     │ Based on: actions, IoT data, consistency   │
│  │ Score       │ Range: 0-100                               │
│  └─────────────┘                                            │
│                                                             │
│  ┌─────────────┐                                            │
│  │ Reputation  │ On-chain reputation (Phase 3)              │
│  │ Tokens      │ Community awards, verifiable               │
│  └─────────────┘                                            │
└────────────────────────────────────────────────────────────┘
```

### XP Table
| Level | XP Required | Unlocks |
|-------|-------------|---------|
| 1 | 0 | Basic garden, 1 crop plot |
| 2 | 100 | Chat, notifications |
| 3 | 300 | AI scan (3 free/month) |
| 4 | 600 | Marketplace browsing |
| 5 | 1000 | Invite system |
| 6 | 1500 | 2 crop plots |
| 7 | 2100 | Marketplace sell |
| 8 | 2800 | AI scan (unlimited) |
| 9 | 3600 | Community groups |
| 10 | 4500 | Garden themes |

---

## 10. Success Metrics

### User Metrics
- **DAU/MAU ratio:** > 30%
- **Retention D30:** > 40%
- **Retention D90:** > 20%
- **Average session duration:** > 8 minutes
- **Daily actions per user:** > 5

### Engagement Metrics
- **Crops planted per user/week:** > 3
- **AI scans per user/month:** > 2
- **Marketplace listings per user/month:** > 1
- **Messages sent per user/week:** > 5
- **Groups joined per user:** > 2

### Business Metrics
- **Green Credits in circulation:** Tracking
- **Marketplace GMV:** Monthly transaction volume
- **Invite conversion rate:** > 15%
- **IoT device adoption:** > 5% of active users
- **Premium conversion (future):** > 3%

### Quality Metrics
- **AI diagnosis accuracy:** > 85%
- **API uptime:** > 99.9%
- **App crash rate:** < 0.1%
- **Support tickets per user:** < 0.01/month

---

## 11. Release Phases

### Phase 1: Foundation (Current)
- Authentication & user system
- Garden & crop management
- AI plant diagnosis (basic)
- Gamification (XP, levels, Eco Points)
- Push notifications
- Basic leaderboard

### Phase 2: Community & Commerce
- Marketplace with escrow
- Community groups & chat (E2EE)
- Invite system
- Weather integration
- Government intelligence
- Moderation system
- QR codes for trading

### Phase 3: Advanced Features
- IoT device integration
- Blockchain tokens & reputation
- Advanced AI (recommendations engine)
- Telemedicine-for-plants (expert consultation)
- AR garden preview
- Premium subscriptions

### Phase 4: Ecosystem
- API for third-party developers
- Plugin/garden asset marketplace
- Enterprise (schools, communities)
- Carbon credit integration
- AI-powered automated garden management

---

## 12. Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| AI misdiagnosis causing crop loss | Medium | High | Disclaimers, human expert option |
| Marketplace scam/fraud | Medium | High | Escrow system, reputation scores, moderation |
| IoT device security breach | Low | Critical | Public key auth, firmware verification |
| GDPR/regulatory non-compliance | Low | Critical | DPIA, data minimization, legal review |
| Low user retention | Medium | High | Gamification, social features, push notifications |
| Database performance degradation | Medium | Medium | Indexing, read replicas, caching |
| Blockchain gas costs (Phase 3) | Medium | Medium | L2 solution, gas station pattern |
| Competitor launch | Low | Medium | Feature differentiation, community focus |
