import apiClient from "./api";
import { jwtDecode } from "jwt-decode";
import { User, ImpersonationStatus } from "../types";

interface TokenPayload {
  nameid: string;
  unique_name: string;
  role?: string;
  exp: number;
}

const TOKEN_REFRESH_THRESHOLD = 5 * 60; // 5 minutes in seconds

export const authService = {
  login: async (username: string, password: string): Promise<User> => {
    const response = await apiClient.post(`/auth/login`, {
      username,
      password,
    });

    if (response.data.token) {
      return await authService.handleAuthSuccess(
        response.data.token,
        response.data.refreshToken,
      );
    }

    throw new Error("Login failed");
  },

  register: async (
    username: string,
    password: string,
    email: string,
  ): Promise<void> => {
    const response = await apiClient.post(`/auth/register`, {
      username,
      password,
      email,
    });

    if (response.data.token) {
      await authService.handleAuthSuccess(
        response.data.token,
        response.data.refreshToken,
      );
    }
  },

  logout: (): void => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("tokenExpiry");
    localStorage.removeItem("originalUser");
  },

  refreshToken: async (): Promise<User | null> => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) return null;

      const response = await apiClient.post(`/auth/refresh-token`, {
        refreshToken,
      });
      if (response.data.token) {
        return authService.handleAuthSuccess(response.data.token);
      }
      return null;
    } catch (error) {
      console.error("Token refresh failed:", error);
      authService.logout();
      return null;
    }
  },

  handleAuthSuccess: async (
    token: string,
    refreshToken?: string,
  ): Promise<User> => {
    localStorage.setItem("token", token);
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }

    const decoded = jwtDecode<TokenPayload>(token);

    try {
      // Fetch complete user profile
      const response = await apiClient.get("/profile");
      const userProfile = response.data;

      const user: User = {
        ...userProfile,
        id: decoded.nameid,
        username: decoded.unique_name,
        email: "", // Will be populated by profile fetch later
        role: decoded.role,
        token: token,
      };

      // Store token expiry time for easier access
      localStorage.setItem("tokenExpiry", decoded.exp.toString());
      localStorage.setItem("user", JSON.stringify(user));
      return user;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Fallback to basic user info if profile fetch fails
      const user: User = {
        id: decoded.nameid,
        username: decoded.unique_name,
        email: "", // Will be populated by profile fetch later
        role: decoded.role,
        token: token,
      };
      localStorage.setItem("tokenExpiry", decoded.exp.toString());
      localStorage.setItem("user", JSON.stringify(user));
      return user;
    }
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);

      // Check if we need to extract the role from token
      if (!user.role && user.token) {
        try {
          const decoded = jwtDecode<TokenPayload>(user.token);
          if (decoded.role) {
            user.role = decoded.role;
            localStorage.setItem("user", JSON.stringify(user));
          }
        } catch (error) {
          console.error("Error decoding token for role:", error);
        }
      }

      return user;
    }
    return null;
  },

  isAuthenticated: (): boolean => {
    const token = localStorage.getItem("token");
    if (!token) return false;

    try {
      const decoded = jwtDecode<TokenPayload>(token);
      const currentTime = Date.now() / 1000;

      // Check if token is expired
      if (decoded.exp < currentTime) {
        authService.logout();
        return false;
      }

      return true;
    } catch {
      authService.logout();
      return false;
    }
  },

  shouldRefreshToken: (): boolean => {
    const token = localStorage.getItem("token");
    if (!token) return false;

    try {
      const decoded = jwtDecode<TokenPayload>(token);
      const currentTime = Date.now() / 1000;

      // Check if token will expire soon
      return decoded.exp - currentTime < TOKEN_REFRESH_THRESHOLD;
    } catch {
      return false;
    }
  },

  getTokenExpiryTime: (): number | null => {
    const expiryStr = localStorage.getItem("tokenExpiry");
    return expiryStr ? parseInt(expiryStr) : null;
  },

  // Impersonation functions
  impersonateUser: async (userId: string): Promise<User> => {
    try {
      // Save original user before impersonating
      const originalUser = authService.getCurrentUser();
      if (originalUser) {
        localStorage.setItem("originalUser", JSON.stringify(originalUser));
      }

      // Call impersonation endpoint with authorization header
      const response = await apiClient.post(
        `/auth/impersonation/start/${userId}`,
        {},
      );

      if (response.data.token) {
        return authService.handleAuthSuccess(response.data.token);
      }

      throw new Error("Impersonation failed");
    } catch (error) {
      console.error("Error impersonating user:", error);
      throw error;
    }
  },

  endImpersonation: async (): Promise<User | null> => {
    const originalUserStr = localStorage.getItem("originalUser");
    if (!originalUserStr) {
      console.warn("No original user found, cannot end impersonation");
      return null;
    }

    try {
      // Call the endpoint to end impersonation
      const response = await apiClient.post(`/auth/impersonation/end`, {});

      // If the backend provides a new token for the original user, use it
      if (response.data.token) {
        return authService.handleAuthSuccess(response.data.token);
      }

      // Otherwise fall back to the stored original user
      const originalUser = JSON.parse(originalUserStr);

      // Restore original user token
      localStorage.setItem("token", originalUser.token);
      localStorage.setItem("user", originalUserStr);

      if (originalUser.token) {
        const decoded = jwtDecode<TokenPayload>(originalUser.token);
        localStorage.setItem("tokenExpiry", decoded.exp.toString());
      }

      // Clean up
      localStorage.removeItem("originalUser");

      return originalUser;
    } catch (error) {
      console.error("Error ending impersonation:", error);

      // Fall back to local storage if API call fails
      try {
        const originalUser = JSON.parse(originalUserStr);
        localStorage.setItem("token", originalUser.token);
        localStorage.setItem("user", originalUserStr);
        localStorage.removeItem("originalUser");
        return originalUser;
      } catch {
        return null;
      }
    }
  },

  isImpersonating: (): boolean => {
    return localStorage.getItem("originalUser") !== null;
  },

  getImpersonationStatus: async (): Promise<ImpersonationStatus> => {
    const isImpersonating = localStorage.getItem("originalUser") !== null;
    const originalUserStr = localStorage.getItem("originalUser");
    const currentUserStr = localStorage.getItem("user");

    const originalUser = originalUserStr
      ? JSON.parse(originalUserStr)
      : undefined;
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : undefined;

    return {
      isImpersonating,
      originalUser,
      impersonatedUser: isImpersonating ? currentUser : undefined,
    };
  },
};

export default authService;
