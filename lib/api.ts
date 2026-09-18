import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import type { ApiErrorBody } from "./types";

// URL de base de l'API Spring Boot. Configurable via la variable d'environnement
// NEXT_PUBLIC_API_BASE_URL (injectée au build Docker — voir Dockerfile de l'Étape 5) ;
// retombe sur localhost:8080 pour le développement local sans Docker.
// export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080/api/v1";
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://echeo-backend.onrender.com/api/v1";

const TOKEN_STORAGE_KEY = "echeo_jwt_token";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setStoredToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercepteur de requête : joint automatiquement le JWT à chaque appel
// (sauf s'il n'y en a pas encore, ex. avant login).
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredToken();
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

// Intercepteur de réponse : normalise les erreurs backend (ErrorResponse Java)
// en un message exploitable directement par l'UI, et gère l'expiration du token.
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response?.status === 401) {
      // Token absent/expiré/invalide : on nettoie et on renvoie vers /login.
      clearStoredToken();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }

    const backendMessage = error.response?.data?.message;
    const normalizedMessage =
      backendMessage ??
      error.message ??
      "Une erreur inattendue est survenue. Veuillez réessayer.";

    return Promise.reject(new Error(normalizedMessage));
  }
);
