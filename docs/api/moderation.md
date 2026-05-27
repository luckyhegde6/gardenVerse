# Moderation API

Base path: `/api/v1/moderation`

## POST /api/v1/moderation/reports

Submit a moderation report.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "type": "USER",
  "targetId": "uuid-of-reported-user",
  "description": "This user is posting scams in the marketplace",
  "evidence": [
    { "type": "image", "url": "https://cdn.gardenverse.io/evidence/ss1.jpg" },
    { "type": "text", "content": "Screenshot of scam message" }
  ]
}
```

**Types:** `USER` | `LISTING` | `MESSAGE` | `GROUP` | `GENERAL`

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "USER",
    "status": "PENDING",
    "createdAt": "2026-05-27T12:00:00Z"
  },
  "message": "Report submitted. Our moderation team will review it."
}
```

**Curl:**
```bash
curl -X POST http://localhost:4000/api/v1/moderation/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -d '{"type":"USER","targetId":"uuid","description":"Scam posting in marketplace","evidence":[{"type":"text","content":"Screenshot evidence"}]}'
```

---

## GET /api/v1/moderation/reports

Get all reports (admin/moderator only).

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| status | string | `PENDING` | `PENDING`, `REVIEWED`, `RESOLVED`, `DISMISSED` |
| type | string | - | Filter by type |
| page | number | 1 | |
| limit | number | 20 | |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "USER",
      "description": "Scam posting",
      "status": "PENDING",
      "reporter": { "id": "uuid", "username": "reporter1" },
      "evidence": [{"type":"text","content":"Screenshot evidence"}],
      "createdAt": "2026-05-27T12:00:00Z"
    }
  ],
  "meta": { "total": 25, "page": 1, "limit": 20 }
}
```

**Curl:**
```bash
curl "http://localhost:4000/api/v1/moderation/reports?status=PENDING&page=1" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## PATCH /api/v1/moderation/reports/:id/action

Take action on a report (admin/moderator only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "action": "WARN_USER",
  "notes": "First offense, issued warning"
}
```

**Actions:** `DISMISS` | `WARN_USER` | `SUSPEND_USER` | `REMOVE_LISTING` | `BAN_USER`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "RESOLVED",
    "actionTaken": "WARN_USER",
    "resolvedAt": "2026-05-27T12:05:00Z"
  },
  "message": "Action taken on report"
}
```

**Curl:**
```bash
curl -X PATCH http://localhost:4000/api/v1/moderation/reports/uuid/action \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -d '{"action":"WARN_USER","notes":"First offense warning"}'
```

---

## GET /api/v1/moderation/reports/my

Get current user's submitted reports.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "USER",
      "status": "RESOLVED",
      "actionTaken": "WARN_USER",
      "createdAt": "2026-05-25T10:00:00Z",
      "resolvedAt": "2026-05-26T08:00:00Z"
    }
  ]
}
```

**Curl:**
```bash
curl http://localhost:4000/api/v1/moderation/reports/my \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```
