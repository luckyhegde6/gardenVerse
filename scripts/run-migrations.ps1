<#
.SYNOPSIS
    Run Prisma migrations and generate client.
.DESCRIPTION
    Applies pending migrations, generates Prisma client, and optionally seeds the database.
.PARAMETER Reset
    Reset the database (drop all data and re-run all migrations)
.PARAMETER Seed
    Also seed the database after migration
.PARAMETER Name
    Name for the new migration (required for schema changes)
.EXAMPLE
    .\scripts\run-migrations.ps1
    .\scripts\run-migrations.ps1 -Reset
    .\scripts\run-migrations.ps1 -Seed -Name "add-plant-model"
#>

param(
    [switch]$Reset,
    [switch]$Seed,
    [string]$Name = ""
)

$RootDir = Split-Path -Parent $PSScriptRoot
$ErrorActionPreference = "Stop"
$env:DATABASE_URL = 'postgresql://gardenverse:gardenverse123@localhost:5432/gardenverse?schema=public'

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GardenVerse - Database Migrations" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if ($Reset) {
    Write-Host "`n[RESET MODE] - This will DROP ALL DATA!" -ForegroundColor Red
    $confirm = Read-Host "Are you sure? (Type 'reset' to confirm)"
    if ($confirm -ne 'reset') {
        Write-Host "Cancelled." -ForegroundColor Yellow
        exit 0
    }

    Write-Host "`n[1/4] Dropping database..." -ForegroundColor Yellow
    docker exec gardenverse-postgres psql -U gardenverse -d postgres -c "DROP DATABASE IF EXISTS gardenverse;" 2>$null
    docker exec gardenverse-postgres psql -U gardenverse -d postgres -c "CREATE DATABASE gardenverse;"
    Write-Host "  ✓ Database recreated" -ForegroundColor Green

    Write-Host "`n[2/4] Running initial migration..." -ForegroundColor Yellow
    & node "$RootDir/node_modules/prisma/build/index.js" migrate dev --name init --schema="$RootDir/packages/backend/prisma/schema.prisma"
    Write-Host "  ✓ Migration applied" -ForegroundColor Green
} else {
    Write-Host "`n[1/3] Running migrations..." -ForegroundColor Yellow
    if ($Name) {
        & node "$RootDir/node_modules/prisma/build/index.js" migrate dev --name "$Name" --schema="$RootDir/packages/backend/prisma/schema.prisma"
    } else {
        & node "$RootDir/node_modules/prisma/build/index.js" migrate dev --schema="$RootDir/packages/backend/prisma/schema.prisma"
    }
    Write-Host "  ✓ Migrations applied" -ForegroundColor Green
}

Write-Host "`n[2/3] Generating Prisma client..." -ForegroundColor Yellow
& node "$RootDir/node_modules/prisma/build/index.js" generate --schema="$RootDir/packages/backend/prisma/schema.prisma"
Write-Host "  ✓ Client generated" -ForegroundColor Green

if ($Seed) {
    Write-Host "`n[3/3] Seeding database..." -ForegroundColor Yellow
    & node "$RootDir/scripts/seed-data.js"
    Write-Host "  ✓ Database seeded" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Migrations Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
