# Notifications API

Base path: `/api/v1/notifications`

## GET /api/v1/notifications

Get user notifications.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| isRead | boolean | - | Filter by read status |
| type | string | - | Filter by notification type |
| limit | number | 20 | Max 50 |
| cursor | string | - | Cursor for pagination |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "crop_ready",
      "title": "Crop Ready to Harvest",
      "body": "Your Tomatoes are ready to harvest!",
      "data": { "cropId": "uuid", "cropName": "Tomato" },
      "isRead": false,
      "isPush": true,
      "createdAt": "2026-05-27T12:00:00Z"
    }
  ],
  "meta": { "total": 25, "nextCursor": "abc" }
}
```

**Curl:**
```bash
curl http://localhost:4000/api/v1/notifications?isRead=false&limit=20 \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## PATCH /api/v1/notifications/:id/read

Mark a notification as read.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

**Curl:**
```bash
curl -X PATCH http://localhost:4000/api/v1/notifications/uuid/read \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## PATCH /api/v1/notifications/read-all

Mark all notifications as read.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": { "updated": 15 },
  "message": "All notifications marked as read"
}
```

**Curl:**
```bash
curl -X PATCH http://localhost:4000/api/v1/notifications/read-all \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## POST /api/v1/notifications/register-device

Register a device for push notifications.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "token": "fcm-device-token",
  "platform": "ios",
  "deviceId": "uuid-of-device"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Device registered for push notifications"
}
```

**Curl:**
```bash
curl -X POST http://localhost:4000/api/v1/notifications/register-device \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -d '{"token":"fcm-token","platform":"ios"}'
```
