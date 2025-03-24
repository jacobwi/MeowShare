import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  AuthContextType,
  AuthProviderProps,
  defaultAuthContext,
} from "./types/auth";
import authService from "../services/auth";
import { User, ImpersonationStatus } from "../types";

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(
    authService.isImpersonating(),
  );
  const [impersonationStatus, setImpersonationStatus] =
    useState<ImpersonationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const tokenRefreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      setIsImpersonating(false);
      setImpersonationStatus(null);
      localStorage.removeItem("user");
      localStorage.removeItem("impersonationStatus");
      if (tokenRefreshTimerRef.current) {
        clearInterval(tokenRefreshTimerRef.current);
      }
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  }, []);

  const setupRefreshTimer = useCallback(() => {
    if (tokenRefreshTimerRef.current) {
      clearInterval(tokenRefreshTimerRef.current);
    }

    tokenRefreshTimerRef.current = setInterval(async () => {
      if (authService.shouldRefreshToken()) {
        try {
          await authService.refreshToken();
        } catch (error) {
          console.error("Token refresh failed:", error);
          await logout();
        }
      }
    }, 60000); // Check every minute
  }, [logout]);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          setIsAuthenticated(true);
          setIsImpersonating(authService.isImpersonating());

          // Check impersonation status
          const storedStatus = localStorage.getItem("impersonationStatus");
          if (storedStatus) {
            try {
              const status = JSON.parse(storedStatus) as ImpersonationStatus;
              setImpersonationStatus(status);
            } catch (error) {
              console.error("Error parsing impersonation status:", error);
              localStorage.removeItem("impersonationStatus");
            }
          }

          setupRefreshTimer();
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
    return () => {
      if (tokenRefreshTimerRef.current) {
        clearInterval(tokenRefreshTimerRef.current);
      }
    };
  }, [setupRefreshTimer]);

  const login = async (username: string, password: string) => {
    try {
      const user = await authService.login(username, password);

      // Set auth states directly
      setUser(user);
      setIsAuthenticated(true);
      setIsImpersonating(authService.isImpersonating());
      setImpersonationStatus(null);

      localStorage.setItem("user", JSON.stringify(user));
      localStorage.removeItem("impersonationStatus");
      setupRefreshTimer();
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (
    username: string,
    password: string,
    email: string,
  ) => {
    try {
      await authService.register(username, password, email);
      const user = authService.getCurrentUser();
      if (user) {
        // Set auth states directly
        setUser(user);
        setIsAuthenticated(true);
        setIsImpersonating(authService.isImpersonating());
        setImpersonationStatus(null);

        localStorage.setItem("user", JSON.stringify(user));
        localStorage.removeItem("impersonationStatus");
        setupRefreshTimer();
      }
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const impersonateUser = async (userId: string) => {
    try {
      const user = await authService.impersonateUser(userId);
      setUser(user);
      setIsImpersonating(authService.isImpersonating());
      // Note: getImpersonationStatus is not available in this auth service
    } catch (error) {
      console.error("Impersonation error:", error);
      throw error;
    }
  };

  const endImpersonation = async () => {
    try {
      const user = await authService.endImpersonation();
      if (user) {
        setUser(user);
        setIsImpersonating(authService.isImpersonating());
        setImpersonationStatus(null);
        localStorage.removeItem("impersonationStatus");
      }
    } catch (error) {
      console.error("End impersonation error:", error);
      throw error;
    }
  };

  // const getImpersonationStatus = async () => {
  //   try {
  //     const status = await authService.getImpersonationStatus();
  //     setImpersonationStatus(status);
  //     setIsImpersonating(status.isImpersonating);
  //   } catch (error) {
  //     console.error("Get impersonation status error:", error);
  //     throw error;
  //   }
  // };

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isImpersonating,
    impersonationStatus,
    loading,
    login,
    logout,
    register,
    impersonateUser,
    endImpersonation,
    getImpersonationStatus: async () => {
      const status = await authService.getImpersonationStatus();
      setImpersonationStatus(status);
      setIsImpersonating(status.isImpersonating);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
