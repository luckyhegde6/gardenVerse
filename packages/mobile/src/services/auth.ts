import api from "./api";
import { User } from "../types";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  inviteCode?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface OTPVerifyRequest {
  email: string;
  otp: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
}

const AuthService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/login", data);
    return response.data;
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/register", data);
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post("/auth/logout");
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/refresh", {
      refreshToken,
    });
    return response.data;
  },

  async verifyOTP(data: OTPVerifyRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>("/auth/verify-otp", data);
    return response.data;
  },

  async requestPasswordReset(data: PasswordResetRequest): Promise<void> {
    await api.post("/auth/forgot-password", data);
  },

  async resetPassword(data: PasswordResetConfirm): Promise<void> {
    await api.post("/auth/reset-password", data);
  },

  async getProfile(): Promise<User> {
    const response = await api.get<User>("/auth/profile");
    return response.data;
  },

  async updateProfile(
    data: Partial<Pick<User, "displayName" | "avatarUrl">>,
  ): Promise<User> {
    const response = await api.patch<User>("/auth/profile", data);
    return response.data;
  },
};

export default AuthService;
