import apiClient from "./api";

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  lastLogin: string;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
}

const userService = {
  /**
   * Gets all users (admin only)
   */
  async getAllUsers(): Promise<User[]> {
    try {
      const response = await apiClient.get("/admin/users");
      return response.data;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  },

  /**
   * Gets a specific user by ID (admin only)
   * @param userId The ID of the user to fetch
   */
  async getUserById(userId: string): Promise<User> {
    try {
      const response = await apiClient.get(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Updates a user's information (admin only)
   * @param userId The ID of the user to update
   * @param updates The updates to apply
   */
  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.put(`/admin/users/${userId}`, updates);
      return response.data;
    } catch (error) {
      console.error(`Error updating user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Deletes a user (admin only)
   * @param userId The ID of the user to delete
   */
  async deleteUser(userId: string): Promise<void> {
    try {
      await apiClient.delete(`/admin/users/${userId}`);
    } catch (error) {
      console.error(`Error deleting user ${userId}:`, error);
      throw error;
    }
  },

  /**
   * Gets user statistics (admin only)
   */
  async getUserStats(): Promise<UserStats> {
    try {
      const response = await apiClient.get("/admin/users/stats");
      return response.data;
    } catch (error) {
      console.error("Error fetching user stats:", error);
      throw error;
    }
  },

  /**
   * Performs batch operations on users (admin only)
   * @param userIds Array of user IDs to perform the operation on
   * @param operation The operation to perform
   */
  async batchOperation(
    userIds: string[],
    operation: "delete" | "activate" | "deactivate",
  ): Promise<void> {
    try {
      await apiClient.post("/admin/users/batch", {
        userIds,
        operation,
      });
    } catch (error) {
      console.error(`Error performing batch operation:`, error);
      throw error;
    }
  },

  /**
   * Searches for users (admin only)
   * @param query The search query
   * @param page The page number
   * @param limit The number of results per page
   */
  async searchUsers(
    query: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ users: User[]; total: number }> {
    try {
      const response = await apiClient.get("/admin/users/search", {
        params: { query, page, limit },
      });
      return response.data;
    } catch (error) {
      console.error("Error searching users:", error);
      throw error;
    }
  },
};

export default userService;
