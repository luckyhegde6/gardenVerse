const mqtt = require('mqtt');
const Redis = require('ioredis');
const axios = require('axios');

const MQTT_HOST = process.env.MQTT_HOST || 'localhost';
const MQTT_PORT = process.env.MQTT_PORT || 1883;
const MQTT_TOPIC_PREFIX = process.env.MQTT_TOPIC_PREFIX || 'gardenverse';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000';

const redis = new Redis(REDIS_URL);

const client = mqtt.connect(`mqtt://${MQTT_HOST}:${MQTT_PORT}`, {
  clientId: `gardenverse-bridge-${Math.random().toString(36).substr(2, 9)}`,
  clean: true,
  reconnectPeriod: 5000,
});

const INGEST_ENDPOINT = `${BACKEND_URL}/api/v1/iot/readings`;

client.on('connect', () => {
  console.log('[MQTT Bridge] Connected to broker');
  client.subscribe(`${MQTT_TOPIC_PREFIX}/+/+/reading`, { qos: 1 });
  client.subscribe(`${MQTT_TOPIC_PREFIX}/+/+/status`, { qos: 1 });
});

client.on('message', async (topic, payload) => {
  try {
    const message = JSON.parse(payload.toString());
    const parts = topic.split('/');
    const deviceId = parts[1];
    const eventType = parts[2];

    if (eventType === 'reading') {
      await handleSensorReading(deviceId, message);
    } else if (eventType === 'status') {
      await handleDeviceStatus(deviceId, message);
    }
  } catch (err) {
    console.error('[MQTT Bridge] Error processing message:', err.message);
  }
});

async function handleSensorReading(deviceId, data) {
  const { sensorType, value, unit, timestamp, signature } = data;

  if (!sensorType || value === undefined) {
    console.warn('[MQTT Bridge] Invalid sensor reading:', deviceId, data);
    return;
  }

  // Cache latest reading in Redis
  const key = `sensor:latest:${deviceId}:${sensorType}`;
  await redis.set(key, JSON.stringify({ value, unit, timestamp }), 'EX', 3600);

  // Forward to backend
  try {
    await axios.post(INGEST_ENDPOINT, {
      deviceId,
      sensorType,
      value,
      unit,
      signature,
      timestamp: timestamp || new Date().toISOString(),
    }, {
      headers: { 'Content-Type': 'application/json', 'X-IoT-Secret': process.env.IOT_SECRET || '' },
      timeout: 5000,
    });
  } catch (err) {
    console.error('[MQTT Bridge] Backend ingest failed:', err.message);
  }
}

async function handleDeviceStatus(deviceId, data) {
  const { isOnline, firmwareVersion, batteryLevel } = data;
  const key = `device:status:${deviceId}`;
  await redis.set(key, JSON.stringify({ isOnline, firmwareVersion, batteryLevel, lastSeen: new Date().toISOString() }), 'EX', 300);
}

client.on('error', (err) => {
  console.error('[MQTT Bridge] Error:', err.message);
});

process.on('SIGTERM', () => {
  client.end(true);
  redis.quit();
  process.exit(0);
});
