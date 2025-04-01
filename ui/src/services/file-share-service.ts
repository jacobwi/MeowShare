import apiClient from "./api";
import { FileShare, ShareFileRequest, ChunkUploadRequest } from "../types";
import { ResponseType } from "axios";

export const fileApi = {
  // Quick upload a file without extra options
  quickShare: async (file: File): Promise<FileShare> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post("/files/quick-share", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  // Advanced upload with options
  shareWithMetadata: async (
    file: File,
    metadata: ShareFileRequest,
  ): Promise<FileShare> => {
    const formData = new FormData();
    formData.append("file", file);

    if (metadata.customUrl) {
      formData.append("customUrl", metadata.customUrl);
    }

    if (metadata.password) {
      formData.append("password", metadata.password);
    }

    if (metadata.expiresAt) {
      formData.append("expiresAt", metadata.expiresAt);
    }

    if (metadata.maxDownloads !== undefined) {
      formData.append("maxDownloads", metadata.maxDownloads.toString());
    }

    if (metadata.tags && metadata.tags.length > 0) {
      metadata.tags.forEach((tag) => {
        formData.append("tags", tag);
      });
    }

    if (metadata.folderPath) {
      formData.append("folderPath", metadata.folderPath);
    }

    const response = await apiClient.post("/files/share", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  // Upload file chunk
  uploadChunk: async (
    request: ChunkUploadRequest,
  ): Promise<FileShare | null> => {
    const formData = new FormData();
    formData.append("chunk", request.chunk);
    formData.append("fileId", request.fileId);
    formData.append("chunkNumber", request.chunkNumber.toString());
    formData.append("totalChunks", request.totalChunks.toString());
    formData.append("fileName", request.fileName);

    if (request.customUrl) {
      formData.append("customUrl", request.customUrl);
    }

    if (request.password) {
      formData.append("password", request.password);
    }

    if (request.expiresAt) {
      formData.append("expiresAt", request.expiresAt);
    }

    if (request.maxDownloads !== undefined) {
      formData.append("maxDownloads", request.maxDownloads.toString());
    }

    if (request.tags && request.tags.length > 0) {
      request.tags.forEach((tag) => {
        formData.append("tags", tag);
      });
    }

    if (request.folderPath) {
      formData.append("folderPath", request.folderPath);
    }

    try {
      const response = await apiClient.post("/files/upload/chunk", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // If the response status is 202 Accepted, more chunks are needed
      if (response.status === 202) {
        return null;
      }

      // If we got a full response, all chunks were processed
      return response.data;
    } catch (error) {
      console.error("Chunk upload error:", error);
      throw error;
    }
  },

  // Get file details by ID
  getFileDetails: async (fileId: string): Promise<FileShare> => {
    const response = await apiClient.get(`/files/${fileId}`);
    return response.data;
  },

  // Get file content for download
  getFile: async (fileId: string, password?: string): Promise<Blob> => {
    const config: {
      responseType: ResponseType;
      headers?: Record<string, string>;
    } = {
      responseType: "blob",
    };

    if (password) {
      config.headers = {
        "X-File-Password": password,
      };
    }

    const response = await apiClient.get(`/files/${fileId}`, config);
    return response.data;
  },

  // Get all files for the authenticated user
  getUserFiles: async (): Promise<FileShare[]> => {
    const response = await apiClient.get("/files/my/files");
    return response.data;
  },

  // Search files by tags
  searchByTags: async (tags: string[]): Promise<FileShare[]> => {
    const params = new URLSearchParams();
    tags.forEach((tag) => {
      params.append("tags", tag);
    });

    const response = await apiClient.get(`/files/search?${params.toString()}`);
    return response.data;
  },

  // Delete a file
  deleteFile: async (fileId: string): Promise<boolean> => {
    const response = await apiClient.delete(`/files/${fileId}`);
    return response.status === 200;
  },

  // Get file content as text for previewing
  getFileContentAsText: async (
    fileId: string,
    password?: string,
  ): Promise<string> => {
    const headers: Record<string, string> = {};
    if (password) {
      headers["X-File-Password"] = password;
    }

    try {
      const response = await apiClient.get(`/files/${fileId}/content`, {
        headers,
        responseType: "blob",
      });

      const blob = response.data;

      // Try to read as text
      try {
        return await blob.text();
      } catch {
        throw new Error(
          "Failed to read file content as text. File may be binary.",
        );
      }
    } catch (error) {
      console.error("Error fetching file content:", error);
      throw new Error("Failed to fetch file content");
    }
  },

  // Search files by query
  searchFiles: async (query: string): Promise<FileShare[]> => {
    try {
      const response = await apiClient.get(`/files/search`, {
        params: { query },
      });
      return response.data;
    } catch {
      console.error("Error searching files");
      throw new Error("Failed to search files");
    }
  },
};

export default fileApi;
