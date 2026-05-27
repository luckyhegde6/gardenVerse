# Invite API

Base path: `/api/v1/invites`

## POST /api/v1/invites

Create an invite code.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "maxUses": 5,
  "expiresInDays": 30
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "GREEN-ABCD-1234",
    "maxUses": 5,
    "expiresAt": "2026-06-26T12:00:00Z",
    "isActive": true
  },
  "message": "Invite created. Share the code with friends!"
}
```

**Curl:**
```bash
curl -X POST http://localhost:4000/api/v1/invites \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -d '{"maxUses":5,"expiresInDays":30}'
```

---

## GET /api/v1/invites

Get user's invite codes.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "GREEN-ABCD-1234",
      "maxUses": 5,
      "useCount": 2,
      "isActive": true,
      "expiresAt": "2026-06-26T12:00:00Z",
      "createdAt": "2026-05-26T12:00:00Z"
    }
  ]
}
```

**Curl:**
```bash
curl http://localhost:4000/api/v1/invites \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## POST /api/v1/invites/redeem

Redeem an invite code.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "code": "GREEN-ABCD-1234"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "ecoPointsAwarded": 500,
    "invitedBy": "greenfarmer"
  },
  "message": "Invite redeemed! You earned 500 Eco Points."
}
```

**Errors:** `400` (invalid/expired code), `409` (already redeemed)

**Curl:**
```bash
curl -X POST http://localhost:4000/api/v1/invites/redeem \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -d '{"code":"GREEN-ABCD-1234"}'
```

---

## GET /api/v1/invites/eligibility

Check if user can create invites.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "canInvite": true,
    "invitesRemaining": 3,
    "inviteCount": 2,
    "nextInviteAt": null,
    "level": 5,
    "invitesUnlockedAtLevel": 3
  }
}
```

**Curl:**
```bash
curl http://localhost:4000/api/v1/invites/eligibility \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```
