import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Stack,
  useTheme,
  alpha,
  Tabs,
  Tab,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { fileApi } from "../../services/file-share-service";
import { FileShare } from "../../types";
import { AxiosError } from "axios";
import {
  CloudUpload,
  FolderOpen,
  Search,
  CloudDownload,
  Link as LinkIcon,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { getFileTypeIcon } from "../../utils/fileUtils";
import FileSearch from "../files/FileSearch";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const Dashboard: React.FC = () => {
  const [recentFiles, setRecentFiles] = useState<FileShare[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalDownloads: 0,
    totalSize: 0,
    popularFiles: [] as FileShare[],
  });
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();

  const fetchDashboardData = useCallback(async () => {
    // Don't attempt to fetch data if user isn't logged in
    if (!user) {
      return;
    }

    try {
      const files = await fileApi.getUserFiles();

      // Sort by creation date, most recent first
      const sorted = files.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      // Take only the most recent 4 files
      setRecentFiles(sorted.slice(0, 4));

      // Calculate total size
      const totalSize = files.reduce((sum, file) => sum + (file.size || 0), 0);

      // Get popular files (most downloaded)
      const popularFiles = [...files]
        .sort((a, b) => (b.currentDownloads || 0) - (a.currentDownloads || 0))
        .slice(0, 3);

      setStats({
        totalFiles: files.length,
        totalDownloads: files.reduce(
          (sum, file) => sum + (file.currentDownloads || 0),
          0,
        ),
        totalSize,
        popularFiles,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // Don't show error messages for auth errors, they're handled by the interceptor
      if (!(error instanceof AxiosError && error.response?.status === 401)) {
        // You can add a toast or other error notification here
      }
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user, fetchDashboardData]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getRandomGreeting = () => {
    const greetings = [
      "Welcome back",
      "Hello",
      "Good to see you",
      "Greetings",
      "Hey there",
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Would show a success notification here in a real implementation
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ pb: 8 }}>
      {/* Welcome Section */}
      <Box
        sx={{
          mt: 4,
          mb: 6,
          p: 3,
          borderRadius: 2,
          background:
            theme.palette.mode === "dark"
              ? `linear-gradient(45deg, ${alpha(theme.palette.primary.dark, 0.8)} 0%, ${alpha(theme.palette.primary.main, 0.4)} 100%)`
              : `linear-gradient(45deg, ${alpha(theme.palette.primary.light, 0.8)} 0%, ${alpha(theme.palette.primary.main, 0.4)} 100%)`,
          color: theme.palette.primary.contrastText,
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography
              variant="h4"
              component="h1"
              gutterBottom
              fontWeight="bold"
            >
              {getRandomGreeting()}, {user?.username || "Friend"}!
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
              Here's an overview of your file sharing activities
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Stack
              direction="row"
              spacing={4}
              justifyContent={{ xs: "flex-start", md: "flex-end" }}
            >
              <Box textAlign="center">
                <Typography variant="h4" fontWeight="bold">
                  {stats.totalFiles}
                </Typography>
                <Typography variant="body2">Files</Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h4" fontWeight="bold">
                  {stats.totalDownloads}
                </Typography>
                <Typography variant="body2">Downloads</Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h4" fontWeight="bold">
                  {formatFileSize(stats.totalSize)}
                </Typography>
                <Typography variant="body2">Storage Used</Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      {/* Quick Actions */}
      <Typography variant="h5" gutterBottom fontWeight="medium" sx={{ mb: 3 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              textAlign: "center",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s ease-in-out",
              border: "1px solid",
              borderColor: "divider",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: theme.shadows[4],
                borderColor: "primary.main",
              },
            }}
            onClick={() => navigate("/upload")}
          >
            <Box
              sx={{
                p: 1.5,
                borderRadius: "50%",
                mb: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: "primary.main",
              }}
            >
              <CloudUpload sx={{ fontSize: 36 }} />
            </Box>
            <Typography variant="h6" gutterBottom fontWeight="medium">
              Upload Files
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Share files with custom settings
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              textAlign: "center",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s ease-in-out",
              border: "1px solid",
              borderColor: "divider",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: theme.shadows[4],
                borderColor: "primary.main",
              },
            }}
            onClick={() => navigate("/my-files")}
          >
            <Box
              sx={{
                p: 1.5,
                borderRadius: "50%",
                mb: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: "primary.main",
              }}
            >
              <FolderOpen sx={{ fontSize: 36 }} />
            </Box>
            <Typography variant="h6" gutterBottom fontWeight="medium">
              My Files
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View and manage your files
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              textAlign: "center",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s ease-in-out",
              border: "1px solid",
              borderColor: "divider",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: theme.shadows[4],
                borderColor: "primary.main",
              },
            }}
            onClick={() => setTabValue(1)}
          >
            <Box
              sx={{
                p: 1.5,
                borderRadius: "50%",
                mb: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: "primary.main",
              }}
            >
              <Search sx={{ fontSize: 36 }} />
            </Box>
            <Typography variant="h6" gutterBottom fontWeight="medium">
              Search Files
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Find your files quickly
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Tabs Section */}
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Recent Files" />
          <Tab label="Search Files" />
          <Tab label="Popular Files" />
        </Tabs>
      </Box>

      {/* Recent Files Tab */}
      <TabPanel value={tabValue} index={0}>
        <Grid container spacing={3}>
          {recentFiles.map((file) => (
            <Grid item xs={12} sm={6} md={3} key={file.id}>
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  border: "1px solid",
                  borderColor: "divider",
                  "&:hover": {
                    borderColor: "primary.main",
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: "primary.main",
                        mr: 2,
                      }}
                    >
                      {React.createElement(getFileTypeIcon(file.fileName))}
                    </Box>
                    <Typography variant="subtitle1" noWrap>
                      {file.fileName}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Created {formatDate(file.createdAt)}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={formatFileSize(file.size || 0)}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`${file.currentDownloads || 0} downloads`}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<CloudDownload />}
                    onClick={() => navigate(`/files/${file.id}`)}
                  >
                    Download
                  </Button>
                  <Button
                    size="small"
                    startIcon={<LinkIcon />}
                    onClick={() =>
                      copyToClipboard(
                        `${window.location.origin}/share/${file.id}`,
                      )
                    }
                  >
                    Copy Link
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      {/* Search Files Tab */}
      <TabPanel value={tabValue} index={1}>
        <FileSearch />
      </TabPanel>

      {/* Popular Files Tab */}
      <TabPanel value={tabValue} index={2}>
        <Grid container spacing={3}>
          {stats.popularFiles.map((file) => (
            <Grid item xs={12} sm={6} md={4} key={file.id}>
              <Card
                elevation={0}
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  border: "1px solid",
                  borderColor: "divider",
                  "&:hover": {
                    borderColor: "primary.main",
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: "primary.main",
                        mr: 2,
                      }}
                    >
                      {React.createElement(getFileTypeIcon(file.fileName))}
                    </Box>
                    <Typography variant="subtitle1" noWrap>
                      {file.fileName}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Created {formatDate(file.createdAt)}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={formatFileSize(file.size || 0)}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={`${file.currentDownloads || 0} downloads`}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  </Stack>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<CloudDownload />}
                    onClick={() => navigate(`/files/${file.id}`)}
                  >
                    Download
                  </Button>
                  <Button
                    size="small"
                    startIcon={<LinkIcon />}
                    onClick={() =>
                      copyToClipboard(
                        `${window.location.origin}/share/${file.id}`,
                      )
                    }
                  >
                    Copy Link
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>
    </Container>
  );
};

export default Dashboard;
