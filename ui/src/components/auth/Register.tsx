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
  Grid,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  useTheme,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email,
  LockOutlined,
  AlternateEmail,
  CheckCircleOutline,
} from "@mui/icons-material";
import { useAuth } from "../../context";
import config from "../../config/env";
import { toast } from "react-toastify";
import emailApi from "../../services/email-service";

const Register: React.FC = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  // Validation states
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [agreeToTermsError, setAgreeToTermsError] = useState("");

  const { register, isAuthenticated } = useAuth();
  const theme = useTheme();
  const navigate = useNavigate();

  // Registration steps
  const steps = ["Account Details", "Password Security", "Complete"];

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const validateEmail = (email: string) => {
    const re =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email.toLowerCase());
  };

  const validateStep = (step: number) => {
    let isValid = true;

    if (step === 0) {
      // Account details validation
      if (!username.trim()) {
        setUsernameError("Username is required");
        isValid = false;
      } else if (username.trim().length < 3) {
        setUsernameError("Username must be at least 3 characters");
        isValid = false;
      }

      if (!email.trim()) {
        setEmailError("Email is required");
        isValid = false;
      } else if (!validateEmail(email.trim())) {
        setEmailError("Please enter a valid email address");
        isValid = false;
      }
    } else if (step === 1) {
      // Password validation
      if (!password) {
        setPasswordError("Password is required");
        isValid = false;
      } else if (password.length < 6) {
        setPasswordError("Password must be at least 6 characters");
        isValid = false;
      }

      if (!confirmPassword) {
        setConfirmPasswordError("Please confirm your password");
        isValid = false;
      } else if (password !== confirmPassword) {
        setConfirmPasswordError("Passwords do not match");
        isValid = false;
      }

      if (!agreeToTerms) {
        setAgreeToTermsError("You must agree to the terms and conditions");
        isValid = false;
      }
    }

    return isValid;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const sendWelcomeEmail = async () => {
    try {
      // Check if we have a welcome template
      const templates = await emailApi.getTemplates();
      const welcomeTemplate = templates.find(
        (t) => t.name.toLowerCase() === "welcome",
      );

      if (welcomeTemplate) {
        // Send email with template
        await emailApi.sendWithTemplate(welcomeTemplate.id, email, {
          username: username,
          email: email,
          loginUrl: `${window.location.origin}/login`,
        });
      } else {
        // Send a simple welcome email
        await emailApi.sendEmail({
          to: email,
          subject: `Welcome to ${config.APP_NAME}!`,
          body: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Welcome to ${config.APP_NAME}, ${username}!</h2>
              <p>Thank you for registering with us. Your account has been created successfully.</p>
              <p>You can now sign in using your credentials:</p>
              <p><strong>Username:</strong> ${username}</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><a href="${window.location.origin}/login" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Sign In Now</a></p>
              <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
              <p>Best regards,<br>${config.APP_NAME} Team</p>
            </div>
          `,
          isHtml: true,
        });
      }
    } catch (error) {
      console.error("Failed to send welcome email:", error);
      // Don't show error to user - the registration was still successful
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(activeStep)) {
      return;
    }

    try {
      setError("");
      setLoading(true);
      await register(username.trim(), password, email.trim());

      // Try to send welcome email
      await sendWelcomeEmail();

      setRegistrationComplete(true);
      setActiveStep(2); // Move to completion step
      toast.success("Account created successfully!");
    } catch (err) {
      setError(
        "Failed to create account. Username or email may already be in use.",
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Password strength indicators
  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, text: "" };

    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;

    const strengthText = [
      "Very weak",
      "Weak",
      "Fair",
      "Good",
      "Strong",
      "Very strong",
    ][strength];

    return { strength, text: strengthText };
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthColor = [
    theme.palette.error.main, // very weak - red
    theme.palette.warning.main, // weak - orange
    theme.palette.warning.light, // fair - yellow
    theme.palette.success.light, // good - light green
    theme.palette.success.main, // strong - green
    theme.palette.success.dark, // very strong - dark green
  ][passwordStrength.strength];

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
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
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AlternateEmail color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (validateEmail(e.target.value.trim())) setEmailError("");
                }}
                error={!!emailError}
                helperText={emailError}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                id="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (e.target.value && e.target.value.length >= 6)
                    setPasswordError("");
                }}
                error={!!passwordError}
                helperText={
                  passwordError ||
                  (password && passwordStrength.text
                    ? `Password strength: ${passwordStrength.text}`
                    : "")
                }
                variant="outlined"
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
              {password && (
                <Box sx={{ mt: 1, mb: 2 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mt: 1 }}>
                    <Box
                      sx={{
                        height: 4,
                        flex: 1,
                        borderRadius: 2,
                        backgroundColor:
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.1)"
                            : "rgba(0,0,0,0.1)",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: `${(passwordStrength.strength / 5) * 100}%`,
                          backgroundColor: strengthColor,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              )}
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (e.target.value && e.target.value === password)
                    setConfirmPasswordError("");
                }}
                error={!!confirmPasswordError}
                helperText={confirmPasswordError}
                variant="outlined"
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
                        onClick={handleToggleConfirmPasswordVisibility}
                        edge="end"
                      >
                        {showConfirmPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={agreeToTerms}
                    onChange={(e) => {
                      setAgreeToTerms(e.target.checked);
                      if (e.target.checked) setAgreeToTermsError("");
                    }}
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2">
                    I agree to the{" "}
                    <Link component={RouterLink} to="/terms">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link component={RouterLink} to="/privacy">
                      Privacy Policy
                    </Link>
                  </Typography>
                }
              />
              {agreeToTermsError && (
                <Typography variant="caption" color="error">
                  {agreeToTermsError}
                </Typography>
              )}
            </Grid>
          </Grid>
        );
      case 2:
        return (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Avatar
              sx={{
                m: "0 auto",
                width: 80,
                height: 80,
                bgcolor: "success.main",
                mb: 2,
              }}
            >
              <CheckCircleOutline sx={{ fontSize: 50 }} />
            </Avatar>
            <Typography variant="h5" gutterBottom>
              Registration Complete!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Your account has been created successfully.
              {email &&
                " We've sent you a welcome email with more information."}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => navigate("/login")}
              sx={{ mt: 2 }}
            >
              Go to Login
            </Button>
          </Box>
        );
      default:
        return null;
    }
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
      }}
    >
      <Container maxWidth="md" sx={{ width: "100%" }}>
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
              Create Your Account 🐱
            </Typography>
            <Typography color="text.secondary" variant="body1">
              Join {config.APP_NAME} to start sharing files securely
            </Typography>
          </Box>

          <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

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

          <Box component="form" onSubmit={handleSubmit} noValidate>
            {renderStepContent(activeStep)}

            {activeStep !== steps.length - 1 && (
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}
              >
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  sx={{ mr: 1 }}
                >
                  Back
                </Button>
                <Box sx={{ flex: "1 1 auto" }} />
                {activeStep === steps.length - 2 ? (
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
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
                        <span style={{ opacity: 0.5 }}>
                          Creating Account...
                        </span>
                      </>
                    ) : (
                      "Complete Registration"
                    )}
                  </Button>
                ) : (
                  <Button variant="contained" onClick={handleNext}>
                    Next
                  </Button>
                )}
              </Box>
            )}

            {!registrationComplete && (
              <>
                <Divider sx={{ my: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    OR
                  </Typography>
                </Divider>

                <Typography variant="body2" textAlign="center" sx={{ mt: 2 }}>
                  Already have an account?{" "}
                  <Link
                    component={RouterLink}
                    to="/login"
                    sx={{
                      fontWeight: 600,
                      textDecoration: "none",
                      "&:hover": {
                        textDecoration: "underline",
                      },
                    }}
                  >
                    Sign In
                  </Link>
                </Typography>
              </>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register;
