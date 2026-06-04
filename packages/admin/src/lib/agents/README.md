# Agent System Migration

## Overview

The GardenVerse agent system has been migrated from NestJS EventEmitter-based agents to direct execution in Next.js API routes + Vercel Cron Jobs.

## Previously (NestJS Backend)

- 7 agents under `packages/backend/src/agents/`
- Used `AgentOrchestratorService` with internal EventEmitter
- Agents subscribed to events via decorators
- Cron schedules handled by `@nestjs/schedule` @Cron decorators
- BullMQ configured but no processors defined

## Now (Next.js Admin)

### Event Routing
- `/api/v1/agents/callback` — POST endpoint replaces the EventEmitter
- API routes that trigger events (plant, water, fertilize, harvest) call the callback directly
- Event handlers update XP, streaks, collections inline

### Scheduled Tasks
- `packages/admin/src/lib/cron.ts` — Task registry with `shouldRun()` utility
- `/api/v1/cron/growth-tick` — Vercel Cron Job (every 4h): advances all virtual garden crops
- `/api/v1/cron/weather-sync` — Vercel Cron Job (every 6h): syncs weather for all regions
- Configure in `vercel.json`:
  ```json
  { "crons": [
    { "path": "/api/v1/cron/growth-tick", "schedule": "0 */4 * * *" },
    { "path": "/api/v1/cron/weather-sync", "schedule": "0 */6 * * *" }
  ]}
  ```

### Queue System
- `packages/admin/src/lib/queue.ts` — In-process queue wrapper
- Replaces BullMQ for development
- For production with Upstash Redis: `packages/admin/src/lib/queue-upstash.ts` (future)

### WebSocket
- `packages/admin/src/lib/websocket.ts` — SSE helper for browser push
- Socket.IO runs on separate worker for production (not in Vercel serverless)
- Uses in-process pub/sub for development

## Agent Mapping

| Agent | Old (NestJS) | New (Next.js) |
|-------|-------------|---------------|
| GameplayAgent | EventEmitter subscription + cron every 4h | Inline in API routes + /api/v1/cron/growth-tick |
| WeatherAgent | EventEmitter + cron every 6h | /api/v1/cron/weather-sync |
| IoTAgent | EventEmitter + cron every 30min | Inline in /api/v1/iot/[id]/readings |
| VisionAgent | EventEmitter subscription | Inline in /api/v1/ai + agents/callback |
| MarketplaceAgent | EventEmitter subscription | Inline in /api/v1/marketplace/* |
| SafetyAgent | EventEmitter + cron every 30min | Inline in /api/v1/moderation/reports |
| RecommendationAgent | EventEmitter subscription | Inline in /api/v1/ai/recommendations/* |
