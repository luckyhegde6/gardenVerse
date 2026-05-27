<#
.SYNOPSIS
    Reset local development database (Docker Postgres)
.DESCRIPTION
    Drops and recreates the Postgres database, runs Prisma migrations, and seeds data.
.PARAMETER SkipSeed
    Skip running seed data after reset
.PARAMETER Force
    Skip confirmation prompt
.EXAMPLE
    .\scripts\reset-db.ps1
    .\scripts\reset-db.ps1 -SkipSeed
    .\scripts\reset-db.ps1 -Force
#>

param(
    [switch]$SkipSeed,
    [switch]$Force
)

$RootDir = Split-Path -Parent $PSScriptRoot
$ErrorActionPreference = "Stop"

if (-not $Force) {
    $confirm = Read-Host "This will DROP all data in the gardenverse database. Continue? (y/N)"
    if ($confirm -ne 'y' -and $confirm -ne 'Y') {
        Write-Host "Cancelled." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GardenVerse - Database Reset" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# 1. Drop and recreate database
Write-Host "`n[1/4] Dropping and recreating database..." -ForegroundColor Yellow
docker exec gardenverse-postgres psql -U gardenverse -d postgres -c "DROP DATABASE IF EXISTS gardenverse;" 2>$null
docker exec gardenverse-postgres psql -U gardenverse -d postgres -c "CREATE DATABASE gardenverse;"
Write-Host "  ✓ Database recreated" -ForegroundColor Green

# 2. Run Prisma migrations
Write-Host "`n[2/4] Running Prisma migrations..." -ForegroundColor Yellow
$env:DATABASE_URL = 'postgresql://gardenverse:gardenverse123@localhost:5432/gardenverse?schema=public'
& node "$RootDir/node_modules/prisma/build/index.js" migrate dev --name reset --schema="$RootDir/packages/backend/prisma/schema.prisma"
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ✗ Migration failed" -ForegroundColor Red
    exit 1
}
Write-Host "  ✓ Migrations applied" -ForegroundColor Green

# 3. Generate Prisma client
Write-Host "`n[3/4] Generating Prisma client..." -ForegroundColor Yellow
& node "$RootDir/node_modules/prisma/build/index.js" generate --schema="$RootDir/packages/backend/prisma/schema.prisma"
Write-Host "  ✓ Client generated" -ForegroundColor Green

# 4. Seed data
if (-not $SkipSeed) {
    Write-Host "`n[4/4] Seeding database..." -ForegroundColor Yellow
    & node "$RootDir/scripts/seed-data.js"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ✗ Seed failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "  ✓ Database seeded" -ForegroundColor Green
} else {
    Write-Host "`n[4/4] Skipped (no seed)" -ForegroundColor Yellow
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Database Reset Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test credentials:"
Write-Host "    Admin: admin@gardenverse.io / Admin@123456"
Write-Host "    User:  test@gardenverse.io / Test@123456"
