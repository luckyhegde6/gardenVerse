<#
.SYNOPSIS
    Database diagnostic and repair tool.
.DESCRIPTION
    Inspects database state, checks for common issues, and optionally repairs them.
    Use this to diagnose migration issues, data inconsistencies, or connection problems.
.PARAMETER Inspect
    Inspect database state (tables, row counts, migration status)
.PARAMETER Repair
    Attempt to repair common issues (connection pools, stale migrations)
.PARAMETER Analyze
    Run EXPLAIN ANALYZE on slow queries
.PARAMETER All
    Run all diagnostic checks
.EXAMPLE
    .\scripts\db-diagnostic.ps1 -Inspect
    .\scripts\db-diagnostic.ps1 -All
#>

param(
    [switch]$Inspect,
    [switch]$Repair,
    [switch]$Analyze,
    [switch]$All
)

$RootDir = Split-Path -Parent $PSScriptRoot
$ErrorActionPreference = "Continue"

if ($All) {
    $Inspect = $true
    $Repair = $true
    $Analyze = $true
}

if (-not ($Inspect -or $Repair -or $Analyze)) {
    $Inspect = $true
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GardenVerse - Database Diagnostic" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Check Docker connectivity
try {
    $pgHealthy = docker inspect gardenverse-postgres --format='{{.State.Health.Status}}' 2>$null
    Write-Host "`nDocker Postgres: $pgHealthy" -ForegroundColor $(if($pgHealthy -eq 'healthy'){'Green'}else{'Red'})
} catch {
    Write-Host "`nDocker Postgres: NOT RUNNING" -ForegroundColor Red
    Write-Host "Start with: npm run docker:local" -ForegroundColor Yellow
    exit 1
}

if ($Inspect) {
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  INSPECTION" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

    # Prisma migration status
    Write-Host "`n[Migration Status]:" -ForegroundColor Yellow
    $env:DATABASE_URL = 'postgresql://gardenverse:gardenverse123@localhost:5432/gardenverse?schema=public'
    $migrateStatus = & node "$RootDir/node_modules/prisma/build/index.js" migrate status --schema="$RootDir/packages/backend/prisma/schema.prisma" 2>&1
    Write-Host $migrateStatus

    # Table list and row counts
    Write-Host "`n[Tables]:" -ForegroundColor Yellow
    $tables = docker exec gardenverse-postgres psql -U gardenverse -d gardenverse -t -c "SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public' ORDER BY tablename;" 2>$null
    foreach ($table in $tables) {
        if ($table.Trim() -ne '') {
            $count = docker exec gardenverse-postgres psql -U gardenverse -d gardenverse -t -c "SELECT COUNT(*) FROM ""$($table.Trim())"";" 2>$null
            Write-Host "  $($table.Trim()) → $($count.Trim()) rows"
        }
    }

    # Database size
    Write-Host "`n[Database Size]:" -ForegroundColor Yellow
    $dbSize = docker exec gardenverse-postgres psql -U gardenverse -d gardenverse -t -c "SELECT pg_size_pretty(pg_database_size('gardenverse'));" 2>$null
    Write-Host "  gardenverse: $($dbSize.Trim())"

    # Connection count
    Write-Host "`n[Connections]:" -ForegroundColor Yellow
    $connections = docker exec gardenverse-postgres psql -U gardenverse -d gardenverse -t -c "SELECT count(*) FROM pg_stat_activity WHERE datname = 'gardenverse';" 2>$null
    Write-Host "  Active connections: $($connections.Trim())"
}

if ($Repair) {
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  REPAIR" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

    # VACUUM ANALYZE
    Write-Host "`n[Running VACUUM ANALYZE]..." -ForegroundColor Yellow
    docker exec gardenverse-postgres psql -U gardenverse -d gardenverse -c "VACUUM ANALYZE;" 2>$null
    Write-Host "  ✓ VACUUM ANALYZE completed" -ForegroundColor Green

    # Re-index
    Write-Host "`n[Running REINDEX]..." -ForegroundColor Yellow
    docker exec gardenverse-postgres psql -U gardenverse -d gardenverse -c "REINDEX DATABASE gardenverse;" 2>$null
    Write-Host "  ✓ REINDEX completed" -ForegroundColor Green

    # Kill idle connections
    Write-Host "`n[Terminating idle connections]..." -ForegroundColor Yellow
    docker exec gardenverse-postgres psql -U gardenverse -d gardenverse -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'gardenverse' AND state = 'idle' AND pid <> pg_backend_pid();" 2>$null
    Write-Host "  ✓ Idle connections terminated" -ForegroundColor Green
}

if ($Analyze) {
    Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  QUERY ANALYSIS" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

    # Slow queries
    Write-Host "`n[Slow Queries (>100ms)]:" -ForegroundColor Yellow
    $slow = docker exec gardenverse-postgres psql -U gardenverse -d gardenverse -c "SELECT query, calls, total_exec_time, mean_exec_time FROM pg_stat_statements WHERE mean_exec_time > 100 ORDER BY mean_exec_time DESC LIMIT 10;" 2>$null
    if ($slow -match '0 rows') {
        Write-Host "  No slow queries detected" -ForegroundColor Green
    } else {
        Write-Host $slow
    }

    # Table stats
    Write-Host "`n[Table Statistics]:" -ForegroundColor Yellow
    $tableStats = docker exec gardenverse-postgres psql -U gardenverse -d gardenverse -c "SELECT relname, n_live_tup, n_dead_tup, last_autovacuum FROM pg_stat_user_tables ORDER BY n_dead_tup DESC LIMIT 10;" 2>$null
    Write-Host $tableStats
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Diagnostic Complete" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
