import React, { useState, useEffect } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
  Alert,
  Link,
  Divider,
  InputAdornment,
  IconButton,
  CircularProgress,
  Tooltip,
  Checkbox,
  FormControlLabel,
  Fade,
  useTheme,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Person,
  LockOutlined,
  AdminPanelSettings,
  Email,
} from "@mui/icons-material";
import { useAuth } from "../../context";
import config from "../../config/env";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Validation states
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const { login, isAuthenticated } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // Check for stored credentials if remember me was checked previously
  useEffect(() => {
    const savedUsername = localStorage.getItem("rememberedUsername");
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  const validateForm = () => {
    let isValid = true;

    // Reset errors
    setUsernameError("");
    setPasswordError("");

    // Username validation
    if (!username.trim()) {
      setUsernameError("Username is required");
      isValid = false;
    }

    // Password validation
    if (!password) {
      setPasswordError("Password is required");
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setError("");
      setLoading(true);
      await login(username.trim(), password);

      // Save username if remember me is checked
      if (rememberMe) {
        localStorage.setItem("rememberedUsername", username.trim());
      } else {
        localStorage.removeItem("rememberedUsername");
      }
    } catch (err) {
      setError("Failed to login. Please check your credentials.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleDemoLogin = () => {
    setUsername(config.ADMIN_EMAIL);
    setPassword(config.ADMIN_PASSWORD);
    setUsernameError("");
    setPasswordError("");
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        py: 8,
        px: 2,
        background:
          theme.palette.mode === "dark"
            ? `linear-gradient(to bottom, ${theme.palette.background.default}, ${theme.palette.background.paper})`
            : `linear-gradient(to bottom, ${theme.palette.background.default}, ${theme.palette.background.paper})`,
        minHeight: "calc(100vh - 64px)",
      }}
    >
      <Container maxWidth="sm" sx={{ width: "100%" }}>
        <Fade in={true} timeout={800}>
          <Paper
            elevation={4}
            sx={{
              p: { xs: 3, sm: 5 },
              width: "100%",
              borderRadius: 3,
              boxShadow:
                theme.palette.mode === "dark"
                  ? `0 8px 32px ${theme.palette.common.black}40`
                  : `0 8px 32px ${theme.palette.common.black}10`,
              position: "relative",
              overflow: "hidden",
              transform: "translateY(0px)",
              transition: "transform 0.3s ease-in-out",
              "&:hover": {
                transform: "translateY(-5px)",
              },
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background: `linear-gradient(to right, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              },
            }}
          >
            <Box sx={{ textAlign: "center", mb: 4 }}>
              <Typography component="h1" variant="h4" fontWeight="bold" mb={1}>
                Welcome Back 🐱
              </Typography>
              <Typography color="text.secondary" variant="body1">
                Sign in to continue to {config.APP_NAME}
              </Typography>
            </Box>

            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  "& .MuiAlert-icon": {
                    alignItems: "center",
                  },
                }}
              >
                {error}
              </Alert>
            )}

            {/* Demo Mode Button */}
            {config.DEMO_MODE && (
              <Box sx={{ mb: 3, textAlign: "center" }}>
                <Tooltip title="Prefill with demo admin credentials">
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleDemoLogin}
                    startIcon={<AdminPanelSettings />}
                    sx={{
                      borderRadius: 2,
                      px: 3,
                      py: 1,
                      textTransform: "none",
                      borderWidth: 2,
                      "&:hover": {
                        borderWidth: 2,
                      },
                    }}
                  >
                    Use Demo Admin
                  </Button>
                </Tooltip>
              </Box>
            )}

            <Box component="form" onSubmit={handleSubmit} noValidate>
              <TextField
                fullWidth
                id="username"
                label="Username or Email"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (e.target.value.trim()) setUsernameError("");
                }}
                error={!!usernameError}
                helperText={usernameError}
                variant="outlined"
                sx={{
                  mb: 3,
                  ".MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {username.includes("@") ? (
                        <Email color="action" />
                      ) : (
                        <Person color="action" />
                      )}
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (e.target.value) setPasswordError("");
                }}
                error={!!passwordError}
                helperText={passwordError}
                variant="outlined"
                sx={{
                  mb: 2,
                  ".MuiOutlinedInput-root": {
                    borderRadius: 2,
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleTogglePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      color="primary"
                      size="small"
                    />
                  }
                  label={<Typography variant="body2">Remember me</Typography>}
                />

                <Typography
                  variant="body2"
                  sx={{
                    "& a": {
                      color: "primary.main",
                      textDecoration: "none",
                      fontWeight: 500,
                      "&:hover": {
                        textDecoration: "underline",
                      },
                    },
                  }}
                >
                  <Link component={RouterLink} to="/forgot-password">
                    Forgot password?
                  </Link>
                </Typography>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{
                  py: 1.5,
                  mb: 3,
                }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <CircularProgress
                      size={24}
                      sx={{
                        position: "absolute",
                        color: "primary.light",
                      }}
                    />
                    <span style={{ opacity: 0.5 }}>Signing in...</span>
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  OR
                </Typography>
              </Divider>

              <Typography variant="body2" textAlign="center" sx={{ mt: 2 }}>
                Don't have an account?{" "}
                <Link
                  component={RouterLink}
                  to="/register"
                  sx={{
                    fontWeight: 600,
                    textDecoration: "none",
                    "&:hover": {
                      textDecoration: "underline",
                    },
                  }}
                >
                  Sign Up
                </Link>
              </Typography>
            </Box>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default Login;
