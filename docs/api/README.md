# GardenVerse API Documentation

**Base URL:** `/api/v1`

**Auth:** Bearer JWT token in `Authorization` header

**Content-Type:** `application/json`

## API Reference

| Module | Description | Endpoints |
|--------|-------------|-----------|
| [Authentication](./authentication.md) | Register, login, OTP, password reset, Telegram linking | 8 endpoints |
| [Users](./users.md) | Profile, avatar, leaderboard | 4 endpoints |
| [Gardens](./gardens.md) | Garden CRUD, stats | 5 endpoints |
| [Crops](./crops.md) | Plant, water, fertilize, harvest | 7 endpoints |
| [Marketplace](./marketplace.md) | Listings, purchase, transactions | 8 endpoints |
| [Weather](./weather.md) | Current, forecast, alerts | 3 endpoints |
| [AI](./ai.md) | Plant scan, recommendations | 7 endpoints |
| [IoT](./iot.md) | Devices, sensor readings | 6 endpoints |
| [Notifications](./notifications.md) | Push notifications, device registration | 3 endpoints |
| [Geo](./geo.md) | Nearby queries, location, regional stats | 3 endpoints |
| [Intelligence](./intelligence.md) | Government schemes, advisories, news | 4 endpoints |
| [Invites](./invites.md) | Invite codes, redeem, eligibility | 4 endpoints |
| [Community](./community.md) | Groups, join/leave, members | 6 endpoints |
| [Chat](./chat.md) | Messages, conversations | 4 endpoints |
| [QR](./qr.md) | Generate, validate, use QR codes | 3 endpoints |
| [Moderation](./moderation.md) | Reports, actions | 4 endpoints |
| [Feature Flags](./feature-flags.md) | Flag checks, overrides | 4 endpoints |
| [Admin](./admin.md) | Dashboard, user management | 6 endpoints |
| [WebSocket](./websocket.md) | Real-time event reference | - |

## Standard Response Envelope

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "timestamp": "2026-05-27T12:00:00Z",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
```

## Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [
      { "field": "email", "message": "Email is required" }
    ]
  },
  "timestamp": "2026-05-27T12:00:00Z"
}
```

## HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Unprocessable Entity |
| 429 | Too Many Requests |
| 500 | Internal Server Error |
