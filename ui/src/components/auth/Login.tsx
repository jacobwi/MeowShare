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
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Person,
  LockOutlined,
  AdminPanelSettings,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import config from "../../config/env";
import { toast } from "react-toastify";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validation states
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

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
      toast.success("Successfully logged in!");
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
    setUsername("admin@example.com");
    setPassword("Admin123!");
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
          "linear-gradient(to bottom, rgba(245,245,245,0.8), rgba(255,255,255,0.9))",
      }}
    >
      <Container maxWidth="sm" sx={{ width: "100%" }}>
        <Paper
          elevation={2}
          sx={{
            p: 5,
            width: "100%",
            borderRadius: 2,
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            position: "relative",
            overflow: "hidden",
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
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography component="h1" variant="h4" fontWeight="600" mb={1}>
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
                borderRadius: 1,
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
                  sx={{ borderRadius: 1.5 }}
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
              label="Username"
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
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Person color="action" />
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
              sx={{ mb: 4 }}
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

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{
                py: 1.5,
                mb: 2,
                borderRadius: 1.5,
                position: "relative",
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

            <Typography
              variant="body2"
              textAlign="right"
              sx={{
                mb: 3,
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
      </Container>
    </Box>
  );
};

export default Login;
