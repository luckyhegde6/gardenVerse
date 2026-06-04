# GardenVerse API Reference

## Base URL
- **Development:** `http://localhost:3000/api/v1`
- **Production:** `https://gardenverse.vercel.app/api/v1`

## Authentication
Most endpoints require a **JWT token** in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

Admin endpoints additionally set **httpOnly cookies** (`access_token`, `refresh_token`) during admin login.

### Token Lifetimes
| Token | Lifetime | Purpose |
|-------|----------|---------|
| Access Token | 15 minutes | API authentication |
| Refresh Token | 7 days | Obtain new access tokens |
| OTP | 10 minutes | Email verification, password reset |

### Public Endpoints (no auth required)
- `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`
- `POST /auth/verify-otp`, `POST /auth/request-password-reset`, `POST /auth/reset-password`
- `GET /health`, `GET /health/detailed`
- `GET /plants/*` (plant search, species detail)
- `GET /weather/current`, `GET /weather/forecast`, `GET /weather/alerts`
- `GET /users/profile/:username`, `GET /users/leaderboard`, `GET /users/search`
- `GET /marketplace/listings`, `GET /marketplace/listings/:id`
- `POST /admin/register`, `POST /admin/login`

## API Documentation (Swagger)
When running locally: **http://localhost:3000/api-docs**

The Swagger UI provides interactive API exploration with request/response schemas for all 24 modules.

---

## Endpoint Reference

### Auth (`/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | Public | Register a new user account |
| `POST` | `/auth/login` | Public | Login with email and password |
| `POST` | `/auth/refresh` | Public | Refresh access token |
| `POST` | `/auth/verify-otp` | Public | Verify email with OTP |
| `POST` | `/auth/request-password-reset` | Public | Request password reset OTP |
| `POST` | `/auth/reset-password` | Public | Reset password with OTP |
| `POST` | `/auth/link-telegram` | JWT | Link Telegram account |
| `POST` | `/auth/device-trust` | JWT | Update device trust score |

### Health (`/health`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/health` | Public | Basic health check (status, uptime) |
| `GET` | `/health/detailed` | Public | Detailed health (DB, Redis, AI service) |

### Users (`/users`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/users/me` | JWT | Get current user profile |
| `PUT` | `/users/me` | JWT | Update current user profile |
| `PATCH` | `/users/me/avatar` | JWT | Update avatar |
| `GET` | `/users/me/stats` | JWT | Get user statistics |
| `GET` | `/users/profile/:username` | Public | Get user profile by username |
| `GET` | `/users/leaderboard` | Public | Get leaderboard |
| `GET` | `/users/search` | Public | Search users |

### Gardens (`/gardens`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/gardens` | JWT | Create a garden |
| `GET` | `/gardens` | JWT | Get all my gardens |
| `GET` | `/gardens/mine` | JWT | Get my primary garden |
| `GET` | `/gardens/:id` | JWT | Get garden by ID |
| `PUT` | `/gardens/mine` | JWT | Update my garden |
| `DELETE` | `/gardens/mine` | JWT | Delete my garden |

### Crops (`/crops`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/crops` | JWT | Plant a crop |
| `POST` | `/crops/batch` | JWT | Batch plant multiple crops |
| `GET` | `/crops` | JWT | Get all crops in my garden |
| `GET` | `/crops/:id` | JWT | Get crop by ID |
| `PUT` | `/crops/:id` | JWT | Update crop |
| `POST` | `/crops/:id/water` | JWT | Water a crop |
| `POST` | `/crops/:id/fertilize` | JWT | Fertilize a crop |
| `POST` | `/crops/:id/harvest` | JWT | Harvest a crop |
| `DELETE` | `/crops/:id` | JWT | Remove a crop |

### Plants (`/plants`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/plants/search` | Public | Search plants by name |
| `GET` | `/plants/by-season` | Public | Get plants by season |
| `GET` | `/plants/recommended/:gardenId` | Public | Recommended plants for garden |
| `GET` | `/plants/plans` | Public | Garden plan templates |
| `GET` | `/plants/plans/:id` | Public | Garden plan template by ID |
| `POST` | `/plants/plans` | Public | Create a garden plan |
| `GET` | `/plants/:id` | Public | Plant species details |

### Marketplace (`/marketplace`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/marketplace/listings` | JWT | Create a listing |
| `GET` | `/marketplace/listings` | Optional | All listings (paginated) |
| `GET` | `/marketplace/local` | JWT | Local marketplace feed |
| `GET` | `/marketplace/my-listings` | JWT | My listings |
| `GET` | `/marketplace/listings/:id` | Optional | Listing by ID |
| `PUT` | `/marketplace/listings/:id` | JWT | Update listing |
| `DELETE` | `/marketplace/listings/:id` | JWT | Delete listing |
| `POST` | `/marketplace/purchases` | JWT | Purchase (escrow) |

### Weather (`/weather`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/weather/current` | Public | Current weather for location |
| `GET` | `/weather/forecast` | Public | 7-day forecast |
| `GET` | `/weather/alerts` | Public | Weather alerts |
| `POST` | `/weather/ingest` | Admin | Ingest weather data |

### AI (`/ai`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/ai/scan` | JWT | Submit plant scan (photo) |
| `GET` | `/ai/scans` | JWT | Get scan history |
| `GET` | `/ai/scans/:id` | JWT | Get scan by ID |
| `GET` | `/ai/recommendations/watering` | JWT | Watering recommendations |
| `GET` | `/ai/recommendations/fertilizer` | JWT | Fertilizer recommendations |
| `GET` | `/ai/recommendations/crops` | JWT | Crop recommendations by region |
| `GET` | `/ai/recommendations/sustainability` | JWT | Sustainability tips |
| `GET` | `/ai/growth/:cropId` | JWT | Analyze crop growth |

### Admin (`/admin`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/admin/register` | Public | Register super admin |
| `POST` | `/admin/login` | Public | Admin login (httpOnly cookies) |
| `GET` | `/admin/dashboard` | Admin | Dashboard stats |
| `GET` | `/admin/performance` | Admin | Performance metrics |
| `GET` | `/admin/users` | Admin | Users list |
| `GET` | `/admin/users/:id` | Admin | User details |
| `PUT` | `/admin/users/:id/role` | Admin | Update user role |
| `DELETE` | `/admin/users/:id` | Admin | Soft-delete user |
| `GET` | `/admin/health` | Admin | System health |
| `GET` | `/admin/transactions` | Admin | Token transactions |
| `GET` | `/admin/logs` | Admin | Application logs |
| `GET` | `/admin/invites` | Admin | All invites |
| `POST` | `/admin/invites` | Admin | Create invite |
| `POST` | `/admin/invites/:id/revoke` | Admin | Revoke invite |

### Gamification (`/gamification`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/gamification` | JWT | Full gamification data (level, XP, credits, collections, masteries) |
| `GET` | `/gamification/collections` | JWT | User plant collections |
| `GET` | `/gamification/collections/stats` | JWT | Collection completion stats |
| `POST` | `/gamification/species/:id/discover` | JWT | Discover a plant species (+50 XP) |
| `GET` | `/gamification/mastery/:speciesId` | JWT | Species mastery for one species |
| `GET` | `/gamification/masteries` | JWT | All species masteries |
| `POST` | `/gamification/hybrid` | JWT | Create a new plant hybrid |
| `GET` | `/gamification/hybrids` | JWT | User-created hybrids |
| `POST` | `/gamification/crop/:id/care` | JWT | Update care streak for a crop |
| `GET` | `/gamification/achievements` | JWT | All achievements with user progress |
| `POST` | `/gamification/xp` | JWT | Award XP to user |

### Additional Modules
| Module | Path | Auth | Description |
|--------|------|------|-------------|
| **Upload** | `/upload` | JWT | File upload (images, avatars) |
| **Geo** | `/geo` | JWT | Geocoding, places search |
| **Chat** | `/chat` | JWT | WebSocket chat, message history |
| **Community** | `/community` | JWT | Groups, posts, nearby gardeners |
| **Invites** | `/invites` | JWT | QR invite generation |
| **Notifications** | `/notifications` | JWT | Push notifications, preferences |
| **Reputation** | `/reputation` | JWT | Score, badges, levels |
| **IoT** | `/iot` | JWT | Device registration, sensor data |
| **QR** | `/qr` | JWT | Encrypted QR code generation |
| **Analytics** | `/analytics` | Admin | Platform analytics |
| **Moderation** | `/moderation` | Admin | Content moderation |
| **Feature Flags** | `/feature-flags` | Admin | Toggle feature flags |
| **Intelligence** | `/intelligence` | Admin | Government data integration |
| **Blockchain** | `/blockchain` | Admin | Smart contract interactions |

---

## Rate Limiting
All endpoints have rate limiting configured via `@nestjs/throttler`.

| Tier | Limit | Window | Scope |
|------|-------|--------|-------|
| **Default** | 100 requests | 60 seconds | Per IP |
| **Public auth** | 10 requests | 60 seconds | Per IP |
| **AI scan** | 30 requests | 60 seconds | Per user |
| **IoT ingest** | 300 requests | 60 seconds | Per device |

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1620000000
```

---

## WebSocket Events
Real-time communication via Socket.IO at `/socket.io/`.

| Event | Direction | Description |
|-------|-----------|-------------|
| `crop:update` | Server → Client | Crop growth stage change |
| `crop:matured` | Server → Client | Crop ready to harvest |
| `garden:update` | Server → Client | Garden state change |
| `weather:alert` | Server → Client | Extreme weather alert |
| `notification` | Server → Client | Push notification |
| `chat:message` | Bidirectional | Chat message delivery |
| `chat:typing` | Bidirectional | Typing indicator |
| `marketplace:sold` | Server → Client | Item sold notification |

---

## Standard Response

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "timestamp": "2026-05-27T12:00:00Z",
  "meta": { "page": 1, "limit": 20, "total": 100 }
}
```

## Error Response

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    { "property": "email", "constraints": { "isEmail": "email must be an email" } }
  ]
}
```

## HTTP Status Codes
| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden (insufficient role) |
| 404 | Not Found |
| 409 | Conflict (duplicate) |
| 429 | Too Many Requests (rate limited) |
| 500 | Internal Server Error |
