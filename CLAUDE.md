# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**GardenVerse** — Hybrid agriculture simulation ecosystem combining virtual gardening, AI-powered agriculture assistant, IoT-enabled farming, and geospatial community platform.

**Architecture**: Next.js 14 (unified Admin Dashboard + API) + React Native/Expo (Mobile) + FastAPI (AI) + MQTT (IoT), all backed by PostgreSQL (Prisma) + Redis.

## Commands

### Development
```bash
# Start all services
npm run admin:dev        # Next.js admin + API on :3000
npm run mobile:dev       # Expo mobile app
npm run ai:dev           # FastAPI AI service on :8000

# Infrastructure
npm run docker:local     # Start Postgres (5432) + Redis (6379)
npm run docker:local:down
```

### Database (Prisma)
```bash
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations (dev)
npm run prisma:seed      # Seed database (20 Indian plant species + demo garden)
npm run prisma:studio    # Prisma Studio UI
```

### Quality
```bash
npm run lint             # Lint (uses TypeScript check in admin)
npm run typecheck        # TypeScript strict check (admin + mobile)
npm run test             # Jest tests (admin)
```

### E2E Testing & Workflows
```bash
npm run test:e2e         # Full E2E: Docker infra → migrate → apps → Playwright
npm run test:e2e:headed  # Headed browser
npm run test:e2e:docker-only  # Just Docker infra

# Module-by-module (8 workflows)
npm run e2e:auth
npm run e2e:garden
npm run e2e:admin
npm run e2e:weather
npm run e2e:marketplace
npm run e2e:community
npm run e2e:ai-scanner
npm run e2e:invites

# Screenshots & recordings
npm run workflow:all     # All screenshots + recordings
npm run workflow:screenshots
npm run workflow:recordings
```

### Deployment
```bash
npm run deploy:test      # Full deploy test pipeline
npm run deploy:preview   # Vercel preview
npm run deploy:prod      # Vercel production (cloud build)
```

### PowerShell Scripts (scripts/)
```bash
npm run script:docker-local        # Start Docker + optionally apps
npm run script:docker-prod-debug   # Apps → Supabase (⚠ production!)
npm run script:stop-all            # Stop Docker + kill Node apps
npm run script:health-check        # Full service health check
npm run script:db-diagnostic       # DB inspection, repair, slow queries
npm run script:reset-db            # Drop + recreate + seed
npm run script:run-migrations      # Apply pending Prisma migrations
```

## High-Level Architecture

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

### Monorepo Structure (npm workspaces)

```
gardenverse/
├── packages/
│   ├── admin/             # Next.js 14 unified app (API routes + UI, port 3000)
│   │   ├── prisma/        # Database schema (30+ models)
│   │   └── src/
│   │       ├── app/
│   │       │   ├── api/v1/ # 71 API routes across 29 modules
│   │       │   └── ...     # 31 UI pages (admin dashboard)
│   │       ├── components/ # Reusable UI components (Radix UI + Tailwind)
│   │       └── lib/        # Auth, API client, logger, queue, websocket, cron, AI
│   ├── mobile/            # React Native (Expo) — garden map, plant browser
│   │   └── src/
│   │       ├── screens/   # 32+ screens
│   │       ├── stores/    # Zustand state management
│   │       ├── services/  # API client, socket, logger
│   │       └── components/# Reusable UI components
├── services/
│   ├── ai/                # FastAPI + OpenCV AI service (port 8000)
│   └── iot/               # MQTT gateway & bridge (Mosquitto)
├── contracts/             # Solidity smart contracts (Hardhat)
├── e2e/                   # Playwright E2E tests & workflow screenshots
├── docs/                  # Full documentation suite
├── docker-compose.local.yml
└── scripts/               # Vercel deploy, utility scripts
```

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `packages/admin/src/app/api/v1/` | 71 API routes across auth, gardens, crops, marketplace, community, weather, AI, gamification, moderation, invites, analytics, feature flags |
| `packages/admin/src/lib/` | Core utilities: `auth.ts`, `api-client.ts`, `logger/`, `queue.ts`, `websocket.ts`, `cron.ts`, `ai/index.ts` |
| `packages/admin/prisma/schema.prisma` | 30+ models: User, Garden, Crop, PlantSpecies, MarketplaceListing, CommunityGroup, AIScan, Invite, FeatureFlag, etc. |
| `packages/mobile/src/screens/` | Mobile screens: Garden (2D/3D), Marketplace, Community, AI Scanner, Profile, Auth |
| `packages/mobile/src/stores/` | Zustand stores: `authStore`, `gardenStore`, `marketplaceStore`, `communityStore` |
| `services/ai/src/` | FastAPI endpoints: `/scan`, `/recommendations`, `/health` |
| `services/iot/` | MQTT gateway (device auth), bridge (sensor data), simulator |

## Technology Stack

| Category | Technology |
|----------|-----------|
| **Backend** | Node.js 22, Next.js 14 App Router, TypeScript 5 |
| **Database** | PostgreSQL 16, Prisma ORM 5 |
| **Cache/Queue** | Redis 7, BullMQ (in-process queue in Next.js) |
| **Realtime** | Socket.IO + Redis adapter (SSE in Next.js) |
| **Mobile** | React Native 0.74, Expo 51, NativeWind (Tailwind), React Navigation |
| **AI/ML** | FastAPI, OpenCV, PyTorch 2.1, Transformers, Sentence Transformers |
| **IoT** | MQTT, Mosquitto, ESP32 simulator |
| **Blockchain** | Solidity, Hardhat, OpenZeppelin (8 contracts) |
| **Admin UI** | Next.js 14, TailwindCSS, Recharts, Radix UI |
| **Monitoring** | Sentry (instrumentation.ts), Prometheus, Grafana |
| **E2E Testing** | Playwright, Docker Compose, ts-node |
| **External APIs** | OpenWeatherMap, Google Maps, OpenFarm, Trefle |
| **CI/CD** | GitHub Actions, Vercel, Husky pre-commit |

## Development Workflow

### Git Conventions
- Branch: `feature/*`, `fix/*`, `release/*`
- Commits: Conventional Commits — `feat(scope): description`
- Scopes: `backend`, `mobile`, `admin`, `ai`, `iot`, `contracts`, `docs`, `infra`

### TypeScript Standards
- Strict mode everywhere
- No `any` types (use `unknown` + type guards)
- 100% typed interfaces for DTOs, responses, events
- Files: `kebab-case.ts`, Classes: `PascalCase`, Functions: `camelCase`

### Security Rules (Non-Negotiable)
1. Never commit `.env` files or secrets
2. bcrypt 12+ rounds for passwords
3. JWT: 15m access, 7d refresh tokens
4. QR payloads: encrypted + signed with expiration
5. All input validated via `class-validator` DTOs
6. Rate limiting on all public endpoints
7. No raw SQL — Prisma only
8. Helmet + CORS for production
9. Geolocation: store geohash only, never exact coordinates

### API Route Patterns (Next.js App Router)
```typescript
// packages/admin/src/app/api/v1/module/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { paginated } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  
  const [data, total] = await prisma.model.findMany({
    skip: (page - 1) * limit,
    take: limit,
  });
  
  return NextResponse.json(paginated(data, total, page, limit));
}
```

### Mobile State Management (Zustand)
```typescript
// packages/mobile/src/stores/gardenStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GardenStore {
  crops: Crop[];
  selectedGarden: Garden | null;
  addCrop: (crop: Crop) => void;
  syncCrops: (crops: Crop[]) => void;  // For growth engine integration
}

export const useGardenStore = create<GardenStore>()(
  persist((set) => ({
    crops: [],
    selectedGarden: null,
    addCrop: (crop) => set((state) => ({ crops: [...state.crops, crop] })),
    syncCrops: (crops) => set({ crops }),
  }), { name: 'garden-store' })
);
```

### Growth Engine (Mobile)
Client-side tick-based simulation (`packages/mobile/src/utils/growthEngine.ts`):
- 30s real-time = 1 game tick = 50 virtual minutes
- 100% growth ≈ 36 minutes real time
- Hydration/nutrient decay, health recovery/stress
- Water/fertilize actions give growth boost
- Integrated into `GardenScreen.tsx` via `useGardenStore.syncCrops()`

### Logger Pipeline (Mobile → Backend)
- `packages/mobile/src/services/logger.ts` — circular buffer (200), debounced batch send (500ms)
- Console override in `__DEV__` mode
- Sends to `POST /api/v1/logs` (admin route)
- DebugOverlay shows "App Logs" section

## Key Configuration Files

| File | Purpose |
|------|---------|
| `tsconfig.base.json` | Base TypeScript config (strict, ES2022, NodeNext) |
| `turbo.json` | Turborepo pipeline config |
| `docker-compose.local.yml` | Local Postgres + Redis + MQTT |
| `packages/admin/next.config.mjs` | Next.js config (Sentry instrumentation) |
| `packages/mobile/app.config.js` | Expo config with env vars for EAS |
| `packages/mobile/tailwind.config.js` | NativeWind/Tailwind config |
| `eas.json` | EAS Build profiles (dev/preview/prod) |

## Environment Variables

Key env vars (see `.env.example`):
```bash
# Database
DATABASE_URL=postgresql://gardenverse:gardenverse123@localhost:5432/gardenverse

# Auth
NEXTAUTH_SECRET=<strong-random>
NEXTAUTH_URL=http://localhost:3000
JWT_SECRET=<strong-random>

# External APIs
WEATHER_API_KEY=<openweathermap>
GOOGLE_MAPS_API_KEY=<google-maps>
TREFLE_API_KEY=<trefle>

# AI Service
AI_SERVICE_URL=http://localhost:8000

# Redis (local)
REDIS_URL=redis://localhost:6379

# Production (Vercel) - use Upstash Redis HTTP
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

## Testing

### Backend (Jest)
```bash
npm run test -w packages/admin
npm run test:watch -w packages/admin
```

### Mobile (Jest + React Native Testing Library)
```bash
npm run test -w packages/mobile
```

### E2E (Playwright)
```bash
npm run test:e2e              # Full stack
npm run e2e:auth              # Single module
npm run workflow:all          # Screenshots + recordings
```

## Important Notes

### Vercel Deployment
- **Always use cloud build**: `vercel deploy --prod --yes` (local `vercel build` has `@vercel/next` bug)
- Redis on Vercel: Use **Upstash Redis** (HTTP-based) — serverless functions don't support persistent TCP
- BullMQ/Socket.IO need separate long-running worker (Railway/Fly.io)

### Database
- No migration files in admin Prisma yet — use `prisma db push` for schema sync
- Seed script uses `tsx` (not `ts-node`) for Windows compatibility
- Demo accounts: admin@gardenverse.vercel.app / superadmin@gardenverse.vercel.app / demo@gardenverse.vercel.app (all `password123`)

### Mobile Development
- Start admin API first: `npm run admin:dev` (serves API at localhost:3000)
- Then mobile: `cd packages/mobile && npx expo start`
- Expo web uses `localStorage` for auth persistence (not in-memory Map)

### Recent Major Changes (Session 11)
- **NestJS backend fully migrated** into Next.js API routes (`packages/backend/` deleted)
- **Mobile logger pipeline** created — mobile logs → backend via `POST /api/v1/logs`
- **Seed data restored** — 20 Indian plant species, demo garden with 3 crops
- **First-time walkthrough** — 5-step overlay (Welcome → Plant → Water → Fertilize → Harvest)
- **Admin build**: 126 pages/routes, zero TypeScript errors

### Documentation References
- Architecture: `docs/architecture/overview.md`
- API Reference: `docs/api/README.md`
- Gamification: `docs/architecture/gamification-flow.md`
- Security: `docs/security/security-plan.md`
- Deployment: `docs/deployment/production-deployment.md`
- Lessons Learned: `docs/improvements/lessons-learned.md`