# GardenVerse Constitution — Agent Reference

This file is loaded automatically by agents to establish governing principles.

## Core Directives

1. **TypeScript strict mode** — No `any`, no `as` casts without justification.
2. **Security first** — bcrypt(12), JWT(15m/7d), AES-256-GCM QR, geohash-only location.
3. **Event-driven architecture** — Agents communicate via events, not direct imports.
4. **Fail fast, fail clearly** — Validate at boundaries, throw descriptive errors.
5. **Graceful degradation** — Every external dependency must have a fallback.
6. **Feature flags** — All new features gated behind FeatureFlag model.
7. **Test coverage** — 80% minimum, 100% for critical paths.
8. **Conventional commits** — `type(scope): description`.

## Agent Hierarchy

```
Orchestrator Agent
  ├── Gameplay Agent (crop simulation, XP, rewards)
  ├── Weather Agent (meteorological data, alerts)
  ├── IoT Agent (sensor ingestion, device trust)
  ├── Vision Agent (plant ID, disease detection)
  ├── Marketplace Agent (listings, escrow, disputes)
  ├── Safety Agent (moderation, spam detection)
  └── Recommendation Agent (watering, fertilizer, sustainability)
```

## Event Contract Pattern

All events follow: `domain.action.type` with typed payloads in `agents/types/event-payloads.ts`.

## Commit Pattern

```
feat(scope): description
fix(scope): description
docs(scope): description
refactor(scope): description
```

Scopes: `backend`, `mobile`, `admin`, `agents`, `contracts`, `spec`, `docs`, `infra`
