"use client";

import { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { FullPageSpinner } from "./ui/Spinner";
import { useLocale } from "@/contexts/LocaleContext";
import { AppLockGate } from "./AppLockGate";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();
  const { t } = useLocale();

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isInitializing, isAuthenticated, router]);

  if (isInitializing) {
    return <FullPageSpinner label={t("ui.checkingSession")} />;
  }

  if (!isAuthenticated) {
    // Le useEffect redirige déjà ; on évite un flash de contenu protégé.
    return <FullPageSpinner label={t("ui.redirectingLogin")} />;
  }

  return <AppLockGate>{children}</AppLockGate>;
}
