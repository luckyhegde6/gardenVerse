# Weather API

Base path: `/api/v1/weather`

## GET /api/v1/weather/current

Get current weather for a region.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| region | string | Yes | Region code or geohash |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "region": "us_ca",
    "temperature": 22.5,
    "humidity": 65,
    "rainfall": 0.0,
    "windSpeed": 12.5,
    "sunlightHours": 10.2,
    "condition": "PARTLY_CLOUDY",
    "recordedAt": "2026-05-27T12:00:00Z"
  }
}
```

**Curl:**
```bash
curl "http://localhost:4000/api/v1/weather/current?region=us_ca" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## GET /api/v1/weather/forecast

Get weather forecast.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| region | string | Yes | - | Region code or geohash |
| days | number | No | 7 | Forecast days (1-14) |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "region": "us_ca",
    "forecast": [
      {
        "date": "2026-05-28",
        "tempHigh": 24.0,
        "tempLow": 15.0,
        "humidity": 60,
        "rainfall": 0.2,
        "condition": "CLOUDY",
        "sunlightHours": 8.0
      },
      {
        "date": "2026-05-29",
        "tempHigh": 26.0,
        "tempLow": 16.0,
        "humidity": 55,
        "rainfall": 0.0,
        "condition": "SUNNY",
        "sunlightHours": 12.0
      }
    ],
    "recordedAt": "2026-05-27T12:00:00Z"
  }
}
```

**Curl:**
```bash
curl "http://localhost:4000/api/v1/weather/forecast?region=us_ca&days=3" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## GET /api/v1/weather/alerts

Get weather alerts for a region.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| region | string | Yes | Region code or geohash |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "region": "us_ca",
    "alerts": [
      {
        "type": "HEAT_WAVE",
        "severity": "MODERATE",
        "headline": "Heat advisory in effect",
        "description": "Temperatures expected to reach 38°C",
        "startAt": "2026-05-28T06:00:00Z",
        "endAt": "2026-05-30T18:00:00Z",
        "recommendation": "Increase watering frequency, provide shade"
      }
    ]
  }
}
```

**Curl:**
```bash
curl "http://localhost:4000/api/v1/weather/alerts?region=us_ca" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```
