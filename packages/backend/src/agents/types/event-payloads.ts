export interface GameplayCropPlantedPayload {
  cropId: string;
  userId: string;
  gardenId: string;
  species: string;
  plantedAt: string;
  plotX?: number;
  plotY?: number;
}

export interface GameplayCropWateredPayload {
  cropId: string;
  userId: string;
  hydrationLevel: number;
  wateredAt: string;
}

export interface GameplayCropFertilizedPayload {
  cropId: string;
  userId: string;
  fertilizerType: string;
  nutrientLevel: number;
}

export interface GameplayCropHarvestedPayload {
  cropId: string;
  userId: string;
  yield: number;
  quality: number;
  harvestedAt: string;
}

export interface GameplayCropGrowthTickPayload {
  cropId: string;
  userId: string;
  newGrowthStage: number;
  newStatus: string;
  healthDelta: number;
  hydrationDelta: number;
  nutrientDelta: number;
  weatherImpactFactor: number;
  timestamp: string;
}

export interface GameplayXpAwardedPayload {
  userId: string;
  amount: number;
  reason: string;
  totalXp: number;
  levelBefore: number;
  levelAfter: number;
}

export interface GameplayRewardIssuedPayload {
  userId: string;
  rewardType: 'GREEN_CREDITS' | 'ECO_POINTS' | 'ITEM' | 'SEED';
  amount?: number;
  itemId?: string;
  reason: string;
}

export interface WeatherUpdatedPayload {
  region: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  sunlightHours: number;
  condition: string;
  forecast: unknown[];
  cropImpactFactor: number;
  timestamp: string;
}

export interface WeatherAlertPayload {
  region: string;
  alertType: 'HEATWAVE' | 'DROUGHT' | 'STORM' | 'FLOOD' | 'FROST';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  affectedCrops: string[];
  recommendedAction: string;
  issuedAt: string;
}

export interface SensorDataPayload {
  deviceId: string;
  userId: string;
  sensorType: string;
  value: number;
  unit: string;
  timestamp: string;
  trustScore: number;
}

export interface DeviceStatusPayload {
  deviceId: string;
  userId: string;
  isOnline: boolean;
  batteryLevel?: number;
  lastSeen: string;
}

export interface PlantIdentifiedPayload {
  scanId: string;
  userId: string;
  plantName: string;
  species: string;
  confidence: number;
  healthScore: number;
  imageUrl: string;
}

export interface DiseaseDetectedPayload {
  scanId: string;
  userId: string;
  cropId?: string;
  diseaseName: string;
  confidence: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  treatmentRecommendations: string[];
}

export interface TradeCompletePayload {
  transactionId: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  currency: string;
  timestamp: string;
}

export interface ModerationActionPayload {
  reportId: string;
  targetUserId: string;
  actionType: 'WARN' | 'SUSPEND' | 'BAN' | 'DISMISS';
  reason: string;
  duration?: string;
  actionedBy: string;
}

export interface RecommendationPayload {
  userId: string;
  type: string;
  title: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  actionable: boolean;
  actionData?: Record<string, unknown>;
  expiresAt?: string;
}
