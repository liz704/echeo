"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { FullPageSpinner } from "@/components/ui/Spinner";
import { completePublicReminder } from "@/lib/endpoints";

export default function PublicReminderCompletePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function complete() {
      try {
        const result = await completePublicReminder(token);
        if (isMounted) setTitle(result.title);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Ce lien est invalide ou a expiré.";
        if (isMounted) setError(message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    complete();
    return () => {
      isMounted = false;
    };
  }, [token]);

  if (isLoading) {
    return <FullPageSpinner />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="mb-4 text-xl font-bold text-teal-600">ÉCHÉO</h1>
        {error ? (
          <>
            <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-amber-500" />
            <p className="text-slate-700 dark:text-slate-200">{error}</p>
          </>
        ) : (
          <>
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-teal-600" />
            <p className="font-medium text-slate-900 dark:text-white">Rappel marqué comme fait !</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              "{title}" a été classé dans ton historique.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
