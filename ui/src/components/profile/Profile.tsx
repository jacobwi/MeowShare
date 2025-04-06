import React, { useState, useEffect } from "react";
import { UserProfile, profileService } from "../../services/profile-service";
import {
  Box,
  Typography,
  Paper,
  Container,
  Grid,
  Avatar,
  TextField,
  Button,
  Skeleton,
  Alert,
  Card,
  CardContent,
  Fade,
  Divider,
  useTheme,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Badge as BadgeIcon,
  Storage as StorageIcon,
  Language as LanguageIcon,
  AccessTime as AccessTimeIcon,
  PhotoCamera as PhotoCameraIcon,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { useConfig } from "../../context/ConfigContext";
import { toast } from "react-toastify";

const Profile: React.FC = () => {
  const { user, isAuthenticated, updateUser } = useAuth();
  const { config } = useConfig();
  const theme = useTheme();
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Get the base API URL without /api suffix
  const baseApiUrl = config.API_URL.replace("/api", "");

  // Form state
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    username: user?.username || "",
    bio: user?.bio || "",
    avatar: null as File | null,
    lastActive: "Today",
    displayName: user?.displayName || "",
    timeZoneId: user?.timeZoneId || "",
    languageCode: user?.languageCode || "",
    avatarUrl: user?.avatarUrl || "",
  });

  // Statistics
  const [stats, setStats] = useState<UserProfile["stats"]>({
    filesShared: 0,
    totalDownloads: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const userStats = await profileService.getProfileStats();
        setStats(userStats);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    if (user) {
      // Only update form data if it's empty or if the user data has changed significantly
      if (!formData.username || formData.username !== user.username) {
        setFormData((prev) => ({
          firstName: user.firstName || prev.firstName || "",
          lastName: user.lastName || prev.lastName || "",
          email: user.email || prev.email || "",
          username: user.username || prev.username || "",
          bio: user.bio || prev.bio || "",
          avatar: prev.avatar,
          lastActive: prev.lastActive || "Today",
          displayName: user.displayName || prev.displayName || "",
          timeZoneId: user.timeZoneId || prev.timeZoneId || "",
          languageCode: user.languageCode || prev.languageCode || "",
          avatarUrl: user.avatarUrl || prev.avatarUrl || "",
        }));
      }
    }
    setLoadingProfile(false);
  }, [
    user?.username,
    user?.email,
    user?.firstName,
    user?.lastName,
    user?.bio,
    user?.displayName,
    user?.timeZoneId,
    user?.languageCode,
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;

    try {
      const file = e.target.files[0];
      setLoading(true);

      const response = await profileService.updateProfileImage(file);

      // Add a timestamp to prevent caching
      const avatarUrl = response.avatarUrl
        ? `${response.avatarUrl}?t=${new Date().getTime()}`
        : undefined;

      // Update form data first
      setFormData((prev) => ({
        ...prev,
        avatar: file,
        avatarUrl: avatarUrl || prev.avatarUrl,
      }));

      // Then update user in AuthContext and localStorage
      if (user && avatarUrl) {
        const updatedUser = {
          ...user,
          avatarUrl: avatarUrl,
        };
        updateUser(updatedUser);
      }

      toast.success("Profile image updated successfully!");
    } catch (error) {
      console.error("Error updating avatar:", error);
      toast.error("Failed to update profile image");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedProfile = await profileService.updateProfile({
        displayName: formData.displayName,
        bio: formData.bio,
        timeZoneId: formData.timeZoneId,
        languageCode: formData.languageCode,
      });

      // Update user in AuthContext and localStorage
      if (user) {
        const updatedUser = {
          ...user,
          displayName: updatedProfile.displayName,
          bio: updatedProfile.bio,
          timeZoneId: updatedProfile.timeZoneId,
          languageCode: updatedProfile.languageCode,
        };
        updateUser(updatedUser);
      }

      setSuccess("Profile updated successfully");
      toast.success("Profile updated successfully!");
      setEditMode(false);
    } catch (err) {
      setError("Failed to update profile. Please try again.");
      toast.error("Failed to update profile");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Safely handle loading and error states
  const isFormDisabled = !editMode || loading || loadingProfile;

  const handleToggleEditMode = () => {
    // Reset form to current user data when entering edit mode
    if (!editMode && user) {
      setFormData((prev) => ({
        ...prev,
        firstName: user.firstName || prev.firstName || "",
        lastName: user.lastName || prev.lastName || "",
        email: user.email || prev.email || "",
        username: user.username || prev.username || "",
        bio: user.bio || prev.bio || "",
        displayName: user.displayName || prev.displayName || "",
        timeZoneId: user.timeZoneId || prev.timeZoneId || "",
        languageCode: user.languageCode || prev.languageCode || "",
        // Preserve avatar and avatarUrl
        avatar: prev.avatar,
        avatarUrl: user.avatarUrl || prev.avatarUrl || "",
        lastActive: prev.lastActive,
      }));
    }

    setEditMode(!editMode);
    setError(null);
    setSuccess(null);
  };

  if (!isAuthenticated) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Alert severity="warning">
          You need to be logged in to view your profile.
        </Alert>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        width: "100%",
        py: { xs: 4, md: 8 },
        px: 2,
        bgcolor: "background.default",
        minHeight: "calc(100vh - 64px)",
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4} component="div">
          {/* Profile Section */}
          <Grid component="div" size={[12, null, 8]}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: 2,
                boxShadow: theme.shadows[2],
                position: "relative",
                overflow: "hidden",
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: theme.shadows[4],
                },
                border: "1px solid",
                borderColor: "divider",
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "4px",
                  background: theme.palette.primary.main,
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 4,
                }}
              >
                <Typography
                  variant="h4"
                  fontWeight="600"
                  sx={{
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  My Profile
                </Typography>

                <Button
                  variant={editMode ? "outlined" : "contained"}
                  color={editMode ? "secondary" : "primary"}
                  startIcon={editMode ? <SaveIcon /> : <EditIcon />}
                  onClick={editMode ? handleSubmit : handleToggleEditMode}
                  disabled={loading}
                  sx={{
                    borderRadius: "20px",
                    px: 3,
                    boxShadow: editMode ? "none" : theme.shadows[2],
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: editMode ? "none" : theme.shadows[4],
                    },
                  }}
                >
                  {editMode
                    ? loading
                      ? "Saving..."
                      : "Save Profile"
                    : "Edit Profile"}
                </Button>
              </Box>

              {error && (
                <Fade in={!!error}>
                  <Alert
                    severity="error"
                    sx={{
                      mb: 3,
                      borderRadius: 2,
                      boxShadow: theme.shadows[1],
                    }}
                    onClose={() => setError(null)}
                  >
                    {error}
                  </Alert>
                </Fade>
              )}

              {success && (
                <Fade in={!!success}>
                  <Alert
                    severity="success"
                    sx={{
                      mb: 3,
                      borderRadius: 2,
                      boxShadow: theme.shadows[1],
                    }}
                    onClose={() => setSuccess(null)}
                  >
                    {success}
                  </Alert>
                </Fade>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    mb: 4,
                    alignItems: { xs: "center", sm: "flex-start" },
                    bgcolor: "background.paper",
                    p: 3,
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  {loadingProfile ? (
                    <Skeleton variant="circular" width={120} height={120} />
                  ) : (
                    <Box sx={{ position: "relative" }}>
                      <Avatar
                        sx={{
                          width: 120,
                          height: 120,
                          mb: { xs: 2, sm: 0 },
                          mr: { sm: 4 },
                          fontSize: 40,
                          bgcolor: theme.palette.primary.main,
                          border: "4px solid white",
                          boxShadow: theme.shadows[3],
                          transition: "all 0.3s ease",
                          "&:hover": {
                            transform: editMode ? "scale(1.05)" : "none",
                          },
                        }}
                        alt={formData.displayName || formData.username}
                        src={
                          formData.avatarUrl
                            ? `${baseApiUrl}${formData.avatarUrl}`
                            : undefined
                        }
                        key={formData.avatarUrl}
                      >
                        {formData.displayName ? (
                          formData.displayName.charAt(0).toUpperCase()
                        ) : formData.username ? (
                          formData.username.charAt(0).toUpperCase()
                        ) : (
                          <PersonIcon fontSize="large" />
                        )}
                      </Avatar>

                      {editMode && (
                        <Tooltip title="Change avatar" placement="top" arrow>
                          <IconButton
                            component="label"
                            sx={{
                              position: "absolute",
                              bottom: { xs: 2, sm: 5 },
                              right: { xs: 2, sm: 5 },
                              bgcolor: theme.palette.primary.main,
                              color: "white",
                              width: 36,
                              height: 36,
                              "&:hover": {
                                bgcolor: theme.palette.primary.dark,
                              },
                            }}
                            disabled={loading}
                          >
                            {loading ? (
                              <CircularProgress size={20} color="inherit" />
                            ) : (
                              <PhotoCameraIcon fontSize="small" />
                            )}
                            <input
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={handleAvatarChange}
                              disabled={loading}
                            />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  )}

                  <Box sx={{ flex: 1, ml: { xs: 0, sm: 3 } }}>
                    {loadingProfile ? (
                      <>
                        <Skeleton width="60%" height={32} />
                        <Skeleton width="40%" height={24} sx={{ mt: 1 }} />
                      </>
                    ) : (
                      <>
                        <Typography
                          variant="h5"
                          fontWeight="600"
                          sx={{ mb: 0.5 }}
                        >
                          {formData.firstName
                            ? `${formData.firstName} ${formData.lastName}`
                            : formData.username}
                        </Typography>

                        <Box
                          sx={{ display: "flex", alignItems: "center", mb: 1 }}
                        >
                          <EmailIcon
                            sx={{
                              fontSize: 16,
                              mr: 0.5,
                              color: theme.palette.text.secondary,
                            }}
                          />
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ fontWeight: 500 }}
                          >
                            {formData.email}
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 1,
                            mt: 1,
                          }}
                        >
                          <Chip
                            label={`@${formData.username}`}
                            size="small"
                            icon={<BadgeIcon fontSize="small" />}
                            sx={{
                              fontWeight: 500,
                              bgcolor:
                                theme.palette.mode === "dark"
                                  ? "rgba(255,255,255,0.1)"
                                  : "rgba(0,0,0,0.05)",
                            }}
                          />
                          <Chip
                            label={`Active: ${formData.lastActive}`}
                            size="small"
                            icon={<AccessTimeIcon fontSize="small" />}
                            sx={{
                              fontWeight: 500,
                              bgcolor:
                                theme.palette.mode === "dark"
                                  ? "rgba(255,255,255,0.1)"
                                  : "rgba(0,0,0,0.05)",
                            }}
                          />
                        </Box>
                      </>
                    )}
                  </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                  Personal Information
                </Typography>

                <Grid container spacing={3} component="div">
                  <Grid component="div" size={[12, 6]}>
                    <TextField
                      fullWidth
                      label="First Name"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      disabled={isFormDisabled}
                      variant="outlined"
                      margin="normal"
                      InputProps={{
                        sx: {
                          borderRadius: 1.5,
                        },
                      }}
                    />
                  </Grid>

                  <Grid component="div" size={[12, 6]}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      disabled={isFormDisabled}
                      variant="outlined"
                      margin="normal"
                      InputProps={{
                        sx: {
                          borderRadius: 1.5,
                        },
                      }}
                    />
                  </Grid>

                  <Grid component="div" size={[12, 6]}>
                    <TextField
                      fullWidth
                      label="Username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      disabled={true} // Username cannot be changed
                      variant="outlined"
                      margin="normal"
                      InputProps={{
                        sx: {
                          borderRadius: 1.5,
                        },
                      }}
                    />
                  </Grid>

                  <Grid component="div" size={[12, 6]}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isFormDisabled}
                      variant="outlined"
                      margin="normal"
                      InputProps={{
                        sx: {
                          borderRadius: 1.5,
                        },
                      }}
                    />
                  </Grid>

                  <Grid component="div" size={[12]}>
                    <TextField
                      fullWidth
                      label="Bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      disabled={isFormDisabled}
                      variant="outlined"
                      margin="normal"
                      multiline
                      rows={4}
                      placeholder={
                        editMode
                          ? "Tell us about yourself..."
                          : "No bio provided"
                      }
                      InputProps={{
                        sx: {
                          borderRadius: 1.5,
                        },
                      }}
                      helperText={
                        editMode
                          ? "Share a little about yourself with the community"
                          : ""
                      }
                    />
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>

          {/* Statistics Section */}
          <Grid component="div" size={[12, null, 4]}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 2,
                boxShadow: theme.shadows[2],
                position: "relative",
                mb: 4,
                border: "1px solid",
                borderColor: "divider",
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: theme.shadows[3],
                },
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "4px",
                  background: theme.palette.primary.main,
                },
              }}
            >
              <Typography
                variant="h5"
                fontWeight="600"
                gutterBottom
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 2,
                }}
              >
                <StorageIcon fontSize="small" />
                Account Statistics
              </Typography>

              {loadingProfile ? (
                [...Array(4)].map((_, i) => (
                  <Box
                    key={i}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      py: 2,
                    }}
                  >
                    <Skeleton width={100} />
                    <Skeleton width={50} />
                  </Box>
                ))
              ) : (
                <>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      py: 2,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Files Shared
                    </Typography>
                    <Chip
                      label={stats?.filesShared ?? 0}
                      color="primary"
                      variant="outlined"
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      py: 2,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Total Downloads
                    </Typography>
                    <Chip
                      label={stats?.totalDownloads ?? 0}
                      color="primary"
                      variant="outlined"
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      py: 2,
                      borderBottom: `1px solid ${theme.palette.divider}`,
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Member Since
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formData.lastActive}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      py: 2,
                    }}
                  >
                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                      Last Active
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formData.lastActive}
                    </Typography>
                  </Box>
                </>
              )}
            </Paper>

            <Card
              elevation={0}
              sx={{
                borderRadius: 2,
                boxShadow: theme.shadows[2],
                position: "relative",
                border: "1px solid",
                borderColor: "divider",
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: theme.shadows[3],
                },
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: "4px",
                  background: theme.palette.primary.main,
                },
              }}
            >
              <CardContent>
                <Typography
                  variant="h6"
                  fontWeight="600"
                  gutterBottom
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 2,
                  }}
                >
                  <LanguageIcon fontSize="small" />
                  Quick Tips 🐱
                </Typography>

                <Box
                  sx={{
                    bgcolor:
                      theme.palette.mode === "dark"
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(0,0,0,0.02)",
                    p: 2,
                    borderRadius: 2,
                    mb: 2,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 1.5,
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: theme.palette.primary.main,
                        color: "white",
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        mr: 1.5,
                        fontSize: "0.8rem",
                        fontWeight: "bold",
                      }}
                    >
                      1
                    </Box>
                    Add a profile picture to personalize your account
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 1.5,
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: theme.palette.primary.main,
                        color: "white",
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        mr: 1.5,
                        fontSize: "0.8rem",
                        fontWeight: "bold",
                      }}
                    >
                      2
                    </Box>
                    Complete your profile to help others identify you
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <Box
                      component="span"
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: theme.palette.primary.main,
                        color: "white",
                        width: 20,
                        height: 20,
                        borderRadius: "50%",
                        mr: 1.5,
                        fontSize: "0.8rem",
                        fontWeight: "bold",
                      }}
                    >
                      3
                    </Box>
                    Update your email to stay informed about your shared files
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Profile;
