"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { FullPageSpinner } from "./ui/Spinner";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isInitializing, isAuthenticated, router]);

  if (isInitializing) {
    return <FullPageSpinner label="Vérification de votre session..." />;
  }

  if (!isAuthenticated) {
    // Le useEffect redirige déjà ; on évite un flash de contenu protégé.
    return <FullPageSpinner label="Redirection vers la connexion..." />;
  }

  return <>{children}</>;
}
