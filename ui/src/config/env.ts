// Environment variables with fallbacks
// Import version from package.json using Vite's special import.meta
// This is properly supported by Vite without additional configuration
const appVersion = "0.1.0-prealpha";

// Parse numeric environment variables with fallbacks
const parseEnvNumber = (
  envValue: string | undefined,
  defaultValue: number,
): number => {
  if (!envValue) return defaultValue;
  const parsed = parseInt(envValue, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

// Max file size (100MB default)
const MAX_FILE_SIZE = parseEnvNumber(
  import.meta.env.VITE_MAX_FILE_SIZE,
  100 * 1024 * 1024,
);

// Chunk size for uploads (5MB default)
const CHUNK_SIZE = parseEnvNumber(
  import.meta.env.VITE_CHUNK_SIZE,
  5 * 1024 * 1024,
);

// Default expiration days (7 days default)
const DEFAULT_EXPIRATION_DAYS = parseEnvNumber(
  import.meta.env.VITE_DEFAULT_EXPIRATION_DAYS,
  7,
);

// Demo mode flag
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === "true" || false;

// Admin credentials based on mode
const ADMIN_EMAIL =
  import.meta.env.VITE_ADMIN_EMAIL ||
  (DEMO_MODE ? "admin@example.com" : "admin@meow.local");
const ADMIN_PASSWORD =
  import.meta.env.VITE_ADMIN_PASSWORD ||
  (DEMO_MODE ? "Admin123!" : "eMef7eI@qeDCFS4)");

export const config = {
  // API URL - in production would use import.meta.env.VITE_API_URL
  API_URL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",

  // App name
  APP_NAME: import.meta.env.VITE_APP_NAME || "MeowShare",

  // App version - Try env variable first, then use our hardcoded version
  APP_VERSION: import.meta.env.VITE_APP_VERSION || appVersion,

  // Debug mode for development logs
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === "true" || false,

  // Demo mode - enables demo features like quick login
  DEMO_MODE,

  // Default file expiration days
  DEFAULT_EXPIRATION_DAYS,

  // Max file size for normal upload (in bytes) - 100MB default
  MAX_FILE_SIZE,

  // Chunk size for large file uploads (in bytes) - 5MB default
  CHUNK_SIZE,

  // Admin credentials
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
};

export default config;
