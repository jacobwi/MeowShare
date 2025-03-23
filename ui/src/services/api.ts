import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosError,
} from "axios";
import debugInterceptor from "../utils/DebugInterceptor";

// Create axios instance with default config
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
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
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Just remove the token and let the routing system handle redirects
      localStorage.removeItem("token");
      // Do not redirect here - let the ProtectedRoute component handle that
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
