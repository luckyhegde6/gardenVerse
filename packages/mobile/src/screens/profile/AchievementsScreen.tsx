import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ProgressBar } from '../../components/ui/ProgressBar';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: string;
  xpReward: number;
}

const MOCK_ACHIEVEMENTS: Achievement[] = [
  {
    id: '1',
    title: 'Green Thumb',
    description: 'Plant your first crop',
    icon: '🌱',
    progress: 1,
    maxProgress: 1,
    unlocked: true,
    xpReward: 100,
  },
  {
    id: '2',
    title: 'Master Farmer',
    description: 'Harvest 100 crops',
    icon: '🌾',
    progress: 45,
    maxProgress: 100,
    unlocked: false,
    xpReward: 500,
  },
  {
    id: '3',
    title: 'Water Wizard',
    description: 'Water crops 500 times',
    icon: '💧',
    progress: 234,
    maxProgress: 500,
    unlocked: false,
    xpReward: 300,
  },
  {
    id: '4',
    title: 'Eco Champion',
    description: 'Achieve 1000 sustainability score',
    icon: '♻️',
    progress: 750,
    maxProgress: 1000,
    unlocked: false,
    xpReward: 1000,
  },
  {
    id: '5',
    title: 'Social Gardener',
    description: 'Join 5 community groups',
    icon: '👥',
    progress: 3,
    maxProgress: 5,
    unlocked: false,
    xpReward: 200,
  },
  {
    id: '6',
    title: 'Streak Master',
    description: 'Maintain a 30-day login streak',
    icon: '🔥',
    progress: 12,
    maxProgress: 30,
    unlocked: false,
    xpReward: 750,
  },
  {
    id: '7',
    title: 'Seed Collector',
    description: 'Collect 20 different seed types',
    icon: '🌰',
    progress: 14,
    maxProgress: 20,
    unlocked: false,
    xpReward: 400,
  },
  {
    id: '8',
    title: 'IoT Pioneer',
    description: 'Connect 5 IoT devices',
    icon: '📡',
    progress: 2,
    maxProgress: 5,
    unlocked: false,
    xpReward: 300,
  },
];

export function AchievementsScreen() {
  const unlocked = MOCK_ACHIEVEMENTS.filter((a) => a.unlocked);
  const inProgress = MOCK_ACHIEVEMENTS.filter((a) => !a.unlocked);

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      showsVerticalScrollIndicator={false}
    >
      <View className="px-4 py-4">
        {/* Summary */}
        <Card className="mb-4 items-center py-6 bg-primary-800">
          <Text className="text-4xl mb-2">🏆</Text>
          <Text className="text-white text-2xl font-bold">
            {unlocked.length}/{MOCK_ACHIEVEMENTS.length}
          </Text>
          <Text className="text-primary-200 text-sm">Achievements Unlocked</Text>
          <Text className="text-white/60 text-xs mt-2">
            {MOCK_ACHIEVEMENTS.reduce((s, a) => s + a.xpReward, 0).toLocaleString()}{' '}
            Total XP Available
          </Text>
        </Card>

        {/* Recently Unlocked */}
        {unlocked.length > 0 && (
          <View className="mb-4">
            <Text className="text-base font-bold text-gray-900 mb-3">
              Recently Unlocked
            </Text>
            {unlocked.slice(0, 3).map((achievement) => (
              <Card
                key={achievement.id}
                className="flex-row items-center mb-2 bg-green-50 border border-green-200"
              >
                <Text className="text-3xl mr-3">{achievement.icon}</Text>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-gray-900">
                    {achievement.title}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    {achievement.description}
                  </Text>
                </View>
                <Badge label={`+${achievement.xpReward}XP`} variant="success" size="sm" />
              </Card>
            ))}
          </View>
        )}

        {/* In Progress */}
        <Text className="text-base font-bold text-gray-900 mb-3">
          In Progress
        </Text>
        {inProgress.map((achievement) => (
          <Card key={achievement.id} className="mb-3">
            <View className="flex-row items-start">
              <Text className="text-2xl mr-3">{achievement.icon}</Text>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-900">
                  {achievement.title}
                </Text>
                <Text className="text-xs text-gray-500 mb-2">
                  {achievement.description}
                </Text>
                <ProgressBar
                  value={achievement.progress}
                  maxValue={achievement.maxProgress}
                  height={6}
                  showLabel
                  labelPosition="right"
                />
                <View className="flex-row justify-between mt-1">
                  <Text className="text-xs text-gray-400">
                    {achievement.progress}/{achievement.maxProgress}
                  </Text>
                  <Text className="text-xs text-amber-600">
                    +{achievement.xpReward} XP
                  </Text>
                </View>
              </View>
            </View>
          </Card>
        ))}

        <View className="h-8" />
      </View>
    </ScrollView>
  );
}
