# Crops API

Base path: `/api/v1/crops`

## POST /api/v1/crops

Plant a new crop in a garden.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "gardenId": "uuid",
  "name": "Tomato",
  "species": "Solanum lycopersicum",
  "variety": "Cherry",
  "plotX": 1,
  "plotY": 2
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Tomato",
    "species": "Solanum lycopersicum",
    "status": "SEED",
    "growthStage": 0,
    "health": 100.0,
    "hydration": 50.0,
    "nutrientLevel": 50.0,
    "plantedAt": "2026-05-27T12:00:00Z",
    "estimatedHarvest": "2026-07-15T12:00:00Z",
    "plotX": 1,
    "plotY": 2,
    "gardenId": "uuid"
  },
  "message": "Crop planted"
}
```

**Curl:**
```bash
curl -X POST http://localhost:4000/api/v1/crops \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -d '{"gardenId":"uuid","name":"Tomato","species":"Solanum lycopersicum","plotX":1,"plotY":2}'
```

---

## GET /api/v1/crops/:id

Get crop details.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Tomato",
    "species": "Solanum lycopersicum",
    "status": "GROWING",
    "growthStage": 3,
    "health": 85.0,
    "hydration": 62.0,
    "nutrientLevel": 45.0,
    "plantedAt": "2026-05-01T12:00:00Z",
    "lastWateredAt": "2026-05-27T08:00:00Z",
    "lastFertilizedAt": "2026-05-25T10:00:00Z",
    "estimatedHarvest": "2026-07-15T12:00:00Z",
    "plotX": 1,
    "plotY": 2,
    "weatherStressed": false,
    "stressFactor": 0.0
  }
}
```

**Curl:**
```bash
curl http://localhost:4000/api/v1/crops/uuid \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## PATCH /api/v1/crops/:id/water

Water a crop.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "hydration": 90.0,
    "health": 87.0,
    "lastWateredAt": "2026-05-27T12:00:00Z"
  },
  "message": "Crop watered"
}
```

**Errors:** `429` (cooldown not elapsed - 1 hour between watering)

**Curl:**
```bash
curl -X PATCH http://localhost:4000/api/v1/crops/uuid/water \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## PATCH /api/v1/crops/:id/fertilize

Fertilize a crop.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "fertilizerType": "ORGANIC"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nutrientLevel": 85.0,
    "health": 90.0,
    "lastFertilizedAt": "2026-05-27T12:00:00Z"
  },
  "message": "Crop fertilized"
}
```

**Curl:**
```bash
curl -X PATCH http://localhost:4000/api/v1/crops/uuid/fertilize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -d '{"fertilizerType":"ORGANIC"}'
```

---

## POST /api/v1/crops/:id/harvest

Harvest a mature crop.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "HARVESTED",
    "harvestedAt": "2026-05-27T12:00:00Z",
    "yield": 5,
    "experienceGained": 150,
    "greenCreditsEarned": 25,
    "ecoPointsEarned": 100
  },
  "message": "Crop harvested! +150 XP, +25 Green Credits"
}
```

**Errors:** `400` (crop not mature)

**Curl:**
```bash
curl -X POST http://localhost:4000/api/v1/crops/uuid/harvest \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## GET /api/v1/gardens/:gardenId/crops

List all crops in a garden.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| status | string | Filter by CropStatus |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Tomato",
      "species": "Solanum lycopersicum",
      "status": "GROWING",
      "health": 85.0,
      "growthStage": 3,
      "plotX": 1,
      "plotY": 2
    }
  ],
  "meta": { "total": 15 }
}
```

**Curl:**
```bash
curl "http://localhost:4000/api/v1/gardens/uuid/crops?status=GROWING" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## POST /api/v1/crops/batch

Plant multiple crops at once.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "gardenId": "uuid",
  "crops": [
    { "name": "Tomato", "species": "Solanum lycopersicum", "plotX": 0, "plotY": 0 },
    { "name": "Basil", "species": "Ocimum basilicum", "plotX": 0, "plotY": 1 },
    { "name": "Lettuce", "species": "Lactuca sativa", "plotX": 1, "plotY": 0 }
  ]
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "planted": 3,
    "crops": [ { "id": "uuid", "name": "Tomato" }, { "id": "uuid", "name": "Basil" }, { "id": "uuid", "name": "Lettuce" } ]
  },
  "message": "3 crops planted"
}
```

**Curl:**
```bash
curl -X POST http://localhost:4000/api/v1/crops/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -d '{"gardenId":"uuid","crops":[{"name":"Tomato","plotX":0,"plotY":0},{"name":"Basil","plotX":0,"plotY":1}]}'
```
