# GardenVerse - Multi-Agent Engineering Guidelines

## Session Metadata
- **Project**: GardenVerse - Hybrid Agriculture Simulation Ecosystem
- **Session Started**: May 27, 2026 (Active: Session 5 — Vercel Deploy + CI/CD + EAS + Gamification Docs)
- **Architecture**: Modular Monolith (NestJS) → Future Microservices
- **Monorepo**: npm workspaces
- **Platform**: Windows (PowerShell)

## Project Topology

```
Production:
  Vercel  ─── Admin Dashboard (Next.js 14) → https://gardenverse.vercel.app
  Railway ─── Backend API (NestJS)          → https://gardenverse-backend.railway.app
  Railway ─── AI Service (FastAPI)          → https://gardenverse-ai.railway.app
  Railway ─── MQTT Broker (Mosquitto)       → (single stateful)
  Supabase ── PostgreSQL 16 + Auth + Storage → Managed
  Upstash ─── Redis (HTTP-based cache/queue) → Serverless
  Expo/EAS ── Mobile App (React Native)     → EAS Build → App Store/Play Store

Local Dev:
  Docker ─── PostgreSQL (5432) + Redis (6379) + MQTT (1883)
  Local ──── Backend (:3001) + Admin (:3000) + Mobile (Expo) + AI (:8000)
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

### Session 5 (May 31 - Jun 1, 2026): Vercel Deploy + CI/CD + EAS + Gamification Docs
**Focus**: Production deployment, CI/CD automation, mobile publishing, comprehensive documentation

**Accomplishments:**
- **Admin dashboard deployed to Vercel** at https://gardenverse.vercel.app — 31/31 routes live
- **CI/CD workflows created**: admin-deploy.yml (cloud build + post-deploy verification) and backend-deploy.yml (Railway deploy)
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
- **test**: lint + typecheck + Jest with Postgres/Redis containers
- **db-migrate** (main): prisma migrate deploy + validate
- **deploy** (main): Railway deploy with health check wait loop

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
- Run BullMQ and Socket.IO on **Railway/Fly.io** as a separate long-running worker
- Docker Redis remains for **local development**

## Available Commands
```bash
# Development
npm run backend:dev      # Start NestJS backend (port 3001)
npm run mobile:dev       # Start Expo mobile app
npm run admin:dev        # Start Next.js admin dashboard (port 3000)
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
npm run backend:dev    # New terminal
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
