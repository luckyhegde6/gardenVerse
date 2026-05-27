# GardenVerse — FAQ & Support

## Getting Started

### Q: What is GardenVerse?
A: GardenVerse is a hybrid agriculture simulation ecosystem combining virtual gardening, AI-powered plant diagnosis, IoT-enabled farming, and a geospatial community platform. It's a modular monolith designed for future microservices extraction.

### Q: What are the minimum requirements to run GardenVerse?
- **Node.js** >= 18.0.0
- **Docker** (for Postgres + Redis)
- **npm** (workspaces-enabled)
- **Windows**: PowerShell 5.1+ (scripts use PS-specific features)
- **Mobile**: Expo CLI for React Native development

### Q: How do I set up the project for the first time?
```bash
git clone <repo-url> gardenverse
cd gardenverse
npm install
npm run docker:local           # Start Postgres + Redis
npm run prisma:migrate -- --name init   # Run database migrations
npm run prisma:seed            # Seed demo data
npm run backend:dev            # Start backend (port 3001)
npm run admin:dev              # Start admin dashboard (port 3000)
```

### Q: What's the default test credentials?
- **Admin**: `admin@gardenverse.io` / `Admin@123456`
- **Regular User**: `test@gardenverse.io` / `Test@123456`

---

## Docker & Infrastructure

### Q: Docker containers won't start — what do I do?
1. Check if Docker Desktop is running
2. Run `docker ps` to verify
3. Check logs: `docker compose -f docker-compose.local.yml logs postgres`
4. Ensure ports 5432 and 6379 aren't already in use
5. Run `.\scripts\health-check.ps1` for diagnostics

### Q: How do I reset the database?
```bash
.\scripts\reset-db.ps1        # Interactive (asks confirmation)
.\scripts\reset-db.ps1 -Force # No confirmation
```

### Q: Redis connection refused?
- Ensure Docker Redis is running: `docker ps | findstr redis`
- The container name is `gardenverse-redis` on port 6379
- Check `.env` has `REDIS_URL=redis://localhost:6379`

---

## Development

### Q: How do I add a new feature?
1. Follow spec-driven development: create a spec in `docs/improvements/`
2. Check `.opencode/plans/feature-template.md` for structure
3. Implement backend module first (Prisma → Service → Controller → DTO)
4. Add mobile/admin frontend
5. Write tests (Jest unit + Playwright E2E)
6. Run `npm run typecheck` to verify compilation

### Q: How do I create a new NestJS module?
```bash
# In packages/backend:
nest g module modules/feature-name
nest g service modules/feature-name
nest g controller modules/feature-name
```
Then register in `app.module.ts` and add DTOs in `modules/feature-name/dto/`.

### Q: The backend won't compile with TypeScript errors?
Run `npm run typecheck:backend` to see all errors. Common issues:
- Missing `await` on Prisma calls
- Using `any` instead of `unknown` + type guard
- Importing from another module directly (use events instead)

### Q: How do I run migrations after schema changes?
```bash
npm run prisma:migrate -- --name describe-your-change
npm run prisma:generate
```

---

## Testing

### Q: How do I run E2E tests?
```bash
npm run docker:local           # Start infrastructure
npm run backend:dev            # Start backend (separate terminal)
npm run admin:dev              # Start admin (separate terminal)
npm run test:e2e               # Full E2E suite
npm run test:e2e:headed        # With visible browser
```

### Q: How do I generate workflow screenshots?
```bash
npm run workflow:all           # Generate all screenshots + recordings
npm run workflow:screenshots   # Only screenshots (8 workflows)
npm run workflow:recordings    # Only recordings (7 demo videos)
```
Output: `e2e/screenshots/`, `e2e/workflows-data/`, `playwright-report/recordings/`

### Q: E2E tests fail with "No element found"?
- Ensure backend AND admin are both running
- Check Chrome/Chromium is installed: `npx playwright install chromium`
- Run with `--headed` flag to see what's happening:
  ```bash
  npm run test:e2e:headed
  ```
- Take a Playwright snapshot to inspect the page state

---

## AI & Vision

### Q: How does plant identification work?
1. User takes photo via `expo-camera`
2. Image is uploaded via `UploadModule` (validated for type + size)
3. `VisionAgent` sends image to Python AI service (OpenCV-based)
4. AI returns leaf metrics (green/yellow/brown %, curl index)
5. Falls back to local mock if AI service is unavailable

### Q: The AI Vision service isn't available?
The Vision Agent has graceful degradation:
1. It tries POST to `AI_SERVICE_URL/api/v1/plant/identify`
2. If connection fails → falls back to local mock analysis
3. Mock generates reasonable default metrics
4. Uses `PlantSpecies.growingDays` for harvest estimates

### Q: How do I set up the Python AI service?
```bash
cd services/ai
pip install -r requirements.txt
cp .env.example .env           # Configure API keys
npm run ai:dev                 # Starts on port 8000
```

---

## Weather & Maps

### Q: Do I need API keys for weather/maps to work?
No — the app works without them:
- **Weather**: Falls back to simulated data generation if `WEATHER_API_KEY` is missing
- **Maps**: Falls back to geohash-based nearby search if `GOOGLE_MAPS_API_KEY` is missing
- **Plants**: Falls back to local cache if OpenFarm/Trefle APIs are unreachable

### Q: Where do I get a Weather API key?
1. Sign up at https://openweathermap.org/api
2. Copy your API key
3. Set `WEATHER_API_KEY` in your `.env` or `packages/backend/.env`

---

## Deployment

### Q: How do I deploy to Vercel?
```bash
npm run deploy:test      # Full pipeline: link → env pull → build → preview → health check → E2E
npm run deploy:preview   # Quick preview
npm run deploy:prod      # Production deploy
```

### Q: How do I run locally with production Supabase database?
```bash
.\scripts\docker-prod-debug.ps1
```
This starts Redis locally and runs backend/admin pointing to Supabase.
**⚠ Warning**: This affects the production database!

---

## Troubleshooting

### Q: The `npx` command doesn't work (PowerShell AllSigned policy)?
Use the `node_modules` path directly:
```bash
# Instead of: npx prisma migrate dev
node node_modules/prisma/build/index.js migrate dev --name init --schema=packages/backend/prisma/schema.prisma
```
Or use `cmd.exe /c "npx ..."` as a workaround.

### Q: Port 3000/3001 already in use?
```bash
# Find what's using the port
netstat -ano | findstr :3000
# Kill the process
taskkill /PID <PID> /F
```

### Q: Prisma migration fails with "relation already exists"?
This usually means a previous migration partially ran. Reset:
```bash
docker exec gardenverse-postgres psql -U gardenverse -d postgres -c "DROP DATABASE IF EXISTS gardenverse;"
docker exec gardenverse-postgres psql -U gardenverse -d postgres -c "CREATE DATABASE gardenverse;"
# Then re-run migrations
```
Or use `.\scripts\reset-db.ps1 -Force`.

### Q: Mobile app shows blank screen?
- Check if Metro bundler is running: `npm run mobile:dev`
- Use Expo Go on your device or emulator
- Clear Metro cache: `npx expo start -c`
- Check for console errors in the debugger

### Q: How do I check if all services are running?
```bash
.\scripts\health-check.ps1
```
This checks Docker containers, HTTP endpoints, database connectivity, and migration status.
