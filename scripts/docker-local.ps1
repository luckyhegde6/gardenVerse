<#
.SYNOPSIS
    Start local development environment (Docker + apps)
.DESCRIPTION
    Starts Postgres/Redis via Docker, then launches Backend and Admin dev servers.
    Use -InfraOnly to skip app startup, -ProdDebug to use Supabase config.
.PARAMETER InfraOnly
    Only start Docker infrastructure, skip apps
.PARAMETER ProdDebug
    Use Supabase production config instead of local Docker DB
.PARAMETER SkipBackend
    Skip starting the backend dev server
.PARAMETER SkipAdmin
    Skip starting the admin dev server
.EXAMPLE
    .\scripts\docker-local.ps1
    .\scripts\docker-local.ps1 -InfraOnly
    .\scripts\docker-local.ps1 -ProdDebug
#>

param(
    [switch]$InfraOnly,
    [switch]$ProdDebug,
    [switch]$SkipBackend,
    [switch]$SkipAdmin
)

$RootDir = Split-Path -Parent $PSScriptRoot
$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GardenVerse - Local Dev Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Start Docker infrastructure
Write-Host "`n[1/3] Starting Docker infrastructure..." -ForegroundColor Yellow
if ($ProdDebug) {
    Write-Host "  → Prod debug mode: Docker infra only for Redis" -ForegroundColor Magenta
    docker compose -f "$RootDir/docker-compose.local.yml" up -d redis
} else {
    docker compose -f "$RootDir/docker-compose.local.yml" up -d
}
Write-Host "  ✓ Docker containers started" -ForegroundColor Green

# Wait for health checks
Write-Host "  Waiting for services to be healthy..." -NoNewline
$timeout = 30
$elapsed = 0
while ($elapsed -lt $timeout) {
    $pg = docker inspect gardenverse-postgres --format='{{.State.Health.Status}}' 2>$null
    $rd = docker inspect gardenverse-redis --format='{{.State.Health.Status}}' 2>$null
    if ($pg -eq 'healthy' -and $rd -eq 'healthy') {
        Write-Host " OK" -ForegroundColor Green
        break
    }
    Start-Sleep -Seconds 2
    $elapsed += 2
    Write-Host "." -NoNewline
}
if ($elapsed -ge $timeout) {
    Write-Host " TIMEOUT" -ForegroundColor Red
    Write-Host "  ⚠ Services may not be fully ready - check 'docker ps'" -ForegroundColor Yellow
}

# 2. Set up environment variables
Write-Host "`n[2/3] Setting up environment..." -ForegroundColor Yellow
if ($ProdDebug) {
    Write-Host "  → Using Supabase production config (from .env.local)" -ForegroundColor Magenta
    # In prod debug mode, the .env.local has Supabase URLs - just ensure it's sourced
} else {
    Write-Host "  → Using local Docker DB (postgres://localhost:5432)" -ForegroundColor Green
}
Write-Host "  ✓ Environment configured" -ForegroundColor Green

if ($InfraOnly) {
    Write-Host "`n✓ Infra-only mode - apps not started" -ForegroundColor Green
    Write-Host "  Docker: Postgres:5432  Redis:6379" -ForegroundColor Gray
    Write-Host "  Run apps manually: npm run backend:dev / admin:dev" -ForegroundColor Gray
    return
}

# 3. Start apps
Write-Host "`n[3/3] Starting applications..." -ForegroundColor Yellow

if (-not $SkipBackend) {
    Write-Host "  → Starting Backend (port 3001)..." -ForegroundColor Green
    $backendJob = Start-Job -ScriptBlock {
        param($dir) Set-Location $dir; npm.cmd run start:dev
    } -ArgumentList "$RootDir/packages/backend"
    Start-Sleep -Seconds 5
}

if (-not $SkipAdmin) {
    Write-Host "  → Starting Admin Dashboard (port 3000)..." -ForegroundColor Green
    $adminJob = Start-Job -ScriptBlock {
        param($dir) Set-Location $dir; npm.cmd run dev
    } -ArgumentList "$RootDir/packages/admin"
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Environment Ready!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Postgres: localhost:5432"
Write-Host "  Redis:    localhost:6379"
if (-not $SkipBackend -and -not $ProdDebug) {
    Write-Host "  Backend:  http://localhost:3001"
    Write-Host "  Swagger:  http://localhost:3001/api/docs"
}
if (-not $SkipAdmin) {
    Write-Host "  Admin:    http://localhost:3000"
}
Write-Host ""

if ($ProdDebug) {
    Write-Host "  ⚠ PROD DEBUG MODE - DB points to Supabase production" -ForegroundColor Magenta
    Write-Host "  ⚠ Be careful not to run destructive operations!" -ForegroundColor Magenta
}
