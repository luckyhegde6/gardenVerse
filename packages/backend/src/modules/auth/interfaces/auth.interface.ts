export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface DeviceInfo {
  deviceId?: string;
  deviceType?: string;
  userAgent?: string;
  ipAddress?: string;
  trustScore?: number;
}
