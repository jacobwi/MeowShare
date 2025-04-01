import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Chip,
  Tooltip,
} from "@mui/material";
import {
  Menu as MenuIcon,
  AccountCircle,
  ExitToApp,
} from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Navbar: React.FC = () => {
  const auth = useAuth();
  const {
    user,
    isAuthenticated,
    isImpersonating,
    impersonationStatus,
    logout,
    endImpersonation,
  } = auth;
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch {
      toast.error("Failed to logout");
    }
  };

  const handleEndImpersonation = async () => {
    try {
      await endImpersonation();
      toast.success("Impersonation ended successfully");
      navigate("/dashboard");
    } catch {
      toast.error("Failed to end impersonation");
    }
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          MeowShare
        </Typography>
        {isAuthenticated ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {isImpersonating && impersonationStatus && (
              <Tooltip
                title={`Impersonating ${impersonationStatus.impersonatedUser?.username}`}
              >
                <Chip
                  label="Impersonating"
                  color="warning"
                  sx={{ mr: 2 }}
                  onDelete={handleEndImpersonation}
                />
              </Tooltip>
            )}
            <Typography variant="body1" sx={{ mr: 2 }}>
              {user?.username}
            </Typography>
            <Button
              color="inherit"
              startIcon={<ExitToApp />}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Box>
        ) : (
          <Button
            color="inherit"
            startIcon={<AccountCircle />}
            onClick={() => navigate("/login")}
          >
            Login
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
