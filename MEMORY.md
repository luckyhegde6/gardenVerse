# GardenVerse — Session Memory

> Persistent context across sessions. Updated continuously.

## Current Session

**Date**: June 1, 2026
**Session ID**: ses-005
**Focus**: Vercel Deploy + CI/CD + EAS Build + Gamification Docs + Documentation Refresh

### Active Context

- **Phase 5 (This Session — Vercel Deploy + CI/CD + EAS + Docs)**:
  - Admin dashboard deployed to Vercel: https://gardenverse.vercel.app (31/31 routes)
  - CI/CD workflows created: admin-deploy.yml (Vercel cloud build + post-deploy verify), backend-deploy.yml (Railway)
  - Post-deploy verification scripts: verify-deployment.sh + .ps1
  - EAS Build fully configured: project initialized (ID: `5c01de7d`), app.json → app.config.js conversion, expo-dev-client installed, 5 dependency version mismatches fixed, @types/react-native removed
  - Android dev APK submitted to EAS cloud build
  - Gamification flow guide created: `docs/architecture/gamification-flow.md`
  - Sentry re-enabled via instrumentation.ts (v10+ pattern — no withSentryConfig wrapper)
  - Swagger API docs link added to admin sidebar
  - AGENTS.md/MEMORY.md/lessons-learned.md/docs/api/README.md all refreshed

### Open Questions

- EAS cloud build is still running (was queued during partial outage) — check status
- Railway deploy not yet done — blocks full admin API functionality and NEXT_PUBLIC_API_URL
- `expo-doctor` network check #17 fails behind proxy — need to verify on clean network

### Active Specs

- None currently in flight

### Recent Decisions

- **ADR-004**: Use `instrumentation.ts` pattern for Sentry instead of `withSentryConfig` wrapper
  - Rationale: `withSentryConfig` breaks `@vercel/next` builder on both local and cloud builds
  - Trade-off: No Sentry source map uploads during build (manual upload via CI instead)
  - Status: ✅ Applied (wrote `packages/admin/src/instrumentation.ts`)
- **ADR-005**: Use `app.config.js` with JS expressions instead of raw `app.json`
  - Rationale: `app.json` doesn't support `process.env`; `app.config.js` enables env var injection at build time
  - Trade-off: Slightly more complex config, but enables per-environment API URLs and secrets
  - Status: ✅ Applied (converted `packages/mobile/app.json` → `app.config.js`)
- **ADR-006**: Use cloud build (`vercel deploy --prod --yes`) for Vercel deploys
  - Rationale: `vercel build` (local) has `NEXT_MISSING_LAMBDA` bug with `@vercel/next` builder + Next.js 14.2.29
  - Trade-off: Slower deploy (must upload to Vercel first), but reliable
  - Status: ✅ Applied in CI/CD workflows and deploy scripts

### Key Numbers

- **Admin**: 31/31 routes live on Vercel
- **Backend**: 24 NestJS modules, 30+ event types, 7 agents
- **Mobile**: 23 Expo Router screens, 5 bottom tabs, EAS project live
- **Contracts**: 8 Solidity contracts, 41 Hardhat tests passing
- **E2E**: 48 Playwright tests, 8 workflow screenshot modules
- **Docs**: 35+ markdown files across 8 doc categories
- **Scripts**: 12+ PowerShell scripts, 2 bash scripts
- **Workflows**: 3 CI/CD workflows (admin-deploy, backend-deploy, mobile)

## Previous Sessions

### Session 4 (Backend Stability + E2E Full Pass)
- Fixed backend `main.ts`: unhandledRejection, uncaughtException handlers
- Created `scripts/start-backend.ps1` — robust startup with port cleanup, health check
- Fixed 3 flaky E2E tests (admin, invites — waitUntil, toBeVisible)
- 48/48 E2E tests passing against live backend with real seeded data
- Verified all admin APIs return real data (dashboard, marketplace, features, weather, analytics)

### Session 3 (E2E Testing + Config Fixes)
- Fixed MCP configs, created module-by-module E2E runner (8 modules)
- Created `.opencode/skills/e2e-testing.md`
- Installed Playwright CLI 1.60.0 + MCP 0.0.75
- 28 E2E screenshots across 8 modules, HTML gallery generated
- Contracts: 41/41 Hardhat tests passing

### Session 2 (Dev Infrastructure + Docs)
- `.opencode/` with 5 agent profiles, plan templates, MCP config, RULES.md
- 8 PowerShell scripts for Docker, DB, health check
- 10 Mermaid sequence diagrams, FAQ, troubleshooting guide

### Session 1 (Initial Build)
- 334 files across 8 components, 7 agents, 30+ event types
- 22 NestJS modules, 16 React Native screens, 8 Solidity contracts
- Prisma schema (20+ models), E2E Playwright screenshot system

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

1. Deploy backend to Railway (blocks full admin functionality)
2. Set NEXT_PUBLIC_API_URL on Vercel (depends on Railway deploy)
3. Deploy AI service to Railway
4. Check EAS build status and download APK
5. Run full E2E workflows against live Vercel deployment
6. Re-enable Sentry source map uploads in CI
7. Write backend Jest unit tests for critical services

## File Map

```
.github/workflows/
  admin-deploy.yml       # Vercel admin deploy (cloud build + verify)
  backend-deploy.yml     # Railway backend deploy (migrate + deploy)
  mobile.yml             # EAS Build for mobile
  admin.yml              # Old: lint + build only (superseded by admin-deploy.yml)
  backend.yml            # Old: lint + test + build only (superseded by backend-deploy.yml)
  contracts.yml          # Hardhat compile + test

packages/
  admin/                 # Next.js 14 admin dashboard (Vercel)
    src/
      app/               # 31 routes
      components/
        Sidebar.tsx      # Has Swagger API Docs link
      instrumentation.ts # Sentry v10+ runtime init
    sentry.client.config.ts
    sentry.server.config.ts
    sentry.edge.config.ts
  backend/               # NestJS API (Railway)
    src/modules/         # 24 modules with Swagger decorators
      gamification/      # XP, levels, mastery, collections, hybrids, achievements
    prisma/              # Schema with 30+ models
  mobile/                # Expo SDK 51 (EAS Build)
      app.config.js        # Dynamic config with env vars
    eas.json             # Build profiles: dev/preview/production
    .eas/workflows/      # 3 EAS workflows (build, dev-build, ota-update)
    app/                 # Expo Router (23 screens, 5 tabs)

contracts/               # 8 Solidity contracts (Hardhat)
  contracts/
    tokens/              # GreenCreditToken, EcoPointToken, ReputationToken, InviteToken
    marketplace/         # Marketplace, Escrow
    reputation/          # ReputationManager, RewardDistributor

scripts/
  verify-deployment.sh   # Admin + backend + cross-service checks (bash)
  verify-deployment.ps1  # Same for PowerShell

docs/
  architecture/
    gamification-flow.md # NEW: Complete gamification guide + EAS publishing
  deployment/
    production-deployment.md # Full production deployment guide
  improvements/
    lessons-learned.md   # Session 5 entries added
  api/
    README.md            # Updated with gamification endpoints
```
