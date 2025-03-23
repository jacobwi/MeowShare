import apiClient from "./api";
import { User } from "../types";

export interface UserProfile extends User {
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatarUrl?: string;
  lastActive?: string;
  memberSince?: string;
  stats?: {
    filesShared: number;
    totalDownloads: number;
  };
}

export interface ProfileUpdateRequest {
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: File | null;
  email?: string;
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

/**
 * Service for managing user profile data
 */
export const profileService = {
  /**
   * Get the current user's profile
   */
  getProfile: async (): Promise<UserProfile> => {
    try {
      const response = await apiClient.get(`/profile`);
      return response.data;
    } catch (error) {
      console.error("Error fetching profile:", error);
      throw error;
    }
  },

  /**
   * Update the current user's profile
   */
  updateProfile: async (
    profileData: ProfileUpdateRequest,
  ): Promise<UserProfile> => {
    try {
      // If there's an avatar file, use FormData
      if (profileData.avatar) {
        const formData = new FormData();
        formData.append("avatar", profileData.avatar);

        // Append other fields
        if (profileData.firstName)
          formData.append("firstName", profileData.firstName);
        if (profileData.lastName)
          formData.append("lastName", profileData.lastName);
        if (profileData.bio) formData.append("bio", profileData.bio);
        if (profileData.email) formData.append("email", profileData.email);

        const response = await apiClient.put(`/profile`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });
        return response.data;
      } else {
        // Regular JSON for updates without file
        const response = await apiClient.put(`/profile`, profileData);
        return response.data;
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  },

  /**
   * Get user profile stats (files shared, downloads, etc.)
   */
  getProfileStats: async (): Promise<UserProfile["stats"]> => {
    try {
      const response = await apiClient.get(`/profile/stats`);
      return response.data;
    } catch (error) {
      console.error("Error fetching profile stats:", error);
      throw error;
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
      console.error("Error changing password:", error);
      throw error;
    }
  },

  /**
   * Update user settings
   */
  updateSettings: async (settings: UserSettings): Promise<boolean> => {
    try {
      await apiClient.put(`/profile/settings`, settings);
      return true;
    } catch (error) {
      console.error("Error updating settings:", error);
      throw error;
    }
  },

  getUserStats: async (userId: string): Promise<UserStats> => {
    try {
      const response = await apiClient.get(`/users/${userId}/stats`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user stats:", error);
      throw error;
    }
  },
};

export default profileService;
