# GardenVerse — Troubleshooting Guide

## Common Issues & Solutions

### Node.js/PowerShell

**Problem**: `npm.ps1` or `npx.ps1` cannot be loaded (execution policy)
**Solution**: PowerShell's `AllSigned` policy blocks `npm.ps1` and `npx.ps1`.
```powershell
# Option 1: Use cmd.exe
cmd.exe /c "npm run backend:dev"

# Option 2: Bypass for single command
powershell -ExecutionPolicy Bypass -File scripts\health-check.ps1

# Option 3: Use node directly
node node_modules/prisma/build/index.js migrate dev
```

**Problem**: `&&` command chaining doesn't work in PowerShell
**Solution**: PowerShell 5.1 doesn't support `&&`. Use:
```powershell
# Sequential (fail on error):
cmd1; if ($?) { cmd2 }

# Sequential (always continue):
cmd1; cmd2
```

---

### Docker

**Problem**: Port already allocated (5432 or 6379)
**Solution**:
```powershell
# Find the process
netstat -ano | findstr :5432
# Kill it (replace PID from above)
taskkill /PID 12345 /F
```

**Problem**: Container exits immediately
**Solution**: Check logs:
```powershell
docker compose -f docker-compose.local.yml logs postgres
docker compose -f docker-compose.local.yml logs redis
```

**Problem**: Volume permission errors (especially on Windows)
**Solution**: Docker volumes on Windows can have permission issues. Remove volumes:
```powershell
docker compose -f docker-compose.local.yml down -v
docker compose -f docker-compose.local.yml up -d
```

**Problem**: "pg_isready" health check fails
**Solution**: Give Postgres more time to initialize on first run:
```powershell
# Wait longer
$env:DOCKER_WAIT_TIMEOUT=60; docker compose -f docker-compose.local.yml up -d
```

---

### Prisma & Database

**Problem**: `DATABASE_URL` environment variable not found
**Solution**: Prisma reads env from `packages/backend/.env` or explicit `$env:DATABASE_URL`:
```powershell
$env:DATABASE_URL='postgresql://gardenverse:gardenverse123@localhost:5432/gardenverse?schema=public'
node node_modules/prisma/build/index.js migrate dev
```

**Problem**: Prisma schema validation error P1012
**Solution**: The `.env` file is missing or DATABASE_URL is not set. Check `packages/backend/.env` exists.

**Problem**: Migration failed — "relation already exists"
**Solution**: The database already has tables. Either:
- Use `prisma migrate dev` (reconciles existing state)
- Reset: `docker exec ... DROP DATABASE` then re-migrate

**Problem**: `Unique constraint failed on the fields: (\`planId\`,\`plotX\`,\`plotY\`)`
**Solution**: You're trying to create a GardenPlanPlant at the same coordinates. Use a different plot position or delete the existing one first.

---

### Backend

**Problem**: API routes return 404 (e.g., `/api/v1/health`)
**Solution**: The API is served by the Next.js app. Run:
```powershell
npm run admin:dev      # Starts Next.js on port 3000 (serves UI + API)
```
Check that the admin dev server is running at `http://localhost:3000`.

**Problem**: Weather/geo API errors
**Solution**: If API keys are missing:
- Weather falls back to simulation
- Geo falls back to geohash
- These are NOT errors — they're expected graceful degradation

**Problem**: Port 3000 already in use
**Solution**:
```powershell
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

**Problem**: BullMQ / Redis connection error
**Solution**: Redis might not be running. Check:
```powershell
docker ps | findstr redis
# If not running:
npm run docker:local
```

---

### Admin Dashboard

**Problem**: Admin shows "Not Found" or blank page
**Solution**:
1. Check network tab in DevTools (F12) for API errors
2. Ensure admin dev server is running: `npm run admin:dev`
3. Clear Next.js cache: `Remove-Item -Recurse -Force packages/admin/.next`

**Problem**: Admin login fails with "Invalid credentials"
**Solution**: Use the seeded test credentials:
- Admin: `admin@gardenverse.vercel.app` / `Admin@123456`
- If those don't work, re-seed: `npm run prisma:seed`

---

### Mobile App

**Problem**: `await import(...)` fails — "Dynamic import is not supported"
**Solution**: React Native doesn't support dynamic imports. Replace with static imports:
```typescript
// ❌ Bad
const axios = await import('axios');

// ✅ Good
import axios from 'axios';
```

**Problem**: Camera doesn't open
**Solution**: Expo requires permissions:
```typescript
import { Camera } from 'expo-camera';
const [permission, requestPermission] = Camera.useCameraPermissions();
if (!permission?.granted) {
  await requestPermission();
}
```

---

### E2E Tests

**Problem**: Playwright can't connect to browser
**Solution**: Install Chromium:
```powershell
npx playwright install chromium
```

**Problem**: Screenshots show blank/empty pages
**Solution**: The app might not be running or the URL might be wrong:
- Backend: `http://localhost:3001`
- Admin: `http://localhost:3000`
- Run `.\scripts\health-check.ps1` first to verify

**Problem**: "WebM recording not generated"
**Solution**: Playwright may need FFmpeg for video encoding:
```powershell
# Install FFmpeg via winget
winget install FFmpeg
# Or download from https://ffmpeg.org/download.html
```

---

## Diagnostic Commands

```powershell
# Full health check
.\scripts\health-check.ps1

# Database inspection + repair
.\scripts\db-diagnostic.ps1 -All

# Check what's on a port
netstat -ano | findstr :3001

# View Docker container logs
docker logs gardenverse-postgres --tail 50
docker logs gardenverse-redis --tail 50

# Test database connection
docker exec gardenverse-postgres pg_isready -U gardenverse

# Run Prisma in interactive studio
node node_modules/prisma/build/index.js studio --schema=packages/backend/prisma/schema.prisma

# Check Node.js version
node --version

# Clear all caches and retry
npm cache clean --force
rm -rf node_modules
npm install
```
