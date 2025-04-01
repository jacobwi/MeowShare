export interface Config {
  apiUrl: string;
  maxFileSize: number;
  allowedFileTypes: string[];
  maxConcurrentUploads: number;
  defaultExpiryDays: number;
  maxExpiryDays: number;
  features: {
    passwordProtection: boolean;
    customExpiry: boolean;
    filePreview: boolean;
    downloadTracking: boolean;
  };
}

export interface ConfigContextType {
  config: Config;
  loading: boolean;
  error: string | null;
  refreshConfig: () => Promise<void>;
}

export const defaultConfig: Config = {
  apiUrl: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  maxFileSize: 100 * 1024 * 1024, // 100MB
  allowedFileTypes: ["*"],
  maxConcurrentUploads: 3,
  defaultExpiryDays: 7,
  maxExpiryDays: 30,
  features: {
    passwordProtection: true,
    customExpiry: true,
    filePreview: true,
    downloadTracking: true,
  },
};

export const defaultConfigContext: ConfigContextType = {
  config: defaultConfig,
  loading: false,
  error: null,
  refreshConfig: async () => {},
};
