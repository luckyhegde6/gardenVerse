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
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
}

export interface Garden {
  id: string;
  name: string;
  type: GardenType;
  soilQuality: number;
  irrigationLevel: number;
  sunlightExposure: number;
  crops: Crop[];
}

export enum GardenType {
  VIRTUAL = 'VIRTUAL',
  REAL = 'REAL',
  HYBRID = 'HYBRID',
}

export interface Crop {
  id: string;
  name: string;
  species?: string;
  status: CropStatus;
  growthStage: number;
  health: number;
  hydration: number;
  nutrientLevel: number;
  plantedAt: string;
  estimatedHarvest?: string;
  plotX?: number;
  plotY?: number;
}

export enum CropStatus {
  SEED = 'SEED',
  SPROUTING = 'SPROUTING',
  GROWING = 'GROWING',
  MATURE = 'MATURE',
  HARVESTED = 'HARVESTED',
  WILTED = 'WILTED',
  DISEASED = 'DISEASED',
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
  seller: { username: string; avatarUrl?: string };
  createdAt: string;
}

export enum ListingStatus {
  ACTIVE = 'ACTIVE',
  SOLD = 'SOLD',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
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
  temperature: number;
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

export interface AiScanResult {
  id: string;
  plantName?: string;
  species?: string;
  healthScore?: number;
  diseases?: string[];
  recommendations?: string[];
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

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  OTPVerify: { email: string };
};

export type MainTabParamList = {
  GardenTab: undefined;
  MarketplaceTab: undefined;
  CommunityTab: undefined;
  ScannerTab: undefined;
  ProfileTab: undefined;
};

export type GardenStackParamList = {
  GardenHome: undefined;
  CropDetail: { cropId: string };
  PlantCrop: { plotX?: number; plotY?: number };
  GardenSettings: undefined;
};

export type MarketplaceStackParamList = {
  MarketplaceHome: undefined;
  ListingDetail: { listingId: string };
  CreateListing: undefined;
  MyListings: undefined;
};

export type CommunityStackParamList = {
  CommunityHome: undefined;
  GroupDetail: { groupId: string };
  ChatScreen: { groupId?: string; receiverId?: string };
};

export type ProfileStackParamList = {
  ProfileHome: undefined;
  Settings: undefined;
  Achievements: undefined;
  Inventory: undefined;
  Invites: undefined;
};

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

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Weather: undefined;
  IotDashboard: undefined;
  AiScanner: undefined;
  NotificationCenter: undefined;
  GardenMap: undefined;
  PlantBrowser: undefined;
};
