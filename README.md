# 🌱 GardenVerse

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](package.json)
[![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs)](packages/backend)
[![React Native](https://img.shields.io/badge/React_Native-0.74-61DAFB?logo=react)](packages/mobile)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql)](docker-compose.yml)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)](packages/backend/prisma)
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
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  React Native│   │  Next.js     │   │  IoT Devices │
│  (Mobile)    │   │  (Admin)     │   │  (ESP32)     │
└──────┬───────┘   └──────┬───────┘   └──────┬───────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
                 ┌────────▼────────┐
                 │   NestJS API    │
                 │   Gateway       │
                 └────────┬────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
   ┌──────────┐    ┌──────────┐    ┌──────────┐
   │PostgreSQL│    │  Redis   │    │ FastAPI  │
   │ (Prisma) │    │(Cache+Q) │    │ (AI Svc) │
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
cp packages/backend/.env.example packages/backend/.env
# Edit .env with your API keys:
# - WEATHER_API_KEY: https://openweathermap.org/api (free tier)
# - GOOGLE_MAPS_API_KEY: https://console.cloud.google.com (optional)
# - TREFLE_API_KEY: https://trefle.io (optional, for extended plant data)
```

### 3. Start Infrastructure (Docker)
```bash
npm run docker:local
# Starts PostgreSQL (5432) + Redis (6379)
```

### 4. Database Setup
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed    # Optional: sample plants from OpenFarm
```

### 5. Start Development Servers
```bash
# Backend API (NestJS) on :3001
npm run backend:dev

# Admin Dashboard (Next.js) on :3000
npm run admin:dev

# Mobile (Expo)
npm run mobile:dev

# AI Service (if needed locally)
npm run ai:dev
```

### 6. Verify
```bash
# API
curl http://localhost:3001/api/v1/health

# Swagger docs: http://localhost:3001/api/docs

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
| **Admin Dashboard** | http://localhost:3000 | 3000 |
| **Backend API** | http://localhost:3001 | 3001 |
| **API Swagger Docs** | http://localhost:3001/api/docs | 3001 |
| **AI Service** | http://localhost:8000 | 8000 |
| **PostgreSQL** | localhost:5432 | 5432 |
| **Redis** | localhost:6379 | 6379 |
| **MQTT Broker** | localhost:1883 | 1883 |

---

## 🔒 Security

GardenVerse follows security best practices:

- **CORS** — Restricted to known origins (localhost in dev, Vercel domain in prod)
- **Authentication** — JWT with 15-minute access tokens and 7-day refresh tokens
- **Authorization** — Role-based access (User, Admin, Super Admin) with NestJS guards
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
│   ├── backend/           # NestJS API server (port 3001)
│   │   ├── prisma/        # Database schema (30+ models)
│   │   └── src/
│   │       ├── modules/   # 24 feature modules (plants, upload + existing)
│   │       ├── agents/    # 7 event-driven agents
│   │       ├── common/    # Shared guards, decorators, pipes
│   │       └── config/    # App configuration
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
| **Backend** | Node.js 22, NestJS 10, TypeScript 5 |
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
