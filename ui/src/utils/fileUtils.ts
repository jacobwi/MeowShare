import {
  Description,
  Image,
  VideoFile,
  PictureAsPdf,
  AudioFile,
  Code,
  InsertDriveFile,
  SvgIconComponent,
} from "@mui/icons-material";

/**
 * Returns the appropriate icon component for a given file extension
 * @param extension The file extension (without the dot)
 * @returns MUI icon component for the file type
 */
export const getFileTypeIcon = (extension: string): SvgIconComponent => {
  const ext = extension.toLowerCase();

  // Images
  if (["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp"].includes(ext)) {
    return Image;
  }

  // Documents
  if (["pdf"].includes(ext)) {
    return PictureAsPdf;
  }

  // Text files
  if (["txt", "rtf", "doc", "docx", "odt"].includes(ext)) {
    return Description;
  }

  // Video files
  if (["mp4", "webm", "mov", "avi", "wmv", "flv"].includes(ext)) {
    return VideoFile;
  }

  // Audio files
  if (["mp3", "wav", "ogg", "flac", "m4a"].includes(ext)) {
    return AudioFile;
  }

  // Code files
  if (
    [
      "js",
      "ts",
      "jsx",
      "tsx",
      "html",
      "css",
      "scss",
      "json",
      "xml",
      "py",
      "java",
      "c",
      "cpp",
      "cs",
      "php",
      "rb",
    ].includes(ext)
  ) {
    return Code;
  }

  // Default
  return InsertDriveFile;
};

/**
 * File extension collections for different types of files
 */
export const fileExtensions = {
  // Image files
  image: ["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp", "ico"],

  // Plain text
  plainText: ["txt", "log", "csv"],

  // Markdown
  markdown: ["md", "markdown"],

  // Web files
  web: ["html", "css", "js", "jsx", "ts", "tsx", "json", "xml", "yaml", "yml"],

  // Code files
  code: [
    "cs",
    "java",
    "py",
    "rb",
    "php",
    "go",
    "rust",
    "c",
    "cpp",
    "sql",
    "sh",
    "bat",
    "ps1",
  ],

  // Document files
  document: ["pdf", "doc", "docx", "odt", "rtf"],

  // Audio files
  audio: ["mp3", "wav", "ogg", "flac", "m4a", "aac"],

  // Video files
  video: ["mp4", "webm", "mov", "avi", "wmv", "flv", "mkv"],
};

/**
 * Get all file extensions that can be viewed in the file viewer
 * @returns Array of viewable file extensions
 */
export const getViewableExtensions = (): string[] => {
  return [
    ...fileExtensions.plainText,
    ...fileExtensions.markdown,
    ...fileExtensions.web,
    ...fileExtensions.code,
    ...fileExtensions.image,
  ];
};

/**
 * Extract the file extension from a filename
 * @param filename The filename to extract the extension from
 * @returns The lowercase extension without the dot, or empty string if no extension
 */
export const getFileExtension = (filename: string): string => {
  return filename.split(".").pop()?.toLowerCase() || "";
};

/**
 * Check if a file is an image based on its extension
 * @param filename The filename to check
 * @returns True if the file is an image, false otherwise
 */
export const isImageFile = (filename: string): boolean => {
  const extension = getFileExtension(filename);
  return fileExtensions.image.includes(extension);
};

/**
 * Check if a file is viewable in the file content viewer
 * @param filename The filename to check
 * @returns True if the file is viewable, false otherwise
 */
export const isViewableFile = (filename: string): boolean => {
  const extension = getFileExtension(filename);
  return getViewableExtensions().includes(extension);
};

/**
 * Check if a file is a text-based file that can be loaded as text
 * @param filename The filename to check
 * @returns True if the file is text-based, false otherwise
 */
export const isTextBasedFile = (filename: string): boolean => {
  const extension = getFileExtension(filename);
  const textBasedExtensions = [
    ...fileExtensions.plainText,
    ...fileExtensions.markdown,
    ...fileExtensions.web,
    ...fileExtensions.code,
  ];

  return textBasedExtensions.includes(extension);
};
