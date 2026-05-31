import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import { WeatherData } from "../types";
import { useLocation } from "./useLocation";

interface UseWeatherReturn {
  weather: WeatherData | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useWeather(): UseWeatherReturn {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { location } = useLocation();

  const fetchWeather = useCallback(async () => {
    if (!location.latitude || !location.longitude) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<WeatherData>("/weather", {
        params: {
          lat: location.latitude,
          lon: location.longitude,
        },
      });
      setWeather(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch weather");
    } finally {
      setIsLoading(false);
    }
  }, [location.latitude, location.longitude]);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  return {
    weather,
    isLoading,
    error,
    refresh: fetchWeather,
  };
}
