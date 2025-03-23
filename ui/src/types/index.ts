export interface FileShare {
  id: string;
  fileName: string;
  fileType: string;
  size: number;
  fileSize: number;
  contentType: string;
  currentDownloads: number;
  createdAt: string;
  expiresAt?: string;
  customUrl?: string;
  tags: string[];
  userId: string;
  isPublic: boolean;
  password?: string;
  maxDownloads?: number;
  downloadCount: number;
  lastDownloadedAt?: string;
  description?: string;
  thumbnailUrl?: string;
  metadata?: Record<string, unknown>;
  folderPath?: string;
  filePath: string;
}

export interface ShareFileRequest {
  file?: File;
  customUrl?: string;
  password?: string;
  expiresAt?: string;
  maxDownloads?: number;
  tags?: string[];
  folderPath?: string;
}

export interface ChunkUploadRequest {
  chunk: File;
  fileId: string;
  chunkNumber: number;
  totalChunks: number;
  fileName: string;
  customUrl?: string;
  password?: string;
  expiresAt?: string;
  maxDownloads?: number;
  tags?: string[];
  folderPath?: string;
}

// User & Authentication
export interface User {
  id: string;
  username: string;
  email?: string;
  role?: string;
  token: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
}

export interface ImpersonationStatus {
  isImpersonating: boolean;
  originalUser?: User;
  impersonatedUser?: User;
}

// App Configuration
export interface AppConfig {
  APP_NAME: string;
  API_URL: string;
  APP_VERSION: string;
  DEBUG_MODE: boolean;
  MAX_FILE_SIZE: number;
  CHUNK_SIZE: number;
  DEFAULT_EXPIRATION_DAYS: number;
  [key: string]: string | boolean | number;
}

// Theme related types
export type ThemeMode = "light" | "dark";
export type FontSize = "small" | "medium" | "large";

export interface AppearanceSettings {
  mode: ThemeMode;
  fontSize: FontSize;
  compactMode: boolean;
  showProfileInfo: boolean;
  shareActivity: boolean;
  language: string;
}

// Email related types
export interface EmailOptions {
  to: string | string[];
  subject: string;
  body: string;
  isHtml?: boolean;
  attachments?: EmailAttachment[];
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

export interface EmailAttachment {
  filename: string;
  content: File | Blob | string;
  contentType?: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  isHtml: boolean;
  variables: string[];
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface EmailConfigSettings {
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword?: string;
  smtpFromEmail: string;
  smtpFromName?: string;
  enableSsl: boolean;
}

export interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface TemplateRenderResponse {
  subject: string;
  body: string;
}
