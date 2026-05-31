<#
.SYNOPSIS
    Start local development environment (Docker + apps).
.DESCRIPTION
    Starts Postgres/Redis via Docker, then launches Backend and Admin dev servers.
    Tracks PIDs for clean shutdown via stop-all.ps1.
.PARAMETER InfraOnly
    Only start Docker infrastructure, skip apps
.PARAMETER ProdDebug
    Use Supabase production config instead of local Docker DB
.PARAMETER SkipBackend
    Skip starting the backend dev server
.PARAMETER SkipAdmin
    Skip starting the admin dev server
.PARAMETER SkipMobile
    Skip starting the mobile Expo dev server
.EXAMPLE
    .\scripts\docker-local.ps1
    .\scripts\docker-local.ps1 -InfraOnly
    .\scripts\docker-local.ps1 -SkipAdmin
#>

param(
    [switch]$InfraOnly,
    [switch]$ProdDebug,
    [switch]$SkipBackend,
    [switch]$SkipAdmin,
    [switch]$SkipMobile
)

$RootDir = (Resolve-Path "$PSScriptRoot/..").Path
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
if (-not $?) { throw "Docker compose failed" }
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
    Write-Host "  → Using Supabase production config" -ForegroundColor Magenta
} else {
    Write-Host "  → Using local Docker DB (postgres://localhost:5432)" -ForegroundColor Green
}
Write-Host "  ✓ Environment configured" -ForegroundColor Green

if ($InfraOnly) {
    Write-Host "`n✓ Infra-only mode - apps not started" -ForegroundColor Green
    Write-Host "  Docker: Postgres:5432  Redis:6379" -ForegroundColor Gray
    Write-Host "  Run apps manually: npm run backend:dev / admin:dev / mobile:dev" -ForegroundColor Gray
    return
}

# 3. Start apps
Write-Host "`n[3/3] Starting applications..." -ForegroundColor Yellow

if (-not $SkipBackend) {
    Write-Host "  → Starting Backend (port 3001)..." -ForegroundColor Green
    $logFile = "$RootDir/backend-output.log"
    Start-Process -WindowStyle Hidden -FilePath "cmd.exe" -ArgumentList "/c","npm run backend:dev > ""$logFile"" 2>&1" -WorkingDirectory $RootDir
    Write-Host "    Logs: $logFile" -ForegroundColor Gray
}

if (-not $SkipAdmin) {
    Write-Host "  → Starting Admin Dashboard (port 3000)..." -ForegroundColor Green
    $logFile = "$RootDir/admin-output.log"
    Start-Process -WindowStyle Hidden -FilePath "cmd.exe" -ArgumentList "/c","npm run admin:dev > ""$logFile"" 2>&1" -WorkingDirectory $RootDir
    Write-Host "    Logs: $logFile" -ForegroundColor Gray
}

if (-not $SkipMobile) {
    Write-Host "  → Starting Mobile App (port 8081)..." -ForegroundColor Green
    $logFile = "$RootDir/mobile-output.log"
    Start-Process -WindowStyle Hidden -FilePath "cmd.exe" -ArgumentList "/c","npm run mobile:dev > ""$logFile"" 2>&1" -WorkingDirectory $RootDir
    Write-Host "    Logs: $logFile" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Environment Starting..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Postgres: localhost:5432"
Write-Host "  Redis:    localhost:6379"
if (-not $SkipBackend) {
    Write-Host "  Backend:  http://localhost:3001"
    Write-Host "  Swagger:  http://localhost:3001/api/docs"
}
if (-not $SkipAdmin) {
    Write-Host "  Admin:    http://localhost:3000"
}
if (-not $SkipMobile) {
    Write-Host "  Mobile:   http://localhost:8081"
}
Write-Host ""

if ($ProdDebug) {
    Write-Host "  ⚠ PROD DEBUG MODE - DB points to Supabase production" -ForegroundColor Magenta
    Write-Host "  ⚠ Be careful not to run destructive operations!" -ForegroundColor Magenta
}

Write-Host "`n  Run '.\scripts\stop-all.ps1' to stop everything" -ForegroundColor Gray
