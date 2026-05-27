# WebSocket Events

**Server:** `wss://api.gardenverse.io`  
**Namespace:** Default (`/`)  
**Auth:** JWT token passed as `auth.token` in handshake

## Client Events (C → S)

| Event | Payload | Description |
|-------|---------|-------------|
| `garden.update` | `{ gardenId, action, data }` | Update garden state (theme, decorations) |
| `crop.action` | `{ cropId, action, data }` | Perform crop action (water, fertilize) |
| `chat.message` | `{ receiverId, content, isEncrypted }` | Send a chat message |
| `location.update` | `{ latitude, longitude }` | Update user's live location |

### garden.update

```json
{
  "gardenId": "uuid",
  "action": "ARRANGE_PLOTS",
  "data": { "plots": [{ "cropId": "uuid", "x": 2, "y": 3 }] }
}
```

### crop.action

```json
{
  "cropId": "uuid",
  "action": "WATER",
  "data": {}
}
```

### chat.message

```json
{
  "receiverId": "uuid",
  "content": "encrypted:base64string",
  "isEncrypted": true
}
```

### location.update

```json
{
  "latitude": 37.7749,
  "longitude": -122.4194
}
```

---

## Server Events (S → C)

| Event | Payload | Description |
|-------|---------|-------------|
| `garden.sync` | `{ gardenId, crops, stats }` | Full garden state sync |
| `crop.growth` | `{ cropId, status, growthStage, health }` | Crop growth update |
| `notification.new` | `{ id, type, title, body, data }` | New notification |
| `chat.message` | `{ id, senderId, content, createdAt }` | Incoming chat message |
| `weather.alert` | `{ type, severity, headline, region }` | Weather alert for region |
| `sensor.update` | `{ deviceId, sensorType, value, unit }` | Live sensor reading |

### garden.sync

```json
{
  "gardenId": "uuid",
  "crops": [
    { "id": "uuid", "name": "Tomato", "status": "GROWING", "growthStage": 3, "health": 85.0 }
  ],
  "stats": { "totalCrops": 15, "averageHealth": 82.5 }
}
```

### crop.growth

```json
{
  "cropId": "uuid",
  "status": "MATURE",
  "growthStage": 5,
  "health": 90.0,
  "hydration": 75.0
}
```

### notification.new

```json
{
  "id": "uuid",
  "type": "crop_ready",
  "title": "Crop Ready to Harvest",
  "body": "Your Tomatoes are ready to harvest!",
  "data": { "cropId": "uuid", "cropName": "Tomato" }
}
```

### chat.message

```json
{
  "id": "uuid",
  "senderId": "uuid",
  "content": "encrypted:base64string",
  "isEncrypted": true,
  "createdAt": "2026-05-27T12:00:00Z"
}
```

### weather.alert

```json
{
  "type": "HEAT_WAVE",
  "severity": "HIGH",
  "headline": "Heat Wave Warning",
  "description": "Temperatures expected to reach 40°C",
  "region": "us_ca",
  "startAt": "2026-05-28T06:00:00Z",
  "endAt": "2026-05-30T18:00:00Z"
}
```

### sensor.update

```json
{
  "deviceId": "uuid",
  "sensorType": "SOIL_MOISTURE",
  "value": 45.2,
  "unit": "%",
  "timestamp": "2026-05-27T12:00:00Z"
}
```

---

## Room Structure

| Room Pattern | Description | Auto-join |
|-------------|-------------|-----------|
| `user:{userId}` | User's personal notification channel | Yes |
| `garden:{gardenId}` | Garden state updates | On garden view |
| `chat:{userId1}:{userId2}` | Direct chat (sorted IDs) | On chat open |
| `group:{groupId}` | Group chat | On group join |
| `region:{region}` | Regional broadcasts | On location set |

---

## Rate Limiting

- 60 messages/min per connection
- 10 location updates/min
- Connections idle for > 30min are disconnected
- Max 5 simultaneous connections per user
