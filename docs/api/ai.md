# AI API

Base path: `/api/v1/ai`

## POST /api/v1/ai/scan

Submit a plant image for AI diagnosis.

**Headers:** `Authorization: Bearer <token>`  
**Content-Type:** `multipart/form-data`

**Request Body:** `image` field (JPEG/PNG/WebP, max 10MB)

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "imageUrl": "https://cdn.gardenverse.io/scans/uuid.jpg",
    "plantName": "Tomato",
    "species": "Solanum lycopersicum",
    "healthScore": 82.5,
    "diseases": [
      { "name": "Early Blight", "probability": 0.15, "severity": "LOW", "treatment": "Apply copper fungicide" },
      { "name": "Healthy", "probability": 0.75, "severity": "NONE", "treatment": null }
    ],
    "recommendations": [
      "Increase watering to 3x per week",
      "Apply nitrogen-rich fertilizer",
      "Ensure 6+ hours of direct sunlight"
    ],
    "createdAt": "2026-05-27T12:00:00Z"
  },
  "message": "Scan complete"
}
```

**Curl:**
```bash
curl -X POST http://localhost:4000/api/v1/ai/scan \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -F "image=@plant_photo.jpg"
```

---

## GET /api/v1/ai/scans

Get user's scan history.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| page | number | 1 | |
| limit | number | 20 | Max 50 |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "imageUrl": "https://cdn.gardenverse.io/scans/uuid_thumb.jpg",
      "plantName": "Tomato",
      "healthScore": 82.5,
      "createdAt": "2026-05-27T12:00:00Z"
    }
  ],
  "meta": { "total": 50, "page": 1, "limit": 20 }
}
```

**Curl:**
```bash
curl "http://localhost:4000/api/v1/ai/scans?page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## GET /api/v1/ai/scans/:id

Get scan details.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "imageUrl": "https://cdn.gardenverse.io/scans/uuid.jpg",
    "plantName": "Tomato",
    "species": "Solanum lycopersicum",
    "healthScore": 82.5,
    "diseases": [
      { "name": "Early Blight", "probability": 0.15, "severity": "LOW", "treatment": "Apply copper fungicide" }
    ],
    "recommendations": ["Increase watering", "Apply nitrogen fertilizer"],
    "createdAt": "2026-05-27T12:00:00Z"
  }
}
```

**Curl:**
```bash
curl http://localhost:4000/api/v1/ai/scans/uuid \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## GET /api/v1/ai/recommendations/watering

Get AI-powered watering recommendations.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| gardenId | string | No | Specific garden |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "cropId": "uuid",
        "cropName": "Tomato",
        "currentMoisture": 45.0,
        "optimalMoisture": "60-80",
        "recommendation": "Water today - 500ml per plant",
        "urgency": "HIGH",
        "nextBestTime": "2026-05-27T18:00:00Z"
      }
    ],
    "weatherAdjusted": true,
    "rainExpected": false
  }
}
```

**Curl:**
```bash
curl "http://localhost:4000/api/v1/ai/recommendations/watering?gardenId=uuid" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## GET /api/v1/ai/recommendations/fertilizer

Get fertilizer recommendations.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| gardenId | string | No | Specific garden |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "cropId": "uuid",
        "cropName": "Tomato",
        "currentNutrientLevel": 35.0,
        "deficiency": "Nitrogen",
        "recommendedFertilizer": "NPK 10-5-5",
        "amount": "50g per plant",
        "urgency": "MEDIUM"
      }
    ]
  }
}
```

**Curl:**
```bash
curl "http://localhost:4000/api/v1/ai/recommendations/fertilizer?gardenId=uuid" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## GET /api/v1/ai/recommendations/crops

Get crop planting recommendations based on season and region.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| region | string | No | Region for localized suggestions |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "name": "Tomato",
      "species": "Solanum lycopersicum",
      "difficulty": "MEDIUM",
      "daysToHarvest": 60,
      "season": "SPRING",
      "compatiblePlants": ["Basil", "Marigold"],
      "incompatiblePlants": ["Potato", "Fennel"],
      "tips": ["Start indoors 6 weeks before last frost"]
    }
  ]
}
```

**Curl:**
```bash
curl "http://localhost:4000/api/v1/ai/recommendations/crops?region=us_ca" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## GET /api/v1/ai/recommendations/sustainability

Get personalized sustainability improvement suggestions.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "currentScore": 72.5,
    "tips": [
      { "action": "Install rainwater harvesting", "impact": "+15 points", "difficulty": "HARD" },
      { "action": "Start composting", "impact": "+10 points", "difficulty": "EASY" },
      { "action": "Plant pollinator-friendly flowers", "impact": "+5 points", "difficulty": "EASY" }
    ],
    "badges": ["WaterSaver", "SoilSteward"],
    "nextBadge": "EcoChampion (need 80 points)"
  }
}
```

**Curl:**
```bash
curl http://localhost:4000/api/v1/ai/recommendations/sustainability \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```
