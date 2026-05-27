# Gardens API

Base path: `/api/v1/gardens`

## POST /api/v1/gardens

Create a new garden.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "My Urban Garden",
  "type": "REAL",
  "description": "A small balcony garden in downtown",
  "size": 10,
  "latitude": 37.7749,
  "longitude": -122.4194,
  "address": "123 Main St, San Francisco, CA",
  "timezone": "America/Los_Angeles",
  "soilQuality": 60,
  "sunlightExposure": 70
}
```

**GardenType:** `VIRTUAL` | `REAL` | `HYBRID`

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "My Urban Garden",
    "type": "REAL",
    "description": "A small balcony garden in downtown",
    "size": 10,
    "soilQuality": 60,
    "irrigationLevel": 50,
    "sunlightExposure": 70,
    "latitude": 37.7749,
    "longitude": -122.4194,
    "userId": "uuid",
    "createdAt": "2026-05-27T12:00:00Z"
  },
  "message": "Garden created successfully"
}
```

**Errors:** `409` (user already has a garden)

**Curl:**
```bash
curl -X POST http://localhost:4000/api/v1/gardens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -d '{"name":"My Urban Garden","type":"REAL","latitude":37.7749,"longitude":-122.4194}'
```

---

## GET /api/v1/gardens/:id

Get garden details with crops.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "My Urban Garden",
    "type": "REAL",
    "description": "...",
    "size": 10,
    "soilQuality": 60,
    "irrigationLevel": 50,
    "sunlightExposure": 70,
    "latitude": 37.7749,
    "longitude": -122.4194,
    "address": "123 Main St",
    "timezone": "America/Los_Angeles",
    "theme": "forest",
    "decorations": {},
    "crops": [
      {
        "id": "uuid",
        "name": "Tomato",
        "status": "GROWING",
        "health": 85.0,
        "growthStage": 3,
        "plotX": 1,
        "plotY": 2
      }
    ],
    "createdAt": "2026-05-27T12:00:00Z"
  }
}
```

**Curl:**
```bash
curl http://localhost:4000/api/v1/gardens/uuid \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## PATCH /api/v1/gardens/:id

Update garden properties.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "Renamed Garden",
  "description": "Updated description",
  "theme": "desert",
  "decorations": { "fence": "wooden", "path": "stone" }
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Renamed Garden",
    "theme": "desert"
  },
  "message": "Garden updated"
}
```

**Curl:**
```bash
curl -X PATCH http://localhost:4000/api/v1/gardens/uuid \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -d '{"name":"Renamed Garden","theme":"desert"}'
```

---

## DELETE /api/v1/gardens/:id

Delete garden and all associated crops.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Garden deleted successfully"
}
```

**Curl:**
```bash
curl -X DELETE http://localhost:4000/api/v1/gardens/uuid \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## GET /api/v1/gardens/:id/stats

Get garden statistics.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "totalCrops": 15,
    "cropsByStatus": {
      "SEED": 2,
      "SPROUTING": 3,
      "GROWING": 5,
      "MATURE": 3,
      "HARVESTED": 2
    },
    "averageHealth": 82.5,
    "totalHarvested": 25,
    "totalWatered": 120,
    "totalFertilized": 45,
    "ecoPointsEarned": 3200,
    "co2Offset": 15.5,
    "activeDays": 45,
    "currentStreak": 12
  }
}
```

**Curl:**
```bash
curl http://localhost:4000/api/v1/gardens/uuid/stats \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```
