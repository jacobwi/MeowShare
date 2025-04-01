import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Alert,
  InputAdornment,
} from "@mui/material";
import {
  DeleteOutline,
  GetAppOutlined,
  ContentCopyOutlined,
  LockOutlined,
  AccessTimeOutlined,
  Search,
  OpenInNew,
  VisibilityOutlined,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { fileApi } from "../../services/file-share-service";
import { FileShare } from "../../types";
import { useNavigate } from "react-router-dom";
import FileContentViewer from "./FileContentViewer";
import { isImageFile, isViewableFile } from "../../utils/fileUtils";
import { useAuth } from "../../context/AuthContext";

const FileList: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [files, setFiles] = useState<FileShare[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTags, setSearchTags] = useState("");
  const [selectedFile, setSelectedFile] = useState<FileShare | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [downloadPassword, setDownloadPassword] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [fileContent, setFileContent] = useState<string | undefined>(undefined);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState<string | undefined>(
    undefined,
  );
  const [viewActionType, setViewActionType] = useState<"view" | "download">(
    "download",
  );

  const fetchFiles = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await fileApi.getUserFiles();
      setFiles(data);
      setError(null);
    } catch (error: unknown) {
      console.error("Error fetching files:", error);
      setError("Failed to load your files. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchFiles();
    }
  }, [user, fetchFiles]);

  const handleSearch = async () => {
    if (!searchTags.trim()) {
      fetchFiles();
      return;
    }

    try {
      setLoading(true);
      const tags = searchTags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);
      if (tags.length > 0) {
        const data = await fileApi.searchByTags(tags);
        setFiles(data);
      } else {
        await fetchFiles();
      }
      setError(null);
    } catch (error: unknown) {
      console.error("Error searching files:", error);
      setError("Failed to search files. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleCopyLink = (file: FileShare) => {
    const baseUrl = window.location.origin;
    const fileUrl = file.customUrl
      ? `${baseUrl}/files/${file.customUrl}`
      : `${baseUrl}/files/${file.id}`;

    navigator.clipboard
      .writeText(fileUrl)
      .then(() => {
        toast.success("Link copied to clipboard!");
      })
      .catch((error: Error) => {
        console.error("Failed to copy link:", error);
        toast.error("Failed to copy link");
      });
  };

  const handleDownload = async (file: FileShare) => {
    try {
      // If file has password protection, show password dialog
      if (file.password) {
        setSelectedFile(file);
        setPasswordDialogOpen(true);
        setViewActionType("download");
        return;
      }

      // Download file directly if no password
      await downloadFile(file.id);
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

  const downloadFile = async (fileId: string, password?: string) => {
    try {
      const blob = await fileApi.getFile(fileId, password);

      // Create a download link and trigger it
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;

      // Get the file from our state to use its filename
      const file = files.find((f) => f.id === fileId);
      a.download = file?.fileName || "download";

      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Reset password dialog
      setPasswordDialogOpen(false);
      setDownloadPassword("");
      setSelectedFile(null);

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

  const handlePasswordSubmit = () => {
    if (!selectedFile) return;

    if (viewActionType === "view") {
      if (isImageFile(selectedFile.fileName)) {
        // For images with password, just close the dialog and show the viewer
        setPasswordDialogOpen(false);
        setDownloadPassword("");
      } else {
        fetchFileContent(selectedFile.id, downloadPassword);
      }
    } else {
      downloadFile(selectedFile.id, downloadPassword);
    }
  };

  const confirmDelete = (fileId: string) => {
    setFileToDelete(fileId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!fileToDelete) return;

    try {
      const success = await fileApi.deleteFile(fileToDelete);

      if (success) {
        toast.success("File deleted successfully");
        // Remove the file from our state
        setFiles(files.filter((file) => file.id !== fileToDelete));
      } else {
        toast.error("Failed to delete file");
      }
    } catch (error: unknown) {
      console.error("Delete error:", error);
      toast.error("Failed to delete file");
    } finally {
      // Close the dialog and reset state
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const isExpired = (file: FileShare) => {
    if (!file.expiresAt) return false;
    const expiryDate = new Date(file.expiresAt);
    return expiryDate < new Date();
  };

  const isDownloadLimitReached = (file: FileShare) => {
    if (!file.maxDownloads) return false;
    return file.currentDownloads >= file.maxDownloads;
  };

  const getFileStatus = (file: FileShare) => {
    if (isExpired(file)) {
      return <Chip label="Expired" color="error" size="small" />;
    }

    if (isDownloadLimitReached(file)) {
      return <Chip label="Limit reached" color="error" size="small" />;
    }

    return <Chip label="Active" color="success" size="small" />;
  };

  const navigateToDetail = (fileId: string) => {
    navigate(`/files/${fileId}`);
  };

  const handleViewFile = async (file: FileShare) => {
    try {
      setSelectedFile(file);
      setContentLoading(true);
      setContentError(undefined);
      setViewerOpen(true);

      // If file has password protection, show password dialog for view
      if (file.password) {
        setPasswordDialogOpen(true);
        setViewActionType("view");
        return;
      }

      // For image files, no need to fetch content as we'll use the direct URL in the viewer
      if (isImageFile(file.fileName)) {
        setContentError(undefined);
        setContentLoading(false);
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
      // Get the file from our state
      const file = files.find((f) => f.id === fileId);

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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
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
        My Files
      </Typography>

      <Box sx={{ mb: 3, display: "flex", alignItems: "center" }}>
        <TextField
          label="Search by tags"
          placeholder="Enter tags separated by commas"
          variant="outlined"
          size="small"
          fullWidth
          value={searchTags}
          onChange={(e) => setSearchTags(e.target.value)}
          onKeyPress={handleKeyPress}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={handleSearch} size="small">
                  <Search />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
          <CircularProgress />
        </Box>
      ) : files.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="body1">
            You don't have any files yet. Upload your first file!
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>File Name</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Tags</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Downloads</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      {file.fileName}
                      {file.password && (
                        <Tooltip title="Password protected">
                          <LockOutlined
                            fontSize="small"
                            sx={{ ml: 1, color: "text.secondary" }}
                          />
                        </Tooltip>
                      )}
                      {file.expiresAt && (
                        <Tooltip
                          title={`Expires at ${formatDate(file.expiresAt)}`}
                        >
                          <AccessTimeOutlined
                            fontSize="small"
                            sx={{ ml: 1, color: "text.secondary" }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                    {file.customUrl && (
                      <Typography variant="caption" color="textSecondary">
                        Custom URL: {file.customUrl}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(file.createdAt)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {file.tags.map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                      {file.tags.length === 0 && (
                        <Typography variant="caption" color="textSecondary">
                          No tags
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{getFileStatus(file)}</TableCell>
                  <TableCell>
                    {file.currentDownloads}{" "}
                    {file.maxDownloads ? `/ ${file.maxDownloads}` : ""}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                      <Tooltip title="Download">
                        <IconButton
                          onClick={() => handleDownload(file)}
                          disabled={
                            isExpired(file) || isDownloadLimitReached(file)
                          }
                        >
                          <GetAppOutlined />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Copy Link">
                        <IconButton onClick={() => handleCopyLink(file)}>
                          <ContentCopyOutlined />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Open Details">
                        <IconButton onClick={() => navigateToDetail(file.id)}>
                          <OpenInNew />
                        </IconButton>
                      </Tooltip>
                      {isViewableFile(file.fileName) && (
                        <Tooltip title="View">
                          <IconButton onClick={() => handleViewFile(file)}>
                            <VisibilityOutlined />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Delete">
                        <IconButton onClick={() => confirmDelete(file.id)}>
                          <DeleteOutline />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

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
            {viewActionType === "view" ? "View" : "Download"}
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
            Are you sure you want to delete this file? This action cannot be
            undone.
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
        fileId={selectedFile?.id || ""}
        fileName={selectedFile?.fileName || ""}
        fileContent={fileContent}
        loading={contentLoading}
        error={contentError}
      />
    </Container>
  );
};

export default FileList;
