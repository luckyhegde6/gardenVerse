param(
  [switch]$Build,
  [switch]$Watch,
  [string]$LogFile = "F:\Local_git\gardenVerse\packages\backend\server-startup.log",
  [string]$PidFile = "F:\Local_git\gardenVerse\packages\backend\.backend.pid"
)

$ErrorActionPreference = "Stop"
$BackendDir = "F:\Local_git\gardenVerse\packages\backend"
$DistMain = "$BackendDir\dist\main.js"

Write-Host "=== GardenVerse Backend Starter ===" -ForegroundColor Cyan

# 1. Kill any existing process on port 3001
Write-Host "[1/5] Cleaning port 3001..." -ForegroundColor Yellow
$existingProc = netstat -ano | Select-String ":3001"
foreach ($line in $existingProc) {
  $parts = $line.Line.Split() | Where-Object { $_ -ne "" }
  if ($parts.Count -ge 5) {
    $procId = $parts[-1]
    if ($procId -and $procId -ne "0") {
      $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
      if ($proc -and $proc.ProcessName -eq "node") {
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        Write-Host "  Killed orphaned node process (PID: $procId)" -ForegroundColor Green
      }
    }
  }
}

# Also kill from PID file
if (Test-Path $PidFile) {
  $oldPid = Get-Content $PidFile
  $oldProc = Get-Process -Id $oldPid -ErrorAction SilentlyContinue
  if ($oldProc -and $oldProc.ProcessName -eq "node") {
    Stop-Process -Id $oldPid -Force -ErrorAction SilentlyContinue
    Write-Host "  Killed previous backend (PID: $oldPid)" -ForegroundColor Green
  }
  Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Seconds 1

# 2. Build if requested or if dist is missing
if ($Build -or !(Test-Path $DistMain)) {
  Write-Host "[2/5] Building backend..." -ForegroundColor Yellow
  cmd.exe /c "npx nest build" 2>&1
  if ($LASTEXITCODE -ne 0) {
    Write-Host "  Build failed!" -ForegroundColor Red
    exit 1
  }
  Write-Host "  Build complete" -ForegroundColor Green
} else {
  Write-Host "[2/5] Using existing dist (use -Build to rebuild)" -ForegroundColor Gray
}

# 3. Verify Prisma client
Write-Host "[3/5] Checking Prisma client..." -ForegroundColor Yellow
if (!(Test-Path "F:\Local_git\gardenVerse\node_modules\@prisma\client\index.js")) {
  Write-Host "  Regenerating Prisma client..." -ForegroundColor Yellow
  cmd.exe /c "npx prisma generate" 2>&1
}
Write-Host "  Prisma client ready" -ForegroundColor Green

# 4. Start the backend
Write-Host "[4/5] Starting backend..." -ForegroundColor Yellow
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
"=== Backend started at $timestamp ===" | Out-File -FilePath $LogFile

$startScript = {
  param($DistMain, $LogFile)
  $env:NODE_ENV = "development"
  $env:PORT = "3001"
  node $DistMain *>&1 | ForEach-Object { "$_" | Out-File -FilePath $LogFile -Append }
}

$job = Start-Job -ScriptBlock $startScript -ArgumentList $DistMain, $LogFile

# Wait a moment and check if process started
Start-Sleep -Seconds 3

$processes = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
  $_.Id -ne $pid
}
$backendProc = $processes | Sort-Object StartTime -Descending | Select-Object -First 1

if ($backendProc) {
  $backendProc.Id | Out-File -FilePath $PidFile
  Write-Host "  Backend started (PID: $($backendProc.Id))" -ForegroundColor Green
} else {
  Write-Host "  Backend may still be starting..." -ForegroundColor Yellow
}

# 5. Health check loop
Write-Host "[5/5] Waiting for health check..." -ForegroundColor Yellow
$maxRetries = 15
for ($i = 1; $i -le $maxRetries; $i++) {
  Start-Sleep -Seconds 2
  try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/v1/health" -UseBasicParsing -TimeoutSec 3
    if ($response.StatusCode -eq 200) {
      Write-Host "  Backend is HEALTHY! (attempt $i/$maxRetries)" -ForegroundColor Green
      Write-Host ""
      Write-Host "=== Backend Ready ===" -ForegroundColor Cyan
      Write-Host "  API:       http://localhost:3001/api/v1" -ForegroundColor White
      Write-Host "  Swagger:   http://localhost:3001/api/docs" -ForegroundColor White
      Write-Host "  Log file:  $LogFile" -ForegroundColor White
      Write-Host "  PID file:  $PidFile ($($backendProc.Id))" -ForegroundColor White
      Write-Host ""
      Write-Host "  Run E2E:   npm run test:e2e" -ForegroundColor Cyan
      Write-Host "  Stop:      Stop-Process -Id $($backendProc.Id)" -ForegroundColor Cyan
      exit 0
    }
  } catch {
    if ($i -eq $maxRetries) {
      Write-Host "  Health check failed after $maxRetries attempts" -ForegroundColor Red
      Write-Host "  Check log: $LogFile" -ForegroundColor Yellow
      exit 1
    }
    Write-Host "  Waiting... (attempt $i/$maxRetries)" -ForegroundColor Gray
  }
}
