#!/bin/bash
# Unified deployment verification script
# Usage: ./scripts/verify-deployment.sh
#   ADMIN_URL=https://gardenverse.vercel.app \
#   API_URL=https://gardenverse.vercel.app/api/v1 \
#   AI_URL=http://localhost:8000 \
#   ./scripts/verify-deployment.sh

ADMIN_URL="${ADMIN_URL:-https://gardenverse.vercel.app}"
API_URL="${API_URL:-https://gardenverse.vercel.app/api/v1}"
AI_URL="${AI_URL:-http://localhost:8000}"

fail=0

section() { echo "=== $1 ==="; }
check() {
  if [ $? -eq 0 ]; then echo "  [PASS] $1"; else echo "  [FAIL] $1"; fail=1; fi
}

section "Admin Dashboard & API (Unified Next.js App)"
code=$(curl -s -o /dev/null -w "%{http_code}" "$ADMIN_URL")
[ "$code" = "200" ] || [ "$code" = "307" ]
check "Homepage returns 200/307 (got $code)"

for path in /about /features /ai-scanner /ai-scanner/history /support /login; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$ADMIN_URL$path")
  [ "$code" = "200" ]
  check "Route $path returns 200 (got $code)"
done

section "API Routes (Next.js)"
health=$(curl -s "$API_URL/health")
echo "$health" | grep -q '"status":"ok"'
check "Health endpoint returns ok"
echo "$health" | grep -q '"database":"connected"'
check "Database is connected"

login_check=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/auth/admin/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}' 2>/dev/null)
[ "$login_check" = "401" ]
check "Auth endpoint reachable (got $login_check, expected 401)"

section "Results"
[ $fail -eq 0 ] && echo "ALL CHECKS PASSED" || echo "SOME CHECKS FAILED"
exit $fail
