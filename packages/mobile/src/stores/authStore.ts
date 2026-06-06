import { create } from "zustand";
import { User } from "../types";
import AuthService, { LoginRequest, RegisterRequest } from "../services/auth";
import { getItem, setItem, removeItem, StorageKeys } from "../services/storage";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  registeredEmail: string | null;

  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
  updateProfile: (
    data: Partial<Pick<User, "displayName" | "avatarUrl">>,
  ) => Promise<void>;
  clearError: () => void;
  clearRegisteredEmail: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
  registeredEmail: null,

  login: async (data: LoginRequest) => {
    set({ isLoading: true, error: null });
    try {
      const response = await AuthService.login(data);
      await setItem(StorageKeys.ACCESS_TOKEN, response.accessToken);
      await setItem(StorageKeys.REFRESH_TOKEN, response.refreshToken);
      await setItem(StorageKeys.USER_DATA, JSON.stringify(response.user));
      set({
        user: response.user,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || "Login failed";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  register: async (data: RegisterRequest) => {
    set({ isLoading: true, error: null });
    try {
      await AuthService.register(data);
      set({
        registeredEmail: data.email,
        isLoading: false,
      });
    } catch (error: any) {
      const message =
        error.response?.data?.message || error.message || "Registration failed";
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await AuthService.logout();
    } catch {
      // Silently fail server-side logout
    }
    await removeItem(StorageKeys.ACCESS_TOKEN);
    await removeItem(StorageKeys.REFRESH_TOKEN);
    await removeItem(StorageKeys.USER_DATA);
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  loadStoredAuth: async () => {
    try {
      const accessToken = await getItem(StorageKeys.ACCESS_TOKEN);
      const refreshToken = await getItem(StorageKeys.REFRESH_TOKEN);
      const userData = await getItem(StorageKeys.USER_DATA);

      if (accessToken && userData) {
        try {
          const user = JSON.parse(userData) as User;
          const freshProfile = await AuthService.getProfile();
          await setItem(StorageKeys.USER_DATA, JSON.stringify(freshProfile));
          set({
            user: freshProfile,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          const user = JSON.parse(userData) as User;
          set({
            user,
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        }
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  updateProfile: async (
    data: Partial<Pick<User, "displayName" | "avatarUrl">>,
  ) => {
    const currentUser = get().user;
    if (!currentUser) return;

    try {
      const updatedUser = await AuthService.updateProfile(data);
      await setItem(StorageKeys.USER_DATA, JSON.stringify(updatedUser));
      set({ user: updatedUser });
    } catch (error: any) {
      set({ error: error.message || "Profile update failed" });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  clearRegisteredEmail: () => set({ registeredEmail: null }),
}));
