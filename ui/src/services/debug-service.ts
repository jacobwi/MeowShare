import apiClient from "./api";

interface DebugLog {
  id: string;
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
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
  data?: unknown;
}

interface DebugStats {
  totalLogs: number;
  logsByLevel: Record<string, number>;
  recentErrors: DebugLog[];
}

const debugService = {
  /**
   * Gets all debug logs
   */
  async getLogs(): Promise<DebugLog[]> {
    try {
      const response = await apiClient.get("/debug/logs");
      return response.data;
    } catch (error) {
      console.error("Error fetching debug logs:", error);
      throw error;
    }
  },

  /**
   * Gets debug statistics
   */
  async getStats(): Promise<DebugStats> {
    try {
      const response = await apiClient.get("/debug/stats");
      return response.data;
    } catch (error) {
      console.error("Error fetching debug stats:", error);
      throw error;
    }
  },

  /**
   * Clears all debug logs
   */
  async clearLogs(): Promise<void> {
    try {
      await apiClient.delete("/debug/logs");
    } catch (error) {
      console.error("Error clearing debug logs:", error);
      throw error;
    }
  },

  /**
   * Gets logs filtered by level
   * @param level The log level to filter by
   */
  async getLogsByLevel(level: DebugLog["level"]): Promise<DebugLog[]> {
    try {
      const response = await apiClient.get(`/debug/logs/${level}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${level} logs:`, error);
      throw error;
    }
  },

  /**
   * Gets logs within a time range
   * @param startTime Start time in ISO format
   * @param endTime End time in ISO format
   */
  async getLogsByTimeRange(
    startTime: string,
    endTime: string,
  ): Promise<DebugLog[]> {
    try {
      const response = await apiClient.get("/debug/logs/range", {
        params: { startTime, endTime },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching logs by time range:", error);
      throw error;
    }
  },

  /**
   * Gets the most recent logs
   * @param limit The maximum number of logs to return
   */
  async getRecentLogs(limit: number = 100): Promise<DebugLog[]> {
    try {
      const response = await apiClient.get("/debug/logs/recent", {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching recent logs:", error);
      throw error;
    }
  },

  /**
   * Gets logs containing a specific message
   * @param message The message to search for
   */
  async searchLogs(message: string): Promise<DebugLog[]> {
    try {
      const response = await apiClient.get("/debug/logs/search", {
        params: { message },
      });
      return response.data;
    } catch (error) {
      console.error("Error searching logs:", error);
      throw error;
    }
  },
};

export default debugService;
