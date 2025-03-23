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
} from "@mui/material";
import {
  Close as CloseIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  ExpandMore,
  ExpandLess,
  ContentCopy as CopyIcon,
} from "@mui/icons-material";
import debugInterceptor from "../../utils/DebugInterceptor";
import { useConfig } from "../../context/ConfigContext";
import {
  formatDuration,
  getStatusColor,
  formatTimestamp,
} from "../../utils/debug-utils";

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

  return (
    <Box sx={{ p: 3 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5">Network Debug Panel</Typography>
        <Box display="flex" gap={2}>
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
                onChange={(e) => handleFilterChange("method", e.target.value)}
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
                onChange={(e) => handleFilterChange("status", e.target.value)}
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
              value={filters.minDuration === null ? "" : filters.minDuration}
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
              value={filters.maxDuration === null ? "" : filters.maxDuration}
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
                      <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
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

      {selectedLog && (
        <LogDetailView log={selectedLog} onClose={handleCloseDetails} />
      )}
    </Box>
  );
};

export default DebugPanel;
