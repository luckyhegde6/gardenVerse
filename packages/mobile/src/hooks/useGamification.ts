import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export interface DailyQuest {
  id: string;
  questKey: string;
  title: string;
  progress: number;
  targetCount: number;
  isCompleted: boolean;
  claimed: boolean;
  claimedAt?: string;
  xpReward: number;
  creditReward: number;
}

interface UseGamificationReturn {
  dailyQuests: DailyQuest[];
  loading: boolean;
  refreshQuests: () => Promise<void>;
  claimQuest: (questId: string) => Promise<void>;
}

export function useGamification(): UseGamificationReturn {
  const [dailyQuests, setDailyQuests] = useState<DailyQuest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuests = useCallback(async () => {
    try {
      setLoading(true);
      // Try to fetch from the real quests/user-progress endpoint
      const res = await api.get('/quests/user-progress');
      const allQuests = res.data?.grouped?.DAILY || res.data?.DAILY || [];
      if (allQuests.length > 0) {
        const mapped: DailyQuest[] = allQuests.map((q: any) => ({
          id: q.id || q.questId,
          questKey: q.key || q.questKey || '',
          title: q.title || '',
          progress: q.userProgress?.progress ?? q.progress ?? 0,
          targetCount: q.targetCount || 1,
          isCompleted: q.userProgress?.isCompleted ?? q.isCompleted ?? false,
          claimed: !!q.userProgress?.claimedAt || !!q.claimedAt,
          claimedAt: q.userProgress?.claimedAt || q.claimedAt,
          xpReward: q.xpReward || 50,
          creditReward: q.creditReward || 10,
        }));
        setDailyQuests(mapped);
        setLoading(false);
        return;
      }
    } catch {
      // API not available, use mock data
    }
    
    // Mock daily quests for development
    const mockQuests: DailyQuest[] = [
      {
        id: 'q1',
        questKey: 'water_crops',
        title: 'Water 5 crops',
        progress: 2,
        targetCount: 5,
        isCompleted: false,
        claimed: false,
        xpReward: 50,
        creditReward: 10,
      },
      {
        id: 'q2',
        questKey: 'harvest_crops',
        title: 'Harvest 2 mature crops',
        progress: 1,
        targetCount: 2,
        isCompleted: false,
        claimed: false,
        xpReward: 100,
        creditReward: 20,
      },
      {
        id: 'q3',
        questKey: 'plant_seeds',
        title: 'Plant 3 new seeds',
        progress: 0,
        targetCount: 3,
        isCompleted: false,
        claimed: false,
        xpReward: 75,
        creditReward: 15,
      },
      {
        id: 'q4',
        questKey: 'fertilize_crops',
        title: 'Fertilize 3 crops',
        progress: 1,
        targetCount: 3,
        isCompleted: false,
        claimed: false,
        xpReward: 60,
        creditReward: 10,
      },
    ];
    setDailyQuests(mockQuests);
    setLoading(false);
  }, []);

  const claimQuest = useCallback(async (questId: string) => {
    try {
      await api.post(`/quests/user-progress?claim=true`, { questId });
      // Refresh after claim
      fetchQuests();
    } catch {
      // If API fails, just update locally
      setDailyQuests(prev => prev.map(q => 
        q.id === questId ? { ...q, claimed: true, isCompleted: true } : q
      ));
    }
  }, []);

  useEffect(() => {
    fetchQuests();
  }, [fetchQuests]);

  return {
    dailyQuests,
    loading,
    refreshQuests: fetchQuests,
    claimQuest,
  };
}