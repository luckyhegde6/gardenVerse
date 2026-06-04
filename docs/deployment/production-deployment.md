# Production Deployment Guide

> **Purpose**: End-to-end guide for deploying the complete GardenVerse ecosystem to production.
> **Last updated**: 2026-06-04

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PRODUCTION TOPOLOGY                           │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Vercel (Next.js 14 — Unified App)                           │  │
│  │  ┌────────────────────────────────────────────────────────┐  │  │
│  │  │ Admin Dashboard (31 static pages)                      │  │  │
│  │  │ API Routes (/api/v1/*)                                 │  │  │
│  │  │ - Auth, Gardens, Crops, Marketplace, Weather, etc.     │  │  │
│  │  │ - Prisma ORM, JWT auth, rate limiting                  │  │  │
│  │  └────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────┐   ┌────────────────────────────────┐ │
│  │  Supabase (Managed)        │   │  AI Service (TBD)              │ │
│  │  ┌──────────────────────┐ │   │  - Plant disease detection     │ │
│  │  │ PostgreSQL 16         │ │   │  - OpenCV + PyTorch           │ │
│  │  │ Auth (JWT/OAuth)      │ │   └────────────────────────────────┘ │
│  │  │ Storage (S3-compat)   │ │                                     │
│  │  └──────────────────────┘ │                                     │
│  └───────────────────────────┘                                     │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  External APIs                                                │   │
│  │  OpenWeatherMap  |  Google Maps  |  OpenFarm  |  Trefle       │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Service Matrix

| Service | Platform | Type | URL | Scaling |
|---------|----------|------|-----|---------|
| Admin Dashboard + API | Vercel | Next.js (SSG/SSR + API Routes) | `gardenverse.vercel.app` | Auto (serverless) |
| AI Service | TBD | FastAPI (container) | TBD | TBD |
| Database | Supabase | PostgreSQL 16 | Managed | Auto-scale |
| Cache/Queue | Upstash | Redis via HTTP | Managed | Auto-scale |
| File Storage | Supabase | S3-compatible | Built-in | Managed |

> **Note:** The backend API is no longer a separate service. All API routes (`/api/v1/*`) are served directly by the Next.js app on Vercel. This eliminates the need for a separate backend deployment and simplifies the architecture.

---

## Prerequisites

### Required Accounts

| Service | Purpose | Sign-up Link | Cost (Free Tier) |
|---------|---------|-------------|------------------|
| **Vercel** | Admin dashboard + API hosting, CI/CD | https://vercel.com | Free (Hobby) |
| **Supabase** | Database, Auth, Storage | https://supabase.com | Free (500MB DB) |
| **Upstash** | Serverless Redis for queues/cache | https://upstash.com | Free (10K cmd/day) |
| **OpenWeatherMap** | Weather API | https://openweathermap.org | Free (60 calls/min) |
| **Google Maps** | Geocoding, Places API | https://console.cloud.google.com | $200/mo credit |
| **Sentry** | Error tracking | https://sentry.io | Free (5K events/mo) |

### Required Tools

```bash
# Core
node -v   # Must be >= 22
npm -v    # Must be >= 10

# CLI tools
npm i -g vercel                # Vercel deployment

# Docker (for local testing)
docker --version
```

### API Keys to Generate

Obtain these before deployment:

| Key | Service | Where to Get |
|-----|---------|-------------|
| `WEATHER_API_KEY` | OpenWeatherMap | https://home.openweathermap.org/api_keys |
| `GOOGLE_MAPS_API_KEY` | Google Cloud | https://console.cloud.google.com/apis/credentials (enable Geocoding + Places APIs) |
| `SENTRY_DSN` | Sentry | Project Settings > Client Keys (DSN) |
| `SENTRY_AUTH_TOKEN` | Sentry | https://sentry.io/settings/account/api/auth-tokens/ |
| `SUPABASE_URL` | Supabase | Project Settings > API > Project URL |
| `SUPABASE_ANON_KEY` | Supabase | Project Settings > API > anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase | Project Settings > API > service_role (secret!) |
| `UPSTASH_REDIS_REST_URL` | Upstash | Database > REST API > URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash | Database > REST API > Token |

---

## Step 1: Supabase Setup

### 1.1 Create Project

1. Go to https://supabase.com and sign in
2. Create a new project:
   - **Name**: `gardenverse`
   - **Database Password**: Generate a strong password and save it
   - **Region**: Choose closest to your users (e.g., `ap-south-1` for India)
   - **Pricing**: Free tier is sufficient initially
3. Wait ~2 minutes for database provisioning

### 1.2 Get Connection Strings

Supabase Dashboard > **Project Settings** > **Database** > **Connection string**:

```bash
# Connection string with PgBouncer (for serverless/connection pooling)
DATABASE_URL=postgresql://postgres:[PASSWORD]@[REF].supabase.co:6543/postgres?pgbouncer=true

# Direct connection (for running migrations)
DIRECT_URL=postgresql://postgres:[PASSWORD]@[REF].supabase.co:5432/postgres
```

Replace `[PASSWORD]` with your database password and `[REF]` with your project reference ID.

### 1.3 Get API Keys

Supabase Dashboard > **Project Settings** > **API**:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://[REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIs...
```

> The `anon` key is safe for client-side use. The `service_role` key is a **secret** — never expose it to clients.

### 1.4 Run Database Migrations

From your local machine:

```bash
# Check out the release branch
git checkout main && git pull

# Install dependencies
npm ci

# Generate Prisma client
npm run prisma:generate

# Apply all migrations to production
DATABASE_URL="postgresql://postgres:[PWD]@[REF].supabase.co:6543/postgres?pgbouncer=true" \
  npx prisma migrate deploy

# Seed initial data (plants, demo accounts, feature flags)
DATABASE_URL="postgresql://postgres:[PWD]@[REF].supabase.co:6543/postgres?pgbouncer=true" \
  npx ts-node packages/backend/prisma/seed.ts
```

### 1.5 Configure Auth Providers

Supabase Dashboard > **Authentication** > **Providers**:
- **Email**: Enabled by default
- **Google** (optional): Enable and configure OAuth credentials
- **GitHub** (optional): Enable and configure OAuth credentials

### 1.6 Configure Storage (Optional)

Supabase Dashboard > **Storage**:
1. Create bucket: `gardenverse-uploads`
2. Set RLS policy for authenticated uploads:
   ```sql
   CREATE POLICY "Authenticated users can upload" ON storage.objects
     FOR INSERT WITH CHECK (auth.role() = 'authenticated');
   ```

### 1.7 Verify Database

```bash
# Quick verification
DATABASE_URL="postgresql://postgres:[PWD]@[REF].supabase.co:6543/postgres?pgbouncer=true" \
  npx prisma db execute --stdin <<< "SELECT count(*) FROM \"User\";"

# Expected output: count of seeded users (should be >= 3 if seed ran)
```

---

## Step 2: Admin Dashboard + API Deployment (Vercel)

### 2.1 Prerequisites

```bash
# Verify the build
export NEXT_PUBLIC_API_URL="/api/v1"
npm run admin:build

# Should output: ✓ Generating static pages (31/31)
```

### 2.2 Link and Configure

```bash
# Login (if not already)
vercel login

# Link project (first time only)
vercel link --project gardenverse

# Verify root vercel.json is correct
cat vercel.json
# Should show: framework: nextjs, buildCommand: npm run admin:build
```

The root `vercel.json` is pre-configured:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run admin:build",
  "installCommand": "npm install",
  "outputDirectory": "packages/admin/.next"
}
```

### 2.3 Set Environment Variables

```bash
# API URL (served by the same Next.js app)
echo "/api/v1" | \
  vercel env add NEXT_PUBLIC_API_URL production

# NextAuth secret (generate strong random)
openssl rand -hex 32 | \
  vercel env add NEXTAUTH_SECRET production

# Supabase (for /notes dynamic route)
echo "https://[REF].supabase.co" | \
  vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "YOUR_SUPABASE_ANON_KEY" | \
  vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "YOUR_SUPABASE_SERVICE_ROLE_KEY" | \
  vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Suppress Sentry warnings (until properly configured)
echo "1" | \
  vercel env add SENTRY_SUPPRESS_GLOBAL_ERROR_HANDLER_FILE_WARNING production
```

### 2.4 Deploy to Production

```bash
# Deploy using cloud build (recommended)
vercel deploy --prod --yes

# This triggers:
# 1. Vercel detects Next.js from vercel.json
# 2. Runs npm install in monorepo root
# 3. Runs npm run admin:build (next build)
# 4. Creates serverless functions for each route
# 5. Deploys to production
```

### 2.5 Configure Custom Domain

```bash
# Vercel subdomain (free)
vercel domains add gardenverse.vercel.app

# Custom domain (requires DNS setup)
vercel domains add yourdomain.com
# Then add CNAME record at your DNS provider pointing to cname.vercel-dns.com
```

### 2.6 Production Verification

```bash
# 1. Check homepage
curl -s -o /dev/null -w "%{http_code}" https://gardenverse.vercel.app
# Expected: 200

# 2. Check all static routes
for route in /about /features /ai-scanner /ai-scanner/history /support /onboarding; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://gardenverse.vercel.app$route")
  echo "$route: $code"
done

# 3. Check login page renders
curl -s https://gardenverse.vercel.app/login | grep -q "Email"
echo "Login form: $? (0=present)"

# 4. Check dynamic routes
curl -s -o /dev/null -w "%{http_code}" https://gardenverse.vercel.app/notes
curl -s -o /dev/null -w "%{http_code}" https://gardenverse.vercel.app/garden/crop/test

# 5. Verify API health endpoint
curl -s https://gardenverse.vercel.app/api/v1/health
```

### 2.7 Rollback

```bash
# List recent deployments
vercel list

# Rollback to a previous version
vercel rollback dpl_xxxxxxxxxxxx

# Or promote a specific deployment
vercel promote dpl_xxxxxxxxxxxx
```

---

## Step 3: AI Service Deployment (TBD)

AI service deployment location is **to be determined**. The FastAPI-based plant disease detection service is not yet deployed. Follow this space for updates.

Options under consideration:
- Deploy alongside the Next.js app on Vercel (via serverless functions or custom runtime)
- Deploy as a separate container on a cloud provider (e.g., Railway, Fly.io, GCP Cloud Run)
- Use a managed ML inference service

---

## Step 4: Mobile App Deployment (EAS Build)

### 4.1 Prerequisites

```bash
# Install EAS CLI
npm i -g eas-cli

# Login to Expo
eas login

# Configure app.json with correct IDs
# Check packages/mobile/app.json for:
# - expo.extra.eas.projectId
```

### 4.2 Build

```bash
cd packages/mobile

# Build for staging/preview
eas build --platform all --profile preview --non-interactive

# Build for production
eas build --platform all --profile production --non-interactive

# Submit to stores
eas submit --platform ios --profile production --non-interactive
eas submit --platform android --profile production --non-interactive
```

### 4.3 Required Environment Variables on EAS

Set these in the Expo dashboard or via `eas env`:

| Variable | Source | Purpose |
|----------|--------|---------|
| `EXPO_PUBLIC_API_URL` | `https://gardenverse.vercel.app/api/v1` | API calls |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase | Auth & data |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase | Auth & data |
| `EXPO_PUBLIC_GOOGLE_MAPS_KEY` | GCP Console | Map rendering |
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry | Error tracking |

---

## Step 5: GitHub Actions CI/CD

### 5.1 Required GitHub Secrets

| Secret | Value | Source |
|--------|-------|--------|
| `VERCEL_TOKEN` | Vercel auth token | `~/.vercel/config.json` or https://vercel.com/account/tokens |
| `VERCEL_ORG_ID` | Vercel org ID | `.vercel/project.json` > `orgId` |
| `VERCEL_PROJECT_ID` | Vercel project ID | `.vercel/project.json` > `projectId` |
| `SLACK_WEBHOOK` | Slack webhook URL | Slack App > Incoming Webhooks |

### 5.2 Workflow: Admin Dashboard (`admin-deploy.yml`)

Create `.github/workflows/admin-deploy.yml`:

```yaml
name: Admin Dashboard Deploy

on:
  push:
    branches: [main]
    paths:
      - 'packages/admin/**'
      - 'vercel.json'
      - 'package.json'
  pull_request:
    branches: [main]
    paths:
      - 'packages/admin/**'

env:
  NODE_VERSION: '22'

jobs:
  test:
    name: Test & Lint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run typecheck:admin
      - run: npm run admin:build

  deploy-preview:
    name: Preview (PR)
    if: github.event_name == 'pull_request'
    needs: test
    runs-on: ubuntu-latest
    environment: preview
    steps:
      - uses: actions/checkout@v4
      - run: npm i -g vercel
      - run: vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}
      - run: vercel build --token=${{ secrets.VERCEL_TOKEN }}
      - id: deploy
        run: |
          DEPLOY_URL=$(vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }})
          echo "url=$DEPLOY_URL" >> $GITHUB_OUTPUT
      - name: Smoke tests
        run: |
          URL="${{ steps.deploy.outputs.url }}"
          for path in / /about /features /ai-scanner /ai-scanner/history /login /support; do
            code=$(curl -s -o /dev/null -w "%{http_code}" "$URL$path")
            echo "$path: $code"
            [ "$code" = "200" ] || [ "$code" = "307" ] || exit 1
          done
      - name: Comment PR
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `:white_check_mark: Preview deployed: ${{ steps.deploy.outputs.url }}`
            })

  deploy-production:
    name: Production
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    needs: test
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - run: npm i -g vercel
      - run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}
      - run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}
      - id: deploy
        run: |
          vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }} > url.txt
          echo "url=$(cat url.txt)" >> $GITHUB_OUTPUT
      - name: Post-Deploy Verification
        run: |
          URL="https://gardenverse.vercel.app"
          echo "=== POST-DEPLOY VERIFICATION ==="
          # 1/6 Homepage
          code=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
          echo "[1/6] Homepage: $code"
          [ "$code" = "200" ] || [ "$code" = "307" ]
          # 2/6 Static routes
          for route in /about /features /ai-scanner /ai-scanner/history /support /onboarding; do
            code=$(curl -s -o /dev/null -w "%{http_code}" "$URL$route")
            echo "[2/6] $route: $code"
            [ "$code" = "200" ]
          done
          # 3/6 Login form
          curl -s "$URL/login" | grep -q "Email"
          echo "[3/6] Login form: OK"
          # 4/6 Dashboard redirect (unauthenticated)
          dash_code=$(curl -s -o /dev/null -w "%{http_code}" -L "$URL/dashboard")
          echo "[4/6] Dashboard redirect: $dash_code"
          # 5/6 Notes (dynamic route)
          notes_code=$(curl -s -o /dev/null -w "%{http_code}" "$URL/notes")
          echo "[5/6] Notes: $notes_code"
          # 6/6 Crop detail (dynamic route)
          crop_code=$(curl -s -o /dev/null -w "%{http_code}" "$URL/garden/crop/test")
          echo "[6/6] Crop detail: $crop_code"
          echo "=== VERIFICATION PASSED ==="
      - name: E2E Tests
        if: success()
        run: |
          npx playwright install --with-deps chromium
          npx playwright test e2e/tests/screenshots.spec.ts --reporter=html
      - name: Notify
        if: always()
        uses: slackapi/slack-github-action@v2
        with:
          webhook: ${{ secrets.SLACK_WEBHOOK }}
          webhook-type: incoming-webhook
          payload: |
            text: "${{ job.status == 'success' && ':white_check_mark:' || ':warning:' }} Admin deploy ${{ job.status }}: https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }}"
```

---

## Step 6: Post-Deployment Verification Script

Create `scripts/verify-deployment.sh` (Linux/macOS) or use within CI:

```bash
#!/bin/bash
# Unified deployment verification script

ADMIN_URL="${ADMIN_URL:-https://gardenverse.vercel.app}"
API_URL="${API_URL:-https://gardenverse.vercel.app/api/v1}"

fail=0

section() { echo "=== $1 ==="; }
check() {
  if [ $? -eq 0 ]; then echo "  [PASS] $1"; else echo "  [FAIL] $1"; fail=1; fi
}

section "Admin Dashboard"
code=$(curl -s -o /dev/null -w "%{http_code}" "$ADMIN_URL")
[ "$code" = "200" ] || [ "$code" = "307" ]
check "Homepage returns 200/307 (got $code)"

for path in /about /features /ai-scanner /ai-scanner/history /support /login; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$ADMIN_URL$path")
  [ "$code" = "200" ]
  check "Route $path returns 200 (got $code)"
done

section "API Health"
health=$(curl -s "$API_URL/health")
echo "$health" | grep -q '"status":"ok"'
check "Health endpoint returns ok"
echo "$health" | grep -q '"database":"connected"'
check "Database is connected"

section "Auth Endpoint"
login_check=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}' 2>/dev/null)
[ "$login_check" = "401" ]  # 401 = endpoint exists but bad credentials
check "Auth endpoint reachable (got $login_check, expected 401)")

section "Results"
[ $fail -eq 0 ] && echo "ALL CHECKS PASSED" || echo "SOME CHECKS FAILED"
exit $fail
```

And `scripts/verify-deployment.ps1` (Windows):

```powershell
param(
  [string]$AdminUrl = "https://gardenverse.vercel.app",
  [string]$ApiUrl = "https://gardenverse.vercel.app/api/v1"
)

$fail = 0

function Section($name) { Write-Host "=== $name ===" -ForegroundColor Cyan }
function Check($name) {
  if ($LASTEXITCODE -eq 0) { Write-Host "  [PASS] $name" -ForegroundColor Green }
  else { Write-Host "  [FAIL] $name" -ForegroundColor Red; $script:fail = 1 }
}

Section "Admin Dashboard"
$code = (Invoke-WebRequest -Uri $AdminUrl -UseBasicParsing -TimeoutSec 10).StatusCode
$LASTEXITCODE = [int]($code -eq 200 -or $code -eq 307)
Check "Homepage returns 200/307 (got $code)"

foreach ($path in @("/about","/features","/ai-scanner","/ai-scanner/history","/support","/login")) {
  try { $code = (Invoke-WebRequest -Uri "$AdminUrl$path" -UseBasicParsing -TimeoutSec 10).StatusCode }
  catch { $code = 0 }
  $LASTEXITCODE = [int]($code -eq 200)
  Check "Route $path returns 200 (got $code)"
}

Section "API Health"
try { $health = Invoke-RestMethod -Uri "$ApiUrl/health" -TimeoutSec 15 }
catch { $health = $null }
$LASTEXITCODE = [int]($health -and $health.status -eq "ok")
Check "Health endpoint returns ok"
$LASTEXITCODE = [int]($health -and $health.database -eq "connected")
Check "Database is connected"

if ($fail -eq 0) { Write-Host "ALL CHECKS PASSED" -ForegroundColor Green }
else { Write-Host "SOME CHECKS FAILED" -ForegroundColor Red }
exit $fail
```

---

## Step 7: Monitoring & Alerting

### 7.1 Vercel Analytics

Vercel provides built-in analytics for the admin dashboard:
- **Web Analytics**: Page views, visit duration (enable in Vercel Dashboard > Project > Analytics)
- **Speed Insights**: Core Web Vitals (LCP, FID, CLS)
- **Edge Functions**: Execution duration, invocation count

### 7.2 Sentry Setup

For error tracking across services:

1. Create a Sentry project for each service:
   - `gardenverse-api` (Next.js API routes)
   - `gardenverse-mobile` (React Native)

2. Configure DSN in each service's environment variables

3. For the admin dashboard, when Sentry is properly configured:
   - Migrate `sentry.server.config.ts` → `instrumentation.ts`
   - Migrate `sentry.edge.config.ts` → `instrumentation.ts`
   - Migrate `sentry.client.config.ts` → `instrumentation-client.ts`
   - Re-enable `withSentryConfig` in `next.config.mjs`

### 7.3 Uptime Monitoring

Set up external monitoring:

| Service | Tool | Check Interval | Alert |
|---------|------|---------------|-------|
| Admin Dashboard + API | Better Uptime / Pingdom | 1 minute | Slack + Email |
| Database | Supabase Dashboard | Built-in | Email |
| Redis | Upstash Dashboard | Built-in | Email |

---

## Step 8: Backup & Disaster Recovery

### 8.1 Database Backups

Supabase handles automated backups:
- **Daily backups**: Retained for 7 days (Free), 30 days (Pro)
- **Point-in-time recovery**: Pro plan only (up to 7 days)
- **Manual backup**: Use `pg_dump` for additional safety:

```bash
pg_dump "postgresql://postgres:[PWD]@[REF].supabase.co:5432/postgres" \
  | gzip > gardenverse-$(date +%Y%m%d).sql.gz
```

### 8.2 Environment Backups

All env vars are stored in three places for redundancy:
1. Vercel dashboard (primary)
2. `.env.example` (documented, no secrets)
3. Password manager (e.g., 1Password, Bitwarden)

### 8.3 Disaster Recovery Runbook

| Scenario | Recovery Time | Steps |
|----------|--------------|-------|
| App down (dashboard + API) | 5 min | `vercel rollback` |
| Database corruption | 30 min | Restore from Supabase backup |
| Full region outage | 2 hours | Deploy to new region, update DNS |
| Accidental deployment | 2 min | `vercel rollback` |

---

## Step 9: Security Checklist

- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` are unique per environment
- [ ] `NEXTAUTH_SECRET` has no hardcoded fallback in code
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is never exposed to client-side code
- [ ] Database password meets complexity requirements
- [ ] CORS origins are restricted to known domains
- [ ] Helmet security headers are configured (already in next.config.mjs)
- [ ] Rate limiting is enabled on all public endpoints
- [ ] File upload validation (type, size, scan) is active
- [ ] QR payloads are encrypted and signed with expiration
- [ ] Redis (Upstash) uses TLS encryption
- [ ] Sentry auth tokens are scoped to specific projects
- [ ] Vercel deployment protection is enabled
- [ ] Supabase RLS policies are configured on all tables
- [ ] Mobile app API keys are environment-specific
- [ ] `console.log` is not used in production code
- [ ] Feature flags are disabled for unreleased features

---

## Appendix A: Quick Reference Commands

```bash
# === DEPLOYMENT (Vercel) ===
vercel login                          # Login to Vercel
vercel link --project gardenverse     # Link local dir to project
vercel env add NAME production        # Add env var
vercel deploy --prod --yes            # Deploy to production
vercel list                            # List deployments
vercel rollback dpl_xxx                # Rollback deployment
vercel domains add example.com        # Add custom domain

# === DATABASE (Prisma) ===
npx prisma migrate deploy             # Apply migrations
npx prisma migrate status             # Check migration state
npx prisma validate                   # Validate schema
npx prisma studio                     # Open DB browser
DATABASE_URL=... npx prisma db seed   # Seed data

# === VERIFICATION ===
curl https://gardenverse.vercel.app                     # Admin dashboard + API health
curl https://gardenverse.vercel.app/api/v1/health        # API health check
```

---

## Appendix B: Troubleshooting

| Symptom | Likely Cause | Solution |
|---------|-------------|----------|
| Vercel build fails with `NEXT_MISSING_LAMBDA` | Local `vercel build` bug | Use cloud deploy: `vercel deploy --prod --yes` |
| Admin login returns 401 | API URL wrong | Check `NEXT_PUBLIC_API_URL` on Vercel |
| API health shows DB disconnected | Wrong `DATABASE_URL` or Supabase not provisioned | Verify connection string in Vercel environment variables |
| Sentry build warnings | Missing Sentry config or auth token | Set `SENTRY_SUPPRESS_GLOBAL_ERROR_HANDLER_FILE_WARNING=1` |
| Prisma migration fails on Supabase | Direct connection needed | Use `DIRECT_URL` (port 5432) instead of PgBouncer (6543) |
| CORS errors in browser | `CORS_ORIGINS` not set | Set to `https://gardenverse.vercel.app` |
| Mobile app build fails | EAS config or project ID mismatch | Check `app.json` for correct `projectId` |

---

## Appendix C: Cost Estimates (Monthly)

| Service | Free Tier | Pro Tier (Estimated) |
|---------|-----------|---------------------|
| Vercel | $0 (Hobby) | $20 (Pro) |
| Supabase | $0 (Free) | $25 (Pro) |
| Upstash | $0 (Free) | $10 (Pay-as-you-go) |
| OpenWeatherMap | $0 (Free) | $40 (Startup) |
| Google Maps | $0 ($200 credit) | $10-50 (usage-based) |
| Sentry | $0 (Free) | $26 (Team) |
| **Total** | **$0** | **~$130-170** |

---

*Last updated: 2026-06-01*
