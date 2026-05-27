# Scaling Strategy

## Horizontal Scaling Plan

```
┌────────────────────────────────────────────────────────────┐
│  SCALING ARCHITECTURE                                       │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Load Balancer (AWS ALB / Nginx)                      │  │
│  │  ├── Sticky sessions: OFF (stateless backend)        │  │
│  │  ├── Health check: GET /api/v1/health                │  │
│  │  ├── SSL termination at LB                            │  │
│  │  └── Weighted routing for canary deployments          │  │
│  └──────────────────────┬───────────────────────────────┘  │
│                          │                                   │
│          ┌───────────────┼───────────────┐                   │
│          ▼               ▼               ▼                   │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │  Backend     │ │  Backend     │ │  Backend     │        │
│  │  Instance 1  │ │  Instance 2  │ │  Instance N  │        │
│  │  (Stateless) │ │  (Stateless) │ │  (Stateless) │        │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘        │
│         │                │                │                  │
│         └────────────────┼────────────────┘                  │
│                          │                                   │
│  ┌───────────────────────▼───────────────────────────────┐  │
│  │  Redis Cluster                                        │  │
│  │  ├── 3 master nodes (sharded)                        │  │
│  │  ├── 3 replica nodes (HA)                            │  │
│  │  └── Slot-based key distribution                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  PostgreSQL Cluster                                   │  │
│  │  ├── 1 Primary (writes)                              │  │
│  │  ├── 2+ Replicas (reads, via pgcat/pgbouncer)        │  │
│  │  ├── Connection pooling (PgBouncer)                   │  │
│  │  └── Automated failover (Patroni)                    │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### Stateless Design
- All backend instances share no local state
- Session data in Redis
- File uploads go directly to S3 (presigned URLs)
- API rate limiting via Redis
- Socket.IO uses Redis adapter for cross-instance pub/sub
- Queue workers are stateless consumers

---

## Caching Strategy

```
┌────────────────────────────────────────────────────────────┐
│  MULTI-LAYER CACHING                                        │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  L1: Application Cache (In-Memory)                    │  │
│  │  ├── node-cache for hot data (per instance)           │  │
│  │  ├── Max 100 items, TTL 30s                          │  │
│  │  ├── Configuration, feature flags                     │  │
│  │  └── Eviction: LRU                                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  L2: Distributed Cache (Redis)                        │  │
│  │                                                       │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Cache-Aside Pattern                              │  │  │
│  │  │                                                   │  │  │
│  │  │  1. Check Redis for key                          │  │  │
│  │  │  2. On miss: query DB, set in Redis              │  │  │
│  │  │  3. On write: invalidate cache                   │  │  │
│  │  │  4. Return data                                   │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │                                                       │  │
│  │  Cache TTL by Data Type:                              │  │
│  │  ├── Weather data:        30 minutes                 │  │
│  │  ├── AI scan results:     1 hour                     │  │
│  │  ├── Leaderboards:        5 minutes                  │  │
│  │  ├── User profiles:       5 minutes                  │  │
│  │  ├── Garden stats:        5 minutes                  │  │
│  │  ├── Marketplace listings: 2 minutes                 │  │
│  │  ├── Government schemes:   1 hour                    │  │
│  │  └── Feature flags:       1 minute                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  L3: CDN (CloudFront / Cloudflare)                    │  │
│  │                                                       │  │
│  │  ├── Static assets (images, JS bundles)              │  │
│  │  ├── User uploads (avatars, scan images)             │  │
│  │  ├── TTL: 1 year for versioned assets                │  │
│  │  ├── TTL: 1 day for user content                     │  │
│  │  ├── Cache invalidation on upload                    │  │
│  │  ├── WebP auto-conversion                            │  │
│  │  └── DDoS protection (Cloudflare)                    │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### Cache Invalidation Strategy
```
┌────────────────────────────────────────────────────────────┐
│  INVALIDATION PATTERNS                                      │
│                                                             │
│  Write-Through:                                             │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                │
│  │  Write  │───►│  Update │───►│  Cache  │                │
│  │  API    │    │  DB     │    │  Delete │                │
│  └─────────┘    └─────────┘    └─────────┘                │
│                                                             │
│  Tag-Based Invalidation:                                    │
│  ├── Cache key pattern: {entity}:{id}:{field}              │
│  ├── Tags: user:{id}, garden:{id}, marketplace            │
│  ├── Invalidate by tag on related updates                  │
│  └── Example: update crop → invalidate garden:{id} cache  │
│                                                             │
│  Rate-Limited Invalidation:                                 │
│  ├── Coalesce rapid updates (debounce 500ms)               │
│  └── Avoid cache stampede on popular items                 │
└────────────────────────────────────────────────────────────┘
```

---

## CDN Strategy

```
┌────────────────────────────────────────────────────────────┐
│  CDN CONFIGURATION                                          │
│                                                             │
│  Domain: cdn.gardenverse.io                                 │
│  Provider: CloudFront or Cloudflare                         │
│  Origin: S3 Bucket or Backend (for dynamic)                │
│                                                             │
│  Routes:                                                    │
│  ├── /avatars/*             S3 origin, TTL 1 day           │
│  ├── /scans/*               S3 origin, TTL 1 day           │
│  ├── /listings/*            S3 origin, TTL 1 day           │
│  ├── /groups/*              S3 origin, TTL 1 day           │
│  ├── /static/*              S3 origin, TTL 1 year          │
│  │   (versioned with hash in filename)                     │
│  └── /api/*                 Backend origin, no cache       │
│                                                             │
│  Image Optimization:                                        │
│  ├── Auto-format: WebP (with AVIF fallback)                │
│  ├── Responsive images: 200w, 400w, 800w                  │
│  ├── Quality: 80% (balance quality/size)                   │
│  └── Thumbnails generated on upload (Sharp)               │
│                                                             │
│  Security:                                                  │
│  ├── Signed URLs for private content (scan images)        │
│  ├── WAF rules (rate limit, IP block, SQLi/XSS prevent)  │
│  ├── Geo-restriction (if required)                         │
│  └── Referrer validation                                   │
└────────────────────────────────────────────────────────────┘
```

---

## Database Sharding Plan

```
┌────────────────────────────────────────────────────────────┐
│  SHARDING STRATEGY (Phase 3+)                               │
│                                                             │
│  Current: Single PostgreSQL instance with read replicas    │
│  Future: Horizontal sharding by tenant/region               │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Option 1: CitusDB (PostgreSQL extension)            │  │
│  │  ├── Distributed tables across worker nodes          │  │
│  │  ├── Shard key: user_id (hash) or region             │  │
│  │  ├── Reference tables: lookup data (replicated)      │  │
│  │  └── Transparent to application (same query API)     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Option 2: Application-Level Sharding                │  │
│  │  ├── Shard key: region or user_id hash mod N         │  │
│  │  ├── Router service maps key to DB shard             │  │
│  │  ├── Cross-shard queries: scatter-gather pattern     │  │
│  │  └── More complex but more control                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Timeline:                                                  │
│  ├── 10k users: Single DB + replicas                       │
│  ├── 50k users: Connection pooling, query optimization     │
│  ├── 100k users: Read replicas (2-3), improved caching    │
│  ├── 500k users: CitusDB or application sharding          │
│  └── 1M+ users: Full sharding + read replicas per shard   │
└────────────────────────────────────────────────────────────┘
```

### Query Optimization
```sql
-- Current indexes cover primary query patterns:
CREATE INDEX idx_crop_garden_status ON Crop(gardenId, status);
CREATE INDEX idx_notification_user_read ON Notification(userId, isRead);
CREATE INDEX idx_listing_status_category ON MarketplaceListing(status, category);
CREATE INDEX idx_message_conversation ON Message(senderId, receiverId);
CREATE INDEX idx_sensor_timestamp ON SensorReading(deviceId, timestamp DESC);

-- Slow query monitoring:
-- pg_stat_statements for top elapsed time queries
-- EXPLAIN ANALYZE for query plan review
-- Missing index detection via pg_stat_user_indexes
```

---

## Performance Targets

| Metric | Current (Target) | Method |
|--------|-----------------|--------|
| API Response (p50) | < 50ms | Caching, query optimization |
| API Response (p95) | < 200ms | CDN, read replicas |
| API Response (p99) | < 500ms | Connection pooling, warm pools |
| WebSocket Latency | < 100ms | Redis adapter, co-located |
| DB Query (p95) | < 50ms | Indexing, query optimization |
| DB Connections | 200 pool | PgBouncer connection pooling |
| Concurrent Users | 10,000 | Horizontal pod autoscaling |
| Image Load Time | < 1s | CDN, WebP, responsive sizes |
| App Startup (cold) | < 3s | Code splitting, lazy loading |
| App Startup (warm) | < 1.5s | Hermes engine, cached bundles |

---

## Infrastructure Cost Estimates

| Component | Base (1k users) | Growth (10k users) | Scale (100k users) |
|-----------|-----------------|---------------------|--------------------|
| Backend (ECS/EKS) | 2× t3.medium | 4× t3.large | 10× t3.xlarge |
| Database | db.t3.medium | db.r6g.large + replica | db.r6g.2xlarge + 2 replicas |
| Redis | t3.micro | t3.medium cluster | r6g.large cluster (3 nodes) |
| CDN | Included | 1 TB/month | 10 TB/month |
| AI Service | 1 GPU spot | 1 GPU on-demand | 2 GPU reserved |
| S3 Storage | 10 GB | 100 GB | 1 TB |
| Total (est.) | ~$150/mo | ~$800/mo | ~$4,000/mo |
