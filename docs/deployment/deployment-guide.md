# Deployment Guide

## Prerequisites

### Required Software
- **Node.js** >= 22.0.0 (LTS)
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

## Queue Architecture (BullMQ)

BullMQ powers all background job processing in GardenVerse. It uses Redis as the backing store and provides reliable job scheduling, retries, and concurrency control.

### Queues

| Queue Name | Concurrency | Retries | Purpose |
|------------|-------------|---------|---------|
| `growth-queue` | 5 | 3 (60s backoff) | Crop growth tick, water evaporation |
| `ai-scan-queue` | 3 | 2 (30s timeout) | Plant scan processing, disease detection |
| `email-queue` | 10 | 3 (30s backoff) | Welcome emails, password resets, notifications |
| `notify-queue` | 10 | 3 (30s backoff) | Push notifications, in-app alerts |
| `iot-ingest-queue` | 20 | 1 | Sensor data ingestion and verification |
| `weather-queue` | 2 | 3 (120s backoff) | Weather data refresh, forecast fetch |
| `blockchain-queue` | 1 (sequential) | 5 (60s backoff) | Smart contract submissions |

### Job Lifecycle
```
Job Added → Wait Queue → Active (processing) → Completed
                                               → Failed → Retry (with backoff)
                                                       → Dead Letter Queue (exhausted retries)
```

### Monitoring
- **Bull Board**: Accessible at `/admin/queues` when running in development mode
- **Admin Dashboard**: Queue metrics displayed in the admin panel (depth, processing time, failure rate)
- **Alerts**: Slack notifications when queue depth exceeds 10,000 or failure rate > 5%

### Graceful Degradation
- If Redis is unavailable, BullMQ falls back to in-process execution (limited concurrency)
- Dead letter queues are monitored by ops and can be replayed via admin panel
- Critical jobs (crop growth ticks) have priority queuing

### Code Example
```typescript
// Processing a queue job
@Processor('ai-scan-queue')
export class AiScanProcessor {
  @Process('ai.scan.process')
  async handleScan(job: Job<{ scanId: string }>) {
    const { scanId } = job.data;
    try {
      const result = await this.aiService.processScan(scanId);
      await this.notificationService.notifyScanComplete(scanId);
      return result;
    } catch (error) {
      this.logger.error(`Scan ${scanId} failed: ${error.message}`);
      throw error; // BullMQ handles retry
    }
  }
}
```

---

## Sidecar Pattern for Logs and IoT

Sidecar containers/processes run alongside the main application to handle specific cross-cutting concerns. This pattern keeps the main application focused on business logic while delegating infrastructure tasks to dedicated workers.

### Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    APPLICATION NODE                          │
│                                                             │
│  ┌──────────────────┐    ┌──────────────────────────────┐  │
│  │  Main Container   │    │  Sidecar: Log Aggregator     │  │
│  │  (NestJS Backend) │    │  - Reads stdout/stderr       │  │
│  │                   │    │  - Formats as JSON           │  │
│  │  - REST API       │    │  - Batches & ships to        │  │
│  │  - BullMQ Jobs    │    │    CloudWatch / Logtail      │  │
│  │  - WebSocket      │    │                              │  │
│  └──────────────────┘    └──────────────────────────────┘  │
│                                                             │
│  ┌──────────────────┐    ┌──────────────────────────────┐  │
│  │  Sidecar: IoT      │    │  Sidecar: Notifications     │  │
│  │  Event Processor   │    │  Streamer                   │  │
│  │  - MQTT consumer   │    │  - WebSocket server         │  │
│  │  - Sensor validate │    │  - SSE push                 │  │
│  │  - Data enrichment │    │  - Connection manager       │  │
│  │  - Forward to API  │    │  - Broadcast to rooms       │  │
│  └──────────────────┘    └──────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Shared Volume: /var/log/gardenverse                  │  │
│  │  (used by main + sidecar for log shipping)            │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### 1. Log Aggregation Sidecar
- **Function**: Collects structured JSON logs from the main application
- **Communication**: Reads from a shared volume (`/var/log/gardenverse`) or from stdout
- **Output**: Batches logs and transmits to CloudWatch Logs / Logtail / Elasticsearch
- **Buffer**: In-memory buffer with disk spillover if the remote endpoint is unreachable
- **Configuration**: Environment variables determine the log destination

### 2. IoT Event Processing Sidecar
- **Function**: Dedicated worker for high-volume sensor data
- **Communication**: Subscribes to MQTT topics and publishes processed events to the main API
- **Why sidecar?**: IoT data arrives at high frequency (potentially 1000s of readings/sec). Isolating this processing prevents main API contention.
- **Flow**:
  ```
  MQTT → IoT Sidecar → Validate → Enrich → Batch → POST /api/v1/iot/readings
  ```
- **Scaling**: Deploy 1 IoT sidecar per MQTT partition. Use Redis for deduplication.

### 3. Notification Streaming Sidecar
- **Function**: Manages persistent WebSocket connections for real-time push
- **Communication**: Main app sends notifications via a Redis pub/sub channel; the sidecar receives and broadcasts to connected clients
- **Scaling**: Each sidecar handles up to 10,000 concurrent WebSocket connections. Use Redis pub/sub to broadcast across sidecar instances.

### Docker Compose Example
```yaml
services:
  backend:
    image: gardenverse/backend:latest
    volumes:
      - shared-logs:/var/log/gardenverse
    depends_on: [redis, postgres]

  log-sidecar:
    image: gardenverse/log-sidecar:latest
    volumes:
      - shared-logs:/var/log/gardenverse
    environment:
      LOG_DESTINATION: cloudwatch
      CLOUDWATCH_LOG_GROUP: gardenverse-backend
    depends_on: [backend]

  iot-sidecar:
    image: gardenverse/iot-sidecar:latest
    depends_on: [redis, backend]
    environment:
      MQTT_BROKER: mqtt://mosquitto:1883
      API_URL: http://backend:3001/api/v1
```

### Scaling Considerations
- Sidecars scale 1:1 with main application instances in production
- IoT sidecar can be independently scaled if sensor volume is high
- Log sidecar is lightweight (~50MB RAM) and adds minimal overhead
- Notification sidecar uses Redis for state, making it horizontally scalable

---

## Logger Strategy

### Structured Logging
All services use structured JSON logging for machine-parsable output.

**Log Format:**
```json
{
  "timestamp": "2026-05-27T12:00:00.123Z",
  "level": "info",
  "context": "GardensService",
  "message": "Garden created successfully",
  "metadata": {
    "userId": "usr_abc123",
    "gardenId": "gdn_xyz789",
    "duration": 45
  }
}
```

### Log Levels

| Level | Usage | Example |
|-------|-------|---------|
| `debug` | Development diagnostics | Query parameters, raw data |
| `info` | Normal operations | User created, crop planted |
| `warn` | Unexpected but handled | API fallback used, degraded mode |
| `error` | Operation failure | External API timeout, DB error |

### NestJS Logger Implementation
```typescript
import { Logger } from '@nestjs/common';

export class GardensService {
  private readonly logger = new Logger(GardensService.name);

  async createGarden(userId: string, dto: CreateGardenDto) {
    this.logger.log({ message: 'Creating garden', userId });
    try {
      const garden = await this.prisma.garden.create({ data: { ...dto, userId } });
      this.logger.log({ message: 'Garden created', gardenId: garden.id, duration: Date.now() - start });
      return garden;
    } catch (error) {
      this.logger.error({ message: 'Failed to create garden', userId, error: error.message });
      throw error;
    }
  }
}
```

### Log Aggregation

| Environment | Destination | Retention | Method |
|-------------|-------------|-----------|--------|
| **Development** | File system (`logs/`) | 7 days | Winston file transport |
| **Staging** | CloudWatch / Logtail | 30 days | Sidecar log shipper |
| **Production** | CloudWatch / Logtail + Sentry | 90 days | Sidecar log shipper + Sentry SDK |
| **Error tracking** | Sentry | 90 days | `@sentry/node` SDK |

### Best Practices
- **Never log secrets**: Passwords, tokens, and API keys are filtered before logging
- **Always log context**: Include userId, requestId, and correlationId
- **Structured fields**: Use objects, not string concatenation
- **Error logging**: Always include error stack trace and relevant context
- **Performance**: Async logging to avoid blocking the event loop
- **Sampling**: Debug logs are sampled (1/1000) in production to reduce volume

---

## Supabase Integration

Supabase provides a managed backend-as-a-service alternative to self-hosted infrastructure.

### Auth (Supabase Auth)
- **Type**: Alternative to JWT-based authentication
- **Features**: Email/password, OAuth (Google, GitHub), magic links
- **Integration**: NestJS can use Supabase Auth with the `@supabase/supabase-js` client
- **Migration path**: Existing JWT users can be migrated to Supabase Auth
- **Configuration**: `SUPABASE_URL` + `SUPABASE_ANON_KEY` in environment variables

### Storage (Supabase Storage)
- **Use cases**: Plant photos, user avatars, scan images
- **Integration**: UploadModule can be configured to use Supabase Storage instead of S3
- **Access control**: Row Level Security (RLS) policies on storage buckets
- **Configuration**:
  ```
  UPLOAD_PROVIDER=supabase        # or 's3'
  SUPABASE_STORAGE_BUCKET=gardenverse-uploads
  ```
- **File limits**: 10MB max file size, image/png and image/jpeg only

### Database (Managed PostgreSQL)
- **Type**: Supabase provides managed PostgreSQL 15+ with pgvector support
- **Connection**: Prisma connects via standard `DATABASE_URL`
- **Extensions**: Supports `postgis` (geospatial), `pgvector` (AI embeddings), `pgcrypto`
- **Connection pooling**: Use `supavisor` connection pooler for serverless environments
- **Configuration**:
  ```
  DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:6543/postgres?pgbouncer=true
  DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
  ```

### Realtime (Supabase Realtime)
- **Use cases**: Live garden updates, chat messages, notification streaming
- **Integration**: Can replace or complement Socket.IO
- **Broadcast**: Server broadcasts changes via Supabase Realtime channels
- **Client**: Mobile apps subscribe directly to Realtime channels
- **Note**: For high-throughput scenarios, Socket.IO remains the preferred solution

### Configuration Variables
```
# Supabase (Optional - alternative to local Postgres)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_PROJECT_REF=your-project-ref
SUPABASE_STORAGE_BUCKET=gardenverse-uploads

# Database (when using Supabase as managed Postgres)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
```

---

## Vercel Deployment Considerations

> **Key Limitation:** Vercel's serverless functions do not support persistent TCP connections, which means direct Redis connections via `ioredis` will **not** work in a Vercel deployment.

### Deploying the Admin Dashboard

The admin dashboard (Next.js app in `packages/admin`) can be deployed directly to Vercel.

#### Steps
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Link project (first time only)
vercel link --project gardenverse-admin

# 4. Set environment variables
vercel env add NEXT_PUBLIC_API_URL
vercel env add NEXTAUTH_SECRET
# ... add all required vars

# 5. Deploy
vercel --prod
```

#### Required Environment Variables
```
NEXT_PUBLIC_API_URL=https://gardenverse-api.vercel.app/api/v1
NEXTAUTH_URL=https://gardenverse-admin.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret
```

#### Build Configuration (`vercel.json`)
```json
{
  "buildCommand": "npm run build -w packages/admin",
  "outputDirectory": "packages/admin/.next",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

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
│              VERCEL DEPLOYMENT ARCHITECTURE                 │
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

### Serverless Function Limitations

When deploying to Vercel, be aware of these limits:

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| **Execution timeout** | 60s (Hobby), 300s (Pro), 900s (Enterprise) | Migrate long-running tasks to worker service |
| **Memory** | 1024MB (Hobby/Pro) | Keep API endpoints lightweight |
| **No persistent connections** | Redis, DB connections | Use connection poolers (Supavisor, PgBouncer) |
| **Cold starts** | 1-5s initial latency | Use Vercel Edge Functions for critical paths |
| **WebSocket** | Limited support (Vercel Edge only) | Run Socket.IO on separate worker service |
| **File system writes** | Read-only (except /tmp) | Use S3/Supabase Storage for uploads |

### Migration Path by Component

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
