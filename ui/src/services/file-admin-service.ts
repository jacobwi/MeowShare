import apiClient from "./api";
import { FileShare } from "../types";

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

const fileAdminService = {
  /**
   * Fetches all files from the server
   */
  async getAllFiles(): Promise<FileShare[]> {
    try {
      const response = await apiClient.get("/admin/files");
      return response.data;
    } catch (error) {
      console.error("Error fetching files:", error);
      throw error;
    }
  },

  /**
   * Fetches file metadata for a specific file
   * @param fileId The ID of the file to fetch metadata for
   */
  async getFileMetadata(fileId: string): Promise<FileMetadata> {
    try {
      const response = await apiClient.get(`/admin/files/${fileId}/metadata`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching file metadata for ${fileId}:`, error);
      throw error;
    }
  },

  /**
   * Deletes a file from the server
   * @param fileId The ID of the file to delete
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      await apiClient.delete(`/admin/files/${fileId}`);
    } catch (error) {
      console.error(`Error deleting file ${fileId}:`, error);
      throw error;
    }
  },

  /**
   * Updates a file's metadata
   * @param fileId The ID of the file to update
   * @param updates The updates to apply to the file
   */
  async updateFile(
    fileId: string,
    updates: Partial<FileShare>,
  ): Promise<FileShare> {
    try {
      const response = await apiClient.put(`/admin/files/${fileId}`, updates);
      return response.data;
    } catch (error) {
      console.error(`Error updating file ${fileId}:`, error);
      throw error;
    }
  },

  /**
   * Fetches file statistics from the server
   */
  async getFileStats(): Promise<FileStats> {
    try {
      const response = await apiClient.get("/admin/files/stats");
      return response.data;
    } catch (error) {
      console.error("Error fetching file stats:", error);
      throw error;
    }
  },

  /**
   * Performs batch operations on multiple files
   * @param fileIds Array of file IDs to perform the operation on
   * @param operation The operation to perform
   */
  async batchOperation(fileIds: string[], operation: "delete"): Promise<void> {
    try {
      await apiClient.post("/admin/files/batch", {
        fileIds,
        operation,
      });
    } catch (error) {
      console.error(`Error performing batch operation:`, error);
      throw error;
    }
  },

  /**
   * Cleans up expired files from the server
   */
  async cleanupExpiredFiles(): Promise<{ deletedCount: number }> {
    try {
      const response = await apiClient.post("/admin/files/cleanup");
      return response.data;
    } catch (error) {
      console.error("Error cleaning up expired files:", error);
      throw error;
    }
  },

  /**
   * Exports file data for backup
   */
  async exportFileData(): Promise<Blob> {
    try {
      const response = await apiClient.get("/admin/files/export", {
        responseType: "blob",
      });
      return response.data;
    } catch (error) {
      console.error("Error exporting file data:", error);
      throw error;
    }
  },
};

export default fileAdminService;
