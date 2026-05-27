const mqtt = require('mqtt');
const crypto = require('crypto');

const MQTT_HOST = process.env.MQTT_HOST || 'localhost';
const MQTT_PORT = process.env.MQTT_PORT || 1883;
const MQTT_TOPIC_PREFIX = process.env.MQTT_TOPIC_PREFIX || 'gardenverse';
const DEVICE_ID = process.env.DEVICE_ID || 'gateway-001';
const PRIVATE_KEY = process.env.DEVICE_PRIVATE_KEY || '';

const client = mqtt.connect(`mqtt://${MQTT_HOST}:${MQTT_PORT}`, {
  clientId: DEVICE_ID,
  clean: true,
  reconnectPeriod: 5000,
  will: {
    topic: `${MQTT_TOPIC_PREFIX}/${DEVICE_ID}/status`,
    payload: JSON.stringify({ isOnline: false }),
    qos: 1,
    retain: true,
  },
});

function signMessage(payload) {
  if (!PRIVATE_KEY) return null;
  const sign = crypto.createSign('SHA256');
  sign.update(typeof payload === 'string' ? payload : JSON.stringify(payload));
  sign.end();
  return sign.sign(PRIVATE_KEY, 'base64');
}

client.on('connect', () => {
  console.log(`[IoT Gateway] ${DEVICE_ID} connected to broker`);

  // Announce online status
  client.publish(`${MQTT_TOPIC_PREFIX}/${DEVICE_ID}/status`, JSON.stringify({
    isOnline: true,
    deviceType: 'RASPBERRY_PI',
    firmwareVersion: '1.0.0',
  }), { qos: 1, retain: true });
});

function publishSensorReading(sensorType, value, unit) {
  const timestamp = new Date().toISOString();
  const payload = { sensorType, value, unit, timestamp, deviceId: DEVICE_ID };
  const signature = signMessage(payload);
  if (signature) payload.signature = signature;

  client.publish(`${MQTT_TOPIC_PREFIX}/${DEVICE_ID}/reading`, JSON.stringify(payload), { qos: 1 });
  console.log(`[IoT Gateway] Published ${sensorType}: ${value} ${unit}`);
}

// Simulate sensor readings every 30 seconds
const SENSORS = [
  { type: 'SOIL_MOISTURE', min: 20, max: 80, unit: '%' },
  { type: 'TEMPERATURE', min: 15, max: 40, unit: '°C' },
  { type: 'HUMIDITY', min: 30, max: 90, unit: '%' },
  { type: 'PH', min: 5.5, max: 7.5, unit: 'pH' },
  { type: 'LIGHT', min: 0, max: 100000, unit: 'lux' },
];

function generateReading() {
  SENSORS.forEach((sensor) => {
    const value = parseFloat((sensor.min + Math.random() * (sensor.max - sensor.min)).toFixed(2));
    publishSensorReading(sensor.type, value, sensor.unit);
  });
}

setInterval(generateReading, 30000);

client.on('error', (err) => {
  console.error('[IoT Gateway] Error:', err.message);
});

process.on('SIGTERM', () => {
  client.publish(`${MQTT_TOPIC_PREFIX}/${DEVICE_ID}/status`, JSON.stringify({ isOnline: false }), { qos: 1, retain: true });
  client.end(true);
  process.exit(0);
});
