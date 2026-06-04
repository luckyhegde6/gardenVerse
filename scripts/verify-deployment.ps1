param(
  [string]$AdminUrl = "https://gardenverse.vercel.app",
  [string]$ApiUrl = "https://gardenverse.vercel.app/api/v1",
  [string]$AiUrl = "http://localhost:8000"
)

$fail = 0

function Section($title) { Write-Host "=== $title ===" -ForegroundColor Cyan }
function Check($name, $condition) {
  if ($condition) { Write-Host "  [PASS] $name" -ForegroundColor Green }
  else { Write-Host "  [FAIL] $name" -ForegroundColor Red; $script:fail = 1 }
}

Section "Admin Dashboard & API (Unified Next.js App)"
$code = (Invoke-WebRequest -Uri $AdminUrl -UseBasicParsing -TimeoutSec 10).StatusCode
Check "Homepage returns 200/307 (got $code)" ($code -eq 200 -or $code -eq 307)

$routes = @("/about", "/features", "/ai-scanner", "/ai-scanner/history", "/support", "/login")
foreach ($path in $routes) {
  try {
    $code = (Invoke-WebRequest -Uri "$AdminUrl$path" -UseBasicParsing -TimeoutSec 10).StatusCode
    Check "Route $path returns 200 (got $code)" ($code -eq 200)
  } catch {
    Check "Route $path returns 200 (got error)" $false
  }
}

Section "API Routes"
try {
  $health = Invoke-RestMethod -Uri "$ApiUrl/health" -TimeoutSec 10
  Check "Health endpoint returns ok" ($health.status -eq "ok")
  Check "Database is connected" ($health.database -eq "connected")
} catch {
  Check "Health endpoint reachable" $false
  Check "Database is connected" $false
}

try {
  $loginResp = Invoke-WebRequest -Uri "$ApiUrl/auth/admin/login" -Method POST `
    -ContentType "application/json" `
    -Body '{"email":"test@test.com","password":"test"}' `
    -UseBasicParsing -TimeoutSec 10
  Check "Auth endpoint reachable (got $($loginResp.StatusCode), expected 401)" ($loginResp.StatusCode -eq 401)
} catch {
  $code = $_.Exception.Response.StatusCode.value__
  Check "Auth endpoint reachable (got $code, expected 401)" ($code -eq 401)
}

Section "Results"
if ($fail -eq 0) { Write-Host "ALL CHECKS PASSED" -ForegroundColor Green } 
else { Write-Host "SOME CHECKS FAILED" -ForegroundColor Red }
exit $fail
