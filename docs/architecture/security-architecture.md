# Security Architecture

## SSL/TLS Configuration

```
┌────────────────────────────────────────────────────────────┐
│  TLS TERMINATION & CERTIFICATE CHAIN                        │
│                                                             │
│  User ──HTTPS──► Nginx ──HTTP──► Backend                    │
│                  (TLS 1.3)        (Internal)                │
│                                                             │
│  Certificate Chain:                                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Root CA (offline)                                    │  │
│  │  └── Intermediate CA                                   │  │
│  │      └── *.gardenverse.io (wildcard)                  │  │
│  │      └── api.gardenverse.io                           │  │
│  │      └── ws.gardenverse.io                            │  │
│  │      └── cdn.gardenverse.io                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  TLS Versions: TLS 1.2 (compatibility), TLS 1.3 (preferred) │
│  Cipher Suites (preferred):                                 │
│  - TLS_AES_256_GCM_SHA384 (TLS 1.3)                       │
│  - TLS_CHACHA20_POLY1305_SHA256 (TLS 1.3)                 │
│  - ECDHE-RSA-AES256-GCM-SHA384 (TLS 1.2)                  │
│                                                             │
│  HSTS: max-age=31536000; includeSubDomains; preload        │
│  OCSP Stapling: Enabled                                     │
│  SSL Session Cache: 1 hour                                  │
└────────────────────────────────────────────────────────────┘
```

### Internal Communication
```
┌────────────────────────────────────────────────────────────┐
│  INTERNAL mTLS                                              │
│                                                             │
│  Backend ◄──mTLS──► AI Service                              │
│  Backend ◄──mTLS──► IoT Gateway                             │
│  Backend ◄──TLS──► PostgreSQL                               │
│  Backend ◄──TLS──► Redis                                    │
│  IoT Gateway ◄──TLS──► Mosquitto (MQTT)                    │
│                                                             │
│  Service mesh: (future)                                     │
│  Backend ◄──mTLS──► Sidecar ◄──mTLS──► AI Service          │
│                              (Envoy/Istio)                  │
└────────────────────────────────────────────────────────────┘
```

---

## Encryption Layers

```
┌────────────────────────────────────────────────────────────┐
│  ENCRYPTION AT REST                                         │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Database (PostgreSQL)                                │  │
│  │  ├── TDE: Transparent Data Encryption (disk level)   │  │
│  │  ├── Column-level:                                    │  │
│  │  │   ├── password_hash: bcrypt (one-way)              │  │
│  │  │   ├── refresh_token: AES-256-GCM                   │  │
│  │  │   ├── email: AES-256-GCM                           │  │
│  │  │   ├── phone: AES-256-GCM                           │  │
│  │  │   ├── latitude/longitude: AES-256-GCM              │  │
│  │  │   └── message.content: libsodium E2E               │  │
│  │  └── Backup: GPG encrypted with offline key           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  File Storage (S3)                                    │  │
│  │  ├── SSE-S3: Server-side encryption                  │  │
│  │  ├── Avatars: public-read ACL                         │  │
│  │  ├── Scan images: private, presigned URLs             │  │
│  │  └── Listing images: public-read, CDN-cached          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Redis                                                │  │
│  │  ├── AUTH password required                           │  │
│  │  ├── TLS for replication                              │  │
│  │  └── No persistence for sensitive session data        │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## Key Management

```
┌────────────────────────────────────────────────────────────┐
│  KEY MANAGEMENT STRATEGY                                    │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Key Hierarchy                                        │  │
│  │                                                       │  │
│  │  Master Key (HSM/KMS)                                 │  │
│  │  └── Application Keys (encrypted by Master Key)       │  │
│  │      ├── JWT Private/Public (RS256)                   │  │
│  │      ├── QR Signing Key (HMAC-SHA256)                  │  │
│  │      ├── Database Encryption Key (AES-256-GCM)        │  │
│  │      ├── Messaging Key (X25519 seed)                  │  │
│  │      └── Session Secret (HMAC-SHA256)                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Key Storage                                          │  │
│  │  ├── Production: AWS KMS / HashiCorp Vault           │  │
│  │  ├── Staging: Encrypted env file (Vault transit)     │  │
│  │  ├── Development: .env file (never committed)        │  │
│  │  └── Backup: Printed + HSM backup (offline vault)    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Key Rotation Policy                                  │  │
│  │  ├── JWT Signing:       Every 90 days                │  │
│  │  ├── QR Signing:        Every 24 hours               │  │
│  │  ├── DB Encryption:     Every 180 days               │  │
│  │  ├── Session Secret:    Every 30 days                │  │
│  │  ├── Messaging Seed:    Every 90 days                │  │
│  │  └── Master Key:        Annually                     │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## Authentication Flow Diagrams

### Full Registration + Verification

```
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│  Client   │      │  Backend │      │   Email  │      │   Redis  │
├──────────┤      ├──────────┤      ├──────────┤      ├──────────┤
│ Register  │─────►│          │      │          │      │          │
│ {email,   │      │ Validate  │      │          │      │          │
│  password,│      │ Hash pw   │      │          │      │          │
│  username}│      │ (bcrypt)  │      │          │      │          │
│           │      │ Create    │      │          │      │          │
│           │      │ user (DB) │      │          │      │          │
│           │      │ Gen OTP   │─────►│ Send OTP │      │          │
│           │      │           │      │ Email    │      │          │
│           │      │ Store OTP │─────────────────────────►│ SETEX   │
│           │      │ hash      │      │          │      │ 5min    │
│◄─── 201   │◄─────│           │      │          │      │          │
│ "verify   │      │           │      │          │      │          │
│  email"   │      │           │      │          │      │          │
└──────────┘      └──────────┘      └──────────┘      └──────────┘

┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│  Client   │      │  Backend │      │   DB     │      │   Redis  │
├──────────┤      ├──────────┤      ├──────────┤      ├──────────┤
│ Verify   │─────►│          │      │          │      │          │
│ OTP      │      │ Check    │─────────────────────────►│ GET hash │
│ {email,  │      │ rate     │      │          │      │          │
│  otp}    │      │ limit    │      │          │◄─────│ hash     │
│           │      │ Compare   │      │          │      │          │
│           │      │ OTP hash │      │          │      │          │
│           │      │ Mark     │─────►│ UPDATE   │      │          │
│           │      │ verified │      │ isVerif. │      │          │
│           │      │ Gen JWT  │      │ = true   │      │          │
│           │      │ Store    │─────────────────────────►│ Store   │
│           │      │ session  │      │          │      │ session  │
│◄── tokens│◄─────│           │      │          │      │          │
└──────────┘      └──────────┘      └──────────┘      └──────────┘
```

### JWT Refresh Flow

```
┌──────────┐      ┌──────────┐      ┌──────────┐
│  Client   │      │  Backend │      │   Redis  │
├──────────┤      ├──────────┤      ├──────────┤
│ POST      │─────►│          │      │          │
│ /refresh  │      │          │      │          │
│ {refresh  │      │ Hash     │─────►│ GET      │
│  token}   │      │ token    │      │ session  │
│           │      │          │◄─────│ exists   │
│           │      │ Verify   │      │          │
│           │      │ not      │      │          │
│           │      │ revoked  │      │          │
│           │      │ Gen new  │      │          │
│           │      │ access   │      │          │
│           │      │ token    │      │          │
│           │      │ Rotate   │      │          │
│           │      │ refresh  │─────►│ SET new  │
│           │      │ token    │      │ + DEL old│
│◄── tokens│◄─────│           │      │          │
└──────────┘      └──────────┘      └──────────┘
```

### OAuth Flow (Future)

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Client   │    │  Backend │    │ Google/  │    │   DB /   │
│           │    │          │    │  Apple    │    │   Redis  │
├──────────┤    ├──────────┤    ├──────────┤    ├──────────┤
│ Login     │───►│ Redirect │───►│ Consent  │    │          │
│ with      │    │ to OAuth │    │ Screen   │    │          │
│ Google    │    │ provider │    │          │    │          │
│           │    │          │◄───│ Auth code│    │          │
│           │    │ Exchange │───►│ Verify   │    │          │
│           │    │ code     │    │ token    │    │          │
│           │    │          │◄───│ User info│    │          │
│           │    │ Find or  │    │          │───►│ Upsert   │
│           │    │ create   │    │          │    │ user     │
│           │    │ Gen JWT  │    │          │───►│ Store    │
│           │    │          │    │          │    │ session  │
│◄───tokens│◄────│          │    │          │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

---

## Service-to-Service Auth

```
┌────────────────────────────────────────────────────────────┐
│  INTERNAL AUTHENTICATION                                    │
│                                                             │
│  API Service → AI Service:                                  │
│  ├── mTLS (mutual TLS)                                      │
│  ├── API Key in headers (rotated monthly)                  │
│  └── Request signed with service account JWT               │
│                                                             │
│  API Service → IoT Gateway:                                 │
│  ├── mTLS                                                    │
│  └── Internal network only (VPC/subnet)                     │
│                                                             │
│  IoT Device → MQTT Broker:                                  │
│  ├── X.509 client certificate                               │
│  ├── Unique cert per device                                 │
│  └── Revocable via CRL                                      │
│                                                             │
│  IoT Device → API (REST ingest):                            │
│  ├── HMAC-SHA256 signature of request body                  │
│  ├── Device public key stored during registration           │
│  └── Nonce + timestamp to prevent replay                    │
└────────────────────────────────────────────────────────────┘
```
