import { useState, useCallback } from 'react';
import api from '../services/api';
import { AiScanResult } from '../types';

interface UseAIReturn {
  isScanning: boolean;
  currentResult: AiScanResult | null;
  scanHistory: AiScanResult[];
  error: string | null;
  scanImage: (imageUri: string) => Promise<AiScanResult | null>;
  fetchScanHistory: () => Promise<void>;
  resetResult: () => void;
  setCurrentResult: (result: AiScanResult | null) => void;
}

export function useAI(): UseAIReturn {
  const [isScanning, setIsScanning] = useState(false);
  const [currentResult, setCurrentResult] = useState<AiScanResult | null>(
    null
  );
  const [scanHistory, setScanHistory] = useState<AiScanResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const scanImage = useCallback(
    async (imageUri: string): Promise<AiScanResult | null> => {
      setIsScanning(true);
      setError(null);

      try {
        const formData = new FormData();
        const filename = imageUri.split('/').pop() || 'scan.jpg';
        const ext = filename.split('.').pop() || 'jpg';

        formData.append('image', {
          uri: imageUri,
          name: filename,
          type: `image/${ext}`,
        } as any);

        const response = await api.post<AiScanResult>('/ai/scan', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 60000,
        });

        const result = response.data;
        setCurrentResult(result);
        setScanHistory((prev) => [result, ...prev]);
        return result;
      } catch (err: any) {
        const message =
          err.response?.data?.message || 'Failed to scan image';
        setError(message);
        return null;
      } finally {
        setIsScanning(false);
      }
    },
    []
  );

  const fetchScanHistory = useCallback(async () => {
    try {
      const response = await api.get<AiScanResult[]>('/ai/history');
      setScanHistory(response.data);
    } catch {}
  }, []);

  const resetResult = useCallback(() => {
    setCurrentResult(null);
    setError(null);
  }, []);

  return {
    isScanning,
    currentResult,
    scanHistory,
    error,
    scanImage,
    fetchScanHistory,
    resetResult,
    setCurrentResult,
  };
}
