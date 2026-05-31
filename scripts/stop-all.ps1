<#
.SYNOPSIS
    Stop all GardenVerse services and clean up.
.DESCRIPTION
    Stops Docker containers, kills only GardenVerse Node.js processes (backend/admin/mobile).
    Never kills opencode, MCP servers, or other non-GardenVerse node processes.
.PARAMETER KeepDocker
    Keep Docker containers running (only stop Node apps)
.PARAMETER Force
    Force kill GardenVerse Node processes without confirmation
.PARAMETER All
    Kill ALL node processes indiscriminately (use with caution)
.EXAMPLE
    .\scripts\stop-all.ps1
    .\scripts\stop-all.ps1 -KeepDocker
    .\scripts\stop-all.ps1 -Force
#>

param(
    [switch]$KeepDocker,
    [switch]$Force,
    [switch]$All
)

$RootDir = (Resolve-Path "$PSScriptRoot/..").Path

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GardenVerse - Stop All Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Stop GardenVerse Node apps
Write-Host "`n[1/2] Stopping GardenVerse Node.js applications..." -ForegroundColor Yellow

$allNodeProcesses = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'"

if ($All) {
    $targetProcesses = $allNodeProcesses
    Write-Host "  (Killing ALL node processes)" -ForegroundColor Magenta
} else {
    $targetProcesses = $allNodeProcesses | Where-Object {
        $_.CommandLine -match "gardenverse" -or
        $_.CommandLine -match "packages/backend" -or
        $_.CommandLine -match "packages/admin" -or
        $_.CommandLine -match "packages/mobile" -or
        $_.CommandLine -match "\\expo\\" -or
        $_.CommandLine -match "\\next\\" -or
        $_.CommandLine -match "@nestjs" -or
        $_.CommandLine -match "nest\.js"
    }
}

if ($targetProcesses) {
    $count = ($targetProcesses | Measure-Object).Count
    if ($Force) {
        $targetProcesses | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
        Write-Host "  ✓ $count GardenVerse Node process(es) killed" -ForegroundColor Green
    } else {
        Write-Host "  Found $count GardenVerse Node process(es)."
        $targetProcesses | ForEach-Object {
            Write-Host "    PID $($_.ProcessId): $($_.CommandLine.Substring(0, [Math]::Min(80, $_.CommandLine.Length)))" -ForegroundColor Gray
        }
        $confirm = Read-Host "  Kill these processes? (y/N)"
        if ($confirm -eq 'y' -or $confirm -eq 'Y') {
            $targetProcesses | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
            Write-Host "  ✓ GardenVerse Node processes killed" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ Skipped" -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "  No GardenVerse Node.js processes found" -ForegroundColor Gray
}

# Stop Docker
if (-not $KeepDocker) {
    Write-Host "`n[2/2] Stopping Docker containers..." -ForegroundColor Yellow
    docker compose -f "$RootDir/docker-compose.local.yml" down --remove-orphans --volumes
    if ($?) {
        Write-Host "  ✓ Docker containers stopped and cleaned" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Could not stop Docker (may not be running)" -ForegroundColor Yellow
    }
} else {
    Write-Host "`n[2/2] Keeping Docker containers running (-KeepDocker)" -ForegroundColor Yellow
    Write-Host "  Postgres:5432  Redis:6379" -ForegroundColor Gray
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  All services stopped" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
