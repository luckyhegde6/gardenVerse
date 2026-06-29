# GardenVerse — Session Memory

> Persistent context across sessions. Updated continuously.

## Current Session

**Date**: June 28, 2026
**Session ID**: ses-019
**Focus**: Mobile UX Refactor — Design System Foundation + Garden Immersive Overhaul + Prisma v7 Migration

### Active Context

- **Design token system created** (`packages/mobile/src/styles/tokens.ts`) — centralized color palette, spacing scale (4/8/12/16/24/32/48), typography constants, shadow presets. Design system rules codified: no inline colors, no random spacing, all interactive elements use Reanimated press animations.
- **Core UI components upgraded**: Card (Reanimated press 1→0.96), Button (spring press scale), Avatar (image error fallback → initials, never raw URLs), Modal (Reanimated → RN Animated), ProgressBar (animated fill)
- **New shared components**: MetricCard, ErrorFallback, PageHeader, SectionHeader, CollapsibleSection (Reanimated), LoadingCard (skeleton)
- **EnvironmentEffects**: Skia-based animated weather overlay — rain particles, sun glow, cloud drift, night mode stars, storm lightning. Driven by `weather.condition` prop.
- **GardenViewport**: Full-width 60% viewport container with layer system (environment → grid → effects). Auto-scales IsometricGrid/Garden3D.
- **FloatingActionButtons**: 3 circular FABs (Scan purple, Water blue, Soil amber) with Reanimated spring press physics.
- **PlantHealthBadge**: Color-coded dot+label per crop (healthy/dry/sick/growing) with pulse animation on growing state.
- **SyncWidget**: IoT sensor card showing online/offline, moisture/humidity/temp, last sync time.
- **XpBar + StreakDisplay**: Compact animated HUD elements — thin XP progress bar and fire-streak pill.
- **GardenScreen rewritten**: Immersive layout — garden at 60% viewport, EnvironmentEffects overlay, FABs, compact HUD, collapsible sections for collections/streaks/mastery. Reduced from 1317→~650 lines.
- **GrowthOverlay.tsx deleted** (774 lines) — replaced by compact HUD + inline components.
- **TypeScript**: `tsc --noEmit` zero errors on mobile package.
- **No backend APIs changed** — all existing API contracts preserved.
- **Prisma v7 migration**: Updated schema (`prisma-client` generator, `output = "../src/lib/prisma/generated"`, no `url` in datasource), created `prisma.config.ts` with `defineConfig`, updated `client.ts` to use `PrismaPg` adapter, added tsconfig path alias (`@prisma/client` → generated client) to preserve all 29 import files unchanged. TypeScript passes with zero errors. Seed works with full data (220 plants, 3 users, etc.).
- **File split**: AGENTS.md now contains only CLAUDE.md behavioral guidelines (61 lines). All project reference content (standards, sessions, conventions) moved to PROJECT_REFERENCE.md (1260 lines).

### Open Questions

- Weather effects on growth engine not wired (sunlight modifier exists but no weather data integration)
- Garden/crop detail tables on `/garden` page still use hardcoded `data={[]}` — needs admin-specific garden listing API routes
- `packages/admin/prisma/migrations/` directory was never created; schema pushed via `prisma db push` instead — needs a proper initial migration
- Path aliases (`@/`, `@components/`, `@screens/`) configured in tsconfig but zero files use them — needs batch migration

### Active Specs

- **Multi-garden economy**: One User → many Gardens (plots); first plot free, subsequent via tiered pricing [100, 250, 500, 800, 1200, 1500 GC]; max 10 plots, hard cap at API level
- **Plot purchase**: POST /api/v1/plots → creates new Garden with plotNumber (auto-increment), deducts GC, records TokenTransaction
- **Shop buy**: POST /api/v1/shop/buy → validates coupon if provided, deducts GC, creates Purchase + InventoryItem, records TokenTransaction
- **Coupon system**: Admin CRUD at /api/v1/coupons; redeem at POST /api/v1/coupons/redeem — validates code, expiry, max redemptions, user role, garden type
- **Real gardener**: GET /api/v1/real-gardener (status), POST /api/v1/real-gardener/verify (sets badge + verifiedAt), GET /api/v1/real-gardener/encouragement (daily rotating tips by region)
- **Soil check**: POST /api/v1/plots/[id]/soil-check — accepts pH/moisture/NPK, calculates quality score, appends to soilQualityHistory Json array
- **Crop movement**: POST /api/v1/plots/[id]/move-crop — level 3+ same-garden, level 5+ cross-garden; decrements move budget (3 moves/day base)
- **External data sync**: GET /api/v1/external-data-sync (logs), POST /api/v1/external-data-sync/trigger (simulated sync with 3 sources)
- **Seed reset pattern**: Uses `SET session_replication_role = 'replica'` + TRUNCATE CASCADE raw SQL for reliable FK-safe data cleanup (deleteMany chain fails with multi-model FK references)
- **Mobile store pattern**: Zustand stores follow existing authStore/gardenStore pattern with loading/error states; service modules use try/catch with sensible fallback defaults
- **Encouragement rotation**: Daily rotating tips based on `(dayOfYear + userIdHash) % totalTips` for personalization

### Recent Decisions

- **ADR-013**: Multi-garden economy — 1:many User:Garden relation; first plot free, tiered pricing for subsequent plots, max 10 hard cap
  - Rationale: Enables plot expansions without breaking existing garden access patterns; tiered pricing makes early plots affordable while keeping scarcity at higher counts
  - Status: ✅ Applied
- **ADR-014**: Plot purchase pricing tiers: [100, 250, 500, 800, 1200, 1500] GC for 1st–6th extra plot, all subsequent at 1500
  - Rationale: Exponential pricing curve incentivizes early expansion while making mass plot ownership expensive
  - Status: ✅ Applied
- **ADR-015**: Seed reset uses raw SQL TRUNCATE CASCADE (not deleteMany chain)
  - Rationale: FK constraints between User/PlotPurchase/SoilCheck/Coupon etc. cause deleteMany ordering failures; raw SQL is simpler and guaranteed to work
  - Status: ✅ Applied
- **ADR-016**: Mobile SafeAreaView imported from `react-native` (not `react-native-safe-area-context`)
  - Rationale: New screens need `style` prop for tan container background; `react-native-safe-area-context` only offers `edges` prop, no direct style
  - Status: ✅ Applied

### Key Numbers

- **Mobile**: 30 new/rewritten files (tokens.ts, 8 UI component upgrades, 7 new shared components, 8 garden components, 1 screen rewrite). GardenScreen 1317→~650 lines. GrowthOverlay deleted (774 lines).
- **Design System**: 1 token file, 8 UI component upgrades, 7 new shared components. Zero inline colors. 4 spacing values. 5 typography sizes. 7 color tokens.
- **TypeScript**: `tsc --noEmit` zero errors on mobile package.
- **Backend**: Zero API changes. All existing endpoints preserved.
- **Garden components created**: EnvironmentEffects (Skia particles), GardenViewport, FloatingActionButton, PlantHealthBadge, SyncWidget, XpBar, StreakDisplay, CollapsibleSection
- **Components deleted**: GrowthOverlay.tsx (774 lines) — replaced by compact HUD
- **E2E**: 68/68 tests passing

## Previous Sessions

### Session 19 (Jun 28, 2026): Mobile UX Refactor — Design System + Garden Immersive Overhaul
- Created design token system (`src/styles/tokens.ts`) — 7 color tokens, 6 spacing values, 5 typography sizes, 4 shadow presets
- Upgraded 8 UI components: Card (Reanimated press), Button (spring), Avatar (image fallback), Modal (Reanimated), ProgressBar (animated), EmptyState (fade-in), Input (focus ring), LoadingSpinner (rotation)
- Created 7 new shared components: MetricCard, ErrorFallback, PageHeader, SectionHeader, CollapsibleSection, LoadingCard
- Created EnvironmentEffects — Skia animated weather (rain particles, sun glow, cloud drift, night stars, storm lightning)
- Created GardenViewport — 60% viewport with layer system
- Created FloatingActionButton — 3 FABs (Scan/Water/Soil) with Reanimated spring
- Created PlantHealthBadge — color-dot per crop growing/dry/healthy/sick with pulse
- Created SyncWidget, XpBar, StreakDisplay — compact animated HUD
- Rewrote GardenScreen (1317→~650 lines) — immersive layout, compact HUD, collapsible sections
- Deleted GrowthOverlay.tsx (774 lines)
- Key decisions: ADR-017 (Skia weather), ADR-018 (compact HUD on viewport), ADR-019 (Reanimated for all press), ADR-020 (collapsible sections)
- Avatar fix: never show raw URLs, catch Image error → initials fallback
- TypeScript zero errors on mobile package
- No backend APIs changed

### Session 16 (Jun 27, 2026): Multi-Garden Economy — Plot Purchases, Shop, Coupons, Real Gardener, Campaigns (Admin + Mobile)
- Prisma schema updated: removed @unique from Garden.userId (1:1 → 1:many); added User.maxPlots/plotPurchaseCount/isRealGardener; Garden.plotNumber/isPurchased/purchasePrice/soilLastCheckedAt/plantMoveCount; new models Coupon, Fertilizer, PlotPurchase, SoilCheck, ExternalDataSync; campaign discount fields
- Fixed 12+ API route files for multi-garden compatibility: user.garden → user.gardens[0], findUnique({where:{userId}}) → findFirst, garden:{isNot:null} → gardens:{some:{}}
- 15 new economy API routes: plots CRUD + pricing + soil-check + move-crop, shop browse + buy, coupons CRUD + redeem, real-gardener verify + encouragement, external-data-sync
- 6 admin UI pages: Shop (3-tab Browse/Purchases/Inventory), Coupons (CRUD modals + stats), Plots (card grid + soil-check + pricing), Fertilizers, Campaigns (enhanced with discount fields)
- Seed data: 21 shop items (6 categories), 6 fertilizers (5 rarities), 6 coupon codes (valid + expired), 3 soil checks, 3 sync records, admin 2nd plot
- All endpoints verified via curl: plot purchase deducts 100 GC, shop buy creates purchase + token transaction, coupon redeem applies 10% discount, real gardener verify assigns 🏡 badge
- E2E: 68/68 tests passing (5.9m, zero failures)
- Seed reset uses `SET session_replication_role = 'replica'` + TRUNCATE CASCADE raw SQL (avoids FK constraint failures from deleteMany chain)
- Mobile Phase 1-4 (~35 hrs): 11 new types, 4 service modules, 3 Zustand stores, 6 new route registrations, 6 screens (Shop, CouponRedeem, Plots, PlotDetail, SoilCheck, RealGardener), updated GardenScreen (plot selector bar + buy CTA) and ProfileScreen (4 new menu items)
- Emulator verification (Pixel_7_API_34): app launches, login works, GardenScreen renders with plot selector/collections/care streaks, Profile tab shows Shop/Plots/RealGardener menu items between stats and activity feed
- `tsc --noEmit` zero errors on both admin and mobile packages
- Non-critical warnings: ReactImageView missing asset (build artefact), Firebase not initialized (dev build), Layout children type warning (existing `_layout.tsx`)
- Key decisions: ADR-013 (1:many User:Garden), ADR-014 (tiered pricing [100-1500] GC), ADR-015 (TRUNCATE CASCADE seed reset), ADR-016 (SafeAreaView from react-native)

### Session 15 (Jun 27, 2026): Android APK Fix — Hermes, Storage Unification, Emulator Network + Source Fixes
- Switched to Hermes JS engine (fixed JSC "undefined is not a constructor (evaluating 'new Promise')" crash)
- Unified storage backend: utils/storage.ts now re-exports from services/storage.ts (was dual backends causing token lookup failure → 401)
- Overrode `getUseDeveloperSupport() = false` in MainApplication.kt to force loading from pre-built bundle assets
- Fixed emulator network: 10.0.2.2 unreachable on Windows; switched to localhost:3000 + `adb reverse tcp:3000 tcp:3000`
- Updated api.ts import path and URL to match fixed source files
- Working APK produced (81 MB, Hermes arm64-v8a debug) — login end-to-end working
- Investigated interim 401s: refresh URL was 10.0.2.2:3000 (unreachable), catch block cleared auth; fixed with localhost URL
- Key learnings: Hermes is standard for RN 0.74+; forked kapt workers ignore gradle.taskGraph props — just skip with `-x`

### Session 14 (Jun 25, 2026): Admin Auth Guarding + Public Plant Encyclopedia + Gradle APK Build Fix + E2E Stability
- Role-gated AppShell — non-admin users redirected to `/download` for admin-only pages; sidebar links role-gated
- Made `/plants` and `/diseases` public (PUBLIC_PATHS); public nav links in PublicLayout.tsx header
- Admin features hidden on public pages (Add Plant button, row-click-edit, empty-state Add)
- Fixed mobile PlantBrowserScreen.tsx — removed hardcoded `localhost:3001` (dead NestJS), uses shared `api` service
- Fixed JWT role case — login routes were storing `user.role.toLowerCase()` in JWT, breaking uppercase comparisons in API guards; changed to store `user.role` as-is (uppercase)
- Fixed Gradle APK build: Metro 0.80.12 → 0.80.3 (file-crawl hang), pre-built JS bundle, disabled Hermes, skipped `expo-updates:kaptDebugKotlin` (Room SQLite lock crash in forked worker); produced working `app-arm64-v8a-debug.apk` (70MB)
- Fixed E2E fixture flakiness — removed silent try/catch in authenticatedPage/superAdminPage (was swallowing auth failures)
- Fixed integration tests: `res` → `res1`/`res2` variable name bugs, garden page strict-mode selector, authenticateUI rewritten to API+localStorage, features page selector specificity
- 68/68 E2E tests passing (20 integration + 10 admin + 7 auth + 7 invites + 24 screenshots)
- `tsc --noEmit` passes with zero errors on admin package
- Dev server restarted (was stopped — mobile emulator showed "No plants found")
- Key learnings: JWT role case-sensitivity is a hidden footgun; E2E fixtures must propagate errors; `audit` tool can miss nested `process.env` access in submodules

### Session 13 (Jun 24, 2026): EAS Hosting Integration — Public Download Page + Admin Build Management + Branch Protection Rules
- Branch protection rules codified in AGENTS.md, checklist.md, production-sync.md — no direct pushes to `main`, PRs + squash merges + signed commits + CI/CodeQL required, fresh branches deleted after merge
- Public `/download` page — QR code + download button, no auth, no tabs, no `imageSettings` (avoids 404 from missing icon-192.png)
- Admin `/mobile` page — 4 tabs (Overview, Build APK, Sync OTA, Changelog), role-gated to admin/super_admin
- Sidebar role-gating — "Mobile App" and "Super Admin" links only visible to admin/super_admin via `ADMIN_ONLY` array
- Build API route — POST/GET `/api/v1/mobile/build-apk` triggers EAS workflow_dispatch
- Download/APK-info API routes — serve local APK, fallback to GitHub Releases, return version/size/SHA256
- EAS Hosting workflow — `.github/workflows/eas-hosting.yml` deploys mobile web build to EAS Hosting CDN
- Production verification — /download renders with 0 console errors, all API routes working
- APK built via `gradlew.bat assembleDebug` (191MB dev APK) — useContext crash confirmed (known React version mismatch in dev build)

### Session 12 (Jun 23, 2026): Production Auth Fix + Emulator Testing + E2E Flow Verification
- Fixed production auth 500 error: bcrypt@5.1.1 native module fails on Vercel Lambda; switched to bcryptjs (pure JS, works everywhere)
- Fixed dynamic `jsonwebtoken` imports — `await import('jsonwebtoken')` triggered DEP0169; replaced with static imports
- Fixed stale production URL — `useNotifications.ts` hardcoded `api.gardenverse.app` (nonexistent); changed to `gardenverse.vercel.app`
- Added missing `/api/v1/ai/scans` route — requests fell through to `[id]` dynamic route causing 500; created proper paginated GET handler with auth guard
- Vercel deployment — 152 pages/routes compiled successfully, all API routes included
- Emulator testing — Pixel_7_API_34 with GardenVerse APK; confirmed API connectivity via logcat
- Found React useContext crash in dev APK — React version mismatch; need production EAS build for stable APK
- Production API verification — all endpoints returning 200 (login, gardens, crops, plants, stats, marketplace, weather, community, ai/scans, notifications/preferences)

### Session 11 (Jun 5, 2026): Mobile Logger Pipeline + Seed Data Restoration + First-Time Walkthrough
- Created mobile Logger service (`packages/mobile/src/services/logger.ts`) — 192-line module with circular buffer (200 entries), debounced batch sender (500ms), console method override, only active in `__DEV__`
- Wired logger into API interceptor — replaced `console.log`/`.error` in api.ts with structured `logger.info`/`.error` calls
- Added App Logs section to DebugOverlay — color-coded level badges, message, source/context badges, timestamp
- Logger init in root layout — `_layout.tsx` calls `initLogger()` at module level
- Seed data expansion — added 20 Indian plant species (Tomato, Chilli, Turmeric, Rice, Okra, Brinjal, etc.), VIRTUAL "Demo Garden" with 3 crops, 6 feature flags
- First-time walkthrough overlay — 5-step modal (Welcome → Plant → Water → Fertilize → Harvest) with progress dots, Skip/Next buttons
- Fixed seed script — changed from `ts-node` (Windows quoting bug) to `tsx` in package.json
- API verification — Plants (20 species), Gardens (1 for demo user), Login (all 3 accounts) verified via curl
- Fixed plant selection "No plants found" — PlantSpecies table was empty before seed expansion

### Session 10 (Jun 4, 2026): Backend Migration Completion — Monitoring Overhaul + NestJS→Next.js + Logger + AI Dashboard
- Overhauled monitoring page: 6 sections (System Health, Performance Metrics, API Endpoint Performance, System Logs with search/filter/clear, Queue Status, Sidecar Services)
- Created Logger sidecar (`packages/admin/src/lib/logger/index.ts`) with file + DB writes, 24h TTL, log reading/clearing
- Created logging middleware (`packages/admin/src/lib/middleware/logging.ts`) with traceId, duration, status
- Created `/api/v1/logs`, `/api/v1/logs/clear`, `/api/v1/analytics/endpoints` API routes
- Phase 1 - Audit: Mapped all 25 backend modules → 88 admin routes → 38 gap endpoints
- Phase 2 - Batch Migration: Created 37 new API routes across 7 domains
- Phase 3 - Infrastructure: Created in-process queue wrapper, SSE/pub/sub, cron task registry, 2 Vercel Cron routes, agent callback handler
- Phase 4 - AI: Created TypeScript AI fallback (plant analysis, watering/fertilizer recommendations, disease detection), built AI Dashboard page
- Phase 5 - Cleanup: Deleted `packages/backend/`, removed backend CI/CD, updated root package.json
- Verification: `tsc --noEmit` pass on admin + mobile; `next build` compiles 126 pages; Chrome-verified dashboard + monitoring page with real data

### Session 9 (Jun 3, 2026): Auth Persistence Fix + Mobile UI Overhaul + Agents Improvement
- Fixed auth persistence on Expo web: `storage.ts` in-memory `Map` → `window.localStorage` for web platform
- Fixed `loadStoredAuth` failure cascade: on `/auth/profile` 404, falls back to cached userData instead of clearing all auth state
- Created `GET /api/v1/auth/profile` endpoint (returns user profile from JWT)
- Fixed marketplace routing bug: `useMarketplace.ts` URLs `/marketplace/listings` → `/marketplace`
- Rewrote `ListingDetailScreen` — fetches real listing data via `getListingById`
- Rewrote `CreateListingScreen` — calls `createListing` with `GREEN_CREDITS` currency
- Added demo user (`demo@gardenverse.vercel.app`), demo garden (VIRTUAL), 3 demo crops to seed data
- Fixed seed password: `Password123` → `password123` to match README docs
- Created `GrowthOverlay.tsx` — floating growth status panel (682 lines)
- Created `WeatherBar.tsx` — compact horizontally scrolling weather strip
- Created `GET /api/v1/users/me/stats` endpoint — aggregated profile stats
- Updated `Garden3D.tsx` — selection ring mesh, empty tile highlighting, raycasting tap detection
- Rewrote `GardenScreen.tsx` — integrated GrowthOverlay and WeatherBar, fetches weather data
- Rewrote `ProfileScreen.tsx` — fetches stats from `/users/me/stats`, Garden Summary, collections, activity
- All API endpoints verified via curl (login, stats, gardens, marketplace, tick, profile)
- Both packages typecheck (`tsc --noEmit`) pass clean
- Expo dev server running on `http://localhost:19006`

### Session 8 (Jun 3, 2026): Mobile Garden Overhaul — Garden3D, IsometricGrid, Growth Engine, Tick API
- Expanded Garden3D 4×4 → 6×6 with terrain elevation, fence, water shimmer, PanResponder camera, 5 Indian plants
- Created GrowthEngine client-side tick simulation (30s interval, 100x virtual speed)
- Expanded IsometricGrid 4×4 → 6×6 with plant shadows, richer soil, dynamic viewBox
- Added 5 Indian crop sprites (Chilli, Turmeric, Rice, Okra, Brinjal)
- Integrated growth engine into GardenScreen, added `syncCrops` to gardenStore
- Created `POST /gardens/{id}/tick` backend endpoint
- Admin build: 87 pages/routes, Mobile TypeScript clean

### Session 7 (Jun 3, 2026): Indian City Data + Locations Page + Supabase Sync
- Migrated all seed data US → Indian cities (10 users, 5 gardens, 7 weather records)
- Created `/locations` page with OpenStreetMap + All Gardeners tab
- Added Sidebar nav link with `MapPin` icon
- Fixed Garden page: replaced hardcoded `data={[]}` with real API data
- Fixed gardens API route: added `region` field to user select
- Synced Supabase with Indian city data via Prisma
- 84 pages/routes compiled with zero TypeScript errors

### Session 6 (Jun 2, 2026): API Route Migration + E2E Fixes + Chrome Verification
- Fixed 6 broken API paths, created 6 new API routes (logs, queues, sidecars, support, marketplace/transactions)
- Fixed 2 flaky E2E tests, verified 17 pages in Chrome with zero console errors
- Response format fix: `body.users` → `body.data` across pages
- Added `_count` to Prisma queries, fixed `[object Object]` display in invites
- No stale port 3001 references remain

### Session 5 (May 31 - Jun 1, 2026): Vercel Deploy + CI/CD + EAS
- Admin deployed to Vercel (31/31 routes live)
- CI/CD workflows created (admin-deploy, backend-deploy — now removed, backend merged into Next.js)
- EAS Build: project initialized, app.json → app.config.js, dev-client installed
- Gamification flow guide (550+ lines), eas.json, EAS workflows

### Session 4 (Backend Stability + E2E Full Pass)
- Fixed backend startup (unhandledRejection/uncaughtException handlers)
- Created `scripts/start-backend.ps1` with port cleanup + health check
- 48/48 E2E tests passing with real seeded data

### Session 3 (E2E Testing + Config Fixes)
- Module-by-module E2E runner (8 workflows), 28 screenshots
- Playwright CLI 1.60.0 + MCP 0.0.75
- 41/41 Hardhat tests passing

### Session 2 (Dev Infrastructure + Docs)
- `.opencode/` with 5 agent profiles, plan templates, MCP config, RULES.md
- 8 PowerShell scripts, 10 Mermaid sequence diagrams

### Session 1 (Initial Build)
- 334 files across 8 components, 7 agents, 30+ event types
- 22 NestJS modules, 16 React Native screens, 8 Solidity contracts

## Agent Status

| Agent | Status | Notes |
|-------|--------|-------|
| AgentOrchestrator | LISTENING | Event bus routing all 7 agents |
| GameplayAgent | LISTENING | Gamification events (plant/harvest/streak) |
| WeatherAgent | LISTENING | Cron-driven, HTTP emitter |
| IotAgent | LISTENING | MQTT-driven, HTTP emitter |
| VisionAgent | LISTENING | Calls AI service + mock fallback |
| MarketplaceAgent | LISTENING | Listing/purchase/escrow events |
| SafetyAgent | LISTENING | Moderation/reputation events |
| RecommendationAgent | LISTENING | Plant/crop recommendations |

## Next Actions

1. **Phase 2**: Marketplace redesign — ProductCard, BuyModal, SearchBar, CategoryChip, FeaturedRow, TrendingRow, EmptyMarketplace
2. **Phase 3**: Community redesign — NearbyGardenerCard, LeaderboardCard, CommunityGroupCard, EventCard, ActivityFeed, CommunitySearchBar
3. **Phase 4**: React Query migration (useQuery for all API calls), FlashList for lists, lazy loading for Garden3D
4. **Phase 5**: Per-screen ErrorBoundary, entrance animations (staggered), offline support (banner + stale cache)
5. **Path alias migration**: Batch update all 100+ mobile files to use `@/` `@components/` etc.
6. Create admin garden listing/crop health API routes for `/garden` page tables
7. Wire weather effects into growth simulation (sunlight modifier already in engine)
8. Build production APK via `eas build --profile production`

## File Map

```
.github/workflows/
  admin-deploy.yml       # Vercel admin deploy (cloud build + verify)
  backend-deploy.yml     # REMOVED — backend merged into Next.js API routes
  mobile.yml             # EAS Build for mobile
  admin.yml              # Old: lint + build only (superseded by admin-deploy.yml)
  backend.yml            # Old: lint + test + build only (superseded by backend-deploy.yml)
  contracts.yml          # Hardhat compile + test

.opencode/
  agents/
    mobile-dev.md        # UPDATED: Expo web storage patterns (localStorage for web)
    backend-dev.md       # UPDATED: API route patterns (auth/profile, users/me/stats)
  RULES.md               # UPDATED: Expo web, API response format, store design rules

packages/
   admin/                # Next.js 14 admin dashboard + API (Vercel) — 152 pages/routes
      prisma/
         schema.prisma               # Canonical schema (47 models, 9 enums) — Session 16: multi-garden + economy
         seed.ts                     # Session 16: 21 shop items, 6 fertilizers, 6 coupons, 3 soil checks, 3 sync records
      src/
         lib/
           logger/index.ts           # Session 10: Logger sidecar (file + DB, 24h TTL)
           middleware/logging.ts     # Session 10: Request tracking middleware
           queue.ts                  # Session 10: In-process queue wrapper
           websocket.ts             # Session 10: SSE helper + pub/sub
           cron.ts                   # Session 10: Task registry
           ai/index.ts              # Session 10: TypeScript AI fallback
           agents/README.md         # Session 10: Agent migration docs
         app/api/v1/
           plots/route.ts            # Session 16: GET list + POST purchase
           plots/pricing/route.ts    # Session 16: GET tiered pricing
           plots/[id]/route.ts       # Session 16: GET detail + PATCH update
           plots/[id]/soil-check/    # Session 16: POST soil check (pH/moisture/NPK scoring)
           plots/[id]/move-crop/     # Session 16: POST move crop (level-gated)
           shop/route.ts             # Session 16: GET categorized shop items
           shop/buy/route.ts         # Session 16: POST purchase item (coupon, GC deduction, inventory)
           tools/route.ts            # Session 16: GET tool catalog
           fertilizers/route.ts      # Session 16: GET fertilizer catalog
           coupons/route.ts          # Session 16: GET/POST admin CRUD
           coupons/redeem/route.ts   # Session 16: POST validate + apply discount
           real-gardener/route.ts    # Session 16: GET status + encouragement
           real-gardener/verify/     # Session 16: POST verify (badge assignment)
           real-gardener/encouragement/ # Session 16: GET daily rotating tips
           external-data-sync/route.ts  # Session 16: GET sync logs
           external-data-sync/trigger/  # Session 16: POST simulated sync
           campaigns/[id]/route.ts   # Session 16: GET/PATCH/DELETE with discount fields
           ... + all previous routes
         app/shop/page.tsx           # Session 16: 3-tab (Browse/Purchases/Inventory) with buy modal + coupon
         app/coupons/page.tsx        # Session 16: CRUD table with create/edit/delete modals + stats
         app/plots/page.tsx          # Session 16: Card grid with soil-check form + purchase modal + pricing
         app/fertilizers/page.tsx    # Session 16: Available + active sections
         app/campaigns/page.tsx      # Session 16: Enhanced with discount fields, edit, delete
         app/monitoring/page.tsx     # Session 10: Overhauled with 6 sections
         app/ai-dashboard/page.tsx   # Session 10: New AI dashboard page
         app/download/page.tsx       # Session 13: Public download page (QR + button)
         app/mobile/page.tsx         # Session 13: Admin build management (4 tabs, role-gated)
         app/plants/page.tsx         # Session 14: Public plant encyclopedia (admin features hidden for non-admin)
         app/diseases/page.tsx       # Session 14: Public disease dataset reference
    mobile/               # React Native (Expo) — 29+ screens, working debug APK (81MB Hermes arm64-v8a)
       src/
         types/
           index.ts        # Session 16: 11 new economy interfaces (ShopItem, Coupon, Fertilizer, etc.)
         services/
           plots.ts        # Session 16: 7 methods (fetchPlots, purchasePlot, fetchPricing, fetchDetail, updatePlot, checkSoil, moveCrop)
           shop.ts         # Session 16: 4 methods (fetchShopItems, buyItem, fetchTools, fetchFertilizers)
           coupons.ts      # Session 16: 1 method (redeemCoupon)
           realGardener.ts # Session 16: 3 methods (fetchStatus, verify, fetchEncouragement)
           logger.ts       # Session 11: Logger service (circular buffer, batch sender, console override)
           growthEngine.ts # Session 8: client-side growth simulation (30s tick, 100x virtual speed)
         stores/
           plotsStore.ts   # Session 16: Zustand (6 actions: fetchPlots, purchasePlot, fetchPricing, fetchDetail, updatePlot, checkSoil)
           shopStore.ts    # Session 16: Zustand (6 actions: fetchItems, buyItem, fetchTools, fetchFertilizers, redeemCoupon, clearMessage)
           realGardenerStore.ts # Session 16: Zustand (3 actions: fetchStatus, verify, fetchEncouragement)
           gardenStore.ts  # Session 16: added fetchPlots, purchasePlot, plotCount, maxPlots
           authStore.ts    # Session 9: loadStoredAuth falls back to cached userData on profile fetch failure
         hooks/
           useGarden.ts    # Session 16: exposes plotCount, canPurchaseMore, fetchPlots, purchasePlot
           useMarketplace.ts  # Session 9: URLs /marketplace/listings → /marketplace
           useWalkthrough.ts  # Session 11: First-time walkthrough hook
         screens/
           shop/
             ShopScreen.tsx          # Session 16: Browse (category filter + search), buy modal (qty + coupon), inventory tab
             CouponRedeemScreen.tsx   # Session 16: Code entry + validation result with discount breakdown
           plots/
             PlotsScreen.tsx         # Session 16: Plot grid with status/occupancy, pricing tiers modal, purchase confirm
             PlotDetailScreen.tsx    # Session 16: Info card, soil check card + history, move crop UI (level 3+/5+ gated)
             SoilCheckScreen.tsx     # Session 16: pH/NPK/moisture sliders, quality scoring, color-coded results
           realGardener/
             RealGardenerScreen.tsx  # Session 16: Verification form, badge display, daily encouragement tips
           garden/
             GardenScreen.tsx        # Session 16: Horizontal plot selector bar with buy-plot CTA
             PlantBrowserScreen.tsx  # Session 14: removed hardcoded localhost:3001, uses api service
             PlantCropScreen.tsx
           marketplace/
             ListingDetailScreen.tsx # Session 9: fetches real listing data
             CreateListingScreen.tsx # Session 9: calls createListing with GREEN_CREDITS
           profile/
             ProfileScreen.tsx       # Session 16: 4 new menu items (Shop, Plots, Real Gardener, Coupon Redeem)
         components/garden/
           Garden3D.tsx        # UPDATED: selection ring mesh, empty tile highlights, raycasting tap detection
           IsometricGrid.tsx   # Session 8: expanded 4x4→6x6, plant shadows, richer soil
           CropSpriteSVG.tsx   # Session 8: added 5 Indian crop sprites
           GrowthOverlay.tsx   # Session 9: floating growth status panel
           WeatherBar.tsx      # Session 9: horizontally scrolling weather strip
           WalkthroughOverlay.tsx  # Session 11: 5-step first-time walkthrough modal
         app/
           shop.tsx                    # Session 16: route wrapper for ShopScreen
           plots.tsx                   # Session 16: route wrapper for PlotsScreen
           real-gardener.tsx           # Session 16: route wrapper for RealGardenerScreen
           coupon-redeem.tsx           # Session 16: route wrapper for CouponRedeemScreen
           plot-detail/[plotId].tsx    # Session 16: route wrapper for PlotDetailScreen
           soil-check/[plotId].tsx     # Session 16: route wrapper for SoilCheckScreen
           _layout.tsx                 # Session 16: registered 6 new Stack.Screen entries
           DebugOverlay.tsx            # Session 11: added "App Logs (last 50)" section

contracts/               # 8 Solidity contracts (Hardhat)
  contracts/
    tokens/              # GreenCreditToken, EcoPointToken, ReputationToken, InviteToken
    marketplace/         # Marketplace, Escrow
    reputation/          # ReputationManager, RewardDistributor

e2e/
  fixtures/test.ts       # Session 14: Propagates errors (no silent try/catch), API+localStorage auth
  tests/
    integration.spec.ts  # Session 14: 20 tests — fixed variable names, selectors, garden page, pagination
    admin.spec.ts        # Session 14: Fixed USERNAME column (th:has-text("Username"))
  screenshots/           # Session 3+: 24 screenshot tests across 8 workflows

scripts/
  verify-deployment.sh   # Admin + backend + cross-service checks (bash)
  verify-deployment.ps1  # Same for PowerShell

packages/mobile/
  app.config.js          # Session 5: JS expressions for EAS env vars
  eas.json               # Session 5: Build profiles (development/preview/production)
  android/app/build.gradle  # Session 14: Metro downgrade, pre-bundled JS, Hermes disabled
  gradle.properties      # Session 14: kapt.use.worker.api=false (Room SQLite worker fix)

docs/
  architecture/
    gamification-flow.md # Complete gamification guide + EAS publishing
  deployment/
    production-deployment.md # Full production deployment guide
    improvements/
        lessons-learned.md   # ses-006 through ses-016 entries added
  api/
    README.md            # Updated with gamification endpoints
```
