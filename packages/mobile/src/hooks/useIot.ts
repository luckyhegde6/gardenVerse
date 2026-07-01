import { useState, useEffect, useCallback } from "react";
import api from "@services/api";
import { IotDevice, SensorReading } from "@/types";

interface UseIotReturn {
  devices: IotDevice[];
  readings: SensorReading[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getDeviceReadings: (
    deviceId: string,
    sensorType: string,
  ) => Promise<SensorReading[]>;
}

export function useIot(): UseIotReturn {
  const [devices, setDevices] = useState<IotDevice[]>([]);
  const [readings, setReadings] = useState<SensorReading[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDevicesAndReadings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [devicesRes, readingsRes] = await Promise.all([
        api.get<IotDevice[]>("/iot/devices"),
        api.get<SensorReading[]>("/iot/readings/latest"),
      ]);
      setDevices(devicesRes.data);
      setReadings(readingsRes.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to fetch IoT data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevicesAndReadings();
  }, [fetchDevicesAndReadings]);

  const getDeviceReadings = useCallback(
    async (deviceId: string, sensorType: string) => {
      const response = await api.get<SensorReading[]>(
        `/iot/devices/${deviceId}/readings`,
        { params: { sensorType, limit: 50 } },
      );
      return response.data;
    },
    [],
  );

  return {
    devices,
    readings,
    isLoading,
    error,
    refresh: fetchDevicesAndReadings,
    getDeviceReadings,
  };
}
