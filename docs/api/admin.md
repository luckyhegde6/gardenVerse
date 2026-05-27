# Admin API

Base path: `/api/v1/admin`

All endpoints require `ADMIN` or `SUPER_ADMIN` role.

## GET /api/v1/admin/dashboard

Get admin dashboard statistics.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 15200,
      "activeToday": 2340,
      "newToday": 85,
      "suspended": 23
    },
    "gardens": {
      "total": 12500,
      "virtual": 8000,
      "real": 3500,
      "hybrid": 1000
    },
    "marketplace": {
      "activeListings": 3200,
      "transactionsToday": 145,
      "volumeToday": 7500
    },
    "moderation": {
      "pendingReports": 12,
      "resolvedToday": 8
    },
    "growth": {
      "newUsersThisWeek": 560,
      "growthRate": 4.2
    },
    "system": {
      "cpuUsage": 45.2,
      "memoryUsage": 62.1,
      "activeConnections": 890,
      "uptime": "14d 6h 32m"
    }
  }
}
```

**Curl:**
```bash
curl http://localhost:4000/api/v1/admin/dashboard \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## GET /api/v1/admin/users

List all users with filters.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| role | string | - | Filter by role |
| status | string | - | `active`, `suspended`, `all` |
| search | string | - | Search by email/username |
| page | number | 1 | |
| limit | number | 20 | Max 100 |
| sort | string | `createdAt` | |
| order | string | `desc` | |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "username": "user1",
      "role": "USER",
      "isVerified": true,
      "isOnboarded": true,
      "level": 12,
      "trustScore": 95.0,
      "sustainabilityScore": 72.0,
      "createdAt": "2026-01-15T10:00:00Z",
      "lastActiveAt": "2026-05-27T08:00:00Z"
    }
  ],
  "meta": { "total": 15200, "page": 1, "limit": 20, "pages": 760 }
}
```

**Curl:**
```bash
curl "http://localhost:4000/api/v1/admin/users?role=USER&page=1&limit=20&sort=createdAt&order=desc" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## PATCH /api/v1/admin/users/:id/role

Change a user's role.

**Headers:** `Authorization: Bearer <token>` (requires ADMIN)

**Request Body:**
```json
{
  "role": "MODERATOR"
}
```

**Roles:** `USER` | `MODERATOR` | `REGIONAL_MODERATOR` | `ADMIN` | `SUPER_ADMIN`

**Response (200):**
```json
{
  "success": true,
  "message": "User role updated to MODERATOR"
}
```

**Curl:**
```bash
curl -X PATCH http://localhost:4000/api/v1/admin/users/uuid/role \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -d '{"role":"MODERATOR"}'
```

---

## POST /api/v1/admin/users/:id/suspend

Suspend or unsuspend a user.

**Headers:** `Authorization: Bearer <token>` (requires ADMIN)

**Request Body:**
```json
{
  "reason": "Violation of marketplace terms",
  "durationDays": 7,
  "suspend": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User suspended for 7 days"
}
```

**Curl:**
```bash
curl -X POST http://localhost:4000/api/v1/admin/users/uuid/suspend \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -d '{"reason":"Terms violation","durationDays":7,"suspend":true}'
```

---

## GET /api/v1/admin/invites

Get all invite codes (admin view).

**Headers:** `Authorization: Bearer <token>` (requires ADMIN)

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| isActive | boolean | - | Filter by active status |
| page | number | 1 | |
| limit | number | 20 | |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "GREEN-ABCD-1234",
      "maxUses": 5,
      "useCount": 3,
      "isActive": true,
      "createdBy": { "id": "uuid", "username": "greenfarmer" },
      "redeemedBy": { "id": "uuid", "username": "newuser" },
      "expiresAt": "2026-06-26T12:00:00Z",
      "createdAt": "2026-05-26T12:00:00Z"
    }
  ],
  "meta": { "total": 500, "page": 1, "limit": 20 }
}
```

**Curl:**
```bash
curl "http://localhost:4000/api/v1/admin/invites?isActive=true" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## POST /api/v1/admin/invites

Generate invite codes (admin).

**Headers:** `Authorization: Bearer <token>` (requires ADMIN)

**Request Body:**
```json
{
  "count": 10,
  "maxUses": 1,
  "expiresInDays": 90
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "created": 10,
    "codes": ["ADMIN-ABCD-0001", "ADMIN-ABCD-0002", "..."]
  },
  "message": "10 invite codes generated"
}
```

**Curl:**
```bash
curl -X POST http://localhost:4000/api/v1/admin/invites \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -d '{"count":10,"maxUses":1,"expiresInDays":90}'
```
