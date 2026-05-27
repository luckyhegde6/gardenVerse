# CI/CD Pipeline

## Overview

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Commit   │───►│  Test    │───►│  Build   │───►│  Deploy  │
│  (PR)     │    │  & Lint  │    │          │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    ▼                    ▼                    ▼
              ┌──────────┐        ┌──────────┐        ┌──────────┐
              │   Dev    │        │ Staging  │        │  Prod    │
              │ Auto     │        │ Manual   │        │ Manual   │
              └──────────┘        └──────────┘        └──────────┘
```

---

## GitHub Actions Workflow: Backend

File: `.github/workflows/backend.yml`

```yaml
name: Backend CI/CD

on:
  push:
    branches: [main, develop]
    paths:
      - 'packages/backend/**'
      - 'packages/shared/**'
      - 'package.json'
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '22'

jobs:
  test:
    name: Test & Lint
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: gardenverse_test
          POSTGRES_USER: gardenverse
          POSTGRES_PASSWORD: gardenverse123
        ports:
          - 5432:5432
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma client
        run: npm run prisma:generate
        env:
          DATABASE_URL: postgresql://gardenverse:gardenverse123@localhost:5432/gardenverse_test

      - name: Run Prisma migrations
        run: npx prisma migrate deploy
        working-directory: packages/backend
        env:
          DATABASE_URL: postgresql://gardenverse:gardenverse123@localhost:5432/gardenverse_test

      - name: Lint
        run: npm run lint -w packages/backend

      - name: Type check
        run: npx tsc --noEmit
        working-directory: packages/backend

      - name: Run unit tests
        run: npm run test -w packages/backend
        env:
          DATABASE_URL: postgresql://gardenverse:gardenverse123@localhost:5432/gardenverse_test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-secret
          JWT_REFRESH_SECRET: test-refresh-secret

      - name: Run E2E tests
        run: npm run test:e2e -w packages/backend
        env:
          DATABASE_URL: postgresql://gardenverse:gardenverse123@localhost:5432/gardenverse_test
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-secret

  build:
    name: Build Docker Image
    needs: test
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ghcr.io/${{ github.repository }}/backend
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=sha,format=long

      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          file: packages/backend/Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    name: Deploy
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production

    steps:
      - name: Deploy to Production
        run: |
          echo "Deploying backend to production..."
          # Deploy via SSH, Helm, or cloud provider CLI
          # Example:
          # ssh deploy@server "cd /opt/gardenverse && docker-compose pull && docker-compose up -d"
```

---

## GitHub Actions Workflow: Mobile

File: `.github/workflows/mobile.yml`

```yaml
name: Mobile CI/CD

on:
  push:
    branches: [main, develop]
    paths:
      - 'packages/mobile/**'
  pull_request:
    branches: [main]

jobs:
  test:
    name: Test & Lint
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint -w packages/mobile

      - name: Type check
        run: npm run typecheck -w packages/mobile

      - name: Run tests
        run: npm run test -w packages/mobile

  build-staging:
    name: Build (Staging)
    needs: test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Build iOS & Android
        run: eas build --platform all --profile preview --non-interactive
        working-directory: packages/mobile

  build-production:
    name: Build & Submit (Production)
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Build production
        run: eas build --platform all --profile production --non-interactive
        working-directory: packages/mobile

      - name: Submit to stores
        run: |
          eas submit --platform ios --profile production --non-interactive
          eas submit --platform android --profile production --non-interactive
        working-directory: packages/mobile
```

---

## GitHub Actions Workflow: Admin Panel

File: `.github/workflows/admin.yml`

```yaml
name: Admin Panel CI/CD

on:
  push:
    branches: [main]
    paths:
      - 'packages/admin/**'
  pull_request:
    branches: [main]

jobs:
  test:
    name: Test & Lint
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'

      - name: Install
        run: npm ci

      - name: Lint
        run: npm run lint -w packages/admin

      - name: Build
        run: npm run build -w packages/admin

  deploy:
    name: Deploy
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Build
        run: npm run build -w packages/admin

      - name: Deploy to CDN
        run: |
          # Deploy to S3/Cloudflare Pages/Vercel
          # aws s3 sync packages/admin/build/ s3://gardenverse-admin/
          # aws cloudfront create-invalidation --distribution-id ABC --paths "/*"
```

---

## Testing Strategy

```
┌────────────────────────────────────────────────────────────┐
│  TEST PYRAMID                                               │
│                                                             │
│                    ┌──────┐                                 │
│                    │ E2E  │  Few - critical paths           │
│                    │  5%  │                                 │
│                   ┌┴──────┴┐                                │
│                   │Integr. │  Some - service boundaries     │
│                   │  15%   │                                │
│                  ┌┴────────┴┐                               │
│                  │  Unit     │  Many - individual functions  │
│                  │   80%    │                               │
│                  └──────────┘                               │
│                                                             │
│  Coverage Targets:                                          │
│  ├── Unit:       > 80% line coverage                        │
│  ├── Integration: > 60% line coverage                       │
│  └── E2E:        Critical user paths                        │
└────────────────────────────────────────────────────────────┘
```

### Test Categories
| Type | Tool | What |
|------|------|------|
| Unit (Backend) | Jest | Services, guards, pipes, utils |
| Unit (Mobile) | Jest | Zustand stores, utils, hooks |
| Integration | Supertest | Controllers, modules with DB |
| E2E | Cypress/Detox | Full user flows |
| Contract | Pact | API contract tests |

### Required Checks Before Merge
- [ ] All unit tests pass
- [ ] Linting passes
- [ ] TypeScript compilation succeeds
- [ ] No security vulnerabilities (Snyk)
- [ ] Build succeeds
- [ ] At least 1 approval

---

## Build and Deploy Steps

### Backend
```bash
# 1. Test
npm run test -w packages/backend
npm run lint -w packages/backend

# 2. Build
npm run build -w packages/backend

# 3. Migrate
npx prisma migrate deploy

# 4. Deploy
# (CI handles Docker build and push)

# 5. Verify
curl http://localhost:4000/api/v1/health
```

### Mobile
```bash
# 1. Test
npm run test -w packages/mobile
npm run typecheck -w packages/mobile

# 2. Build (EAS)
eas build --platform all --profile production

# 3. Submit
eas submit --platform all --profile production
```

### AI Service
```bash
# 1. Test
pytest services/ai/tests/

# 2. Build Docker
docker build -t gardenverse/ai:latest services/ai

# 3. Deploy
docker push gardenverse/ai:latest
```

---

## Environment Promotion

```
                     ┌─────────────────────┐
                     │   Developer          │
                     │   Local Machine      │
                     └─────────┬───────────┘
                               │
                    Push to develop branch
                               │
                               ▼
                     ┌─────────────────────┐
                     │   Development        │
                     │   Auto-deploy        │
                     │   Shared DB          │
                     │   Feature flags: ON  │
                     └─────────┬───────────┘
                               │
                    PR to main + approval
                               │
                               ▼
                     ┌─────────────────────┐
                     │   Staging            │
                     │   Manual deploy      │
                     │   Production-like    │
                     │   QA testing         │
                     │   Load testing       │
                     └─────────┬───────────┘
                               │
                    Manual approval + tag
                               │
                               ▼
                     ┌─────────────────────┐
                     │   Production         │
                     │   Canary deploy      │
                     │   10% → 50% → 100%   │
                     │   Feature flags: OFF │
                     │   Monitoring active  │
                     └─────────────────────┘
```

### Environment Comparison
| Feature | Dev | Staging | Prod |
|---------|-----|---------|------|
| Database | Shared test | Snapshot restore | Backup + replication |
| Cache | Single Redis | Cluster | Cluster + replica |
| AI Service | Mock | GPU instance | GPU cluster |
| Push notifications | Disabled | Test FCM keys | Production keys |
| Rate limiting | Disabled | Enabled (relaxed) | Enabled (strict) |
| Monitoring | - | Prometheus + Grafana | Full stack |
| SSL | Self-signed | Let's Encrypt | Paid cert |
| Backup | None | Daily | Every 6 hours |
