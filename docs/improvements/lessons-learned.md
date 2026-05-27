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
