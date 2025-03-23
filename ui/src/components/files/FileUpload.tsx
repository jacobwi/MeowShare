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
} from "@mui/icons-material";
import { toast } from "react-toastify";
import fileApi from "../../services/file-share-service";
import { v4 as uuidv4 } from "uuid";

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Tab state
  const [tabValue, setTabValue] = useState(0);

  // Form fields
  const [customUrl, setCustomUrl] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [maxDownloads, setMaxDownloads] = useState<number | undefined>(
    undefined,
  );
  const [folderPath, setFolderPath] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState<string>("");

  // Loading and progress states
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  // File selection with react-dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
      }
    },
    multiple: false,
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
    setSelectedFile(null);
    setCustomUrl("");
    setPassword("");
    setExpiresAt("");
    setMaxDownloads(undefined);
    setFolderPath("");
    setTags([]);
    setNewTag("");
    setUploadProgress(0);
  };

  const handleQuickUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      setLoading(true);
      await fileApi.quickShare(selectedFile);

      toast.success("File uploaded successfully!");
      resetForm();
      navigate("/my-files");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdvancedUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      setLoading(true);

      // Prepare metadata object
      const metadata = {
        customUrl: customUrl.trim() || undefined,
        password: password.trim() || undefined,
        expiresAt: expiresAt ? expiresAt : undefined,
        maxDownloads: maxDownloads,
        tags: tags.length > 0 ? tags : undefined,
        folderPath: folderPath.trim() || undefined,
      };

      // Call the API with file and metadata
      await fileApi.shareWithMetadata(selectedFile, metadata);

      toast.success("File uploaded successfully!");
      resetForm();
      navigate("/my-files");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChunkedUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    // Configuration for chunked upload
    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
    const totalChunks = Math.ceil(selectedFile.size / CHUNK_SIZE);
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

      for (let chunkNumber = 0; chunkNumber < totalChunks; chunkNumber++) {
        const start = chunkNumber * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, selectedFile.size);
        const chunkBlob = selectedFile.slice(start, end);

        // Create a File object from the Blob (the backend expects a File)
        const chunk = new File([chunkBlob], selectedFile.name, {
          type: selectedFile.type,
        });

        // Create the chunk upload request
        const uploadRequest = {
          chunk,
          fileId,
          chunkNumber,
          totalChunks,
          fileName: selectedFile.name,
          ...metadata,
        };

        // Upload the chunk
        const response = await fileApi.uploadChunk(uploadRequest);

        // Update progress
        const progress = Math.round(((chunkNumber + 1) / totalChunks) * 100);
        setUploadProgress(progress);

        // If we got a full response with file data, all chunks were processed
        if (response) {
          toast.success("File upload complete!");
          resetForm();
          navigate("/my-files");
          return;
        }
      }

      // If we reach here without a file response, something went wrong
      toast.error(
        "Upload completed but file processing failed. Please try again.",
      );
    } catch (error) {
      console.error("Chunked upload error:", error);
      toast.error("Failed to upload file chunks. Please try again.");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Get appropriate file icon by type
  const getFileTypeIcon = () => {
    if (!selectedFile) return null;

    // Default to FileCopy icon
    return <FileCopy sx={{ fontSize: 40, mb: 1, color: "primary.main" }} />;
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

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
                bgcolor: selectedFile
                  ? alpha(theme.palette.success.main, 0.07)
                  : isDragActive
                    ? alpha(theme.palette.primary.main, 0.1)
                    : "transparent",
                "&:hover": {
                  bgcolor: selectedFile
                    ? alpha(theme.palette.success.main, 0.1)
                    : alpha(theme.palette.primary.main, 0.07),
                  borderColor: selectedFile
                    ? theme.palette.success.main
                    : theme.palette.primary.main,
                },
              }}
            >
              <input {...getInputProps()} />

              {selectedFile ? (
                <Fade in={!!selectedFile}>
                  <Stack
                    spacing={2}
                    alignItems="center"
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="center"
                  >
                    {getFileTypeIcon()}
                    <Box sx={{ textAlign: "left" }}>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedFile.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatFileSize(selectedFile.size)} •{" "}
                        {selectedFile.type || "Unknown type"}
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                        sx={{ mt: 1 }}
                        startIcon={<Delete />}
                      >
                        Remove
                      </Button>
                    </Box>
                  </Stack>
                </Fade>
              ) : (
                <Stack spacing={2} alignItems="center">
                  <CloudUpload
                    sx={{ fontSize: 56, color: "primary.main", opacity: 0.8 }}
                  />
                  <Typography variant="h6" color="text.primary">
                    {isDragActive
                      ? "Drop the file here"
                      : "Drag & drop your file"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    or click to browse from your computer
                  </Typography>
                  <Button variant="outlined" size="small" sx={{ mt: 1 }}>
                    Select File
                  </Button>
                </Stack>
              )}
            </Box>

            {selectedFile &&
              tabValue === 2 &&
              selectedFile.size > 20 * 1024 * 1024 && (
                <Alert severity="info" sx={{ mt: 2, borderRadius: 1 }}>
                  This file is large ({formatFileSize(selectedFile.size)}).
                  Chunked upload is recommended for reliability.
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

              <Button
                variant="contained"
                color="primary"
                onClick={handleQuickUpload}
                disabled={!selectedFile || loading}
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
            </Stack>
          </TabPanel>

          {/* Advanced Upload Tab */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography
                  variant="subtitle1"
                  fontWeight="medium"
                  gutterBottom
                >
                  Sharing Options
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
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

              <Grid item xs={12} md={6}>
                <TextField
                  label="Password"
                  fullWidth
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  helperText="Protect your file with a password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
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

              <Grid item xs={12} md={6}>
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

              <Grid item xs={12}>
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

              <Grid item xs={12} md={6}>
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

              <Grid item xs={12} md={6}>
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

              <Grid item xs={12}>
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

              <Grid item xs={12} sx={{ textAlign: "center", mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleAdvancedUpload}
                  disabled={!selectedFile || loading}
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
                  {loading ? "Uploading..." : "Upload with Options"}
                </Button>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Chunked Upload Tab */}
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 3, borderRadius: 1 }}>
                  <AlertTitle>Chunked Upload Benefits</AlertTitle>
                  Recommended for files larger than 20MB. This method breaks
                  your file into 5MB chunks for more reliable uploads,
                  especially on slower connections.
                </Alert>
              </Grid>

              <Grid item xs={12}>
                <Typography
                  variant="subtitle1"
                  fontWeight="medium"
                  gutterBottom
                >
                  Sharing Options
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
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

              <Grid item xs={12} md={6}>
                <TextField
                  label="Password"
                  fullWidth
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  helperText="Protect your file with a password"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
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

              <Grid item xs={12} md={6}>
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

              <Grid item xs={12}>
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

              <Grid item xs={12} md={6}>
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

              <Grid item xs={12} md={6}>
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

              <Grid item xs={12}>
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
                <Grid item xs={12}>
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

              <Grid item xs={12} sx={{ textAlign: "center", mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleChunkedUpload}
                  disabled={!selectedFile || loading}
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
                  {loading ? "Uploading Chunks..." : "Upload in Chunks"}
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
