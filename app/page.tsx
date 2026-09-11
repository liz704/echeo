"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { FullPageSpinner } from "@/components/ui/Spinner";

export default function RootPage() {
  const { isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isInitializing) {
      router.replace(isAuthenticated ? "/dashboard" : "/login");
    }
  }, [isInitializing, isAuthenticated, router]);

  return <FullPageSpinner label="Chargement d'ÉCHÉO..." />;
}
