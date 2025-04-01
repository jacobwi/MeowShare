import React, { useState } from "react";
import {
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Paper,
  Typography,
  Chip,
  Stack,
  CircularProgress,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Button,
  Tooltip,
} from "@mui/material";
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material";
import { fileApi } from "../../services/file-share-service";
import { FileShare } from "../../types";
import { formatDate } from "../../utils/dateUtils";

interface SearchFilters {
  fileType: string;
  dateRange: string;
  sortBy: string;
}

const FileSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [files, setFiles] = useState<FileShare[]>([]);
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    fileType: "all",
    dateRange: "all",
    sortBy: "newest",
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const results = await fileApi.searchFiles(searchQuery);
      setFiles(results);
    } catch (error) {
      console.error("Error searching files:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSearchQuery("");
    setFiles([]);
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setAnchorEl(null);
  };

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    handleFilterClose();
  };

  const filteredFiles = files.filter((file) => {
    if (filters.fileType !== "all" && file.fileType !== filters.fileType) {
      return false;
    }
    if (filters.dateRange !== "all") {
      const fileDate = new Date(file.createdAt);
      const now = new Date();
      const daysDiff = Math.floor(
        (now.getTime() - fileDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      switch (filters.dateRange) {
        case "today":
          return daysDiff === 0;
        case "week":
          return daysDiff <= 7;
        case "month":
          return daysDiff <= 30;
        case "year":
          return daysDiff <= 365;
        default:
          return true;
      }
    }
    return true;
  });

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    switch (filters.sortBy) {
      case "newest":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "oldest":
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case "name":
        return a.fileName.localeCompare(b.fileName);
      default:
        return 0;
    }
  });

  return (
    <Box sx={{ width: "100%" }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
        }}
      >
        <Stack spacing={2}>
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search files by name, tags, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleClear}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={!searchQuery.trim() || loading}
            >
              {loading ? <CircularProgress size={24} /> : "Search"}
            </Button>
          </Box>

          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Tooltip title="Filter results">
              <IconButton onClick={handleFilterClick}>
                <FilterIcon />
              </IconButton>
            </Tooltip>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Sort by</InputLabel>
              <Select
                value={filters.sortBy}
                label="Sort by"
                onChange={(e) => handleFilterChange("sortBy", e.target.value)}
              >
                <MenuItem value="newest">Newest first</MenuItem>
                <MenuItem value="oldest">Oldest first</MenuItem>
                <MenuItem value="name">Name (A-Z)</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Stack>
      </Paper>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleFilterClose}
      >
        <MenuItem>
          <FormControl fullWidth>
            <InputLabel>File Type</InputLabel>
            <Select
              value={filters.fileType}
              label="File Type"
              onChange={(e) => handleFilterChange("fileType", e.target.value)}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="image">Images</MenuItem>
              <MenuItem value="document">Documents</MenuItem>
              <MenuItem value="video">Videos</MenuItem>
              <MenuItem value="audio">Audio</MenuItem>
              <MenuItem value="archive">Archives</MenuItem>
            </Select>
          </FormControl>
        </MenuItem>
        <MenuItem>
          <FormControl fullWidth>
            <InputLabel>Date Range</InputLabel>
            <Select
              value={filters.dateRange}
              label="Date Range"
              onChange={(e) => handleFilterChange("dateRange", e.target.value)}
            >
              <MenuItem value="all">All Time</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">Last 7 Days</MenuItem>
              <MenuItem value="month">Last 30 Days</MenuItem>
              <MenuItem value="year">Last Year</MenuItem>
            </Select>
          </FormControl>
        </MenuItem>
      </Menu>

      {files.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" gutterBottom>
            Search Results ({filteredFiles.length})
          </Typography>
          <Stack spacing={2}>
            {sortedFiles.map((file) => (
              <Paper
                key={file.id}
                elevation={0}
                sx={{
                  p: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  "&:hover": {
                    borderColor: "primary.main",
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      {file.fileName}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={file.fileType}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Typography variant="body2" color="text.secondary">
                        Created {formatDate(file.createdAt)}
                      </Typography>
                    </Stack>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {file.currentDownloads} downloads
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            ))}
          </Stack>
        </Paper>
      )}
    </Box>
  );
};

export default FileSearch;
