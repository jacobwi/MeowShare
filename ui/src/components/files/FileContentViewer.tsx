import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from "@mui/material";
import ReactMarkdown from "react-markdown";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  vscDarkPlus,
  vs,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "@mui/material/styles";
import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Refresh as ResetZoomIcon,
  Download as DownloadIcon,
} from "@mui/icons-material";
import {
  getFileExtension,
  isImageFile,
  fileExtensions,
} from "../../utils/fileUtils";
import { fileApi } from "../../services/file-share-service";

interface FileContentViewerProps {
  open: boolean;
  onClose: () => void;
  fileId: string;
  fileName: string;
  fileContent?: string;
  loading: boolean;
  error?: string;
  password?: string;
}

const FileContentViewer: React.FC<FileContentViewerProps> = ({
  open,
  onClose,
  fileId,
  fileName,
  fileContent,
  loading,
  error,
  password,
}) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";
  const [viewMode, setViewMode] = useState<"rendered" | "raw">("rendered");
  const [imageZoom, setImageZoom] = useState(100);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState<string | undefined>();

  const handleChangeViewMode = (
    _: React.SyntheticEvent,
    newValue: "rendered" | "raw",
  ) => {
    setViewMode(newValue);
  };

  const getLanguage = (extension: string): string => {
    const extensionMap: Record<string, string> = {
      // Frontend
      js: "javascript",
      jsx: "jsx",
      ts: "typescript",
      tsx: "tsx",
      html: "html",
      css: "css",
      scss: "scss",
      json: "json",

      // Backend
      cs: "csharp",
      java: "java",
      py: "python",
      rb: "ruby",
      php: "php",
      go: "go",
      rust: "rust",
      c: "c",
      cpp: "cpp",

      // Config and others
      xml: "xml",
      yaml: "yaml",
      yml: "yaml",
      md: "markdown",
      sql: "sql",
      sh: "bash",
      bat: "batch",
      ps1: "powershell",
    };

    return extensionMap[extension] || "text";
  };

  const isTextFile = (extension: string): boolean => {
    return [
      ...fileExtensions.plainText,
      ...fileExtensions.markdown,
      ...fileExtensions.web,
      ...fileExtensions.code,
    ].includes(extension);
  };

  const isMarkdownFile = (extension: string): boolean => {
    return fileExtensions.markdown.includes(extension);
  };

  const isCodeFile = (extension: string): boolean => {
    return [...fileExtensions.web, ...fileExtensions.code].includes(extension);
  };

  const handleResetZoom = () => {
    setImageZoom(100);
  };

  const loadImageFile = useCallback(async () => {
    try {
      setContentLoading(true);
      const blob = await fileApi.getFile(fileId, password);
      const url = URL.createObjectURL(blob);
      setImageUrl(url);
      setContentError(undefined);
      return () => URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error loading image:", error);
      setContentError("Failed to load image");
    } finally {
      setContentLoading(false);
    }
  }, [fileId, password]);

  useEffect(() => {
    if (open && fileId && fileName) {
      const extension = fileName.split(".").pop()?.toLowerCase() || "";
      if (isImageFile(extension)) {
        loadImageFile();
      }
    }
  }, [open, fileName, fileId, loadImageFile]);

  const handleZoomIn = () => {
    setImageZoom((prev) => Math.min(prev + 25, 400));
  };

  const handleZoomOut = () => {
    setImageZoom((prev) => Math.max(prev - 25, 25));
  };

  const handleDownloadImage = async () => {
    try {
      const blob = await fileApi.getFile(fileId);

      // Create a download link and trigger it
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = fileName;

      document.body.appendChild(a);
      a.click();

      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    } catch (err) {
      console.error("Download error:", err);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error || contentError) {
      return <Alert severity="error">{error || contentError}</Alert>;
    }

    const fileExtension = getFileExtension(fileName);

    // Handle image files
    if (isImageFile(fileExtension)) {
      return (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            p: 2,
            position: "relative",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              bgcolor: "background.paper",
              borderRadius: 1,
              boxShadow: 1,
              p: 0.5,
              display: "flex",
            }}
          >
            <Tooltip title="Zoom In">
              <IconButton size="small" onClick={handleZoomIn}>
                <ZoomInIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom Out">
              <IconButton size="small" onClick={handleZoomOut}>
                <ZoomOutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reset Zoom">
              <IconButton size="small" onClick={handleResetZoom}>
                <ResetZoomIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download Image">
              <IconButton size="small" onClick={handleDownloadImage}>
                <DownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          {contentLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box
              sx={{
                maxHeight: "calc(60vh - 40px)",
                maxWidth: "100%",
                overflow: "auto",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={fileName}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                    transform: `scale(${imageZoom / 100})`,
                    transformOrigin: "center",
                    transition: "transform 0.2s ease",
                  }}
                />
              ) : (
                <Alert severity="info">Image could not be loaded</Alert>
              )}
            </Box>
          )}
          <Typography variant="caption" sx={{ mt: 2 }}>
            Zoom: {imageZoom}%
          </Typography>
        </Box>
      );
    }

    if (!fileContent) {
      return (
        <Alert severity="info">No content available or binary file.</Alert>
      );
    }

    if (!isTextFile(fileExtension)) {
      return (
        <Alert severity="info">
          This file type cannot be previewed. Please download the file to view
          its contents.
        </Alert>
      );
    }

    if (viewMode === "raw") {
      return (
        <Box
          component="pre"
          sx={{
            p: 2,
            overflowX: "auto",
            maxHeight: "60vh",
            backgroundColor: isDarkMode
              ? "rgba(0, 0, 0, 0.12)"
              : "rgba(0, 0, 0, 0.04)",
            borderRadius: 1,
            fontFamily: '"Roboto Mono", monospace',
            fontSize: "0.875rem",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {fileContent}
        </Box>
      );
    }

    if (isMarkdownFile(fileExtension)) {
      return (
        <Box
          sx={{
            p: 2,
            overflowY: "auto",
            maxHeight: "60vh",
            "& img": {
              maxWidth: "100%",
              height: "auto",
            },
            "& a": {
              color: "primary.main",
            },
            "& code": {
              backgroundColor: isDarkMode
                ? "rgba(0, 0, 0, 0.12)"
                : "rgba(0, 0, 0, 0.04)",
              borderRadius: 1,
              padding: "2px 4px",
              fontFamily: '"Roboto Mono", monospace',
              fontSize: "0.875rem",
            },
          }}
        >
          <ReactMarkdown>{fileContent}</ReactMarkdown>
        </Box>
      );
    }

    if (isCodeFile(fileExtension)) {
      return (
        <Box
          sx={{
            overflowX: "auto",
            maxHeight: "60vh",
            fontSize: "0.875rem",
            "& pre": {
              margin: 0,
              borderRadius: 1,
            },
          }}
        >
          <SyntaxHighlighter
            language={getLanguage(fileExtension)}
            style={isDarkMode ? vscDarkPlus : vs}
            customStyle={{ margin: 0 }}
            showLineNumbers
          >
            {fileContent}
          </SyntaxHighlighter>
        </Box>
      );
    }

    // Fallback for other text files
    return (
      <Box
        component="pre"
        sx={{
          p: 2,
          overflowX: "auto",
          maxHeight: "60vh",
          backgroundColor: isDarkMode
            ? "rgba(0, 0, 0, 0.12)"
            : "rgba(0, 0, 0, 0.04)",
          borderRadius: 1,
          fontFamily: '"Roboto Mono", monospace',
          fontSize: "0.875rem",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {fileContent}
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          height: "80vh",
        },
      }}
    >
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" component="div" noWrap sx={{ mr: 2 }}>
            {fileName}
          </Typography>
          {isTextFile(getFileExtension(fileName)) &&
            !loading &&
            fileContent && (
              <Tabs value={viewMode} onChange={handleChangeViewMode}>
                <Tab label="Rendered" value="rendered" />
                <Tab label="Raw" value="raw" />
              </Tabs>
            )}
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Paper
          elevation={0}
          sx={{
            p: 0,
            height: "100%",
            backgroundColor: isDarkMode
              ? "rgba(0, 0, 0, 0.12)"
              : "rgba(0, 0, 0, 0.04)",
            overflow: "auto",
          }}
        >
          {renderContent()}
        </Paper>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FileContentViewer;
