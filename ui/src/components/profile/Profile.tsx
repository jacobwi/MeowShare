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
} from "@mui/material";
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  CloudUpload as CloudUploadIcon,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

const Profile: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: user?.email || "",
    username: user?.username || "",
    bio: "",
    avatar: null as File | null,
    lastActive: "Today",
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
    const timer = setTimeout(() => {
      if (user) {
        setFormData({
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          email: user.email || "",
          username: user.username || "",
          bio: user.bio || "",
          avatar: null,
          lastActive: "Today",
        });
      }
      setLoadingProfile(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [user, formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, avatar: e.target.files[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Simulate API call to update profile
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Success
      setSuccess("Profile updated successfully");
      toast.success("Profile updated successfully!");
      setEditMode(false);
    } catch (err) {
      setError("Failed to update profile. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEditMode = () => {
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
        py: 8,
        px: 2,
        bgcolor: "background.default",
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Profile Section */}
          <Grid item xs={12} md={8}>
            <Paper
              elevation={2}
              sx={{
                p: 4,
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
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 3,
                }}
              >
                <Typography variant="h4" fontWeight="600">
                  My Profile
                </Typography>

                <Button
                  variant={editMode ? "outlined" : "contained"}
                  color={editMode ? "secondary" : "primary"}
                  startIcon={editMode ? <SaveIcon /> : <EditIcon />}
                  onClick={editMode ? handleSubmit : handleToggleEditMode}
                  disabled={loading}
                >
                  {editMode
                    ? loading
                      ? "Saving..."
                      : "Save Profile"
                    : "Edit Profile"}
                </Button>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  {success}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: { xs: "column", sm: "row" },
                    mb: 4,
                    alignItems: "center",
                  }}
                >
                  {loadingProfile ? (
                    <Skeleton variant="circular" width={100} height={100} />
                  ) : (
                    <Avatar
                      sx={{
                        width: 100,
                        height: 100,
                        mb: { xs: 2, sm: 0 },
                        mr: { sm: 4 },
                        fontSize: 40,
                        bgcolor: "primary.main",
                      }}
                      alt={formData.username}
                      src={
                        formData.avatar
                          ? URL.createObjectURL(formData.avatar)
                          : undefined
                      }
                    >
                      {formData.firstName ? (
                        formData.firstName.charAt(0).toUpperCase()
                      ) : formData.username ? (
                        formData.username.charAt(0).toUpperCase()
                      ) : (
                        <PersonIcon fontSize="large" />
                      )}
                    </Avatar>
                  )}

                  <Box sx={{ flex: 1 }}>
                    {editMode && (
                      <Button
                        component="label"
                        variant="outlined"
                        startIcon={<CloudUploadIcon />}
                        sx={{ mb: 2 }}
                      >
                        Upload Avatar
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={handleAvatarChange}
                        />
                      </Button>
                    )}

                    {loadingProfile ? (
                      <>
                        <Skeleton width="60%" height={32} />
                        <Skeleton width="40%" height={24} />
                      </>
                    ) : (
                      <>
                        <Typography variant="h5" fontWeight="500">
                          {formData.firstName
                            ? `${formData.firstName} ${formData.lastName}`
                            : formData.username}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          <EmailIcon
                            sx={{
                              fontSize: 16,
                              mr: 0.5,
                              verticalAlign: "text-bottom",
                            }}
                          />
                          {formData.email}
                        </Typography>
                      </>
                    )}
                  </Box>
                </Box>

                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="First Name"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      disabled={!editMode || loading || loadingProfile}
                      variant="outlined"
                      margin="normal"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Last Name"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      disabled={!editMode || loading || loadingProfile}
                      variant="outlined"
                      margin="normal"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      disabled={true} // Username cannot be changed
                      variant="outlined"
                      margin="normal"
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={!editMode || loading || loadingProfile}
                      variant="outlined"
                      margin="normal"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Bio"
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      disabled={!editMode || loading || loadingProfile}
                      variant="outlined"
                      margin="normal"
                      multiline
                      rows={4}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>

          {/* Statistics Section */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={2}
              sx={{
                p: 3,
                borderRadius: 2,
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                position: "relative",
                mb: 4,
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
              <Typography variant="h5" fontWeight="600" gutterBottom>
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
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <Typography variant="body1">Files Shared</Typography>
                    <Typography variant="body1" fontWeight="600">
                      {stats?.filesShared ?? 0}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      py: 2,
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <Typography variant="body1">Total Downloads</Typography>
                    <Typography variant="body1" fontWeight="600">
                      {stats?.totalDownloads ?? 0}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      py: 2,
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <Typography variant="body1">Member Since</Typography>
                    <Typography variant="body1" fontWeight="600">
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
                    <Typography variant="body1">Last Active</Typography>
                    <Typography variant="body1" fontWeight="600">
                      {formData.lastActive}
                    </Typography>
                  </Box>
                </>
              )}
            </Paper>

            <Card
              sx={{
                borderRadius: 2,
                boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                position: "relative",
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
              <CardContent>
                <Typography variant="h6" fontWeight="600" gutterBottom>
                  Quick Tips 🐱
                </Typography>
                <Typography variant="body2" gutterBottom>
                  • Add a profile picture to personalize your account
                </Typography>
                <Typography variant="body2" gutterBottom>
                  • Complete your profile to help others identify you
                </Typography>
                <Typography variant="body2">
                  • Update your email to stay informed about your shared files
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Profile;
