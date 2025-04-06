import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Container,
  Typography,
  TextField,
  Tabs,
  Tab,
  Chip,
  InputAdornment,
  CircularProgress,
  LinearProgress,
  Grid,
  Card,
  Stack,
  IconButton,
  Alert,
  AlertTitle,
  useTheme,
  alpha,
  Fade,
  Divider,
  Tooltip,
  Popover,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { useDropzone } from "react-dropzone";
import {
  AddCircleOutline,
  CloudUpload,
  FileCopy,
  Delete,
  Link as LinkIcon,
  Lock,
  Schedule,
  Folder,
  Tag,
  Info,
  Visibility,
  VisibilityOff,
  Block,
  Settings,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import fileApi from "../../services/file-share-service";
import { v4 as uuidv4 } from "uuid";
import { ShareFileRequest } from "../../types";

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
      id={`file-upload-tabpanel-${index}`}
      aria-labelledby={`file-upload-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: { xs: 2, sm: 3 } }}>{children}</Box>}
    </div>
  );
}

function FileUpload() {
  const navigate = useNavigate();
  const theme = useTheme();

  // File selection state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // Tab state
  const [tabValue, setTabValue] = useState(0);

  // Form fields
  const [customUrl, setCustomUrl] = useState("");
  const [password, setPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [maxDownloads, setMaxDownloads] = useState<number | undefined>(
    undefined,
  );
  const [folderPath, setFolderPath] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState<string>("");

  // Loading and progress states
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // Add new state for field visibility
  const [showPassword, setShowPassword] = useState(false);

  // Add state for quick upload popovers
  const [quickSettingsAnchor, setQuickSettingsAnchor] =
    useState<HTMLButtonElement | null>(null);
  const [showQuickPassword, setShowQuickPassword] = useState(false);
  const [showQuickMaxDownloads, setShowQuickMaxDownloads] = useState(false);
  const [showQuickExpiry, setShowQuickExpiry] = useState(false);

  // File selection with react-dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      setSelectedFiles((prev) => [...prev, ...acceptedFiles]);
    },
    multiple: true,
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToDelete: string) => {
    setTags(tags.filter((tag) => tag !== tagToDelete));
  };

  const resetForm = () => {
    setSelectedFiles([]);
    setUploadProgress(0);
  };

  const handleQuickUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file to upload");
      return;
    }

    try {
      setLoading(true);

      // Prepare metadata based on quick settings
      const metadata: ShareFileRequest = {
        customUrl: customUrl.trim() || undefined,
        password: showQuickPassword ? password.trim() : undefined,
        expiresAt: showQuickExpiry ? expiresAt : undefined,
        maxDownloads: showQuickMaxDownloads ? maxDownloads : undefined,
        tags: tags.length > 0 ? tags : undefined,
        folderPath: folderPath.trim() || undefined,
      };

      // Upload each file with metadata
      for (const file of selectedFiles) {
        await fileApi.shareWithMetadata(file, metadata);
      }

      toast.success(`${selectedFiles.length} file(s) uploaded successfully!`);
      resetForm();
      navigate("/my-files");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload files. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdvancedUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file to upload");
      return;
    }

    try {
      setLoading(true);

      // Prepare metadata object
      const metadata: ShareFileRequest = {
        customUrl: customUrl.trim() || undefined,
        password: password.trim() || undefined,
        expiresAt: expiresAt ? expiresAt : undefined,
        maxDownloads: maxDownloads,
        tags: tags.length > 0 ? tags : undefined,
        folderPath: folderPath.trim() || undefined,
      };

      // Upload each file with metadata
      for (const file of selectedFiles) {
        await fileApi.shareWithMetadata(file, metadata);
      }

      toast.success(`${selectedFiles.length} file(s) uploaded successfully!`);
      resetForm();
      navigate("/my-files");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload files. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChunkedUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error("Please select at least one file to upload");
      return;
    }

    // Configuration for chunked upload
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
    const fileId = uuidv4(); // Generate a unique file ID for this upload

    // Prepare metadata for all chunks
    const metadata = {
      customUrl: customUrl.trim() || undefined,
      password: password.trim() || undefined,
      expiresAt: expiresAt ? expiresAt : undefined,
      maxDownloads: maxDownloads,
      tags: tags.length > 0 ? tags : undefined,
      folderPath: folderPath.trim() || undefined,
    };

    try {
      setLoading(true);

      for (const file of selectedFiles) {
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

        for (let chunkNumber = 0; chunkNumber < totalChunks; chunkNumber++) {
          const start = chunkNumber * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunkBlob = file.slice(start, end);

          // Create a File object from the Blob (the backend expects a File)
          const chunk = new File([chunkBlob], file.name, {
            type: file.type,
          });

          // Create the chunk upload request
          const uploadRequest = {
            chunk,
            fileId,
            chunkNumber,
            totalChunks,
            fileName: file.name,
            ...metadata,
          };

          // Upload the chunk
          const response = await fileApi.uploadChunk(uploadRequest);

          // Update progress
          const progress = Math.round(((chunkNumber + 1) / totalChunks) * 100);
          setUploadProgress(progress);

          // If we got a full response with file data, all chunks were processed
          if (response) {
            break;
          }
        }
      }

      toast.success("File upload complete!");
      resetForm();
      navigate("/my-files");
    } catch (error) {
      console.error("Chunked upload error:", error);
      toast.error("Failed to upload file chunks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const handleQuickSettingsClick = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    setQuickSettingsAnchor(event.currentTarget);
  };

  const handleQuickSettingsClose = () => {
    setQuickSettingsAnchor(null);
  };

  const open = Boolean(quickSettingsAnchor);
  const id = open ? "quick-settings-popover" : undefined;

  return (
    <Container maxWidth="md" sx={{ pb: 5 }}>
      <Box sx={{ my: 4 }}>
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
          Upload Files
        </Typography>

        <Card
          elevation={2}
          sx={{
            mt: 4,
            borderRadius: 2,
            overflow: "hidden",
            border: "1px solid",
            borderColor:
              theme.palette.mode === "dark"
                ? alpha(theme.palette.common.white, 0.1)
                : alpha(theme.palette.common.black, 0.05),
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="file upload tabs"
            variant="fullWidth"
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              bgcolor:
                theme.palette.mode === "dark"
                  ? alpha(theme.palette.common.white, 0.05)
                  : alpha(theme.palette.common.black, 0.03),
            }}
          >
            <Tab
              label="Quick Upload"
              icon={<CloudUpload />}
              iconPosition="start"
              sx={{ py: 2 }}
            />
            <Tab
              label="Advanced Options"
              icon={<Info />}
              iconPosition="start"
              sx={{ py: 2 }}
            />
            <Tab
              label="Large Files"
              icon={<FileCopy />}
              iconPosition="start"
              sx={{ py: 2 }}
            />
          </Tabs>

          {/* File Dropzone - Common for all tabs */}
          <Box
            sx={{
              p: 3,
              bgcolor:
                theme.palette.mode === "dark"
                  ? alpha(theme.palette.primary.dark, 0.1)
                  : alpha(theme.palette.primary.light, 0.07),
            }}
          >
            <Box
              {...getRootProps()}
              sx={{
                border: "2px dashed",
                borderColor: isDragActive
                  ? "primary.main"
                  : theme.palette.mode === "dark"
                    ? "rgba(255, 255, 255, 0.2)"
                    : "rgba(0, 0, 0, 0.15)",
                borderRadius: 2,
                p: 4,
                textAlign: "center",
                cursor: "pointer",
                transition: "all 0.2s ease-in-out",
                bgcolor:
                  selectedFiles.length > 0
                    ? alpha(theme.palette.success.main, 0.07)
                    : isDragActive
                      ? alpha(theme.palette.primary.main, 0.1)
                      : "transparent",
                "&:hover": {
                  bgcolor:
                    selectedFiles.length > 0
                      ? alpha(theme.palette.success.main, 0.1)
                      : alpha(theme.palette.primary.main, 0.07),
                  borderColor:
                    selectedFiles.length > 0
                      ? theme.palette.success.main
                      : theme.palette.primary.main,
                },
              }}
            >
              <input {...getInputProps()} />

              {selectedFiles.length > 0 ? (
                <Fade in={selectedFiles.length > 0}>
                  <Stack spacing={2} sx={{ width: "100%" }}>
                    {selectedFiles.map((file, index) => (
                      <Card
                        key={index}
                        sx={{
                          p: 2,
                          display: "flex",
                          alignItems: "center",
                          gap: 2,
                          bgcolor: alpha(theme.palette.primary.main, 0.05),
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                          "&:hover": {
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                          },
                        }}
                      >
                        <FileCopy sx={{ color: "primary.main" }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" noWrap>
                            {file.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatFileSize(file.size)}
                          </Typography>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFiles((prev) =>
                              prev.filter((_, i) => i !== index),
                            );
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Card>
                    ))}
                  </Stack>
                </Fade>
              ) : (
                <Stack spacing={2} alignItems="center">
                  <CloudUpload
                    sx={{ fontSize: 56, color: "primary.main", opacity: 0.8 }}
                  />
                  <Typography variant="h6" color="text.primary">
                    {isDragActive
                      ? "Drop the files here"
                      : "Drag & drop your files"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    or click to browse from your computer
                  </Typography>
                  <Button variant="outlined" size="small" sx={{ mt: 1 }}>
                    Select Files
                  </Button>
                </Stack>
              )}
            </Box>

            {selectedFiles.length > 0 &&
              tabValue === 2 &&
              selectedFiles.some((file) => file.size > 20 * 1024 * 1024) && (
                <Alert severity="info" sx={{ mt: 2, borderRadius: 1 }}>
                  Some files are large ({">"}20MB). Chunked upload is
                  recommended for reliability.
                </Alert>
              )}
          </Box>

          {/* Quick Upload Tab */}
          <TabPanel value={tabValue} index={0}>
            <Stack spacing={3} alignItems="center">
              <Typography
                variant="body1"
                textAlign="center"
                color="text.secondary"
              >
                Upload your file quickly with default settings. The file will be
                private to your account.
              </Typography>

              <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleQuickUpload}
                  disabled={selectedFiles.length === 0 || loading}
                  size="large"
                  startIcon={
                    loading ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      <CloudUpload />
                    )
                  }
                  sx={{
                    px: 4,
                    py: 1.2,
                    fontWeight: "bold",
                    borderRadius: 30,
                    boxShadow: 2,
                  }}
                >
                  {loading ? "Uploading..." : "Quick Upload"}
                </Button>

                <Tooltip title="Quick Settings">
                  <IconButton
                    onClick={handleQuickSettingsClick}
                    color="primary"
                    size="large"
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      "&:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                      },
                    }}
                  >
                    <Settings />
                  </IconButton>
                </Tooltip>
              </Box>

              <Popover
                id={id}
                open={open}
                anchorEl={quickSettingsAnchor}
                onClose={handleQuickSettingsClose}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
              >
                <Box sx={{ p: 2, minWidth: 300 }}>
                  <Typography
                    variant="subtitle2"
                    gutterBottom
                    fontWeight="medium"
                  >
                    Quick Settings
                  </Typography>
                  <Stack spacing={2}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={showQuickPassword}
                          onChange={(e) =>
                            setShowQuickPassword(e.target.checked)
                          }
                          color="primary"
                        />
                      }
                      label={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Lock fontSize="small" />
                          <Typography variant="body2">
                            Password Protection
                          </Typography>
                        </Box>
                      }
                    />
                    {showQuickPassword && (
                      <TextField
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        size="small"
                        fullWidth
                        placeholder="Enter password"
                        autoComplete="new-password"
                      />
                    )}

                    <FormControlLabel
                      control={
                        <Switch
                          checked={showQuickMaxDownloads}
                          onChange={(e) =>
                            setShowQuickMaxDownloads(e.target.checked)
                          }
                          color="primary"
                        />
                      }
                      label={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Block fontSize="small" />
                          <Typography variant="body2">
                            Download Limit
                          </Typography>
                        </Box>
                      }
                    />
                    {showQuickMaxDownloads && (
                      <TextField
                        label="Max Downloads"
                        type="number"
                        value={maxDownloads === undefined ? "" : maxDownloads}
                        onChange={(e) =>
                          setMaxDownloads(
                            e.target.value
                              ? parseInt(e.target.value)
                              : undefined,
                          )
                        }
                        size="small"
                        fullWidth
                        inputProps={{ min: 1 }}
                        placeholder="Enter limit"
                      />
                    )}

                    <FormControlLabel
                      control={
                        <Switch
                          checked={showQuickExpiry}
                          onChange={(e) => setShowQuickExpiry(e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Schedule fontSize="small" />
                          <Typography variant="body2">
                            Expiration Date
                          </Typography>
                        </Box>
                      }
                    />
                    {showQuickExpiry && (
                      <TextField
                        label="Expires At"
                        type="datetime-local"
                        value={expiresAt}
                        onChange={(e) => setExpiresAt(e.target.value)}
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                      />
                    )}
                  </Stack>
                </Box>
              </Popover>
            </Stack>
          </TabPanel>

          {/* Advanced Upload Tab */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3} component="div">
              <Grid component="div" size={[12]}>
                <Typography
                  variant="subtitle1"
                  fontWeight="medium"
                  gutterBottom
                >
                  Sharing Options
                </Typography>
              </Grid>

              <Grid component="div" size={[12, null, 6]}>
                <TextField
                  label="Custom URL"
                  fullWidth
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="e.g., my-awesome-file"
                  helperText="Create a custom URL for easier sharing"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LinkIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid component="div" size={[12, null, 6]}>
                <TextField
                  label="Password"
                  fullWidth
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  helperText="Protect your file with a password"
                  autoComplete="new-password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid component="div" size={[12, null, 6]}>
                <TextField
                  label="Expiration Date"
                  fullWidth
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  helperText="Set an expiration date for this file"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Schedule fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid component="div" size={[12, null, 6]}>
                <TextField
                  label="Max Downloads"
                  fullWidth
                  type="number"
                  value={maxDownloads === undefined ? "" : maxDownloads}
                  onChange={(e) =>
                    setMaxDownloads(
                      e.target.value ? parseInt(e.target.value) : undefined,
                    )
                  }
                  inputProps={{ min: 1 }}
                  helperText="Limit the number of times the file can be downloaded"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Block fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid component="div" size={[12]}>
                <Divider sx={{ my: 1 }} />
                <Typography
                  variant="subtitle1"
                  fontWeight="medium"
                  gutterBottom
                  sx={{ mt: 2 }}
                >
                  Organization
                </Typography>
              </Grid>

              <Grid component="div" size={[12, null, 6]}>
                <TextField
                  label="Folder Path"
                  fullWidth
                  value={folderPath}
                  onChange={(e) => setFolderPath(e.target.value)}
                  placeholder="e.g., work/projects"
                  helperText="Specify a folder path for organization"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Folder fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid component="div" size={[12, null, 6]}>
                <TextField
                  label="Tags"
                  fullWidth
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="e.g., work, document, important"
                  helperText="Press Enter or click Add to add a tag"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Tag fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title="Add tag">
                          <span>
                            <IconButton
                              onClick={addTag}
                              disabled={!newTag.trim()}
                              size="small"
                              color="primary"
                            >
                              <AddCircleOutline />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newTag.trim()) {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
              </Grid>

              <Grid component="div" size={[12]}>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                  {tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      onDelete={() => removeTag(tag)}
                      color="primary"
                      size="small"
                      sx={{
                        borderRadius: "16px",
                        fontWeight: 500,
                        "& .MuiChip-deleteIcon": {
                          color: "inherit",
                          opacity: 0.7,
                          "&:hover": {
                            opacity: 1,
                          },
                        },
                      }}
                    />
                  ))}
                </Box>
              </Grid>

              <Grid component="div" size={[12]} sx={{ textAlign: "center", mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<CloudUpload />}
                  onClick={handleAdvancedUpload}
                  disabled={selectedFiles.length === 0 || loading}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Upload with Options"
                  )}
                </Button>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Chunked Upload Tab */}
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3} component="div">
              <Grid component="div" size={[12]}>
                <Alert severity="info" sx={{ mb: 3, borderRadius: 1 }}>
                  <AlertTitle>Chunked Upload Benefits</AlertTitle>
                  Recommended for files larger than 20MB. This method breaks
                  your file into 5MB chunks for more reliable uploads,
                  especially on slower connections.
                </Alert>
              </Grid>

              <Grid component="div" size={[12]}>
                <Typography
                  variant="subtitle1"
                  fontWeight="medium"
                  gutterBottom
                >
                  Sharing Options
                </Typography>
              </Grid>

              <Grid component="div" size={[12, null, 6]}>
                <TextField
                  label="Custom URL"
                  fullWidth
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="e.g., my-awesome-file"
                  helperText="Create a custom URL for easier sharing"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LinkIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid component="div" size={[12, null, 6]}>
                <TextField
                  label="Password"
                  fullWidth
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  helperText="Protect your file with a password"
                  autoComplete="new-password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid component="div" size={[12, null, 6]}>
                <TextField
                  label="Expiration Date"
                  fullWidth
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  helperText="Set an expiration date for this file"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Schedule fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid component="div" size={[12, null, 6]}>
                <TextField
                  label="Max Downloads"
                  fullWidth
                  type="number"
                  value={maxDownloads === undefined ? "" : maxDownloads}
                  onChange={(e) =>
                    setMaxDownloads(
                      e.target.value ? parseInt(e.target.value) : undefined,
                    )
                  }
                  inputProps={{ min: 1 }}
                  helperText="Limit the number of times the file can be downloaded"
                />
              </Grid>

              <Grid component="div" size={[12]}>
                <Divider sx={{ my: 1 }} />
                <Typography
                  variant="subtitle1"
                  fontWeight="medium"
                  gutterBottom
                  sx={{ mt: 2 }}
                >
                  Organization
                </Typography>
              </Grid>

              <Grid component="div" size={[12, null, 6]}>
                <TextField
                  label="Folder Path"
                  fullWidth
                  value={folderPath}
                  onChange={(e) => setFolderPath(e.target.value)}
                  placeholder="e.g., work/projects"
                  helperText="Specify a folder path for organization"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Folder fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid component="div" size={[12, null, 6]}>
                <TextField
                  label="Tags"
                  fullWidth
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="e.g., work, document, important"
                  helperText="Press Enter or click Add to add a tag"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Tag fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title="Add tag">
                          <span>
                            <IconButton
                              onClick={addTag}
                              disabled={!newTag.trim()}
                              size="small"
                              color="primary"
                            >
                              <AddCircleOutline />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newTag.trim()) {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
              </Grid>

              <Grid component="div" size={[12]}>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                  {tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      onDelete={() => removeTag(tag)}
                      color="primary"
                      size="small"
                      sx={{
                        borderRadius: "16px",
                        fontWeight: 500,
                        "& .MuiChip-deleteIcon": {
                          color: "inherit",
                          opacity: 0.7,
                          "&:hover": {
                            opacity: 1,
                          },
                        },
                      }}
                    />
                  ))}
                </Box>
              </Grid>

              {/* Progress bar for chunked upload */}
              {loading && (
                <Grid component="div" size={[12]}>
                  <Box sx={{ mt: 2, mb: 2 }}>
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      sx={{ mb: 1 }}
                    >
                      <Typography variant="body2" fontWeight="medium">
                        Uploading chunks:
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        color="primary"
                      >
                        {uploadProgress}%
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={uploadProgress}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: alpha(theme.palette.primary.main, 0.15),
                        ".MuiLinearProgress-bar": {
                          borderRadius: 4,
                        },
                      }}
                    />
                  </Box>
                </Grid>
              )}

              <Grid component="div" size={[12]} sx={{ textAlign: "center", mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<CloudUpload />}
                  onClick={handleChunkedUpload}
                  disabled={selectedFiles.length === 0 || loading}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Upload in Chunks"
                  )}
                </Button>
              </Grid>
            </Grid>
          </TabPanel>
        </Card>
      </Box>
    </Container>
  );
}

export default FileUpload;
