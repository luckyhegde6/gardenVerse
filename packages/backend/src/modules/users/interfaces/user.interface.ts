export interface UserProfile {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  role: string;
  isVerified: boolean;
  isOnboarded: boolean;
  region: string | null;
  createdAt: Date;
}

export interface UserStats {
  level: number;
  experience: number;
  currentStreak: number;
  longestStreak: number;
  greenCredits: number;
  ecoPoints: number;
  reputationTokens: number;
  sustainabilityScore: number;
  trustScore: number;
  marketplaceReliability: number;
  communityStanding: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  level: number;
  experience: number;
  sustainabilityScore: number;
}
