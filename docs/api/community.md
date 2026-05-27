# Community API

Base path: `/api/v1/community`

## POST /api/v1/community/groups

Create a community group.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Urban Gardeners SF",
  "description": "A group for urban gardeners in San Francisco",
  "type": "REGIONAL",
  "region": "us_ca_sf",
  "isPrivate": false,
  "iconUrl": "data:image/jpeg;base64,..."
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Urban Gardeners SF",
    "type": "REGIONAL",
    "memberCount": 1,
    "isPrivate": false,
    "createdAt": "2026-05-27T12:00:00Z"
  },
  "message": "Group created"
}
```

**Curl:**
```bash
curl -X POST http://localhost:4000/api/v1/community/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -d '{"name":"Urban Gardeners SF","type":"REGIONAL","region":"us_ca_sf","isPrivate":false}'
```

---

## GET /api/v1/community/groups

List community groups.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| type | string | - | Filter by type |
| region | string | - | Filter by region |
| search | string | - | Search by name |
| page | number | 1 | |
| limit | number | 20 | |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Urban Gardeners SF",
      "description": "A group for urban gardeners in San Francisco",
      "type": "REGIONAL",
      "region": "us_ca_sf",
      "memberCount": 45,
      "isPrivate": false,
      "iconUrl": "https://cdn.gardenverse.io/groups/icon.jpg",
      "createdAt": "2026-03-15T10:00:00Z"
    }
  ],
  "meta": { "total": 120, "page": 1, "limit": 20 }
}
```

**Curl:**
```bash
curl "http://localhost:4000/api/v1/community/groups?type=REGIONAL&region=us_ca_sf&page=1" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## POST /api/v1/community/groups/:id/join

Join a group.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Joined group successfully"
}
```

**Errors:** `409` (already a member), `403` (private group - requires invite)

**Curl:**
```bash
curl -X POST http://localhost:4000/api/v1/community/groups/uuid/join \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## POST /api/v1/community/groups/:id/leave

Leave a group.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Left group successfully"
}
```

**Curl:**
```bash
curl -X POST http://localhost:4000/api/v1/community/groups/uuid/leave \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## GET /api/v1/community/groups/:id/members

List group members.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | |
| limit | number | 50 | Max 100 |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "userId": "uuid",
      "username": "greenfarmer",
      "avatarUrl": "https://...",
      "role": "ADMIN",
      "joinedAt": "2026-03-15T10:00:00Z"
    }
  ],
  "meta": { "total": 45, "page": 1, "limit": 50 }
}
```

**Curl:**
```bash
curl http://localhost:4000/api/v1/community/groups/uuid/members?page=1&limit=50 \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```
