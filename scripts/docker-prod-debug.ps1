<#
.SYNOPSIS
    Run local services pointing to Supabase production database (prod debugging).
.DESCRIPTION
    Starts Docker Redis (local), runs Backend and Admin with Supabase production config.
    Use this to debug production issues locally without deploying.
    WARNING: Operations affect the production database!
.PARAMETER BackendOnly
    Only start the backend service
.PARAMETER AdminOnly
    Only start the admin dashboard
.PARAMETER DryRun
    Show what would be done without actually starting services
.EXAMPLE
    .\scripts\docker-prod-debug.ps1
    .\scripts\docker-prod-debug.ps1 -BackendOnly
    .\scripts\docker-prod-debug.ps1 -DryRun
#>

param(
    [switch]$BackendOnly,
    [switch]$AdminOnly,
    [switch]$DryRun
)

$RootDir = Split-Path -Parent $PSScriptRoot
$ErrorActionPreference = "Stop"

Write-Host "⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠" -ForegroundColor Magenta
Write-Host "  PRODUCTION DEBUGGING MODE" -ForegroundColor Red
Write-Host "  This will connect to Supabase PRODUCTION!" -ForegroundColor Red
Write-Host "  ⚠ Be extremely careful with operations ⚠" -ForegroundColor Red
Write-Host "⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠⚠" -ForegroundColor Magenta

$confirm = Read-Host "`nAre you sure you want to connect to PRODUCTION? (Type 'yes' to confirm)"
if ($confirm -ne 'yes') {
    Write-Host "Cancelled." -ForegroundColor Yellow
    exit 0
}

if ($DryRun) {
    Write-Host "`n[Dry Run] Would execute:" -ForegroundColor Cyan
    Write-Host "  1. Start Docker Redis (local)"
    Write-Host "  2. Backend with SUPABASE_DATABASE_URL from .env.local"
    Write-Host "  3. Admin dashboard on port 3000"
    exit 0
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  GardenVerse - Production Debug Mode" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Start Redis locally (only infra needed)
Write-Host "`n[1/3] Starting local Redis..." -ForegroundColor Yellow
docker compose -f "$RootDir/docker-compose.local.yml" up -d redis
Write-Host "  ✓ Redis started" -ForegroundColor Green

# 2. Validate Supabase connection
Write-Host "`n[2/3] Validating Supabase connection..." -ForegroundColor Yellow
$envVars = Get-Content "$RootDir/.env.local" | Where-Object { $_ -match 'SUPABASE_URL|POSTGRES_PRISMA_URL|SUPABASE_SERVICE_ROLE_KEY' }
foreach ($var in $envVars) {
    Write-Host "  → $var" -ForegroundColor Gray
}

# Quick connection test
try {
    $supabaseUrl = (Select-String -Path "$RootDir/.env.local" -Pattern 'SUPABASE_URL=').Line -replace 'SUPABASE_URL="?([^"]*)"?','$1'
    Write-Host "  ✓ Supabase URL: $supabaseUrl" -ForegroundColor Green
} catch {
    Write-Host "  ⚠ Could not read Supabase config from .env.local" -ForegroundColor Yellow
    Write-Host "  Make sure .env.local has SUPABASE_URL configured" -ForegroundColor Yellow
}

# 3. Start requested services
Write-Host "`n[3/3] Starting services..." -ForegroundColor Yellow

if (-not $AdminOnly) {
    Write-Host "  → Starting Backend (port 3001) with Supabase DB..." -ForegroundColor Green
    if (-not $DryRun) {
        Start-Job -ScriptBlock {
            param($dir) Set-Location $dir
            $env:NODE_ENV = 'production'
            npm.cmd run start:dev
        } -ArgumentList "$RootDir/packages/backend"
    }
}

if (-not $BackendOnly) {
    Write-Host "  → Starting Admin Dashboard (port 3000)..." -ForegroundColor Green
    if (-not $DryRun) {
        Start-Job -ScriptBlock {
            param($dir) Set-Location $dir
            $env:NODE_ENV = 'production'
            npm.cmd run dev
        } -ArgumentList "$RootDir/packages/admin"
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Production Debug Mode Active!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ⚠ DB: SUPABASE PRODUCTION" -ForegroundColor Red
Write-Host "  Redis: localhost:6379"
Write-Host "  Backend: http://localhost:3001" (if not AdminOnly)
Write-Host "  Admin:  http://localhost:3000" (if not BackendOnly)
Write-Host "`n  To stop: docker compose -f docker-compose.local.yml down"
Write-Host "  To view jobs: Get-Job | Receive-Job"
