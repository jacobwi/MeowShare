import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Switch,
  FormControlLabel,
  Button,
  Divider,
  TextField,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Tabs,
  Tab,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  Notifications as NotificationsIcon,
  Security as SecurityIcon,
  Palette as PaletteIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Language as LanguageIcon,
  Save as SaveIcon,
  LockReset as LockResetIcon,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/theme";
import { AppearanceSettings } from "../../types";
import { toast } from "react-toastify";

interface SettingsState {
  // Account settings
  email: string;

  // Security settings
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  twoFactorEnabled: boolean;

  // Notification settings
  emailNotifications: boolean;
  downloadNotifications: boolean;
  securityAlerts: boolean;

  // Appearance settings
  darkMode: boolean;
  compactMode: boolean;
  fontSize: AppearanceSettings["fontSize"];
  showProfileInfo: boolean;
  shareActivity: boolean;

  // Language settings
  language: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

export const Settings: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const {
    mode,
    fontSize,
    compactMode,
    showProfileInfo,
    shareActivity,
    language,
    updateAppearance,
  } = useTheme();

  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<SettingsState>({
    // Account settings
    email: user?.email || "",

    // Security settings
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    twoFactorEnabled: false,

    // Notification settings
    emailNotifications: true,
    downloadNotifications: true,
    securityAlerts: true,

    // Appearance settings
    darkMode: mode === "dark",
    compactMode: compactMode,
    fontSize: fontSize,
    showProfileInfo: showProfileInfo,
    shareActivity: shareActivity,
    language: language,
  });

  // Update settings with user data when it's available
  useEffect(() => {
    if (user && user.email) {
      setSettings((prevSettings) => ({
        ...prevSettings,
        email: user.email || "",
      }));
    }
  }, [user, user?.email]);

  // Update settings when theme context changes
  useEffect(() => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      darkMode: mode === "dark",
      compactMode: compactMode,
      fontSize: fontSize,
      showProfileInfo: showProfileInfo,
      shareActivity: shareActivity,
      language: language,
    }));
  }, [mode, compactMode, fontSize, showProfileInfo, shareActivity, language]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    // Clear messages when switching tabs
    setError(null);
    setSuccess(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    setSettings({
      ...settings,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSaveSettings = async (section: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Validate password change if in security section
      if (section === "security" && settings.newPassword) {
        if (settings.newPassword.length < 8) {
          throw new Error("Password must be at least 8 characters long");
        }

        if (settings.newPassword !== settings.confirmPassword) {
          throw new Error("New passwords do not match");
        }

        if (!settings.currentPassword) {
          throw new Error("Current password is required");
        }
      }

      // Apply appearance settings
      if (section === "appearance") {
        // Update all appearance settings at once
        updateAppearance({
          mode: settings.darkMode ? "dark" : "light",
          compactMode: settings.compactMode,
          fontSize: settings.fontSize,
          showProfileInfo: settings.showProfileInfo,
          shareActivity: settings.shareActivity,
          language: settings.language,
        });

        // Apply theme mode immediately
        document.documentElement.dataset.theme = settings.darkMode
          ? "dark"
          : "light";

        // Apply font size immediately
        document.documentElement.dataset.fontSize = settings.fontSize;

        // Apply compact mode immediately
        document.documentElement.dataset.compactMode = settings.compactMode
          ? "true"
          : "false";
      }

      // Success
      setSuccess(
        `${section.charAt(0).toUpperCase() + section.slice(1)} settings updated successfully`,
      );
      toast.success(
        `${section.charAt(0).toUpperCase() + section.slice(1)} settings updated successfully!`,
      );

      // Clear password fields after successful update
      if (section === "security") {
        setSettings((prev) => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to update settings. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="warning">
          You need to be logged in to access settings.
        </Alert>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        py: 8,
        px: 2,
        bgcolor: "background.default",
      }}
    >
      <Container maxWidth="lg">
        <Paper
          elevation={2}
          sx={{
            borderRadius: 2,
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            overflow: "hidden",
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: "linear-gradient(to right, #000000, #333333)",
            },
          }}
        >
          <Box sx={{ p: 3, borderBottom: "1px solid rgba(0, 0, 0, 0.1)" }}>
            <Typography variant="h4" fontWeight="600">
              Account Settings
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              Manage your account preferences and security settings
            </Typography>
          </Box>

          <Box sx={{ width: "100%" }}>
            <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                aria-label="settings tabs"
              >
                <Tab
                  label="Security"
                  icon={<SecurityIcon />}
                  iconPosition="start"
                />
                <Tab
                  label="Notifications"
                  icon={<NotificationsIcon />}
                  iconPosition="start"
                />
                <Tab
                  label="Appearance"
                  icon={<PaletteIcon />}
                  iconPosition="start"
                />
                <Tab
                  label="Language"
                  icon={<LanguageIcon />}
                  iconPosition="start"
                />
              </Tabs>
            </Box>

            {/* Security Settings */}
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ px: 3 }}>
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

                <Typography variant="h6" gutterBottom>
                  Change Password
                </Typography>

                <Grid container spacing={3} component="div">
                  <Grid component="div" size={[12, null, 6]}>
                    <TextField
                      fullWidth
                      label="Current Password"
                      name="currentPassword"
                      type={showPassword ? "text" : "password"}
                      value={settings.currentPassword}
                      onChange={handleChange}
                      margin="normal"
                      variant="outlined"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={() => setShowPassword(!showPassword)}
                              edge="end"
                            >
                              {showPassword ? (
                                <VisibilityOffIcon />
                              ) : (
                                <VisibilityIcon />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>

                <Grid container spacing={3} component="div">
                  <Grid component="div" size={[12, null, 6]}>
                    <TextField
                      fullWidth
                      label="New Password"
                      name="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={settings.newPassword}
                      onChange={handleChange}
                      margin="normal"
                      variant="outlined"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={() =>
                                setShowNewPassword(!showNewPassword)
                              }
                              edge="end"
                            >
                              {showNewPassword ? (
                                <VisibilityOffIcon />
                              ) : (
                                <VisibilityIcon />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>

                  <Grid component="div" size={[12, null, 6]}>
                    <TextField
                      fullWidth
                      label="Confirm New Password"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={settings.confirmPassword}
                      onChange={handleChange}
                      margin="normal"
                      variant="outlined"
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={() =>
                                setShowConfirmPassword(!showConfirmPassword)
                              }
                              edge="end"
                            >
                              {showConfirmPassword ? (
                                <VisibilityOffIcon />
                              ) : (
                                <VisibilityIcon />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 4 }} />

                <Typography variant="h6" gutterBottom>
                  Two-Factor Authentication
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.twoFactorEnabled}
                      onChange={handleChange}
                      name="twoFactorEnabled"
                      color="primary"
                    />
                  }
                  label="Enable Two-Factor Authentication"
                />

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1, mb: 4 }}
                >
                  Enabling two-factor authentication adds an extra layer of
                  security to your account. You'll be required to enter a
                  verification code from your mobile device when logging in.
                </Typography>

                <Button
                  variant="contained"
                  color="primary"
                  startIcon={
                    loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <SaveIcon />
                    )
                  }
                  onClick={() => handleSaveSettings("security")}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Security Settings"}
                </Button>
              </Box>
            </TabPanel>

            {/* Notification Settings */}
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ px: 3 }}>
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

                <List>
                  <ListItem>
                    <ListItemText
                      primary="Email Notifications"
                      secondary="Receive email updates about your account and files"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        edge="end"
                        name="emailNotifications"
                        checked={settings.emailNotifications}
                        onChange={handleChange}
                        color="primary"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>

                  <Divider variant="inset" component="li" />

                  <ListItem>
                    <ListItemText
                      primary="Download Notifications"
                      secondary="Receive notifications when someone downloads your shared files"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        edge="end"
                        name="downloadNotifications"
                        checked={settings.downloadNotifications}
                        onChange={handleChange}
                        color="primary"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>

                  <Divider variant="inset" component="li" />

                  <ListItem>
                    <ListItemText
                      primary="Security Alerts"
                      secondary="Receive notifications about security-related activity on your account"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        edge="end"
                        name="securityAlerts"
                        checked={settings.securityAlerts}
                        onChange={handleChange}
                        color="primary"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>

                <Box sx={{ mt: 4 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={
                      loading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <SaveIcon />
                      )
                    }
                    onClick={() => handleSaveSettings("notifications")}
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save Notification Settings"}
                  </Button>
                </Box>
              </Box>
            </TabPanel>

            {/* Appearance Settings */}
            <TabPanel value={tabValue} index={2}>
              <Box sx={{ px: 3 }}>
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

                <List>
                  <ListItem>
                    <ListItemText
                      primary="Dark Mode"
                      secondary="Switch between light and dark themes"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        edge="end"
                        name="darkMode"
                        checked={settings.darkMode}
                        onChange={handleChange}
                        color="primary"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>

                  <Divider variant="inset" component="li" />

                  <ListItem>
                    <ListItemText
                      primary="Compact Mode"
                      secondary="Reduce spacing between elements for a more compact view"
                    />
                    <ListItemSecondaryAction>
                      <Switch
                        edge="end"
                        name="compactMode"
                        checked={settings.compactMode}
                        onChange={handleChange}
                        color="primary"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>

                  <Divider variant="inset" component="li" />

                  <ListItem>
                    <ListItemText
                      primary="Font Size"
                      secondary="Adjust the text size throughout the application"
                    />
                    <ListItemSecondaryAction>
                      <TextField
                        select
                        name="fontSize"
                        value={settings.fontSize}
                        onChange={handleChange}
                        SelectProps={{
                          native: true,
                        }}
                        variant="outlined"
                        size="small"
                        sx={{ width: 120 }}
                      >
                        <option value="small">Small</option>
                        <option value="medium">Medium</option>
                        <option value="large">Large</option>
                      </TextField>
                    </ListItemSecondaryAction>
                  </ListItem>
                </List>

                <Box sx={{ mt: 4 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={
                      loading ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        <SaveIcon />
                      )
                    }
                    onClick={() => handleSaveSettings("appearance")}
                    disabled={loading}
                  >
                    {loading ? "Saving..." : "Save Appearance Settings"}
                  </Button>
                </Box>
              </Box>
            </TabPanel>

            {/* Language Settings */}
            <TabPanel value={tabValue} index={3}>
              <Box sx={{ px: 3 }}>
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

                <Typography variant="h6" gutterBottom>
                  Language Preferences
                </Typography>

                <TextField
                  select
                  fullWidth
                  name="language"
                  label="Select Language"
                  value={settings.language}
                  onChange={handleChange}
                  SelectProps={{
                    native: true,
                  }}
                  variant="outlined"
                  margin="normal"
                  sx={{ maxWidth: 400 }}
                >
                  <option value="English">English</option>
                  <option value="Spanish">Spanish (Español)</option>
                  <option value="French">French (Français)</option>
                  <option value="German">German (Deutsch)</option>
                  <option value="Japanese">Japanese (日本語)</option>
                  <option value="Chinese">Chinese (中文)</option>
                </TextField>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 2, mb: 4 }}
                >
                  This setting changes the language across the entire
                  application. Some content like file names and user-generated
                  content will remain in their original language.
                </Typography>

                <Button
                  variant="contained"
                  color="primary"
                  startIcon={
                    loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <SaveIcon />
                    )
                  }
                  onClick={() => handleSaveSettings("language")}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Language Settings"}
                </Button>
              </Box>
            </TabPanel>
          </Box>
        </Paper>

        {/* Danger Zone */}
        <Paper
          elevation={2}
          sx={{
            mt: 4,
            p: 3,
            borderRadius: 2,
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            border: "1px solid rgba(255, 0, 0, 0.2)",
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background: "linear-gradient(to right, #ff0000, #ff4444)",
            },
          }}
        >
          <Typography variant="h6" color="error" gutterBottom>
            Danger Zone
          </Typography>

          <Grid container spacing={3} alignItems="center" component="div">
            <Grid component="div" size={[12, 8]}>
              <Typography variant="body1" fontWeight="500">
                Reset Account
              </Typography>
              <Typography variant="body2" color="text.secondary">
                This will reset your account settings to default and clear your
                preferences. Your files and account information will remain
                intact.
              </Typography>
            </Grid>

            <Grid component="div" size={[12, 4]} sx={{ textAlign: { sm: "right" } }}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<LockResetIcon />}
                onClick={() => {
                  toast.warning("This feature is not yet implemented.", {
                    position: "top-center",
                  });
                }}
              >
                Reset Account
              </Button>
            </Grid>

            <Grid component="div" size={[12]}>
              <Divider />
            </Grid>

            <Grid component="div" size={[12, 8]}>
              <Typography variant="body1" fontWeight="500">
                Delete Account
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Permanently delete your account and all associated data. This
                action is irreversible and will remove all your files and
                personal information.
              </Typography>
            </Grid>

            <Grid component="div" size={[12, 4]} sx={{ textAlign: { sm: "right" } }}>
              <Button
                variant="contained"
                color="error"
                onClick={() => {
                  toast.error(
                    "For security reasons, please contact support to delete your account.",
                    { position: "top-center" },
                  );
                }}
              >
                Delete Account
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};

export default Settings;
