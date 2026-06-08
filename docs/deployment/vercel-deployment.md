# Vercel Deployment Guide

**Platform:** Vercel (Serverless)
**App:** Next.js 14 Admin Dashboard + API Routes
**Database:** Supabase (PostgreSQL)
**Cache:** Upstash Redis (serverless-compatible)

---

## Architecture on Vercel

```
┌──────────────────────────────────────────────┐
│                  Vercel Edge                  │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │     Next.js 14 (Serverless Functions)   │ │
│  │                                         │ │
│  │  UI Pages  │  API Routes (71 routes)   │ │
│  │  (31 pages)│  (29 modules)             │ │
│  └──────────┬──────────────┬───────────────┘ │
│             │              │                  │
│  ┌──────────▼──────┐  ┌───▼───────────────┐ │
│  │  Prisma Client  │  │  NextAuth         │ │
│  │  (connection    │  │  (JWT sessions)   │ │
│  │   pooling via   │  │                   │ │
│  │   Supabase)     │  │                   │ │
│  └──────────┬──────┘  └───┬───────────────┘ │
└─────────────┼──────────────┼─────────────────┘
              │              │
    ┌─────────▼──────┐  ┌───▼───────────────┐
    │   Supabase     │  │  Upstash Redis    │
    │   PostgreSQL   │  │  (HTTP-based,     │
    │   (pooled)     │  │   serverless)     │
    └────────────────┘  └───────────────────┘
```

> ⚠️ **Key constraint:** Serverless functions cannot maintain persistent TCP connections. BullMQ workers and Socket.IO need separate long-running servers (Railway/Fly.io). Use Upstash Redis HTTP API instead of `ioredis`.

---

## Prerequisites

1. **Vercel account** — [vercel.com](https://vercel.com)
2. **Supabase project** — Create at [supabase.com](https://supabase.com)
3. **Upstash Redis account** — Create at [upstash.com](https://upstash.com)
4. **Vercel CLI** — `npm i -g vercel`
5. **Environment variables** — All secrets configured (see below)

---

## Step-by-Step Deployment

### 1. Link Project

```bash
cd F:\Local_git\gardenVerse
vercel link
# Follow prompts: scope → project name (gardenverse-admin)
```

This creates `.vercel/project.json` with your org ID and project ID.

### 2. Configure Environment Variables

#### Production Env Vars

Set these in Vercel Dashboard → Project → Settings → Environment Variables:

```bash
# Database (Supabase pooled connection)
DATABASE_URL=postgres://postgres.YOUR_PROJECT:PASSWORD@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true

# Supabase
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Auth
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
JWT_SECRET=<generate with: openssl rand -base64 32>

# Redis (Upstash HTTP API)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-upstash-token

# Node
NODE_ENV=production
```

#### Set via CLI

```bash
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add JWT_SECRET
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add UPSTASH_REDIS_REST_URL
vercel env add UPSTASH_REDIS_REST_TOKEN
vercel env add NODE_ENV
# Select "Production" environment for each
```

### 3. Generate Secrets

```bash
# Generate strong random secrets
openssl rand -base64 32   # NEXTAUTH_SECRET
openssl rand -base64 32   # JWT_SECRET
```

### 4. Deploy to Preview

```bash
# Deploys to a preview URL automatically
vercel deploy --yes
```

Preview URL format: `git-branch-<slug.vercel.app`

### 5. Deploy to Production

```bash
# ⚠️ Always use cloud build (local `vercel build` has @vercel/next bug)
vercel deploy --prod --yes
```

> **⚠️ Critical:** Do NOT run `vercel build` locally and then `vercel deploy --prebuilt`. The local `vercel build` has a known `@vercel/next` issue. Always use `vercel deploy --prod --yes` to trigger cloud build.

### 6. Database Migration on Vercel

After deploying, run migrations against the Supabase database:

```bash
# Option A: Run locally against Supabase
set DATABASE_URL=postgres://postgres.YOUR_PROJECT:PASSWORD@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true && cd packages/admin && npx prisma db push

# Option B: Use Vercel deploy hook + migration script
```

### 7. Seed Production Data

```bash
set DATABASE_URL=postgres://postgres.YOUR_PROJECT:PASSWORD@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true && cd packages/admin && npx prisma db seed
```

---

## Post-Deploy Verification

```bash
# 1. Check health endpoint
curl https://your-app.vercel.app/api/v1/health

# 2. Check plants API (public)
curl https://your-app.vercel.app/api/v1/plants?limit=5

# 3. Check login API
curl -X POST https://your-app.vercel.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@gardenverse.vercel.app\",\"password\":\"${ADMIN_DEFAULT_PASSWORD}\"}"

# 4. Open admin dashboard
# Navigate to https://your-app.vercel.app/login in browser
```

---

## Custom Domain

1. Vercel Dashboard → Project → Settings → Domains
2. Add your domain (e.g., `admin.gardenverse.app`)
3. Update DNS CNAME record to `cname.vercel-dns.com`
4. Update `NEXTAUTH_URL` environment variable to the new domain
5. Redeploy: `vercel deploy --prod --yes`

---

## Build Configuration

**`vercel.json`:**
```json
{
  "git": {
    "deploymentEnabled": {
      "contracts": false,
      "mobile": false,
      "services": false
    }
  },
  "installCommand": "npm install",
  "buildCommand": "npm run prisma:generate -w packages/admin && npm run admin:build",
  "framework": "nextjs",
  "outputDirectory": "packages/admin/.next"
}
```

Key settings:
- **Contracts/mobile/services branches auto-disabled** — Only `packages/admin` deploys
- **Build command** — Generates Prisma client then builds Next.js
- **Output directory** — Points to `packages/admin/.next`

---

## Environment Variable Templates

### `.env.production` (for local testing against production DB)

```bash
DATABASE_URL=postgres://postgres.PROJECT:PASSWORD@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true
SUPABASE_URL=https://PROJECT.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=generated-secret
JWT_SECRET=generated-secret
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
NODE_ENV=production
```

> ⚠️ Never commit `.env.production` or any `.env*` file to git.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| 500 on API routes | DATABASE_URL wrong or Supabase not reachable | Check pooled connection string; ensure `?sslmode=require` |
| Prisma client error | Client not generated during build | `buildCommand` must include `prisma:generate` |
| Login fails (401) | NEXTAUTH_SECRET mismatch | Regenerate; redeploy |
| NEXTAUTH_URL wrong | Domain changed after deploy | Update env var + redeploy |
| Function timeout (10s) | Cold start + large DB query | Add connection pooling; simplify queries |
| Redis connection fail | Using `ioredis` (TCP) instead of Upstash HTTP | Use `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` |
| CSS not loading | `outputDirectory` misconfigured | Must be `packages/admin/.next` |
| API routes return 404 | Not under `packages/admin/src/app/api/` | Check file path matches `src/app/api/v1/*/route.ts` |

---

## Rollback

```bash
# List deployments
vercel ls

# Rollback to previous
vercel rollback production
```

---

## Deployment Checklist

- [ ] All env vars set in Vercawer dashboard (Production)
- [ ] `DATABASE_URL` is Supabase pooled connection
- [ ] `NEXTAUTH_URL` matches actual deployed domain
- [ ] `NEXTAUTH_SECRET` and `JWT_SECRET` are strong random strings
- [ ] Upstash Redis configured (not local TCP Redis)
- [ ] `vercel.json` has correct `buildCommand` and `outputDirectory`
- [ ] Post-deploy: `GET /api/v1/health` returns 200
- [ ] Post-deploy: Login works with admin account
- [ ] Post-deploy: Database migrations applied
- [ ] Post-deploy: Seed data loaded (if needed)
- [ ] Domain configured (if using custom domain)
- [ ] SSL certificate active (auto on Vercel)
