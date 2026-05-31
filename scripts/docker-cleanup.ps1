<#
.SYNOPSIS
    Full Docker cleanup for GardenVerse - removes containers, volumes, networks, and images.
.DESCRIPTION
    Performs a thorough Docker cleanup:
    - Stops and removes gardenverse containers
    - Removes associated volumes (postgres_data, redis_data) 
    - Removes the gardenverse-network
    - Prunes dangling images and builder cache
    - Does NOT touch global Docker state (keep healthy images)
.PARAMETER All
    Also prune unused images and rebuild cache (more thorough)
.PARAMETER Force
    Skip confirmation prompts
.EXAMPLE
    .\scripts\docker-cleanup.ps1
    .\scripts\docker-cleanup.ps1 -All
    .\scripts\docker-cleanup.ps1 -Force
#>

param(
    [switch]$All,
    [switch]$Force
)

$composeFile = (Resolve-Path "$PSScriptRoot/../docker-compose.local.yml").Path

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GardenVerse - Docker Cleanup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Confirm
if (-not $Force) {
    Write-Host "  This will remove all gardenverse containers and volumes." -ForegroundColor Yellow
    Write-Host "  Postgres and Redis data will be LOST." -ForegroundColor Red
    $confirm = Read-Host "`n  Continue? (y/N)"
    if ($confirm -ne 'y' -and $confirm -ne 'Y') {
        Write-Host "  Cancelled." -ForegroundColor Gray
        return
    }
}

# Step 1: Stop and remove containers
Write-Host "`n[1/4] Stopping and removing containers..." -ForegroundColor Yellow
docker compose -f $composeFile down --remove-orphans --volumes 2>$null
docker rm -f gardenverse-postgres gardenverse-redis 2>$null
Write-Host "  ✓ Containers removed" -ForegroundColor Green

# Step 2: Remove volumes
Write-Host "`n[2/4] Removing volumes..." -ForegroundColor Yellow
docker volume rm gardenverse_postgres_data gardenverse_redis_data 2>$null
docker volume rm postgres_data redis_data 2>$null
docker volume ls --filter "name=gardenverse" -q | ForEach-Object { docker volume rm $_ 2>$null }
Write-Host "  ✓ Volumes removed" -ForegroundColor Green

# Step 3: Remove network
Write-Host "`n[3/4] Removing network..." -ForegroundColor Yellow
docker network rm gardenverse-network 2>$null
Write-Host "  ✓ Network removed" -ForegroundColor Green

# Step 4: Optional full prune
if ($All) {
    Write-Host "`n[4/4] Pruning Docker system..." -ForegroundColor Yellow
    docker builder prune -f 2>$null
    docker image prune -f --filter "until=24h" 2>$null
    Write-Host "  ✓ Docker pruned" -ForegroundColor Green
} else {
    Write-Host "`n[4/4] Skipping system prune (use -All for full cleanup)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Cleanup complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Run '.\scripts\docker-local.ps1' to restart fresh." -ForegroundColor Gray
