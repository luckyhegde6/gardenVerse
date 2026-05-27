# Chat API

Base path: `/api/v1/chat`

## POST /api/v1/chat/messages

Send a direct message.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "receiverId": "uuid",
  "content": "Hey, would you like to trade some tomato seeds?",
  "isEncrypted": true
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "content": "🔒 Encrypted message",
    "isEncrypted": true,
    "senderId": "uuid",
    "receiverId": "uuid",
    "createdAt": "2026-05-27T12:00:00Z"
  }
}
```

**Curl:**
```bash
curl -X POST http://localhost:4000/api/v1/chat/messages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -d '{"receiverId":"uuid","content":"Hey, would you like to trade some tomato seeds?","isEncrypted":true}'
```

---

## GET /api/v1/chat/conversations

Get user's conversations.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "userId": "uuid",
      "username": "greenfarmer",
      "avatarUrl": "https://...",
      "lastMessage": {
        "content": "🔒 Encrypted message",
        "createdAt": "2026-05-27T11:55:00Z",
        "senderId": "uuid"
      },
      "unreadCount": 2,
      "isOnline": true,
      "lastSeenAt": "2026-05-27T12:00:00Z"
    }
  ]
}
```

**Curl:**
```bash
curl http://localhost:4000/api/v1/chat/conversations \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## GET /api/v1/chat/conversations/:userId

Get messages in a conversation.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| limit | number | 50 | Max 100 |
| before | string | - | Cursor for pagination (message ID) |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "content": "🔒 Encrypted message",
      "isEncrypted": true,
      "senderId": "uuid",
      "receiverId": "uuid",
      "createdAt": "2026-05-27T12:00:00Z"
    }
  ],
  "meta": { "total": 150, "hasMore": true }
}
```

**Curl:**
```bash
curl "http://localhost:4000/api/v1/chat/conversations/uuid?limit=50" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## GET /api/v1/chat/groups/:groupId/messages

Get group chat messages.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| limit | number | 50 | Max 100 |
| before | string | - | Cursor for pagination |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "content": "🔒 Encrypted group message",
      "isEncrypted": true,
      "sender": { "id": "uuid", "username": "greenfarmer" },
      "createdAt": "2026-05-27T12:00:00Z"
    }
  ],
  "meta": { "total": 500, "hasMore": true }
}
```

**Curl:**
```bash
curl "http://localhost:4000/api/v1/chat/groups/groupId/messages?limit=50" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```
