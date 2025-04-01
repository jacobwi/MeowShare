import React, { useState } from "react";
import {
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Paper,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  BugReport as BugReportIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material";
import debugInterceptor from "../../utils/DebugInterceptor";
import axios from "axios";
import { useConfig } from "../../context/ConfigContext";

interface TestResult {
  success: boolean;
  message: string;
  timestamp: string;
  type?: "log" | "api" | "error";
}

/**
 * A helper component to debug the Debug Panel
 * This adds test logs and makes real API calls to generate debug entries only when requested
 */
export const DebugHelper: React.FC = () => {
  const { config, updateConfig } = useConfig();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [filterTab, setFilterTab] = useState(0);

  // Add a test log directly to the interceptor
  const addTestLog = () => {
    try {
      debugInterceptor.addTestLog();
      setTestResults((prev) => [
        {
          success: true,
          message: "Test log added successfully",
          timestamp: new Date().toISOString(),
          type: "log",
        },
        ...prev,
      ]);
    } catch (error) {
      setTestResults((prev) => [
        {
          success: false,
          message: `Failed to add test log: ${error instanceof Error ? error.message : "Unknown error"}`,
          timestamp: new Date().toISOString(),
          type: "error",
        },
        ...prev,
      ]);
    }
  };

  // Make some real API calls to test logging
  const makeTestCalls = async () => {
    setIsLoading(true);
    setTestResults((prev) => [
      {
        success: true,
        message: "Starting test API calls...",
        timestamp: new Date().toISOString(),
        type: "api",
      },
      ...prev,
    ]);

    try {
      // Force enable the debug interceptor
      if (!config.DEBUG_MODE) {
        updateConfig({ DEBUG_MODE: true });
        setTestResults((prev) => [
          {
            success: true,
            message: "Debug mode enabled",
            timestamp: new Date().toISOString(),
            type: "log",
          },
          ...prev,
        ]);
      }

      // Test GET request
      await axios.get(`${import.meta.env.VITE_API_URL}/api/files/check`, {
        headers: { "Test-Header": "Debug Test" },
      });
      setTestResults((prev) => [
        {
          success: true,
          message: "GET request successful",
          timestamp: new Date().toISOString(),
          type: "api",
        },
        ...prev,
      ]);

      // Test POST request
      await axios.post(`${import.meta.env.VITE_API_URL}/api/test`, {
        test: true,
        timestamp: new Date().toISOString(),
      });
      setTestResults((prev) => [
        {
          success: true,
          message: "POST request successful",
          timestamp: new Date().toISOString(),
          type: "api",
        },
        ...prev,
      ]);

      // Test error case
      await axios
        .get(`${import.meta.env.VITE_API_URL}/api/nonexistent`)
        .catch(() => {
          setTestResults((prev) => [
            {
              success: false,
              message: "Error request captured (expected)",
              timestamp: new Date().toISOString(),
              type: "error",
            },
            ...prev,
          ]);
        });

      const logsCount = debugInterceptor.getLogs().length;
      setTestResults((prev) => [
        {
          success: true,
          message: `Test complete. Total logs: ${logsCount}`,
          timestamp: new Date().toISOString(),
          type: "log",
        },
        ...prev,
      ]);
    } catch (error) {
      setTestResults((prev) => [
        {
          success: false,
          message: `Error during test calls: ${error instanceof Error ? error.message : "Unknown error"}`,
          timestamp: new Date().toISOString(),
          type: "error",
        },
        ...prev,
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setFilterTab(newValue);
  };

  const filteredResults = testResults.filter((result) => {
    if (filterTab === 0) return true; // All
    if (filterTab === 1) return result.success; // Success
    if (filterTab === 2) return !result.success; // Errors
    return true;
  });

  const getResultIcon = (success: boolean) => {
    return success ? (
      <SuccessIcon color="success" fontSize="small" />
    ) : (
      <ErrorIcon color="error" fontSize="small" />
    );
  };

  return (
    <Accordion
      expanded={expanded}
      onChange={() => setExpanded(!expanded)}
      sx={{
        mb: 2,
        "&:before": {
          display: "none",
        },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          bgcolor: "background.paper",
          border: "1px dashed",
          borderColor: "divider",
          borderRadius: 1,
          "&:hover": {
            bgcolor: "action.hover",
          },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <BugReportIcon color="primary" />
          <Typography variant="h6">Debug Helper</Typography>
          <Chip
            label={`Debug Mode: ${config.DEBUG_MODE ? "ON" : "OFF"}`}
            color={config.DEBUG_MODE ? "success" : "default"}
            size="small"
            sx={{ ml: 1 }}
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Typography variant="body2" color="text.secondary" paragraph>
          Use these buttons to test the debug interceptor and generate sample
          logs
        </Typography>

        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={addTestLog}
            size="small"
            disabled={isLoading}
          >
            Add Test Log
          </Button>
          <Button
            variant="outlined"
            color="secondary"
            onClick={makeTestCalls}
            size="small"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            Make Test API Calls
          </Button>
          <Tooltip title="Clear all test results">
            <IconButton
              color="error"
              onClick={clearTestResults}
              disabled={isLoading || testResults.length === 0}
              size="small"
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>

        {testResults.length > 0 && (
          <Paper sx={{ mt: 2 }}>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs
                value={filterTab}
                onChange={handleTabChange}
                variant="fullWidth"
                sx={{ minHeight: 36 }}
              >
                <Tab
                  label={`All (${testResults.length})`}
                  icon={<FilterIcon />}
                  iconPosition="start"
                />
                <Tab
                  label={`Success (${testResults.filter((r) => r.success).length})`}
                  icon={<SuccessIcon />}
                  iconPosition="start"
                />
                <Tab
                  label={`Errors (${testResults.filter((r) => !r.success).length})`}
                  icon={<ErrorIcon />}
                  iconPosition="start"
                />
              </Tabs>
            </Box>
            <Box sx={{ p: 2, maxHeight: 300, overflow: "auto" }}>
              <Stack spacing={1}>
                {filteredResults.map((result, index) => (
                  <Alert
                    key={index}
                    severity={result.success ? "success" : "error"}
                    sx={{
                      py: 0,
                      "& .MuiAlert-icon": {
                        alignItems: "center",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        {getResultIcon(result.success)}
                        <Typography variant="body2">
                          {result.message}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(result.timestamp).toLocaleTimeString()}
                      </Typography>
                    </Box>
                  </Alert>
                ))}
              </Stack>
            </Box>
          </Paper>
        )}
      </AccordionDetails>
    </Accordion>
  );
};
