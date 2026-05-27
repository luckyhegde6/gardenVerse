# Deployment Guide

## Prerequisites

### Required Software
- **Node.js** >= 18.0.0
- **Docker** >= 24.0.0
- **Docker Compose** >= 2.20.0
- **PostgreSQL** 16 (for local dev without Docker)
- **Redis** 7 (for local dev without Docker)
- **Python** 3.11 (for AI service)
- **Hardhat** (for blockchain contracts)

### Required Accounts
- AWS account (or equivalent cloud provider)
  - S3 bucket for file uploads
  - SES/SMTP for emails
- Firebase Cloud Messaging (FCM) for push notifications
- Weather API key (OpenWeatherMap or similar)
- Government data API key
- Sentry account (error tracking)
- Docker Hub or container registry

---

## Environment Setup

### 1. Clone and Install
```bash
git clone https://github.com/gardenverse/gardenverse.git
cd gardenverse

# Install all dependencies (workspaces)
npm install

# Generate Prisma client
npm run prisma:generate
```

### 2. Configure Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Key variables to set:
# - DATABASE_URL
# - REDIS_URL
# - JWT_SECRET (generate: openssl rand -base64 64)
# - JWT_REFRESH_SECRET (generate: openssl rand -base64 64)
# - QR_SIGNING_KEY (generate: openssl rand -base64 32)
# - MESSAGING_ENCRYPTION_KEY (generate: openssl rand -base64 32)
# - API keys for external services
```

### 3. Security Checks Before Production
- [ ] Generate strong, unique secrets for all keys
- [ ] Set NODE_ENV=production
- [ ] Configure CORS with specific origins
- [ ] Enable rate limiting
- [ ] Set up WAF (Cloudflare, AWS WAF)
- [ ] Enable audit logging
- [ ] Set up database encryption
- [ ] Configure backup schedule
- [ ] Review firewall rules
- [ ] Set up monitoring alerts

---

## Database Migration

```bash
# Development
npm run prisma:migrate --name init

# Production
npm run prisma:migrate --name production_deploy

# Apply migrations
npx prisma migrate deploy

# Seed database (development only)
npm run prisma:seed

# Verify
npx prisma studio  # Opens GUI to verify data
```

### Migration Strategy
- All migrations must be reviewed in PR
- Rollback: `npx prisma migrate reset` (development only)
- Production rollback requires manual SQL intervention
- Migrations run as part of CI/CD pipeline
- Zero-downtime migrations via careful planning
- Never edit existing migrations; create new ones

---

## Docker Deployment

### Quick Start (Development)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### Individual Services
```bash
# Build and start specific service
docker-compose up -d postgres redis backend

# Rebuild single service
docker-compose build backend
docker-compose up -d backend
```

### Production Docker
```bash
# Build with production flags
docker build -t gardenverse/backend:latest ./packages/backend
docker build -t gardenverse/ai-service:latest ./services/ai
docker build -t gardenverse/admin:latest ./packages/admin

# Push to registry
docker push gardenverse/backend:latest
docker push gardenverse/ai-service:latest
docker push gardenverse/admin:latest
```

### Docker Compose Production
```yaml
# docker-compose.prod.yml additions:
# - Resource limits
# - Health checks
# - Logging driver
# - Restart policies
# - Read-only root filesystem
# - Security options (no-new-privileges)
```

---

## Vercel Deployment Considerations

> **Key Limitation:** Vercel's serverless functions do not support persistent TCP connections, which means direct Redis connections via `ioredis` will **not** work in a Vercel deployment.

### Current Redis Usage in GardenVerse

| Use Case | Component | Impact on Vercel |
|----------|-----------|-----------------|
| Job Queues | BullMQ (growth, notify, AI, IoT, weather, blockchain) | ❌ Not supported |
| Pub/Sub | Socket.IO horizontal scaling via `socket.io-redis` | ❌ Not supported |
| Session Cache | JWT session storage, rate limiting | ❌ Not supported |
| Data Cache | Weather, AI scan results, leaderboards | ❌ Not supported |
| Distributed Locks | Crop growth, transaction, invite concurrency | ❌ Not supported |

### Production Solutions

#### 1. Upstash Redis (Recommended)
[Upstash](https://upstash.com) provides serverless Redis via HTTP/REST API, fully compatible with Vercel:
- **BullMQ replacement:** Use [Upstash Workflows](https://upstash.com/docs/workflow) or migrate to a separate worker service with persistent connections
- **Socket.IO:** Use Vercel's WebSocket support with `@upstash/redis` adapter for Socket.IO
- **Caching:** HTTP-based Redis commands work seamlessly in serverless functions
- **Rate Limiting:** Upstash REST API supports atomic INCR/EXPIRE patterns
- **Free tier:** 10,000 commands/day, 256MB storage

#### 2. Vercel KV (Built-in)
[Vercel KV](https://vercel.com/docs/storage/vercel-kv) is a Redis-compatible storage solution:
- Suitable for: session caching, rate limiting, simple cache patterns
- Not suitable for: BullMQ queues, Socket.IO pub/sub, distributed locks
- Automatic scaling with your Vercel project
- Accessible via `@vercel/kv` package

#### 3. Hybrid Architecture
```
┌────────────────────────────────────────────────────────────┐
│              VERCELL DEPLOYMENT ARCHITECTURE                │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Vercel Serverless Functions (NestJS API)             │  │
│  │  ├── REST endpoints (no Redis dependency)             │  │
│  │  ├── Vercel KV for caching/rate limiting              │  │
│  │  └── Upstash Redis for session storage                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Separate Worker Service (e.g., Railway / Fly.io)     │  │
│  │  ├── Persistent Redis connection (ioredis)            │  │
│  │  ├── BullMQ processors (growth, AI, IoT, etc.)       │  │
│  │  ├── Socket.IO server with Redis adapter              │  │
│  │  └── Runs as long-running container                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  PostgreSQL (Supabase / Neon)                         │  │
│  │  └── Shared database for both services                │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

#### 4. Migration Path by Component

| Component | Current (Docker) | Vercel Production | Effort |
|-----------|-----------------|-------------------|--------|
| BullMQ | ioredis + BullMQ | Upstash Workflows / Separate worker | Medium |
| Socket.IO | socket.io-redis | Vercel WebSockets + Upstash | Medium |
| Session Cache | ioredis | Vercel KV | Low |
| Rate Limiting | ioredis | Vercel KV | Low |
| Data Cache | ioredis | Vercel KV / Upstash | Low |
| Distributed Locks | ioredis | Upstash / PostgreSQL advisory locks | Medium |

### Development vs. Production

```yaml
# Development (docker-compose.local.yml)
services:
  redis:
    image: redis:7-alpine
    ports: ['6379:6379']
# → Direct ioredis connection works fine
```

```yaml
# Production (Vercel)
# No Redis container — use Upstash or Vercel KV instead
# Environment variables:
# - REDIS_URL → UPSTASH_REDIS_REST_URL
# - Socket.IO → Use @upstash/redis adapter
# - BullMQ → Migrate to worker service or Upstash Workflows
```

### Code Changes Required for Vercel

The `RedisModule` in `packages/backend/src/redis/redis.module.ts` uses `ioredis` which requires a persistent TCP connection. For Vercel deployment, this module needs to be replaced with:

- **`@upstash/redis`** for Upstash (HTTP-based)
- **`@vercel/kv`** for Vercel KV

Both provide Promise-based APIs compatible with NestJS providers. The `REDIS_CLIENT` injection token can remain the same — only the underlying implementation changes.

```typescript
// Alternative: Upstash Redis provider for Vercel
import { Redis } from '@upstash/redis';

{
  provide: REDIS_CLIENT,
  useFactory: (configService: ConfigService) => {
    return new Redis({
      url: configService.get('UPSTASH_REDIS_REST_URL'),
      token: configService.get('UPSTASH_REDIS_REST_TOKEN'),
    });
  },
}
```

> **For local development:** Docker Redis works perfectly. No changes needed for local setup.

---

## Kubernetes Deployment (Future)

```
┌────────────────────────────────────────────────────────────┐
│  KUBERNETES ARCHITECTURE (Planned)                          │
│                                                             │
│  Namespace: gardenverse                                     │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Deployments                                          │  │
│  │  ├── backend-api          (3 replicas, HPA)           │  │
│  │  ├── ai-service           (2 replicas, GPU node)       │  │
│  │  ├── iot-gateway          (2 replicas)                │  │
│  │  ├── admin-panel          (2 replicas)                │  │
│  │  └── nginx-ingress        (2 replicas)                │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  StatefulSets                                         │  │
│  │  ├── postgres              (Primary + 2 Replicas)     │  │
│  │  ├── redis                 (Cluster, 3 nodes)         │  │
│  │  └── mosquitto             (Cluster, 2 nodes)         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ConfigMaps / Secrets                                 │  │
│  │  ├── app-config              (ConfigMap)              │  │
│  │  ├── db-secrets              (Secret)                  │  │
│  │  ├── jwt-keys                (Secret)                  │  │
│  │  └── api-keys                (Secret)                  │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### K8s Resource Limits
| Service | CPU Request | CPU Limit | Memory Request | Memory Limit |
|---------|-------------|-----------|----------------|--------------|
| backend-api | 500m | 1000m | 512Mi | 1Gi |
| ai-service | 1000m | 4000m | 2Gi | 8Gi (GPU) |
| iot-gateway | 200m | 500m | 256Mi | 512Mi |
| admin-panel | 200m | 500m | 256Mi | 512Mi |

---

## CI/CD Pipeline

See [CI/CD Documentation](./ci-cd.md) for detailed pipeline configuration.

**Summary:**
- **Backend:** Test → Lint → Build → Migrate → Deploy
- **Mobile:** Test → Lint → Build (EAS) → Submit to stores
- **Admin:** Test → Lint → Build → Deploy to CDN
- **AI Service:** Test → Build Docker → Push → Deploy

---

## Monitoring Setup

### Infrastructure Monitoring (Prometheus + Grafana)
```
┌────────────────────────────────────────────────────────────┐
│  METRICS COLLECTION                                         │
│                                                             │
│  Backend:                                                   │
│  ├── @nestjs/metrics (Prometheus endpoint)                  │
│  ├── HTTP request duration, rate, errors                    │
│  ├── BullMQ queue depth, processing time                    │
│  ├── Database connection pool, query performance            │
│  └── Redis cache hit rate, memory usage                    │
│                                                             │
│  System:                                                    │
│  ├── CPU / Memory / Disk usage                             │
│  ├── Network I/O                                            │
│  └── Container health status                               │
│                                                             │
│  Business:                                                  │
│  ├── Active users, DAU/MAU                                  │
│  ├── Crops planted, harvested                               │
│  ├── Marketplace transactions, volume                       │
│  └── AI scans performed                                     │
└────────────────────────────────────────────────────────────┘
```

### Alerts
- **Critical (PagerDuty/Slack):** Service down, 5xx > 1%, DB connection pool exhausted
- **Warning (Slack):** Latency > 500ms, queue depth > 1000, error rate > 0.1%
- **Info (Dashboard):** Low disk space, old SSL certs, high memory usage

### Error Tracking (Sentry)
- All backend exceptions captured
- Source maps uploaded for stack traces
- Performance tracing enabled (20% sample)
- Release tracking per deployment

---

## Backup Strategy

| Component | Frequency | Retention | Method |
|-----------|-----------|-----------|--------|
| PostgreSQL | Every 6 hours | 30 days | pg_dump + S3 |
| PostgreSQL (WAL) | Continuous | 7 days | WAL archiving |
| Redis (RDB) | Every hour | 24 hours | SAVE + S3 |
| File uploads (S3) | Real-time | Indefinite | S3 replication |
| AI models | Per update | Last 3 versions | S3 versioning |
| Configuration | Per change | 90 days | Git history |

### Backup Verification
- Automated restore test weekly
- Point-in-time recovery test monthly
- Disaster recovery drill quarterly

### Restore Procedure
```bash
# Download latest backup
aws s3 cp s3://gardenverse-backups/db/latest.sql.gz .

# Restore
gunzip -c latest.sql.gz | psql -h localhost -U gardenverse gardenverse

# Verify
npm run prisma:studio
```

---

## Scaling Guidelines

### Horizontal Scaling (Backend)
```
┌────────────────────────────────────────────────────────────┐
│  SCALING DECISION TREE                                      │
│                                                             │
│  API Latency > 200ms?                                       │
│  ├── Yes → Increase backend replicas                        │
│  │        (Target: 3-5 replicas per AZ)                    │
│  └── No  → Check database query performance                │
│                                                             │
│  Database CPU > 80%?                                        │
│  ├── Yes → Add read replicas, optimize queries              │
│  └── No  → Cache more aggressively                         │
│                                                             │
│  Redis Memory > 80%?                                        │
│  ├── Yes → Increase Redis cluster nodes                     │
│  └── No  → Adjust TTLs, eviction policy                    │
│                                                             │
│  Queue Depth > 10000?                                       │
│  ├── Yes → Add queue processors                             │
│  └── No  → Normal operation                                │
└────────────────────────────────────────────────────────────┘
```

### Auto-scaling Rules
| Metric | Target | Scale Up | Scale Down |
|--------|--------|----------|------------|
| CPU | 60% | > 70% for 5min | < 40% for 10min |
| Memory | 70% | > 80% for 5min | < 50% for 10min |
| Req/sec | - | > 1000 per instance | < 100 per instance |
| Queue depth | - | > 5000 | < 500 |

### Caching Strategy
- **Browser:** Static assets CDN-cached (1 year)
- **API:** Redis with 5-30 min TTL based on data type
- **Database:** Query result caching for heavy queries
- **CDN:** Image optimization with WebP, responsive sizes

---

## Rollback Procedures

### Backend Rollback
```bash
# 1. Revert to previous Docker image
docker pull gardenverse/backend:previous-tag
docker-compose up -d backend

# 2. If database migration needs rollback
# Run reverse migration SQL manually
psql -h localhost -U gardenverse gardenverse -f rollback.sql

# 3. Verify
curl http://localhost:4000/api/v1/health

# 4. Monitor error rates for 15 minutes
```

### Database Rollback
```
┌────────────────────────────────────────────────────────────┐
│  Database Rollback Procedure                                │
│                                                             │
│  1. STOP application (prevents writes)                      │
│  2. Identify the migration to rollback                     │
│  3. Run the DOWN migration SQL                             │
│     (Pre-verified in staging)                               │
│  4. Verify schema matches previous state                   │
│  5. Deploy previous application version                    │
│  6. RESTART application                                     │
│  7. Verify data integrity                                   │
│  8. Monitor for issues                                      │
│                                                             │
│  CRITICAL: Some migrations are irreversible                 │
│  (data type changes, column drops)                          │
│  In these cases, restore from backup.                       │
└────────────────────────────────────────────────────────────┘
```

### Full Disaster Recovery
1. Provision new infrastructure (Terraform)
2. Restore latest database backup
3. Restore Redis (RDB)
4. Deploy application containers
5. Verify health checks
6. Switch DNS
7. Monitor for 1 hour
8. Declare recovery complete
