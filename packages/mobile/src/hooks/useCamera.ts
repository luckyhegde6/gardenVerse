import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { ensurePermission } from '../utils/permissions';

interface UseCameraReturn {
  hasPermission: boolean | null;
  capturedImage: string | null;
  isCapturing: boolean;
  error: string | null;
  requestPermission: () => Promise<boolean>;
  takePhoto: () => Promise<string | null>;
  pickFromGallery: () => Promise<string | null>;
  resetCapture: () => void;
}

export function useCamera(): UseCameraReturn {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = useCallback(async () => {
    const result = await ensurePermission('camera');
    setHasPermission(result);
    return result;
  }, []);

  const takePhoto = useCallback(async () => {
    setIsCapturing(true);
    setError(null);

    try {
      const hasCamPermission = await ensurePermission('camera');
      if (!hasCamPermission) {
        setError('Camera permission denied');
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setCapturedImage(uri);
        return uri;
      }
      return null;
    } catch (err: any) {
      setError(err.message || 'Failed to capture photo');
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const pickFromGallery = useCallback(async () => {
    setIsCapturing(true);
    setError(null);

    try {
      const hasGalleryPermission = await ensurePermission('gallery');
      if (!hasGalleryPermission) {
        setError('Gallery permission denied');
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        const uri = result.assets[0].uri;
        setCapturedImage(uri);
        return uri;
      }
      return null;
    } catch (err: any) {
      setError(err.message || 'Failed to pick image');
      return null;
    } finally {
      setIsCapturing(false);
    }
  }, []);

  const resetCapture = useCallback(() => {
    setCapturedImage(null);
    setError(null);
  }, []);

  return {
    hasPermission,
    capturedImage,
    isCapturing,
    error,
    requestPermission,
    takePhoto,
    pickFromGallery,
    resetCapture,
  };
}
