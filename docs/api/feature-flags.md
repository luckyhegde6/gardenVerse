# Feature Flags API

Base path: `/api/v1/feature-flags`

## GET /api/v1/feature-flags

Get all feature flags for the current user.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "flags": [
      {
        "name": "ai_diagnosis",
        "enabled": true,
        "description": "AI-powered plant disease diagnosis"
      },
      {
        "name": "marketplace",
        "enabled": true,
        "description": "P2P marketplace for garden produce"
      },
      {
        "name": "iot_beta",
        "enabled": false,
        "description": "IoT device integration (beta)"
      },
      {
        "name": "blockchain_beta",
        "enabled": false,
        "description": "Blockchain-based transactions (beta)"
      }
    ],
    "overrides": [
      {
        "featureName": "iot_beta",
        "enabled": true
      }
    ]
  }
}
```

**Curl:**
```bash
curl http://localhost:4000/api/v1/feature-flags \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## POST /api/v1/feature-flags/:name/check

Check if a specific feature is enabled.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "name": "iot_beta",
    "enabled": false,
    "overridden": false
  }
}
```

**Curl:**
```bash
curl -X POST http://localhost:4000/api/v1/feature-flags/iot_beta/check \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## PATCH /api/v1/feature-flags/:name

Update a feature flag (admin only).

**Headers:** `Authorization: Bearer <token>` (requires ADMIN role)

**Request Body:**
```json
{
  "enabled": true,
  "description": "IoT device integration is now GA",
  "rules": {
    "percentage": 50,
    "regions": ["us_ca", "us_tx"],
    "minLevel": 5
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Feature flag updated"
}
```

**Curl:**
```bash
curl -X PATCH http://localhost:4000/api/v1/feature-flags/iot_beta \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -d '{"enabled":true,"rules":{"percentage":50,"regions":["us_ca"]}}'
```

---

## POST /api/v1/feature-flags/override

Set a personal override for a feature flag.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "featureName": "iot_beta",
  "enabled": true
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Override set. You now have access to iot_beta."
}
```

**Curl:**
```bash
curl -X POST http://localhost:4000/api/v1/feature-flags/override \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -d '{"featureName":"iot_beta","enabled":true}'
```
