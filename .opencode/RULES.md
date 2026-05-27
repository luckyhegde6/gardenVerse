# GardenVerse — Agentic Development Rules

> **CRITICAL**: These rules govern ALL development activities. Violations must be self-corrected immediately.

## Git Branch Workflow

> **MANDATORY**: ALL work MUST happen on a feature branch. Never work on main directly.

**Mandatory Workflow:**
1. Always start from `git checkout main && git pull origin main`
2. Create feature branch: `git checkout -b feature/<name>` or `git checkout -b fix/<name>`
3. All implementation and testing on the feature branch ONLY
4. Verify ALL typechecks and tests pass before asking for approval
5. **Always ask user explicitly** for commit + push approval — NEVER auto-commit or auto-push
6. Resolve conflicts against latest main before push
7. If user rejects: keep files staged, do NOT unstage

## Commit & Push Safety

> **NEVER commit or push without explicit user approval.** This is the highest-priority rule.

**Mandatory Pre-Commit Checklist:**
1. All typechecks must pass: `npm run typecheck`
2. All tests must pass: `npm run test`
3. No secrets, tokens, passwords, or API keys in code or commits
4. No debug files, temp files, or IDE artifacts staged
5. Commit message follows conventional format: `type(scope): description`
6. Changes reviewed by user before commit

**Workflow:**
1. Make all changes on the feature branch and `git add` them
2. Run `git status` and `git diff --staged` to show user what will be committed
3. **Ask user for approval** before running `git commit`
4. If user rejects: keep files staged, do NOT unstage
5. If user approves: commit with descriptive message
6. **Ask user again** before running `git push`
7. Only push after explicit user confirmation

**Exception:** User says "commit and push" or "go ahead" — then proceed with both.

## Secret Handling

**NEVER log or expose:**
- Passwords, API keys, tokens, secrets, JWT tokens
- Database connection strings with credentials
- Encryption keys, private keys
- Personal identifiable information (PII)

**Rules:**
- Log only usernames (not passwords) on auth events
- Log only file paths (not file contents)
- Use environment variables for secrets
- If a secret accidentally appears in a commit: warn user immediately, suggest `git revert`

## TypeScript Strict Mode

- TypeScript strict mode is MANDATORY across all packages
- No `any` types — use `unknown` with type guards
- Use `as const` for literal types where appropriate
- All function return types must be explicitly annotated
- All API endpoints must have validated DTOs (class-validator)
- Run `npm run typecheck` before any commit

## Architecture Rules

### Module Independence
- Backend modules should NOT import from other modules directly
- Use events for cross-module communication (BullMQ queues)
- Common utilities go in `src/common/`
- Config is read from `ConfigService`, never `process.env` directly

### Database
- Prisma ORM only — NO raw SQL queries
- All queries must use Prisma transactions for atomicity
- Always define indexes for frequently queried fields
- Pagination required for all list endpoints

### Security
- All passwords hashed with bcrypt (12 rounds minimum)
- JWT tokens: 15m access token, 7d refresh token
- QR payloads MUST be encrypted + signed with expiration
- Rate limiting on ALL public endpoints
- Upload validation (file type, size)
- Geolocation: store geohash only, never exact coordinates
- Helmet + CORS configured for production

## Naming Conventions

| Element | Convention | Example |
|---------|-----------|---------|
| Files | `kebab-case.ts` | `crop-service.ts` |
| Classes | `PascalCase` | `CropService` |
| Functions | `camelCase` | `getCropById()` |
| Variables | `camelCase` | `cropList` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_RETRY_COUNT` |
| DB Models | `PascalCase` | `PlantSpecies` |
| DB Fields | `camelCase` | `growingDays` |
| API Routes | `kebab-case` | `/api/v1/plant-species` |
| Events | `domain.action.type` | `garden.crop.planted` |

## Testing Requirements

- Backend: Jest unit tests for all services
- E2E: Playwright tests for critical user flows
- Screenshots: Chromium at 1440×900
- All E2E tests must be independent (separate browser contexts)

## Commit Convention

```
type(scope): description

Types: feat, fix, chore, docs, style, refactor, test, perf
Scopes: backend, mobile, admin, ai, iot, contracts, docs, infra

Examples:
- feat(backend): add crop growth simulation engine
- fix(mobile): handle empty garden state gracefully
- docs(api): add WebSocket event documentation
```

## Pre-Deployment Checklist

- [ ] All typechecks passing (`npm run typecheck`)
- [ ] All tests passing (`npm run test`)
- [ ] E2E tests passing (`npm run test:e2e`)
- [ ] Build succeeds (backend + admin)
- [ ] Security checklist complete (see AGENTS.md)
- [ ] Health check passing
- [ ] No secrets in code or commits
- [ ] Migrations applied and tested
