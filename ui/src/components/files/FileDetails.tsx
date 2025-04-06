import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Grid,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  GetAppOutlined,
  ContentCopyOutlined,
  DeleteOutline,
  ArrowBack,
  LockOutlined,
  AccessTimeOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { fileApi } from "../../services/file-share-service";
import { FileShare } from "../../types";
import FileContentViewer from "./FileContentViewer";
import { isImageFile, isViewableFile } from "../../utils/fileUtils";
import { useAuth } from "../../context/AuthContext";

const FileDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [file, setFile] = useState<FileShare | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [downloadPassword, setDownloadPassword] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [fileContent, setFileContent] = useState<string | undefined>(undefined);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState<string | undefined>(
    undefined,
  );

  const fetchFileDetails = useCallback(async () => {
    if (!id || !user) return;

    try {
      setLoading(true);
      const files = await fileApi.getUserFiles();
      const fileDetails = files.find((f) => f.id === id);

      if (fileDetails) {
        setFile(fileDetails);
        setError("");
      } else {
        setError("File not found");
      }
    } catch (err) {
      console.error("Error fetching file details:", err);
      setError("Failed to load file details");
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useEffect(() => {
    if (id && user) {
      fetchFileDetails();
    }
  }, [id, fetchFileDetails, user]);

  const handleCopyLink = () => {
    if (!file) return;

    const baseUrl = window.location.origin;
    const fileUrl = file.customUrl
      ? `${baseUrl}/files/${file.customUrl}`
      : `${baseUrl}/files/${file.id}`;

    navigator.clipboard
      .writeText(fileUrl)
      .then(() => {
        toast.success("Link copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy link:", err);
        toast.error("Failed to copy link");
      });
  };

  const handleDownload = async () => {
    if (!file) return;

    try {
      // If file has password protection, show password dialog
      if (file.password) {
        setPasswordDialogOpen(true);
        return;
      }

      // Download file directly if no password
      await downloadFile(file.id);
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Failed to download file");
    }
  };

  const downloadFile = async (fileId: string, password?: string) => {
    try {
      const blob = await fileApi.getFile(fileId, password);

      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = file?.fileName || "download";

      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Reset password dialog
      setPasswordDialogOpen(false);
      setDownloadPassword("");

      toast.success("File download started");
    } catch (error: unknown) {
      console.error("Download error:", error);

      // Check if it's an unauthorized error (wrong password)
      if (
        error instanceof Error &&
        (error.message.includes("401") ||
          error.message.includes("unauthorized"))
      ) {
        toast.error("Incorrect password");
      } else {
        toast.error("Failed to download file");
      }
    }
  };

  const handleViewFile = async () => {
    if (!file) return;

    try {
      setContentLoading(true);
      setContentError(undefined);
      setViewerOpen(true);

      // If file has password protection, show password dialog for view
      if (file.password) {
        setPasswordDialogOpen(true);
        return;
      }

      // For image files, no need to fetch content as we'll use the direct URL in the viewer
      if (isImageFile(file.fileName)) {
        setContentError(undefined);
        return;
      }

      // Get file content for preview of text-based files
      await fetchFileContent(file.id);
    } catch (err) {
      console.error("View error:", err);
      setContentError("Failed to load file content");
    } finally {
      setContentLoading(false);
    }
  };

  const fetchFileContent = async (fileId: string, password?: string) => {
    try {
      // Only fetch content for text-based files
      if (file && isImageFile(file.fileName)) {
        setContentError(undefined);
        return;
      }

      const content = await fileApi.getFileContentAsText(fileId, password);
      setFileContent(content);
      setContentError(undefined);

      // If this was called from password dialog, close it
      if (password) {
        setPasswordDialogOpen(false);
        setDownloadPassword("");
      }
    } catch (err) {
      console.error("File content error:", err);
      setContentError(
        "Failed to load file content. It may be a binary file that cannot be viewed.",
      );
    }
  };

  const handlePasswordSubmit = () => {
    if (!file) return;

    if (viewerOpen) {
      if (isImageFile(file.fileName)) {
        // For images with password, just close the dialog
        setPasswordDialogOpen(false);
        setDownloadPassword("");
      } else {
        fetchFileContent(file.id, downloadPassword);
      }
    } else {
      downloadFile(file.id, downloadPassword);
    }
  };

  const confirmDelete = () => {
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!file) return;

    try {
      const success = await fileApi.deleteFile(file.id);

      if (success) {
        toast.success("File deleted successfully");
        navigate("/my-files");
      } else {
        toast.error("Failed to delete file");
      }
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete file");
    } finally {
      // Close the dialog
      setDeleteDialogOpen(false);
    }
  };

  const isViewable = () => {
    if (!file) return false;
    return isViewableFile(file.fileName);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const isExpired = () => {
    if (!file || !file.expiresAt) return false;
    const expiryDate = new Date(file.expiresAt);
    return expiryDate < new Date();
  };

  const isDownloadLimitReached = () => {
    if (!file || !file.maxDownloads) return false;
    return file.currentDownloads >= file.maxDownloads;
  };

  const getFileStatus = () => {
    if (!file) return null;

    if (isExpired()) {
      return <Chip label="Expired" color="error" />;
    }

    if (isDownloadLimitReached()) {
      return <Chip label="Download limit reached" color="error" />;
    }

    return <Chip label="Active" color="success" />;
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "50vh",
          }}
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error || !file) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error">{error || "File not found"}</Alert>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            sx={{ mt: 2 }}
            onClick={() => navigate("/my-files")}
          >
            Back to My Files
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
          <IconButton onClick={() => navigate("/my-files")} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1">
            File Details
          </Typography>
        </Box>

        <Paper elevation={3} sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography
              variant="h5"
              component="h2"
              sx={{ wordBreak: "break-word" }}
            >
              {file.fileName}
            </Typography>
            {getFileStatus()}
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Grid container spacing={2} component="div">
            <Grid component="div" size={[12, null, 6]}>
              <Typography variant="subtitle2" color="text.secondary">
                Upload Date
              </Typography>
              <Typography variant="body1">
                {formatDate(file.createdAt)}
              </Typography>
            </Grid>

            <Grid component="div" size={[12, null, 6]}>
              <Typography variant="subtitle2" color="text.secondary">
                Expiration Date
              </Typography>
              <Typography variant="body1">
                {file.expiresAt ? (
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    {formatDate(file.expiresAt)}
                    <AccessTimeOutlined
                      fontSize="small"
                      sx={{ ml: 1, color: "text.secondary" }}
                    />
                  </Box>
                ) : (
                  "Never"
                )}
              </Typography>
            </Grid>

            <Grid component="div" size={[12, null, 6]}>
              <Typography variant="subtitle2" color="text.secondary">
                Download Count
              </Typography>
              <Typography variant="body1">
                {file.currentDownloads}{" "}
                {file.maxDownloads ? `/ ${file.maxDownloads}` : ""}
              </Typography>
            </Grid>

            <Grid component="div" size={[12, null, 6]}>
              <Typography variant="subtitle2" color="text.secondary">
                Protection
              </Typography>
              <Typography variant="body1">
                {file.password ? (
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    Password Protected
                    <LockOutlined
                      fontSize="small"
                      sx={{ ml: 1, color: "text.secondary" }}
                    />
                  </Box>
                ) : (
                  "None"
                )}
              </Typography>
            </Grid>

            <Grid component="div" size={[12]}>
              <Typography variant="subtitle2" color="text.secondary">
                Custom URL
              </Typography>
              <Typography variant="body1">
                {file.customUrl ? file.customUrl : "None"}
              </Typography>
            </Grid>

            <Grid component="div" size={[12]}>
              <Typography variant="subtitle2" color="text.secondary">
                Folder Path
              </Typography>
              <Typography variant="body1">
                {file.folderPath ? file.folderPath : "Root"}
              </Typography>
            </Grid>

            <Grid component="div" size={[12]}>
              <Typography variant="subtitle2" color="text.secondary">
                Tags
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
                {file.tags.length > 0 ? (
                  file.tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      variant="outlined"
                      size="small"
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No tags
                  </Typography>
                )}
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ mb: 3 }} />

          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Tooltip
              title={
                isExpired() || isDownloadLimitReached()
                  ? "File is no longer available"
                  : "Download"
              }
            >
              <span>
                <Button
                  variant="contained"
                  startIcon={<GetAppOutlined />}
                  onClick={handleDownload}
                  disabled={isExpired() || isDownloadLimitReached()}
                >
                  Download
                </Button>
              </span>
            </Tooltip>

            <Button
              variant="outlined"
              startIcon={<ContentCopyOutlined />}
              onClick={handleCopyLink}
            >
              Copy Link
            </Button>

            {isViewable() && (
              <Button
                variant="outlined"
                color="info"
                startIcon={<VisibilityOutlined />}
                onClick={handleViewFile}
              >
                View
              </Button>
            )}

            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteOutline />}
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </Box>
        </Paper>

        {/* Password Dialog */}
        <Dialog
          open={passwordDialogOpen}
          onClose={() => setPasswordDialogOpen(false)}
        >
          <DialogTitle>Enter Password</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Password"
              type="password"
              fullWidth
              variant="outlined"
              value={downloadPassword}
              onChange={(e) => setDownloadPassword(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
            <Button onClick={handlePasswordSubmit} variant="contained">
              {viewerOpen ? "View" : "Download"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
        >
          <DialogTitle>Confirm Deletion</DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete "{file.fileName}"? This action
              cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained">
              Delete
            </Button>
          </DialogActions>
        </Dialog>

        {/* File Content Viewer */}
        <FileContentViewer
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
          fileId={file?.id || ""}
          fileName={file?.fileName || ""}
          fileContent={fileContent}
          loading={contentLoading}
          error={contentError}
        />
      </Box>
    </Container>
  );
};

export default FileDetails;
