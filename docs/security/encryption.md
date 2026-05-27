# Encryption Details

## AES-256-GCM for QR Payloads

```
┌────────────────────────────────────────────────────────────┐
│  QR Payload Encryption                                      │
│                                                             │
│  Algorithm: AES-256-GCM (Galois/Counter Mode)               │
│  Key Size: 256 bits                                         │
│  IV: 96 bits (random, generated per payload)                │
│  Auth Tag: 128 bits                                         │
│  Key Derivation: HKDF-SHA256 from master key                │
│                                                             │
│  Encryption Process:                                        │
│  ┌─────────┐   ┌──────────┐   ┌──────────────────┐        │
│  │ Payload  │──►│ AES-256  │──►│ Base64 URL-safe  │──► QR  │
│  │ (JSON)   │   │ GCM      │   │ Encode           │    Data│
│  └─────────┘   └──────────┘   └──────────────────┘        │
│                     │                                      │
│                     IV(12B) + Ciphertext + AuthTag(16B)    │
│                                                             │
│  Output Format:                                             │
│  gardenverse://qr/{sessionId}?d={base64}&s={hmac_sig}      │
└────────────────────────────────────────────────────────────┘
```

### Key Rotation
- Master QR key rotated every 24 hours
- Old key retained for 1 hour grace period for in-flight QRs
- Key stored in environment variable `QR_SIGNING_KEY`

---

## Libsodium for Messaging

```
┌────────────────────────────────────────────────────────────┐
│  End-to-End Encryption (Messaging)                          │
│                                                             │
│  Key Exchange:                                              │
│  ┌──────┐         ┌──────┐                                  │
│  │User A│         │User B│                                  │
│  │  skA │──X25519→│  pkB │──► Shared Secret (K)            │
│  │  pkA │←─────── │  skB │                                  │
│  └──────┘         └──────┘                                  │
│                                                             │
│  Message Encryption (XChaCha20-Poly1305):                   │
│  ┌────────────┐   ┌──────────────┐   ┌────────────────┐    │
│  │ Plaintext   │──►│ XChaCha20    │──►│ Base64 Encoded │    │
│  │ Message     │   │ Poly1305     │   │ + Nonce        │    │
│  └────────────┘   └──────────────┘   └────────────────┘    │
│                    │                                        │
│                    Nonce(24B) + Ciphertext + MAC(16B)       │
│                                                             │
│  Key Derivation for Each Conversation:                      │
│  K_conv = Blake2b(K_shared || userIdA || userIdB || nonce) │
│                                                             │
│  Private Key Storage:                                       │
│  - Encrypted with Argon2id(password)                        │
│  - Stored in server (encrypted) + device SecureStore        │
│  - Backup: encrypted seed phrase (12-word mnemonic)         │
└────────────────────────────────────────────────────────────┘
```

### Group Messaging
- Sender-ratchet for each group member
- Sender encrypts message N times (once per recipient)
- Metadata always visible (sender, timestamp, group)
- Forward secrecy: old keys deleted after 30 days

---

## JWT with RS256

```
┌────────────────────────────────────────────────────────────┐
│  JWT Configuration                                          │
│                                                             │
│  Algorithm: RS256 (RSA PKCS#1 v1.5 with SHA-256)           │
│  Key Size: 2048 bits                                        │
│                                                             │
│  Private Key: Server-only, stored in env                    │
│  Public Key: Exposed via /.well-known/jwks.json             │
│                                                             │
│  Access Token Claims:                                       │
│  {                                                          │
│    "sub": "uuid",           // User ID                      │
│    "email": "user@...",     // Email                        │
│    "role": "USER",          // User role                    │
│    "jti": "uuid",           // JWT ID (session)             │
│    "iat": 1716800000,       // Issued at                    │
│    "exp": 1716800900,       // Expires (15 min)             │
│    "iss": "gardenverse",   // Issuer                        │
│    "aud": "gardenverse-api" // Audience                     │
│  }                                                          │
│                                                             │
│  Refresh Token:                                             │
│  - Opaque random string (64 bytes from CSPRNG)              │
│  - Stored as SHA-256 hash in Redis                          │
│  - Rotation: old token invalidated on refresh               │
└────────────────────────────────────────────────────────────┘
```

---

## Password Hashing (bcrypt, 12 rounds)

```
┌────────────────────────────────────────────────────────────┐
│  Password Hashing                                           │
│                                                             │
│  Algorithm: bcrypt                                          │
│  Cost Factor: 12 (~250ms per hash on modern CPU)            │
│  Salt: 16 bytes (automatic, embedded in output)             │
│                                                             │
│  Output Format:                                             │
│  $2b$12$[22-char-salt][31-char-hash]                       │
│  Example: $2b$12$LJ3m4ys3Lk0TSwHnbfgZ.ufm1LxZq8Mxz...     │
│                                                             │
│  Validation Flow:                                           │
│  1. User submits password                                   │
│  2. Load hash from database                                 │
│  3. bcrypt.compare(password, hash)                          │
│  4. If match: proceed with login                            │
│  5. If fail: increment failed_attempts counter              │
│                                                             │
│  Password Change:                                           │
│  - Old password verified before new accepted                │
│  - New password checked against history (last 5)            │
│  - Password strength validated (zxcvbn)                     │
└────────────────────────────────────────────────────────────┘
```

---

## Key Management Strategy

```
┌────────────────────────────────────────────────────────────┐
│  KEY MANAGEMENT                                             │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Master Keys (Environment Variables)                  │  │
│  │  ├── JWT_PRIVATE_KEY          RSA 2048-bit            │  │
│  │  ├── JWT_PUBLIC_KEY           RSA 2048-bit            │  │
│  │  ├── QR_SIGNING_KEY           HMAC-SHA256 key         │  │
│  │  ├── MESSAGING_ENCRYPTION_KEY  AES-256-GCM key        │  │
│  │  ├── DATABASE_ENCRYPTION_KEY   AES-256-GCM key        │  │
│  │  └── SESSION_SECRET           HMAC-SHA256 key         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Derived Keys (Generated at Runtime)                  │  │
│  │  ├── QR Session Keys      HKDF(master, sessionId)     │  │
│  │  ├── Chat Conversation    X25519 + Blake2b            │  │
│  │  ├── Device Authentication HMAC(deviceKey, nonce)     │  │
│  │  └── API Rate Limit Keys  Redis INCR per IP/User      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Key Rotation Schedule                                │  │
│  │  ├── JWT Keys:             Every 90 days              │  │
│  │  ├── QR Signing Key:       Every 24 hours             │  │
│  │  ├── Messaging Key:        Every 30 days              │  │
│  │  ├── Database Key:         Every 180 days             │  │
│  │  └── Session Secret:       Every 30 days              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Storage: AWS KMS / HashiCorp Vault (production)            │
│  Local: .env file (development only)                        │
│  Backup: Encrypted with GPG, stored in secure vault         │
└────────────────────────────────────────────────────────────┘
```
