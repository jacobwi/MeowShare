import React, { useEffect, Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { CssBaseline, Box, ThemeProvider, Grid } from "@mui/material";
import { Slide } from "react-toastify";

// Context Providers
import {
  AuthProvider,
  ConfigProvider,
  useConfig,
  ThemeProvider as CustomThemeProvider,
  useTheme,
} from "./context";

// Theme
import { createAppTheme } from "./theme";

// Services
import { initializeDebugInterceptor } from "./services/api";

// Common Components
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";
import ProtectedRoute from "./components/common/ProtectedRoute";
import NotFound from "./components/common/NotFound";

// Auth Components
import Login from "./components/auth/Login";
import Register from "./components/auth/Register";

// Pages
import Home from "./components/home/Home";
import Dashboard from "./components/dashboard/Dashboard";
import FileUpload from "./components/files/FileUpload";
import FileList from "./components/files/FileList";
import FileDetails from "./components/files/FileDetails";
import Profile from "./components/profile/Profile";
import Settings from "./components/settings/Settings";
import AdminPanel from "./components/admin/AdminPanel";

// Debug Components (lazy loaded)
const DebugPanel = React.lazy(() => import("./components/debug/DebugPanel"));

import { DebugHelper } from "./components/debug/debug-helper";

// App content with theme
const AppContent: React.FC = () => {
  const { mode, fontSize, compactMode } = useTheme();
  const { config } = useConfig();

  // Initialize debug interceptor with config callback
  useEffect(() => {
    console.log(
      "[App] Initializing debug interceptor with DEBUG_MODE:",
      config.DEBUG_MODE,
    );
    initializeDebugInterceptor(() => config.DEBUG_MODE);
  }, [config.DEBUG_MODE]);

  // Create theme based on current mode and appearance settings
  const theme = createAppTheme(
    mode === "system" ? "light" : mode,
    fontSize,
    compactMode,
  );

  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <Router>
          <CssBaseline />
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              minHeight: "100vh",
            }}
          >
            <Navbar />
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                width: "100%",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/upload" element={<FileUpload />} />
                  <Route path="/my-files" element={<FileList />} />
                  <Route path="/files/:id" element={<FileDetails />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/admin/*" element={<AdminPanel />} />
                </Route>

                {/* Debug Route - Protected and only in debug mode */}
                {config.DEBUG_MODE && (
                  <Route element={<ProtectedRoute />}>
                    <Route
                      path="/debug"
                      element={
                        <Suspense
                          fallback={
                            <Box sx={{ p: 3 }}>Loading Debug Panel...</Box>
                          }
                        >
                          <Box sx={{ p: 3 }}>
                            <DebugHelper />
                            <DebugPanel />
                          </Box>
                        </Suspense>
                      }
                    />
                  </Route>
                )}

                {/* Redirect Dashboard to Home for non-authenticated users */}
                <Route
                  path="/dashboard"
                  element={<Navigate to="/login" replace />}
                />

                {/* 404 Page */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Box>
            <Footer />
          </Box>

          <ToastContainer
            position="bottom-right"
            autoClose={3000}
            hideProgressBar={true}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme={mode}
            transition={Slide}
            limit={1}
          />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

// Main App component with theme provider wrapper
const App: React.FC = () => {
  return (
    <ConfigProvider>
      <CustomThemeProvider>
        <AppContent />
      </CustomThemeProvider>
    </ConfigProvider>
  );
};

export default App;
