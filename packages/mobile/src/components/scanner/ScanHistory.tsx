import React from "react";
import { View, Text, FlatList } from "react-native";
import { AiScanResult } from "../../types";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { formatRelativeTime } from "../../utils/formatting";

interface ScanHistoryProps {
  scans: AiScanResult[];
  onScanPress?: (scan: AiScanResult) => void;
}

export function ScanHistory({ scans, onScanPress }: ScanHistoryProps) {
  if (scans.length === 0) {
    return (
      <View className="items-center py-8">
        <Text className="text-3xl mb-2">🔍</Text>
        <Text className="text-sm text-gray-500">No scan history yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={scans}
      keyExtractor={(item: AiScanResult) => item.id}
      renderItem={({ item }: { item: AiScanResult }) => (
        <Card className="mb-2" onPress={() => onScanPress?.(item)}>
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-sm font-semibold text-gray-900">
                {item.plantName || "Unknown Plant"}
              </Text>
              {item.species && (
                <Text className="text-xs text-gray-500">{item.species}</Text>
              )}
            </View>
            <View className="items-end">
              {item.healthScore !== undefined && (
                <Badge
                  label={`${item.healthScore}%`}
                  variant={
                    item.healthScore >= 70
                      ? "success"
                      : item.healthScore >= 40
                        ? "warning"
                        : "error"
                  }
                  size="sm"
                />
              )}
              <Text className="text-xs text-gray-400 mt-1">
                {formatRelativeTime(item.id)}
              </Text>
            </View>
          </View>
        </Card>
      )}
      showsVerticalScrollIndicator={false}
    />
  );
}
