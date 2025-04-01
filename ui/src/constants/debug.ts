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

export interface DebugContextType {
  logs: RequestLog[];
  isEnabled: boolean;
  toggleDebug: () => void;
  clearLogs: () => void;
  addLog: (log: RequestLog) => void;
}

export const defaultDebugContext: DebugContextType = {
  logs: [],
  isEnabled: false,
  toggleDebug: () => {},
  clearLogs: () => {},
  addLog: () => {},
};
