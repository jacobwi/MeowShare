import apiClient from "./api";
import { User } from "../types";

export interface UserProfile extends User {
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatarUrl?: string;
  profileImageFileName?: string;
  lastActive?: string;
  memberSince?: string;
  stats?: {
    filesShared: number;
    totalDownloads: number;
  };
}

export interface ProfileUpdateRequest {
  displayName?: string;
  bio?: string;
  timeZoneId?: string;
  languageCode?: string;
}

interface UserStats {
  totalFiles: number;
  totalSize: number;
  filesByType: Record<string, number>;
  lastUpload?: string;
  lastDownload?: string;
}

interface UserSettings {
  theme?: "light" | "dark" | "system";
  notifications?: boolean;
  language?: string;
  timezone?: string;
  [key: string]: unknown; // Allow for additional settings
}

// Cache keys for localStorage
const CACHE_KEYS = {
  PROFILE: "profile",
  PROFILE_STATS: "profile_stats",
  SETTINGS: "user_settings",
};

/**
 * Handle error consistently across profile service
 */
const handleError = (error: unknown, message: string): never => {
  console.error(`${message}:`, error);
  // You could add additional error logging here
  throw error;
};

/**
 * Service for managing user profile data
 */
export const profileService = {
  /**
   * Get the current user's profile
   */
  getProfile: async (): Promise<UserProfile> => {
    try {
      // Try to get from cache first
      const cachedProfile = localStorage.getItem(CACHE_KEYS.PROFILE);
      if (cachedProfile) {
        const profile = JSON.parse(cachedProfile) as UserProfile;
        // Check if cache is still valid (e.g., not older than 5 minutes)
        const cacheTime = localStorage.getItem(`${CACHE_KEYS.PROFILE}_time`);
        if (cacheTime && Date.now() - parseInt(cacheTime) < 5 * 60 * 1000) {
          return profile;
        }
      }

      const response = await apiClient.get(`/profile`);
      const profile = {
        ...response.data,
        avatarUrl:
          response.data.AvatarUrl ||
          response.data.avatarUrl ||
          response.data.profileImageFileName,
      };

      // Cache the response
      localStorage.setItem(CACHE_KEYS.PROFILE, JSON.stringify(profile));
      localStorage.setItem(`${CACHE_KEYS.PROFILE}_time`, Date.now().toString());

      return profile;
    } catch (error) {
      return handleError(error, "Error fetching profile");
    }
  },

  /**
   * Update the current user's profile
   */
  updateProfile: async (
    profileData: ProfileUpdateRequest,
  ): Promise<UserProfile> => {
    try {
      const response = await apiClient.put(`/profile`, profileData);
      const updatedProfile = {
        ...response.data,
        avatarUrl:
          response.data.AvatarUrl ||
          response.data.avatarUrl ||
          response.data.profileImageFileName,
      };

      // Update cache
      localStorage.setItem(CACHE_KEYS.PROFILE, JSON.stringify(updatedProfile));
      localStorage.setItem(`${CACHE_KEYS.PROFILE}_time`, Date.now().toString());

      return updatedProfile;
    } catch (error) {
      return handleError(error, "Error updating profile");
    }
  },

  /**
   * Update the user's profile image
   */
  updateProfileImage: async (file: File): Promise<UserProfile> => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await apiClient.put(`/profile/avatar`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Ensure we have the correct avatar URL format
      const updatedProfile = {
        ...response.data,
        avatarUrl:
          response.data.AvatarUrl ||
          response.data.avatarUrl ||
          response.data.profileImageFileName,
      };

      // Update cache with new avatar URL
      const cachedProfile = localStorage.getItem(CACHE_KEYS.PROFILE);
      if (cachedProfile) {
        const profile = JSON.parse(cachedProfile) as UserProfile;
        profile.avatarUrl = updatedProfile.avatarUrl;
        localStorage.setItem(CACHE_KEYS.PROFILE, JSON.stringify(profile));
        localStorage.setItem(
          `${CACHE_KEYS.PROFILE}_time`,
          Date.now().toString(),
        );
      }

      return updatedProfile;
    } catch (error) {
      return handleError(error, "Error updating profile image");
    }
  },

  /**
   * Get user profile stats (files shared, downloads, etc.)
   */
  getProfileStats: async (): Promise<UserProfile["stats"]> => {
    try {
      // Try to get from cache first
      const cachedStats = localStorage.getItem(CACHE_KEYS.PROFILE_STATS);
      if (cachedStats) {
        const stats = JSON.parse(cachedStats) as UserProfile["stats"];
        // Check if cache is still valid (e.g., not older than 5 minutes)
        const cacheTime = localStorage.getItem(
          `${CACHE_KEYS.PROFILE_STATS}_time`,
        );
        if (cacheTime && Date.now() - parseInt(cacheTime) < 5 * 60 * 1000) {
          return stats;
        }
      }

      const response = await apiClient.get(`/profile/stats`);

      // Cache the response
      localStorage.setItem(
        CACHE_KEYS.PROFILE_STATS,
        JSON.stringify(response.data),
      );
      localStorage.setItem(
        `${CACHE_KEYS.PROFILE_STATS}_time`,
        Date.now().toString(),
      );

      return response.data;
    } catch (error) {
      return handleError(error, "Error fetching profile stats");
    }
  },

  /**
   * Change user password
   */
  changePassword: async (
    currentPassword: string,
    newPassword: string,
  ): Promise<boolean> => {
    try {
      await apiClient.post(`/profile/change-password`, {
        currentPassword,
        newPassword,
      });
      return true;
    } catch (error) {
      return handleError(error, "Error changing password");
    }
  },

  /**
   * Update user settings
   */
  updateSettings: async (settings: UserSettings): Promise<boolean> => {
    try {
      await apiClient.put(`/profile/settings`, settings);

      // Update cached settings
      localStorage.setItem(CACHE_KEYS.SETTINGS, JSON.stringify(settings));

      return true;
    } catch (error) {
      return handleError(error, "Error updating settings");
    }
  },

  getUserStats: async (userId: string): Promise<UserStats> => {
    try {
      const response = await apiClient.get(`/users/${userId}/stats`);
      return response.data;
    } catch (error) {
      return handleError(error, "Error fetching user stats");
    }
  },

  /**
   * Clear profile cache (useful when logging out)
   */
  clearCache: (): void => {
    localStorage.removeItem(CACHE_KEYS.PROFILE);
    localStorage.removeItem(`${CACHE_KEYS.PROFILE}_time`);
    localStorage.removeItem(CACHE_KEYS.PROFILE_STATS);
    localStorage.removeItem(`${CACHE_KEYS.PROFILE_STATS}_time`);
    localStorage.removeItem(CACHE_KEYS.SETTINGS);
  },
};

export default profileService;
