const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
const NEIGHBORS: Record<string, Record<string, string>> = {
  right: { even: 'bc01fg45238967deuvhjyznpkmstqrwx', odd: 'p0r21436x8zb9dcf5h7kjnmqesgutwvy' },
  left: { even: '238967debc01fg45kmstqrwxuvhjyznp', odd: '14365h7k9dcfesgujnmqp0r2twvyx8zb' },
  top: { even: 'p0r21436x8zb9dcf5h7kjnmqesgutwvy', odd: 'bc01fg45238967deuvhjyznpkmstqrwx' },
  bottom: { even: '14365h7k9dcfesgujnmqp0r2twvyx8zb', odd: '238967debc01fg45kmstqrwxuvhjyznp' },
};
const BORDERS: Record<string, Record<string, string>> = {
  right: { even: 'bcfguvyz', odd: 'prxz' },
  left: { even: '0145hjnp', odd: '028b' },
  top: { even: 'prxz', odd: 'bcfguvyz' },
  bottom: { even: '028b', odd: '0145hjnp' },
};

function refineInterval(interval: [number, number], mid: number, cd: number): [number, number] {
  if (cd === 0) {
    return [interval[0], mid];
  }
  return [mid, interval[1]];
}

export class GeohashUtil {
  static encode(lat: number, lng: number, precision: number = 9): string {
    let latInterval: [number, number] = [-90, 90];
    let lngInterval: [number, number] = [-180, 180];
    let geohash = '';
    let isEven = true;
    let bit = 0;
    let ch = 0;

    while (geohash.length < precision) {
      if (isEven) {
        const mid = (lngInterval[0] + lngInterval[1]) / 2;
        lngInterval = refineInterval(lngInterval, mid, lng >= mid ? 1 : 0);
        ch = (ch << 1) | (lng >= mid ? 1 : 0);
      } else {
        const mid = (latInterval[0] + latInterval[1]) / 2;
        latInterval = refineInterval(latInterval, mid, lat >= mid ? 1 : 0);
        ch = (ch << 1) | (lat >= mid ? 1 : 0);
      }

      isEven = !isEven;

      if (bit < 4) {
        bit++;
      } else {
        geohash += BASE32[ch];
        bit = 0;
        ch = 0;
      }
    }

    return geohash;
  }

  static decode(geohash: string): { lat: number; lng: number; latError: number; lngError: number } {
    let latInterval: [number, number] = [-90, 90];
    let lngInterval: [number, number] = [-180, 180];
    let isEven = true;

    for (let i = 0; i < geohash.length; i++) {
      const c = geohash[i];
      const cd = BASE32.indexOf(c);
      for (let j = 4; j >= 0; j--) {
        const mask = 1 << j;
        if (isEven) {
          const mid = (lngInterval[0] + lngInterval[1]) / 2;
          lngInterval = refineInterval(lngInterval, mid, cd & mask ? 1 : 0);
        } else {
          const mid = (latInterval[0] + latInterval[1]) / 2;
          latInterval = refineInterval(latInterval, mid, cd & mask ? 1 : 0);
        }
        isEven = !isEven;
      }
    }

    return {
      lat: (latInterval[0] + latInterval[1]) / 2,
      lng: (lngInterval[0] + lngInterval[1]) / 2,
      latError: (latInterval[1] - latInterval[0]) / 2,
      lngError: (lngInterval[1] - lngInterval[0]) / 2,
    };
  }

  static getNeighbors(geohash: string): string[] {
    const neighbors: string[] = [];
    const directions = ['top', 'bottom', 'left', 'right', 'topright', 'topleft', 'bottomright', 'bottomleft'];

    for (const dir of directions) {
      neighbors.push(this._calculateNeighbor(geohash, dir));
    }

    return neighbors;
  }

  private static _calculateNeighbor(geohash: string, direction: string): string {
    const lastChar = geohash[geohash.length - 1];
    const parent = geohash.slice(0, -1);
    const type = (geohash.length % 2 === 0) ? 'even' : 'odd';

    const type2 = (geohash.length % 2 === 0) ? 'even' : 'odd';

    if (direction === 'top') {
      if (BORDERS.top[type2].includes(lastChar)) {
        return this._calculateNeighbor(parent, 'top') + BASE32[NEIGHBORS.top[type2].indexOf(lastChar)];
      }
      return parent + BASE32[NEIGHBORS.top[type2].indexOf(lastChar)];
    }

    if (direction === 'bottom') {
      if (BORDERS.bottom[type2].includes(lastChar)) {
        return this._calculateNeighbor(parent, 'bottom') + BASE32[NEIGHBORS.bottom[type2].indexOf(lastChar)];
      }
      return parent + BASE32[NEIGHBORS.bottom[type2].indexOf(lastChar)];
    }

    if (direction === 'left') {
      if (BORDERS.left[type2].includes(lastChar)) {
        return this._calculateNeighbor(parent, 'left') + BASE32[NEIGHBORS.left[type2].indexOf(lastChar)];
      }
      return parent + BASE32[NEIGHBORS.left[type2].indexOf(lastChar)];
    }

    if (direction === 'right') {
      if (BORDERS.right[type2].includes(lastChar)) {
        return this._calculateNeighbor(parent, 'right') + BASE32[NEIGHBORS.right[type2].indexOf(lastChar)];
      }
      return parent + BASE32[NEIGHBORS.right[type2].indexOf(lastChar)];
    }

    if (direction === 'topleft') {
      return this._calculateNeighbor(
        this._calculateNeighbor(geohash, 'top'),
        'left',
      );
    }

    if (direction === 'topright') {
      return this._calculateNeighbor(
        this._calculateNeighbor(geohash, 'top'),
        'right',
      );
    }

    if (direction === 'bottomleft') {
      return this._calculateNeighbor(
        this._calculateNeighbor(geohash, 'bottom'),
        'left',
      );
    }

    if (direction === 'bottomright') {
      return this._calculateNeighbor(
        this._calculateNeighbor(geohash, 'bottom'),
        'right',
      );
    }

    return geohash;
  }

  static distanceInKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = this._toRad(lat2 - lat1);
    const dLng = this._toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this._toRad(lat1)) *
        Math.cos(this._toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static _toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }
}
