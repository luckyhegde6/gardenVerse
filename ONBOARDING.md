# GardenVerse Onboarding

Welcome to **GardenVerse** — a hybrid agriculture simulation ecosystem blending virtual gardening, AI-powered plant diagnosis, IoT-enabled farming, and a geospatial community marketplace.

This guide will get you from zero to running the full stack on your local machine in minutes.

---

## Quick Start (5 minutes)

### Prerequisites

| Dependency | Version | Check |
|------------|---------|-------|
| **Node.js** | >= 22.0.0 | `node --version` |
| **npm** | >= 10.x | `npm --version` |
| **Docker** | Latest | `docker --version` |
| **Docker Compose** | v2+ | `docker compose version` |
| **Git** | Latest | `git --version` |

### Step 1: Clone & Install

```bash
git clone https://github.com/gardenverse/gardenverse.git
cd gardenverse
npm install
```

> This installs all packages across the monorepo (backend, admin, mobile) using npm workspaces.

### Step 2: Environment Setup

```bash
# Copy root environment file
cp .env.example .env

# Copy backend environment file
cp packages/backend/.env.example packages/backend/.env
```

Edit `.env` and `packages/backend/.env` with your API keys:

| Variable | Required? | Description |
|----------|-----------|-------------|
| `WEATHER_API_KEY` | Optional | OpenWeatherMap API key (free tier: https://openweathermap.org/api) |
| `GOOGLE_MAPS_API_KEY` | Optional | Google Cloud Maps API key |
| `TREFLE_API_KEY` | Optional | Extended plant data from Trefle (https://trefle.io) |
| `DATABASE_URL` | ✅ Yes | `postgresql://gardenverse:gardenverse123@localhost:5432/gardenverse` |
| `REDIS_URL` | ✅ Yes | `redis://localhost:6379` |

> No API keys are required for local development — the system falls back gracefully (simulated weather, local plant cache, etc.).

### Step 3: Start Infrastructure

```bash
npm run docker:local
```

This starts two Docker containers:
- **PostgreSQL 16** on port `5432` — primary database
- **Redis 7** on port `6379` — caching, queues, pub/sub

Verify with:

```bash
docker ps
```

You should see `gardenverse-postgres` and `gardenverse-redis` running.

### Step 4: Database Setup

```bash
# Generate Prisma client from schema
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed database with sample data
npm run prisma:seed
```

The seed script creates:
- Admin accounts (admin@gardenverse.vercel.app, superadmin@gardenverse.vercel.app)
- Demo user (demo@gardenverse.vercel.app)
- Sample plant species from OpenFarm (26+ crops)
- Garden templates
- Sample marketplace listings
- Weather records
- AI scan history

### Step 5: Start Development Servers

Open **three terminal windows** and run each command in its own terminal:

| Terminal | Command | Service | URL |
|----------|---------|---------|-----|
| 1 | `npm run backend:dev` | NestJS API | http://localhost:3001 |
| 2 | `npm run admin:dev` | Admin Dashboard | http://localhost:3000 |
| 3 | `npm run mobile:dev` | Mobile App (Expo) | http://localhost:8081 |

> The AI Python service (`npm run ai:dev`) is optional and only needed if you want to run plant disease detection locally.

### Step 6: Verify Everything Works

```bash
# API health check
curl http://localhost:3001/api/v1/health

# Open Admin Dashboard in browser
# http://localhost:3000

# View API documentation
# http://localhost:3001/api/docs
```

---

## Demo Accounts

After seeding the database, use these accounts to explore the platform:

| Role | Email | Password | Login Page |
|------|-------|----------|------------|
| **Admin** | admin@gardenverse.vercel.app | password123 | `/login` |
| **Super Admin** | superadmin@gardenverse.vercel.app | password123 | `/login` (then navigate to Super Admin) |
| **Demo User** | demo@gardenverse.vercel.app | password123 | Mobile app login |

> **Note:** Super Admin has access to the `/super-admin/dashboard` panel with additional system controls.

---

## Local Development URLs

| Service | URL | Port | Purpose |
|---------|-----|------|---------|
| **Admin Dashboard** | http://localhost:3000 | 3000 | Next.js admin panel |
| **Backend API** | http://localhost:3001/api/v1 | 3001 | NestJS REST API |
| **Swagger Docs** | http://localhost:3001/api/docs | 3001 | Interactive API documentation |
| **Mobile (Expo Web)** | http://localhost:8081 | 8081 | React Native Expo app |
| **PostgreSQL** | localhost:5432 | 5432 | Primary database |
| **Redis** | localhost:6379 | 6379 | Cache, queues, sessions |
| **MQTT Broker** | localhost:1883 | 1883 | IoT device communication |

---

## Admin Dashboard Pages

The admin dashboard provides full platform management capabilities:

| Page | URL | Description |
|------|-----|-------------|
| Dashboard | http://localhost:3000/dashboard | Analytics overview, user stats, system health |
| Users | http://localhost:3000/users | User management, roles, permissions, moderation |
| Gardens | http://localhost:3000/garden | View and manage all user gardens |
| Plant Browser | http://localhost:3000/garden/plant | Browse plant species catalog |
| Crop Detail | http://localhost:3000/garden/crop/[id] | Individual crop growth details |
| Weather | http://localhost:3000/weather | Real-time weather data, forecasts, alerts |
| Marketplaces | http://localhost:3000/marketplace | Browse and manage marketplace listings |
| Create Listing | http://localhost:3000/marketplace/create | Create new marketplace listing |
| Community | http://localhost:3000/community | Community hub, activity feed |
| Community Groups | http://localhost:3000/community/groups | Group management |
| AI Scanner | http://localhost:3000/ai-scanner | AI plant disease scanner records |
| Scan History | http://localhost:3000/ai-scanner/history | Past scan results |
| Invites | http://localhost:3000/invites | QR and invite link management |
| Create Invite | http://localhost:3000/invites/create | Generate new invites |
| Analytics | http://localhost:3000/analytics | Platform analytics and charts |
| Moderation | http://localhost:3000/moderation | Content moderation queue |
| Feature Flags | http://localhost:3000/features | Toggle features on/off, rollout management |
| Campaigns | http://localhost:3000/campaigns | Marketing campaign management |
| Super Admin | http://localhost:3000/super-admin/dashboard | Super admin system controls |
| Settings | http://localhost:3000/settings | Platform configuration |
| Notes | http://localhost:3000/notes | Internal admin notes |
| Onboarding | http://localhost:3000/onboarding | Game onboarding guide for new admins |

---

## Project Architecture

### Monorepo Structure

```
gardenverse/
├── packages/
│   ├── backend/              # NestJS API server (port 3001)
│   │   ├── prisma/           # Database schema, migrations, seeds
│   │   └── src/
│   │       ├── modules/      # 24 feature modules
│   │       ├── agents/       # 7 event-driven agents
│   │       ├── common/       # Shared guards, decorators, pipes
│   │       └── config/       # App configuration
│   ├── mobile/               # React Native (Expo) mobile app
│   └── admin/                # Next.js admin dashboard (port 3000)
├── services/
│   ├── ai/                   # FastAPI + OpenCV AI service (port 8000)
│   └── iot/                  # MQTT gateway & bridge
├── contracts/                # Solidity smart contracts (Hardhat)
├── e2e/                      # Playwright E2E tests & workflow screenshots
├── docs/                     # Full documentation suite
└── scripts/                  # Utility PowerShell scripts
```

### Data Flow

```mermaid
flowchart LR
    Mobile["React Native App"] --> API["NestJS API<br/>:3001"]
    Admin["Next.js Admin<br/>:3000"] --> API
    IoT["IoT Devices<br/>MQTT"] --> API
    
    API --> PSQL[("PostgreSQL<br/>Prisma ORM")]
    API --> Redis[("Redis<br/>Cache + Queue")]
    API --> AI["Python AI Service<br/>Plant Scanner"]
    
    Mobile -.-> WS["WebSocket<br/>Real-time"]
    Admin -.-> WS
```

### Backend Modules

The backend is organized into 24 modules, each handling a specific domain:

| Module | Domain | Key Features |
|--------|--------|-------------|
| `AuthModule` | Authentication | JWT login, refresh tokens, OAuth |
| `UsersModule` | User management | Profiles, roles, XP/levels |
| `GardenModule` | Virtual gardens | Garden CRUD, crop planting, growth simulation |
| `PlantsModule` | Plant database | Species catalog, OpenFarm sync, crop varieties |
| `WeatherModule` | Weather data | OpenWeatherMap integration, forecasts, alerts |
| `MarketplaceModule` | Trading | Listings, escrow, token transactions |
| `CommunityModule` | Social | Groups, chat, forums, geohash-based discovery |
| `AiScannerModule` | Plant scanning | Image upload, disease detection, recommendations |
| `UploadModule` | File handling | Image upload, validation, storage |
| `ModerationModule` | Content review | Reports, flagging, automated moderation |
| `AnalyticsModule` | Data insights | Usage metrics, growth trends, reports |
| `InvitesModule` | Invitations | QR codes, invite links, passcodes |
| `IotModule` | IoT devices | MQTT ingestion, device auth, sensor data |
| `CampaignsModule` | Marketing | Campaign creation, A/B testing |
| `FeatureFlagsModule` | Feature toggle | Gradual rollout, region targeting |
| `NotificationsModule` | Alerts | Push notifications, email, in-app |
| `ChallengesModule` | Gamification | Quests, achievements, leaderboards |

---

## Security

### Authentication Flow

```
Login → JWT (15m access token + 7d refresh token)
         ↓
   Protected routes require valid JWT
         ↓
   Admin routes require role guard (Admin / Super Admin)
```

- **JWT access tokens** expire every 15 minutes
- **Refresh tokens** expire after 7 days
- **Passwords** are hashed with bcrypt (12 salt rounds)
- **Rate limiting** is active on all public endpoints

### CORS Configuration

In development, CORS allows:
- `http://localhost:3000` — Admin dashboard
- `http://localhost:8081` — Expo web
- `http://localhost:3001` — Backend (self)

For production, CORS is restricted to known Vercel domains.

### Environment Variables

> ⚠️ **Never commit `.env` files to version control.** They are already gitignored.

Key environment variables (see `packages/backend/.env.example` for full list):

| Variable | Purpose | Required |
|----------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ Yes |
| `REDIS_URL` | Redis connection string | ✅ Yes |
| `JWT_SECRET` | JWT signing key | ✅ Yes |
| `JWT_REFRESH_SECRET` | JWT refresh signing key | ✅ Yes |
| `WEATHER_API_KEY` | OpenWeatherMap | Optional |
| `GOOGLE_MAPS_API_KEY` | Google Maps/Geocoding | Optional |
| `SUPABASE_URL` | Supabase project URL | Optional |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin operations | Optional |
| `SENTRY_DSN` | Error tracking | Optional |

---

## Commands Reference

### Development

| Command | Description |
|---------|-------------|
| `npm run backend:dev` | Start NestJS backend (port 3001) |
| `npm run admin:dev` | Start Next.js admin dashboard (port 3000) |
| `npm run mobile:dev` | Start Expo mobile app |
| `npm run ai:dev` | Start AI Python services (port 8000) |

### Infrastructure

| Command | Description |
|---------|-------------|
| `npm run docker:local` | Start PostgreSQL + Redis for local dev |
| `npm run docker:local:down` | Stop Docker containers |
| `npm run docker:up` | Start all infrastructure (Postgres, Redis, MQTT) |

### Database

| Command | Description |
|---------|-------------|
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:seed` | Seed database with sample data |

### Quality

| Command | Description |
|---------|-------------|
| `npm run lint` | Lint all packages |
| `npm run typecheck` | TypeScript strict check all packages |
| `npm run test` | Backend Jest tests |

### E2E Testing

| Command | Description |
|---------|-------------|
| `npm run test:e2e` | Full E2E with Docker infra + apps + Playwright |
| `npm run test:e2e:headed` | Same with headed browser |
| `npm run test:e2e:docker-only` | Only start Docker infra |

### Workflow Screenshots

| Command | Description |
|---------|-------------|
| `npm run workflow:all` | Generate all screenshots + recordings |
| `npm run workflow:screenshots` | Screenshots only (8 workflows) |
| `npm run workflow:recordings` | Demo recordings only |

### Deploy

| Command | Description |
|---------|-------------|
| `npm run deploy:test` | Full Vercel deploy test pipeline |
| `npm run deploy:preview` | Vercel preview deploy |
| `npm run deploy:prod` | Vercel production deploy |

### Utility Scripts (PowerShell)

| Command | Description |
|---------|-------------|
| `npm run script:docker-local` | Start Docker + optionally apps |
| `npm run script:docker-prod-debug` | Start apps pointing to Supabase |
| `npm run script:stop-all` | Stop Docker + kill Node apps |
| `npm run script:health-check` | Full service health check |
| `npm run script:db-diagnostic` | Database inspection & repair |
| `npm run script:reset-db` | Drop + recreate + seed database |
| `npm run script:run-migrations` | Apply pending Prisma migrations |

---

## Troubleshooting

### Port Already in Use
```bash
# Find what's using a port (Windows)
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID> /F
```

### Docker Issues
```bash
# Check container status
docker logs gardenverse-postgres --tail 50
docker logs gardenverse-redis --tail 50

# Full reset
.\scripts\stop-all.ps1
npm run docker:local
.\scripts\reset-db.ps1 -Force
```

### Database Connection Issues
```bash
# Test connection
psql -h localhost -U gardenverse -d gardenverse -c "SELECT 1"

# Check if PostgreSQL is running
docker ps | findstr postgres
```

### Migration Issues
```bash
# Reset database completely
npm run script:reset-db
```

### Node Module Issues
```bash
# Clean install
rm -rf node_modules packages/*/node_modules
npm install
```

---

## E2E Workflow Screenshots

After running `npm run workflow:all`, generated artifacts include:

| Artifact | Location | Content |
|----------|----------|---------|
| **Screenshots** | `e2e/screenshots/` | PNG screenshots per workflow step |
| **HTML Pages** | `e2e/workflows-data/` | Animated gallery (index + 8 workflows) |
| **Recordings** | `playwright-report/recordings/` | WebM demo videos + manifest.json |
| **Test Report** | `playwright-report/html/` | Full Playwright HTML report |

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

## Additional Documentation

| Document | Location | Description |
|----------|----------|-------------|
| Architecture Overview | `docs/architecture/overview.md` | System architecture, data flow, deployment |
| Backend Architecture | `docs/architecture/backend-architecture.md` | NestJS modules, queues, auth flow |
| Mobile Architecture | `docs/architecture/mobile-architecture.md` | Component hierarchy, state management |
| Data Models | `docs/architecture/data-models.md` | Entity relationships, schema |
| Event Flow | `docs/architecture/event-flow.md` | Event-driven architecture |
| Security Architecture | `docs/architecture/security-architecture.md` | SSL, encryption, auth diagrams |
| API Reference | `docs/api/README.md` | Complete API documentation (24 modules) |
| Security Plan | `docs/security/security-plan.md` | JWT, RBAC, encryption, OWASP |
| Deployment Guide | `docs/deployment/deployment-guide.md` | Docker, K8s, monitoring |
| FAQ | `docs/support/faq.md` | Common questions |
| Troubleshooting | `docs/support/troubleshooting.md` | Solutions for common issues |

---

## Getting Help

- **GitHub Issues**: https://github.com/gardenverse/gardenverse/issues
- **Internal**: Reach out to the GardenVerse team on Slack or Discord

---

<p align="center">🌱 <strong>Grow Together, Sustainably.</strong> 🌱</p>
