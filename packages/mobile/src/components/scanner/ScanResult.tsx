import React from "react";
import { View, Text, ScrollView } from "react-native";
import { AiScanResult } from "../../types";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { ProgressBar } from "../ui/ProgressBar";

interface ScanResultProps {
  result: AiScanResult;
}

function getUncertaintyBadge(uncertainty?: string) {
  switch (uncertainty) {
    case "high":
      return { label: "Low Confidence", variant: "error" as const };
    case "moderate":
      return { label: "Moderate Confidence", variant: "warning" as const };
    default:
      return { label: "High Confidence", variant: "success" as const };
  }
}

export function ScanResult({ result }: ScanResultProps) {
  const uncertaintyInfo = getUncertaintyBadge(result.uncertainty);

  return (
    <ScrollView className="px-4" showsVerticalScrollIndicator={false}>
      {/* Disclaimer Banner */}
      {result.analysisDisclaimer && (
        <Card className="mb-4 bg-amber-50 border border-amber-200">
          <Text className="text-xs text-amber-700 italic">
            {result.analysisDisclaimer}
          </Text>
        </Card>
      )}

      <Card className="mb-4">
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900 mb-1">
              {result.plantName || "Unknown Plant"}
            </Text>
            {result.species && (
              <Text className="text-sm text-gray-500 italic mb-3">
                {result.species}
              </Text>
            )}
          </View>
          {result.uncertainty && (
            <Badge
              label={uncertaintyInfo.label}
              variant={uncertaintyInfo.variant}
              size="sm"
            />
          )}
        </View>

        {result.healthScore !== undefined && (
          <View className="mb-3">
            <View className="flex-row justify-between mb-1">
              <Text className="text-sm text-gray-600">Health Score</Text>
              <Text className="text-sm font-semibold text-gray-900">
                {result.healthScore}/100
              </Text>
            </View>
            <ProgressBar
              value={result.healthScore}
              color={
                result.healthScore >= 70
                  ? "#22c55e"
                  : result.healthScore >= 40
                    ? "#f59e0b"
                    : "#ef4444"
              }
              height={10}
            />
          </View>
        )}
      </Card>

      {result.uncertaintyReason && (
        <Card className="mb-4 bg-gray-50">
          <Text className="text-xs text-gray-500">
            {result.uncertaintyReason}
          </Text>
        </Card>
      )}

      {result.diseases && result.diseases.length > 0 && (
        <Card className="mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">
            Detected Issues
          </Text>
          {result.diseases.map((disease, index) => {
            const diseaseName = typeof disease === "string" ? disease : disease.name || disease.disease || "Unknown";
            const diseaseProb = typeof disease === "object" && disease.probability != null
              ? Math.round(disease.probability * 100) : null;
            return (
              <View key={index} className="mb-2">
                <View className="flex-row items-center mb-0.5">
                  <Badge label="!" variant="error" size="sm" className="mr-2" />
                  <Text className="text-sm text-gray-700">{diseaseName}</Text>
                </View>
                {diseaseProb != null && (
                  <Text className="text-xs text-gray-400 ml-7">
                    Match probability: {diseaseProb}%
                  </Text>
                )}
              </View>
            );
          })}
        </Card>
      )}

      {result.recommendations && result.recommendations.length > 0 && (
        <Card className="mb-6">
          <Text className="text-base font-semibold text-gray-900 mb-2">
            Recommendations
          </Text>
          {result.recommendations.map((rec, index) => (
            <View key={index} className="flex-row items-start mb-2">
              <Text className="text-primary-600 font-bold mr-2">
                {index + 1}.
              </Text>
              <Text className="text-sm text-gray-700 flex-1">{rec}</Text>
            </View>
          ))}
        </Card>
      )}

      {/* Source Citations */}
      {result.sourceCitations && result.sourceCitations.length > 0 && (
        <Card className="mb-4 bg-gray-50">
          <Text className="text-xs font-semibold text-gray-500 mb-1">
            Analysis Sources
          </Text>
          {result.sourceCitations.map((citation, index) => (
            <Text key={index} className="text-xs text-gray-400 mb-0.5">
              {citation.source} › {citation.field}: "{citation.value.slice(0, 80)}{citation.value.length > 80 ? "..." : ""}"
            </Text>
          ))}
        </Card>
      )}

      {/* Uncertainty reason when low confidence */}
      {result.uncertainty === "high" && !result.uncertaintyReason && (
        <Card className="mb-4 bg-red-50 border border-red-200">
          <Text className="text-xs text-red-600">
            This analysis has low confidence. Results may not be accurate. Consider consulting a plant expert.
          </Text>
        </Card>
      )}
    </ScrollView>
  );
}
