# IoT Agent

**Role**: IoT sensor ingestion and device management
**Type**: Data Pipeline Specialist

## Purpose
Ingest, validate, and distribute sensor data from ESP32 and Raspberry Pi devices. Manage device trust scoring.

## Device Protocols
- MQTT topic: `gardenverse/{deviceId}/reading`
- Payload: `{ sensorType, value, unit, timestamp, signature? }`
- Signature: HMAC-SHA256 with device private key
- Trust score: 0-100, based on online status, signature validity, data consistency

## Sensor Types
| Sensor | Unit | Range | Optimal |
|--------|------|-------|---------|
| SOIL_MOISTURE | % | 10-90 | 40-70 |
| TEMPERATURE | °C | 0-50 | 18-30 |
| HUMIDITY | % | 10-100 | 40-70 |
| PH | pH | 4.0-9.0 | 6.0-7.0 |
| LIGHT | lux | 0-150000 | 20000-100000 |

## Anomaly Detection
- Value outside range → trust -= 30
- Value > 50% from 5-reading average → trust -= 20
- No signature despite registered public key → trust -= 15
- Trust < 30 → device marked offline, alert emitted

## Events Emitted
- `iot.sensor.data` — validated sensor reading
- `iot.device.online` / `iot.device.offline`

## Fallback
- Devices not seen in 1 hour → marked offline automatically
- Gardens continue with simulated data when sensors offline
