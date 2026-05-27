# Government Intelligence API

Base path: `/api/v1/intelligence`

## GET /api/v1/intelligence/schemes

Get government agriculture schemes.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| region | string | Yes | Region/country code |
| category | string | No | Scheme category filter |
| status | string | No | `active`, `upcoming`, `expired` |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Subsidy for Organic Farming",
      "description": "Financial assistance for farmers transitioning to organic methods",
      "type": "SUBSIDY",
      "region": "in",
      "source": "govt_agriculture_dept",
      "eligibility": "Small-scale farmers with < 2 hectares",
      "benefits": "Up to ₹50,000 per hectare",
      "url": "https://govt.example.com/scheme/123",
      "publishedAt": "2026-01-15T00:00:00Z",
      "expiresAt": "2027-01-15T00:00:00Z"
    }
  ]
}
```

**Curl:**
```bash
curl "http://localhost:4000/api/v1/intelligence/schemes?region=in&status=active" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## GET /api/v1/intelligence/advisories

Get agricultural advisories.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| region | string | Yes | Region code |
| type | string | No | `pest`, `weather`, `disease`, `general` |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Fall Armyworm Alert",
      "description": "Increased fall armyworm activity reported in maize fields",
      "type": "pest",
      "region": "in_mh",
      "severity": "HIGH",
      "source": "ministry_of_agriculture",
      "url": "https://govt.example.com/advisory/456",
      "publishedAt": "2026-05-25T00:00:00Z"
    }
  ]
}
```

**Curl:**
```bash
curl "http://localhost:4000/api/v1/intelligence/advisories?region=in_mh&type=pest" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## GET /api/v1/intelligence/news

Get agriculture news.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| region | string | Yes | - | Region code |
| limit | number | No | 20 | Max 50 |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "New Drought-Resistant Wheat Variety Released",
      "description": "ICAR releases HD-3411 variety suitable for rain-fed areas",
      "source": "agriculture_news",
      "url": "https://news.example.com/article/789",
      "publishedAt": "2026-05-26T10:00:00Z"
    }
  ]
}
```

**Curl:**
```bash
curl "http://localhost:4000/api/v1/intelligence/news?region=in&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## GET /api/v1/intelligence/search

Search across all intelligence sources.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| q | string | Yes | Search query |
| type | string | No | `schemes`, `advisories`, `news`, `all` |
| region | string | No | Filter by region |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "schemes": [],
    "advisories": [
      {
        "id": "uuid",
        "title": "Organic Fertilizer Subsidy",
        "type": "advisory",
        "relevance": 0.95
      }
    ],
    "news": []
  }
}
```

**Curl:**
```bash
curl "http://localhost:4000/api/v1/intelligence/search?q=organic+fertilizer&type=all&region=in" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```
