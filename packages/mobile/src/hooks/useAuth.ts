import { useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import { LoginRequest, RegisterRequest } from '../services/auth';

export function useAuth() {
  const {
    user,
    isLoading,
    isAuthenticated,
    error,
    login,
    register,
    logout,
    loadStoredAuth,
    updateProfile,
    clearError,
  } = useAuthStore();

  const handleLogin = useCallback(
    async (data: LoginRequest) => {
      await login(data);
    },
    [login]
  );

  const handleRegister = useCallback(
    async (data: RegisterRequest) => {
      await register(data);
    },
    [register]
  );

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  const handleUpdateProfile = useCallback(
    async (data: { displayName?: string; avatarUrl?: string }) => {
      await updateProfile(data);
    },
    [updateProfile]
  );

  return {
    user,
    isLoading,
    isAuthenticated,
    error,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    loadStoredAuth,
    updateProfile: handleUpdateProfile,
    clearError,
  };
}
