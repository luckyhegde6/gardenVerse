# Users API

Base path: `/api/v1/users`

## GET /api/v1/users/profile

Get the authenticated user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "farmer@example.com",
    "username": "greenfarmer",
    "displayName": "Green Farmer",
    "avatarUrl": "https://cdn.gardenverse.io/avatars/uuid.jpg",
    "bio": "Urban gardener since 2020",
    "region": "us_ca",
    "level": 12,
    "experience": 3450,
    "greenCredits": 250.5,
    "ecoPoints": 1800,
    "reputationTokens": 750,
    "sustainabilityScore": 88.5,
    "trustScore": 95.0,
    "marketplaceReliability": 92.0,
    "communityStanding": 4.8,
    "currentStreak": 15,
    "longestStreak": 42,
    "inviteCount": 5,
    "isVerified": true,
    "isOnboarded": true,
    "createdAt": "2026-01-15T08:30:00Z"
  }
}
```

**Curl:**
```bash
curl http://localhost:4000/api/v1/users/profile \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## PATCH /api/v1/users/profile

Update profile fields.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "displayName": "Updated Name",
  "bio": "New bio text",
  "region": "us_tx"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "displayName": "Updated Name",
    "bio": "New bio text",
    "region": "us_tx"
  },
  "message": "Profile updated"
}
```

**Curl:**
```bash
curl -X PATCH http://localhost:4000/api/v1/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -d '{"displayName":"Updated Name","bio":"New bio text"}'
```

---

## POST /api/v1/users/avatar

Upload avatar image.

**Headers:** `Authorization: Bearer <token>`  
**Content-Type:** `multipart/form-data`

**Request Body:** `file` field with image (max 5MB, JPEG/PNG/WebP)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "avatarUrl": "https://cdn.gardenverse.io/avatars/uuid_new.jpg"
  },
  "message": "Avatar updated"
}
```

**Curl:**
```bash
curl -X POST http://localhost:4000/api/v1/users/avatar \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -F "file=@avatar.jpg"
```

---

## GET /api/v1/users/leaderboard

Get top users by various metrics.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| metric | string | `sustainabilityScore` | `level`, `experience`, `greenCredits`, `ecoPoints`, `sustainabilityScore`, `trustScore`, `currentStreak` |
| limit | number | 20 | Max 100 |
| offset | number | 0 | Pagination offset |
| region | string | - | Filter by region code |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "userId": "uuid",
      "username": "topfarmer",
      "avatarUrl": "https://...",
      "value": 98.5,
      "level": 50
    }
  ],
  "meta": { "total": 1000, "limit": 20, "offset": 0 }
}
```

**Curl:**
```bash
curl "http://localhost:4000/api/v1/users/leaderboard?metric=sustainabilityScore&limit=10&region=us_ca" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## GET /api/v1/users/:id

Get a public user profile by ID.

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "greenfarmer",
    "displayName": "Green Farmer",
    "avatarUrl": "https://...",
    "bio": "Urban gardener",
    "level": 12,
    "sustainabilityScore": 88.5,
    "trustScore": 95.0,
    "communityStanding": 4.8,
    "createdAt": "2026-01-15T08:30:00Z"
  }
}
```

**Curl:**
```bash
curl http://localhost:4000/api/v1/users/uuid \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```
