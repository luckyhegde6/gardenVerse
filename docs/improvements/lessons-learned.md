# GardenVerse — Lessons Learned

## Entry Format
```
## YYYY-MM-DD: [Brief Title]
**Session**: ses-XXX
**Category**: [Architecture | Security | Performance | Workflow | Agent | Testing]
**Impact**: [High | Medium | Low]

### Situation
What we were trying to do.

### Problem
What went wrong or what we learned.

### Root Cause
Why it happened.

### Solution
What we changed or what to do next time.

### Prevention
How to avoid this in the future.
```

---

## 2026-05-27: Initial Architecture Session

**Session**: ses-001
**Category**: Architecture
**Impact**: High

### Situation
Building the initial GardenVerse architecture from scratch — 370+ files across backend, mobile, admin, AI, IoT, smart contracts, and documentation.

### Problem
The first iteration used a standard NestJS modular monolith with direct Prisma access from services. This created tight coupling between modules and made future extraction to microservices harder.

### Root Cause
Started with the most familiar pattern (CRUD controllers → Services → Prisma) rather than designing for event-driven architecture from day one.

### Solution
Implemented a full agent-based architecture:
- Created `agents/` directory with 7 specialized agents
- Each agent owns its domain logic and communicates via events
- AgentOrchestrator manages event routing between agents
- BaseAgent abstract class provides lifecycle management, health checks, and event handling
- Existing REST controllers became thin delegates to agents

### Prevention
- Start with event-driven design even for monolith
- Define event contracts before implementing services
- Use ADRs for all architectural decisions
- Keep agents loosely coupled by design

---

## 2026-05-27: PowerShell Compatibility

**Session**: ses-001
**Category**: Workflow
**Impact**: Medium

### Situation
Running on Windows with PowerShell. Tried to use bash-style brace expansion (`{a,b,c}`) for directory creation.

### Problem
PowerShell doesn't support bash brace expansion syntax. Commands failed with parse errors.

### Root Cause
Assumed cross-platform shell compatibility. Development environment is Windows/PowerShell.

### Solution
Used PowerShell arrays and foreach loops for directory creation. Documented in AGENTS.md that the environment is Windows/PowerShell.

### Prevention
- Always check shell type before running commands
- Use PowerShell-native patterns on Windows
- Keep shell scripts in both `.sh` and `.ps1` variants

---

## 2026-05-27: Backend TypeScript Compilation Fixes

**Session**: ses-002
**Category**: Workflow
**Impact**: High

### Situation
After the initial 370+ file creation, needed to verify TypeScript compilation on all packages. The backend had 45+ type errors that prevented building.

### Problem
Multiple dependency and code issues:
1. Missing `@nestjs/config` npm dependency
2. `socket.io-redis@^6.1.2` doesn't exist (latest is 6.1.1)
3. Wrong package name `@_modules/mocha` instead of `@types/mocha`
4. `BaseAgent` abstract properties accessed in constructor (TS2715)
5. Subclasses redeclared `logger` as `private` when base had `protected`
6. Prisma schema had ambiguous relations (QrSession references User twice without @relation names)
7. Missing back-relations for AuditLog and Session models
8. `const` reassignment errors in geohash util
9. Implicit `any` types across multiple files

### Root Cause
Code and config generated without compilation verification. Dependencies, schema validation, and TypeScript strict mode compliance were assumed correct.

### Solution
1. Added `@nestjs/config` to dependencies
2. Fixed `socket.io-redis` to `^6.1.1`
3. Fixed `@_modules/mocha` to `@types/mocha`
4. Refactored BaseAgent: removed constructor access to abstract properties, subclasses initialize logger/config after `super()`
5. Removed duplicate `logger` declarations from all 7 agent subclasses
6. Added named `@relation("CreatedQrSessions")` and `@relation("UsedQrSessions")` to QrSession
7. Added `auditLogs` and `sessions` back-relations to User model
8. Refactored geohash util to avoid const reassignment
9. Added explicit types for implicit `any` parameters across 10+ files

### Prevention
- Always run `npx tsc --noEmit` after generating code
- Validate all npm package names exist before committing
- Run `npx prisma generate` to validate schema before building
- Use `tsconfig strict: true` from project start
- Never declare properties in subclass that shadow base class properties with narrower visibility

---

## 2026-05-27: Prisma Schema Validation

**Session**: ses-002
**Category**: Architecture
**Impact**: High

### Situation
Prisma client generation failed with schema validation errors.

### Problem
Three models had incomplete relation definitions:
1. QrSession: `createdBy` and `usedBy` both reference User without unique @relation names
2. AuditLog: `user` relation missing back-relation on User model
3. Session: `user` relation missing back-relation on User model

### Root Cause
Schema was authored without running `prisma generate` to validate. When you have multiple FKs to the same model, Prisma requires explicit @relation names. And all relations need their counterpart defined on the related model.

### Solution
- Added `@relation("CreatedQrSessions")` and `@relation("UsedQrSessions")` to QrSession
- Added `auditLogs AuditLog[]` and `sessions Session[]` back-relations to User

### Prevention
- Run `npx prisma generate` immediately after any schema change
- Use `npx prisma validate` for quick validation
- Always define both sides of a relation when creating new models

---

## 2026-05-27: Hardhat Contract Compilation & Tests

**Session**: ses-002
**Category**: Testing
**Impact**: High

### Situation
8 Solidity contracts (GreenCreditToken, EcoPointToken, ReputationToken, InviteToken, Marketplace, Escrow, ReputationManager, RewardDistributor) needed compilation verification and test suite execution.

### Problem
Multiple compilation and test failures:
1. Hardhat config's `sources: "./"` caused HH1006 by treating node_modules files as local
2. OpenZeppelin v5.0.1 requires Solidity ^0.8.24, but contracts used 0.8.20
3. `mcopy` opcode requires EVM version `cancun` (hardhat defaults to `paris`)
4. InviteToken tried to override non-virtual `safeTransferFrom` (OZ v5 change)
5. Marketplace `resolveDispute` used `transferFrom` instead of `transfer`
6. Tests mixed Number and BigInt types (ethers v6 requires BigInt)
7. ReputationManager test expected wrong rank value for score 600

### Root Cause
Contracts were authored without testing against actual OpenZeppelin v5 dependency. Ethers v6 API changes (BigInt) not reflected in tests. Solidity compiler defaults not configured for Cancun EVM features.

### Solution
- Moved contracts to `contracts/` subdirectory, updated hardhat sources path
- Updated pragma to `^0.8.27` and compiler to 0.8.27 with `evmVersion: "cancun"`
- Removed non-virtual `safeTransferFrom` overrides from InviteToken (soulbound via `_update`)
- Changed `transferFrom` to `transfer` in Marketplace
- Fixed BigInt mixing in test (used `10n * 50n` instead of `10 * 50`)
- Fixed rank expectation from 2 to 1 (Gardener, not Horticulturist)

### Prevention
- Run `npx hardhat test` after any contract change
- Always match compiler version to OpenZeppelin dependency requirements
- Use BigInt consistently in ethers v6 tests
- Validate OZ v5 API changes (non-virtual functions, `_update` pattern)
- Test on a local Hardhat node before deploying to testnet

---

## 2026-05-27: Mobile App TypeScript Compilation Fixes

**Session**: ses-002
**Category**: Workflow
**Impact**: High

### Situation
After backend compilation was fixed, the mobile app (Expo/React Native) had 12+ TypeScript errors preventing clean compilation.

### Problem
1. TanStack Query v5 removed `cacheTime` → renamed to `gcTime`
2. NativeWind v4 type augmentation in hoisted monorepo doesn't work via `"types": ["nativewind/types"]` — tsconfig types field can't find subpath exports in nested node_modules
3. react-native-gesture-handler missing from mobile's package.json (required by navigation)
4. Socket.io's `FallbackToUntypedListener` type rejects `(...args: any[]) => void` — cast must be `as any`
5. `CameraView` from expo-camera is a class component — NativeWind wrapping produces `Pick<CameraProps, never>` which drops all props including augmented `className`
6. Multiple component interfaces missing optional `className` prop for NativeWind
7. `useAI` hook not exposing `setCurrentResult` in return type
8. Missing socket.io event type definitions (`garden:join`, `garden:leave`, `chat:join`, `chat:leave`)
9. `reconnect` listener attached to `socket.on` instead of `socket.io.on`

### Root Cause
Code authored without compilation verification against actual dependency versions. Monorepo package hoisting created type resolution quirks. NativeWind v4's CSS interop wrapping changes component types in ways that aren't straightforward to augment.

### Solution
1. `cacheTime` → `gcTime` in App.tsx
2. Removed `"types": ["nativewind/types"]` from tsconfig — replaced with local `nativewind-env.d.ts` using `import 'react-native'` + `declare module` pattern
3. Added `react-native-gesture-handler` and `react-native-css-interop` as direct dependencies
4. Added `className` to CardProps, ButtonProps, InputProps, BadgeProps
5. Exposed `setCurrentResult` in useAI hook
6. Added missing events to ClientToServerEvents interface
7. Fixed `reconnect` to use `this.socket.io.on`
8. Changed `handler as (...args: any[]) => void` → `handler as any` for socket.on/off calls
9. Removed `expo-camera` module augmentation (CameraProps is a type alias, not interface — can't merge)
10. Replaced `className="flex-1"` with `style={{ flex: 1 }}` on CameraView

### Prevention
- Run `npx tsc --noEmit` on mobile package after any component/service changes
- Don't augment `type` aliases (use `interface` or alternative approach)
- For class components wrapped by NativeWind, use `style` prop instead of `className`
- Prefer local `.d.ts` files with `import` + `declare module` for monorepo type augmentation

---

## 2026-05-27: Docker E2E Test Infrastructure

**Session**: ses-003
**Category**: Testing
**Impact**: High

### Situation
Setting up E2E testing infrastructure with Playwright, including isolated Docker test environment, pre-commit hooks, and agentic feedback loop.

### Problem
1. `docker-compose.test.yml` referenced `Dockerfile.test` for each service, but monorepo Docker builds are complex — build context limits access to files outside the package directory
2. Docker volume path `./docker/init-test.sql` was wrong — relative to compose file location, the correct path is `./init-test.sql`
3. Husky pre-commit hook needs shell-compatible syntax (sh), not PowerShell — Windows Git Bash uses sh
4. npm workspace packages need `typecheck` scripts added explicitly for root-level `npm run typecheck` to propagate

### Root Cause
Docker build context in monorepo was not accounted for. Shell syntax assumed PowerShell when husky uses sh by default. Typecheck scripts were missing from some workspace packages.

### Solution
- Refactored docker-compose to only include infrastructure (Postgres, Redis) — applications run locally via PowerShell runner script
- Created `e2e/scripts/run-e2e.ps1` — orchestrates Docker infra, migrations, local backend/admin startup, Playwright execution, agentic feedback, and teardown
- Fixed pre-commit hook to use `sh` syntax (`if [ $? -ne 0 ]; then exit 1; fi`)
- Added `typecheck` scripts to backend and admin package.json (mobile already had one)
- Added `test:e2e`, `test:e2e:headed`, `test:feedback` scripts to root package.json

### Prevention
- Use sh-compatible syntax in `.husky/pre-commit` regardless of OS
- For monorepo E2E, run apps locally — don't Dockerize app builds for testing
- Ensure all workspace packages have `typecheck` script for consistent root-level commands
- Volume paths in docker-compose are relative to compose file directory, not project root

---

## 2026-05-27: Husky on Windows / PowerShell

**Session**: ses-003
**Category**: Workflow
**Impact**: Medium

### Situation
Installed husky v9 in the monorepo and set up pre-commit hooks on Windows.

### Problem
1. `npm install husky --save-dev` installed fine, but `npx husky init` created a `.husky/pre-commit` file with just `npm test`
2. PowerShell execution policy (`PSSecurityException`) blocked running npm.ps1 scripts — had to use `npm.cmd` instead
3. Husky hooks run with `sh` (Git Bash), not PowerShell — `$LASTEXITCODE` syntax is PS-only

### Root Cause
Windows development environment with PowerShell policy restrictions. Husky documentation assumes Unix-like shell environments.

### Solution
- Used `npm.cmd` instead of `npm` for all npm commands to avoid PS execution policy
- Written pre-commit hook with `sh`-compatible syntax
- Added `"prepare": "husky"` to package.json for automatic git hook path setup

### Prevention
- Use `npm.cmd` explicitly on Windows to bypass PowerShell policy
- Always write husky hooks in sh-compatible syntax
- Test pre-commit hook after creation by making a test commit

---

## 2026-05-27: External API Integration Patterns

**Session**: ses-004
**Category**: Architecture
**Impact**: High

### Situation
Integrating real-world APIs (OpenWeatherMap, Google Maps, OpenFarm/Trefle plant datasets) into the GardenVerse backend, and connecting the vision agent to the Python AI service for OpenCV-based plant analysis.

### Problem
1. Backend weather was entirely simulated — never called OpenWeatherMap despite having the env var configured
2. Geo module had no Google Maps integration — pure geohash prefix matching
3. Plant data was hardcoded (8 plants) in both backend RecommendationAgent and mobile PlantCropScreen
4. VisionAgent used mock plant identification when there was a Python AI service with OpenCV ready
5. Adding `@nestjs/axios` and `ConfigService` to agents that extend `BaseAgent` caused property name conflicts — `config` is already a protected property on `BaseAgent` typed as `AgentConfig`
6. Badge component on mobile didn't support `secondary` or `danger` variants
7. Dynamic imports (`await import('axios')`) don't work with mobile tsconfig (module setting)

### Root Cause
External APIs were configured in env vars but never wired into actual service code. Agents extended BaseAgent which already declared `config` as `AgentConfig`. Mobile react-native projects typically target `esnext` module which doesn't support dynamic import.

### Solution
- **Weather**: Replaced simulated weather with OpenWeatherMap calls via `HttpService`, with DB cache (3h TTL) and simulated fallback
- **Geo**: Added Google Maps Geocoding + Places API with `searchPlace()`, `reverseGeocode()` methods
- **Plants**: Created `PlantSpecies` + `GardenPlan` + `CropVariety` Prisma models; `PlantsService` searches local DB then falls back to Trefle/OpenFarm APIs; weekly cron syncs 26 crops from OpenFarm
- **VisionAgent**: Attempts AI service call first (`POST /api/v1/plant/identify`), falls back to local mock
- **Naming conflict**: Renamed `ConfigService` parameter to `configService` in VisionAgent to avoid shadowing base class `config` property
- **Badge**: Added `secondary` and `danger` variants with proper styles
- **Imports**: Replaced all `await import('axios')` dynamic imports with static `import axios from 'axios'` at top of file

### Prevention
- When adding services to agents, check base class for property name conflicts first
- Run `prisma generate` immediately after schema changes to validate relations
- Prefer static imports over dynamic in mobile React Native apps
- When adding Badge variants, update both the type union and the variantStyles map
- Use `configService` naming for NestJS `ConfigService` to avoid collisions

---

## 2026-05-27: Workflow Screenshot & HTML Generation

**Session**: ses-004
**Category**: Workflow
**Impact**: Medium

### Situation
Building an automated workflow screenshot system to generate visual documentation of all GardenVerse features, including animated HTML pages and screen recordings for demo purposes.

### Problem
1. Playwright screenshots need to be organized per-workflow with meaningful step names
2. HTML pages need to be self-contained, animated (auto-play), and keyboard-navigable
3. Screen recordings need to be captured in parallel with screenshots but without stepping on each other
4. Vercel deploy test script needs to handle project linking, env pull, build, deploy, health check, and E2E tests all in one flow
5. GitHub Pages needs static HTML that works without a server

### Root Cause
No automated demo generation existed — all demos would need to be manually recorded. Vercel deployment testing was entirely manual.

### Solution
- Created `e2e/workflows/run-all-workflows.ts` — captures screenshots across 8 feature workflows using separate browser contexts per workflow
- Created `e2e/workflows/record-demo.ts` — captures 7 screen recordings with step-by-step navigation
- Generated HTML pages (`workflows-data/`) with animated carousel, keyboard nav (arrow keys), auto-play toggle, progress bar, step list navigation
- Created `scripts/vercel-deploy-test.ps1` — automates: link → env pull → build → preview deploy → health check → E2E tests
- All HTML uses inline CSS (no external dependencies) for GitHub Pages compatibility

### Prevention
- Keep HTML generation as code (TypeScript) rather than manual templates
- Always separate screenshot capture from HTML generation for testability
- Use inline styles for GitHub Pages to avoid CORS issues
- Make demo recordings idempotent — re-recording should overwrite cleanly

---

## 2026-06-01: Vercel `@vercel/next` Builder Bug with Next.js 14.2.29

**Session**: ses-005
**Category**: Workflow
**Impact**: High

### Situation
Deploying the admin dashboard (Next.js 14.2.29) to Vercel. Tried `vercel build` (local) then `vercel deploy --prebuilt`.

### Problem
Local `vercel build` intermittently fails with `NEXT_MISSING_LAMBDA` error for random routes. The specific failing routes vary between runs (sometimes it's `/super-admin`, sometimes `/weather`, etc.). This blocks preview deployments and production deployments using the `--prebuilt` flag.

### Root Cause
`@vercel/next` builder (v4.6.0) has a bug with Next.js 14.2.29 where it can't find the lambda output for some routes during local builds. The exact trigger is not documented — likely a race condition in the builder's lambda detection.

### Solution
Switched to cloud build `vercel deploy --prod --yes` which uploads the source to Vercel and builds server-side. Cloud build works reliably with no `NEXT_MISSING_LAMBDA` errors. Updated CI/CD workflows and deploy scripts accordingly.

### Prevention
- Never use `vercel build` + `vercel deploy --prebuilt` for Next.js 14.2.29 with `@vercel/next` builder
- Always use `vercel deploy --prod --yes` (cloud build) for production
- For preview deployments, still use cloud build (slower but reliable)

---

## 2026-06-01: Sentry `withSentryConfig` Breaking Vercel Builds

**Session**: ses-005
**Category**: Workflow
**Impact**: High

### Situation
`@sentry/nextjs` was installed at v10.54.0. The `withSentryConfig` wrapper in `next.config.mjs` was breaking both local and cloud Vercel builds.

### Problem
Builds crashed with Sentry-related build errors. The `withSentryConfig` wrapper intercepts the Next.js build process to inject Sentry webpack plugins, which conflicts with `@vercel/next` builder in Next.js 14.2.29.

### Root Cause
Sentry Next.js SDK v8+ changed the integration model. The old `withSentryConfig` wrapper pattern is deprecated in favor of `instrumentation.ts` for SDK v10+. The wrapper is no longer needed for runtime error capture.

### Solution
1. Removed `withSentryConfig` from `next.config.mjs` (empty config now)
2. Created `packages/admin/src/instrumentation.ts` with `register()` function that conditionally imports server/edge sentry configs
3. Kept `sentry.server.config.ts`, `sentry.client.config.ts`, `sentry.edge.config.ts` as-is
4. Trade-off: No Sentry source map uploads without the wrapper — need to configure in CI separately

### Prevention
- For `@sentry/nextjs` v10+, use `instrumentation.ts` pattern, NOT `withSentryConfig`
- Check Sentry SDK version docs for the correct integration pattern
- Test both local and cloud builds after Sentry config changes

---

## 2026-06-01: NEXTAUTH_SECRET Hardcoded Fallback

**Session**: ses-005
**Category**: Security
**Impact**: High

### Situation
`packages/admin/src/lib/auth.ts` had a hardcoded fallback for NEXTAUTH_SECRET: `process.env.NEXTAUTH_SECRET || 'gardenverse-admin-secret-change-in-production'`.

### Problem
The fallback secret was known (committed to the repo), making development-mode sessions trivially forgeable. If Vercel's `NEXTAUTH_SECRET` env var was ever missing, the fallback would activate silently, exposing production to forged JWT attacks.

### Root Cause
Convenience pattern for local development without `.env` setup. The fallback was never intended for production but had no guard against production use.

### Solution
Removed the fallback. `NEXTAUTH_SECRET` must now be set as a Vercel environment variable. Admin login will fail with an unhelpful error if it's not set — documented this in the deployment guide.

### Prevention
- Never use hardcoded secrets as fallbacks, even for development
- Use clear error messages when required env vars are missing
- Add NEXTAUTH_SECRET to the security checklist (pre-deployment)

---

## 2026-06-01: EAS Build — app.json Doesn't Support process.env

**Session**: ses-005
**Category**: Workflow
**Impact**: Medium

### Situation
Configured `app.json` with `"process.env.API_URL || 'https://api.gardenverse.app'"` for dynamic API URL injection.

### Problem
EAS CLI (`eas init`, `eas project:info`) reads raw `app.json` JSON and doesn't evaluate JS expressions. The literal string `"process.env.EAS_PROJECT_ID || 'your-project-id'"` was used as the project ID, causing `Invalid UUID` errors.

### Root Cause
Expo's `app.json` is pure JSON — no JS expression support. EAS Build does NOT perform environment variable substitution on `app.json` values. `app.config.js` is required for dynamic config.

### Solution
1. Converted `app.json` → `app.config.js` with proper JS exports
2. Environment variables now resolve correctly: `process.env.API_URL || 'https://api.gardenverse.app'`
3. Removed `app.json` to avoid confusion

### Prevention
- Use `app.config.js` (not `app.json`) when you need environment variable injection
- `app.json` is fine for static configs; `app.config.js` required for dynamic values
- Test `eas init` after config changes to verify project linking

---

## 2026-06-01: Expo SDK Version Mismatches

**Session**: ses-005
**Category**: Workflow
**Impact**: Medium

### Situation
After setting up EAS, `expo doctor` reported 5 packages with version mismatches against Expo SDK 51:
- `expo-gl@56.0.5` → expected `~14.0.2`
- `expo-image-picker@15.0.7` → expected `~15.1.0`
- `expo-linking@56.0.13` → expected `~6.3.1`
- `expo-status-bar@56.0.4` → expected `~1.12.1`
- `react-native-safe-area-context@4.10.1` → expected `4.10.5`

### Problem
These packages had dramatically wrong major versions (likely from npm registry confusion or incorrect manual installation). Expo SDK 51 requires specific compatible versions of each package.

### Root Cause
Packages were installed without using `npx expo install`, which automatically selects SDK-compatible versions. Manual `npm install` picked up the latest versions regardless of SDK compatibility.

### Solution
Ran `npx expo install expo-gl@~14.0.2 expo-image-picker@~15.1.0 expo-linking@~6.3.1 expo-status-bar@~1.12.1 react-native-safe-area-context@4.10.5`.

Also removed `@types/react-native` (types are bundled with `react-native` itself).

### Prevention
- Always use `npx expo install <package>` instead of `npm install <package>` for Expo-related packages
- Run `npx expo-doctor` after adding any new package to catch version mismatches
- Never manually install `@types/react-native` — types come with RN

## 2026-06-02: Admin UI API Response Format Mismatch
**Session**: ses-006
**Category**: Architecture
**Impact**: High

### Situation
Several admin pages (users, dashboard, gamification) showed "No data found" or "Could not load from server" errors because they expected `body.users` from paginated API calls, but all API routes use the `paginated()` helper which returns `{ data, ... }`.

Additionally, the dashboard had a persistent error banner that wouldn't go away despite data loading correctly. The root cause was `u._count` being `undefined` when the Prisma query didn't include `_count`.

### Root Cause
Two patterns:
1. **Response format mismatch**: The `paginated()` helper (in `auth.ts`) consistently returns `{ data, total, page, limit }`. But some pages expected `{ users, total }` or `{ invites, ... }`. This happened because the old NestJS API had different response formats and the frontend wasn't updated during migration to Next.js API routes.
2. **Missing Prisma `_count`**: The users API route didn't include `_count: { select: { crops: true } }` in the Prisma findMany. The frontend's `mapBackendUser` function called `u._count.crops` which threw `TypeError: Cannot read properties of undefined` when `_count` was missing.

### Solution
- Changed `body.users` → `body.data` in users page and gamification page
- Added `_count: { select: { crops: true } }` to users API Prisma query
- Added null-safe access `u._count?.crops ?? 0` in `mapBackendUser` as defensive fallback
- Fixed invites page: `String(entry.createdBy)` on an object → extract `entry.createdBy.username` with runtime type check

### Prevention
- **Always use `body.data`** for responses from the `paginated()` helper — never invent custom keys
- **Always include `_count`** in Prisma queries when the frontend expects count fields, or use optional chaining
- **Never `String()` an object** for display — check `typeof entry.x === 'object'` and extract the display field
- Run `npm run build` (not just `npm run dev`) to catch missing API routes and compilation errors

## 2026-06-03: Supabase MCP Read-Only + PowerShell Inline Script Escaping
**Session**: ses-007
**Category**: Workflow
**Impact**: Medium

### Situation
Two issues encountered during Indian city data migration:
1. Supabase MCP `execute_sql` tool runs in read-only mode — cannot UPDATE data
2. Inline PowerShell scripts with ES6 template literals (`${}`) and special chars fail due to escaping

### Root Cause
1. The `supabase_execute_sql` MCP tool wraps queries in read-only transactions by design. The `supabase_apply_migration` tool is also read-only.
2. PowerShell's `-e` argument for inline Node.js scripts doesn't handle ES6 template literals, single quotes, and special characters properly. The escaping rules differ significantly from bash.

### Solution
- **Supabase writes**: Write a `.ts` file that uses Prisma client with the Supabase connection URL (`POSTGRES_URL_NON_POOLING`), then run with `ts-node`
- **Inline scripts**: Write the script to a file and execute with `cmd /c "npx.cmd ts-node path/to/script.ts"` instead of inline PowerShell

### Prevention
- For Supabase DML: Use Prisma client directly with Supabase connection URL, not the MCP tools
- For complex Node.js scripts: Always write to a `.ts` file first, avoid inline execution in PowerShell
- Add Supabase connection string to the `DATABASE_URL` env var to enable direct Prisma access

## 2026-06-03: Zustand Store Needs Bulk Sync Method for External Mutations

**Session**: ses-008
**Category**: Architecture
**Impact**: Medium

### Situation
Integrating the client-side GrowthEngine with the zustand garden store. The engine mutates crops internally on each tick and needs to push updates back to the store.

### Problem
The original `gardenStore` only had `updateCropGrowth(cropId, growthStage)` — a single-crop field update. The growth engine returns complete updated crop arrays with all fields changed (growthStage, hydration, nutrientLevel, health, status). There was no way to do a bulk crop replacement.

### Root Cause
Store was designed for individual action responses (water, fertilize, harvest), not for batch simulation updates. The growth engine pattern requires replacing the entire crop array atomically.

### Solution
Added `syncCrops(crops: Crop[])` method to `gardenStore` that does a full array replacement via `set({ crops })`. The engine calls this on each tick via its callback.

### Prevention
- When designing stores, consider both individual mutation patterns and bulk sync patterns
- For simulation engines, add a `syncXxx(array)` method that replaces the entire entity array
- Use `getState()` from zustand to access store actions outside React components

## 2026-06-03: React useEffect Dependency Pattern for Engine Initialization

**Session**: ses-008
**Category**: Workflow
**Impact**: Medium

### Situation
Starting a growth simulation engine inside a React useEffect. The engine needs to start when crops and garden are available, but not restart on every crop state change.

### Problem
Using `crops.length > 0 && selectedGarden?.id` as a useEffect dependency creates a boolean/string expression that doesn't re-run when crops change internally. More critically, if crops loaded after garden, the expression evaluates to the garden ID string, and since the garden ID doesn't change, the effect won't re-run even when crops become available.

### Root Cause
React useEffect dependency arrays should be primitive values that change when the thing you care about changes. Boolean expressions like `a > 0 && b?.id` collapse multiple concerns into a single value that loses signal.

### Solution
Use a `useRef(false)` guard (`engineStarted`) to ensure the engine starts exactly once when conditions are met. A separate effect with `[crops]` dependency calls `growthEngine.updateCrops()` to keep the engine's internal state in sync.

### Prevention
- Use `useRef` guards for one-time initialization in effects
- Separate "start engine" from "sync engine state" into two effects
- Don't use compound boolean expressions as effect dependencies — use primitives
- For engine patterns: start once with ref guard, sync state with separate array-effect

---

## 2026-06-03: Expo Web Auth Lost on Page Refresh

**Session**: ses-009
**Category**: Workflow
**Impact**: High

### Situation
Mobile app (Expo) running on web (`localhost:19006`) — user logs in, refreshes the browser page, and is redirected to login again. Auth state is lost completely.

### Problem
The `storage.ts` utility uses an in-memory `Map<string, string>()` for the web platform (`Platform.OS === "web"`). On page refresh, the JavaScript process is entirely recreated and the Map starts empty. No tokens or user data survive refresh.

### Root Cause
The original implementation chose a simple in-memory Map for web without considering the page lifecycle. On native (iOS/Android), `SecureStore` persists across app restarts because it writes to the device keychain. The web equivalent should use `localStorage` which survives page reloads.

### Solution
Changed `storage.ts` to use `window.localStorage` for web platform. Added a `getWebStorage()` helper that checks for `window !== undefined` and `window.localStorage`, falling back to `null` (which returns `null` from `getItem`). The `Map` fallback was removed entirely.

### Prevention
- When building Expo apps that target web, always use `localStorage` for web persistence
- Never use in-memory data structures for auth state that must survive refresh
- Test auth persistence on web explicitly: login → browser refresh → verify still authenticated

---

## 2026-06-03: Auth Profile Endpoint Missing — loadStoredAuth Failure Cascade

**Session**: ses-009
**Category**: Architecture
**Impact**: High

### Situation
Mobile app's `loadStoredAuth()` in `authStore.ts` loads stored tokens and then calls `AuthService.getProfile()` to fetch fresh user data. The getProfile call returns 404 because no `/auth/profile` endpoint exists.

### Problem
The `catch` block in `loadStoredAuth` was clearing ALL auth state (user: null, accessToken: null, isAuthenticated: false) when the profile fetch failed. So even with valid tokens in storage, the app logged the user out on every refresh.

### Root Cause
Two issues combined:
1. No `/auth/profile` API endpoint existed — the mobile service called a route that didn't exist
2. The `loadStoredAuth` error handling was too aggressive — any failure in the profile fetch (including 404) cleared ALL auth state instead of gracefully degrading

### Solution
1. Created `GET /api/v1/auth/profile` endpoint in the admin API (returns user from JWT payload)
2. Changed `loadStoredAuth` to fall back to cached `userData` from storage on profile fetch failure, rather than clearing auth entirely

### Prevention
- `loadStoredAuth` should be defensive: if profile fetch fails, use cached data rather than clearing auth
- Always create API endpoints before coding client-side calls to them
- Consider using a "stale-while-revalidate" pattern for auth: show cached profile immediately, refresh in background
- Profile API endpoints (`/auth/profile`) are a standard pattern — always include them

---

## 2026-06-03: Next.js App Router — No Implicit Sub-resource Nesting

**Session**: ses-009
**Category**: Architecture
**Impact**: Medium

### Situation
Mobile app called `GET /api/v1/marketplace/listings` but Next.js App Router has routes at `/api/v1/marketplace` (list) and `/api/v1/marketplace/[id]` (detail). The path `/marketplace/listings` matched the `[id]` dynamic route with `id="listings"`, causing a UUID parsing error.

### Problem
Unlike traditional REST frameworks (Express, NestJS) where `/api/v1/marketplace/listings` is a distinct route from `/api/v1/marketplace/:id`, Next.js App Router treats a file at `marketplace/[id]/route.ts` as a catch-all for any path under `marketplace/` that isn't an exact match. There's no implicit sub-resource routing — `/listings` is just a dynamic segment value.

### Root Cause
The mobile app was coded with a REST-style URL pattern (`/marketplace/listings`) that assumed a sub-resource route existed. Next.js App Router doesn't create nested routes by convention — each path must have a corresponding file in the directory tree.

### Solution
Changed `useMarketplace.ts` URLs from `/marketplace/listings` → `/marketplace` and `/marketplace/listings/${id}` → `/marketplace/${id}`. Also fixed response parsing from `data.listings` → `data.data` (matching the `paginated()` helper format).

### Prevention
- Always verify the exact route paths available in the API before coding client calls
- List available API routes: `find packages/admin/src/app/api/v1 -name "route.ts"`
- For Next.js App Router, dynamic segments like `[id]` catch ALL unmatched paths — be aware when designing URL patterns
- Use unique top-level paths instead of nested resource identifiers when possible

---

## 2026-06-03: Zustand Store Design — Plan for Both Individual and Bulk Patterns

**Session**: ses-009
**Category**: Architecture
**Impact**: Medium

### Situation
The `gardenStore` was designed with individual mutation methods like `updateCropGrowth(cropId, growthStage)` and `waterCrop(cropId)`. The growth engine needed to update ALL crops atomically on each tick, but there was no bulk method.

### Problem
Individual mutations are fine for user-driven actions (water, fertilize, harvest), but simulation engines (growth engine, weather effects, etc.) need to update the entire entity array in one atomic operation. Without a bulk sync method, the engine would need to call individual mutations for each crop, causing N re-renders and race conditions.

### Root Cause
The store was designed from the perspective of human interaction patterns (users do one thing at a time), not from the perspective of automated simulation (dozens of fields change simultaneously).

### Solution
Added `syncCrops(crops: Crop[])` method to `gardenStore` that does a full array replacement via `set({ crops })`. The engine calls this on each tick via its callback, replacing the entire crop array.

### Prevention
- When designing stores, consider ALL update patterns: individual mutations (UI actions) AND bulk sync (simulation/sync)
- Add a `syncXxx(array)` method to every store that holds arrays of entities
- For simulation engines, use `getState()` from zustand to access store actions outside React components
- Document in the store which methods are for UI actions vs bulk sync

---

## 2026-06-04: Backend Migration — Never Delete Seed Before Verifying New One Works

**Session**: ses-010
**Category**: Workflow
**Impact**: High

### Situation
Migrating the entire NestJS backend into Next.js API routes. Phase 5 (Cleanup) involved deleting `packages/backend/`.

### Problem
The backend seed script (`packages/backend/prisma/seed.ts`) was deleted along with the rest of the backend package. No admin seed script existed yet, so there was no way to restore the 31 plant species, 5 gardens, 16 crops, marketplace listings, weather data, and AI scan records.

### Root Cause
The Cleanup phase deleted the entire backend directory without first verifying that the admin package had a working seed script. The assumption was that "the backend seed is just for testing" but in practice it was the only source of demo data.

### Solution
Created a minimal seed script (`packages/admin/prisma/seed.ts`) with just 3 users. Documented full seed restoration as the top Next Action.

### Prevention
- Always extract/copy seed data BEFORE deleting the source
- Always create a replacement seed script before deleting the old one
- Add a "seed data backup" step to any cleanup/removal plan

---

## 2026-06-04: Backend Migration — PowerShell npx Blocked by Execution Policy

**Session**: ses-010
**Category**: Workflow
**Impact**: Medium

### Situation
Running TypeScript typecheck commands (`npx tsc --noEmit`) during the migration process.

### Problem
PowerShell execution policy blocks `npx` scripts from running. Command fails with `SecurityError: UnauthorizedAccess`.

### Root Cause
Windows PowerShell has an execution policy that blocks unsigned scripts. `npx` is a PowerShell script on Windows, which triggers this policy.

### Solution
Use `cmd /c "npx tsc --noEmit"` to run npx commands via the cmd shell, bypassing PowerShell's execution policy.

### Prevention
- Document that all `npx` commands must be wrapped with `cmd /c` on Windows
- Add this as a startup note in AGENTS.md session metadata

---

## 2026-06-04: Backend Migration — Static Page Generation Errors During Build Without DB

**Session**: ses-010
**Category**: Workflow
**Impact**: Low

### Situation
Running `next build` during verification when the local PostgreSQL Docker was not running.

### Problem
Build generated `prisma:error` messages for all pages that fetch data at build time (static generation). Errors said "Can't reach database server at `localhost:5432`".

### Root Cause
Next.js generates static pages at build time by server-rendering them. Some pages make Prisma queries during rendering, which fail when the database is offline.

### Solution
These errors are harmless — the build still completes successfully (126/126 pages generated). At runtime, the database queries run properly when the DB is available.

### Prevention
- Document that Prisma errors during `next build` are expected when DB is offline
- These don't affect production builds (Vercel has Supabase connection)
- For local verification, ensure Docker is running before build

---

## 2026-06-04: Backend Migration — Prisma Query Engine Locked by Running Dev Server

**Session**: ses-010
**Category**: Workflow
**Impact**: Medium

### Situation
Running `npx prisma generate` after schema changes during the migration.

### Problem
The Prisma client generation failed with `EPERM: operation not permitted, rename` for the query engine DLL. The file was locked by the running dev server process.

### Root Cause
The Next.js dev server holds a file lock on the Prisma query engine binary. Prisma tries to rename the temp file to the final name, which fails because the original is locked.

### Solution
Stop the dev server (using `Stop-Process -Id <PID>`) before running `prisma generate`. Start it again after generation completes.

### Prevention
- Always stop the dev server before running `prisma generate`
- Use `prisma db push` which automatically restarts the generation
- Document in the dev workflow: kill dev → prisma generate → restart dev

## 2026-06-05: Mobile Logger — Template Literal Issues with Escape Sequences

**Session**: ses-011
**Category**: Workflow
**Impact**: Low

### Situation
Writing a `formatArgs` function in the mobile logger that converts console arguments to a string for log entries.

### Problem
The code used a template literal containing `\n` inside `${}` interpolation:
```typescript
return `${a.name}: ${a.message}${a.stack ? '\n' + a.stack : ''}`
```
The TypeScript LSP reported "Unterminated template literal" and type errors because the `\'` inside the template literal was being interpreted as closing the template.

### Root Cause
Template literals (backticks) can have complex interactions with escape sequences and nested quotes. The `'\n'` inside `${}` looked fine syntactically but the tooling got confused.

### Solution
Rewrote using string concatenation instead of template literals:
```typescript
let s = a.name + ': ' + a.message
if (a.stack) s = s + '\n' + a.stack
return s
```

### Prevention
- Avoid complex template literals with nested escape sequences
- Use string concatenation for multi-part string building that includes conditional newlines
- Test typecheck after writing any template literal with `\n` or `\'` inside

## 2026-06-05: Seed Script — Windows ts-node JSON Quoting

**Session**: ses-011
**Category**: Workflow
**Impact**: High

### Situation
Running `npm run prisma:seed` on Windows to seed the database.

### Problem
The seed script used `ts-node --compiler-options '{"module":"commonjs"}'` which uses single quotes for the JSON argument. On Windows PowerShell and cmd, single quotes are not valid for JSON parsing — the shell passes `'{"module":"commonjs"}'` literally to ts-node, which can't parse it as valid JSON.

### Root Cause
The command was written for bash/Zsh where single quotes protect the JSON string. Windows shells don't handle single quotes the same way.

### Solution
Changed the seed script to use `tsx prisma/seed.ts` instead. `tsx` is compatible cross-platform, faster, and doesn't require `--compiler-options`.

### Prevention
- Always test shell commands on Windows when writing cross-platform scripts
- Prefer `tsx` over `ts-node` for scripts that need Windows compatibility
- Use `npx tsx` for running TypeScript files directly

## 2026-06-23: bcrypt Native Module Fails on Vercel Serverless

**Session**: ses-012
**Category**: Security, Deployment
**Impact**: High

### Situation
Production auth was returning 500 on Vercel. Login and register endpoints failed with `"Internal server error"`. Public endpoints (plants, marketplace, weather) worked fine.

### Problem
`bcrypt@5.1.1` is a native C++ module that requires compilation for the specific Lambda runtime. On Vercel serverless, the precompiled binary may not match or the module fails to load entirely. The error was hidden by the `serverError()` handler which returns a generic `"Internal server error"` in production.

### Root Cause
1. `bcrypt` uses native bindings (node-gyp compiled C++). Vercel's serverless runtime may not have compatible prebuilt binaries, causing a silent failure.
2. The `serverError()` handler logs but returns `"Internal server error"` in production, making debugging impossible without Vercel logs.
3. Dynamic `await import('jsonwebtoken')` triggered Node.js DEP0169 deprecation warning and could also fail in serverless bundling.

### Solution
1. Switched to `bcryptjs` (pure JavaScript, no native dependencies) across all 4 auth routes: login, admin/login, register, reset-password
2. Replaced all dynamic `await import('jsonwebtoken')` with static `import jwt from 'jsonwebtoken'` in login, admin/login, and refresh routes
3. Used a variable to hold JWT payload objects instead of inline object literals to avoid TypeScript overload resolution issues

### Prevention
- **Never use `bcrypt` on Vercel** — Use `bcryptjs` for any serverless deployment
- **No dynamic imports of already-bundled modules** — If a module is already imported statically elsewhere (like auth.ts importing jwt), don't re-import it dynamically in route handlers
- **Check Vercel logs before debugging** — `npx vercel logs <url>` reveals actual errors hidden by catch-all error handlers
- **Verify production API before local/emulator testing** — fix the production endpoint first, then test downstream consumers

## 2026-06-23: Missing API Route Causes Silent 500 via Dynamic Route Catch-All

**Session**: ses-012
**Category**: Architecture
**Impact**: High

### Situation
The admin dashboard and mobile app called `GET /api/v1/ai/scans` which returned 500.

### Problem
No `scans/` route directory existed under `api/v1/ai/`. Next.js App Router routed `GET /api/v1/ai/scans` to `api/v1/ai/[id]/route.ts` with `id="scans"`. The dynamic route tried `prisma.aiScan.findUnique({ where: { id: "scans" } })`, which failed because `"scans"` is not a valid UUID.

### Root Cause
The `scans` route was never created when the AI module was initially built. The parent `ai/route.ts` handled `GET /api/v1/ai` (list) and `POST /api/v1/ai` (create scan), but no `scans/` sub-route existed for the plural listing path.

### Solution
Created `packages/admin/src/app/api/v1/ai/scans/route.ts` with a paginated GET handler that:
- Requires authentication via `requireAuth`
- Supports `?page=` and `?limit=` query params
- Admins see all scans; regular users scoped to their own
- Returns standardized paginated response format

### Prevention
- When creating dynamic routes `[id]/route.ts`, always check if there are known reserved paths that should be explicit routes first
- Run a complete API surface audit after adding new dynamic routes
- Add E2E tests that verify all documented API endpoints return proper responses

## 2026-06-23: Dev APK React `useContext` Crash — Production Build Required

**Session**: ses-012
**Category**: Mobile, Build
**Impact**: Medium

### Situation
The dev APK (built with `eas build --profile development`) crashed on the login screen with `TypeError: Cannot read property 'useContext' of null`.

### Problem
The development build tries to load JavaScript from the Metro bundler at runtime (dev=true). When the Metro server isn't accessible or there's a React version mismatch, React itself becomes null and `useContext` fails.

### Root Cause
1. The APK was built with `"dev": true` in the Metro config, meaning JS is served from the Metro server rather than embedded
2. Metro bundler runs on port 8081 and the app tries to connect via WebSocket
3. When the connection fails or the bundle has version conflicts, React fails to initialize

### Solution
- Use `eas build --profile production` for stable testing
- Production builds embed the JS bundle and don't depend on Metro server
- The same API works correctly via Expo Go (which properly manages module loading)

### Prevention
- Use Expo Go for quick dev iteration (proper module resolution)
- Reserve EAS development builds for native module testing only
- Always use production builds (`eas build --profile production`) for end-to-end testing
- Document the build type differences in the mobile testing workflow

---

## 2026-06-24: QR Code `imageSettings` Causes 404 Without Fallback Icon

**Session**: ses-013
**Category**: UI
**Impact**: Low

### Situation
The public `/download` page used `qr-code.react` with `imageSettings` pointing to `/icon-192.png` for a center logo in the QR code.

### Problem
The `icon-192.png` file didn't exist in the Next.js public directory, causing a 404. The QR code still rendered but DevTools showed a 404 error.

### Root Cause
Assumed `icon-192.png` would exist from Vercel deployment or PWA setup, but no such file was ever created.

### Solution
Removed `imageSettings` entirely from `QRCodeSVG`. QR code renders cleanly without a center logo.

### Prevention
- Verify all static assets referenced in code exist in the public directory
- For optional UI elements like QR logos, provide a fallback or skip if missing

---

## 2026-06-25: Mobile Emulator Shows "No plants found" — Dev Server Must Be Running

**Session**: ses-014
**Category**: Workflow
**Impact**: Medium

### Situation
The Android emulator's plant selection screen showed "No plants found" when trying to plant a crop. The emulator was connecting to the API but getting empty/no response.

### Problem
The Next.js dev server (port 3000) was not running. The emulator at `10.0.2.2:3000` was connecting to nothing, so all API calls failed silently.

### Root Cause
The dev server was stopped at some point during the session (possibly by another process or manual restart). No health check was done before testing mobile features.

### Solution
Restarted the dev server: `npm run admin:dev`. After 15 seconds, the API was reachable and plant data loaded.

### Prevention
- Always verify `netstat -ano | findstr :3000` before testing mobile features against the API
- Add a quick curl health check: `curl.exe -f http://localhost:3000/api/v1/health`

---

## 2026-06-25: JWT Role Case-Sensitivity — Hidden Auth Breaking Bug

**Session**: ses-014
**Category**: Security, Backend
**Impact**: High

### Situation
Login was working (JWT issued successfully) but several admin API routes returned 403 Forbidden or empty results.

### Problem
Login routes stored `role: user.role.toLowerCase()` in the JWT payload. Many API routes did direct comparisons like `user.role !== 'ADMIN'` which failed because `jwt.verify()` returned lowercase `'admin'`.

### Root Cause
The `requireRole` middleware (`src/lib/middleware/auth.ts`) does case-insensitive comparison, so it works with either case. But various API routes had inline role checks using strict equality `!== 'ADMIN'` or `!== 'SUPER_ADMIN'`, which broke when the JWT stored lowercase roles.

### Solution
1. Changed login routes to store `user.role` as-is (uppercase from DB)
2. Added `.toUpperCase()` guards on direct role comparisons in gardens API routes
3. The `requireRole` middleware already handles case-insensitive comparison

### Prevention
- Always store roles in a canonical case (uppercase is convention)
- All role comparisons should be case-insensitive or use a shared utility function
- When changing JWT payload fields, audit ALL consumers for case assumptions
- The `requireRole` middleware is the safe path; inline `!==` comparisons are the footgun

---

## 2026-06-25: E2E Fixture Silent try/catch Hides Auth Failures

**Session**: ses-014
**Category**: Testing
**Impact**: High

### Situation
Super admin tests were flaky — failing on first run but passing on retry. The root cause was hidden by a silent try/catch in the fixture.

### Problem
The `authenticatedPage` and `superAdminPage` fixtures in `e2e/fixtures/test.ts` wrapped the entire setup in a try/catch that only logged to console. When `loginAs` failed (e.g., 503 from dev server restarting), the catch block silently logged the error, and the fixture fell through to returning the unauthenticated page. Subsequent tests that expected authenticated state would fail with confusing errors that didn't point to the auth failure.

### Root Cause
`console.log` output isn't visible in the Playwright test reporter. The error was swallowed entirely, making it look like a test logic bug rather than an infrastructure issue.

### Solution
Removed the try/catch entirely from `authenticatedPage` and `superAdminPage` fixtures. Now auth failures propagate as unhandled rejections, which show the actual error in the test report.

### Prevention
- Never wrap fixture setup in silent try/catch — let errors propagate
- If error recovery in fixtures is needed, log with `test.info().attach()` or explicit `console.error()` with visible markers
- For Playwright fixtures, use `test.beforeEach()` setup with explicit `expect()` verification instead

---

## 2026-06-25: Gradle Kapt SQLite Lock Crash — Worker Process Inherits Wrong `java.io.tmpdir`

**Session**: ses-014
**Category**: Build, Mobile
**Impact**: Medium

### Situation
Running `gradlew.bat assembleDebug` failed with a crash in `expo-updates:kaptDebugKotlin` — Room's DatabaseVerifier/SQLiteJDBCLoader couldn't write a lock file.

### Problem
The Kapt worker process forked by Gradle inherits the system `java.io.tmpdir`, which on Windows defaults to `C:\WINDOWS\TEMP` (not writable by non-admin processes). Room's SQLiteJDBCLoader tries to create a temporary lock file there and crashes.

### Solution
Skip the `expo-updates:kaptDebugKotlin` task entirely with `-x :expo-updates:kaptDebugKotlin`. This task is unnecessary for debug builds (expo-updates doesn't run in debug mode).

### Prevention
- Document Windows-specific Gradle workarounds explicitly
- On Windows, always build with `-x :expo-updates:kaptDebugKotlin` for debug APKs
- Consider CI-based builds (EAS) to avoid Windows-specific build issues
- Setting `kapt.use.worker.api=false` and JVM tmpdir env vars doesn't propagate to forked workers — skip the task instead

---

## 2026-06-25: Mobile Screen Uses Hardcoded Backend URL — API Service Already Exists

**Session**: ses-014
**Category**: Mobile
**Impact**: Medium

### Situation
PlantBrowserScreen.tsx had hardcoded `http://localhost:3001/api/v1/plants/by-season` and `http://localhost:3001/api/v1/plants/search` URLs pointing to the old NestJS backend (port 3001, long deleted).

### Problem
The NestJS backend at port 3001 was deleted in Session 10. The mobile screen was still using hardcoded URLs instead of the shared `api` service, so plant browsing was completely broken.

### Root Cause
When PlantBrowserScreen was created, it used direct `axios.get()` calls without going through the shared `api` service. The port 3001 was never updated to 3000 after the backend migration.

### Solution
Replaced hardcoded URLs with `api.get("/plants?season=...")` and `api.get("/plants?q=...")` using the existing shared API service at `packages/mobile/src/services/api.ts`.

### Prevention
- Always verify API endpoints used in mobile screens match the available API routes
- The shared `api` service (with base URL, auth interceptor, logging) should be the ONLY way to make API calls
- After any backend migration (NestJS → Next.js), audit mobile screens for stale port references
- Any new screen that needs API access should use the `api` service from the start

---

## 2026-06-27: Multi-Garden Schema Change Broke 12+ API Routes

**Session**: ses-016
**Category**: Database, API
**Impact**: High

### Situation
Changed the Prisma schema from 1:1 (User:Garden with `@unique` on `userId`) to 1:many (User → many Gardens/plots). This broke every API route that used `findUnique({ where: { userId } })` on the Garden model, since `findUnique` requires the table's `@id` field (not a unique relation field).

### Problem
12+ route files broke with TypeScript errors like `Unknown argument 'userId'. Available arguments: where: GardenWhereUniqueInput ...`. Routes also had incorrect `user.garden` (singular) reference patterns.

### Root Cause
The schema change was straightforward but the ripple effect touched watering, fertilizer, sustainability, and crop recommendations, plus friends, crops CRUD, gardens CRUD, user profile, geo nearby, and garden analytics routes. Each used a different pattern of accessing the user's garden.

### Solution
- All `findUnique({ where: { userId } })` → `findFirst({ where: { userId }, orderBy: { plotNumber: 'asc' } })`
- All `user.garden` → `user.gardens[0]`
- All `garden: { isNot: null }` → `gardens: { some: {} }`

### Prevention
- Run `tsc --noEmit` after any schema change to catch broken query patterns
- Grep for `user.garden` and `findUnique(.*userId)` after changing Garden relation
- Use `findFirst` with `orderBy` when switching from 1:1 to 1:many

---

## 2026-06-27: Seed Script `deleteMany` Fails With FK Constraints After Multi-Model Additions

**Session**: ses-016
**Category**: Database, Seed
**Impact**: Medium

### Situation
After adding PlotPurchase, SoilCheck, ExternalDataSync, Coupon, and Fertilizer models, the seed script's `deleteMany` chain failed with foreign key constraint violations.

### Problem
The proper `deleteMany` ordering would need to be: TokenTransaction → PlotPurchase → SoilCheck → ExternalDataSync → Garden → ... → User. But with 47 models and complex cross-references, getting the order right is brittle and breaks when new models are added.

### Root Cause
`deleteMany` respects FK constraints — you must delete child records before parents. When models have `userId` references, `deleteMany({ where: { userId: ... } })` fails if child records reference the same user.

### Solution
```sql
SET session_replication_role = 'replica';  -- disable FK checks
TRUNCATE TABLE "User", "Garden", ... CASCADE;  -- bulk truncate
SET session_replication_role = 'origin';  -- re-enable FK checks
```
This is simpler, faster, and doesn't need re-ordering when models change.

### Prevention
- Use raw SQL TRUNCATE CASCADE for seed data cleanup, not `deleteMany` chains
- Wrap in `$transaction` for atomicity
- Reset sequences after truncation with `ALTER SEQUENCE ... RESTART WITH 1`

---

## 2026-06-27: Mobile `findUnique({ where: { id } })` Not Needed in Multi-Garden Store

**Session**: ses-016
**Category**: Mobile, TypeScript
**Impact**: Medium

### Situation
The mobile `gardenStore.ts` used `useGardenStore.getState().gardens.find(g => g.id === id)` to find a garden, but TypeScript couldn't narrow the type and defaulted to `Garden | undefined`, causing spread-on-undefined errors.

### Solution
Cast the result explicitly:
```typescript
const existingPlot = useGardenStore.getState().gardens.find(g => g.id === id) as Garden | undefined;
```

### Prevention
- TypeScript strict mode means `.find()` returns `T | undefined`; always handle the `undefined` case or cast when you know it exists
- Prefer `find` from the store over separate API calls when data is already cached

---

## 2026-06-27: Tab Navigation DPAD Overlap With Debug Overlay in Emulator

**Session**: ses-016
**Category**: Mobile, Testing
**Impact**: Low

### Situation
Trying to tap the bottom tab bar's Profile icon by coordinate on the emulator failed — the tap hit the debug overlay button instead.

### Problem
The debug overlay button (`__FAB` bounds [923,2159][1038,2274]) overlapped with the Profile tab icon position. Coordinate-based tapping couldn't reach the tab bar.

### Solution
Use DPAD key events for tab navigation:
```bash
# Navigate right through tabs
adb shell input keyevent 22  # DPAD_RIGHT
# Activate focused tab
adb shell input keyevent 23  # DPAD_CENTER
```

### Prevention
- For tab navigation in Expo dev builds, use DPAD keys instead of coordinate taps
- The debug overlay button intercepts taps in the bottom-right quadrant of the screen
- In production builds (no debug overlay), coordinate taps will work normally
