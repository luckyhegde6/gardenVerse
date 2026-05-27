# IoT API

Base path: `/api/v1/iot`

## POST /api/v1/iot/devices

Register a new IoT device.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Garden Sensor Alpha",
  "deviceType": "SOIL_SENSOR",
  "publicKey": "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...\n-----END PUBLIC KEY-----"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Garden Sensor Alpha",
    "deviceType": "SOIL_SENSOR",
    "firmwareVersion": null,
    "isOnline": false,
    "createdAt": "2026-05-27T12:00:00Z"
  },
  "message": "Device registered. Connect via MQTT."
}
```

**Curl:**
```bash
curl -X POST http://localhost:4000/api/v1/iot/devices \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -d '{"name":"Garden Sensor Alpha","deviceType":"SOIL_SENSOR","publicKey":"-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8A...\n-----END PUBLIC KEY-----"}'
```

---

## GET /api/v1/iot/devices

List user's IoT devices.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Garden Sensor Alpha",
      "deviceType": "SOIL_SENSOR",
      "firmwareVersion": "1.2.0",
      "isOnline": true,
      "lastSeenAt": "2026-05-27T11:55:00Z",
      "createdAt": "2026-05-01T10:00:00Z"
    }
  ]
}
```

**Curl:**
```bash
curl http://localhost:4000/api/v1/iot/devices \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## GET /api/v1/iot/devices/:id

Get device details and latest reading.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Garden Sensor Alpha",
    "deviceType": "SOIL_SENSOR",
    "firmwareVersion": "1.2.0",
    "isOnline": true,
    "lastSeenAt": "2026-05-27T11:55:00Z",
    "latestReading": {
      "soilMoisture": 45.2,
      "humidity": 68.0,
      "temperature": 22.1,
      "ph": 6.8,
      "light": 45000
    },
    "createdAt": "2026-05-01T10:00:00Z"
  }
}
```

**Curl:**
```bash
curl http://localhost:4000/api/v1/iot/devices/uuid \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## DELETE /api/v1/iot/devices/:id

Remove a device.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Device removed"
}
```

**Curl:**
```bash
curl -X DELETE http://localhost:4000/api/v1/iot/devices/uuid \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## GET /api/v1/iot/devices/:id/readings

Get sensor reading history.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| sensorType | string | - | `SOIL_MOISTURE`, `HUMIDITY`, `PH`, `TEMPERATURE`, `LIGHT` |
| from | ISO date | - | Start date |
| to | ISO date | - | End date |
| limit | number | 100 | Max 1000 |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "sensorType": "SOIL_MOISTURE",
      "value": 45.2,
      "unit": "%",
      "isVerified": true,
      "timestamp": "2026-05-27T11:55:00Z"
    }
  ]
}
```

**Curl:**
```bash
curl "http://localhost:4000/api/v1/iot/devices/uuid/readings?sensorType=SOIL_MOISTURE&limit=50" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## POST /api/v1/iot/readings

Ingest sensor readings (typically from MQTT bridge, but available via REST).

**Headers:** `Authorization: Bearer <token>` or device signature

**Request Body:**
```json
{
  "deviceId": "uuid",
  "readings": [
    { "sensorType": "SOIL_MOISTURE", "value": 45.2, "unit": "%", "timestamp": "2026-05-27T11:55:00Z" },
    { "sensorType": "TEMPERATURE", "value": 22.1, "unit": "C", "timestamp": "2026-05-27T11:55:00Z" }
  ],
  "signature": "base64_encoded_signature"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "ingested": 2,
    "verified": true
  },
  "message": "Readings ingested"
}
```

**Curl:**
```bash
curl -X POST http://localhost:4000/api/v1/iot/readings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -d '{"deviceId":"uuid","readings":[{"sensorType":"SOIL_MOISTURE","value":45.2,"unit":"%"}],"signature":"sig"}'
```
