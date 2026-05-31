const BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz";

function encodeBase32(value: number): string {
  let binary = value.toString(2);
  while (binary.length < 5) binary = "0" + binary;
  return BASE32[parseInt(binary, 2)];
}

export function encodeGeohash(
  latitude: number,
  longitude: number,
  precision = 9,
): string {
  let latMin = -90;
  let latMax = 90;
  let lonMin = -180;
  let lonMax = 180;
  let geohash = "";
  let isEven = true;
  let bit = 0;
  let currentChar = 0;

  while (geohash.length < precision) {
    if (isEven) {
      const mid = (lonMin + lonMax) / 2;
      if (longitude >= mid) {
        currentChar = (currentChar << 1) | 1;
        lonMin = mid;
      } else {
        currentChar = currentChar << 1;
        lonMax = mid;
      }
    } else {
      const mid = (latMin + latMax) / 2;
      if (latitude >= mid) {
        currentChar = (currentChar << 1) | 1;
        latMin = mid;
      } else {
        currentChar = currentChar << 1;
        latMax = mid;
      }
    }

    isEven = !isEven;
    bit++;

    if (bit === 5) {
      geohash += BASE32[currentChar];
      bit = 0;
      currentChar = 0;
    }
  }

  return geohash;
}

export function decodeGeohash(geohash: string): {
  latitude: number;
  longitude: number;
} {
  let latMin = -90;
  let latMax = 90;
  let lonMin = -180;
  let lonMax = 180;
  let isEven = true;

  for (const char of geohash) {
    const value = BASE32.indexOf(char);
    if (value === -1) continue;

    for (let i = 4; i >= 0; i--) {
      const bit = (value >> i) & 1;
      if (isEven) {
        const mid = (lonMin + lonMax) / 2;
        if (bit === 1) {
          lonMin = mid;
        } else {
          lonMax = mid;
        }
      } else {
        const mid = (latMin + latMax) / 2;
        if (bit === 1) {
          latMin = mid;
        } else {
          latMax = mid;
        }
      }
      isEven = !isEven;
    }
  }

  return {
    latitude: (latMin + latMax) / 2,
    longitude: (lonMin + lonMax) / 2,
  };
}

export function getGeohashNeighbors(geohash: string): string[] {
  const { latitude, longitude } = decodeGeohash(geohash);
  const precision = geohash.length;
  const latStep = 180 / (1 << ((precision * 5) / 2));
  const lonStep = 360 / (1 << ((precision * 5) / 2));

  return [
    encodeGeohash(latitude + latStep, longitude, precision),
    encodeGeohash(latitude - latStep, longitude, precision),
    encodeGeohash(latitude, longitude + lonStep, precision),
    encodeGeohash(latitude, longitude - lonStep, precision),
    encodeGeohash(latitude + latStep, longitude + lonStep, precision),
    encodeGeohash(latitude - latStep, longitude - lonStep, precision),
    encodeGeohash(latitude + latStep, longitude - lonStep, precision),
    encodeGeohash(latitude - latStep, longitude + lonStep, precision),
  ];
}

export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
