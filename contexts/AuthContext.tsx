"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { clearStoredToken, getStoredToken, setStoredToken } from "@/lib/api";
import { loginUser, registerUser } from "@/lib/endpoints";
import type { AuthResponse, LoginPayload, RegisterPayload } from "@/lib/types";

interface AuthUser {
  userId: number;
  fullName: string;
  email: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const USER_STORAGE_KEY = "echeo_user";

function persistUser(auth: AuthResponse): AuthUser {
  const user: AuthUser = {
    userId: auth.userId,
    fullName: auth.fullName,
    email: auth.email,
    role: auth.role,
  };
  setStoredToken(auth.token);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }
  return user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getStoredToken();
    const storedUser =
      typeof window !== "undefined" ? window.localStorage.getItem(USER_STORAGE_KEY) : null;

    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser) as AuthUser);
      } catch {
        clearStoredToken();
      }
    }
    setIsInitializing(false);
  }, []);

  async function login(payload: LoginPayload) {
    const response = await loginUser(payload);
    setUser(persistUser(response));
  }

  async function register(payload: RegisterPayload) {
    const response = await registerUser(payload);
    setUser(persistUser(response));
  }

  function logout() {
    clearStoredToken();
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(USER_STORAGE_KEY);
    }
    setUser(null);
    router.push("/login");
  }

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isInitializing, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un <AuthProvider>.");
  }
  return context;
}
