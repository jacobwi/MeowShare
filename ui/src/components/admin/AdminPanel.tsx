import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Divider,
  Alert,
} from "@mui/material";
import {
  Settings as SettingsIcon,
  People as PeopleIcon,
  FileCopy as FileCopyIcon,
  Email as EmailIcon,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import AppConfigPanel from "./AppConfigPanel";
import UserManagementPanel from "./UserManagementPanel";
import FileManagementPanel from "./FileManagementPanel";
import EmailConfigPanel from "./EmailConfigPanel";

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
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `admin-tab-${index}`,
    "aria-controls": `admin-tabpanel-${index}`,
  };
};

const AdminPanel: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { mode } = useTheme();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Check if user is authorized (has Admin role)
  const isAdmin = user?.role === "Admin";

  if (!isAuthenticated || !isAdmin) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="error">
          You do not have permission to access the admin panel.
        </Alert>
      </Container>
    );
  }

  // Background styles based on theme mode
  const backgroundStyle =
    mode === "dark"
      ? "linear-gradient(to bottom, rgba(30,30,30,0.8), rgba(35,35,35,0.9))"
      : "linear-gradient(to bottom, rgba(250,250,250,0.8), rgba(255,255,255,0.9))";

  return (
    <Box
      sx={{
        width: "100%",
        py: 4,
        px: 2,
        background: backgroundStyle,
      }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          fontWeight="bold"
          sx={{
            textAlign: { xs: "center", sm: "left" },
            mb: 3,
            position: "relative",
            "&::after": {
              content: '""',
              position: "absolute",
              bottom: -8,
              left: { xs: "50%", sm: 0 },
              transform: { xs: "translateX(-50%)", sm: "none" },
              width: { xs: "80px", sm: "100px" },
              height: "4px",
              bgcolor: "primary.main",
              borderRadius: "2px",
            },
          }}
        >
          Admin Panel
        </Typography>

        <Paper
          elevation={2}
          sx={{
            borderRadius: 2,
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            overflow: "hidden",
          }}
        >
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="admin tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab
                label="App Configuration"
                icon={<SettingsIcon />}
                iconPosition="start"
                {...a11yProps(0)}
                sx={{ minHeight: 64 }}
              />
              <Tab
                label="User Management"
                icon={<PeopleIcon />}
                iconPosition="start"
                {...a11yProps(1)}
                sx={{ minHeight: 64 }}
              />
              <Tab
                label="File Management"
                icon={<FileCopyIcon />}
                iconPosition="start"
                {...a11yProps(2)}
                sx={{ minHeight: 64 }}
              />
              <Tab
                label="Email Settings"
                icon={<EmailIcon />}
                iconPosition="start"
                {...a11yProps(3)}
                sx={{ minHeight: 64 }}
              />
            </Tabs>
          </Box>
          <Divider />

          <TabPanel value={tabValue} index={0}>
            <AppConfigPanel />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <UserManagementPanel />
          </TabPanel>
          <TabPanel value={tabValue} index={2}>
            <FileManagementPanel />
          </TabPanel>
          <TabPanel value={tabValue} index={3}>
            <EmailConfigPanel />
          </TabPanel>
        </Paper>
      </Container>
    </Box>
  );
};

export default AdminPanel;
