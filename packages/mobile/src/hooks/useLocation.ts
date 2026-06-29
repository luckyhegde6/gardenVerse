import { useState, useEffect, useCallback } from "react";
import * as Location from "expo-location";
import { ensurePermission } from "@utils/permissions";
import { encodeGeohash } from "@utils/geo";

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  geohash: string | null;
  accuracy: number | null;
  address: string | null;
}

interface UseLocationReturn {
  location: LocationState;
  isFetching: boolean;
  error: string | null;
  hasPermission: boolean | null;
  requestPermission: () => Promise<boolean>;
  refreshLocation: () => Promise<void>;
}

export function useLocation(): UseLocationReturn {
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    geohash: null,
    accuracy: null,
    address: null,
  });
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const requestPermission = useCallback(async () => {
    const result = await ensurePermission("location");
    setHasPermission(result);
    return result;
  }, []);

  const refreshLocation = useCallback(async () => {
    setIsFetching(true);
    setError(null);

    try {
      const permGranted = await ensurePermission("location");
      setHasPermission(permGranted);

      if (!permGranted) {
        setError("Location permission denied");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = loc.coords;
      const geohash = encodeGeohash(latitude, longitude, 9);

      let address: string | null = null;
      try {
        const geocode = await Location.reverseGeocodeAsync({
          latitude,
          longitude,
        });
        if (geocode[0]) {
          const addr = geocode[0];
          address = [
            addr.name,
            addr.street,
            addr.city,
            addr.region,
            addr.country,
          ]
            .filter(Boolean)
            .join(", ");
        }
      } catch {
        // noop
      }

      setLocation({
        latitude,
        longitude,
        geohash,
        accuracy: loc.coords.accuracy ?? null,
        address,
      });
    } catch (err: any) {
      setError(err.message || "Failed to get location");
    } finally {
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    refreshLocation();
  }, [refreshLocation]);

  return {
    location,
    isFetching,
    error,
    hasPermission,
    requestPermission,
    refreshLocation,
  };
}
