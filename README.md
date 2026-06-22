# 🌱 GardenVerse

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](package.json)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?logo=next.js)](packages/admin)
[![React Native](https://img.shields.io/badge/React_Native-0.74-61DAFB?logo=react)](packages/mobile)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)](docker-compose.yml)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)](packages/admin/prisma)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](tsconfig.base.json)

> **Hybrid agriculture simulation ecosystem** — virtual gardening, AI-powered agriculture assistant, IoT-enabled farming, and geospatial community platform.

GardenVerse bridges the gap between digital gardening and real-world agriculture. It gamifies sustainable farming, connects local growers, and leverages AI to make expert agricultural knowledge accessible to everyone.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **🌿 Virtual Garden** | Create and manage digital gardens with real plant lifecycles |
| **🤖 AI Plant Doctor** | Snap a photo — AI diagnoses diseases and suggests treatments |
| **📡 IoT Integration** | Connect soil sensors for real-time monitoring |
| **🏪 Marketplace** | Trade produce with neighbors using escrow-protected transactions |
| **👥 Community** | Groups, E2E encrypted chat, local gardening networks via geohash |
| **🏆 Gamification** | XP, levels, streaks, leaderboards, sustainability scores |
| **🌤️ Weather Intelligence** | OpenWeatherMap real-time weather, 7-day forecasts, alerts |
| **🗺️ Geospatial** | Google Maps geocoding, places search, nearby gardeners |
| **🌱 Plant Database** | Public datasets (OpenFarm + Trefle), 26+ crops with full metadata |
| **🔐 QR Trading** | Signed QR codes for secure in-person trading |
| **📊 Admin Dashboard** | Full-featured admin panel with moderation tools |

---

## 🏗️ Architecture

```
┌──────────────┐   ┌──────────────────────┐   ┌──────────────┐
│  React Native│   │  Next.js 14          │   │  IoT Devices │
│  (Mobile)    │   │  (Admin UI + API)    │   │  (ESP32)     │
└──────┬───────┘   └──────┬───────────────┘   └──────┬───────┘
       │                  │                          │
       └──────────────────┼──────────────────────────┘
                          │
                 ┌────────▼────────┐
                 │   PostgreSQL    │
                 │   (Prisma)      │
                 └────────┬────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
   ┌──────────┐    ┌──────────┐    ┌──────────┐
   │  Redis   │    │ FastAPI  │    │  BullMQ  │
   │(Cache+Q) │    │ (AI Svc) │    │ (Worker) │
   └──────────┘    └──────────┘    └──────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 22.0.0 (LTS)
- Docker & Docker Compose
- npm (comes with Node.js)
- API Keys: OpenWeatherMap, Google Maps (optional for local dev)

### 1. Clone and Install
```bash
git clone https://github.com/gardenverse/gardenverse.git
cd gardenverse

npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
# Edit .env with your API keys:
```

### 3. Start Infrastructure (Docker) — Backend Services
```bash
# Full stack (PostgreSQL + Redis + AI Service)
npm run docker:up

# OR just the essentials (PostgreSQL + Redis, no AI)
npm run docker:local
# Starts PostgreSQL (5432) + Redis (6379)
```

### 4. Database Setup
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed    # Seeds 20+ plant species, demo garden, crops
```

### 5. Start Development Servers
Run these in separate terminals:

```bash
# Terminal 1: Admin Dashboard + API (Next.js, unified) on :3000
npm run admin:dev

# Terminal 2: Mobile (Expo) — requires admin:dev running for API
npm run mobile:dev

# Terminal 3: AI Service (Python FastAPI, optional — admin falls back to TS analysis)
npm run ai:dev
```

**Service URLs (local development):**

| Service | URL | Notes |
|---------|-----|-------|
| **Admin Dashboard** | http://localhost:3000 | Next.js UI + API routes |
| **API Endpoints** | http://localhost:3000/api/v1/* | All backend APIs |
| **AI Service** | http://localhost:8000 | Python FastAPI (optional) |
| **PostgreSQL** | localhost:5432 | Docker |
| **Redis** | localhost:6379 | Docker |

**Important:**
- The AI service is **optional** for local dev. When it's down, the admin app falls back to TypeScript-based analysis using the disease database.
- The mobile app requires the admin API running on `:3000`. Set `NEXT_PUBLIC_API_URL=http://localhost:3000` in the mobile env.
- To configure which AI service URL the admin uses, set `NEXT_PUBLIC_AI_SERVICE_URL` (defaults to `http://localhost:8000`).

### 6. Verify
```bash
# API + Dashboard (same port)
curl http://localhost:3000/api/v1/health          # Health check
curl http://localhost:3000/api/v1/auth/admin/login # Admin login

# API Docs: http://localhost:3000/api-docs

# Admin Dashboard: http://localhost:3000

# Run E2E tests:
npm run test:e2e

# Generate workflow screenshots:
npm run workflow:all
```

---

## 🧪 Demo Accounts

Use these pre-seeded accounts for testing the platform:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@gardenverse.vercel.app | password123 |
| **Super Admin** | superadmin@gardenverse.vercel.app | password123 |
| **Demo User** | demo@gardenverse.vercel.app | password123 |

---

## 📱 Mobile App Demo

### Quick Start

```bash
# Start the backend API (required for mobile)
npm run admin:dev          # Serves API at localhost:3000

# In another terminal, start Expo
cd packages/mobile
npx expo start             # Scan QR with Expo Go
```

### Demo Login

Log in with any demo account above. The demo user has a pre-seeded **virtual garden** with active crops ready to interact with.

### Garden Features (the core experience)

| Feature | How to Demo | What to Look For |
|---------|-------------|------------------|
| **2D Isometric Grid** | Tap "2D" toggle on garden screen | 6×6 diamond-tile grid with soil color by quality, plant sprites at 4 growth stages, irrigation overlay on hydrated plots, plant shadows, colored borders (green=mature, red=wilted) |
| **3D Garden View** | Tap "3D" toggle | 6×3D grid with terrain elevation, fence perimeter, water shimmer on hydrated crops, hemisphere + directional lighting. Drag to orbit the camera. Auto-rotates when idle. Plants bob and sway. |
| **Growth Engine** | Watch the garden over time | Virtual gardens grow at **100x speed** — 1 tick every 30s real-time ≈ 50 game-minutes. Crops advance through Seed → Sprouting → Growing → Mature in ~36 minutes. Hydration and nutrients decay each tick. Health drops below thresholds. Watering/fertilizing gives a temporary growth boost. |
| **Plant a Crop** | Tap empty plot or "+ Plant" button | Select from 20+ Indian plant species. Plants are placed on the 6×6 grid at the tapped coordinates. |
| **Water / Fertilize** | Tap a planted crop to select it, then use action buttons | Hydration +20, nutrient +30. Each action also boosts the growth engine's next tick (water=+3 boost, fertilize=+2 boost). |
| **Harvest** | Tap a MATURE crop | Harvest adds yield to inventory with rarity based on health. |
| **Crop Detail** | Double-tap a selected crop | Full crop stats: growth stage %, health, hydration, nutrient level, care streak, harvest count. |
| **Care Streaks** | Scroll below the garden | Top 5 crops by care streak displayed with emoji badges at milestones (3/7/14/30 days). |
| **Plant Collections** | Section below garden | Species discovery progress bar, mastery level, XP progression. |
| **First-Time Walkthrough** | On first login | 5-step overlay (Welcome → Plant → Water → Fertilize → Harvest) with icons, descriptions, progress dots. Skip anytime. |

### Garden3D Controls

| Gesture | Action |
|---------|--------|
| **Drag left/right** | Orbit camera horizontally around the garden |
| **Drag up/down** | Adjust camera height (1.5–8 units) |
| **Release** | Auto-rotation resumes after 1s of inactivity |

### Growth Engine Behavior

```
Real time:    30 seconds  =  1 game tick
Virtual tick: 1 tick      =  50 game minutes
100% growth:  72 ticks    ≈  36 minutes real time

Each tick:
  - growthStage +1.39 (boosted to +2.78 after water/fertilize)
  - hydration -2 (×1.5 in high sun, ×0.5 in shade)
  - nutrientLevel -1
  - health +0.5 (if hydrated & fed) or -3 (if stressed)
  - Status: SEED → SPROUTING → GROWING → MATURE
```

### Other Mobile Features

| Feature | How to Access | Notes |
|---------|--------------|-------|
| **AI Plant Scanner** | Scanner tab | Camera-based plant identification with disease diagnosis |
| **Marketplace** | Marketplace tab | Browse, create listings, buy/sell produce with Green Credits |
| **Community** | Community tab | Groups, E2E encrypted chat, nearby gardeners via geohash |
| **IoT Dashboard** | Profile → IoT | Connect ESP32 soil sensors, view live readings |
| **Weather** | Garden → Weather icon | Real-time conditions and 7-day forecast from OpenWeatherMap |
| **Gamification** | All tabs (XP bar, badges) | Level up, earn Eco Points, maintain care streaks, master species |

---

## 🖥️ Admin Dashboard Pages

| Page | URL | Description |
|------|-----|-------------|
| **Dashboard** | `/dashboard` | Main admin overview with stats cards |
| **Users** | `/users` | User management, search, and roles |
| **Garden** | `/garden` | View all gardens and plant selections |
| **Plant Browser** | `/garden/plant` | Browse plant species catalog |
| **Crop Detail** | `/garden/crop/[id]` | Individual crop growth details |
| **Weather** | `/weather` | Real-time weather dashboard |
| **Marketplace** | `/marketplace` | Browse and manage listings |
| **Create Listing** | `/marketplace/create` | Create new marketplace listing |
| **Community** | `/community` | Community hub and activity feed |
| **Community Groups** | `/community/groups` | Group management |
| **AI Scanner** | `/ai-scanner` | AI plant disease scanner |
| **Scan History** | `/ai-scanner/history` | Past scan results |
| **Invites** | `/invites` | QR and invite link management |
| **Create Invite** | `/invites/create` | Generate new invites |
| **Analytics** | `/analytics` | Platform analytics and charts |
| **Moderation** | `/moderation` | Content moderation queue |
| **Feature Flags** | `/features` | Toggle features on/off |
| **Campaigns** | `/campaigns` | Marketing campaign management |
| **Super Admin** | `/super-admin/dashboard` | Super admin controls |
| **Settings** | `/settings` | Platform configuration |
| **Notes** | `/notes` | Internal admin notes |

---

## 🌐 Local Development URLs

| Service | URL | Port |
|---------|-----|------|
| **Admin Dashboard + API** | http://localhost:3000 | 3000 |
| **API Docs** | http://localhost:3000/api-docs | 3000 |
| **AI Service** | http://localhost:8000 | 8000 |
| **PostgreSQL** | localhost:5432 | 5432 |
| **Redis** | localhost:6379 | 6379 |
| **MQTT Broker** | localhost:1883 | 1883 |

---

## 🔒 Security

GardenVerse follows security best practices:

- **CORS** — Restricted to known origins (localhost in dev, Vercel domain in prod)
- **Authentication** — JWT with 15-minute access tokens and 7-day refresh tokens
- **Authorization** — Role-based access (User, Admin, Super Admin) with JWT middleware
- **Password Hashing** — bcrypt with 12 salt rounds
- **Rate Limiting** — Configured on all public endpoints
- **Helmet** — Security headers set for production
- **Input Validation** — All endpoints use `class-validator` DTOs
- **SQL Injection** — Prevented via Prisma ORM (no raw queries)
- **Geolocation** — Only geohashes stored, never exact coordinates
- **File Uploads** — Type and size validation (max 10MB)
- **QR Payloads** — Encrypted + signed with expiration timestamps

---

## 📁 Project Structure

```
gardenverse/
├── packages/
│   ├── admin/             # Next.js 14 unified app (API routes + UI, port 3000)
│   │   ├── prisma/        # Database schema (30+ models)
│   │   └── src/
│   │       ├── app/
│   │       │   ├── api/v1/ # 71 API routes across 29 modules
│   │       │   └── ...     # 31 UI pages (admin dashboard)
│   │       ├── components/ # Reusable UI components
│   │       └── lib/        # Auth middleware, API client, utilities
│   ├── backend/           # Legacy NestJS API (port 3001, deprecated)
│   ├── mobile/            # React Native (Expo) — garden map, plant browser
│   │   └── src/
│   │       ├── screens/   # 32+ screens
│   │       ├── stores/    # Zustand state management
│   │       ├── services/  # API client, socket, etc.
│   │       └── components/# Reusable UI components
│   └── admin/             # Next.js admin panel (port 3000)
├── services/
│   ├── ai/                # FastAPI + OpenCV AI service
│   └── iot/               # MQTT gateway & bridge
├── contracts/             # Solidity smart contracts (Hardhat)
├── e2e/                   # Playwright E2E tests & workflow screenshots
│   ├── workflows/         # Screenshot generation & demo recording scripts
│   ├── workflows-data/    # Generated HTML pages with animated galleries
│   ├── screenshots/       # Captured workflow PNG screenshots
│   └── docker/            # Test infrastructure (Postgres + Redis)
├── docs/                  # Full documentation suite
├── docker-compose.local.yml  # Local dev infrastructure
├── scripts/               # Vercel deploy test, utility scripts
└── playwright-report/     # Test results, videos, recordings
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [Architecture Overview](docs/architecture/overview.md) | System architecture, data flow, deployment topology |
| [Backend Architecture](docs/architecture/backend-architecture.md) | NestJS modules, queues, realtime, auth flow |
| [Mobile Architecture](docs/architecture/mobile-architecture.md) | Component hierarchy, state, navigation, offline |
| [Data Models](docs/architecture/data-models.md) | Entity relationships, schema documentation |
| [Event Flow](docs/architecture/event-flow.md) | Event-driven architecture, queue structure |
| [Security Architecture](docs/architecture/security-architecture.md) | SSL, encryption, key management, auth diagrams |
| [Scaling Strategy](docs/architecture/scaling-strategy.md) | Horizontal scaling, caching, sharding |
| [API Reference](docs/api/README.md) | Complete API documentation (24 modules, 80+ endpoints) |
| [Security Plan](docs/security/security-plan.md) | JWT, RBAC, encryption, anti-cheat, OWASP compliance |
| [Encryption Details](docs/security/encryption.md) | AES-256-GCM, libsodium, JWT, bcrypt specs |
| [Compliance](docs/legal/compliance.md) | GDPR, data privacy, age restrictions, moderation framework |
| [Disclaimers](docs/legal/disclaimers.md) | AI, weather, marketplace, IoT, community disclaimers |
| [Deployment Guide](docs/deployment/deployment-guide.md) | Docker, K8s, monitoring, backup, scaling |
| [CI/CD](docs/deployment/ci-cd.md) | GitHub Actions, testing, environment promotion |
| [PRD](docs/PRD.md) | Complete product requirements document |
| [Investor Demo](docs/investor-demo.md) | Investor presentation script |

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| **Backend** | Node.js 22, Next.js 14 App Router, TypeScript 5 |
| **Database** | PostgreSQL 16, Prisma ORM 5 |
| **Cache** | Redis 7 |
| **Queue** | BullMQ |
| **Realtime** | Socket.IO, Redis adapter |
| **Mobile** | React Native 0.74, Expo 51, NativeWind |
| **AI/ML** | FastAPI, OpenCV, PyTorch 2.1, Transformers |
| **IoT** | MQTT, Mosquitto, ESP32 |
| **Blockchain** | Solidity, Hardhat, OpenZeppelin |
| **Admin** | Next.js 14, TailwindCSS, Recharts |
| **Monitoring** | Prometheus, Grafana, Sentry |
| **E2E Testing** | Playwright, Docker Compose, ts-node |
| **External APIs** | OpenWeatherMap, Google Maps, OpenFarm, Trefle |
| **CI/CD** | GitHub Actions, Vercel, Husky pre-commit |

---

---

## 🧪 E2E Testing & Workflow Screenshots

### Run E2E Tests

```bash
# Full E2E: Docker infra → migrate → start apps → Playwright tests
npm run test:e2e

# With headed browser (watch tests run)
npm run test:e2e:headed

# Just start Docker infra (for manual testing)
npm run test:e2e:docker-only

# Agentic feedback loop (analyze test results → deploy readiness)
npm run test:feedback
```

### Generate Workflow Screenshots

```bash
# Generate all screenshots + demo recordings
npm run workflow:all

# Screenshots only (8 workflows)
npm run workflow:screenshots

# Demo recordings only (7 videos)
npm run workflow:recordings
```

### View Results

After running `npm run workflow:all`:

| Artifact | Location | Content |
|----------|----------|---------|
| **Screenshots** | `e2e/screenshots/` | PNG screenshots per workflow step |
| **HTML Pages** | `e2e/workflows-data/` | Animated gallery (index + 8 workflow pages) |
| **Recordings** | `playwright-report/recordings/` | WebM demo videos + manifest.json |
| **Test Report** | `playwright-report/html/` | Full Playwright HTML report |
| **Feedback** | `playwright-report/feedback-*.json` | Agentic feedback analysis |

The HTML pages at `e2e/workflows-data/index.html` can be published to **GitHub Pages** for easy sharing.

### Workflows Covered

1. **Authentication Flow** — Login, validation, super admin, protected routes
2. **Garden Management** — Overview, plant selection, plant browser, crop detail
3. **Admin Portal** — Dashboard, users, marketplace, invites, super admin
4. **Weather Dashboard** — Real-time OpenWeatherMap integration
5. **Marketplace** — Browse listings, create listings
6. **Community** — Hub, groups, nearby gardeners
7. **AI Scanner** — Plant identification interface, scan history
8. **Invite System** — QR codes, invite links, passcodes, tokens

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Commit Convention
We follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `refactor:` Code restructuring
- `test:` Test additions
- `chore:` Maintenance

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 📞 Contact

- **Website:** [https://gardenverse.vercel.app](https://gardenverse.vercel.app)
- **GitHub:** [luckyhegde6](https://github.com/luckyhegde6)
- **Project:** [github/luckyhegde6](https://github.com/luckyhegde6/gardenverse)

---

<p align="center">🌱 <strong>Grow Together, Sustainably.</strong> 🌱</p>
