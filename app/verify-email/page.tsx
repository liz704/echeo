"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { apiClient } from "@/lib/api";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Lien invalide : token manquant.");
      return;
    }
    apiClient
      .get(`/auth/verify-email`, { params: { token } })
      .then(() => {
        setStatus("ok");
        setMessage("Ton email est confirmé. Tu peux te connecter.");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Confirmation impossible.");
      });
  }, [token]);

  if (status === "loading") return <FullPageSpinner label="Confirmation..." />;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl dark:bg-slate-900">
        {status === "ok" ? (
          <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
        ) : (
          <XCircle className="mx-auto mb-3 h-12 w-12 text-red-500" />
        )}
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
          {status === "ok" ? "Email confirmé" : "Échec"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">{message}</p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
        >
          Connexion
        </Link>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<FullPageSpinner label="..." />}>
      <VerifyContent />
    </Suspense>
  );
}
