import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { Platform } from "react-native";
import { getItem, setItem, removeItem, StorageKeys } from "@services/storage";
import { logger } from "@services/logger";

const LOCAL_API_URL =
  Platform.OS === "android"
    ? "http://localhost:3000/api/v1"
    : "http://localhost:3000/api/v1";

const BASE_URL = process.env.API_URL || LOCAL_API_URL;

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}[] = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
}

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (__DEV__) {
      const url = config.url || '';
      const method = (config.method?.toUpperCase() || 'GET') as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      logger.info('[API] ' + method + ' ' + url, { source: 'api', context: 'request' });
      const logs = ((globalThis as any).__DEBUG_API_LOGS || []) as { url: string; method: string; status: number; timestamp: string }[];
      logs.push({ url, method, status: 0, timestamp: new Date().toLocaleTimeString() });
      if (logs.length > 100) logs.shift();
      (globalThis as any).__DEBUG_API_LOGS = logs;
    }

    const token = await getItem(StorageKeys.ACCESS_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => {
    if (__DEV__) {
      logger.error('[API] Request error: ' + (error.message || 'unknown'), { source: 'api', context: 'request', metadata: { url: error.config?.url } });
    }
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response: AxiosResponse) => {
    if (__DEV__) {
      const url = response.config.url || '';
      const method = (response.config.method?.toUpperCase() || 'GET') as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      const status = response.status;
      logger.info('[API] ' + status + ' ' + method + ' ' + url, { source: 'api', context: 'response' });
      const logs = ((globalThis as any).__DEBUG_API_LOGS || []) as { url: string; method: string; status: number; timestamp: string }[];
      logs.push({ url, method, status, timestamp: new Date().toLocaleTimeString() });
      if (logs.length > 100) logs.shift();
      (globalThis as any).__DEBUG_API_LOGS = logs;
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const isAuthEndpoint = originalRequest.url?.startsWith('/auth/')
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getItem(StorageKeys.REFRESH_TOKEN);
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const response = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        });
        const { accessToken, refreshToken: newRefreshToken } = response.data;

        await setItem(StorageKeys.ACCESS_TOKEN, accessToken);
        await setItem(StorageKeys.REFRESH_TOKEN, newRefreshToken);

        processQueue(null, accessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await removeItem(StorageKeys.ACCESS_TOKEN);
        await removeItem(StorageKeys.REFRESH_TOKEN);
        await removeItem(StorageKeys.USER_DATA);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (__DEV__) {
      const status = error.response?.status || 0;
      const url = error.config?.url || '';
      const method = (error.config?.method?.toUpperCase() || 'GET') as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      logger.error('[API] Error ' + status + ' ' + method + ' ' + url, { source: 'api', context: 'error', metadata: { data: error.response?.data as Record<string, unknown> | undefined } });
      const logs = ((globalThis as any).__DEBUG_API_LOGS || []) as { url: string; method: string; status: number; timestamp: string }[];
      logs.push({ url, method, status, timestamp: new Date().toLocaleTimeString() });
      if (logs.length > 100) logs.shift();
      (globalThis as any).__DEBUG_API_LOGS = logs;
    }

    return Promise.reject(error);
  },
);

export default api;
