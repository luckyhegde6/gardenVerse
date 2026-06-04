# GardenVerse Production Deploy — Unified Next.js App + Mobile
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
# 1. BUILD UNIFIED APP
# ============================================
if (-not $SkipBuild) {
  Write-Output "[1/3] Building admin dashboard (Next.js = UI + API)..."

  # Generate Prisma client and apply migrations
  npm run prisma:generate
  if ($LASTEXITCODE -ne 0) { Write-Error "Prisma generate failed"; exit 1 }

  npm run admin:build
  if ($LASTEXITCODE -ne 0) { Write-Error "Admin build failed"; exit 1 }
}

# ============================================
# 2. DEPLOY TO VERCEL
# ============================================
Write-Output "[2/3] Deploying to Vercel (dashboard + API routes)..."
if ($Prod) {
  vercel deploy --prod --yes
} else {
  vercel deploy --yes
}
if ($LASTEXITCODE -ne 0) { Write-Error "Vercel deploy failed"; exit 1 }

# ============================================
# 3. MOBILE APP (separate process)
# ============================================
Write-Output "[3/3] Mobile App (run separately)"
Write-Output ""
Write-Output "  eas build --platform ios --profile production"
Write-Output "  eas build --platform android --profile production"
Write-Output "  eas submit --platform ios"
Write-Output "  eas submit --platform android"
Write-Output ""

Write-Output "========================================"
Write-Output " Required Environment Variables (Vercel)"
Write-Output "========================================"
Write-Output ""
Write-Output "  NEXT_PUBLIC_API_URL=/api/v1"
Write-Output "  NEXTAUTH_URL=https://gardenverse.vercel.app"
Write-Output "  NEXTAUTH_SECRET=<generate>"
Write-Output "  DATABASE_URL=postgresql://postgres:pass@db.[ref].supabase.co:6543/postgres?pgbouncer=true"
Write-Output "  DIRECT_URL=postgresql://postgres:pass@db.[ref].supabase.co:5432/postgres"
Write-Output "  JWT_SECRET=<generate: openssl rand -base64 64>"
Write-Output "  JWT_REFRESH_SECRET=<generate: openssl rand -base64 64>"
Write-Output "  WEATHER_API_KEY=<openweathermap-key>"
Write-Output "  GOOGLE_MAPS_API_KEY=<google-maps-key>"
Write-Output ""

Write-Output "========================================"
Write-Output " Done!"
Write-Output "========================================"
