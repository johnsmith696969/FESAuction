import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { User } from "../types";

type AuthState = {
  token: string | null;
  user: User | null;
};

type AuthContextValue = {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const savedToken = localStorage.getItem("fes_token");
    const savedUser = localStorage.getItem("fes_user");
    return {
      token: savedToken,
      user: savedUser ? JSON.parse(savedUser) : null,
    };
  });

  const isAuthenticated = Boolean(authState.token);

  const login = useCallback((token: string) => {
    localStorage.setItem("fes_token", token);
    setAuthState((prev) => ({ ...prev, token }));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("fes_token");
    localStorage.removeItem("fes_user");
    setAuthState({ token: null, user: null });
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!authState.token) return;
    const response = await fetch(`${API_BASE}/users/me`, {
      headers: {
        Authorization: `Bearer ${authState.token}`,
      },
    });
    if (!response.ok) {
      logout();
      return;
    }
    const data = await response.json();
    localStorage.setItem("fes_user", JSON.stringify(data));
    setAuthState((prev) => ({ ...prev, user: data }));
  }, [authState.token, logout]);

  useEffect(() => {
    if (authState.token && !authState.user) {
      refreshProfile();
    }
  }, [authState.token, authState.user, refreshProfile]);

  const value = useMemo(
    () => ({
      token: authState.token,
      user: authState.user,
      isAuthenticated,
      login,
      logout,
      refreshProfile,
    }),
    [authState, isAuthenticated, login, logout, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
