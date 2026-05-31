# API Flow Payloads & Data Contracts

Request/response payloads for key GardenVerse API flows, covering success and error states.

---

## 1. Authentication

### Register
```
POST /api/v1/auth/register
```

**Request:**
```json
{
  "email": "farmer@example.com",
  "password": "SecurePass123!",
  "name": "Green Thumb Farmer",
  "role": "USER"
}
```

**Success (201):**
```json
{
  "id": "usr_abc123",
  "email": "farmer@example.com",
  "name": "Green Thumb Farmer",
  "role": "USER",
  "createdAt": "2026-05-27T10:00:00.000Z",
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJl..."
}
```

**Validation Error (400):**
```json
{
  "statusCode": 400,
  "message": [
    "email must be a valid email address",
    "password must be at least 8 characters"
  ],
  "error": "Bad Request"
}
```

**Duplicate (409):**
```json
{
  "statusCode": 409,
  "message": "User with email farmer@example.com already exists",
  "error": "Conflict"
}
```

### Login
```
POST /api/v1/auth/login
```

**Request:**
```json
{
  "email": "farmer@example.com",
  "password": "SecurePass123!"
}
```

**Success (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJl...",
  "expiresIn": 900,
  "user": {
    "id": "usr_abc123",
    "email": "farmer@example.com",
    "name": "Green Thumb Farmer",
    "role": "USER",
    "geohash": "te7u8p9q"
  }
}
```

**Invalid Credentials (401):**
```json
{
  "statusCode": 401,
  "message": "Invalid email or password",
  "error": "Unauthorized"
}
```

### Token Refresh
```
POST /api/v1/auth/refresh
```

**Request:**
```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJl..."
}
```

**Success (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "bmV3IHJlZnJlc2ggdG9r...",
  "expiresIn": 900
}
```

**Expired Refresh (401):**
```json
{
  "statusCode": 401,
  "message": "Refresh token expired. Please login again.",
  "error": "Unauthorized"
}
```

---

## 2. Garden Management

### Create Garden
```
POST /api/v1/gardens
```

**Request:**
```json
{
  "name": "My Urban Farm",
  "size": { "width": 6, "height": 4 },
  "soilType": "LOAMY",
  "sunExposure": "FULL_SUN",
  "location": {
    "address": "123 Main St, Springfield",
    "lat": 40.7128,
    "lng": -74.006
  }
}
```

**Success (201):**
```json
{
  "id": "gdn_xyz789",
  "name": "My Urban Farm",
  "size": { "width": 6, "height": 4 },
  "soilType": "LOAMY",
  "sunExposure": "FULL_SUN",
  "userId": "usr_abc123",
  "status": "ACTIVE",
  "createdAt": "2026-05-27T10:30:00.000Z",
  "plotCount": 24
}
```

**Idempotent Replay (200):**
```json
{
  "id": "gdn_xyz789",
  "name": "My Urban Farm",
  "size": { "width": 6, "height": 4 },
  "userId": "usr_abc123",
  "status": "ACTIVE",
  "note": "Existing garden returned (one garden per user)"
}
```

### Plant Crop
```
POST /api/v1/crops
```

**Request:**
```json
{
  "gardenId": "gdn_xyz789",
  "plantSpeciesId": "psi_tomato_001",
  "position": { "x": 2, "y": 3 },
  "quantity": 4
}
```

**Success (201):**
```json
{
  "id": "crp_def456",
  "plantSpeciesId": "psi_tomato_001",
  "plantName": "Tomato - Roma",
  "position": { "x": 2, "y": 3 },
  "status": "SEED",
  "stage": 0,
  "health": 100,
  "waterLevel": 80,
  "plantedAt": "2026-05-27T11:00:00.000Z",
  "estimatedHarvest": "2026-07-15T11:00:00.000Z",
  "growthDuration": 48
}
```

**Position Conflict (409):**
```json
{
  "statusCode": 409,
  "message": "Position (2,3) is already occupied in garden gdn_xyz789",
  "error": "Conflict"
}
```

---

## 3. Marketplace

### Create Listing
```
POST /api/v1/marketplace/listings
```

**Request:**
```json
{
  "title": "Organic Roma Tomatoes",
  "description": "Homegrown, pesticide-free Roma tomatoes. 5 lbs available.",
  "category": "PRODUCE",
  "price": 15.00,
  "currency": "GREEN_CREDIT",
  "quantity": 5,
  "unit": "lb",
  "images": ["https://cdn.gardenverse.io/tomatoes_1.jpg"],
  "expiresInDays": 7
}
```

**Success (201):**
```json
{
  "id": "lst_ghi012",
  "sellerId": "usr_abc123",
  "title": "Organic Roma Tomatoes",
  "category": "PRODUCE",
  "price": 15.00,
  "currency": "GREEN_CREDIT",
  "quantity": 5,
  "unit": "lb",
  "status": "ACTIVE",
  "createdAt": "2026-05-27T12:00:00.000Z",
  "expiresAt": "2026-06-03T12:00:00.000Z"
}
```

### Purchase
```
POST /api/v1/marketplace/transactions
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
```

**Request:**
```json
{
  "listingId": "lst_ghi012",
  "quantity": 2,
  "deliveryMethod": "IN_PERSON"
}
```

**Success (201):**
```json
{
  "id": "txn_jkl345",
  "listingId": "lst_ghi012",
  "buyerId": "usr_456def",
  "sellerId": "usr_abc123",
  "quantity": 2,
  "totalPrice": 30.00,
  "currency": "GREEN_CREDIT",
  "fee": 0.60,
  "status": "ESCROW_HELD",
  "escrowId": "esc_mno678",
  "createdAt": "2026-05-27T14:00:00.000Z"
}
```

**Insufficient Balance (402):**
```json
{
  "statusCode": 402,
  "message": "Insufficient GREEN_CREDIT balance. Required: 30.00, Available: 15.50",
  "error": "Payment Required"
}
```

**Idempotent Replay (200):**
```json
{
  "id": "txn_jkl345",
  "status": "ESCROW_HELD",
  "note": "Transaction previously processed (idempotent replay)"
}
```

---

## 4. Weather

### Get Current Weather
```
GET /api/v1/weather?region=IN-MH&lat=18.52&lng=73.85
```

**Success (200):**
```json
{
  "region": "IN-MH",
  "location": "Pune, Maharashtra",
  "current": {
    "temperature": 28.5,
    "feelsLike": 31.2,
    "humidity": 65,
    "pressure": 1013,
    "windSpeed": 12.5,
    "windDirection": "WSW",
    "condition": "PARTLY_CLOUDY",
    "description": "Partly cloudy",
    "icon": "https://openweathermap.org/img/wn/02d@2x.png",
    "uvIndex": 6.2
  },
  "forecast": [
    {
      "date": "2026-05-28",
      "tempHigh": 30.2,
      "tempLow": 22.1,
      "condition": "SUNNY",
      "precipitation": 10,
      "humidity": 60
    },
    {
      "date": "2026-05-29",
      "tempHigh": 28.8,
      "tempLow": 21.5,
      "condition": "CLOUDY",
      "precipitation": 40,
      "humidity": 70
    }
  ],
  "alerts": [],
  "cachedAt": "2026-05-27T14:30:00.000Z",
  "source": "OPENWEATHERMAP"
}
```

**Cache Hit (200 - stale):**
```json
{
  "region": "IN-MH",
  "current": { "...": "..." },
  "cachedAt": "2026-05-27T11:30:00.000Z",
  "source": "CACHE",
  "age": 10800,
  "note": "Cache TTL exceeded. Data may be stale."
}
```

**API Down (200 - fallback):**
```json
{
  "region": "IN-MH",
  "source": "SIMULATED",
  "note": "Real-time weather unavailable. Using seasonal simulation.",
  "current": {
    "temperature": 27.0,
    "condition": "PARTLY_CLOUDY",
    "humidity": 60
  },
  "simulated": true,
  "simulatedAt": "2026-05-27T14:30:00.000Z"
}
```

---

## 5. AI Scanner

### Analyze Plant Photo
```
POST /api/v1/vision/analyze
```

**Request** (multipart):
```
Content-Type: multipart/form-data

image: <binary file>
options: { "detailedAnalysis": true }
```

**Success (200):**
```json
{
  "scanId": "scn_pqr901",
  "plantName": "Solanum lycopersicum",
  "commonName": "Tomato",
  "confidence": 0.94,
  "health": {
    "overall": 85,
    "leafGreen": 72,
    "leafYellow": 15,
    "leafBrown": 8,
    "curlIndex": 0.12
  },
  "diseases": [
    {
      "name": "Early Blight",
      "probability": 0.08,
      "severity": "LOW",
      "treatment": "Remove affected leaves. Apply copper fungicide."
    }
  ],
  "recommendations": [
    "Water at base to prevent leaf wetness",
    "Apply nitrogen-rich fertilizer",
    "Prune lower branches for airflow"
  ],
  "cropWaterNeeds": "MODERATE",
  "estimatedYield": "3-5 kg per plant",
  "analyzedAt": "2026-05-27T15:00:00.000Z",
  "aiService": "PYTHON_FASTAPI"
}
```

**Fallback (200 - AI down):**
```json
{
  "scanId": "scn_pqr902",
  "plantName": "Likely Tomato",
  "confidence": 0.55,
  "health": { "overall": 70 },
  "diseases": [],
  "recommendations": ["Keep soil moist", "Ensure adequate sunlight"],
  "analyzedAt": "2026-05-27T15:01:00.000Z",
  "aiService": "MOCK_FALLBACK",
  "note": "AI analysis service unavailable. Results are estimated."
}
```

---

## 6. IoT Sensor Reading

### Ingest Sensor Data
```
POST /api/v1/iot/readings
```

**Request:**
```json
{
  "deviceId": "esp32_garden_001",
  "timestamp": "2026-05-27T16:00:00.000Z",
  "sensors": {
    "soilMoisture": 45.2,
    "temperature": 26.8,
    "humidity": 62,
    "lightLevel": 850,
    "phLevel": 6.8
  },
  "signature": "3045022100f43b...",
  "firmwareVersion": "2.1.0"
}
```

**Success (201):**
```json
{
  "id": "rdg_stu234",
  "deviceId": "esp32_garden_001",
  "timestamp": "2026-05-27T16:00:00.000Z",
  "receivedAt": "2026-05-27T16:00:05.000Z",
  "signatureValid": true,
  "trustScore": 0.98,
  "status": "ACCEPTED"
}
```

**Invalid Signature (401):**
```json
{
  "statusCode": 401,
  "message": "Sensor data signature verification failed for device esp32_garden_001",
  "error": "Unauthorized"
}
```

**Low Trust Score (403):**
```json
{
  "statusCode": 403,
  "message": "Device trust score (0.12) below threshold (0.5). Reading rejected.",
  "error": "Forbidden",
  "deviceId": "esp32_garden_001"
}
```

---

## 7. Invite System

### Create Invite
```
POST /api/v1/invites
```

**Request:**
```json
{
  "type": "QR",
  "maxUses": 10,
  "expiresInHours": 48,
  "permissions": ["VIEW_GARDEN", "TRADE"],
  "message": "Come see my organic garden!"
}
```

**Success (201):**
```json
{
  "id": "inv_vwx567",
  "code": "GV-INV-A3B8K9",
  "type": "QR",
  "qrData": {
    "encrypted": "aes256gcm:5f4dcc3b5aa765d61d8327deb882cf99",
    "signature": "hmac:7d793037a0760186574b0282f2f435e7",
    "expiresAt": "2026-05-29T16:00:00.000Z",
    "version": 1
  },
  "maxUses": 10,
  "currentUses": 0,
  "isActive": true
}
```

### Redeem Invite
```
POST /api/v1/invites/redeem
```

**Request:**
```json
{
  "code": "GV-INV-A3B8K9",
  "qrPayload": "aes256gcm:5f4dcc3b5aa765d61d8327deb882cf99"
}
```

**Success (200):**
```json
{
  "inviteId": "inv_vwx567",
  "status": "REDEEMED",
  "remainingUses": 9,
  "gardenAccess": true,
  "permissions": ["VIEW_GARDEN", "TRADE"],
  "expiresAt": "2026-05-29T16:00:00.000Z"
}
```

**Expired (410):**
```json
{
  "statusCode": 410,
  "message": "Invite code GV-INV-A3B8K9 has expired",
  "error": "Gone"
}
```

**Max Uses Reached (410):**
```json
{
  "statusCode": 410,
  "message": "Invite code GV-INV-A3B8K9 has reached maximum uses (10/10)",
  "error": "Gone"
}
```

---

## 8. Admin Dashboard

### Dashboard Stats
```
GET /api/v1/admin/dashboard/stats
```

**Success (200):**
```json
{
  "totalUsers": 15243,
  "newUsersToday": 48,
  "activeGardens": 8721,
  "totalCrops": 45210,
  "marketplaceVolume": 128450.75,
  "pendingReports": 23,
  "activeListings": 345,
  "revenue": {
    "today": 450.00,
    "thisWeek": 3200.00,
    "thisMonth": 14200.00
  },
  "userGrowth": [
    { "date": "2026-04-27", "count": 14500 },
    { "date": "2026-05-04", "count": 14750 },
    { "date": "2026-05-11", "count": 14900 },
    { "date": "2026-05-18", "count": 15080 },
    { "date": "2026-05-25", "count": 15243 }
  ],
  "topRegions": [
    { "region": "IN-MH", "users": 3420 },
    { "region": "US-CA", "users": 2810 },
    { "region": "GB-ENG", "users": 1540 }
  ]
}
```

### Paginated Users
```
GET /api/v1/admin/users?page=1&limit=20&search=farmer&role=USER
```

**Success (200):**
```json
{
  "data": [
    {
      "id": "usr_abc123",
      "email": "farmer@example.com",
      "name": "Green Thumb Farmer",
      "role": "USER",
      "status": "ACTIVE",
      "gardens": 1,
      "reputationScore": 850,
      "createdAt": "2026-04-15T08:00:00.000Z",
      "lastLogin": "2026-05-27T10:00:00.000Z",
      "reports": 0
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 15243,
    "totalPages": 763,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### Feature Flags
```
GET /api/v1/feature-flags
```

**Success (200):**
```json
{
  "flags": [
    {
      "id": "ff_ai_scanner_v2",
      "name": "AI Scanner v2",
      "key": "ai-scanner-v2",
      "description": "Enhanced plant disease detection model",
      "enabled": true,
      "rolloutPercentage": 25,
      "regions": ["IN-MH", "US-CA"],
      "updatedAt": "2026-05-26T12:00:00.000Z",
      "updatedBy": "admin@gardenverse.vercel.app"
    },
    {
      "id": "ff_marketplace_auction",
      "name": "Auction Mode",
      "key": "marketplace-auction",
      "description": "Enable auction-style listings",
      "enabled": false,
      "rolloutPercentage": 0,
      "regions": [],
      "updatedAt": "2026-05-20T09:00:00.000Z",
      "updatedBy": "admin@gardenverse.vercel.app"
    }
  ]
}
```

---

## Error Response Format

All errors follow a consistent schema:

### Validation Error
```json
{
  "statusCode": 400,
  "message": ["field1 must be a string", "field2 is required"],
  "error": "Bad Request"
}
```

### Not Found
```json
{
  "statusCode": 404,
  "message": "Garden with id gdn_invalid not found",
  "error": "Not Found"
}
```

### Rate Limited
```json
{
  "statusCode": 429,
  "message": "Too many requests. Try again in 12 seconds.",
  "error": "Too Many Requests",
  "retryAfter": 12
}
```

### Internal Server Error
```json
{
  "statusCode": 500,
  "message": "An unexpected error occurred",
  "error": "Internal Server Error",
  "requestId": "req_abc123"
}
```

### Service Unavailable (Circuit Breaker)
```json
{
  "statusCode": 503,
  "message": "Weather service temporarily unavailable. Circuit breaker open.",
  "error": "Service Unavailable",
  "retryAfter": 30,
  "fallbackAvailable": true
}
```

---

## Failure Handling Summary

| Layer | Error Type | HTTP Code | Recovery |
|-------|-----------|-----------|----------|
| Client | Network timeout | — | Retry 3x with backoff |
| Client | Offline | — | Queue + replay on reconnect |
| Gateway | Rate limit | 429 | Retry-After header |
| Gateway | Auth expired | 401 | Auto-refresh token |
| Gateway | Auth invalid | 403 | Redirect to login |
| Validation | Bad input | 400 | Field-level error messages |
| Business logic | Conflict | 409 | Natural idempotency |
| Business logic | Not found | 404 | Graceful UI state |
| Business logic | Insufficient | 402 | Show balance requirement |
| External API | Down | 503 | Fallback/cached data |
| Database | Connection pool full | 503 | Queue to BullMQ |
| Database | Deadlock | 409 | Prisma auto-retry |
| Cache | Redis down | — | Fall through to DB |
| IoT | Invalid signature | 401 | Reject + alert owner |
| IoT | Low trust score | 403 | Quarantine device |
