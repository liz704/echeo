"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { useLocale } from "@/contexts/LocaleContext";

export default function RootPage() {
  const { isAuthenticated, isInitializing } = useAuth();
  const { t } = useLocale();
  const router = useRouter();

  useEffect(() => {
    if (!isInitializing) {
      router.replace(isAuthenticated ? "/dashboard" : "/login");
    }
  }, [isInitializing, isAuthenticated, router]);

  return <FullPageSpinner label={t("common.loadingApp")} />;
}
