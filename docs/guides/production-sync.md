# Production Sync Guide

**Purpose:** Safely sync code changes, database migrations, and configuration from development to production.

---

## Overview

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Local   │───▶│  Feature │───▶│   Main   │───▶│Production│
│  Dev     │    │  Branch  │    │  Branch  │    │ (Vercel) │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
     │               │               │               │
     ▼               ▼               ▼               ▼
  prisma db       PR review     auto-deploy     Vercel
  push (local)    + tests       to Vercel       Dashboard
```

---

## Git Workflow

### Branch Strategy

| Branch | Purpose | Deploys To |
|--------|---------|-----------|
| `main` | Production-ready code (**protected**) | Vercel Production |
| `feature/*` | New features | Vercel Preview |
| `fix/*` | Bug fixes | Vercel Preview |
| `release/*` | Release candidates | Vercel Preview |

#### Branch Protection Rules (`main`)
- **No direct pushes** — all changes via PRs only
- **Squash merges** required — enforces linear history
- **Signed commits** required
- **CI + CodeQL must pass** before merge
- Use **fresh branches from `main`** for each PR (delete after merge)

### Commit Convention

```
type(scope): description

Types: feat, fix, chore, docs, refactor, test
Scopes: backend, mobile, admin, ai, iot, contracts, docs, infra

Examples:
  feat(backend): add quest progress tracking API
  fix(mobile): resolve crop hydration display bug
  chore(config): update production env vars
```

---

## Sync Process (Step by Step)

### 1. Prepare Your Feature Branch

```powershell
# Ensure you're on the latest main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/my-feature

# Make changes, commit
git add .
git commit -m "feat(scope): description"

# Push
git push origin feature/my-feature
```

### 2. Run Local Verification

```powershell
# Type check
npm run typecheck

# Unit tests
npm run test

# E2E tests (if applicable)
npm run test:e2e:integration

# Build verification
npm run admin:build
```

### 3. Create Pull Request

```powershell
# Push branch
git push origin feature/my-feature

# Create PR via GitHub CLI
gh pr create --title "feat: description" --body "Changes:\n- ..."
```

**PR Checklist:**
- [ ] All tests pass
- [ ] Type checking passes (`npm run typecheck`)
- [ ] No new lint errors
- [ ] Database migrations included (if schema changed)
- [ ] Environment variables documented (if new ones added)
- [ ] Mobile APK builds successfully (if mobile changes)

### 4. Merge to Main

```powershell
# After PR approved, merge
gh pr merge --squash

# Or manually:
git checkout main
git pull origin main
git merge --squash feature/my-feature
git push origin main
```

### 5. Auto-Deploy to Vercel

Merging to `main` triggers automatic Vercel deployment:

1. Vercel detects push to `main`
2. Runs `npm install` (installCommand)
3. Runs `npm run prisma:generate -w packages/admin && npm run admin:build` (buildCommand)
4. Deploys to production URL

**Monitor deployment:**
```powershell
# Watch deployment
vercel ls

# Check logs
vercel logs --follow
```

---

## Database Migrations (Production)

### ⚠️ Critical: Migrations must be applied BEFORE or AFTER code deploy

**Option A: Before deploy (recommended for additive changes)**

```powershell
# Apply migration against Supabase
$env:DATABASE_URL = "postgres://postgres.PROJECT:PASSWORD@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true"
cd packages/admin
npx prisma db push
# or for named migrations:
npx prisma migrate deploy
```

**Option B: After deploy (for breaking changes)**

1. Deploy code first (with backward compatibility)
2. Apply migration
3. Deploy code that uses new schema

### Migration Safety Rules

| Change Type | Risk | Strategy |
|-------------|------|----------|
| Add column (nullable) | Low | Deploy anytime |
| Add column (required) | High | Add as nullable → backfill → make required |
| Rename column | High | Add new column → copy data → remove old |
| Drop column | High | Stop using in code first → then drop |
| Add table | Low | Deploy anytime |
| Add index | Low | Use `CREATE INDEX CONCURRENTLY` |
| Change column type | Medium | Add new column → migrate → remove old |

### Migration Commands

```powershell
# Generate migration (local dev)
cd packages/admin
npx prisma migrate dev --name describe_change

# Apply pending migrations (production)
set DATABASE_URL=postgres://... && npx prisma migrate deploy

# Check migration status
set DATABASE_URL=postgres://... && npx prisma migrate status

# Push schema without migration (dev only)
npx prisma db push
```

---

## Environment Variable Sync

### Adding a New Production Env Var

```powershell
# 1. Add to Vercel Dashboard
vercel env add MY_NEW_VAR
# Enter value, select "Production"

# 2. Add to .env.example (for documentation)
echo "MY_NEW_VAR=" >> .env.example

# 3. Add to vercel.json (if it should be in the config)
# Edit vercel.json → add to "env" object

# 4. Redeploy to pick up new env vars
vercel deploy --prod --yes
```

### Updating Existing Env Var

```powershell
# Remove old value
vercel env rm MY_VAR

# Add new value
vercel env add MY_VAR

# Redeploy
vercel deploy --prod --yes
```

### Env Var Checklist for Production

```bash
# Database
DATABASE_URL=postgres://... (Supabase pooled)
SUPABASE_URL=https://PROJECT.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Auth
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=<strong-random>
JWT_SECRET=<strong-random>

# Redis
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Node
NODE_ENV=production
```

---

## Mobile APK Sync to Production

### Build & Publish Flow

```powershell
# 1. Ensure all changes are merged to main
git checkout main
git pull origin main

# 2. Bump version (if needed)
cd packages/mobile
npm version patch   # or minor / major

# 3. Build production AAB
eas build --platform android --profile production

# 4. Submit to Play Store
eas submit --platform android --profile production

# 5. In Play Console:
#    - Review release
#    - Start staged rollout (1% → 10% → 50% → 100%)
```

### Mobile Config Changes

If `app.config.js` changes (API URL, permissions, etc.):

```powershell
# 1. Update app.config.js
# 2. Run EAS build (config is read at build time)
eas build --platform android --profile production

# 3. Submit
eas submit --platform android --profile production
```

> ⚠️ Environment variables in `app.config.js` are baked into the build at compile time. Changing them requires a new build.

---

## Rollback Procedures

### Vercel Rollback (Admin)

```powershell
# List recent deployments
vercel ls

# Rollback to previous deployment
vercel rollback production

# Or deploy a specific previous commit
git checkout <commit-hash>
vercel deploy --prod --yes
```

### Database Rollback

```powershell
# If migration caused issues:
# 1. Revert code that uses new schema
git revert <commit>
git push origin main

# 2. If data was corrupted, restore from Supabase backup:
#    Supabase Dashboard → Database → Backups → Restore

# 3. For additive-only migrations (safe):
#    No action needed — old columns/tables can remain
```

### Mobile Rollback

```powershell
# In Google Play Console:
# Production → Releases → Halt current rollout
# Upload previous version AAB
# Or use "Full rollout" with previous version
```

---

## Staged Rollout Strategy

### Admin (Vercel)

Vercel doesn't have staged rollout. Use preview deployments:

```powershell
# Feature branch → Preview URL
git push origin feature/new-ui
# → https://git-branch-gardenverse-xxx.vercel.app

# Test on preview, then merge to main for production
```

### Mobile (Play Console)

```
Phase 1: Internal testing (immediate)
  → Upload to Internal Testing track
  → Share with dev team

Phase 2: Closed testing (3-5 days)
  → Upload to Closed Testing track
  → Add beta testers (email list)

Phase 3: Production staged rollout
  → 1% → monitor 24-48h
  → 10% → monitor 3-5 days
  → 50% → monitor 5-7 days
  → 100% → full rollout
```

**Abort criteria:** Crash rate > 1%, ANR rate > 0.5%, or critical bug reported.

---

## Monitoring After Deploy

### Admin (Vercel)

```powershell
# Check deployment health
curl https://your-app.vercel.app/api/v1/health

# View function logs
vercel logs --follow

# Check error tracking (Sentry)
# → https://sentry.io/organizations/your-org/projects/gardenverse/
```

### Mobile (Play Console)

- **Android vitals** → Crash rate, ANR rate, wakeup issues
- **Pre-launch report** → Automated test results
- **User feedback** → Reviews and ratings

### Database (Supabase)

- **Supabase Dashboard** → Database → Query performance
- **Connection pooler** → Active connections, pool usage
- **Logs** → Slow queries, errors

---

## Sync Checklist

### Before Merge to Main

- [ ] All tests pass locally
- [ ] Type checking passes
- [ ] E2E tests pass (if applicable)
- [ ] Database migrations tested locally
- [ ] New env vars documented
- [ ] PR reviewed and approved
- [ ] No secrets committed to git

### After Merge to Main

- [ ] Vercel deployment succeeds
- [ ] Health endpoint returns 200
- [ ] Login works with admin account
- [ ] Database migrations applied (if any)
- [ ] Seed data verified (if changed)
- [ ] API endpoints respond correctly
- [ ] Admin dashboard pages load

### After Mobile Build

- [ ] EAS build succeeds
- [ ] APK tested on emulator
- [ ] API calls work (production URL)
- [ ] Login works
- [ ] Critical flows tested (garden, marketplace)
- [ ] Submitted to Play Console
- [ ] Staged rollout started

### Emergency Rollback

- [ ] Identify the issue (logs, Sentry, Play Console)
- [ ] Revert the problematic commit
- [ ] Redeploy: `vercel deploy --prod --yes`
- [ ] Verify health endpoint
- [ ] If DB issue: restore from Supabase backup
- [ ] If mobile issue: halt rollout in Play Console
- [ ] Post-mortem: document what went wrong
