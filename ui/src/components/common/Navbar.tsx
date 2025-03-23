import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
  ListItemIcon,
  Tooltip,
  Chip,
} from "@mui/material";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useConfig } from "../../context/ConfigContext";
import { useTheme as useMuiTheme } from "@mui/material/styles";
import { useTheme as useCustomTheme } from "../../context/ThemeContext";
import {
  Menu as MenuIcon,
  Dashboard,
  CloudUpload,
  Folder,
  Person,
  Settings,
  Logout,
  AdminPanelSettings,
  BugReport,
  Brightness4,
  Brightness7,
  ExitToApp,
} from "@mui/icons-material";
import defaultEnvConfig from "../../config/env";
import { toast } from "react-toastify";

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout, isImpersonating, endImpersonation } =
    useAuth();
  const { config } = useConfig();
  const navigate = useNavigate();
  const muiTheme = useMuiTheme();
  const { mode, toggleTheme } = useCustomTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down("md"));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [userMenuAnchorEl, setUserMenuAnchorEl] = useState<null | HTMLElement>(
    null,
  );
  const [isDebugMode, setIsDebugMode] = useState<boolean>(false);

  // Check if user is admin
  const isAdmin = user?.role === "Admin";

  // Check if debug mode is enabled
  useEffect(() => {
    setIsDebugMode(config.DEBUG_MODE as boolean);
    // Log to verify config values
    // console.log("Config values:", {
    //   appName: config.APP_NAME,
    //   appVersion: config.APP_VERSION,
    //   envVersion: defaultEnvConfig.APP_VERSION,
    //   debugMode: config.DEBUG_MODE,
    // });
  }, [config.DEBUG_MODE, config.APP_NAME, config.APP_VERSION]);

  // Reset menu state whenever authenticated state changes
  useEffect(() => {
    setUserMenuAnchorEl(null);
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setUserMenuAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchorEl(null);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    handleMenuClose();
    handleUserMenuClose();
  };

  const handleEndImpersonation = async () => {
    try {
      await endImpersonation();
      navigate("/admin/users");
      toast.success("Impersonation ended, returned to admin account");
    } catch (error) {
      console.error("Error ending impersonation:", error);
      toast.error("Failed to end impersonation");
    }
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor:
          mode === "dark"
            ? "rgba(30, 30, 30, 0.8)"
            : "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid",
        borderColor: "divider",
        color: "text.primary",
      }}
    >
      <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3, md: 4, lg: 6 } }}>
        <Toolbar disableGutters sx={{ py: 0.5, minHeight: "48px" }}>
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              fontWeight: 600,
              fontSize: "1.2rem",
              color: "text.primary",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              letterSpacing: "-0.5px",
            }}
          >
            {config.APP_NAME || defaultEnvConfig.APP_NAME}
          </Typography>

          {/* Version tag */}
          <Typography
            variant="caption"
            sx={{
              ml: 1,
              px: 1,
              py: 0.5,
              borderRadius: 1,
              fontSize: "0.65rem",
              fontWeight: "bold",
              bgcolor:
                mode === "dark"
                  ? "rgba(255, 255, 255, 0.1)"
                  : "rgba(0, 0, 0, 0.08)",
              color:
                mode === "dark"
                  ? "rgba(255, 255, 255, 0.7)"
                  : "rgba(0, 0, 0, 0.6)",
            }}
          >
            {config.APP_VERSION || defaultEnvConfig.APP_VERSION}
          </Typography>

          <Box sx={{ flexGrow: 1 }} />

          {/* Impersonation indicator and button */}
          {isAuthenticated && isImpersonating && (
            <Chip
              label={`Impersonating: ${user?.username}`}
              color="secondary"
              size="small"
              icon={<ExitToApp fontSize="small" />}
              onClick={handleEndImpersonation}
              sx={{
                mr: 2,
                fontWeight: 500,
                "& .MuiChip-icon": { ml: 0.5 },
                cursor: "pointer",
              }}
            />
          )}

          {/* Theme Toggle Button - visible on both mobile and desktop */}
          <Tooltip
            title={`Switch to ${mode === "light" ? "dark" : "light"} mode`}
          >
            <IconButton
              onClick={toggleTheme}
              color="inherit"
              sx={{
                mr: 1,
                "&:hover": {
                  bgcolor:
                    mode === "dark"
                      ? "rgba(255, 255, 255, 0.08)"
                      : "rgba(0, 0, 0, 0.04)",
                },
              }}
            >
              {mode === "light" ? <Brightness4 /> : <Brightness7 />}
            </IconButton>
          </Tooltip>

          {isMobile ? (
            <>
              <IconButton
                edge="end"
                color="inherit"
                aria-label="menu"
                onClick={handleMenuOpen}
                sx={{ p: 0.5 }}
              >
                <MenuIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                PaperProps={{
                  elevation: 0,
                  sx: {
                    overflow: "visible",
                    filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.05))",
                    mt: 1.5,
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "divider",
                  },
                }}
              >
                {isAuthenticated ? (
                  <>
                    <MenuItem onClick={() => handleNavigation("/dashboard")}>
                      <ListItemIcon>
                        <Dashboard fontSize="small" />
                      </ListItemIcon>
                      Dashboard
                    </MenuItem>
                    <MenuItem onClick={() => handleNavigation("/upload")}>
                      <ListItemIcon>
                        <CloudUpload fontSize="small" />
                      </ListItemIcon>
                      Upload
                    </MenuItem>
                    <MenuItem onClick={() => handleNavigation("/my-files")}>
                      <ListItemIcon>
                        <Folder fontSize="small" />
                      </ListItemIcon>
                      My Files
                    </MenuItem>

                    {isAdmin && (
                      <>
                        <Divider />
                        <MenuItem onClick={() => handleNavigation("/admin")}>
                          <ListItemIcon>
                            <AdminPanelSettings fontSize="small" />
                          </ListItemIcon>
                          Admin Panel
                        </MenuItem>
                      </>
                    )}

                    {isDebugMode && (
                      <>
                        <Divider />
                        <MenuItem onClick={() => handleNavigation("/debug")}>
                          <ListItemIcon>
                            <BugReport fontSize="small" />
                          </ListItemIcon>
                          Debug Panel
                        </MenuItem>
                      </>
                    )}

                    <Divider />
                    <Box sx={{ px: 2, py: 1 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 1 }}
                      >
                        <Avatar
                          sx={{
                            width: 24,
                            height: 24,
                            mr: 1,
                            bgcolor: "primary.main",
                          }}
                        >
                          {user?.username
                            ? user.username.charAt(0).toUpperCase()
                            : "?"}
                        </Avatar>
                        <Typography variant="body2" fontWeight={500}>
                          {user?.username}
                        </Typography>
                      </Box>
                    </Box>
                    <MenuItem onClick={() => handleNavigation("/profile")}>
                      <ListItemIcon>
                        <Person fontSize="small" />
                      </ListItemIcon>
                      Profile
                    </MenuItem>
                    <MenuItem onClick={() => handleNavigation("/settings")}>
                      <ListItemIcon>
                        <Settings fontSize="small" />
                      </ListItemIcon>
                      Settings
                    </MenuItem>
                    {isImpersonating && (
                      <MenuItem onClick={handleEndImpersonation}>
                        <ListItemIcon>
                          <ExitToApp fontSize="small" />
                        </ListItemIcon>
                        End Impersonation
                      </MenuItem>
                    )}
                    <MenuItem onClick={handleLogout}>
                      <ListItemIcon>
                        <Logout fontSize="small" />
                      </ListItemIcon>
                      Logout
                    </MenuItem>
                  </>
                ) : (
                  <>
                    <MenuItem onClick={() => handleNavigation("/login")}>
                      Login
                    </MenuItem>
                    <MenuItem onClick={() => handleNavigation("/register")}>
                      Register
                    </MenuItem>
                  </>
                )}
              </Menu>
            </>
          ) : (
            <>
              {isAuthenticated ? (
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Box sx={{ display: "flex" }}>
                    <Button
                      color="inherit"
                      component={Link}
                      to="/dashboard"
                      sx={{
                        fontSize: "0.875rem",
                        textTransform: "none",
                        fontWeight: 500,
                        opacity: 0.85,
                        "&:hover": { opacity: 1, bgcolor: "transparent" },
                      }}
                    >
                      Dashboard
                    </Button>
                    <Button
                      color="inherit"
                      component={Link}
                      to="/upload"
                      sx={{
                        fontSize: "0.875rem",
                        textTransform: "none",
                        fontWeight: 500,
                        opacity: 0.85,
                        "&:hover": { opacity: 1, bgcolor: "transparent" },
                      }}
                    >
                      Upload
                    </Button>
                    <Button
                      color="inherit"
                      component={Link}
                      to="/my-files"
                      sx={{
                        fontSize: "0.875rem",
                        textTransform: "none",
                        fontWeight: 500,
                        opacity: 0.85,
                        "&:hover": { opacity: 1, bgcolor: "transparent" },
                      }}
                    >
                      Files
                    </Button>

                    {isAdmin && (
                      <Button
                        color="inherit"
                        component={Link}
                        to="/admin"
                        sx={{
                          fontSize: "0.875rem",
                          textTransform: "none",
                          fontWeight: 500,
                          opacity: 0.85,
                          "&:hover": { opacity: 1, bgcolor: "transparent" },
                        }}
                      >
                        Admin
                      </Button>
                    )}

                    {isDebugMode && (
                      <Button
                        color="inherit"
                        component={Link}
                        to="/debug"
                        sx={{
                          fontSize: "0.875rem",
                          textTransform: "none",
                          fontWeight: 500,
                          opacity: 0.85,
                          "&:hover": { opacity: 1, bgcolor: "transparent" },
                        }}
                      >
                        Debug
                      </Button>
                    )}
                  </Box>

                  <Box sx={{ ml: 2 }}>
                    <IconButton
                      onClick={handleUserMenuOpen}
                      size="small"
                      sx={{
                        ml: 1,
                        p: 0.5,
                        border: 1,
                        borderColor:
                          mode === "dark"
                            ? "rgba(255, 255, 255, 0.15)"
                            : "rgba(0, 0, 0, 0.08)",
                        borderRadius: "50%",
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          borderColor:
                            mode === "dark"
                              ? "rgba(255, 255, 255, 0.3)"
                              : "rgba(0, 0, 0, 0.2)",
                          backgroundColor:
                            mode === "dark"
                              ? "rgba(255, 255, 255, 0.05)"
                              : "rgba(0, 0, 0, 0.03)",
                        },
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor:
                            mode === "dark" ? "primary.dark" : "primary.light",
                          color:
                            mode === "dark"
                              ? "primary.contrastText"
                              : "background.paper",
                          fontWeight: "bold",
                          fontSize: "0.9rem",
                          boxShadow:
                            mode === "dark"
                              ? "none"
                              : "0 1px 2px rgba(0,0,0,0.1)",
                        }}
                      >
                        {user?.username
                          ? user.username.charAt(0).toUpperCase()
                          : "?"}
                      </Avatar>
                    </IconButton>
                    <Menu
                      anchorEl={userMenuAnchorEl}
                      open={Boolean(userMenuAnchorEl)}
                      onClose={handleUserMenuClose}
                      PaperProps={{
                        elevation: 0,
                        sx: {
                          overflow: "visible",
                          filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.05))",
                          mt: 1.5,
                          borderRadius: 1,
                          border: "1px solid",
                          borderColor: "divider",
                          minWidth: 200,
                        },
                      }}
                    >
                      <Box sx={{ px: 2, py: 1 }}>
                        <Typography
                          variant="body2"
                          fontWeight={600}
                          color="text.primary"
                        >
                          {user?.username}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {user?.email}
                        </Typography>
                      </Box>
                      <Divider />
                      <MenuItem onClick={() => handleNavigation("/profile")}>
                        <ListItemIcon>
                          <Person fontSize="small" />
                        </ListItemIcon>
                        Profile
                      </MenuItem>
                      <MenuItem onClick={() => handleNavigation("/settings")}>
                        <ListItemIcon>
                          <Settings fontSize="small" />
                        </ListItemIcon>
                        Settings
                      </MenuItem>
                      <Divider />
                      {isImpersonating && (
                        <MenuItem onClick={handleEndImpersonation}>
                          <ListItemIcon>
                            <ExitToApp fontSize="small" />
                          </ListItemIcon>
                          End Impersonation
                        </MenuItem>
                      )}
                      <MenuItem onClick={handleLogout}>
                        <ListItemIcon>
                          <Logout fontSize="small" />
                        </ListItemIcon>
                        Logout
                      </MenuItem>
                    </Menu>
                  </Box>
                </Box>
              ) : (
                <>
                  <Button
                    color="inherit"
                    component={Link}
                    to="/login"
                    variant="text"
                    sx={{
                      mr: 1,
                      fontSize: "0.875rem",
                      textTransform: "none",
                      fontWeight: 600,
                      opacity: 0.9,
                      "&:hover": { opacity: 1, bgcolor: "transparent" },
                    }}
                  >
                    Log in
                  </Button>
                  <Button
                    component={Link}
                    to="/register"
                    variant="contained"
                    color="primary"
                    sx={{
                      fontSize: "0.875rem",
                      textTransform: "none",
                      fontWeight: 600,
                      boxShadow: "none",
                      "&:hover": { boxShadow: "none" },
                    }}
                  >
                    Sign up
                  </Button>
                </>
              )}
            </>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
