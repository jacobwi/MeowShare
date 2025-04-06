import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Switch,
  FormControlLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  DialogActions,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  alpha,
  Grid,
  SelectChangeEvent,
} from "@mui/material";
import {
  Close as CloseIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  ExpandMore,
  ExpandLess,
  ContentCopy as CopyIcon,
  BugReport as BugReportIcon,
  NetworkCheck as NetworkIcon,
  Terminal as TerminalIcon,
  Settings as SettingsIcon,
  Memory as MemoryIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
} from "@mui/icons-material";
import debugInterceptor from "../../utils/DebugInterceptor";
import { useConfig } from "../../context/ConfigContext";
import {
  formatDuration,
  getStatusColor,
  formatTimestamp,
} from "../../utils/debug-utils";
import type { ExtendedPerformance } from "../../types/performance";

// Interface to match RequestLog from DebugInterceptor
interface RequestLog {
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

// Component to prettify and display JSON
const JsonViewer: React.FC<{ data: unknown }> = ({ data }) => {
  const [showRaw, setShowRaw] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  const toggleRaw = () => setShowRaw(!showRaw);

  const formatJson = (data: unknown): string => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return "Unable to stringify data";
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatJson(data));
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const renderJson = (data: unknown): React.ReactNode => {
    if (typeof data === "string") {
      return <span style={{ color: "#22863a" }}>"{data}"</span>;
    }
    if (typeof data === "number") {
      return <span style={{ color: "#0550ae" }}>{data}</span>;
    }
    if (typeof data === "boolean") {
      return <span style={{ color: "#0550ae" }}>{data.toString()}</span>;
    }
    if (data === null) {
      return <span style={{ color: "#6e7681" }}>null</span>;
    }
    if (Array.isArray(data)) {
      return (
        <Box component="div" sx={{ pl: 2 }}>
          {data.map((item, index) => (
            <Box key={index} component="div">
              {renderJson(item)}
            </Box>
          ))}
        </Box>
      );
    }
    if (typeof data === "object") {
      return (
        <Box component="div" sx={{ pl: 2 }}>
          {Object.entries(data as Record<string, unknown>).map(
            ([key, value]) => (
              <Box key={key} component="div">
                <span style={{ color: "#24292e" }}>"{key}"</span>
                <span style={{ color: "#24292e", margin: "0 4px" }}>:</span>
                {renderJson(value)}
              </Box>
            ),
          )}
        </Box>
      );
    }
    return String(data);
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", mb: 1, gap: 1 }}>
        <IconButton onClick={toggleRaw} size="small">
          {showRaw ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {showRaw ? "Show Formatted" : "Show Raw"}
        </Typography>
        <IconButton onClick={handleCopy} size="small" sx={{ ml: "auto" }}>
          <CopyIcon />
        </IconButton>
        {copySuccess && (
          <Typography variant="caption" sx={{ color: "success.main" }}>
            Copied!
          </Typography>
        )}
      </Box>
      <Box sx={{ ml: 2, mt: 1 }}>
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            bgcolor: "#f6f8fa",
            maxHeight: "400px",
            overflow: "auto",
            fontFamily: "monospace",
            fontSize: "0.875rem",
          }}
        >
          {showRaw ? (
            <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
              {formatJson(data)}
            </pre>
          ) : (
            renderJson(data)
          )}
        </Paper>
      </Box>
    </Box>
  );
};

// Detail view for a log entry
const LogDetailView: React.FC<{ log: RequestLog; onClose: () => void }> = ({
  log,
  onClose,
}) => {
  const [requestViewType, setRequestViewType] = useState<"json" | "raw">(
    "json",
  );
  const [responseViewType, setResponseViewType] = useState<"json" | "raw">(
    "json",
  );

  const getErrorMessage = (error: Error | string): string => {
    if (error instanceof Error) {
      return error.message;
    }
    return error;
  };

  const renderHeaders = (headers: Record<string, string> | undefined) => {
    if (!headers || Object.keys(headers).length === 0) return null;

    return (
      <Box sx={{ mt: 1 }}>
        <Typography variant="subtitle2">Headers:</Typography>
        {Object.entries(headers).map(([key, value]) => (
          <Typography
            key={key}
            variant="body2"
            sx={{
              ml: 2,
              wordWrap: "break-word",
              overflowWrap: "break-word",
              whiteSpace: "normal",
            }}
          >
            <strong>{key}:</strong> {value}
          </Typography>
        ))}
      </Box>
    );
  };

  const renderDataView = (data: unknown, viewType: "json" | "raw") => {
    if (data === undefined || data === null) return null;

    if (viewType === "raw") {
      return (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            bgcolor: "#f6f8fa",
            maxHeight: "400px",
            overflow: "auto",
            fontFamily: "monospace",
            fontSize: "0.875rem",
          }}
        >
          <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
            {JSON.stringify(data, null, 2)}
          </pre>
        </Paper>
      );
    }

    return <JsonViewer data={data} />;
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Request Details</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Timestamp: {formatTimestamp(log.timestamp)}
          </Typography>
          <Typography variant="subtitle1" gutterBottom>
            Status:{" "}
            {log.status ? (
              <Chip
                label={log.status}
                size="small"
                color={getStatusColor(log.status)}
                sx={{ ml: 1 }}
              />
            ) : (
              "N/A"
            )}
          </Typography>
          {log.error && (
            <Typography variant="subtitle1" color="error" gutterBottom>
              Error: {getErrorMessage(log.error)}
            </Typography>
          )}
          <Typography variant="subtitle1" gutterBottom>
            Duration: {log.duration ? formatDuration(log.duration) : "N/A"}
          </Typography>
        </Box>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">Request</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" gutterBottom>
              Method: {log.method}
            </Typography>
            <Typography variant="body2" gutterBottom>
              URL: {log.url}
            </Typography>
            {renderHeaders(log.requestHeaders)}
            {log.requestData !== undefined && log.requestData !== null && (
              <Box sx={{ mt: 1 }}>
                <Box
                  sx={{ display: "flex", alignItems: "center", mb: 1, gap: 1 }}
                >
                  <Typography variant="subtitle2">Request Data:</Typography>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={requestViewType}
                      onChange={(e) =>
                        setRequestViewType(e.target.value as "json" | "raw")
                      }
                      size="small"
                    >
                      <MenuItem value="json">JSON</MenuItem>
                      <MenuItem value="raw">Raw</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                {renderDataView(log.requestData, requestViewType)}
              </Box>
            )}
          </AccordionDetails>
        </Accordion>

        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">Response</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {renderHeaders(log.responseHeaders)}
            {log.responseData !== undefined && log.responseData !== null && (
              <Box sx={{ mt: 1 }}>
                <Box
                  sx={{ display: "flex", alignItems: "center", mb: 1, gap: 1 }}
                >
                  <Typography variant="subtitle2">Response Data:</Typography>
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <Select
                      value={responseViewType}
                      onChange={(e) =>
                        setResponseViewType(e.target.value as "json" | "raw")
                      }
                      size="small"
                    >
                      <MenuItem value="json">JSON</MenuItem>
                      <MenuItem value="raw">Raw</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                {renderDataView(log.responseData, responseViewType)}
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

// Filters for the debug logs
interface LogFilters {
  method: string;
  url: string;
  status: string;
  minDuration: number | null;
  maxDuration: number | null;
}

// Log stream component
const LogStream: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [logType, setLogType] = useState<
    "all" | "log" | "warn" | "error" | "info" | "debug"
  >("all");
  const theme = useTheme();
  const logContainerRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll effect
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  useEffect(() => {
    const handleConsoleLog = (
      ...args: (string | number | boolean | object | null)[]
    ) => {
      const timestamp = new Date().toLocaleTimeString();
      const formattedMessage = args
        .map((arg) => {
          if (typeof arg === "object") {
            try {
              return JSON.stringify(arg, null, 2);
            } catch {
              return String(arg);
            }
          }
          return String(arg);
        })
        .join(" ");

      setLogs((prev) => [...prev, `[${timestamp}] ${formattedMessage}`]);
    };

    // Store original console methods
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
      debug: console.debug,
    };

    // Override console methods
    console.log = (...args) => {
      originalConsole.log.apply(console, args);
      handleConsoleLog("LOG:", ...args);
    };

    console.warn = (...args) => {
      originalConsole.warn.apply(console, args);
      handleConsoleLog("WARN:", ...args);
    };

    console.error = (...args) => {
      originalConsole.error.apply(console, args);
      handleConsoleLog("ERROR:", ...args);
    };

    console.info = (...args) => {
      originalConsole.info.apply(console, args);
      handleConsoleLog("INFO:", ...args);
    };

    console.debug = (...args) => {
      originalConsole.debug.apply(console, args);
      handleConsoleLog("DEBUG:", ...args);
    };

    // Add performance monitoring
    const performance = window.performance as ExtendedPerformance;
    const logPerformance = () => {
      const memory = (performance as ExtendedPerformance).memory;
      if (memory) {
        console.info("Memory Usage:", {
          used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
          total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
          limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
        });
      }
    };

    // Add storage monitoring
    const logStorage = () => {
      let localStorageSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          localStorageSize += localStorage.getItem(key)?.length || 0;
        }
      }

      let sessionStorageSize = 0;
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          sessionStorageSize += sessionStorage.getItem(key)?.length || 0;
        }
      }

      console.info("Storage Usage:", {
        localStorage: `${(localStorageSize / 1024).toFixed(2)} KB`,
        sessionStorage: `${(sessionStorageSize / 1024).toFixed(2)} KB`,
        cookies: `${(document.cookie.length / 1024).toFixed(2)} KB`,
      });
    };

    // Add network request logging
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = performance.now();
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        console.debug("Network Request:", {
          url: args[0],
          method: args[1]?.method || "GET",
          duration: `${(endTime - startTime).toFixed(2)}ms`,
          status: response.status,
        });
        return response;
      } catch (error) {
        console.error("Network Request Failed:", error);
        throw error;
      }
    };

    // Set up periodic logging
    const performanceInterval = setInterval(logPerformance, 5000);
    const storageInterval = setInterval(logStorage, 5000);

    // Cleanup function
    return () => {
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      console.info = originalConsole.info;
      console.debug = originalConsole.debug;
      window.fetch = originalFetch;
      clearInterval(performanceInterval);
      clearInterval(storageInterval);
    };
  }, []);

  const clearLogs = () => {
    setLogs([]);
  };

  const handleLogTypeChange = (
    event: SelectChangeEvent<
      "all" | "log" | "warn" | "error" | "info" | "debug"
    >,
  ) => {
    setLogType(
      event.target.value as "all" | "log" | "warn" | "error" | "info" | "debug",
    );
  };

  const filteredLogs = logs.filter((log) => {
    if (logType === "all") return true;
    return log.includes(`${logType.toUpperCase()}:`);
  });

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6">Log Stream</Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <FormControlLabel
            control={
              <Switch
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                size="small"
              />
            }
            label="Auto-scroll"
          />
          <Button
            variant="outlined"
            size="small"
            onClick={clearLogs}
            startIcon={<RefreshIcon />}
          >
            Clear Logs
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <Typography variant="subtitle2">Log Type:</Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select value={logType} onChange={handleLogTypeChange} size="small">
              <MenuItem value="all">All Logs</MenuItem>
              <MenuItem value="log">Log</MenuItem>
              <MenuItem value="warn">Warning</MenuItem>
              <MenuItem value="error">Error</MenuItem>
              <MenuItem value="info">Info</MenuItem>
              <MenuItem value="debug">Debug</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      <Paper
        ref={logContainerRef}
        sx={{
          flex: 1,
          overflow: "auto",
          bgcolor: alpha(theme.palette.background.default, 0.8),
          fontFamily: "monospace",
          fontSize: "0.875rem",
          p: 2,
        }}
      >
        {filteredLogs.length === 0 ? (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ textAlign: "center", py: 2 }}
          >
            No logs available. Console output will appear here.
          </Typography>
        ) : (
          filteredLogs.map((log, index) => (
            <Typography
              key={index}
              component="div"
              sx={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                mb: 1,
                fontFamily: "monospace",
                fontSize: "0.875rem",
                color: log.includes("ERROR:")
                  ? "error.main"
                  : log.includes("WARN:")
                    ? "warning.main"
                    : log.includes("INFO:")
                      ? "info.main"
                      : log.includes("DEBUG:")
                        ? "text.secondary"
                        : "text.primary",
              }}
            >
              {log}
            </Typography>
          ))
        )}
      </Paper>
    </Box>
  );
};

// Performance component
const PerformanceMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState({
    fps: 0,
    loadTime: 0,
    domContentLoaded: 0,
    firstPaint: 0,
    firstContentfulPaint: 0,
  });

  useEffect(() => {
    // Get performance metrics
    const performance = window.performance as ExtendedPerformance;
    const timing = performance.timing;

    // Calculate load time
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    const domContentLoaded =
      timing.domContentLoadedEventEnd - timing.navigationStart;

    // Get paint timing
    const paint = performance.getEntriesByType("paint");
    const firstPaint =
      paint.find((entry) => entry.name === "first-paint")?.startTime || 0;
    const firstContentfulPaint =
      paint.find((entry) => entry.name === "first-contentful-paint")
        ?.startTime || 0;

    setMetrics({
      fps: 60, // Default value, would need requestAnimationFrame to calculate real FPS
      loadTime,
      domContentLoaded,
      firstPaint,
      firstContentfulPaint,
    });
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Performance Metrics
      </Typography>
      <Grid container spacing={2}>
        <Grid size={[12, null, 6]}>
          <Paper
            sx={{
              p: 2,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Page Load
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography color="text.secondary">Total Load Time</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {metrics.loadTime.toFixed(2)}ms
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography color="text.secondary">
                  DOM Content Loaded
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {metrics.domContentLoaded.toFixed(2)}ms
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography color="text.secondary">First Paint</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {metrics.firstPaint.toFixed(2)}ms
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography color="text.secondary">
                  First Contentful Paint
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {metrics.firstContentfulPaint.toFixed(2)}ms
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid size={[12, null, 6]}>
          <Paper
            sx={{
              p: 2,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Rendering
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography color="text.secondary">FPS</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {metrics.fps}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography color="text.secondary">Page Size</Typography>
                <Typography variant="body1" fontWeight="medium">
                  {(() => {
                    const perf = window.performance as ExtendedPerformance;
                    const memory = perf.memory;
                    if (!memory) return "N/A";
                    return `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`;
                  })()}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

// Memory component
const MemoryMetrics: React.FC = () => {
  const [memory, setMemory] = useState({
    used: 0,
    total: 0,
    limit: 0,
  });

  useEffect(() => {
    const updateMemory = () => {
      const performance = window.performance as ExtendedPerformance;
      const memoryUsage = performance.memory;
      if (memoryUsage) {
        setMemory({
          used: memoryUsage.usedJSHeapSize,
          total: memoryUsage.totalJSHeapSize,
          limit: memoryUsage.jsHeapSizeLimit,
        });
      }
    };

    updateMemory();
    const interval = setInterval(updateMemory, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Memory Usage
      </Typography>
      <Grid container spacing={2}>
        <Grid size={[12, null, 4]}>
          <Paper
            sx={{
              p: 2,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Used Memory
            </Typography>
            <Typography variant="h4" color="primary">
              {formatBytes(memory.used)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Currently allocated memory
            </Typography>
          </Paper>
        </Grid>
        <Grid size={[12, null, 4]}>
          <Paper
            sx={{
              p: 2,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Total Memory
            </Typography>
            <Typography variant="h4" color="primary">
              {formatBytes(memory.total)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total allocated memory
            </Typography>
          </Paper>
        </Grid>
        <Grid size={[12, null, 4]}>
          <Paper
            sx={{
              p: 2,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Memory Limit
            </Typography>
            <Typography variant="h4" color="primary">
              {formatBytes(memory.limit)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Maximum available memory
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

// Storage component
const StorageMetrics: React.FC = () => {
  const [storage, setStorage] = useState({
    localStorage: 0,
    sessionStorage: 0,
    cookies: 0,
  });

  useEffect(() => {
    const calculateStorage = () => {
      // Calculate localStorage size
      let localStorageSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          localStorageSize += localStorage.getItem(key)?.length || 0;
        }
      }

      // Calculate sessionStorage size
      let sessionStorageSize = 0;
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          sessionStorageSize += sessionStorage.getItem(key)?.length || 0;
        }
      }

      // Calculate cookies size
      const cookiesSize = document.cookie.length;

      setStorage({
        localStorage: localStorageSize,
        sessionStorage: sessionStorageSize,
        cookies: cookiesSize,
      });
    };

    calculateStorage();
    const interval = setInterval(calculateStorage, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    const units = ["B", "KB", "MB"];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Storage Usage
      </Typography>
      <Grid container spacing={2}>
        <Grid size={[12, null, 4]}>
          <Paper
            sx={{
              p: 2,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Local Storage
            </Typography>
            <Typography variant="h4" color="primary">
              {formatBytes(storage.localStorage)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Persistent browser storage
            </Typography>
          </Paper>
        </Grid>
        <Grid size={[12, null, 4]}>
          <Paper
            sx={{
              p: 2,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Session Storage
            </Typography>
            <Typography variant="h4" color="primary">
              {formatBytes(storage.sessionStorage)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Temporary session storage
            </Typography>
          </Paper>
        </Grid>
        <Grid size={[12, null, 4]}>
          <Paper
            sx={{
              p: 2,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Typography variant="subtitle1" gutterBottom>
              Cookies
            </Typography>
            <Typography variant="h4" color="primary">
              {formatBytes(storage.cookies)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Browser cookies size
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

// Main DebugPanel component
const DebugPanel: React.FC = () => {
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const { config, updateConfig } = useConfig();
  const [showFilterPanel, setShowFilterPanel] = useState<boolean>(false);
  const [selectedLog, setSelectedLog] = useState<RequestLog | null>(null);
  const [filters, setFilters] = useState<LogFilters>({
    method: "",
    url: "",
    status: "",
    minDuration: null,
    maxDuration: null,
  });
  const [selectedTab, setSelectedTab] = useState("network");
  const [drawerWidth] = useState(240);

  // Load logs and debug state on component mount
  useEffect(() => {
    refreshLogs();
  }, []);

  // Toggle debug mode
  const handleToggleDebug = (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;
    updateConfig({ DEBUG_MODE: enabled });
  };

  // Refresh logs from the interceptor
  const refreshLogs = () => {
    setLogs(debugInterceptor.getLogs());
  };

  // Clear all logs
  const clearLogs = () => {
    debugInterceptor.clearLogs();
    setLogs([]);
  };

  // Filter logs based on current filter settings
  const filteredLogs = logs.filter((log) => {
    if (filters.method && !log.method.includes(filters.method.toUpperCase())) {
      return false;
    }

    if (filters.url && !log.url.includes(filters.url)) {
      return false;
    }

    if (filters.status) {
      if (!log.status) return false;

      if (filters.status === "2xx" && (log.status < 200 || log.status >= 300)) {
        return false;
      } else if (
        filters.status === "3xx" &&
        (log.status < 300 || log.status >= 400)
      ) {
        return false;
      } else if (
        filters.status === "4xx" &&
        (log.status < 400 || log.status >= 500)
      ) {
        return false;
      } else if (
        filters.status === "5xx" &&
        (log.status < 500 || log.status >= 600)
      ) {
        return false;
      }
    }

    if (
      filters.minDuration !== null &&
      (log.duration === undefined || log.duration < filters.minDuration)
    ) {
      return false;
    }

    if (
      filters.maxDuration !== null &&
      (log.duration === undefined || log.duration > filters.maxDuration)
    ) {
      return false;
    }

    return true;
  });

  // Update a filter value
  const handleFilterChange = (
    key: keyof LogFilters,
    value: string | number | null,
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      method: "",
      url: "",
      status: "",
      minDuration: null,
      maxDuration: null,
    });
  };

  // Show log details when a row is clicked
  const handleRowClick = (log: RequestLog) => {
    setSelectedLog(log);
  };

  // Close the log details dialog
  const handleCloseDetails = () => {
    setSelectedLog(null);
  };

  const menuItems = [
    { id: "network", label: "Network", icon: <NetworkIcon /> },
    { id: "logs", label: "Log Stream", icon: <TerminalIcon /> },
    { id: "performance", label: "Performance", icon: <SpeedIcon /> },
    { id: "memory", label: "Memory", icon: <MemoryIcon /> },
    { id: "storage", label: "Storage", icon: <StorageIcon /> },
    { id: "settings", label: "Debug Settings", icon: <SettingsIcon /> },
  ];

  const renderContent = () => {
    switch (selectedTab) {
      case "network":
        return (
          <>
            <Box display="flex" gap={2} mb={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.DEBUG_MODE}
                    onChange={handleToggleDebug}
                    color="primary"
                  />
                }
                label="Debug Mode"
              />
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={refreshLogs}
              >
                Refresh
              </Button>
              <Button variant="outlined" color="error" onClick={clearLogs}>
                Clear Logs
              </Button>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={() => setShowFilterPanel(!showFilterPanel)}
              >
                {showFilterPanel ? "Hide Filters" : "Show Filters"}
              </Button>
            </Box>

            {showFilterPanel && (
              <Paper sx={{ p: 2, mb: 3 }} variant="outlined">
                <Box display="flex" flexWrap="wrap" gap={2} alignItems="center">
                  <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel id="method-filter-label">Method</InputLabel>
                    <Select
                      labelId="method-filter-label"
                      value={filters.method}
                      label="Method"
                      size="small"
                      onChange={(e) =>
                        handleFilterChange("method", e.target.value)
                      }
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="GET">GET</MenuItem>
                      <MenuItem value="POST">POST</MenuItem>
                      <MenuItem value="PUT">PUT</MenuItem>
                      <MenuItem value="DELETE">DELETE</MenuItem>
                      <MenuItem value="PATCH">PATCH</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    label="URL Contains"
                    size="small"
                    value={filters.url}
                    onChange={(e) => handleFilterChange("url", e.target.value)}
                  />

                  <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel id="status-filter-label">Status</InputLabel>
                    <Select
                      labelId="status-filter-label"
                      value={filters.status}
                      label="Status"
                      size="small"
                      onChange={(e) =>
                        handleFilterChange("status", e.target.value)
                      }
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="2xx">2xx (Success)</MenuItem>
                      <MenuItem value="3xx">3xx (Redirect)</MenuItem>
                      <MenuItem value="4xx">4xx (Client Error)</MenuItem>
                      <MenuItem value="5xx">5xx (Server Error)</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    label="Min Duration (ms)"
                    type="number"
                    size="small"
                    value={
                      filters.minDuration === null ? "" : filters.minDuration
                    }
                    onChange={(e) =>
                      handleFilterChange(
                        "minDuration",
                        e.target.value === "" ? null : Number(e.target.value),
                      )
                    }
                  />

                  <TextField
                    label="Max Duration (ms)"
                    type="number"
                    size="small"
                    value={
                      filters.maxDuration === null ? "" : filters.maxDuration
                    }
                    onChange={(e) =>
                      handleFilterChange(
                        "maxDuration",
                        e.target.value === "" ? null : Number(e.target.value),
                      )
                    }
                  />

                  <Button variant="outlined" onClick={resetFilters}>
                    Reset Filters
                  </Button>
                </Box>
              </Paper>
            )}

            {filteredLogs.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="body1" color="text.secondary">
                  No logs available.{" "}
                  {!config.DEBUG_MODE &&
                    "Enable Debug Mode to start capturing network requests."}
                </Typography>
              </Paper>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Time</TableCell>
                      <TableCell>Method</TableCell>
                      <TableCell>URL</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Duration</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow
                        key={log.id}
                        hover
                        onClick={() => handleRowClick(log)}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell>
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={log.method}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title={log.url}>
                            <Typography
                              variant="body2"
                              noWrap
                              sx={{ maxWidth: 300 }}
                            >
                              {log.url}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          {log.status ? (
                            <Chip
                              label={log.status}
                              size="small"
                              color={getStatusColor(log.status)}
                            />
                          ) : (
                            <Chip label="Pending" size="small" />
                          )}
                        </TableCell>
                        <TableCell>
                          {log.duration !== undefined
                            ? formatDuration(log.duration)
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        );
      case "logs":
        return <LogStream />;
      case "performance":
        return <PerformanceMetrics />;
      case "memory":
        return <MemoryMetrics />;
      case "storage":
        return <StorageMetrics />;
      case "settings":
        return (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Debug Settings
            </Typography>
            <Paper sx={{ p: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.DEBUG_MODE}
                    onChange={handleToggleDebug}
                    color="primary"
                  />
                }
                label="Debug Mode"
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Enable or disable debug features across the application
              </Typography>
            </Paper>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        fontWeight="bold"
        sx={{
          textAlign: { xs: "center", sm: "left" },
          mb: 3,
          position: "relative",
          "&::after": {
            content: '""',
            position: "absolute",
            bottom: -8,
            left: { xs: "50%", sm: 0 },
            transform: { xs: "translateX(-50%)", sm: "none" },
            width: { xs: "80px", sm: "100px" },
            height: "4px",
            bgcolor: "primary.main",
            borderRadius: "2px",
          },
        }}
      >
        {menuItems.find((item) => item.id === selectedTab)?.label ||
          "Debug Panel"}
      </Typography>

      <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              borderRight: "1px solid",
              borderColor: "divider",
              height: "100%",
              position: "relative",
            },
          }}
        >
          <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <BugReportIcon color="primary" />
            <Typography variant="h6">Debug Tools</Typography>
          </Box>
          <Divider />
          <List>
            {menuItems.map((item) => (
              <ListItem
                key={item.id}
                component="div"
                onClick={() => setSelectedTab(item.id)}
                sx={{
                  cursor: "pointer",
                  bgcolor:
                    selectedTab === item.id ? "action.selected" : "transparent",
                  "&:hover": {
                    bgcolor: "action.hover",
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>
        </Drawer>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
            overflow: "auto",
          }}
        >
          {renderContent()}
        </Box>
      </Box>

      {selectedLog && (
        <LogDetailView log={selectedLog} onClose={handleCloseDetails} />
      )}
    </Box>
  );
};

export default DebugPanel;
