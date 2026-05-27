<#
.SYNOPSIS
    Stop all GardenVerse services and clean up.
.DESCRIPTION
    Stops Docker containers, kills Node.js processes for backend/admin, and cleans up.
.PARAMETER KeepDocker
    Keep Docker containers running (only stop Node apps)
.PARAMETER Force
    Force kill all Node processes without confirmation
.EXAMPLE
    .\scripts\stop-all.ps1
    .\scripts\stop-all.ps1 -KeepDocker
#>

param(
    [switch]$KeepDocker,
    [switch]$Force
)

$RootDir = Split-Path -Parent $PSScriptRoot

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GardenVerse - Stop All Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Stop Node apps
Write-Host "`n[1/2] Stopping Node.js applications..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    $count = ($nodeProcesses | Measure-Object).Count
    if ($Force) {
        $nodeProcesses | Stop-Process -Force
        Write-Host "  ✓ $count Node process(es) killed" -ForegroundColor Green
    } else {
        Write-Host "  Found $count Node process(es)."
        $confirm = Read-Host "  Kill all Node processes? (y/N)"
        if ($confirm -eq 'y' -or $confirm -eq 'Y') {
            $nodeProcesses | Stop-Process -Force
            Write-Host "  ✓ Node processes killed" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ Skipped" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "  No Node.js processes found" -ForegroundColor Gray
}

# Stop Docker
if (-not $KeepDocker) {
    Write-Host "`n[2/2] Stopping Docker containers..." -ForegroundColor Yellow
    try {
        docker compose -f "$RootDir/docker-compose.local.yml" down
        Write-Host "  ✓ Docker containers stopped" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠ Could not stop Docker (may not be running)" -ForegroundColor Yellow
    }
} else {
    Write-Host "`n[2/2] Keeping Docker containers running (-KeepDocker)" -ForegroundColor Yellow
    Write-Host "  Postgres:5432  Redis:6379" -ForegroundColor Gray
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  All services stopped" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
