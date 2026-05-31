# GardenVerse Production Deploy — All 4 Apps
# Run from project root: powershell -ExecutionPolicy Bypass ./scripts/deploy-all.ps1

param(
  [switch]$Prod,
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"
$ROOT = Split-Path -Parent $PSScriptRoot

Write-Output "========================================"
Write-Output " GardenVerse Production Deployment"
Write-Output "========================================"
Write-Output ""

# ============================================
# 1. BUILD ALL APPS
# ============================================
if (-not $SkipBuild) {
  Write-Output "[1/5] Building admin dashboard..."
  npm run admin:build
  if ($LASTEXITCODE -ne 0) { Write-Error "Admin build failed"; exit 1 }

  Write-Output "[2/5] Building backend..."
  npm run backend:build
  if ($LASTEXITCODE -ne 0) { Write-Error "Backend build failed"; exit 1 }
}

# ============================================
# 2. DEPLOY ADMIN → VERCEL
# ============================================
Write-Output "[3/5] Deploying admin dashboard to Vercel..."
if ($Prod) {
  vercel deploy packages/admin --prod --prebuilt --yes
} else {
  vercel deploy packages/admin --prebuilt --yes
}
if ($LASTEXITCODE -ne 0) { Write-Error "Admin deploy failed"; exit 1 }

# ============================================
# 3. DEPLOY BACKEND (Vercel or Railway)
# ============================================
Write-Output "[4/5] Deploying backend..."
Write-Output "  Option A (Vercel, REST-only): vercel deploy packages/backend --prebuilt --yes"
Write-Output "  Option B (Railway, full):     railway up --service backend"
Write-Output ""
Write-Output "  NOTE: Vercel doesn't support Socket.IO / BullMQ queues."
Write-Output "  For full backend, deploy as Docker container to Railway/Fly.io."
Write-Output ""

# ============================================
# 4. DEPLOY AI SERVICE → DOCKER CONTAINER
# ============================================
Write-Output "[5/5] Deploying AI service..."
Write-Output "  Railway:     railway up --service ai-service"
Write-Output "  Cloud Run:   gcloud run deploy ai-service --source services/ai/"
Write-Output "  Fly.io:      fly deploy --config services/ai/fly.toml"
Write-Output ""

# ============================================
# MOBILE APP (separate process)
# ============================================
Write-Output "========================================"
Write-Output " Mobile App (run separately)"
Write-Output "========================================"
Write-Output ""
Write-Output "  eas build --platform ios --profile production"
Write-Output "  eas build --platform android --profile production"
Write-Output "  eas submit --platform ios"
Write-Output "  eas submit --platform android"
Write-Output ""

Write-Output "========================================"
Write-Output " Required Environment Variables"
Write-Output "========================================"
Write-Output ""
Write-Output "=== Vercel (Admin) ==="
Write-Output "  NEXT_PUBLIC_API_URL=https://your-api.vercel.app/api/v1"
Write-Output "  NEXTAUTH_URL=https://your-admin.vercel.app"
Write-Output "  NEXTAUTH_SECRET=<generate>"
Write-Output ""
Write-Output "=== Vercel/Railway (Backend) ==="
Write-Output "  DATABASE_URL=postgresql://postgres:pass@db.[ref].supabase.co:6543/postgres?pgbouncer=true"
Write-Output "  DIRECT_URL=postgresql://postgres:pass@db.[ref].supabase.co:5432/postgres"
Write-Output "  JWT_SECRET=<generate: openssl rand -base64 64>"
Write-Output "  JWT_REFRESH_SECRET=<generate: openssl rand -base64 64>"
Write-Output "  UPSTASH_REDIS_REST_URL=https://[ref].upstash.io"
Write-Output "  UPSTASH_REDIS_REST_TOKEN=<your-token>"
Write-Output "  WEATHER_API_KEY=<openweathermap-key>"
Write-Output "  GOOGLE_MAPS_API_KEY=<google-maps-key>"
Write-Output ""
Write-Output "=== Railway/Docker (AI Service) ==="
Write-Output "  DATABASE_URL=<same supabase url>"
Write-Output "  WEATHER_API_KEY=<same key>"
Write-Output "  TREFLE_API_KEY=<trefle-key>"
Write-Output ""

Write-Output "========================================"
Write-Output " Done!"
Write-Output "========================================"
