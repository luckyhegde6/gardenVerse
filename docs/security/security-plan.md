# Security Plan

## 1. Authentication

### JWT Strategy
- **Algorithm:** RS256 (RSA PKCS#1 v1.5)
- **Access Token:** 15 minute expiry, stored in memory (mobile) / HTTP-only cookie (admin)
- **Refresh Token:** 7 day expiry, stored in SecureStore (mobile) / HttpOnly cookie (admin)
- **Rotation:** Refresh token rotated on each use; old token invalidated
- **Revocation:** Server-side blocklist in Redis on logout/suspension
- **Issuer Validation:** `iss` claim verified on every request

### OTP System
- **Generation:** Cryptographically secure random 6-digit code (RFC 6238 TOTP)
- **Delivery:** Email (SMTP) or SMS (Twilio)
- **Expiry:** 5 minutes
- **Rate Limit:** Max 3 attempts per code, max 5 codes/hour per user
- **Hash:** Stored as SHA-256 hash in Redis (never plaintext)

### Password Policies
- Minimum 8 characters, max 128
- Require: uppercase, lowercase, digit, special character
- Bcrypt with 12 salt rounds
- Password history: last 5 passwords stored
- Rate limit: 5 attempts per 15 minutes per email

---

## 2. Authorization (RBAC)

### Roles
| Role | Permissions |
|------|------------|
| `USER` | Own profile, garden, crops, marketplace, chat |
| `MODERATOR` | All USER + moderation actions, report review |
| `REGIONAL_MODERATOR` | All MODERATOR + region-specific admin |
| `ADMIN` | All REGIONAL_MODERATOR + user management, flag management |
| `SUPER_ADMIN` | All ADMIN + role assignment, system config |

### Guard Implementation
```
┌──────────────────────────────────────────────────────┐
│  @Roles('ADMIN')                                     │
│  @UseGuards(JwtAuthGuard, RolesGuard)                 │
│  @Controller('admin')                                 │
│                                                       │
│  Guards chain:                                        │
│  1. JwtAuthGuard - validates token, attaches user    │
│  2. RolesGuard - checks user.role against @Roles     │
│  3. ThrottlerGuard - rate limiting                   │
│  4. SelfGuard - ensures user can only modify self    │
└──────────────────────────────────────────────────────┘
```

### Permission Checks at Service Layer
- Ownership validation: user must own resource
- Resource isolation: users cannot access other users' data
- Admin scoping: moderators restricted to their region
- Soft delete: all deletions are logical (deletedAt)

---

## 3. Data Encryption

### At Rest (Database)
- **PostgreSQL TDE:** Transparent Data Encryption at storage level
- **Sensitive Columns:** Password hashes (bcrypt), refresh tokens (AES-256-GCM)
- **Chat Messages:** Encrypted with libsodium (E2E) before storage
- **PII Fields:** Email, phone stored encrypted at column level
- **Backups:** Encrypted with GPG before offsite transfer

### In Transit (Network)
- **TLS 1.3:** All HTTP and WebSocket connections
- **HSTS:** Strict-Transport-Security header, 1 year max-age
- **MQTT TLS:** MQTT over TLS 1.3 with client certificates
- **API-to-API:** mTLS between backend services (AI, IoT gateway)

### End-to-End Encryption (Messaging)
- **Algorithm:** XChaCha20-Poly1305 (libsodium secretstream)
- **Key Exchange:** X25519 Diffie-Hellman
- **Key Storage:** Each user's private key encrypted with their password (Argon2id derived key)
- **Perfect Forward Secrecy:** New key pair per conversation session
- **Metadata:** Sender, receiver, timestamp visible; content encrypted

---

## 4. API Security

### Rate Limiting
```
┌──────────────────────────────────────────────────────┐
│  ThrottlerModule (NestJS)                             │
│                                                       │
│  Global: 100 requests / 60 seconds per IP            │
│  Auth:   5  requests / 15 minutes per email          │
│  OTP:    3  requests / 5  minutes per email          │
│  Chat:   30 requests / 10 seconds per user           │
│  QR:     10 requests / minute per user               │
│  IoT:    60 requests / minute per device             │
│  AI:     10 requests / minute per user               │
└──────────────────────────────────────────────────────┘
```

### Helmet Configuration
- Content-Security-Policy: restrictive
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera(), geolocation(), microphone()

### CORS
- Allowed origins: whitelist (production URLs)
- Methods: GET, POST, PATCH, DELETE, OPTIONS
- Headers: Content-Type, Authorization, X-Requested-With
- Credentials: true (for cookie-based auth in admin)
- Max age: 86400 seconds

### Input Validation
- class-validator DTOs with whitelist: true
- forbidNonWhitelisted: true
- Transform: automatic type coercion
- Sanitization: HTML entity encoding for text fields
- Size limits: request body max 10MB, file upload max 5MB

---

## 5. QR Security

### Signature Scheme
- **Algorithm:** HMAC-SHA256 with per-session key
- **Payload structure:** `base64(IV + ciphertext + authTag)`
- **Key rotation:** QR signing key rotated every 24 hours
- **Key derivation:** `sessionKey = HKDF(masterKey, sessionId, nonce)`

### Expiration
- All QR codes expire (default 30 minutes, max 24 hours)
- Server enforces expiration check before use
- Expired QR codes are rejected with 410 Gone

### Replay Protection
- Each QR has a unique session UUID
- Used sessions stored in Redis with EXPIRE
- Double-spend detection: atomic check-and-set
- Rate limit: 1 use per QR code

---

## 6. IoT Security

### Device Trust
- **Registration:** Each device registers with a public key
- **Firmware verification:** SHA-256 hash of firmware signed by manufacturer
- **Device attestation:** TPM-based or software attestation
- **Heartbeat:** Devices must ping every 5 minutes or be marked offline

### Authentication
- **MQTT:** Client certificates (X.509), unique per device
- **API:** HMAC signature with device private key
- **Token exchange:** Device gets short-lived JWT for REST API

### Sensor Validation
- **Range checking:** Values outside normal range rejected
- **Temporal consistency:** Sudden spikes flagged for review
- **Cross-validation:** Compare with weather station data
- **Trust scoring:** Device trust score decreases on anomalies
- **Rate limit:** Max 1 reading per 30 seconds per sensor

---

## 7. Anti-Cheat

### Fake GPS Detection
- **GPS vs IP:** Cross-reference GPS coordinates with IP geolocation
- **Speed check:** Impossible travel speed detection (> 1000 km/h)
- **Accuracy:** Reject GPS with accuracy > 100m
- **Spoofing detection:** Check for mock location APIs on mobile
- **Consistency:** Multiple location samples over time must be consistent

### Spoofing Prevention
- **Request signing:** Mobile requests signed with device key
- **Certificate pinning:** SSL certificate pinning in mobile app
- **Nonce:** Each request includes a unique nonce
- **Timestamp validation:** Request timestamps within 30 seconds of server time
- **Device fingerprint:** Collect device attributes for anomaly detection

### Reputation-Based Trust
- New users start with trust score of 100
- Trust score decreases on suspicious activity
- Below 50: limitations on marketplace, trading
- Below 20: manual review required
- Below 0: automatic suspension

---

## 8. Blockchain Security

### Smart Contract Security
- **Audited:** All contracts audited by third-party
- **OpenZeppelin:** Using audited base contracts
- **Access Control:** Role-based access (DEFAULT_ADMIN_ROLE, MARKETPLACE_ROLE)
- **ReentrancyGuard:** All value-transferring functions protected
- **Pausable:** Emergency pause capability for contracts

### Signature Validation
- **Off-chain signatures:** EIP-712 typed data signing
- **Transaction signing:** User signs with wallet (MetaMask, WalletConnect)
- **Gas station:** Backend pays gas, user signs typed data

### Escrow Security
- **Timelock:** 7-day escrow period
- **Dispute resolution:** Admin can force release/refund
- **No direct withdrawal:** Funds only go to buyer or seller
- **Deadline auto-release:** Seller can claim after deadline

---

## 9. Session Management

### Session Creation
- Session created on login with unique JWT ID (jti)
- Stored in Redis: `session:{jti} -> { userId, role, deviceInfo, createdAt }`
- Max 5 concurrent sessions per user (enforced)

### Session Validation
- Every authenticated request checks Redis for valid session
- Revoked sessions rejected immediately
- Device fingerprint mismatch triggers re-authentication

### Session Termination
- **Logout:** Deletes session from Redis, adds JTI to blocklist
- **Password change:** All sessions terminated
- **Role change:** All sessions terminated
- **Suspension:** All sessions terminated, new login blocked
- **Timeout:** Idle sessions expire after 24 hours

---

## 10. Audit Logging

```
┌──────────────────────────────────────────────────────┐
│  AuditLog Model                                       │
│                                                       │
│  All security-relevant events logged to AuditLog:     │
│                                                       │
│  ┌─────────────────────────────────────────────────┐  │
│  │  Events:                                         │  │
│  │  ├── auth.login, auth.logout, auth.failed        │  │
│  │  ├── user.role_change, user.suspend, user.ban    │  │
│  │  ├── garden.delete, crop.batch_action            │  │
│  │  ├── marketplace.purchase, marketplace.dispute   │  │
│  │  ├── admin.* (all admin actions)                 │  │
│  │  ├── moderation.action                           │  │
│  │  ├── iot.device_register, iot.device_remove      │  │
│  │  ├── qr.generate, qr.use, qr.replay_attempt      │  │
│  │  └── security.* (rate limit, suspicious)         │  │
│  └─────────────────────────────────────────────────┘  │
│                                                       │
│  Audit log retention: 1 year                          │
│  Sensitive events: indefinite (auth, admin)           │
│  Storage: Separate write-only database                │
│  Immutable: Append-only, no update/delete             │
└──────────────────────────────────────────────────────┘
```

---

## 11. Incident Response Plan

| Phase | Actions | Timeline |
|-------|---------|----------|
| **Detection** | Automated alerts (Sentry, Prometheus), user reports, anomaly detection | Real-time |
| **Triage** | Classify severity (S1-Critical, S2-High, S3-Medium, S4-Low), assign responder | 15 min |
| **Containment** | Revoke tokens, suspend accounts, block IPs, disable features, pause marketplace | 30 min |
| **Eradication** | Patch vulnerability, rotate keys, clean compromised data | 4 hours |
| **Recovery** | Restore from backup, verify integrity, re-enable services | 8 hours |
| **Post-mortem** | Root cause analysis, timeline, prevention measures, document | 48 hours |

### Communication
- S1: Notify all users within 1 hour
- S2: Notify affected users within 4 hours
- S3: Post-mortem shared within 1 week
- S4: Internal tracking ticket

---

## 12. OWASP Top 10 Compliance

| # | Category | Mitigation |
|---|----------|------------|
| A01 | Broken Access Control | RBAC, ownership checks, @SelfGuard |
| A02 | Cryptographic Failures | AES-256-GCM, bcrypt, TLS 1.3, libsodium |
| A03 | Injection | Prisma parameterized queries, class-validator |
| A04 | Insecure Design | Threat modeling, security review in CI |
| A05 | Security Misconfiguration | Helmet, CORS, automated config scanning |
| A06 | Vulnerable Components | Dependabot, Snyk, weekly dependency audit |
| A07 | Auth Failures | JWT with rotation, rate limiting, account lockout |
| A08 | Data Integrity Failures | QR signing, IoT signatures, blockchain escrow |
| A09 | Logging Failures | Comprehensive audit logging, immutable storage |
| A10 | SSRF | URL whitelist, internal network isolation |
