# Marketplace API

Base path: `/api/v1/marketplace`

## GET /api/v1/marketplace/listings

Browse active marketplace listings.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| category | string | - | Filter by category |
| minPrice | number | - | Minimum price |
| maxPrice | number | - | Maximum price |
| currency | string | - | `GREEN_CREDITS`, `ECO_POINTS` |
| isLocal | boolean | - | Local listings only |
| region | string | - | Geohash prefix for local |
| status | string | `ACTIVE` | Listing status |
| sort | string | `createdAt` | `price`, `createdAt` |
| order | string | `desc` | `asc`, `desc` |
| page | number | 1 | |
| limit | number | 20 | Max 50 |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Organic Tomatoes",
      "description": "Fresh home-grown tomatoes",
      "category": "produce",
      "price": 50,
      "currency": "GREEN_CREDITS",
      "quantity": 10,
      "images": ["https://cdn.gardenverse.io/listings/img1.jpg"],
      "isLocal": true,
      "location": "9q8yyk",
      "seller": {
        "id": "uuid",
        "username": "greenfarmer",
        "avatarUrl": "https://...",
        "trustScore": 95.0
      },
      "createdAt": "2026-05-27T12:00:00Z"
    }
  ],
  "meta": { "total": 250, "page": 1, "limit": 20, "pages": 13 }
}
```

**Curl:**
```bash
curl "http://localhost:4000/api/v1/marketplace/listings?category=produce&sort=price&order=asc&page=1&limit=20" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## POST /api/v1/marketplace/listings

Create a new listing.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Organic Tomatoes",
  "description": "Fresh home-grown cherry tomatoes",
  "category": "produce",
  "price": 50,
  "currency": "GREEN_CREDITS",
  "quantity": 10,
  "images": ["data:image/jpeg;base64,..."],
  "isLocal": true,
  "expiresInDays": 14
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Organic Tomatoes",
    "status": "ACTIVE",
    "expiresAt": "2026-06-10T12:00:00Z"
  },
  "message": "Listing created"
}
```

**Curl:**
```bash
curl -X POST http://localhost:4000/api/v1/marketplace/listings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -d '{"title":"Organic Tomatoes","category":"produce","price":50,"currency":"GREEN_CREDITS","quantity":10}'
```

---

## GET /api/v1/marketplace/listings/:id

Get listing details.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Organic Tomatoes",
    "description": "Fresh home-grown cherry tomatoes",
    "category": "produce",
    "price": 50,
    "currency": "GREEN_CREDITS",
    "quantity": 10,
    "status": "ACTIVE",
    "images": ["https://cdn.gardenverse.io/listings/img1.jpg"],
    "isLocal": true,
    "location": "9q8yyk",
    "seller": { "id": "uuid", "username": "greenfarmer", "avatarUrl": "https://...", "trustScore": 95.0 },
    "createdAt": "2026-05-27T12:00:00Z",
    "expiresAt": "2026-06-10T12:00:00Z"
  }
}
```

**Curl:**
```bash
curl http://localhost:4000/api/v1/marketplace/listings/uuid \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## PATCH /api/v1/marketplace/listings/:id

Update a listing (seller only).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "title": "Updated Title",
  "price": 45,
  "quantity": 8
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Listing updated"
}
```

**Curl:**
```bash
curl -X PATCH http://localhost:4000/api/v1/marketplace/listings/uuid \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..." \
  -d '{"price":45}'
```

---

## DELETE /api/v1/marketplace/listings/:id

Cancel a listing (seller only).

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "message": "Listing cancelled"
}
```

**Curl:**
```bash
curl -X DELETE http://localhost:4000/api/v1/marketplace/listings/uuid \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## POST /api/v1/marketplace/listings/:id/purchase

Purchase a listing.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "transactionId": "uuid",
    "status": "PENDING",
    "amount": 50,
    "currency": "GREEN_CREDITS",
    "blockchainTxId": "0xabc...",
    "escrowId": 42
  },
  "message": "Purchase initiated. Funds held in escrow."
}
```

**Errors:** `400` (insufficient balance, own listing), `404` (listing not found), `409` (already sold)

**Curl:**
```bash
curl -X POST http://localhost:4000/api/v1/marketplace/listings/uuid/purchase \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## GET /api/v1/marketplace/transactions

Get user's transaction history.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| role | string | `buyer`, `seller`, `all` (default) |
| status | string | Filter by TransactionStatus |
| page | number | |
| limit | number | |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "status": "COMPLETED",
      "amount": 50,
      "currency": "GREEN_CREDITS",
      "listing": { "id": "uuid", "title": "Organic Tomatoes" },
      "buyer": { "id": "uuid", "username": "buyer1" },
      "seller": { "id": "uuid", "username": "greenfarmer" },
      "blockchainTxId": "0xabc...",
      "createdAt": "2026-05-27T12:00:00Z",
      "completedAt": "2026-05-27T12:05:00Z"
    }
  ],
  "meta": { "total": 42, "page": 1, "limit": 20 }
}
```

**Curl:**
```bash
curl "http://localhost:4000/api/v1/marketplace/transactions?role=seller&status=COMPLETED" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```

---

## GET /api/v1/marketplace/my-listings

Get current user's listings.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| status | string | `ACTIVE`, `SOLD`, `CANCELLED`, `EXPIRED` |
| page | number | |
| limit | number | |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Organic Tomatoes",
      "price": 50,
      "status": "ACTIVE",
      "views": 24,
      "createdAt": "2026-05-27T12:00:00Z"
    }
  ],
  "meta": { "total": 5 }
}
```

**Curl:**
```bash
curl "http://localhost:4000/api/v1/marketplace/my-listings?status=ACTIVE" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiIs..."
```
