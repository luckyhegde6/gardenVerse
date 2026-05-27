# GardenVerse - Multi-Agent Engineering Guidelines

## Session Metadata
- **Project**: GardenVerse - Hybrid Agriculture Simulation Ecosystem
- **Session Started**: May 27, 2026
- **Architecture**: Modular Monolith (NestJS) → Future Microservices
- **Monorepo**: npm workspaces

## Engineering Standards

### Code Quality
- TypeScript strict mode everywhere
- No `any` types (use `unknown` + type guards)
- 100% typed interfaces for all DTOs, responses, events
- No `console.log` in production code (use structured logging)
- All API endpoints must have validation DTOs
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
  controller.ts    # REST endpoints
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
- Backend: Unit tests for all services, E2E for critical flows
- Mobile: Component tests with React Native Testing Library
- AI: Unit tests for recommendation logic (already created)
- Contracts: Hardhat tests (already created)

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

### Session Feedback & Improvements
<!-- This section updated each session -->
- **Session 1 (Initial Build)**: Ledger of 334 files created across 8 major components
- **Architecture Decisions**: Modular monolith with event-driven design for future microservices split
- **Observations**: Need to verify that all generated code compiles and passes lint
- **Next Steps**: Run lint/typecheck on backend, verify mobile app builds, test contract deployment
- **Session 2 (Dev Infrastructure + Docs)**: 
  - Created `.opencode/` with 5 agent profiles, plan templates, MCP config, and RULES.md
  - Created 8 PowerShell scripts (docker-local, docker-prod-debug, health-check, db-diagnostic, reset-db, run-migrations, stop-all, updated seed-data)
  - Created `.env.local.example` with documented API keys
  - Created 10 Mermaid sequence diagrams documenting all major workflows
  - Created support docs: FAQ and troubleshooting guide
  - Updated package.json with 7 new script commands
  - Updated AGENTS.md with new sections (scripts, diagnostic workflows, .opencode, sequence diagrams, support docs)
  - Updated MEMORY.md with session tracking and file map
- **Session 3 (E2E Testing + Config Fixes)**:
  - Fixed MCP configs (Docker → mcp/docker container, Superpowers plugin added)
  - Created module-by-module E2E test runner (`e2e/modules/run-module.ts`) — runs 8 workflows independently
  - Created `.opencode/skills/e2e-testing.md` skill document
  - Installed Superpowers plugin for agent orchestration
  - Installed Playwright CLI 1.60.0 + Playwright MCP 0.0.75
  - Admin dashboard deployed: 10/10 routes live
  - Smart contracts verified: 41/41 Hardhat tests passing
  - Captured 28 E2E workflow screenshots across 8 modules (auth, garden, admin, weather, marketplace, community, ai-scanner, invites)
  - Generated HTML gallery at `e2e/workflows-data/` with animated step viewer
  - Updated package.json with 10 new `e2e:*` module scripts
  - Updated AGENTS.md with E2E module commands and session tracking
  - Updated sequence diagrams with Admin UX flow (11 diagrams total)
  - Created `docs/architecture/flow-payloads.md` with sample API request/response payloads
  - Documented failure handling by layer, idempotency strategy, scalability & fault tolerance in overview.md
  - Gitignored contract build artifacts (artifacts/, cache/)

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
| **Sentry** | Sentry keys | Error monitoring | ✅ Configured |

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

## Vercel Deployment
```bash
npm run deploy:test     # Full deploy test: link → env pull → build → preview → health check → E2E tests
npm run deploy:preview  # Quick preview deploy
npm run deploy:prod     # Production deploy
```

The `scripts/vercel-deploy-test.ps1` script automates:
1. Project linking
2. Environment variable pull
3. Admin package build
4. Preview deployment
5. Health check against live URL
6. E2E test suite against deployment

### ⚠️ Redis on Vercel Limitation

Vercel's serverless functions do **not** support persistent TCP connections, so direct `ioredis` connections (used by `RedisModule`, BullMQ, and Socket.IO) will not work in a Vercel deployment. For production on Vercel:

- Use **Upstash Redis** (HTTP-based) or **Vercel KV** for caching, sessions, and rate limiting
- Run BullMQ and Socket.IO on a **separate long-running worker service** (e.g., Railway, Fly.io)
- Docker Redis remains the recommended setup for **local development**

See [`docs/deployment/deployment-guide.md`](./docs/deployment/deployment-guide.md) for the full Vercel deployment considerations and migration paths.

## GitHub Pages
Workflow documentation HTML pages are built for GitHub Pages publishing:
- `e2e/workflows-data/index.html` — Main demo portal
- `e2e/workflows-data/workflow-{0-7}.html` — Per-workflow animated galleries
- `playwright-report/recordings/` — Demo videos

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
For tools like Docker, Playwright, and PostgreSQL CLI, configure MCP in `.opencode/mcp.json`:
```json
{
  "mcpServers": {
    "docker": {
      "command": "docker"
    },
    "playwright": {
      "command": "npx",
      "args": ["@anthropic-ai/mcp-playwright"]
    },
    "github": {
      "command": "gh"
    },
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
