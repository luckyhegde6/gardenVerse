<#
.SYNOPSIS
    Health check for all GardenVerse services.
.DESCRIPTION
    Checks Docker containers, backend API, admin dashboard, and database connectivity.
    Returns exit code 0 if all healthy, 1 if any service is down.
.PARAMETER Quiet
    Only output errors, no success messages
.PARAMETER Timeout
    HTTP request timeout in seconds (default 5)
.EXAMPLE
    .\scripts\health-check.ps1
    .\scripts\health-check.ps1 -Quiet
#>

param(
    [switch]$Quiet,
    [int]$Timeout = 5
)

$RootDir = Split-Path -Parent $PSScriptRoot
$exitCode = 0

function Check-Http {
    param($Name, $Url, $ExpectedStatus = 200)
    try {
        $response = Invoke-WebRequest -Uri $Url -TimeoutSec $Timeout -Method GET -ErrorAction Stop
        if ($response.StatusCode -eq $ExpectedStatus) {
            if (-not $script:Quiet) { Write-Host "  ✓ $Name - UP ($Url)" -ForegroundColor Green }
            return $true
        } else {
            Write-Host "  ✗ $Name - UNEXPECTED STATUS $($response.StatusCode)" -ForegroundColor Red
            $script:exitCode = 1
            return $false
        }
    } catch {
        Write-Host "  ✗ $Name - DOWN ($Url): $_" -ForegroundColor Red
        $script:exitCode = 1
        return $false
    }
}

function Check-Docker {
    param($ContainerName)
    try {
        $status = docker inspect $ContainerName --format='{{.State.Health.Status}}' 2>$null
        if ($status -eq 'healthy') {
            if (-not $script:Quiet) { Write-Host "  ✓ Docker $ContainerName - HEALTHY" -ForegroundColor Green }
            return $true
        } else {
            Write-Host "  ✗ Docker $ContainerName - $status" -ForegroundColor Red
            $script:exitCode = 1
            return $false
        }
    } catch {
        Write-Host "  ✗ Docker $ContainerName - NOT FOUND" -ForegroundColor Red
        $script:exitCode = 1
        return $false
    }
}

if (-not $Quiet) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  GardenVerse - Health Check" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
}

# Docker containers
if (-not $Quiet) { Write-Host "`nDocker:" -ForegroundColor Yellow }
Check-Docker "gardenverse-postgres"
Check-Docker "gardenverse-redis"

# HTTP services
if (-not $Quiet) { Write-Host "`nHTTP Services:" -ForegroundColor Yellow }
Check-Http "Backend API" "http://localhost:3001/api/docs" 200
Check-Http "Admin Dashboard" "http://localhost:3000" 200

# Database connectivity
if (-not $Quiet) { Write-Host "`nDatabase:" -ForegroundColor Yellow }
try {
    $result = docker exec gardenverse-postgres pg_isready -U gardenverse 2>$null
    if ($LASTEXITCODE -eq 0) {
        if (-not $Quiet) { Write-Host "  ✓ PostgreSQL - ACCEPTING CONNECTIONS" -ForegroundColor Green }
    } else {
        Write-Host "  ✗ PostgreSQL - NOT RESPONDING" -ForegroundColor Red
        $exitCode = 1
    }
} catch {
    Write-Host "  ⚠ PostgreSQL - Could not check (container may not be running)" -ForegroundColor Yellow
}

# Prisma migration status
if (-not $Quiet) { Write-Host "`nMigrations:" -ForegroundColor Yellow }
try {
    $env:DATABASE_URL = 'postgresql://gardenverse:gardenverse123@localhost:5432/gardenverse?schema=public'
    $migrateStatus = & node "$RootDir/node_modules/prisma/build/index.js" migrate status --schema="$RootDir/packages/backend/prisma/schema.prisma" 2>&1
    if ($LASTEXITCODE -eq 0) {
        if (-not $Quiet) { Write-Host "  ✓ Prisma migrations - UP TO DATE" -ForegroundColor Green }
    } else {
        Write-Host "  ⚠ Prisma migrations - NEEDS ATTENTION" -ForegroundColor Yellow
        Write-Host "    Run: npm run prisma:migrate" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ⚠ Prisma - Could not check" -ForegroundColor Yellow
}

if (-not $Quiet) {
    Write-Host "`n========================================" -ForegroundColor Cyan
    if ($exitCode -eq 0) {
        Write-Host "  Result: ALL HEALTHY" -ForegroundColor Green
    } else {
        Write-Host "  Result: SOME SERVICES DOWN" -ForegroundColor Red
    }
    Write-Host "========================================" -ForegroundColor Cyan
}

exit $exitCode
