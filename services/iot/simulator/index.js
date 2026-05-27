const mqtt = require('mqtt');
const crypto = require('crypto');

const MQTT_HOST = process.env.MQTT_HOST || 'localhost';
const MQTT_PORT = process.env.MQTT_PORT || 1883;
const MQTT_TOPIC_PREFIX = process.env.MQTT_TOPIC_PREFIX || 'gardenverse';
const DEVICE_COUNT = parseInt(process.env.DEVICE_COUNT || '5', 10);

const PRIVATE_KEY = process.env.DEVICE_PRIVATE_KEY || '';

function signMessage(payload) {
  if (!PRIVATE_KEY) return null;
  const sign = crypto.createSign('SHA256');
  sign.update(JSON.stringify(payload));
  sign.end();
  return sign.sign(PRIVATE_KEY, 'base64');
}

function createSimulatedDevice(index) {
  const deviceId = `sim-esp32-${String(index).padStart(3, '0')}`;

  const client = mqtt.connect(`mqtt://${MQTT_HOST}:${MQTT_PORT}`, {
    clientId: deviceId,
    clean: true,
    reconnectPeriod: 5000,
  });

  client.on('connect', () => {
    console.log(`[Simulator] ${deviceId} connected`);

    // Announce status
    client.publish(`${MQTT_TOPIC_PREFIX}/${deviceId}/status`, JSON.stringify({
      isOnline: true,
      deviceType: 'ESP32',
      firmwareVersion: '2.1.0',
      batteryLevel: parseFloat((70 + Math.random() * 30).toFixed(1)),
    }), { qos: 1, retain: true });
  });

  function publishReading() {
    const timestamp = new Date().toISOString();
    const sensors = [
      { type: 'SOIL_MOISTURE', value: 30 + Math.random() * 50, unit: '%' },
      { type: 'TEMPERATURE', value: 20 + Math.random() * 20, unit: '°C' },
      { type: 'HUMIDITY', value: 40 + Math.random() * 50, unit: '%' },
      { type: 'PH', value: 5.5 + Math.random() * 2, unit: 'pH' },
      { type: 'LIGHT', value: Math.random() * 100000, unit: 'lux' },
    ];

    sensors.forEach((sensor) => {
      const value = parseFloat(sensor.value.toFixed(2));
      const payload = { sensorType: sensor.type, value, unit: sensor.unit, timestamp, deviceId };
      const signature = signMessage(payload);
      if (signature) payload.signature = signature;

      // Simulate network delay
      setTimeout(() => {
        client.publish(`${MQTT_TOPIC_PREFIX}/${deviceId}/reading`, JSON.stringify(payload), { qos: 1 });
      }, Math.random() * 100);
    });
  }

  // Publish readings every 20-40 seconds
  setInterval(publishReading, 20000 + Math.random() * 20000);

  client.on('error', (err) => {
    console.error(`[Simulator] ${deviceId} error:`, err.message);
  });

  return client;
}

console.log(`[Simulator] Starting ${DEVICE_COUNT} simulated devices...`);
const clients = [];
for (let i = 0; i < DEVICE_COUNT; i++) {
  clients.push(createSimulatedDevice(i));
}

process.on('SIGTERM', () => {
  clients.forEach((client) => {
    client.end(true);
  });
  process.exit(0);
});
