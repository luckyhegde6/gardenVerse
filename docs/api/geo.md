# Geo API

Base path: `/api/v1/geo`

## GET /api/v1/geo/nearby

Find nearby gardens, users, or listings.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| radius | number | No | 10 | Search radius in km |
| type | string | No | `all` | `gardens`, `users`, `listings`, `all` |
| limit | number | No | 20 | Max 50 |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "gardens": [
      {
        "id": "uuid",
        "name": "Community Garden",
        "latitude": 37.7750,
        "longitude": -122.4190,
        "distance": 0.5,
        "owner": { "username": "greenfarmer", "avatarUrl": "https://..." },
        "cropCount": 12
      }
    ],
    "users": [
      {
        "id": "uuid",
        "username": "nearbygardener",
        "distance": 1.2,
        "sustainabilityScore": 75.0
      }
    ],
    "listings": [
      {
        "id": "uuid",
        "title": "Fresh Basil",
        "price": 10,
        "distance": 0.8
      }
    ]
  }
}
```

**Curl:**
```bash
curl "http://localhost:4000/api/v1/geo/nearby?radius=5&type=gardens" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## PATCH /api/v1/geo/location

Update user's location.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "latitude": 37.7749,
  "longitude": -122.4194
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "geohash": "9q8yyk",
    "region": "us_ca"
  },
  "message": "Location updated"
}
```

**Curl:**
```bash
curl -X PATCH http://localhost:4000/api/v1/geo/location \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -d '{"latitude":37.7749,"longitude":-122.4194}'
```

---

## GET /api/v1/geo/regional-stats

Get regional gardening statistics.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| region | string | No | Region code (defaults to user's region) |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "region": "us_ca",
    "totalGardens": 1250,
    "totalCrops": 15200,
    "activeUsers": 890,
    "topCrops": [
      { "name": "Tomato", "count": 3200 },
      { "name": "Lettuce", "count": 2100 },
      { "name": "Basil", "count": 1800 }
    ],
    "averageSustainabilityScore": 68.5,
    "weatherAdvisory": "Moderate drought conditions"
  }
}
```

**Curl:**
```bash
curl "http://localhost:4000/api/v1/geo/regional-stats?region=us_ca" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```
