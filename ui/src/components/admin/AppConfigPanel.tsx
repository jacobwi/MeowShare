import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Switch,
  FormControlLabel,
  Alert,
  Paper,
  Divider,
  CircularProgress,
} from "@mui/material";
import { Save as SaveIcon, Refresh as RefreshIcon } from "@mui/icons-material";
import { toast } from "react-toastify";
import { useConfig } from "../../context/ConfigContext";
import { AppConfig } from "../../types";

const AppConfigPanel: React.FC = () => {
  const { config, updateConfig, resetConfig } = useConfig();
  const [formData, setFormData] = useState<AppConfig>({ ...config });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Update form data when config changes
  useEffect(() => {
    setFormData({ ...config });
  }, [config]);

  const handleChange = (key: string, value: string | boolean | number) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSwitchChange =
    (key: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      handleChange(key, event.target.checked);
    };

  const handleTextChange =
    (key: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      handleChange(key, event.target.value);
    };

  const handleNumberChange =
    (key: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
      handleChange(key, Number(event.target.value));
    };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Apply the changes to the context
      updateConfig(formData);

      // We can still simulate an API call for persistence on the server
      await new Promise((resolve) => setTimeout(resolve, 800));

      setSuccess("App configuration updated successfully");
      toast.success("App configuration updated successfully!");
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to update app configuration";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    resetConfig();
    toast.info("Configuration reset to defaults");
  };

  const formatBytes = (bytes: number): string => {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "0 Byte";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Application Settings
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="App Name"
              name="APP_NAME"
              value={formData.APP_NAME}
              onChange={handleTextChange("APP_NAME")}
              variant="outlined"
              margin="normal"
              helperText="The name of the application displayed in the UI"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="API URL"
              name="API_URL"
              value={formData.API_URL}
              onChange={handleTextChange("API_URL")}
              variant="outlined"
              margin="normal"
              helperText="Base URL for API requests"
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.DEBUG_MODE as boolean}
                  onChange={handleSwitchChange("DEBUG_MODE")}
                  name="DEBUG_MODE"
                  color="primary"
                />
              }
              label="Debug Mode"
            />
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
            >
              Enable debug features and logging
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          File Settings
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Max File Size (bytes)"
              name="MAX_FILE_SIZE"
              type="number"
              value={formData.MAX_FILE_SIZE}
              onChange={handleNumberChange("MAX_FILE_SIZE")}
              variant="outlined"
              margin="normal"
              helperText={`Maximum file size: ${formatBytes(formData.MAX_FILE_SIZE as number)}`}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Chunk Size (bytes)"
              name="CHUNK_SIZE"
              type="number"
              value={formData.CHUNK_SIZE}
              onChange={handleNumberChange("CHUNK_SIZE")}
              variant="outlined"
              margin="normal"
              helperText={`Size of file chunks for uploading: ${formatBytes(formData.CHUNK_SIZE as number)}`}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Default Expiration (days)"
              name="DEFAULT_EXPIRATION_DAYS"
              type="number"
              value={formData.DEFAULT_EXPIRATION_DAYS}
              onChange={handleNumberChange("DEFAULT_EXPIRATION_DAYS")}
              variant="outlined"
              margin="normal"
              helperText="Default number of days before files expire"
            />
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}>
        <Button
          variant="outlined"
          color="secondary"
          onClick={handleReset}
          startIcon={<RefreshIcon />}
        >
          Reset to Defaults
        </Button>

        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={saving}
          startIcon={saving ? <CircularProgress size={24} /> : <SaveIcon />}
        >
          {saving ? "Saving..." : "Save Configuration"}
        </Button>
      </Box>
    </Box>
  );
};

export default AppConfigPanel;
