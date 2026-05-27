# E2E Module-by-Module Testing

Run GardenVerse E2E workflows individually to capture screenshots and verify UX. Each module is self-contained and can be run independently.

## Prerequisites

1. Docker infrastructure running: `npm run docker:local`
2. Admin dashboard running: `npm run admin:dev`
3. Backend API running: `npm run backend:dev`

If services aren't running, screenshots will capture loading/error states.

## Available Modules

| Module | Description | Steps |
|--------|-------------|-------|
| `auth` | Authentication flow (login, register, protected routes) | 5 |
| `garden` | Garden management (overview, planting, plant browser, crop detail) | 4 |
| `admin` | Admin portal (dashboard, users, marketplace, invites, super admin) | 5 |
| `weather` | Weather dashboard (OpenWeatherMap integration) | 1 |
| `marketplace` | Marketplace (browse listings, create listing) | 2 |
| `community` | Community (hub, groups) | 2 |
| `ai-scanner` | AI Scanner (scan interface, scan history) | 2 |
| `invites` | Invite system (QR codes, invite creation) | 2 |

## Running a Single Module

```bash
# Run one module
npx ts-node e2e/modules/run-module.ts auth

# Run one module and generate HTML
npx ts-node e2e/modules/run-module.ts auth --html

# Run all modules
npx ts-node e2e/modules/run-module.ts all

# Run all modules and generate HTML
npx ts-node e2e/modules/run-module.ts all --html
```

## Output

- Screenshots: `e2e/screenshots/{module}/*.png`
- HTML gallery: `e2e/workflows-data/index.html`
- Per-workflow pages: `e2e/workflows-data/workflow-{n}.html`

## Playwright CLI Commands

```bash
# Run existing Playwright test specs
npx playwright test --config=e2e/playwright.config.ts

# Run with specific test filter
npx playwright test --config=e2e/playwright.config.ts --grep="auth"

# Generate code from recording
npx playwright codegen http://localhost:3000
```

## Subagent Orchestration

To run E2E testing via subagents from the primary agent:

1. Spawn a `testing` subagent for each module
2. Each subagent runs a single module: `npx ts-node e2e/modules/run-module.ts {module}`
3. Subagent reports back: module name, step count, duration, any failures
4. Primary agent aggregates results and generates HTML

Example subagent dispatch:
```
Task(description="E2E auth screenshots", subagent_type="testing")
"Run the auth workflow module: npx ts-node e2e/modules/run-module.ts auth. Report: steps completed, duration, any errors."
```

## Verification

After running modules, verify:
- All expected screenshots exist in `e2e/screenshots/`
- HTML gallery loads without broken image links
- Each workflow captures meaningful UI state (not blank/error pages)
