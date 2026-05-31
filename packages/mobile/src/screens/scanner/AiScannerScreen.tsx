import React, { useState, useRef } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Button } from "../../components/ui/Button";
import { CameraOverlay } from "../../components/scanner/CameraOverlay";
import { ScanResult } from "../../components/scanner/ScanResult";
import { ScanHistory } from "../../components/scanner/ScanHistory";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { useAI } from "../../hooks/useAI";
import { AiScanResult } from "../../types";

export function AiScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [mode, setMode] = useState<"camera" | "result" | "history">("camera");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const {
    isScanning,
    currentResult,
    scanHistory,
    error,
    scanImage,
    setCurrentResult,
  } = useAI();
  const cameraRef = useRef<any>(null);

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
      });
      setCapturedImage(photo.uri);
      await scanImage(photo.uri);
      setMode("result");
    } catch {}
  };

  const handleGalleryPick = async () => {
    const { launchImageLibraryAsync } = require("expo-image-picker");
    const result = await launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.7,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setCapturedImage(result.assets[0].uri);
      await scanImage(result.assets[0].uri);
      setMode("result");
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setMode("camera");
  };

  if (!permission) {
    return <LoadingSpinner fullScreen />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 px-6">
        <Text className="text-5xl mb-4">📷</Text>
        <Text className="text-lg font-semibold text-gray-900 mb-2">
          Camera Access Needed
        </Text>
        <Text className="text-sm text-gray-500 text-center mb-6">
          Allow camera access to scan plants for health analysis
        </Text>
        <Button title="Grant Permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {mode === "camera" && (
        <View className="flex-1">
          <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back">
            <CameraOverlay isScanning={isScanning} />
            <View className="absolute bottom-0 left-0 right-0 p-6">
              <View className="flex-row items-center justify-center mb-6 gap-6">
                <TouchableOpacity
                  onPress={handleGalleryPick}
                  className="w-12 h-12 rounded-full bg-white/30 items-center justify-center"
                >
                  <Text className="text-xl">🖼️</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleCapture}
                  disabled={isScanning}
                  className="w-20 h-20 rounded-full border-4 border-white items-center justify-center"
                >
                  <View className="w-16 h-16 rounded-full bg-white" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setMode("history")}
                  className="w-12 h-12 rounded-full bg-white/30 items-center justify-center"
                >
                  <Text className="text-xl">📋</Text>
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        </View>
      )}

      {mode === "result" && currentResult && (
        <ScrollView className="flex-1 bg-gray-50">
          {capturedImage && (
            <Image
              source={{ uri: capturedImage }}
              className="w-full h-64"
              resizeMode="cover"
            />
          )}

          {isScanning ? (
            <LoadingSpinner
              fullScreen
              message="AI is analyzing your plant..."
            />
          ) : (
            <>
              <ScanResult result={currentResult} />
              <View className="px-4 pb-8">
                <Button
                  title="Scan Another Plant"
                  onPress={handleRetake}
                  variant="outline"
                  className="mb-3"
                />
                <Button
                  title="View History"
                  onPress={() => setMode("history")}
                  variant="ghost"
                />
              </View>
            </>
          )}
        </ScrollView>
      )}

      {mode === "history" && (
        <View className="flex-1 bg-gray-50 px-4 pt-4">
          <ScanHistory
            scans={scanHistory}
            onScanPress={(scan) => {
              setCurrentResult(scan);
              setMode("result");
            }}
          />
          <View className="py-4">
            <Button title="Back to Scanner" onPress={() => setMode("camera")} />
          </View>
        </View>
      )}
    </View>
  );
}
