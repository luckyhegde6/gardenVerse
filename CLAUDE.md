# CLAUDE.md

Behavioral guidelines + project reference for Claude Code.
**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

---

## Git Branching Policy

**⚠️ Always follow these rules. No exceptions.**

### Branch Structure
- **`main`** — Production-ready. Only merged via PR. Never commit directly.
- **`feature/<kebab-case>`** — New features, enhancements.
- **`fix/<kebab-case>`** — Bug fixes.
- **`release/<version>`** — Release preparation.

### Rules
1. **Never commit directly to `main`**. Always create a feature/fix branch.
2. **Create a branch at the start of every new task** — even before writing code.
3. **`main` must stay in sync** — Before starting a new branch, pull latest `main`: `git checkout main && git pull`.
4. **Branch from `main`** — Always: `git checkout -b feature/my-feature main`.
5. **Keep branches short-lived** — Merge via PR within the same session/day when possible.
6. **Rebase before PR** — Before creating a PR: `git fetch origin && git rebase origin/main` to ensure clean history.
7. **Push branch immediately** — After creating a branch: `git push -u origin feature/my-feature`.
8. **PR review required** — No self-merging to `main` without review.

### Commit Messages
- Use Conventional Commits: `feat(scope): description`, `fix(scope): description`.
- Scopes: `admin`, `mobile`, `backend`, `security`, `docs`, `infra`.

---

## Clean Code Policy

### 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask: *"Would a senior engineer say this is overcomplicated?"* If yes, simplify.

### 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that **your** changes made unused.
- Don't remove pre-existing dead code unless asked.

**Test:** Every changed line traces directly to the user's request.

### 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation.

---

## Project Overview

**GardenVerse** — Hybrid agriculture simulation ecosystem: virtual gardening, AI-powered agriculture assistant, IoT-enabled farming, geospatial community platform.

**Architecture:** Next.js 14 (unified Admin Dashboard + API) + React Native/Expo (Mobile) + FastAPI (AI) + MQTT (IoT), backed by PostgreSQL (Prisma) + Redis.

**Production:** Vercel (admin) + Supabase (DB) + Upstash Redis (serverless cache) + Google Play (mobile).

---

## Quick Reference — Commands

### Services
```bash
npm run admin:dev          # Next.js admin + API → :3000
npm run mobile:dev         # Expo mobile app
npm run docker:local       # Postgres (5432) + Redis (6379)
npm run docker:local:down
```

### Database
```bash
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate     # Run migrations (dev)
npm run prisma:seed        # Seed demo data (8 users, 220+ plants, 6 gardens, 18+ crops)
npm run prisma:studio      # Prisma Studio UI → :5555
```

### Quality
```bash
npm run lint               # ESLint (mobile)
npm run typecheck          # TypeScript strict (admin + mobile)
npm run typecheck:admin    # TypeScript strict (admin only)
npm run typecheck:mobile   # TypeScript strict (mobile only)
npm run test               # Jest (admin)
npm run test:admin         # Jest (admin, explicit)
```

### E2E Testing
```bash
# Playwright (admin web)
npm run test:e2e                  # Full E2E pipeline
npm run test:e2e:headed           # Headed browser
npm run test:e2e:integration      # Integration tests only

# Module-by-module Playwright
npm run e2e:auth|e2e:garden|e2e:admin|e2e:weather|e2e:marketplace|e2e:community|e2e:ai-scanner|e2e:invites

# Detox (mobile emulator)
npm run test:e2e:mobile           # Run on running emulator
npm run test:e2e:mobile:build     # Build APK + run

# Combined
npm run test:e2e:all              # Playwright + integration
```

### Deployment
```bash
npm run deploy:test        # Full deploy test pipeline
npm run deploy:preview     # Vercel preview
npm run deploy:prod        # Vercel production (cloud build)
```

### PowerShell Utilities
```bash
npm run script:docker-local        # Start Docker + optionally apps
npm run script:health-check        # Full service health check
npm run script:db-diagnostic       # DB inspection, repair, slow queries
npm run script:reset-db            # Drop + recreate + seed
npm run script:run-migrations      # Apply pending Prisma migrations
npm run script:stop-all            # Stop Docker + kill Node apps
npm run script:docker-cleanup      # Docker cleanup
```

---

## Architecture

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
                 │   (Supabase)    │
                 └────────┬────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
     ┌──────────┐    ┌──────────┐    ┌──────────┐
     │  Upstash │    │ FastAPI  │    │  BullMQ  │
     │  Redis   │    │ (AI Svc) │    │ (Worker) │
     └──────────┘    └──────────┘    └──────────┘
```

### Monorepo Structure

```
gardenverse/
├── packages/
│   ├── admin/             # Next.js 14 (API + UI, port 3000)
│   │   ├── prisma/        # Schema (42+ models), seed, migrations
│   │   └── src/
│   │       ├── app/
│   │       │   ├── api/v1/ # 71 API routes (29 modules)
│   │       │   └── ...     # 31 UI pages
│   │       ├── components/ # Radix UI + Tailwind
│   │       └── lib/        # Auth, API client, logger, queue, ws, cron, AI
│   └── mobile/            # React Native (Expo)
│       └── src/
│           ├── screens/   # 32+ screens
│           ├── stores/    # Zustand state
│           ├── services/  # API client, socket, logger
│           └── components/# Reusable UI
├── services/
│   ├── ai/                # FastAPI + OpenCV (port 8000)
│   └── iot/               # MQTT gateway & bridge
├── contracts/             # Solidity smart contracts (Hardhat)
├── e2e/
│   ├── tests/             # Playwright integration tests
│   ├── mobile/            # Detox mobile E2E tests (5 test suites + helpers)
│   ├── modules/           # Module-by-module Playwright E2E
│   └── workflows/         # Screenshot/recording workflows
├── docs/                  # Documentation suite
│   ├── README.md          # Docs index
│   ├── deployment/        # Vercel + APK publish guides
│   ├── mobile/            # Emulator testing guide
│   └── guides/            # Dev guide, production sync, changelog
├── scripts/               # PowerShell utilities
├── docker-compose.local.yml
├── vercel.json            # Vercel deployment config
└── eas.json               # EAS Build config
```

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `packages/admin/src/app/api/v1/` | 71 API routes: auth, gardens, crops, marketplace, community, weather, AI, gamification, moderation, invites, analytics, feature flags |
| `packages/admin/src/lib/` | `auth.ts`, `api-client.ts`, `logger/`, `queue.ts`, `websocket.ts`, `cron.ts`, `ai/index.ts` |
| `packages/admin/prisma/schema.prisma` | 42+ models, 9 enums |
| `packages/mobile/src/screens/` | Garden (2D/3D), Marketplace, Community, AI Scanner, Profile, Auth |
| `packages/mobile/src/stores/` | `authStore`, `gardenStore`, `marketplaceStore`, `communityStore` |
| `e2e/mobile/` | Detox tests: `gardenverse.e2e.test.ts`, `auth.test.ts`, `garden.test.ts`, `marketplace.test.ts`, `navigation.test.ts`, `helpers.ts` |

---

## Technology Stack

| Category | Technology |
|----------|-----------|
| **Backend** | Node.js 22, Next.js 14 App Router, TypeScript 5 |
| **Database** | PostgreSQL 16 (Supabase), Prisma ORM 5 |
| **Cache/Queue** | Redis 7 (Upstash HTTP for serverless), BullMQ |
| **Realtime** | Socket.IO + Redis adapter (SSE in Next.js) |
| **Mobile** | React Native 0.74, Expo 51, NativeWind, React Navigation |
| **AI/ML** | FastAPI, OpenCV, PyTorch 2.1, Transformers |
| **IoT** | MQTT, Mosquitto, ESP32 |
| **Blockchain** | Solidity, Hardhat, OpenZeppelin (8 contracts) |
| **Admin UI** | Next.js 14, TailwindCSS, Recharts, Radix UI |
| **Monitoring** | Sentry, Prometheus, Grafana |
| **E2E Testing** | Playwright (admin), Detox (mobile), Jest (unit) |
| **CI/CD** | GitHub Actions, Vercel, EAS Build, Husky pre-commit |

---

## Development Workflow

### Git Conventions
- Branches: `feature/*`, `fix/*`, `release/*`
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

---

## API Route Pattern

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

## Mobile State Pattern (Zustand)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GardenStore {
  crops: Crop[];
  selectedGarden: Garden | null;
  addCrop: (crop: Crop) => void;
  syncCrops: (crops: Crop[]) => void;
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

---

## Key Patterns

### Growth Engine (Mobile)
Client-side tick-based simulation (`packages/mobile/src/services/growthEngine.ts`):
- 30s real-time = 1 game tick = 50 virtual minutes
- 100% growth ≈ 36 minutes real time
- Weather modifiers: rain (+3 hydration), heavy_rain (+6, flood risk), heatwave (-2), wind (-1), frost (health damage)
- Integrated into `GardenScreen.tsx` via `useGardenStore.syncCrops()`

### Logger Pipeline (Mobile → Backend)
- `packages/mobile/src/services/logger.ts` — circular buffer (200), debounced batch send (500ms)
- Console override in `__DEV__` mode
- Sends to `POST /api/v1/logs`

### Mobile E2E (Detox)
- **Emulator:** Pixel 7 API 34 (Android 14)
- **Config:** `.detoxrc.js` → `android.emu.debug` configuration
- **APK path:** `packages/mobile/android/app/build/outputs/apk/debug/app-debug.apk`
- **Test files:** `e2e/mobile/` — 5 test suites, ~38 test cases total
- **Helpers:** `e2e/mobile/helpers.ts` — 25+ utilities (login, tap, scroll, assert, screenshot)
- **Emulator → host:** `10.0.2.2:3000` maps to host `localhost:3000`
- **Run:** `npm run test:e2e:mobile` (or `:build` to compile APK first)

---

## Key Configuration Files

| File | Purpose |
|------|---------|
| `tsconfig.base.json` | Base TS config (strict, ES2022, NodeNext) |
| `turbo.json` | Turborepo pipeline config |
| `docker-compose.local.yml` | Local Postgres + Redis |
| `packages/admin/next.config.mjs` | Next.js config (Sentry, security headers) |
| `packages/mobile/app.config.js` | Expo config, env vars, EAS project ID |
| `eas.json` | EAS Build profiles (dev/preview/prod) |
| `vercel.json` | Vercel deploy config (build command, output dir, env) |
| `.detoxrc.js` | Detox config (Pixel 7 API 34 emulator) |

---

## Environment Variables

```bash
# Database (local)
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

# Production (Vercel)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
SUPABASE_URL=https://PROJECT.supabase.co
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## Important Notes

### Vercel Deployment
- **Always use cloud build:** `vercel deploy --prod --yes` — local `vercel build` has `@vercel/next` bug
- Redis: Use **Upstash Redis** (HTTP) — serverless functions can't use TCP
- BullMQ/Socket.IO need separate long-running worker (Railway/Fly.io)
- See `docs/deployment/vercel-deployment.md` for full guide

### Database
- Initial migration: `packages/admin/prisma/migrations/20260608000000_init/` (1,723 lines, 42+ models)
- Dev schema sync: `npx prisma db push`
- Seed: `npx prisma db seed` (8 users, 220+ plants, 6 gardens, 18+ crops, marketplace, weather, achievements, quests, AI scans, notifications, invites)
- Seed uses hardcoded `DATABASE_URL` fallback for cross-platform compatibility

### Mobile Development
- Start admin API first: `npm run admin:dev` (serves API at localhost:3000)
- Then mobile: `cd packages/mobile && npx expo start`
- Emulator networking: `10.0.2.2` → host `localhost`
- APK build: `cd packages/mobile/android && ./gradlew assembleDebug`
- EAS Build: `eas build --platform android --profile production`
- See `docs/mobile/emulator-testing.md` for full E2E guide
- See `docs/deployment/apk-publishing.md` for Play Store publishing

### Demo Accounts
| Email | Password | Role |
|-------|----------|------|
| `admin@gardenverse.vercel.app` | `password123` | Admin |
| `superadmin@gardenverse.vercel.app` | `password123` | Super Admin |
| `demo@gardenverse.vercel.app` | `password123` | Demo User |

---

## Documentation

| Document | Path |
|----------|------|
| Docs index | `docs/README.md` |
| Local development & testing | `docs/guides/local-development.md` |
| Vercel deployment | `docs/deployment/vercel-deployment.md` |
| APK build & Play Store publish | `docs/deployment/apk-publishing.md` |
| Android emulator E2E testing | `docs/mobile/emulator-testing.md` |
| Production sync & rollback | `docs/guides/production-sync.md` |
| Phase A changelog | `docs/guides/phase-a-changelog.md` |
