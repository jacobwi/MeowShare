import { User } from "../types";
import apiClient from "./api";

interface LoginResponse {
  user: User;
  token: string;
}

interface RegisterResponse {
  user: User;
  token: string;
}

interface ImpersonationResponse {
  user: User;
  token: string;
}

interface ImpersonationStatus {
  isImpersonating: boolean;
  originalUser?: {
    id: string;
    userName: string;
  };
  impersonatedUser?: {
    id: string;
    userName: string;
  };
}

class AuthService {
  private tokenKey = "token";
  private userKey = "user";

  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>("/auth/login", {
      username,
      password,
    });
    this.setToken(response.data.token);
    return response.data;
  }

  async register(
    username: string,
    password: string,
    email: string,
  ): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>("/auth/register", {
      username,
      password,
      email,
    });
    this.setToken(response.data.token);
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      this.clearToken();
      this.clearUser();
    }
  }

  async impersonateUser(userId: string): Promise<User> {
    const response = await apiClient.post<ImpersonationResponse>(
      `/auth/impersonation/start/${userId}`,
    );
    this.setToken(response.data.token);
    return response.data.user;
  }

  async endImpersonation(): Promise<User> {
    const response = await apiClient.post<ImpersonationResponse>(
      "/auth/impersonation/end",
    );
    this.setToken(response.data.token);
    return response.data.user;
  }

  async getImpersonationStatus(): Promise<ImpersonationStatus> {
    const response = await apiClient.get<ImpersonationStatus>(
      "/auth/impersonation/status",
    );
    return response.data;
  }

  getCurrentUser(): User | null {
    const userJson = localStorage.getItem(this.userKey);
    return userJson ? JSON.parse(userJson) : null;
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  clearToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  clearUser(): void {
    localStorage.removeItem(this.userKey);
  }

  shouldRefreshToken(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;

      // Refresh if token expires in less than 5 minutes
      return timeUntilExpiration < 5 * 60 * 1000;
    } catch (error) {
      console.error("Error parsing token:", error);
      return false;
    }
  }

  async refreshToken(): Promise<void> {
    const response = await apiClient.post<{ token: string }>("/auth/refresh");
    this.setToken(response.data.token);
  }
}

const authService = new AuthService();
export default authService;
