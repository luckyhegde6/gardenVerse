export interface User {
  id: string;
  email?: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  level: number;
  experience: number;
  greenCredits: number;
  ecoPoints: number;
  sustainabilityScore: number;
  trustScore: number;
  currentStreak: number;
  role: UserRole;
}

export enum UserRole {
  USER = "USER",
  MODERATOR = "MODERATOR",
  ADMIN = "ADMIN",
}

export interface Garden {
  id: string;
  name: string;
  type: GardenType;
  soilQuality: number;
  irrigationLevel: number;
  sunlightExposure: number;
  crops: Crop[];
  latitude?: number;
  longitude?: number;
  address?: string;
  timezone?: string;
  gridWidth?: number;
  gridHeight?: number;
  irrigationType?: string;
  wateringMode?: string;
  hasMotorPump?: boolean;
}

export enum GardenType {
  VIRTUAL = "VIRTUAL",
  REAL = "REAL",
  HYBRID = "HYBRID",
}

export interface Crop {
  id: string;
  name: string;
  species?: string;
  speciesId?: string;
  status: CropStatus;
  growthStage: number;
  health: number;
  hydration: number;
  nutrientLevel: number;
  plantedAt: string;
  estimatedHarvest?: string;
  plotX?: number;
  plotY?: number;
  /** Number of consecutive days with care actions */
  careStreak: number;
  /** Total number of care actions performed */
  totalCareCount: number;
  /** Number of times harvested (used for mastery calculation) */
  harvestCount?: number;
  /** ISO timestamp of last watering */
  lastWateredAt?: string;
  /** ISO timestamp of last fertilizing */
  lastFertilizedAt?: string;
}

export enum CropStatus {
  SEED = "SEED",
  SPROUTING = "SPROUTING",
  GROWING = "GROWING",
  MATURE = "MATURE",
  HARVESTED = "HARVESTED",
  WILTED = "WILTED",
  DISEASED = "DISEASED",
}

export interface MarketplaceListing {
  id: string;
  title: string;
  description?: string;
  category: string;
  price: number;
  currency: string;
  quantity: number;
  status: ListingStatus;
  images?: string[];
  location?: string;
  isLocal?: boolean;
  seller: {
    id?: string;
    username: string;
    displayName?: string;
    avatarUrl?: string;
    marketplaceReliability?: number;
  };
  createdAt: string;
}

export enum ListingStatus {
  ACTIVE = "ACTIVE",
  SOLD = "SOLD",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  rainfall: number;
  condition: string;
  forecast: WeatherForecast[];
}

export interface WeatherForecast {
  date: string;
  temperature: number | { min: number; max: number };
  humidity: number;
  condition: string;
}

export interface IotDevice {
  id: string;
  name: string;
  deviceType: string;
  isOnline: boolean;
  lastSeenAt?: string;
}

export interface SensorReading {
  id: string;
  sensorType: string;
  value: number;
  unit: string;
  timestamp: string;
}

export interface DiseaseEntry {
  name?: string;
  disease?: string;
  probability?: number;
  confidence?: number;
  treatment?: string;
}

export interface SourceCitation {
  source: string;
  field: string;
  value: string;
}

export interface AiScanResult {
  id: string;
  plantName?: string;
  species?: string;
  healthScore?: number;
  diseases?: (string | DiseaseEntry)[];
  recommendations?: string[];
  confidence?: 'high' | 'medium' | 'low';
  uncertainty?: 'low' | 'moderate' | 'high';
  uncertaintyReason?: string;
  analysisDisclaimer?: string;
  sourceCitations?: SourceCitation[];
}

export interface GovernmentAdvisory {
  id: string;
  title: string;
  description: string;
  type: string;
  region: string;
  publishedAt: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId?: string;
  groupId?: string;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  type: string;
  region?: string;
  memberCount: number;
}

export interface Invite {
  id: string;
  code: string;
  maxUses: number;
  useCount: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface AuthStackParamList {
   [key: string]: undefined | object;
   Login: undefined;
   Register: undefined;
   ForgotPassword: undefined;
   OTPVerify: { email: string };
 }

export interface MainTabParamList {
   [key: string]: undefined | object;
   GardenTab: undefined;
   MarketplaceTab: undefined;
   CommunityTab: undefined;
   ScannerTab: undefined;
   ProfileTab: undefined;
 }

export interface GardenStackParamList {
   [key: string]: undefined | object;
   GardenHome: undefined;
   CropDetail: { cropId: string };
   PlantCrop: { plotX?: number; plotY?: number };
   GardenSettings: undefined;
 }

export interface MarketplaceStackParamList {
   [key: string]: undefined | object;
   MarketplaceHome: undefined;
   ListingDetail: { listingId: string };
   CreateListing: undefined;
   MyListings: undefined;
 }

export interface CommunityStackParamList {
   [key: string]: undefined | object;
   CommunityHome: undefined;
   GroupDetail: { groupId: string };
   ChatScreen: { groupId?: string; receiverId?: string };
 }

export interface ProfileStackParamList {
   [key: string]: undefined | object;
   ProfileHome: undefined;
   Settings: undefined;
   Achievements: undefined;
   Inventory: undefined;
   Invites: undefined;
   DailyRewards: undefined;
   Quests: undefined;
 }

export interface PlantSpecies {
  id: string;
  commonName: string;
  scientificName: string;
  family?: string;
  imageUrl?: string;
  description?: string;
  growingDays?: number;
  difficulty: string;
  waterNeeds: string;
  sunlightNeeds: string;
  seasons: string[];
  edible: boolean;
  tags: string[];
}

export interface GardenPlan {
  id: string;
  name: string;
  description?: string;
  difficulty: string;
  gridWidth: number;
  gridHeight: number;
  season?: string;
  plants: GardenPlanPlant[];
}

export interface GardenPlanPlant {
  id: string;
  plotX: number;
  plotY: number;
  quantity: number;
  species: PlantSpecies;
}

export interface NearbyGardener {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  latitude?: number;
  longitude?: number;
  sustainabilityScore: number;
}

export interface PlantCollectionData {
  id: string;
  speciesId: string;
  speciesName: string;
  discoveredAt: string;
  timesPlanted: number;
  timesHarvested: number;
}

export interface SpeciesMasteryData {
  id: string;
  speciesId: string;
  speciesName: string;
  level: number;
  experience: number;
  plantCount: number;
  harvestCount: number;
  totalForNextLevel: number;
  perfectedAt: string | null;
}

export interface CollectionStats {
  discovered: number;
  total: number;
  completion: number;
}

export interface PlantHybridData {
  id: string;
  parent1Name: string;
  parent2Name: string;
  resultName: string;
  discoveredAt: string;
}

export interface QuestProgress {
  questId: string
  questKey: string
  progress: number
  targetCount: number
  isCompleted: boolean
  claimed: boolean
  claimedAt?: string
}

export interface CollectionEntry {
  speciesId: string
  discoveredAt: string
  timesPlanted: number
  timesHarvested: number
}

export interface IdentifiedPlantPhoto {
  id: string
  speciesId: string
  speciesName: string
  imageUrl: string
  confidence: number
  latitude?: number
  longitude?: number
  capturedAt: string
  xpAwarded: number
  usedForTraining: boolean
}

export interface RootStackParamList {
   [key: string]: undefined | object;
   Auth: undefined;
   Main: undefined;
   Weather: undefined;
   IotDashboard: undefined;
   AiScanner: undefined;
   NotificationCenter: undefined;
   GardenMap: undefined;
   PlantBrowser: undefined;
 }
