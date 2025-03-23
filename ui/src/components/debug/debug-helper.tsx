import React, { useState } from "react";
import {
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Chip,
  Divider,
} from "@mui/material";
import debugInterceptor from "../../utils/DebugInterceptor";
import axios from "axios";
import { useConfig } from "../../context/ConfigContext";

interface TestResult {
  success: boolean;
  message: string;
  timestamp: string;
}

/**
 * A helper component to debug the Debug Panel
 * This adds test logs and makes real API calls to generate debug entries only when requested
 */
export const DebugHelper: React.FC = () => {
  const { config, updateConfig } = useConfig();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Add a test log directly to the interceptor
  const addTestLog = () => {
    try {
      debugInterceptor.addTestLog();
      setTestResults((prev) => [
        {
          success: true,
          message: "Test log added successfully",
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);
    } catch (error) {
      setTestResults((prev) => [
        {
          success: false,
          message: `Failed to add test log: ${error instanceof Error ? error.message : "Unknown error"}`,
          timestamp: new Date().toISOString(),
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
        },
        ...prev,
      ]);
    } catch (error) {
      setTestResults((prev) => [
        {
          success: false,
          message: `Error during test calls: ${error instanceof Error ? error.message : "Unknown error"}`,
          timestamp: new Date().toISOString(),
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

  return (
    <Box sx={{ mb: 2, p: 2, border: "1px dashed grey", borderRadius: 1 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6">Debug Helper</Typography>
        <Chip
          label={`Debug Mode: ${config.DEBUG_MODE ? "ON" : "OFF"}`}
          color={config.DEBUG_MODE ? "success" : "default"}
          size="small"
        />
      </Box>

      <Typography variant="body2" color="text.secondary" paragraph>
        Use these buttons to test the debug interceptor and generate sample logs
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
        <Button
          variant="outlined"
          color="error"
          onClick={clearTestResults}
          size="small"
          disabled={isLoading || testResults.length === 0}
        >
          Clear Results
        </Button>
      </Stack>

      {testResults.length > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" gutterBottom>
            Test Results:
          </Typography>
          <Stack spacing={1}>
            {testResults.map((result, index) => (
              <Alert
                key={index}
                severity={result.success ? "success" : "error"}
                sx={{ py: 0 }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2">{result.message}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </Typography>
                </Box>
              </Alert>
            ))}
          </Stack>
        </>
      )}
    </Box>
  );
};
