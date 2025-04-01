import { ReactNode } from "react";
import { User, ImpersonationStatus } from "../../types";

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isImpersonating: boolean;
  impersonationStatus: ImpersonationStatus | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (
    username: string,
    password: string,
    email: string,
  ) => Promise<void>;
  impersonateUser: (userId: string) => Promise<void>;
  endImpersonation: () => Promise<void>;
  getImpersonationStatus: () => Promise<void>;
  updateUser: (updatedUser: User) => void;
}

export interface AuthProviderProps {
  children: ReactNode;
}

export const defaultAuthContext: AuthContextType = {
  user: null,
  isAuthenticated: false,
  isImpersonating: false,
  impersonationStatus: null,
  loading: false,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
  impersonateUser: async () => {},
  endImpersonation: async () => {},
  getImpersonationStatus: async () => {},
  updateUser: () => {},
};
