import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Save, Send, Visibility, VisibilityOff } from "@mui/icons-material";
import { emailApi } from "../../services/email-service";
import { EmailConfigSettings } from "../../types";
import { useAuth } from "../../context/AuthContext";

const EmailConfigPanel: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<EmailConfigSettings>({
    smtpHost: "",
    smtpPort: 587,
    smtpUser: "",
    smtpPassword: "",
    smtpFromEmail: "",
    smtpFromName: "",
    enableSsl: true,
  });
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [testEmail, setTestEmail] = useState("");
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Only administrators can access this
  const isAdmin = user?.role === "Admin" || user?.role === "SuperAdmin";

  useEffect(() => {
    if (isAdmin) {
      fetchSettings();
    }
  }, [isAdmin]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      const config = await emailApi.getEmailConfig();
      // Remove password from response for security
      setSettings({
        ...config,
        smtpPassword: "", // Clear password for security
      });
    } catch (err) {
      setError("Failed to load email settings");
      console.error("Error loading email settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    if (type === "checkbox") {
      setSettings((prev) => ({ ...prev, [name]: checked }));
    } else if (name === "smtpPort") {
      const portValue = parseInt(value, 10);
      if (!isNaN(portValue)) {
        setSettings((prev) => ({ ...prev, [name]: portValue }));
      }
    } else {
      setSettings((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await emailApi.updateEmailConfig(settings);
      setSuccess("Email settings saved successfully");
    } catch (err) {
      setError("Failed to save email settings");
      console.error("Error saving email settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      setError("Please enter a test email address");
      return;
    }

    try {
      setTestLoading(true);
      setError(null);
      setTestResult(null);

      const result = await emailApi.testEmailConfig(settings, testEmail);
      setTestResult(result);
    } catch (err) {
      setError("Failed to test email configuration");
      console.error("Error testing email:", err);
    } finally {
      setTestLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <Box sx={{ mt: 4 }}>
        <Alert severity="error">
          You don't have permission to access email settings.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 2, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Email Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Configure the SMTP server settings for sending emails from the
          application.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3} component="div">
            <Grid component="div" size={[12, null, 6]}>
              <TextField
                fullWidth
                label="SMTP Host"
                name="smtpHost"
                value={settings.smtpHost}
                onChange={handleChange}
                required
                margin="normal"
              />
            </Grid>
            <Grid component="div" size={[12, null, 6]}>
              <TextField
                fullWidth
                label="SMTP Port"
                name="smtpPort"
                type="number"
                value={settings.smtpPort}
                onChange={handleChange}
                required
                margin="normal"
              />
            </Grid>
            <Grid component="div" size={[12, null, 6]}>
              <TextField
                fullWidth
                label="SMTP Username"
                name="smtpUser"
                value={settings.smtpUser}
                onChange={handleChange}
                required
                margin="normal"
              />
            </Grid>
            <Grid component="div" size={[12, null, 6]}>
              <TextField
                fullWidth
                label="SMTP Password"
                name="smtpPassword"
                type={showPassword ? "text" : "password"}
                value={settings.smtpPassword}
                onChange={handleChange}
                margin="normal"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid component="div" size={[12, null, 6]}>
              <TextField
                fullWidth
                label="From Email Address"
                name="smtpFromEmail"
                value={settings.smtpFromEmail}
                onChange={handleChange}
                required
                margin="normal"
              />
            </Grid>
            <Grid component="div" size={[12, null, 6]}>
              <TextField
                fullWidth
                label="From Name (optional)"
                name="smtpFromName"
                value={settings.smtpFromName}
                onChange={handleChange}
                margin="normal"
              />
            </Grid>
            <Grid component="div" size={[12]}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enableSsl}
                    onChange={handleChange}
                    name="enableSsl"
                  />
                }
                label="Enable SSL/TLS"
              />
            </Grid>
            <Grid component="div" size={[12]}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<Save />}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : "Save Settings"}
              </Button>
            </Grid>
          </Grid>
        </form>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h6" gutterBottom>
          Test Email Configuration
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Send a test email to verify your configuration.
        </Typography>

        {testResult && (
          <Alert
            severity={testResult.success ? "success" : "error"}
            sx={{ mb: 2 }}
          >
            {testResult.message}
          </Alert>
        )}

        <Grid container spacing={2} alignItems="center">
          <Grid component="div" size={[12, null, 8]}>
            <TextField
              fullWidth
              label="Test Email Address"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              required
              margin="normal"
              placeholder="Enter email address to send test"
            />
          </Grid>
          <Grid component="div" size={[12, null, 4]}>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<Send />}
              onClick={handleTestEmail}
              disabled={testLoading || !testEmail}
              sx={{ mt: 2 }}
            >
              {testLoading ? <CircularProgress size={24} /> : "Send Test Email"}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default EmailConfigPanel;
