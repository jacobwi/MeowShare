import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Card,
  CardContent,
  Divider,
  Stack,
  Switch,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  GetApp as DownloadIcon,
  Link as LinkIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  Schedule as ScheduleIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ContentCopy as ContentCopyIcon,
  DeleteSweep as DeleteSweepIcon,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import { FileShare } from "../../types";
import fileAdminService from "../../services/file-admin-service";
import { fileApi } from "../../services/file-share-service";
import { useConfig } from "../../context/ConfigContext";

// File statistics interface
interface FileStats {
  totalFiles: number;
  totalSize: number;
  filesByType: Record<string, number>;
  expiredFiles: number;
  passwordProtectedFiles: number;
}

interface FileMetadata {
  fileSize: number;
  contentType: string;
  uploadDate: string;
  lastDownloadDate?: string;
  uploadedBy: {
    id: string;
    username: string;
  };
  filePath: string;
}

const FileManagementPanel: React.FC = () => {
  const { config } = useConfig();
  const [files, setFiles] = useState<FileShare[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | undefined>(
    undefined,
  );
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileShare | null>(null);
  const [fileMetadata, setFileMetadata] = useState<FileMetadata | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [stats, setStats] = useState<FileStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedFile, setEditedFile] = useState<Partial<FileShare>>({});
  const [bulkSelection, setBulkSelection] = useState<string[]>([]);
  const [showStats, setShowStats] = useState(true);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [openCleanupDialog, setOpenCleanupDialog] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles();
    fetchStats();
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fileAdminService.getAllFiles();
      setFiles(response);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load files";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);

    try {
      const response = await fileAdminService.getFileStats();
      setStats(response);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load stats";
      setError(message);
      toast.error(message);
    } finally {
      setStatsLoading(false);
    }
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  const handleFilterChange = (event: SelectChangeEvent<string>) => {
    setFilterStatus(event.target.value);
    setPage(0);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setFilterStatus("all");
  };

  const handleViewDetails = async (file: FileShare) => {
    setSelectedFile(file);
    setLoading(true);

    try {
      // For real implementation, we would get file metadata from the API
      // For now we can use the existing file data
      setFileMetadata({
        fileSize: file.fileSize || 0,
        contentType: file.contentType || "application/octet-stream",
        uploadDate: file.createdAt,
        lastDownloadDate:
          file.currentDownloads > 0 ? "2025-03-15T12:34:56Z" : undefined,
        uploadedBy: {
          id: file.userId,
          username:
            file.userId === "1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p"
              ? "admin"
              : "user1",
        },
        filePath: file.filePath,
      });

      setOpenDetailsDialog(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load file details";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (fileId: string) => {
    setFileToDelete(fileId);
    setOpenDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;

    setLoading(true);
    try {
      await fileAdminService.deleteFile(fileToDelete);

      // Remove file from the local state
      setFiles((prevFiles) =>
        prevFiles.filter((file) => file.id !== fileToDelete),
      );

      setOpenDeleteDialog(false);
      toast.success("File deleted successfully");

      // Update stats after deletion
      fetchStats();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete file";
      toast.error(message);
    } finally {
      setLoading(false);
      setFileToDelete(undefined);
    }
  };

  const handleDeleteCancel = () => {
    setOpenDeleteDialog(false);
    setFileToDelete(undefined);
  };

  const handleCloseDetails = () => {
    setOpenDetailsDialog(false);
    setSelectedFile(null);
    setFileMetadata(null);
  };

  const handleEditFile = () => {
    if (!selectedFile) return;
    setEditedFile({ ...selectedFile });
    setEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedFile || !editedFile) return;

    setLoading(true);
    try {
      const updatedFile = await fileAdminService.updateFile(
        selectedFile.id,
        editedFile,
      );

      // Update the file in the local state
      setFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.id === updatedFile.id ? updatedFile : file,
        ),
      );

      setSelectedFile(updatedFile);
      setEditMode(false);
      toast.success("File updated successfully");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to update file";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedFile({});
  };

  const handleEditChange = (
    key: keyof FileShare,
    value: FileShare[keyof FileShare],
  ) => {
    setEditedFile((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCopyLink = (customUrl: string) => {
    const apiUrl = config.API_URL || "";
    const baseUrl = apiUrl.split("/api")[0];
    const shareUrl = customUrl
      ? `${baseUrl}/share/${customUrl}`
      : `${baseUrl}/share/${selectedFile?.id}`;

    navigator.clipboard.writeText(shareUrl);
    toast.info("Share link copied to clipboard");
  };

  const toggleFileSelection = (fileId: string) => {
    setBulkSelection((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId],
    );
  };

  const handleBulkDelete = async () => {
    setLoading(true);
    try {
      // In a real implementation, we would batch delete files
      for (const fileId of bulkSelection) {
        await fileAdminService.deleteFile(fileId);
      }

      // Remove files from the local state
      setFiles((prevFiles) =>
        prevFiles.filter((file) => !bulkSelection.includes(file.id)),
      );

      setBulkSelection([]);
      toast.success(`${bulkSelection.length} files deleted successfully`);

      // Update stats after deletion
      fetchStats();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to delete files";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const toggleShowStats = () => {
    setShowStats((prev) => !prev);
  };

  const isExpired = (file: FileShare) => {
    if (!file.expiresAt) return false;
    return new Date(file.expiresAt) < new Date();
  };

  const isMaxDownloadsReached = (file: FileShare) => {
    if (!file.maxDownloads) return false;
    return (file.currentDownloads || 0) >= file.maxDownloads;
  };

  const formatBytes = (bytes: number): string => {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "0 Bytes";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const handleCleanupClick = () => {
    setOpenCleanupDialog(true);
  };

  const handleCleanupConfirm = async () => {
    setCleanupLoading(true);
    try {
      const result = await fileAdminService.cleanupExpiredFiles();
      toast.success(
        `Successfully cleaned up ${result.deletedCount} expired files`,
      );
      setOpenCleanupDialog(false);
      // Refresh the files list and stats
      fetchFiles();
      fetchStats();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to cleanup expired files";
      toast.error(message);
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleCleanupCancel = () => {
    setOpenCleanupDialog(false);
  };

  return (
    <Box sx={{ mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Box sx={{ mb: 4 }}>
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Typography variant="h6">File Statistics</Typography>
          <FormControlLabel
            control={<Switch checked={showStats} onChange={toggleShowStats} />}
            label="Show Statistics"
          />
        </Stack>
        {showStats && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Files
                </Typography>
                <Typography variant="h4">
                  {statsLoading ? (
                    <CircularProgress size={20} />
                  ) : (
                    stats?.totalFiles || 0
                  )}
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Total Storage Used
                </Typography>
                <Typography variant="h4">
                  {statsLoading ? (
                    <CircularProgress size={20} />
                  ) : (
                    formatBytes(stats?.totalSize || 0)
                  )}
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Password Protected
                </Typography>
                <Typography variant="h4">
                  {statsLoading ? (
                    <CircularProgress size={20} />
                  ) : (
                    stats?.passwordProtectedFiles || 0
                  )}
                </Typography>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>
                  Expired Files
                </Typography>
                <Typography variant="h4">
                  {statsLoading ? (
                    <CircularProgress size={20} />
                  ) : (
                    stats?.expiredFiles || 0
                  )}
                </Typography>
              </CardContent>
            </Card>
          </div>
        )}
      </Box>

      {/* Search and Filter Tools */}
      <Paper
        sx={{
          p: 2,
          mb: 4,
          borderRadius: 1,
          display: "flex",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <TextField
          placeholder="Search files..."
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={clearSearch}>
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ flex: 1, minWidth: 250 }}
        />

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="filter-status-label">Status Filter</InputLabel>
          <Select
            labelId="filter-status-label"
            id="filter-status"
            value={filterStatus}
            label="Status Filter"
            onChange={handleFilterChange}
            startAdornment={
              <InputAdornment position="start">
                <FilterListIcon />
              </InputAdornment>
            }
          >
            <MenuItem value="all">All Files</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="expired">Expired</MenuItem>
            <MenuItem value="maxed">Download Limit Reached</MenuItem>
            <MenuItem value="protected">Password Protected</MenuItem>
            <MenuItem value="public">Public (No Password)</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          color="warning"
          startIcon={<DeleteSweepIcon />}
          onClick={handleCleanupClick}
          disabled={cleanupLoading}
        >
          Cleanup Expired
        </Button>

        {bulkSelection.length > 0 && (
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleBulkDelete}
            disabled={loading}
          >
            Delete Selected ({bulkSelection.length})
          </Button>
        )}
      </Paper>

      {/* Files Table */}
      <Paper sx={{ width: "100%", overflow: "hidden", borderRadius: 1 }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader aria-label="file management table">
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={
                      bulkSelection.length > 0 &&
                      bulkSelection.length < files.length
                    }
                    checked={
                      files.length > 0 && bulkSelection.length === files.length
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setBulkSelection(files.map((file) => file.id));
                      } else {
                        setBulkSelection([]);
                      }
                    }}
                    disabled={loading}
                  />
                </TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Custom URL</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell>Downloads</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={32} />
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      Loading files...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : files.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      No files found matching the criteria
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                files
                  .filter((file) => {
                    // Search filter
                    const searchTerms = searchQuery.toLowerCase().split(" ");
                    const matchesSearch = searchTerms.every(
                      (term) =>
                        file.fileName.toLowerCase().includes(term) ||
                        file.customUrl?.toLowerCase().includes(term) ||
                        file.tags?.some((tag) =>
                          tag.toLowerCase().includes(term),
                        ),
                    );

                    if (!matchesSearch) return false;

                    // Status filter
                    switch (filterStatus) {
                      case "active":
                        return !isExpired(file) && !isMaxDownloadsReached(file);
                      case "expired":
                        return isExpired(file);
                      case "maxed":
                        return isMaxDownloadsReached(file);
                      case "protected":
                        return !!file.password;
                      case "public":
                        return !file.password;
                      default:
                        return true;
                    }
                  })
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((file) => {
                    const isItemExpired = isExpired(file);
                    const isItemMaxed = isMaxDownloadsReached(file);

                    return (
                      <TableRow
                        key={file.id}
                        sx={{
                          "&:hover": { bgcolor: "action.hover" },
                          ...(isItemExpired && { opacity: 0.7 }),
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={bulkSelection.includes(file.id)}
                            onChange={() => toggleFileSelection(file.id)}
                            disabled={loading}
                          />
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            {file.password && (
                              <LockIcon fontSize="small" color="action" />
                            )}
                            <Typography
                              variant="body2"
                              sx={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: 200,
                                display: "inline-block",
                              }}
                            >
                              {file.fileName}
                            </Typography>
                          </Box>
                          <Box sx={{ mt: 0.5 }}>
                            {file.tags &&
                              file.tags.map((tag) => (
                                <Chip
                                  key={tag}
                                  label={tag}
                                  size="small"
                                  variant="outlined"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                />
                              ))}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {file.customUrl ? (
                            <Chip
                              icon={<LinkIcon fontSize="small" />}
                              label={file.customUrl}
                              size="small"
                              clickable
                              onClick={() => handleCopyLink(file.customUrl!)}
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              None
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{formatBytes(file.fileSize || 0)}</TableCell>
                        <TableCell>{formatDate(file.createdAt)}</TableCell>
                        <TableCell>
                          {file.expiresAt ? (
                            <Chip
                              icon={<ScheduleIcon fontSize="small" />}
                              label={formatDate(file.expiresAt)}
                              size="small"
                              color={isItemExpired ? "error" : "default"}
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              Never
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {file.maxDownloads ? (
                            <Chip
                              label={`${file.currentDownloads || 0}/${file.maxDownloads}`}
                              size="small"
                              color={isItemMaxed ? "error" : "default"}
                            />
                          ) : (
                            <Typography variant="body2">
                              {file.currentDownloads || 0}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {isItemExpired ? (
                            <Chip label="Expired" size="small" color="error" />
                          ) : isItemMaxed ? (
                            <Chip
                              label="Max Downloads"
                              size="small"
                              color="error"
                            />
                          ) : (
                            <Chip label="Active" size="small" color="success" />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(file)}
                            title="View Details"
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteClick(file.id)}
                            title="Delete File"
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
          component="div"
          count={files.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm File Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this file? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            disabled={loading}
            startIcon={
              loading ? <CircularProgress size={20} /> : <DeleteIcon />
            }
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* File Details Dialog */}
      <Dialog
        open={openDetailsDialog}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          File Details
          <IconButton
            aria-label="close"
            onClick={handleCloseDetails}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
            }}
          >
            <ClearIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {!selectedFile ? (
            <CircularProgress />
          ) : editMode ? (
            <Stack spacing={3}>
              <TextField
                label="File Name"
                fullWidth
                value={editedFile.fileName || ""}
                onChange={(e) => handleEditChange("fileName", e.target.value)}
              />

              <TextField
                label="Custom URL"
                fullWidth
                value={editedFile.customUrl || ""}
                onChange={(e) => handleEditChange("customUrl", e.target.value)}
                helperText="Leave empty to use file ID as URL"
              />

              <TextField
                label="Password"
                fullWidth
                type="password"
                value={editedFile.password || ""}
                onChange={(e) => handleEditChange("password", e.target.value)}
                helperText="Leave empty for no password protection"
              />

              <TextField
                label="Expiration Date"
                fullWidth
                type="datetime-local"
                value={
                  editedFile.expiresAt
                    ? new Date(editedFile.expiresAt).toISOString().slice(0, 16)
                    : ""
                }
                onChange={(e) => handleEditChange("expiresAt", e.target.value)}
                InputLabelProps={{ shrink: true }}
                helperText="Leave empty for no expiration"
              />

              <TextField
                label="Max Downloads"
                fullWidth
                type="number"
                value={editedFile.maxDownloads || ""}
                onChange={(e) =>
                  handleEditChange(
                    "maxDownloads",
                    parseInt(e.target.value) || undefined,
                  )
                }
                helperText="Set to 0 for unlimited downloads"
              />

              <TextField
                label="Tags (comma separated)"
                fullWidth
                value={(editedFile.tags || []).join(", ")}
                onChange={(e) =>
                  handleEditChange(
                    "tags",
                    e.target.value.split(",").map((tag) => tag.trim()),
                  )
                }
              />
            </Stack>
          ) : (
            <div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 16,
                }}
              >
                <div>
                  <Typography variant="subtitle2" color="text.secondary">
                    File Name
                  </Typography>
                  <Typography variant="body1">
                    {selectedFile.fileName}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" color="text.secondary">
                    File Type
                  </Typography>
                  <Typography variant="body1">
                    {fileMetadata?.contentType || "Unknown"}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" color="text.secondary">
                    File Size
                  </Typography>
                  <Typography variant="body1">
                    {formatBytes(selectedFile.fileSize || 0)}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" color="text.secondary">
                    Uploaded By
                  </Typography>
                  <Typography variant="body1">
                    {fileMetadata?.uploadedBy?.username || "Unknown"}
                  </Typography>
                </div>

                <div>
                  <Typography variant="subtitle2" color="text.secondary">
                    Upload Date
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedFile.createdAt)}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" color="text.secondary">
                    Expiration Date
                  </Typography>
                  <Typography variant="body1">
                    {selectedFile.expiresAt
                      ? formatDate(selectedFile.expiresAt)
                      : "Never"}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" color="text.secondary">
                    Download Limit
                  </Typography>
                  <Typography variant="body1">
                    {selectedFile.maxDownloads
                      ? `${selectedFile.currentDownloads || 0}/${selectedFile.maxDownloads}`
                      : "Unlimited"}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" color="text.secondary">
                    Last Downloaded
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(fileMetadata?.lastDownloadDate)}
                  </Typography>
                </div>
              </div>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" color="text.secondary">
                Custom URL
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body1">
                  {selectedFile.customUrl || (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      component="span"
                    >
                      None (using file ID)
                    </Typography>
                  )}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => handleCopyLink(selectedFile.customUrl || "")}
                  title="Copy Link"
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" color="text.secondary">
                Password Protected
              </Typography>
              <Typography variant="body1">
                {selectedFile.password ? (
                  <Chip
                    icon={<LockIcon />}
                    label="Yes"
                    color="warning"
                    size="small"
                  />
                ) : (
                  <Chip
                    icon={<LockOpenIcon />}
                    label="No"
                    variant="outlined"
                    size="small"
                  />
                )}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" color="text.secondary">
                Tags
              </Typography>
              <div>
                {selectedFile.tags && selectedFile.tags.length > 0 ? (
                  selectedFile.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      sx={{ mr: 0.5, mb: 0.5 }}
                    />
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No tags
                  </Typography>
                )}
              </div>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" color="text.secondary">
                File Path
              </Typography>
              <Typography variant="body2" sx={{ wordBreak: "break-all" }}>
                {selectedFile.filePath}
              </Typography>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          {editMode ? (
            <>
              <Button onClick={handleCancelEdit} startIcon={<CancelIcon />}>
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                color="primary"
                variant="contained"
                startIcon={
                  loading ? <CircularProgress size={20} /> : <SaveIcon />
                }
                disabled={loading}
              >
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => {
                  if (selectedFile) {
                    try {
                      fileApi.getFile(selectedFile.id).then((blob) => {
                        // Create a download link and trigger it
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.style.display = "none";
                        a.href = url;
                        a.download = selectedFile.fileName || "download";

                        document.body.appendChild(a);
                        a.click();

                        // Clean up
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);

                        toast.success("File download started");
                      });
                    } catch (error) {
                      console.error("Download error:", error);
                      toast.error("Failed to download file");
                    }
                  }
                }}
                startIcon={<DownloadIcon />}
              >
                Download
              </Button>
              <Button
                onClick={handleEditFile}
                startIcon={<EditIcon />}
                color="primary"
              >
                Edit
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Cleanup Confirmation Dialog */}
      <Dialog open={openCleanupDialog} onClose={handleCleanupCancel}>
        <DialogTitle>Confirm Cleanup</DialogTitle>
        <DialogContent>
          <DialogContentText>
            This will permanently delete all expired files. This action cannot
            be undone. Are you sure you want to proceed?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCleanupCancel} disabled={cleanupLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleCleanupConfirm}
            color="warning"
            disabled={cleanupLoading}
            startIcon={
              cleanupLoading ? (
                <CircularProgress size={20} />
              ) : (
                <DeleteSweepIcon />
              )
            }
          >
            Cleanup
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FileManagementPanel;
