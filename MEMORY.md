# GardenVerse — Session Memory

> Persistent context across sessions. Updated continuously.

## Current Session

**Date**: May 27, 2026
**Session ID**: ses-002
**Focus**: Agent-driven development infrastructure + E2E demo system + Production debugging tools

### Active Context

- **Phase 1 (Initial Build - Session 1)**: Created 334 files across 8 major components. Agent-based architecture with 7 specialized agents + orchestrator. Event-driven communication via EventEmitter (future: BullMQ extraction).
- **Phase 2 (API Integrations - Session 1)**: Replaced all simulated/mocked data with real APIs:
  - OpenWeatherMap for weather, Google Maps for geospatial, OpenFarm/Trefle for plants
  - Prisma schema with PlantSpecies, CropVariety, GardenPlan models
  - VisionAgent now calls Python AI service, falls back to mock
  - UploadModule with file validation, PlantsModule with search/cron sync
- **Phase 3 (E2E Demo System - Session 1)**: Automated demo generation with Playwright:
  - 8 workflow screenshot capture, 7 screen recordings
  - HTML animated pages with keyboard nav, auto-play
  - Vercel deploy test pipeline
- **Phase 4 (Dev Infrastructure - This Session)**: Agent-driven development setup:
  - `.opencode/` directory with config, MCP, 5 agent profiles, plan templates
  - 8 PowerShell scripts: docker-local, docker-prod-debug, health-check, db-diagnostic, reset-db, run-migrations, stop-all
  - `.env.local.example` for local dev with clear API key documentation
  - Sequence diagrams (10 Mermaid diagrams documenting all major workflows)
  - Support docs: FAQ, troubleshooting guide
  - `.opencode/RULES.md` with mandatory agentic development rules
  - `package.json` updated with 7 new script commands

### Open Questions

- Need to run full E2E demo generation (backend re-started)
- IoT simulator needs actual MQTT broker for testing
- Prisma migration status: 1 migration applied (`20260527003948_init`)

### Active Specs

- None currently in flight

### Recent Decisions

- ADR-001: Adopted EventEmitter2 pattern for in-process agent communication
  - Rationale: Simplest path for monolith, BullMQ queues ready for future extraction
  - Trade-off: In-process events don't survive process restart
- ADR-002: Each agent has independent scaling config in AGENT_CONFIGS
  - Rationale: Enables per-service scaling when extracting to microservices
- ADR-003: `.opencode/` structure mirrors homeGallery reference architecture
  - Rationale: Proven pattern for multi-agent development with MCP tooling
  - Decision: agents/ for subagent profiles, plans/ for templates, opencode.json for config

### Key Numbers

- 370+ total source files
- 7 specialized agents implemented
- 30+ event types defined
- 50+ typed event payloads
- 22 NestJS backend modules
- 16 React Native screens
- 8 Solidity smart contracts
- 8 new PowerShell scripts this session
- 10 sequence diagrams created
- 5 agent subagent profiles (.opencode/agents/)

## Previous Sessions

### Session 1 (May 27, 2026)
- **Focus**: Initial build + API integrations + E2E demo system
- **Files**: 334 files created across 8 major components
- **APIs**: OpenWeatherMap, Google Maps, OpenFarm/Trefle integrated
- **Agents**: 7 specialized agents (Gameplay, Weather, IoT, Vision, Marketplace, Safety, Recommendation)
- **Prisma**: Full schema with 20+ models including PlantSpecies, GardenPlan, CropVariety
- **E2E**: Playwright screenshot system for 8 workflows + 7 recordings
- **Deploy**: Vercel deploy test pipeline

## Agent Status

| Agent | Status | Events Processed | Errors |
|-------|--------|-----------------|--------|
| AgentOrchestrator | LISTENING | - | - |
| GameplayAgent | LISTENING | 0 | 0 |
| WeatherAgent | LISTENING | 0 | 0 |
| IotAgent | LISTENING | 0 | 0 |
| VisionAgent | LISTENING | 0 | 0 |
| MarketplaceAgent | LISTENING | 0 | 0 |
| SafetyAgent | LISTENING | 0 | 0 |
| RecommendationAgent | LISTENING | 0 | 0 |

## Next Actions

1. Restart backend and run E2E demo screenshots/recordings
2. Verify TypeScript compilation of agent framework
3. Run E2E tests against backend with Playwright
4. Start IoT simulator for sensor integration testing
5. Write integration tests for agent event flows
6. Deploy smart contracts to testnet

## File Map

```
.opencode/
  opencode.json              # Main opencode config with 5 agent profiles
  mcp.json                   # MCP servers (Docker, Playwright, GitHub, Postgres, Git)
  RULES.md                   # Agentic development rules (mandatory)
  agents/
    backend-dev.md           # NestJS backend subagent profile
    mobile-dev.md            # React Native mobile subagent profile
    admin-dev.md             # Next.js admin subagent profile
    testing.md               # Playwright/Jest testing subagent profile
    devops.md                # Docker/CI/CD devops subagent profile
  plans/
    feature-template.md      # Feature implementation plan template
    fix-template.md          # Bug fix plan template
    release-template.md      # Release checklist template

scripts/
  docker-local.ps1           # Start local dev (Docker + optional apps)
  docker-prod-debug.ps1      # Run locally with Supabase production DB
  health-check.ps1           # Full service health check
  db-diagnostic.ps1          # Database inspection + repair
  reset-db.ps1               # Drop + recreate + seed database
  run-migrations.ps1         # Apply Prisma migrations
  stop-all.ps1               # Stop Docker + Node apps
  vercel-deploy-test.ps1     # Full Vercel deploy pipeline (existing)
  seed-data.js               # Database seed data

docs/
  architecture/
    sequence-diagrams.md     # 10 Mermaid diagrams for all workflows
  support/
    faq.md                   # Frequently asked questions
    troubleshooting.md       # Common issues and solutions
```
