import React, { useEffect } from "react";
import { Box, Container, Typography, Button, Grid, Paper } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { CloudUpload, Security, Share } from "@mui/icons-material";
import config from "../../config/env";
import { useAuth } from "../../context/AuthContext";

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  return (
    <Box sx={{ width: "100%" }}>
      {/* Hero Section */}
      <Box
        sx={{
          bgcolor: "background.paper",
          pt: 8,
          pb: 6,
          borderBottom: "1px solid",
          borderColor: "divider",
          width: "100%",
        }}
      >
        <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 4, lg: 6 } }}>
          <Typography
            component="h1"
            variant="h2"
            align="center"
            color="text.primary"
            gutterBottom
            sx={{ fontWeight: 700 }}
          >
            {config.APP_NAME}
          </Typography>
          <Typography
            variant="h5"
            align="center"
            color="text.secondary"
            paragraph
            sx={{ maxWidth: "800px", mx: "auto", mb: 4 }}
          >
            Secure file sharing made simple. Upload, share, and manage your
            files with ease. Set expiration dates, download limits, and password
            protection for enhanced security.
          </Typography>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              gap: 2,
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="contained"
              color="primary"
              size="large"
              component={RouterLink}
              to="/login"
              sx={{ px: 4, py: 1.5 }}
            >
              Get Started
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="large"
              component={RouterLink}
              to="/register"
              sx={{ px: 4, py: 1.5 }}
            >
              Sign Up
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 8, width: "100%" }}>
        <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 4, lg: 6 } }}>
          <Typography
            variant="h3"
            component="h2"
            align="center"
            gutterBottom
            sx={{ mb: 6 }}
          >
            Key Features
          </Typography>

          <Grid container spacing={4}>
            {/* Feature 1 */}
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  border: "1px solid",
                  borderColor: "divider",
                  transition: "transform 0.2s",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: "0 10px 20px rgba(0,0,0,0.05)",
                  },
                }}
              >
                <CloudUpload
                  sx={{ fontSize: 60, color: "primary.main", mb: 2 }}
                />
                <Typography variant="h5" component="h3" gutterBottom>
                  Easy Uploads
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Upload files of any size with our simple interface or drag and
                  drop functionality. Large files are automatically handled with
                  chunked uploads.
                </Typography>
              </Paper>
            </Grid>

            {/* Feature 2 */}
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  border: "1px solid",
                  borderColor: "divider",
                  transition: "transform 0.2s",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: "0 10px 20px rgba(0,0,0,0.05)",
                  },
                }}
              >
                <Security sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
                <Typography variant="h5" component="h3" gutterBottom>
                  Enhanced Security
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Protect your files with passwords, expiration dates, and
                  download limits. You control who can access your files and for
                  how long.
                </Typography>
              </Paper>
            </Grid>

            {/* Feature 3 */}
            <Grid item xs={12} md={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center",
                  border: "1px solid",
                  borderColor: "divider",
                  transition: "transform 0.2s",
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: "0 10px 20px rgba(0,0,0,0.05)",
                  },
                }}
              >
                <Share sx={{ fontSize: 60, color: "primary.main", mb: 2 }} />
                <Typography variant="h5" component="h3" gutterBottom>
                  Seamless Sharing
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Generate custom URLs for your files to make sharing easier.
                  Track downloads and manage all your shared files from one
                  dashboard.
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Call to Action */}
      <Box
        sx={{
          bgcolor: "black",
          color: "white",
          py: 6,
          width: "100%",
        }}
      >
        <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 4, lg: 6 } }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h4" gutterBottom>
                Ready to start sharing?
              </Typography>
              <Typography variant="body1" sx={{ mb: { xs: 3, md: 0 } }}>
                Create your account today and enjoy secure file sharing with{" "}
                {config.APP_NAME}.
              </Typography>
            </Grid>
            <Grid
              item
              xs={12}
              md={4}
              sx={{ textAlign: { xs: "left", md: "right" } }}
            >
              <Button
                variant="outlined"
                color="inherit"
                size="large"
                component={RouterLink}
                to="/register"
                sx={{
                  borderColor: "white",
                  "&:hover": {
                    borderColor: "white",
                    bgcolor: "rgba(255,255,255,0.1)",
                  },
                }}
              >
                Sign Up Now
              </Button>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: "background.paper", py: 6, width: "100%" }}>
        <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 4, lg: 6 } }}>
          <Typography variant="body2" color="text.secondary" align="center">
            {new Date().getFullYear()} {config.APP_NAME}. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
