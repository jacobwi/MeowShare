import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosError,
} from "axios";
import debugInterceptor from "../utils/DebugInterceptor";
import authService from "./auth";

// Extend InternalAxiosRequestConfig to include _retry property
declare module "axios" {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://localhost:7222/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Set the API instance in the debug interceptor
debugInterceptor.setApiInstance(api);

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token
        const user = await authService.refreshToken();
        if (user) {
          // Retry the original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
      }

      // If refresh failed or no refresh token available, clear auth and let routing handle it
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      localStorage.removeItem("tokenExpiry");
    }

    return Promise.reject(error);
  },
);

// Function to initialize debug interceptor
export const initializeDebugInterceptor = (isDebugEnabled: () => boolean) => {
  // console.log("[API] Initializing debug interceptor");
  debugInterceptor.setDebugModeCallback(isDebugEnabled);
};

export default api;
