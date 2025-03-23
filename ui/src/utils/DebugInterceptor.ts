import {
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosInstance,
  AxiosError,
} from "axios";

export interface RequestLog {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  requestHeaders: Record<string, string>;
  requestData?: unknown;
  responseHeaders?: Record<string, string>;
  responseData?: unknown;
  status?: number;
  error?: Error | string;
  duration?: number;
  isError: boolean;
}

class DebugInterceptor {
  private logs: RequestLog[] = [];
  private enabled: boolean = false;
  private requestInterceptorId: number | null = null;
  private responseInterceptorId: number | null = null;
  private startTimes: Record<string, number> = {};
  private debugModeCallback: (() => boolean) | null = null;
  private apiInstance: AxiosInstance | null = null;

  constructor() {
    // Initialize with environment variable if available
    this.enabled = import.meta.env.VITE_DEBUG_MODE === "true";
  }

  // Set the API instance to intercept
  public setApiInstance(instance: AxiosInstance): void {
    console.log("[DebugInterceptor] Setting API instance");
    this.apiInstance = instance;
    if (this.isDebugEnabled()) {
      this.setupInterceptors();
    }
  }

  // Set debug mode callback
  public setDebugModeCallback(callback: () => boolean): void {
    this.debugModeCallback = callback;
    const isEnabled = callback();

    if (isEnabled && this.apiInstance) {
      this.setupInterceptors();
    } else {
      this.removeInterceptors();
    }
  }

  // Check if debug mode is enabled
  public isDebugEnabled(): boolean {
    return this.debugModeCallback ? this.debugModeCallback() : this.enabled;
  }

  // Set up axios interceptors for both request and response
  private setupInterceptors() {
    if (!this.apiInstance) {
      console.error("[DebugInterceptor] No API instance set");
      return;
    }

    console.log("[DebugInterceptor] Setting up interceptors");

    // Remove any existing interceptors first
    this.removeInterceptors();

    // Set up request interceptor
    this.requestInterceptorId = this.apiInstance.interceptors.request.use(
      (config) => {
        console.log("[DebugInterceptor] Intercepting request:", config.url);
        return this.handleRequest(config);
      },
      (error) => {
        console.log("[DebugInterceptor] Request error:", error);
        return this.handleRequestError(error);
      },
    );

    // Set up response interceptor
    this.responseInterceptorId = this.apiInstance.interceptors.response.use(
      (response) => {
        console.log(
          "[DebugInterceptor] Intercepting response:",
          response.config.url,
        );
        return this.handleResponse(response);
      },
      (error) => {
        console.log("[DebugInterceptor] Response error:", error);
        return this.handleResponseError(error);
      },
    );

    console.log("[DebugInterceptor] Interceptors set up successfully");
  }

  // Remove axios interceptors
  private removeInterceptors() {
    if (!this.apiInstance) return;

    if (this.requestInterceptorId !== null) {
      this.apiInstance.interceptors.request.eject(this.requestInterceptorId);
      this.requestInterceptorId = null;
    }

    if (this.responseInterceptorId !== null) {
      this.apiInstance.interceptors.response.eject(this.responseInterceptorId);
      this.responseInterceptorId = null;
    }

    // console.log("[DebugInterceptor] Interceptors removed");
  }

  // Handle outgoing requests
  private handleRequest(
    config: InternalAxiosRequestConfig,
  ): InternalAxiosRequestConfig {
    if (!this.isDebugEnabled()) {
      console.log(
        "[DebugInterceptor] Debug mode disabled, skipping request logging",
      );
      return config;
    }

    try {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log(
        "[DebugInterceptor] Creating request log with ID:",
        requestId,
      );

      // Store start time for duration calculation
      this.startTimes[requestId] = performance.now();

      // Clone headers to a plain object
      const headers: Record<string, string> = {};
      if (config.headers) {
        Object.entries(config.headers).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            headers[key] = value.toString();
          }
        });
      }

      // Create initial log entry
      const log: RequestLog = {
        id: requestId,
        timestamp: new Date().toISOString(),
        method: config.method?.toUpperCase() || "GET",
        url: config.baseURL
          ? `${config.baseURL}${config.url}`
          : config.url || "",
        requestHeaders: this.sanitizeHeaders(headers),
        requestData: this.sanitizeData(config.data),
        isError: false,
      };

      this.logs.unshift(log);

      // Set requestId in the request to match it with its response
      config.headers = config.headers || {};
      config.headers["X-Debug-Request-Id"] = requestId;

      console.log(
        `[DebugInterceptor] Request logged: ${log.method} ${log.url}`,
      );
    } catch (err) {
      console.error("[DebugInterceptor] Error in request interceptor:", err);
    }

    return config;
  }

  // Handle request errors
  private handleRequestError(error: AxiosError): Promise<never> {
    if (this.isDebugEnabled()) {
      console.error("[DebugInterceptor] Request error:", error);
    }
    return Promise.reject(error);
  }

  // Handle successful responses
  private handleResponse(response: AxiosResponse): AxiosResponse {
    if (!this.isDebugEnabled()) return response;

    try {
      const requestId = response.config.headers?.[
        "X-Debug-Request-Id"
      ] as string;

      if (requestId) {
        const duration = this.calculateDuration(requestId);
        const existingLogIndex = this.logs.findIndex(
          (log) => log.id === requestId,
        );

        if (existingLogIndex !== -1) {
          // Clone headers to a plain object
          const headers: Record<string, string> = {};
          Object.entries(response.headers).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              headers[key] = String(value);
            }
          });

          // Update the existing log with response data
          this.logs[existingLogIndex] = {
            ...this.logs[existingLogIndex],
            responseHeaders: this.sanitizeHeaders(headers),
            responseData: this.sanitizeData(response.data),
            status: response.status,
            duration,
          };

          console.log(
            `[DebugInterceptor] Response: ${response.status} ${response.config.method?.toUpperCase() || "GET"} ${response.config.url} (${duration.toFixed(2)}ms)`,
          );
        }
      }
    } catch (err) {
      console.error("[DebugInterceptor] Error in response interceptor:", err);
    }

    return response;
  }

  // Handle response errors
  private handleResponseError(error: AxiosError): Promise<never> {
    if (!this.isDebugEnabled()) return Promise.reject(error);

    try {
      if (error.config) {
        const requestId = error.config.headers?.[
          "X-Debug-Request-Id"
        ] as string;

        if (requestId) {
          const duration = this.calculateDuration(requestId);
          const existingLogIndex = this.logs.findIndex(
            (log) => log.id === requestId,
          );

          if (existingLogIndex !== -1) {
            // Clone headers to a plain object
            const headers: Record<string, string> = {};
            if (error.response?.headers) {
              Object.entries(error.response.headers).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                  headers[key] = String(value);
                }
              });
            }

            // Create a proper Error object
            const errorObj = new Error(error.message);
            errorObj.stack = error.stack;

            // Update the log with error information
            this.logs[existingLogIndex] = {
              ...this.logs[existingLogIndex],
              status: error.response?.status,
              responseHeaders: error.response
                ? this.sanitizeHeaders(headers)
                : undefined,
              responseData: error.response
                ? this.sanitizeData(error.response.data)
                : undefined,
              error: errorObj,
              duration,
              isError: true,
            };

            console.error(
              `[DebugInterceptor] Error: ${error.response?.status || "Network Error"} ${error.config.method?.toUpperCase() || "GET"} ${error.config.url} (${duration.toFixed(2)}ms)`,
              error.message,
            );
          }
        }
      }
    } catch (err) {
      console.error(
        "[DebugInterceptor] Error in response error interceptor:",
        err,
      );
    }

    return Promise.reject(error);
  }

  // Calculate request duration
  private calculateDuration(requestId: string): number {
    const startTime = this.startTimes[requestId];
    const duration = startTime ? performance.now() - startTime : 0;

    // Clean up
    delete this.startTimes[requestId];

    return duration;
  }

  // Sanitize headers to remove sensitive information
  private sanitizeHeaders(
    headers: Record<string, string>,
  ): Record<string, string> {
    const sanitized: Record<string, string> = {};
    Object.entries(headers).forEach(([key, value]) => {
      // Skip sensitive headers
      if (
        key.toLowerCase().includes("authorization") ||
        key.toLowerCase().includes("cookie") ||
        key.toLowerCase().includes("password")
      ) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = value;
      }
    });
    return sanitized;
  }

  // Sanitize data to remove sensitive information
  private sanitizeData(data: unknown): unknown {
    if (!data) return data;

    // If it's a string, try to parse it as JSON
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch {
        // If it's not JSON, return as is
        return data;
      }
    }

    // If it's not an object, return as is
    if (typeof data !== "object") return data;

    // Create a deep copy
    const sanitized = JSON.parse(JSON.stringify(data));

    // Recursively sanitize sensitive fields
    const sanitizeObject = (obj: Record<string, unknown>) => {
      if (!obj || typeof obj !== "object") return;

      Object.keys(obj).forEach((key) => {
        if (
          key.toLowerCase().includes("password") ||
          key.toLowerCase().includes("token") ||
          key.toLowerCase().includes("secret")
        ) {
          obj[key] = "[REDACTED]";
        } else if (typeof obj[key] === "object") {
          sanitizeObject(obj[key] as Record<string, unknown>);
        }
      });
    };

    sanitizeObject(sanitized as Record<string, unknown>);
    return sanitized;
  }

  // Public API methods

  // Get all logs
  public getLogs(): RequestLog[] {
    return [...this.logs];
  }

  // Clear all logs
  public clearLogs(): void {
    this.logs = [];
    console.log("[DebugInterceptor] Logs cleared");
  }

  // Add a test log for debugging purposes
  public addTestLog(): void {
    const now = new Date();
    const testLog: RequestLog = {
      id: `test_${Date.now()}`,
      timestamp: now.toISOString(),
      method: "GET",
      url: "/api/test-endpoint",
      requestHeaders: { "Content-Type": "application/json" },
      requestData: { test: "data" },
      responseHeaders: { "Content-Type": "application/json" },
      responseData: { success: true, message: "Test response" },
      status: 200,
      duration: 42,
      isError: false,
    };

    this.logs.unshift(testLog);
    console.log("[DebugInterceptor] Test log added");
  }

  // Public methods for manual logging
  public logRequest(config: InternalAxiosRequestConfig): void {
    if (!this.isDebugEnabled()) return;
    this.handleRequest(config);
  }

  public logResponse(response: AxiosResponse): void {
    if (!this.isDebugEnabled()) return;
    this.handleResponse(response);
  }

  public logError(error: AxiosError): void {
    if (!this.isDebugEnabled()) return;
    if (error.response) {
      this.handleResponseError(error);
    } else {
      this.handleRequestError(error);
    }
  }
}

// Export as a singleton
const debugInterceptor = new DebugInterceptor();
export default debugInterceptor;
