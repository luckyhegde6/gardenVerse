# Local Development & Testing Guide

**Platform:** Windows 11 (PowerShell)
**Stack:** Next.js 14 + React Native + PostgreSQL + Redis

---

## Quick Start (5 Minutes)

```powershell
# 1. Clone and install
git clone <repo-url> F:\Local_git\gardenVerse
cd F:\Local_git\gardenVerse
npm install

# 2. Start infrastructure (Postgres + Redis)
npm run docker:local

# 3. Setup database
cd packages/admin
npx prisma db push
npx prisma db seed

# 4. Start admin (terminal 1)
npm run admin:dev
# → http://localhost:3000

# 5. Start mobile (terminal 2)
cd packages/mobile
npx expo start
# → Press 'a' for Android emulator
```

---

## Infrastructure Setup

### Docker (PostgreSQL + Redis)

```powershell
# Start
npm run docker:local
# or
docker compose -f docker-compose.local.yml up -d

# Verify
docker ps
# → gardenverse-postgres (port 5432)
# → gardenverse-redis (port 6379)

# Stop
npm run docker:local:down

# Reset (delete all data)
docker compose -f docker-compose.local.yml down -v
```

### Database

```powershell
# Generate Prisma client
npm run prisma:generate

# Push schema (dev — no migration history)
cd packages/admin
npx prisma db push

# Seed data (220 plants, 8 users, 6 gardens, 18+ crops, etc.)
npm run prisma:seed

# Open Prisma Studio (DB GUI)
npm run prisma:studio
# → http://localhost:5555

# Reset database completely
npm run script:reset-db
```

### Environment Variables

Create `.env` in project root:

```bash
DATABASE_URL=postgresql://gardenverse:gardenverse123@localhost:5432/gardenverse
REDIS_URL=redis://localhost:6379
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=dev-secret-change-in-production
JWT_SECRET=dev-jwt-secret-change-in-production
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NODE_ENV=development
```

---

## Running Services

### Admin Dashboard + API

```powershell
# Development (hot reload)
npm run admin:dev
# → http://localhost:3000

# Production build (local)
npm run admin:build
npm run start -w packages/admin
# → http://localhost:3000

# Type check
npm run typecheck:admin
```

### Mobile App

```powershell
# Start Expo dev server
cd packages/mobile
npx expo start

# Then press:
#   'a' → Android emulator
#   'i' → iOS simulator (macOS only)
#   'w' → Web browser
#   'r' → Reload JS bundle

# Run on specific device
npx expo run:android

# Type check
npm run typecheck:mobile
```

### AI Service (Optional)

```powershell
cd services/ai
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000
# → http://localhost:8000
```

---

## Testing

### Unit Tests

```powershell
# Admin (Jest)
npm run test -w packages/admin

# Mobile (Jest + React Native Testing Library)
npm run test -w packages/mobile
```

### E2E Tests — Admin (Playwright)

```powershell
# Ensure admin is running on localhost:3000
npm run admin:dev

# Run integration tests
npm run test:e2e:integration

# Run module-specific tests
npm run e2e:auth
npm run e2e:garden
npm run e2e:admin
npm run e2e:weather
npm run e2e:marketplace
npm run e2e:community
npm run e2e:ai-scanner
npm run e2e:invites

# Run all E2E modules
npm run e2e:all
```

### E2E Tests — Mobile (Detox + Emulator)

```powershell
# Prerequisites:
# 1. Android emulator running (Pixel_7_API_34)
# 2. Admin API running on localhost:3000
# 3. Debug APK built

# Run all mobile E2E tests
npm run test:e2e:mobile

# Build APK + run tests
npm run test:e2e:mobile:build

# Run specific test file
npx detox test --configuration android.emu.debug --testNamePattern "auth\.test"
```

### Full E2E Loop (Admin + Mobile)

```powershell
# Terminal 1: Start infrastructure
npm run docker:local

# Terminal 2: Start admin
npm run admin:dev

# Terminal 3: Start emulator + run mobile E2E
npm run test:e2e:mobile:build

# Terminal 4: Run Playwright tests (while admin is running)
npm run test:e2e:integration
```

### Health Check

```powershell
# Full service health check
npm run script:health-check

# Manual checks:
curl http://localhost:3000/api/v1/health
curl http://localhost:3000/api/v1/plants?limit=1
```

---

## Development Workflow

### Typical Feature Development

```powershell
# 1. Create branch
git checkout -b feature/my-feature

# 2. Start infrastructure
npm run docker:local

# 3. Start admin dev server
npm run admin:dev

# 4. Make changes (hot reload active)

# 5. Type check
npm run typecheck:admin

# 6. Run tests
npm run test -w packages/admin

# 7. Commit
git add .
git commit -m "feat(scope): description"

# 8. Push
git push origin feature/my-feature
```

### Database Changes

```powershell
# After modifying prisma/schema.prisma:

# Option A: Quick push (dev only)
cd packages/admin
npx prisma db push

# Option B: Create migration
npx prisma migrate dev --name describe_change

# Option C: Reset everything
npm run script:reset-db
# (drops DB → recreates → pushes schema → seeds data)
```

### Mobile Development with Emulator

```powershell
# 1. Start admin API first (mobile needs it)
npm run admin:dev

# 2. Start emulator
emulator -avd Pixel_7_API_34

# 3. Start Expo
cd packages/mobile
npx expo start

# 4. Press 'a' to launch on emulator

# 5. If API calls fail:
#    - Verify admin is running on localhost:3000
#    - Emulator uses 10.0.2.2:3000 to reach host
#    - Test: adb shell curl http://10.0.2.2:3000/api/v1/health
```

---

## Project Structure

```
gardenverse/
├── packages/
│   ├── admin/                    # Next.js 14 (API + UI)
│   │   ├── prisma/
│   │   │   ├── schema.prisma     # 42+ models
│   │   │   ├── seed.ts           # Demo data
│   │   │   └── migrations/       # SQL migrations
│   │   └── src/
│   │       ├── app/
│   │       │   ├── api/v1/       # 71 API routes (29 modules)
│   │       │   └── ...           # 31 UI pages
│   │       ├── components/       # Radix UI + Tailwind
│   │       └── lib/              # Auth, API client, logger, queue
│   └── mobile/                   # React Native (Expo)
│       └── src/
│           ├── screens/          # 32+ screens
│           ├── stores/           # Zustand state
│           ├── services/         # API client, socket, logger
│           └── components/       # Reusable UI
├── services/
│   ├── ai/                       # FastAPI (port 8000)
│   └── iot/                      # MQTT gateway
├── e2e/
│   ├── tests/                    # Playwright tests
│   ├── mobile/                   # Detox tests
│   ├── modules/                  # Module-by-module E2E
│   └── workflows/                # Screenshot/recording workflows
├── docs/                         # Documentation
├── scripts/                      # PowerShell utilities
├── docker-compose.local.yml      # Postgres + Redis
├── vercel.json                   # Vercel deployment config
└── eas.json                      # EAS Build config
```

---

## Useful Commands Reference

### PowerShell Scripts

```powershell
# Start Docker + optionally apps
npm run script:docker-local

# Full health check
npm run script:health-check

# Database diagnostic
npm run script:db-diagnostic

# Reset database
npm run script:reset-db

# Run pending migrations
npm run script:run-migrations

# Stop all (Docker + Node apps)
npm run script:stop-all

# Docker cleanup
npm run script:docker-cleanup
```

### Linting & Type Checking

```powershell
# Lint mobile
npm run lint

# Type check all
npm run typecheck

# Type check admin only
npm run typecheck:admin

# Type check mobile only
npm run typecheck:mobile
```

### Screenshots & Recordings

```powershell
# All screenshots + recordings
npm run workflow:all

# Screenshots only
npm run workflow:screenshots

# Recordings only
npm run workflow:recordings
```

---

## Troubleshooting

### Docker Issues

```powershell
# Containers won't start
docker compose -f docker-compose.local.yml down -v
docker compose -f docker-compose.local.yml up -d

# Port 5432 already in use
netstat -ano | findstr :5432
taskkill /PID <pid> /F

# Port 6379 already in use
netstat -ano | findstr :6379
taskkill /PID <pid> /F
```

### Database Issues

```powershell
# Can't connect to database
# Check Postgres is running
docker ps | findstr postgres

# Reset everything
npm run script:reset-db

# Prisma client out of date
npm run prisma:generate
```

### Admin Issues

```powershell
# Build fails
# Clear Next.js cache
Remove-Item -Recurse -Force packages/admin/.next
npm run admin:build

# API returns 500
# Check DATABASE_URL is correct
# Check database is running
# Check Prisma client is generated
```

### Mobile Issues

```powershell
# Metro bundler stuck
# Clear cache
npx expo start --clear

# Emulator can't reach API
adb reverse tcp:3000 tcp:3000
# Or verify: adb shell curl http://10.0.2.2:3000/api/v1/health

# App crashes on launch
adb logcat | findstr "ReactNativeJS"
# Check for missing native modules
# Run: npx expo prebuild --clean
```

### E2E Test Issues

```powershell
# Playwright tests fail
# Ensure admin is running
curl http://localhost:3000/api/v1/health

# Ensure database is seeded
curl http://localhost:3000/api/v1/plants?limit=1

# Detox tests fail
# Ensure emulator is running
adb devices

# Ensure APK is built
dir packages/mobile/android/app/build/outputs/apk/debug/app-debug.apk

# Check emulator can reach API
adb shell curl http://10.0.2.2:3000/api/v1/health
```

---

## Demo Accounts

| Email | Password | Role |
|-------|----------|------|
| `admin@gardenverse.vercel.app` | `password123` | Admin |
| `superadmin@gardenverse.vercel.app` | `password123` | Super Admin |
| `demo@gardenverse.vercel.app` | `password123` | Demo User |

5 additional regional users are also seeded (IN-MH, IN-GJ, IN-TN, IN-RJ, IN-KL regions).
