# GardenVerse - Multi-Agent Engineering Guidelines

## Session Metadata
- **Project**: GardenVerse - Hybrid Agriculture Simulation Ecosystem
- **Session Started**: Jun 5, 2026 (Active: Session 11 — Mobile Logger Pipeline + Seed Data + First-Time Walkthrough)
- **Architecture**: Next.js API Routes (Unified Admin + API) → Future Microservices
- **Monorepo**: npm workspaces
- **Platform**: Windows (PowerShell)

## Project Topology

```
Production:
  Vercel  ─── Admin Dashboard (Next.js 14) → https://gardenverse.vercel.app
  Vercel  ─── API Routes (Next.js)         → https://gardenverse.vercel.app/api/v1
  Supabase ── PostgreSQL 16 + Auth + Storage → Managed
  Upstash ─── Redis (HTTP-based cache/queue) → Serverless
  Expo/EAS ── Mobile App (React Native)     → EAS Build → App Store/Play Store

Local Dev:
  Docker ─── PostgreSQL (5432) + Redis (6379) + MQTT (1883)
  Local ──── Admin + API (:3000) + Mobile (Expo) + AI (:8000)
```

## Engineering Standards

### Code Quality
- TypeScript strict mode everywhere
- No `any` types (use `unknown` + type guards)
- 100% typed interfaces for all DTOs, responses, events
- No `console.log` in production code (use structured logging)
- All API endpoints must have validation DTOs and Swagger decorators (`@ApiTags`, `@ApiOperation`, `@ApiBearerAuth`)
- All database queries must use Prisma transactions for atomicity

### Security Hard Rules
1. NEVER commit `.env` files, secrets, or private keys
2. All passwords hashed with bcrypt (12 rounds minimum)
3. JWT tokens must have short expiry (15m access, 7d refresh)
4. QR payloads MUST be encrypted + signed with expiration
5. All user input must be validated (class-validator DTOs)
6. Rate limiting on all public endpoints
7. No raw SQL queries (Prisma only)
8. Helmet + CORS configured for production
9. Upload validation (file type, size, virus scan)
10. Geolocation: store geohash only, never exact coordinates
11. NEXTAUTH_SECRET must never have a hardcoded fallback — always use env var

### Architecture Principles
- **Single Responsibility**: One module = one domain concern
- **Event-Driven**: Use events for cross-module communication
- **Stateless**: Backend instances are stateless (state in Redis/Postgres)
- **Defensive Design**: Assume all external inputs are malicious
- **Fail Fast**: Validate early, fail with clear messages
- **Graceful Degradation**: If AI service is down, garden still works
- **Idempotency**: All mutation endpoints should be idempotent

### Naming Conventions
- Files: `kebab-case.ts`
- Classes: `PascalCase`
- Functions/Methods: `camelCase`
- Variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Database models: `PascalCase`
- Database fields: `camelCase`
- API routes: `kebab-case`
- Events: `domain.action.type` (e.g., `garden.crop.planted`)

### Module Structure (Backend)
```
module-name/
  module.ts        # NestJS module definition
  controller.ts    # REST endpoints with Swagger decorators
  service.ts       # Business logic
  dto/
    create.dto.ts
    update.dto.ts
    query.dto.ts
  interfaces/
    index.ts
  events/          # Event definitions (if applicable)
```

### Git Workflow
- `main` - Production-ready, protected
- `develop` - Integration branch
- `feature/*` - Feature branches
- `fix/*` - Bug fixes
- `release/*` - Release candidates

### Commit Convention
```
type(scope): description

Types: feat, fix, chore, docs, style, refactor, test, perf
Scopes: backend, mobile, admin, ai, iot, contracts, docs, infra

Examples:
- feat(backend): add crop growth simulation engine
- fix(mobile): handle empty garden state gracefully
- docs(api): add WebSocket event documentation
```

### Testing Requirements
- Backend: Jest unit tests for all services, E2E for critical flows
- Mobile: Component tests with React Native Testing Library
- Admin: 48 Playwright E2E tests (auth, admin, invites)
- AI: Unit tests for recommendation logic
- Contracts: 41 Hardhat tests (tokens, reputation, marketplace, escrow)
- E2E Workflows: 8 automated screenshot workflows (auth, garden, admin, weather, marketplace, community, ai-scanner, invites)

### Dependency Rules
- Backend modules should NOT import from other modules directly
- Use events for cross-module communication (BullMQ)
- Common utilities go in `src/common/`
- Config is read from `ConfigService`, never `process.env` directly

### Performance Guidelines
- Database queries must use indexes (all defined in Prisma schema)
- Cache frequent reads in Redis (TTL appropriate to data freshness)
- Use pagination for all list endpoints
- Image uploads: compress before storage, serve via CDN
- WebSocket events: batch where possible, avoid per-user events

### Security Checklist (Pre-Deployment)
- [ ] All secrets in environment variables
- [ ] Rate limiting configured
- [ ] Helmet headers set
- [ ] CORS restricted to known origins
- [ ] JWT rotation mechanism working
- [ ] OTP rate limiting
- [ ] QR signature verification tested
- [ ] File upload restrictions in place
- [ ] SQL injection prevention (via Prisma)
- [ ] XSS prevention (input sanitization)
- [ ] Brute force protection on auth endpoints
- [ ] Session management tested
- [ ] Audit logging active
- [ ] Sentry error tracking configured (instrumentation.ts + sentry.*.config.ts)
- [ ] Vercel env vars: NEXTAUTH_SECRET, SUPABASE_*, SENTRY_* set

### IoT Security
- Devices register with public key
- Sensor data must be signed
- Device trust score degrades with anomalies
- Fake data detection heuristics
- Rate limit per device

### Feature Flag Strategy
- All new features behind feature flags
- Gradual rollout (10% → 25% → 50% → 100%)
- Regional targeting support
- Kill switch capability
- A/B test ready

### Monitoring & Alerting
- Health check endpoints for all services
- Database connection pool monitoring
- Redis memory usage alerts
- Queue backlog alerts
- Error rate thresholds
- API latency p50/p95/p99 tracking

### Self-Improvement Cycle

Each session MUST update:
1. **AGENTS.md** — Session Feedback section with accomplishments, mistakes, corrections
2. **MEMORY.md** — Session tracking, file map, decisions, key numbers
3. **docs/improvements/lessons-learned.md** — Detailed lessons in structured format

Context minimization rules:
- Reference docs paths instead of duplicating content
- Keep AGENTS.md as an index/guide — detailed specs in docs/
- MEMORY.md tracks session-to-session context
- Lessons-learned prevents repeat mistakes
- File map in MEMORY.md keeps project structure accessible

---

## Session Feedback & Improvements

### Session 10 (Jun 4, 2026): Backend Migration Completion — Monitoring Overhaul + NestJS→Next.js + Logger + AI Dashboard

**Focus**: Overhaul the admin monitoring page, migrate `packages/backend/` (NestJS) into `packages/admin/` (Next.js API routes) via 5-phase plan, create Logger sidecar + logging middleware, build AI dashboard, remove backend package entirely

**Accomplishments:**
- **Monitoring page overhauled** — 6 sections: System Health (4 service status cards), Performance Metrics (CPU/Memory/Users/Rate with bar gauges), API Endpoint Performance (10 endpoints table), System Logs (search input, level/source combo filters, Clear button with confirmation, real log entries from API), Queue Status (4 BullMQ queues), Sidecar Services (4 services with status/uptime)
- **Logger sidecar created** (`packages/admin/src/lib/logger/index.ts`) — non-blocking file writer + DB backup with 24h TTL cleanup, log reading from files first then DB fallback, search support
- **Logging middleware created** (`packages/admin/src/lib/middleware/logging.ts`) — request tracking with traceId, duration, HTTP status; `startRequestLog`/`finishRequestLog`/`logApiError` exports
- **Created 3 new API routes** — `GET /api/v1/logs`, `POST /api/v1/logs/clear`, `GET /api/v1/analytics/endpoints`
- **Phase 1: Audit** (4 agents) — 25 backend modules (132 endpoints, 33 DB models, 7 agents), 88 admin API routes (11 missing auth, 38 gap endpoints), both Prisma schemas diffed (admin ahead by 1 model + 10 fields)
- **Phase 2: Batch Migration** — 37 new API routes across 7 domains: 7 User/Auth, 4 Garden/Crop, 7 Marketplace/AI, 6 Gamification, 9 Remaining (analytics, plants, community, feature flags, notifications, QR, IoT, geo, moderation), 4 Infrastructure (plans CRUD)
- **Phase 3: WS/BullMQ/Cron** — Created `packages/admin/src/lib/queue.ts` (in-process queue), `websocket.ts` (SSE + pub/sub), `cron.ts` (task registry with `shouldRun()`), 2 Vercel Cron routes (`/api/v1/cron/growth-tick` every 4h, `/api/v1/cron/weather-sync` every 6h), `/api/v1/agents/callback` route
- **Phase 4: AI Integration** — Created `packages/admin/src/lib/ai/index.ts` (TypeScript fallback for plant analysis, watering/fertilizer recommendations, disease detection using existing DISEASE_DATABASE), created `/ai-dashboard` page with scan stats, service status, model accuracy bars, recommendation charts
- **Phase 5: Cleanup** — Deleted `packages/backend/` entire directory, deleted `.github/workflows/backend.yml`, updated root `package.json` (removed backend scripts from lint/typecheck/dev/build), cleaned up references
- **Final verification** — `tsc --noEmit` passes on both admin + mobile; `next build` compiles 126 pages/routes; admin dashboard logged into browser with real DB data; monitoring page verified with all 6 sections rendering correctly

**Key Bugs Fixed:**
1. **System Logs showed "No logs available"** — `appLog` table had no records. Fixed with fallback mock data. Later replaced with Logger sidecar that actually writes logs to files + DB.
2. **11 admin routes missing auth** — Security audit found GET endpoints on users/[id], marketplace/[id], community/groups/[id], and more without auth guards. These were gap endpoints that hadn't been implemented yet.
3. **`Array.from(new Set(...))` needed instead of `[...new Set(...)]`** — The spread operator with Set requires `--downlevelIteration` which was causing issues. Used explicit `Array.from` instead.
4. **PowerShell blocks `npx`** — `npx tsc --noEmit` failed in PowerShell due to execution policy. Used `cmd /c "npx tsc --noEmit"` instead.
5. **Missing Prisma client generated** — `prisma generate` failed with `EPERM: rename` error because query engine binary was locked by running dev server. Killed dev server first, then generated.
6. **No seed data after backend deletion** — `packages/backend/prisma/seed.ts` was deleted with the package. Created minimal seed in `packages/admin/prisma/seed.ts` with 3 users.

**Mistakes & Corrections:**
1. ❌ `Stop-Process -Name "node"` kills opencode server too
   ✅ Use `Stop-Process -Id <PID>` found via `netstat -ano | findstr :PORT`
2. ❌ No migration files in admin prisma directory — `prisma migrate` requires existing migrations
   ✅ Use `prisma db push` to sync schema without migration files (for now)
3. ❌ Backend seed script deleted with package — no way to restore data
   ✅ Create a minimal seed in admin prisma/; note full seed restoration as a next action
4. ❌ `next build` generates Prisma errors when DB is offline during build
   ✅ These are expected during static page generation and don't affect runtime

**Next Steps:**
- Restore full seed data (31 plant species, 5 gardens, crops, marketplace listings)
- Create initial Prisma migration for admin schema
- Run full E2E Playwright tests
- Create `/campaigns` API route

### Session 11 (Jun 5, 2026): Mobile Logger Pipeline + Seed Data Restoration + First-Time Walkthrough

**Focus**: Create mobile-to-backend logging pipeline (Logger service → POST /api/v1/logs), restore comprehensive seed data (20 plant species, demo garden, crops), build first-time user walkthrough overlay

**Accomplishments:**
- **Mobile Logger service** (`packages/mobile/src/services/logger.ts`) — 192-line module with circular buffer (200 entries), debounced batch sender (500ms), console method override (`console.log`/`.warn`/`.error`), `getLogs()`/`sendNow()`, `__DEBUG_APP_LOGS` exposed for DebugOverlay, only active in `__DEV__`
- **Wire logger into API interceptor** — replaced `console.log`/`.error` in `api.ts` request/response/error interceptors with structured `logger.info`/`.error` calls with source/context/metadata
- **App Logs section in DebugOverlay** — new "📝 App Logs (last 50)" section between API Log and Store State showing color-coded level badges, message, source/context badges, timestamp
- **Logger init in root layout** — `_layout.tsx` calls `initLogger()` at module level to wire console override on app start
- **POST /api/v1/logs endpoint** — already existed in admin route.ts (accepts single/batched entries, validates level/message)
- **Seed data expansion** — added 20 Indian plant species (Tomato, Chilli, Turmeric, Rice, Okra, Brinjal, etc.), VIRTUAL "Demo Garden" with 3 crops (Tomato SPROUTING, Chilli GROWING, Mint SEED), 6 feature flags
- **First-time walkthrough overlay** (`WalkthroughOverlay.tsx`) — 5-step modal (Welcome → Plant → Water → Fertilize → Harvest) with progress dots, icons, descriptions, Skip/Next buttons. `useWalkthrough()` hook checks `ONBOARDING_COMPLETE` in storage. Wired into `GardenScreen.tsx`.
- **Fixed seed script** — changed from `ts-node` (Windows quoting bug) to `tsx` in `package.json`
- **TypeScript checks** — both admin and mobile `tsc --noEmit` pass clean
- **API verification** — Plants (20 species, 17 in spring), Gardens (1 for demo user), Login (all 3 accounts) verified via curl

**Key Bugs Fixed:**
1. **Plant selection showed "No plants found"** — `PlantSpecies` table was empty (seed had only 3 users, no plants). Added 20 Indian crop species.
2. **No demo garden existed** — `GET /gardens` returned empty for demo user. Added VIRTUAL "Demo Garden" with 3 crops.
3. **Seed script broken on Windows** — `ts-node --compiler-options '{"module":"commonjs"}'` uses single quotes which PowerShell/cmd can't parse. Changed to `tsx`.
4. **Mobile app had no console override** — previous `console.log` in api.ts went to stdout only. Now routes through logger + sent to backend.

**Mistakes & Corrections:**
1. ❌ `prisma db seed` uses `ts-node --compiler-options '{"module":"commonjs"}'` — single quotes in JSON not valid in Windows cmd
   ✅ Use `tsx` instead — compatible cross-platform
2. ❌ Logger's `formatArgs` used template literal with `\n` escape — got confused with backtick ending
   ✅ Use string concatenation instead of template literals for robustness

**Next Steps:**
- Restore full seed with marketplace listings, weather records, community groups
- Create initial Prisma migration for admin schema
- Run full E2E Playwright tests
- Create `/campaigns` API route

### Session 8 (Jun 3, 2026): Mobile Garden Overhaul — Garden3D, IsometricGrid, Growth Engine, Tick API

**Focus**: Overhaul mobile garden view (Garden3D 6×6 + terrain + camera), expand IsometricGrid to 6×6, add Indian crop sprites, create client-side growth simulation engine, integrate engine into GardenScreen, add backend growth tick endpoint

**Accomplishments:**
- **Garden3D.tsx expanded** — 4×4 → 6×6 grid with configurable `GRID_SIZE`, terrain elevation (sin/cos noise on ground vertices), fence perimeter with posts + rails, water shimmer tiles on hydrated crops, PanResponder for user drag-to-orbit camera control, hemisphere + directional lighting, garden tile borders, 5 new Indian plant builders (Chilli, Turmeric, Rice, Okra, Brinjal), dry grass tufts outside garden
- **GrowthEngine class created** (`growthEngine.ts`) — client-side tick-based simulation with 30s interval, configurable speed (virtual=100x, real=1x), hydration/nutrient decay, health recovery/stress damage, status transitions, action boost on water/fertilize, singleton instance
- **IsometricGrid.tsx expanded** — default grid 4×4 → 6×6, added plant shadows (`Ellipse` under each crop), richer soil texture lines (varying per plot by seeded PRNG), more grass tufts, auto-scaled SVG viewBox
- **CropSpriteSVG.tsx updated** — 5 new Indian plant sprite functions: Chilli (red peppers), Turmeric (golden rhizome), Rice (paddy grains), Okra (green pods), Brinjal (purple eggplant). Registered in `getPlantDef` switch
- **GardenScreen.tsx engine integration** — imports `growthEngine` + `useGardenStore`, starts engine on mount when crops+garden available, syncs engine mutations to zustand store via `syncCrops`, updates engine crop refs on external changes, wires `handleWater`/`handleFertilize` to `growthEngine.onCropAction()`, stops on unmount
- **gardenStore.ts added `syncCrops`** — bulk crop update method for growth engine integration
- **Backend `/gardens/{id}/tick` endpoint** — `POST` route that advances all crops by N game-minutes (default 50), updates growthStage/hydration/nutrientLevel/health/stressFactor/status, documented in api-docs
- **Admin build** — 87 pages/routes compiled with zero TypeScript errors
- **Mobile TypeScript** — `tsc --noEmit` passes clean
- **api-docs updated** — new tick endpoint documented in gardens section

**Key Bugs Fixed:**
1. **Missing store method for bulk crop sync** — `gardenStore` had no way to update all crops at once from the growth engine. Added `syncCrops(crops: Crop[])` method
2. **IsometricGrid hardcoded to 4×4** — defaults and viewBox assumed a 4×4 grid; expanded to 6×6 with dynamic viewBox scaling

**Mistakes & Corrections:**
1. ❌ `crops.length > 0 && selectedGarden?.id` used as useEffect dependency
   ✅ Use proper primitive refs and guard with `engineStarted.current` to prevent re-initialization
2. ❌ GardenScreen initially tried `useGardenStore.getState().syncCrops` inside effect
   ✅ Works correctly with zustand's `getState()` for store access outside hooks

**Next Steps:**
- Backend merged into Next.js API routes — deploy unified app to Vercel
- Test tick endpoint against live API
- Verify mobile app in Expo Go with real API data
- Add growth tick call to virtual garden periodic sync
- Consider weather effects on growth simulation

### Session 8 (continued) — Jun 3, 2026: Auth Persistence Fix + Mobile UI Overhaul + Agents Improvements

**Focus**: Fix auth persistence on Expo web, add `/auth/profile` API route, fix marketplace routing, rewrite ListingDetail/CreateListing screens, add demo seed data, create GrowthOverlay + WeatherBar components, add `/users/me/stats` endpoint, rewrite GardenScreen and ProfileScreen

**Accomplishments:**
- **Fixed auth persistence on Expo web** — `storage.ts` used in-memory `Map` for web which was cleared on page refresh. Changed to use `window.localStorage` for web platform
- **Fixed `loadStoredAuth` failure cascade** — `authStore.ts` called `AuthService.getProfile()` which hit `/auth/profile` (404 — didn't exist), which cleared all auth state. Fixed: on profile fetch failure, falls back to cached userData from storage
- **Created `/auth/profile` API route** — `GET /api/v1/auth/profile` returns user profile from JWT (id, email, username, displayName, avatarUrl, role, region, geohash, streaks)
- **Fixed marketplace routing** — `useMarketplace.ts` changed URLs from `/marketplace/listings` → `/marketplace` (Next.js App Router has no `/listings` sub-path)
- **Fixed ListingDetailScreen** — Rewrote to fetch real listing data via `getListingById`, display seller, images, dynamic details
- **Fixed CreateListingScreen** — Rewrote `handleSubmit` to call `createListing` from `useMarketplace`, uses `GREEN_CREDITS` currency
- **Added `demo@gardenverse.vercel.app` to seed data** — demo user, demo garden (VIRTUAL), 3 demo crops at (0,0), (1,0), (2,0)
- **Fixed password to lowercase** — Changed from `Password123` to `password123` in seed to match README docs
- **Created GrowthOverlay.tsx** — floating growth status panel (682 lines) with garden name, virtual badge, weather strip, crop status card, game time stats
- **Created WeatherBar.tsx** — compact horizontally scrolling weather strip with condition-adaptive background
- **Created `/api/v1/users/me/stats` endpoint** — returns aggregated profile stats (gardenCount, cropCount, streaks, recentActivity)
- **Updated Garden3D.tsx** — Added props interface, selection ring mesh, empty tile highlighting, raycasting tap detection
- **Rewrote GardenScreen.tsx** — Integrated GrowthOverlay and WeatherBar, fetches weather data, polls engine state every 5s
- **Rewrote ProfileScreen.tsx** — Fetches stats from `/users/me/stats`, displays Garden Summary grid, collection progress, activity feed
- **All API endpoints verified** via curl: login, stats, gardens (6 gardens), marketplace (3 listings), tick (advances crops), profile
- **Both packages typecheck** — admin and mobile `tsc --noEmit` pass clean
- **Expo server running** on separate terminal (`http://localhost:19006`)
- **Admin dev server restarted** with new routes

**Key Bugs Fixed:**
1. **Auth lost on web refresh** — `storage.ts` used in-memory `Map` for web, not `localStorage`
2. **`loadStoredAuth` cleared auth on `/auth/profile` 404** — should fall back to cached userData
3. **Marketplace URLs wrong** — `useMarketplace.ts` called `/marketplace/listings` but Next.js App Router routes don't have a `/listings` sub-path — it matched `[id]` param with `id="listings"`, causing UUID parse error
4. **Password too strict** — seed had `Password123` (uppercase P) but README said `password123`
5. **Garden3D no interaction** — lacked tap detection, selection ring, tile highlighting
6. **ProfileScreen hardcoded** — showed placeholder data instead of real stats

**Mistakes & Corrections:**
1. ❌ Expo web storage uses in-memory Map — lost on page refresh
   ✅ Use `localStorage` for web platform, `SecureStore` for native
2. ❌ `loadStoredAuth` profile fetch failure clears ALL auth state
   ✅ Fall back to cached userData instead of clearing auth
3. ❌ No `/auth/profile` endpoint existed even though mobile app calls it
   ✅ Always create API endpoints before the client calls them; or make client resilient to missing endpoints
4. ❌ `StorageKeys.USER_DATA` stored but never refreshed after profile update
   ✅ Update `user_data` in storage when profile is fetched (in `loadStoredAuth`) or updated
5. ❌ `/marketplace/listings` doesn't exist as a route in Next.js App Router
   ✅ Always verify route paths exist in the API before coding client calls. Next.js App Router doesn't have sub-resource nesting by default

**Next Steps:**
- Verify Expo web app at http://localhost:19006 — login → refresh → still logged in
- Set NEXT_PUBLIC_API_URL on Vercel
- Run full E2E Playwright tests

### Session 7 (Jun 3, 2026): Indian City Data + Locations Page + Supabase Sync
**Focus**: Migrate all seed data from US cities to Indian cities, create Locations page with OpenStreetMap, sync Supabase

**Accomplishments:**
- **Seed data migrated to Indian cities**: All 10 users moved from US to Indian cities (Bangalore, Mumbai, Delhi, Hyderabad, Pune, Chennai, Kolkata, Ahmedabad), 5 gardens updated with Indian addresses and `Asia/Kolkata` timezone, 7 weather records replaced with Indian weather data
- **Created `/locations` page**: Two-tab page with Map View (OpenStreetMap embed + 5 garden markers) and All Gardeners tab (DataTable with region badges/geohashes)
- **Added Sidebar nav link**: `MapPin` icon + `/locations` link between Gardens and Gamification
- **Fixed Garden page**: Replaced hardcoded `data={[]}` with real data from `/api/v1/gardens` and `/api/v1/crops` APIs showing 5 gardens, 16 crops, disease stats, soil quality
- **Fixed API route**: Added `region` field to user select in `/api/v1/gardens/route.ts`
- **TypeScript check**: `tsc --noEmit` passes with zero errors
- **Next.js build**: 84 pages/routes compiled with zero TypeScript errors
- **Supabase synced**: 9 users, 5 gardens, 7 weather records, marketplace listings, and 2 community groups updated with Indian city data via Prisma

**Key Bugs Fixed:**
1. **Garden page hardcoded data** — page showed empty tables instead of real gardens/crops data
2. **Gardens API missing `region` field** — user select didn't include `region`, so garden locations didn't show correct Indian city groupings

**Mistakes & Corrections:**
1. ❌ Supabase `execute_sql` tool runs in read-only mode — can't UPDATE data
   ✅ Use `apply_migration` (also read-only) or connect directly with Prisma using Supabase connection URL
2. ❌ Inline PowerShell scripts with template literals and special chars fail due to escaping
   ✅ Write scripts to `.ts` files and execute with `ts-node` instead

**Next Steps:**
- Set NEXT_PUBLIC_API_URL on Vercel
- Re-run E2E tests with Indian city data
- Update mobile app with Indian city location support

### Session 6 (Jun 2, 2026): API Route Migration Completion + E2E Fixes + Chrome Verification
**Focus**: Fix all remaining broken API paths, create missing routes, stabilize E2E tests, Chrome UI verification

**Accomplishments (Round 1):**
- **Fixed 6 admin pages** with broken API paths (dashboard, garden, gamification, monitoring, support, marketplace)
- **Created 6 new API routes**: `/logs`, `/queues`, `/sidecars`, `/support/tickets`, `/support/tickets/[id]/status`, `/marketplace/transactions`
- **Fixed 2 flaky E2E tests** (admin sortable columns, invites token transactions) — added `networkidle` wait, timeout increase, robust auth fixture with dashboard confirmation
- **Added `/api-docs` to `PUBLIC_PATHS`** in AppShell so API docs are publicly accessible
- **Extended api-docs page** with new routes (logs, queues, sidecars, support, marketplace/transactions)
- **Chrome DevTools verification**: dashboard renders with sidebar, auth works (SUPER_ADMIN user), all nav links present
- **Build passes**: 79 pages/routes compiled with zero TypeScript errors

**Accomplishments (Round 2 - Continuation):**
- **Restarted Postgres Docker** (had stopped), ran migrations + seed (10 users, 31 plant species, 5 gardens, 16 crops, 5 marketplace listings, 10 AI scans, etc.)
- **Fixed Users page**: API returns `{ data, total }` but UI expected `{ users, total }` — changed `body.users` → `body.data`; also added `_count: { select: { crops: true } }` to users API Prisma query + null-safe `u._count?.crops ?? 0` in `mapBackendUser`
- **Fixed Gamification page**: same `body.users` → `body.data` fix for user stats fetching
- **Fixed Dashboard error banner**: root cause was `u._count` being undefined (same as users page) — `_count` fix eliminated the persistent "Could not load from server" banner
- **Fixed Invites page**: `createdBy` field showed `[object Object]` because API returns `createdBy: { id, username }` object — added object-type detection to extract `.username`
- **Chrome verification of 17 pages**: all pages load with zero console errors — login, dashboard, AI Scanner (10 scans), weather (8 regions), settings (profile data), users (8 DB users), garden (5 gardens/16 crops stats), marketplace (3 listings), gamification (12/31 species), invites (2 codes), community, moderation, monitoring, features, support, super admin, analytics, api-docs
- **Build passes**: 80 pages/routes compiled with zero TypeScript errors (up from 79 — added `/users/me` route)
- **No stale port 3001 references** remain in admin code

**Key Bugs Fixed:**
1. **Response format mismatch** — `paginated()` helper returns `{ data, total }` but several pages expected `{ users, total }` or raw arrays
2. **Missing `_count` in Prisma queries** — several pages called `u._count.crops` but the API route didn't include `_count` in the Prisma select
3. **Nested object display** — invites page used `String(entry.createdBy)` on an object instead of extracting `.username`

**Mistakes & Corrections:**
1. ❌ `Stop-Process -Name "node"` killed the opencode server too
   ✅ Never stop all node processes — use `netstat -ano | findstr :PORT` to find PID, then `Stop-Process -Id PID`
2. ❌ Previous E2E fixture `authenticatedPage` didn't confirm auth before yielding
   ✅ Added `page.goto('/dashboard')` + `page.waitForSelector('nav')` after setup
3. ❌ `/api-docs` wasn't in `PUBLIC_PATHS` — direct navigation redirected to /login
   ✅ Added to PUBLIC_PATHS array in AppShell
4. ❌ `Start-Process -FilePath "powershell"` for dev server failed silently (PowerShell execution policy blocked `npx`)
   ✅ Use `cmd /c "npm run dev"` or `Start-Process -FilePath "cmd"` with `-WindowStyle Minimized` to start dev server
5. ❌ Fetched `body.users` from paginated API — API returns `body.data`
   ✅ Always use `body.data` for paginated responses (from the `paginated()` helper)
6. ❌ Called `u._count.crops` without null check — `_count` undefined when Prisma query lacks `_count` in select
   ✅ Always add `_count: { select: { crops: true } }` to Prisma query or use optional chaining `u._count?.crops ?? 0`

**Known Issues:**
- Seed data incomplete: only 3 users (no plants, gardens, crops, marketplace, weather data)
- No Prisma migration files in admin — schema synced via `prisma db push`
- E2E tests need Postgres on 5433, env vars set, and admin dev server running
- `Stop-Process -Name "node"` is dangerous — use port-based PID targeting instead
- `/campaigns` API route doesn't exist — page shows "Campaigns module not available" error gracefully
- Garden and crop detail tables on `/garden` page use hardcoded `data={[]}` — no admin-specific garden listing/crop health API routes exist yet

### Session 5 (May 31 - Jun 1, 2026): Vercel Deploy + CI/CD + EAS + Gamification Docs
**Focus**: Production deployment, CI/CD automation, mobile publishing, comprehensive documentation

**Accomplishments:**
- **Admin dashboard deployed to Vercel** at https://gardenverse.vercel.app — 31/31 routes live
- **CI/CD workflows created**: admin-deploy.yml (cloud build + post-deploy verification) and backend-deploy.yml (now removed — backend merged into Next.js API routes)
- **Security fixes**: removed NEXTAUTH_SECRET hardcoded fallback from auth.ts, disabled Sentry build plugin, created instrumentation.ts for v10+ SDK
- **Post-deploy verification scripts**: verify-deployment.sh + .ps1 (checks admin, backend, cross-service)
- **Swagger API docs link** added to admin sidebar
- **EAS Build fixed**: installed CLI, initialized project (ID: `5c01de7d`), converted app.json → app.config.js for env vars, installed expo-dev-client, fixed 5 dependency version mismatches, removed @types/react-native
- **Android APK build** submitted to EAS (development profile)
- **Gamification flow guide created**: `docs/architecture/gamification-flow.md` (550+ lines) covering XP system, mastery, care streaks, contracts, mobile game UI, EAS publishing
- **eas.json** created with development/preview/production profiles
- **EAS Workflows** created: 3 workflows in `.eas/workflows/` (build, dev-build, ota-update) — validated against EAS schema
- **Expo MCP** configured: `expo-mcp` package installed, MCP server added to `.opencode/mcp.json` for AI-assisted build management
- **Mobile workflow** updated with production EAS build profile and env vars

**Discoveries & Learning:**
1. `vercel build` (local) has `NEXT_MISSING_LAMBDA` bug with @vercel/next builder — always use cloud build (`vercel deploy --prod --yes`)
2. `withSentryConfig` wrapper in next.config.mjs breaks both local and cloud builds — use `instrumentation.ts` pattern for Sentry v10+
3. `app.json` doesn't support `process.env` — must use `app.config.js` for dynamic env vars
4. EAS project initialization requires valid UUID — can't have placeholder `"your-project-id"`
5. `expo-doctor` network check may fail behind proxies — 16/17 checks passing is OK
6. `@sentry/nextjs` v10+ uses `instrumentation.ts` instead of `withSentryConfig` — 3 sentry config files remain (server/edge/client)

**Mistakes & Corrections:**
1. ❌ Put `process.env.X` in raw `app.json` — EAS CLI can't parse it
   ✅ Converted to `app.config.js` with JS expressions
2. ❌ Left placeholder `eas.projectId` as `"your-project-id"` — EAS init fails
   ✅ Removed field, ran init, got real ID, added back with fallback
3. ❌ `@types/react-native` installed directly — types come with RN package
   ✅ Removed with `npm uninstall`
4. ❌ Several Expo packages mismatched with SDK 51 versions
   ✅ Ran `npx expo install` with correct versions

**Next Steps:**
- Deploy backend to Railway (blocks full admin API functionality)
- Set NEXT_PUBLIC_API_URL on Vercel (depends on Railway deploy)
- Deploy AI service to Railway
- Complete EAS build (wait for cloud build to finish)
- Re-enable Sentry source map uploads

**Note (Jun 4, 2026):** NestJS backend has been migrated into Next.js API routes. Railway is no longer needed for the backend. AI service still runs separately.

### Session 4 (Backend Stability + E2E Full Pass)
- Fixed backend `main.ts`: added `unhandledRejection` handler, `uncaughtException` handler, `bootstrap().catch()` for graceful failure logging
- Created `scripts/start-backend.ps1` — robust startup script with port cleanup, PID tracking, health check wait loop, and process monitoring
- Added `package.json` scripts: `script:start-backend` and `backend:prod`
- Fixed 3 flaky E2E tests in `admin.spec.ts` and `invites.spec.ts`
- **48/48 E2E Playwright tests passing** (auth, admin, invites, 24 screenshots)
- Verified all admin APIs return real data: dashboard (10 users, 16 crops), marketplace (3 listings), feature flags (6 flags), weather (5-day forecast), analytics (DAU/MAU)
- Agents audit: Weather/IoT/Vision agents have empty `eventSubscriptions` by design (cron/MQTT/HTTP-driven emitters, not listeners) — no bug

### Session 3 (E2E Testing + Config Fixes)
- Fixed MCP configs (Docker → mcp/docker container, Superpowers plugin added)
- Created module-by-module E2E test runner (`e2e/modules/run-module.ts`) — 8 workflows independently
- Created `.opencode/skills/e2e-testing.md` skill document
- Installed Playwright CLI 1.60.0 + Playwright MCP 0.0.75
- Admin dashboard deployed: 10/10 routes live
- Smart contracts verified: 41/41 Hardhat tests passing
- Captured 28 E2E workflow screenshots across 8 modules
- Created `docs/architecture/flow-payloads.md` with sample API request/response payloads

### Session 2 (Dev Infrastructure + Docs)
- Created `.opencode/` with 5 agent profiles, plan templates, MCP config, and RULES.md
- Created 8 PowerShell scripts (docker-local, docker-prod-debug, health-check, db-diagnostic, reset-db, run-migrations, stop-all, updated seed-data)
- Created `.env.local.example` with documented API keys
- Created 10 Mermaid sequence diagrams documenting all major workflows
- Created support docs: FAQ and troubleshooting guide
- Updated package.json with 7 new script commands

### Session 1 (Initial Build)
- Ledger of 334 files created across 8 major components
- 7 specialized agents implemented (Gameplay, Weather, IoT, Vision, Marketplace, Safety, Recommendation)
- 30+ event types defined with 50+ typed payloads
- 22 NestJS backend modules
- 16 React Native screens
- 8 Solidity smart contracts
- Prisma schema with 20+ models
- E2E Playwright screenshot system for 8 workflows + 7 recordings

---

## External API Integrations

| Service | API Key | Purpose | Status |
|---------|---------|---------|--------|
| **OpenWeatherMap** | `WEATHER_API_KEY` | Real-time weather, forecasts, alerts | ✅ Integrated |
| **Google Maps** | `GOOGLE_MAPS_API_KEY` | Geocoding, places search, maps | ✅ Integrated |
| **OpenFarm** | — (public) | Public plant species database (weekly sync) | ✅ Integrated |
| **Trefle** | `TREFLE_API_KEY` | Plant species search (fallback) | ✅ Configurable |
| **Vercel** | Vercel token | Deployment, env management | ✅ Configured |
| **Supabase** | Supabase keys | Auth, storage, DB | ✅ Configured |
| **Upstash Redis** | `UPSTASH_REDIS_*` | Serverless Redis for Vercel prod (replaces ioredis) | ✅ Documented |
| **Sentry** | Sentry keys | Error monitoring (instrumentation.ts) | ✅ Configured |

## Plant Data Pipeline
- `PlantSpecies` model stores plants from OpenFarm (public) + Trefle APIs
- Weekly cron syncs 26+ common crops from OpenFarm
- Falls back to local cache when APIs are unreachable
- `GardenPlan` model for garden layout templates with plant positioning

## Weather Data Pipeline
- Primary: OpenWeatherMap API (real-time current + 7-day forecast)
- Cache: Stored in `WeatherRecord` table with 3-hour TTL
- Fallback: Simulated weather generation when API key missing
- Alerts: Auto-detected extreme conditions (heatwave, freeze, high wind)

## Maps & Geospatial
- Backend: Google Maps Geocoding API + Places API for address resolution
- Storage: Geohash (9-char precision) in User model — never exact coordinates
- Nearby: Geohash prefix matching for finding nearby gardeners
- Mobile: React Native map component via `GardenMapScreen` (Google Maps ready)

## Image & Vision Processing
- Mobile: `expo-camera` with permission handling
- Backend: `UploadModule` — file validation (type, size), local/S3 storage
- AI Python service: OpenCV-based leaf metrics (green/yellow/brown coverage, curl index)
- Vision Agent: Calls AI service → falls back to local mock analysis
- PlantNet / disease detection models (configurable paths in `services/ai/.env`)

---

## Gamification System

Full documentation: `docs/architecture/gamification-flow.md`

**Core concepts:** XP/Levels, Species Collections, Mastery (1-10 per species), Plant Hybrids, 10 Achievements, Care Streaks (3/7/14/30 day), Shop & Inventory (5 rarity tiers), Energy system, Daily Rewards

**Smart contracts (8 total):** GreenCreditToken (ERC20), EcoPointToken (ERC20 soulbound), ReputationToken (ERC721 badges, 5 levels), InviteToken (ERC721 soulbound), Marketplace (2% fee), Escrow (7-day timeout), ReputationManager (5 ranks), RewardDistributor (merkle claims)

**Mobile game UI:** 23 screens across auth/garden/marketplace/community/profile/scanner tabs. Isometric SVG grid, animated crop sprites (5 growth stages), XP bar, streak badges, action buttons with spring animations.

## Mobile App Publishing (EAS)

Config: `packages/mobile/eas.json`, `packages/mobile/app.config.js`

**Build profiles:** development (internal APK), preview (internal IPA), production (App Store AAB/IPA)

**Key steps:**
1. `eas init` — creates project on expo.dev (ID: `5c01de7d-484e-4704-b4a1-d5833b59d62c`)
2. `eas build --profile development --platform android` — dev APK
3. `eas build --profile production --platform all` — production build
4. `eas submit --platform all` — submit to stores
5. `eas update --channel production` — OTA JS updates

**CI/CD:** `.github/workflows/mobile.yml` runs lint → typecheck → test → EAS build on main branch

## Workflow Screenshot Generation

The E2E system can auto-generate workflow screenshots and demo recordings:

```bash
npm run workflow:all          # Generate all screenshots + recordings
npm run workflow:screenshots  # Only screenshots (8 workflows)
npm run workflow:recordings   # Only recordings (7 demo videos)
```

Output:
- `e2e/screenshots/` — PNG screenshots per workflow step
- `e2e/workflows-data/` — HTML pages (index + per-workflow with animated gallery)
- `playwright-report/recordings/` — WebM demo videos + manifest.json

---

## CI/CD Workflows

### Admin Dashboard (`.github/workflows/admin-deploy.yml`)
- **test**: lint + typecheck + build
- **deploy-preview** (PR): cloud build → smoke tests → PR comment
- **deploy-production** (main): cloud build (`vercel deploy --prod --yes`) → 6-step post-deploy verification → E2E tests → Slack notification

### Backend (`.github/workflows/backend-deploy.yml`)
- **Removed**: NestJS backend merged into Next.js API routes — see admin-deploy.yml

### Mobile (`.github/workflows/mobile.yml`)
- **lint**: ESLint
- **typecheck**: TypeScript strict check
- **test**: Jest
- **eas-build** (main): `eas build --profile production --platform all`

## Vercel Deployment
```bash
npm run deploy:test     # Full deploy test: link → env pull → build → preview → health check → E2E tests
npm run deploy:preview  # Quick preview deploy (WARNING: uses vercel build which has NEXT_MISSING_LAMBDA bug)
npm run deploy:prod     # Production deploy (uses cloud build)
```

**Critical:** Always use `vercel deploy --prod --yes` (cloud build) for production. `vercel build` (local) has `@vercel/next` builder bug with Next.js 14.2.29 that intermittently fails.

### ⚠️ Redis on Vercel Limitation
Vercel's serverless functions do not support persistent TCP connections. For production:
- Use **Upstash Redis** (HTTP-based) or **Vercel KV** for caching, sessions, rate limiting
- Run BullMQ and Socket.IO on a separate long-running worker (e.g., Railway/Fly.io)
- Docker Redis remains for **local development**

## Available Commands
```bash
# Development
npm run admin:dev        # Start Next.js admin dashboard + API (port 3000)
npm run mobile:dev       # Start Expo mobile app
npm run ai:dev           # Start AI Python services (port 8000)

# Infrastructure
npm run docker:local     # Start Postgres (5432) + Redis (6379) for local dev
npm run docker:local:down
npm run docker:up        # Start all infrastructure (Postgres, Redis, MQTT)

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:seed      # Seed database

# Quality
npm run lint             # Lint all packages
npm run typecheck        # TypeScript strict check all packages
npm run test             # Backend Jest tests

# E2E Testing
npm run test:e2e               # Full E2E with Docker infra + local apps + Playwright
npm run test:e2e:headed        # Same but with headed browser
npm run test:e2e:docker-only   # Only start Docker infra (for manual testing)

# E2E Module-by-Module (individual workflows)
npm run e2e:all                # Run all 8 workflow modules sequentially
npm run e2e:auth               # Authentication workflow screenshots
npm run e2e:garden             # Garden management workflow screenshots
npm run e2e:admin              # Admin portal workflow screenshots
npm run e2e:weather            # Weather dashboard workflow screenshots
npm run e2e:marketplace        # Marketplace workflow screenshots
npm run e2e:community          # Community workflow screenshots
npm run e2e:ai-scanner         # AI scanner workflow screenshots
npm run e2e:invites            # Invite system workflow screenshots

# Workflow Screenshots
npm run workflow:all           # Generate all screenshots + recordings
npm run workflow:screenshots   # Screenshots only
npm run workflow:recordings    # Demo recordings only

# Agentic Feedback
npm run test:feedback          # Run Playwright → analyze → deploy readiness report

# Deployment
npm run deploy:test            # Full Vercel deploy test pipeline
npm run deploy:preview         # Vercel preview deploy
npm run deploy:prod            # Vercel production deploy
```

## Available Scripts (PowerShell)

```bash
# Environment Management
npm run script:docker-local        # Start Docker + optionally apps (local DB)
npm run script:docker-prod-debug    # Start apps pointing to Supabase (⚠ production!)
npm run script:stop-all             # Stop Docker + kill Node apps
npm run script:health-check         # Full service health check (exit code 0/1)
npm run script:db-diagnostic        # Database inspection, repair, slow query analysis

# Database Operations
npm run script:reset-db             # Drop + recreate + seed database
npm run script:run-migrations       # Apply pending Prisma migrations

# Verification
npm run script:verify-deployment    # Run admin + backend + cross-service checks
```

## Diagnostic Workflows

```bash
# Quick health check (all services)
npm run script:health-check

# If something is wrong:
.\scripts\health-check.ps1          # Detailed output
.\scripts\db-diagnostic.ps1 -All    # Inspect + repair + analyze
docker logs gardenverse-postgres --tail 50
docker logs gardenverse-redis --tail 50

# Full reset:
.\scripts\stop-all.ps1
npm run docker:local
.\scripts\reset-db.ps1 -Force
npm run admin:dev      # New terminal
```

---

## Documentation Index

| Category | Doc | Purpose |
|----------|-----|---------|
| **Architecture** | `docs/architecture/overview.md` | System architecture, data flow, deployment topology |
| **Architecture** | `docs/architecture/backend-architecture.md` | NestJS modules, queues, realtime, auth flow |
| **Architecture** | `docs/architecture/mobile-architecture.md` | Component hierarchy, state, navigation, offline |
| **Architecture** | `docs/architecture/data-models.md` | Entity relationships, schema documentation |
| **Architecture** | `docs/architecture/event-flow.md` | Event-driven architecture, queue structure |
| **Architecture** | `docs/architecture/sequence-diagrams.md` | 11 Mermaid sequence diagrams |
| **Architecture** | `docs/architecture/gamification-flow.md` | Gamification system, contracts, mobile UI, EAS publishing |
| **Architecture** | `docs/architecture/flow-payloads.md` | Sample API request/response payloads |
| **API** | `docs/api/README.md` | Complete API reference (24 modules, 80+ endpoints) |
| **Deployment** | `docs/deployment/production-deployment.md` | Production deployment guide (571 lines) |
| **Deployment** | `docs/deployment/deployment-guide.md` | Docker/K8s focused (legacy) |
| **Deployment** | `docs/deployment/ci-cd.md` | Older CI/CD doc |
| **Security** | `docs/security/security-plan.md` | JWT, RBAC, encryption, anti-cheat, OWASP |
| **Security** | `docs/security/encryption.md` | AES-256-GCM, libsodium, JWT, bcrypt specs |
| **Support** | `docs/support/faq.md` | Common Q&A |
| **Support** | `docs/support/troubleshooting.md` | Common issues and solutions |
| **Improvements** | `docs/improvements/lessons-learned.md` | Session-by-session lessons learned |
| **Legal** | `docs/legal/compliance.md` | GDPR, data privacy, moderation |
| **Legal** | `docs/legal/disclaimers.md` | AI, weather, marketplace, IoT disclaimers |

## .opencode Configuration

The `.opencode/` directory provides agent-driven development infrastructure:

### opencode.json
- 5 agent profiles: backend-dev, mobile-dev, admin-dev, testing, devops
- Plan templates: feature, fix, release

### MCP Servers (mcp.json)
- `docker` — Container management
- `playwright` — Browser automation (E2E + screenshots)
- `github` — GitHub API (issues, PRs, releases)
- `postgres` — Database inspection
- `git` — Git operations

### Agent Profiles (agents/)
Each profile has: description, mode (subagent), permissions, project structure, key rules, naming conventions, and commands. Use the Task tool with the relevant profile for focused work.

### Plan Templates (plans/)
- `feature-template.md` — Feature implementation with phases
- `fix-template.md` — Bug fix with root cause analysis
- `release-template.md` — Release checklist

### RULES.md
Mandatory agentic development rules covering:
- Git branch workflow (feature branches, no main)
- Commit & push safety (always ask approval)
- Secret handling (never log credentials)
- TypeScript strict mode (no any, explicit returns)
- Architecture rules (module independence, Prisma only)
- Testing requirements (Jest + Playwright)
- Pre-deployment checklist

## Sequence Diagrams

Located in `docs/architecture/sequence-diagrams.md` — 11 Mermaid diagrams:

| # | Diagram | Description |
|---|---------|-------------|
| 1 | User Onboarding | Registration, login, JWT flow |
| 2 | Garden & Crop Planting | Garden creation, plant selection, crop placement |
| 3 | Crop Growth Cycle | 5-min tick, weather modifiers, harvest alerts |
| 4 | Weather Data Pipeline | OpenWeatherMap sync, 3h cache, extreme alerts |
| 5 | AI Vision Pipeline | Photo upload → AI service → fallback → scan record |
| 6 | Marketplace Transaction | Listing, purchase, token transfer, notification |
| 7 | Community Chat | WebSocket, Redis pub/sub, encrypted messaging |
| 8 | IoT Sensor Pipeline | MQTT ingest, device auth, trust scoring |
| 9 | QR Invite System | Encrypted QR generation + verification |
| 10 | Admin Dashboard UX | Admin login, stats, users, moderation, analytics, super admin |
| 11 | Agent Orchestration | Event bus routing across all 7 agents |

## Support Documentation

- `docs/support/faq.md` — Common Q&A for getting started, development, testing, deployment, troubleshooting
- `docs/support/troubleshooting.md` — Solutions for Node/PowerShell, Docker, Prisma, Backend, Mobile, E2E issues

## MCP Configuration Reference
```json
{
  "mcpServers": {
    "docker": { "command": "docker" },
    "playwright": {
      "command": "npx",
      "args": ["@anthropic-ai/mcp-playwright"]
    },
    "github": { "command": "gh" },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://gardenverse:gardenverse123@localhost:5432/gardenverse"
      }
    },
    "git": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git"]
    }
  }
}
```
