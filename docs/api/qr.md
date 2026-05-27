# QR API

Base path: `/api/v1/qr`

## POST /api/v1/qr/generate

Generate a signed QR code.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "type": "TRADE",
  "payload": {
    "listingId": "uuid",
    "offer": { "item": "Tomato Seeds", "quantity": 10 }
  },
  "expiresInMinutes": 30
}
```

**Types:** `TRADE` | `GARDEN_VISIT` | `INVITE` | `PAYMENT` | `SHARE`

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "qrData": "gardenverse://trade?session=uuid&sig=base64sig",
    "qrImage": "data:image/png;base64,...",
    "expiresAt": "2026-05-27T12:30:00Z"
  }
}
```

**Curl:**
```bash
curl -X POST http://localhost:4000/api/v1/qr/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -d '{"type":"TRADE","payload":{"listingId":"uuid"},"expiresInMinutes":30}'
```

---

## POST /api/v1/qr/validate

Validate a QR code without consuming it.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "qrData": "gardenverse://trade?session=uuid&sig=base64sig"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "type": "TRADE",
    "payload": { "listingId": "uuid", "offer": { "item": "Tomato Seeds", "quantity": 10 } },
    "createdBy": { "id": "uuid", "username": "greenfarmer" },
    "isValid": true,
    "isExpired": false,
    "isUsed": false,
    "expiresAt": "2026-05-27T12:30:00Z"
  }
}
```

**Errors:** `400` (invalid signature), `410` (expired/used)

**Curl:**
```bash
curl -X POST http://localhost:4000/api/v1/qr/validate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -d '{"qrData":"gardenverse://trade?session=uuid&sig=base64sig"}'
```

---

## POST /api/v1/qr/use

Use/consume a QR code (e.g., complete a trade, accept a visit).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "qrData": "gardenverse://trade?session=uuid&sig=base64sig"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "type": "TRADE",
    "action": "completed",
    "ecoPointsAwarded": 50
  },
  "message": "QR code used successfully"
}
```

**Errors:** `400` (invalid), `410` (expired/used), `409` (replay detected)

**Curl:**
```bash
curl -X POST http://localhost:4000/api/v1/qr/use \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -d '{"qrData":"gardenverse://trade?session=uuid&sig=base64sig"}'
```
