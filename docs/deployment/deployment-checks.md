# Deployment Checks & Protection Guide

**Last Updated:** 2026-06-09

---

## Overview

GardenVerse uses a multi-stage deployment pipeline with protection rules to ensure only tested, non-breaking changes reach production. Feature branches get preview deployments; only the `main` branch can be promoted to production.

---

## Deployment Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌────────────┐
│ Feature      │────▶│ Pull Request │────▶│ Merge to     │────▶│ Production │
│ Branch       │     │ + PR Checks  │     │ main         │     │ Deploy     │
│ (preview)    │     │              │     │              │     │            │
└─────────────┘     └──────────────┘     └─────────────┘     └────────────┘
       │                    │                    │                    │
       ▼                    ▼                    ▼                    ▼
  Preview URL        CI Checks Pass       Build + Lint         Live Site
  Auto-deployed      - TypeScript         - prisma:generate     https://
                     - Lint               - next build           gardenverse
                     - Build              - typecheck            .vercel.app
                     - Unit tests         Post-deploy:
                                          - Health check
                                          - Smoke test
                                          - APK build (mobile)
```

---

## Branch Protection Rules

### Production Branch: `main`

| Rule | Config |
|------|--------|
| **Production deployment** | Only from `main` branch |
| **Preview deployments** | All feature branches |
| **Auto-deployment** | Enabled for all branches (preview) |
| **Production deployment** | Manual only via `vercel deploy --prod --yes` |

### Configured in `vercel.json`

```json
{
  "git": {
    "deploymentEnabled": {
      "contracts": false,
      "mobile": false,
      "services": false
    },
    "productionBranch": "main"
  }
}
```

- `contracts`, `mobile`, `services` branches auto-disabled — Only `packages/admin` deploys to Vercel
- `productionBranch: "main"` — Only `main` branch gets production deployments
- Feature branches automatically get preview URLs

---

## Pre-Deployment Checks

### 1. Pre-Commit Hooks (Husky)

Runs on every commit:

```bash
# Admin lint (prisma generate + tsc --noEmit)
npm run lint -w packages/admin

# Admin typecheck
npm run typecheck -w packages/admin

# Mobile typecheck
npm run typecheck -w packages/mobile
```

### 2. Pull Request Checks (Required Before Merge)

All checks must pass before merging to `main`:

- [ ] **TypeScript** — No type errors in admin or mobile
- [ ] **Lint** — ESLint passes (admin)
- [ ] **Build** — `npm run admin:build` succeeds
- [ ] **Unit Tests** — `npm run test:admin` passes
- [ ] **E2E Tests** — Playwright integration tests pass
- [ ] **DB Migration Check** — Migrations are backward-compatible (non-breaking)
- [ ] **Security Scan** — No hardcoded secrets, fallback credentials, or security regressions

### 3. Non-Breaking Change Policy

**All deployments must be non-breaking for game data continuity:**

| Change Type | Policy | Example |
|-------------|--------|---------|
| **DB Schema** | Additive only — new columns must be optional or have defaults | Adding `preferences Json?` ✅ |
| **DB Schema** | Never remove or rename columns without migration | Renaming `greenCredits` ❌ without migration |
| **API Response** | Additive only — existing fields must not change type/meaning | Adding new field ✅ |
| **Auth** | Never break existing token validation | Changing JWT secret ❌ without grace period |
| **Mobile API** | Backward compatible — old app version must still work | Adding optional params ✅ |
| **Env Vars** | New required env vars must have sensible defaults | Adding `NEW_FEATURE_FLAG=false` ✅ |

---

## Post-Deployment Verification

### Automated Health Checks (After Each Deploy)

```bash
# 1. Site is up
curl -f https://gardenverse.vercel.app > /dev/null || echo "FAIL: Site down"

# 2. API is responding
curl -f https://gardenverse.vercel.app/api/v1/plants?limit=1 > /dev/null || echo "FAIL: API down"

# 3. Auth is working
curl -s -o /dev/null -w "%{http_code}" -X POST https://gardenverse.vercel.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@gardenverse.vercel.app\",\"password\":\"${ADMIN_DEFAULT_PASSWORD}\"}"
# Expected: 200

# 4. Database connectivity
curl -f https://gardenverse.vercel.app/api/v1/users?limit=1 > /dev/null || echo "FAIL: DB error"
```

### Smoke Test Checklist (After Production Deploy)

- [ ] Main page loads (HTTP 200)
- [ ] Admin login works
- [ ] Garden list loads
- [ ] Plant data is accessible
- [ ] No 500 errors in Vercel logs (`vercel logs --prod`)
- [ ] Mobile app API connectivity works (from device)

---

## Vercel Deployment Protection

### Environment Variables (All Set via Vercel Dashboard — Never in Code)

| Variable | Environment | Set Via |
|----------|------------|---------|
| `DATABASE_URL` | Production | Dashboard (Encrypted) |
| `NEXTAUTH_SECRET` | Production | Dashboard (Encrypted) |
| `JWT_REFRESH_SECRET` | Production | Dashboard (Encrypted) |
| `SUPABASE_URL` | Production, Preview | Dashboard (Encrypted) |
| `SUPABASE_ANON_KEY` | Production, Preview | Dashboard (Encrypted) |
| `SUPABASE_SERVICE_ROLE_KEY` | Production | Dashboard (Encrypted) |
| `CRON_SECRET` | Production | Dashboard (Encrypted) |
| `ENCRYPTION_KEY` | Production | Dashboard (Encrypted) |
| `NODE_ENV` | Production | vercel.json |
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview | Dashboard (Encrypted) |

### Security Rules (Enforced)

1. **No hardcoded secrets** — All secrets via Vercel env vars (encrypted)
2. **No fallback credentials** — App fails closed if env vars missing
3. **Rate limiting** — Auth endpoints: 10 req/15min, API: 60 req/min
4. **CORS** — Only allowed origins, no wildcard
5. **CSP** — Content-Security-Policy header configured
6. **Error messages** — Internal errors not leaked in production
7. **Cron protection** — CRON_SECRET required, fail closed

---

## Mobile App Deployment

### APK Build Process

The mobile app is built via EAS Build (cloud) and published to the admin dashboard for download.

#### Build Profiles

| Profile | Command | Output | Use |
|---------|---------|--------|-----|
| Development | `eas build --platform android --profile development` | Debug APK | Internal testing |
| Preview | `eas build --platform android --profile preview` | Release APK | Beta testing |
| Production | `eas build --platform android --profile production` | App Bundle (AAB) | Play Store |

#### APK Hosting on Admin Dashboard

The latest APK is hosted at the project root and accessible via:
- **Download URL**: `https://gardenverse.vercel.app/downloads/gardenverse-latest.apk`
- **QR Code**: Generated on the admin mobile download page
- **Version**: Displayed with changelog

#### EAS Configuration

**`eas.json`:**
```json
{
  "cli": { "version": ">= 20.0.0", "appVersionSource": "remote" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": { "buildType": "apk", "gradleCommand": ":app:assembleDebug" },
      "env": { "API_URL": "http://localhost:3000/api/v1" }
    },
    "preview": {
      "distribution": "internal",
      "android": { "buildType": "apk" },
      "env": { "API_URL": "https://gardenverse.vercel.app/api/v1" }
    },
    "production": {
      "channel": "production",
      "android": { "buildType": "app-bundle" },
      "env": { "API_URL": "https://gardenverse.vercel.app/api/v1" }
    }
  }
}
```

**`.easignore`** — Excludes non-essential files from EAS build:
```
.claude/
.agents/
claude/
AGENTS.md
CLAUDE.md
contracts/
services/
docs/
e2e/
scripts/
*.md
docker-compose*.yml
.env*
.vercel/
.git/
.husky/
.vscode/
.idea/
```

---

## Rollback Procedures

### Vercel Rollback (Admin)

```bash
# List recent deployments
vercel ls

# Rollback to previous deployment
vercel rollback production

# Or redeploy a specific version
vercel deploy --prod --yes
```

### Database Rollback

```bash
# Check migration status
cd packages/admin && npx prisma migrate status

# Resolve failed migration
npx prisma migrate resolve --rolled-back "migration_name"

# Re-apply
npx prisma migrate deploy
```

### Mobile App Rollback

1. Rebuild previous version from git tag
2. Re-publish APK to admin dashboard
3. If already on Play Store: Use Play Console → Production → Releases → Halt rollout

---

## Deployment Checklist

### Before Merging to Main

- [ ] All PR checks pass (TypeScript, lint, build, tests)
- [ ] DB migrations are backward-compatible
- [ ] No hardcoded secrets in code
- [ ] Security audit passed (no fallback credentials)
- [ ] Rate limiting configured for new endpoints
- [ ] Error messages don't leak internals
- [ ] Feature flags added for risky changes

### After Merging to Main

- [ ] Production build succeeds
- [ ] Health checks pass
- [ ] Smoke tests pass
- [ ] No 500 errors in logs
- [ ] Mobile app API connectivity verified
- [ ] APK built and uploaded to download page
- [ ] QR code generated and tested
- [ ] Changelog updated

### After Production Deploy

- [ ] Monitor error rates (Sentry) for 1 hour
- [ ] Check Vercel function logs for errors
- [ ] Verify cron jobs are running
- [ ] Test mobile app sync with production API
- [ ] Confirm game data continuity (existing users can play)
