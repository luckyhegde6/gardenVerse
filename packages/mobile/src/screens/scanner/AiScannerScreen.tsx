import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
  StyleSheet,
} from "react-native";
import { CameraView as ExpoCameraView, useCameraPermissions } from "expo-camera";
import { launchImageLibraryAsync, MediaTypeOptions } from "expo-image-picker";
import { requestCameraPermission } from "@utils/permissions";
import { Button } from "@components/ui/Button";
import { CameraOverlay } from "@components/scanner/CameraOverlay";
import { ScanResult } from "@components/scanner/ScanResult";
import { ScanHistory } from "@components/scanner/ScanHistory";
import { LoadingSpinner } from "@components/ui/LoadingSpinner";
import { useAI } from "@hooks/useAI";
import { AiScanResult } from "@/types";
import { plantIdQuest } from "@services/plantIdentificationQuest";
import HapticFeedback from "@utils/haptics";

// expo-camera CameraView has a type incompatibility with React 18 JSX types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CameraView = ExpoCameraView as any;

export function AiScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();

  // ─── Request camera permission on mount ────────────────────────────────
  useEffect(() => {
    if (!permission?.granted) {
      requestCameraPermission();
    }
  }, []);
  const [mode, setMode] = useState<"camera" | "result" | "history">("camera");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const {
    isScanning,
    currentResult,
    scanHistory,
    error: _error,
    scanImage,
    fetchScanHistory,
    setCurrentResult,
  } = useAI();

  // ─── Fetch scan history on mount ────────────────────────────────────────
  useEffect(() => {
    fetchScanHistory();
  }, []);
  const cameraRef = useRef<any>(null);

  // ─── Plant-ID quest integration ────────────────────────────────────────
  const [questXpEarned, setQuestXpEarned] = useState(0);
  const [isNewSpecies, setIsNewSpecies] = useState(false);
  const [questProgressText, setQuestProgressText] = useState<string | null>(null);
  const [showPhotoPrompt, setShowPhotoPrompt] = useState(false);
  const questXpOpacity = useRef(new Animated.Value(0)).current;
  const questXpTranslateY = useRef(new Animated.Value(20)).current;

  const showQuestXpAnimation = useCallback(
    (xp: number, newSpecies: boolean, progressText: string) => {
      setQuestXpEarned(xp);
      setIsNewSpecies(newSpecies);
      setQuestProgressText(progressText);
      questXpOpacity.setValue(0);
      questXpTranslateY.setValue(20);
      Animated.parallel([
        Animated.timing(questXpOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(questXpTranslateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
      setTimeout(() => {
        Animated.timing(questXpOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }, 2500);
    },
    [questXpOpacity, questXpTranslateY],
  );

  const handlePlantIdentified = useCallback(
    async (result: AiScanResult, imageUri: string) => {
      const speciesName = result.plantName || result.species || "Unknown Plant";
      const speciesId = result.species || result.id || speciesName.toLowerCase().replace(/\s+/g, "_");
      const confidence = result.healthScore ?? 85;

      try {
        // Award identification XP
        const idResult = await plantIdQuest.checkAndAwardIdentificationQuest(
          speciesId,
          speciesName,
          confidence,
        );

        // Award photo XP
        const photoResult = await plantIdQuest.checkAndAwardPhotoQuest(
          imageUri,
          speciesId,
          speciesName,
          confidence,
        );

        const totalXp = idResult.xpAwarded + photoResult.xpAwarded;
        const speciesCount = await plantIdQuest.getSpeciesIdentifiedCount();

        showQuestXpAnimation(
          totalXp,
          idResult.isNewSpecies,
          idResult.isNewSpecies
            ? `Species ${speciesCount} identified!`
            : `Photo captured!`,
        );

        setShowPhotoPrompt(true);
        await HapticFeedback.success();
      } catch {
        // Silent fail — quest tracking is non-critical
      }
    },
    [showQuestXpAnimation],
  );

  const handleCapture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
      });
      setCapturedImage(photo.uri);
      await scanImage(photo.uri);
      setShowPhotoPrompt(false);
      // Plant-ID quest hook-in: after scan completes and we have a result,
      // we'll trigger identification from the result mode
    } catch (e) {
      console.error('Capture failed:', e);
    }
  };

  const handleGalleryPick = async () => {
    const result = await launchImageLibraryAsync({
      mediaTypes: MediaTypeOptions.Images,
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
        <ScrollView
          className="flex-1 bg-gray-50"
          onLayout={() => {
            // Trigger plant identification when result view mounts with a result
            if (capturedImage && currentResult) {
              handlePlantIdentified(currentResult, capturedImage);
            }
          }}
        >
          {capturedImage && (
            <View style={{ position: "relative" }}>
              <Image
                source={{ uri: capturedImage }}
                className="w-full h-64"
                resizeMode="cover"
              />
              {/* Quest XP overlay */}
              {questXpEarned > 0 && (
                <Animated.View
                  style={[
                    questStyles.xpOverlay,
                    {
                      opacity: questXpOpacity,
                      transform: [{ translateY: questXpTranslateY }],
                    },
                  ]}
                  pointerEvents="none"
                >
                  <Text style={questStyles.xpText}>
                    +{questXpEarned} XP
                  </Text>
                  {questProgressText && (
                    <Text style={questStyles.xpSubtext}>
                      {isNewSpecies ? "🌟 " : ""}{questProgressText}
                    </Text>
                  )}
                </Animated.View>
              )}
            </View>
          )}

          {isScanning ? (
            <LoadingSpinner
              fullScreen
              message="AI is analyzing your plant..."
            />
          ) : (
            <>
              <ScanResult result={currentResult} />

              {/* Photo saved prompt */}
              {showPhotoPrompt && !isScanning && (
                <View className="px-4 mb-3">
                  <View style={questStyles.photoPromptCard}>
                    <Text style={questStyles.photoPromptEmoji}>📸</Text>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={questStyles.photoPromptTitle}>
                        Photo saved to collection!
                      </Text>
                      <Text style={questStyles.photoPromptSubtitle}>
                        +3 XP for capturing a plant photo
                      </Text>
                    </View>
                  </View>
                </View>
              )}

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

// ─── Quest Styles ───────────────────────────────────────────────────────────

const questStyles = StyleSheet.create({
  xpOverlay: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: "rgba(13, 40, 24, 0.85)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "flex-end",
  },
  xpText: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fbbf24",
  },
  xpSubtext: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  photoPromptCard: {
    backgroundColor: "#ecfdf5",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#a7f3d0",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  photoPromptEmoji: {
    fontSize: 28,
  },
  photoPromptTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#065f46",
  },
  photoPromptSubtitle: {
    fontSize: 12,
    color: "#047857",
    marginTop: 2,
  },
});

export default AiScannerScreen;
