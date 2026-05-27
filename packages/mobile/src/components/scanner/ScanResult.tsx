import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { AiScanResult } from '../../types';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';

interface ScanResultProps {
  result: AiScanResult;
}

export function ScanResult({ result }: ScanResultProps) {
  return (
    <ScrollView className="px-4" showsVerticalScrollIndicator={false}>
      <Card className="mb-4">
        <Text className="text-lg font-bold text-gray-900 mb-1">
          {result.plantName || 'Unknown Plant'}
        </Text>
        {result.species && (
          <Text className="text-sm text-gray-500 italic mb-3">{result.species}</Text>
        )}

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
                  ? '#22c55e'
                  : result.healthScore >= 40
                  ? '#f59e0b'
                  : '#ef4444'
              }
              height={10}
            />
          </View>
        )}
      </Card>

      {result.diseases && result.diseases.length > 0 && (
        <Card className="mb-4">
          <Text className="text-base font-semibold text-gray-900 mb-2">
            Detected Issues
          </Text>
          {result.diseases.map((disease, index) => (
            <View key={index} className="flex-row items-center mb-1.5">
              <Badge label="!" variant="error" size="sm" className="mr-2" />
              <Text className="text-sm text-gray-700">{disease}</Text>
            </View>
          ))}
        </Card>
      )}

      {result.recommendations && result.recommendations.length > 0 && (
        <Card className="mb-6">
          <Text className="text-base font-semibold text-gray-900 mb-2">
            Recommendations
          </Text>
          {result.recommendations.map((rec, index) => (
            <View key={index} className="flex-row items-start mb-2">
              <Text className="text-primary-600 font-bold mr-2">{index + 1}.</Text>
              <Text className="text-sm text-gray-700 flex-1">{rec}</Text>
            </View>
          ))}
        </Card>
      )}
    </ScrollView>
  );
}
