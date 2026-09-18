"use client";

import { FormEvent, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, KeyRound, Lock } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { resetPassword } from "@/lib/endpoints";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setError("Lien de réinitialisation invalide : le token est manquant dans l'URL.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await resetPassword({ token, newPassword });
      setIsDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Échec de la réinitialisation.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 to-slate-100 px-4 py-12 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-900">
        {isDone ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
              Mot de passe réinitialisé
            </h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Redirection vers la page de connexion...
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <KeyRound className="mx-auto mb-2 h-8 w-8 text-teal-600 dark:text-teal-400" />
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Réinitialiser le mot de passe
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Choisis un nouveau mot de passe pour ton compte.
              </p>
            </div>

            {!token && (
              <p role="alert" className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                Aucun token détecté dans le lien. Vérifie que tu as bien cliqué sur le lien complet reçu par email.
              </p>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Nouveau mot de passe
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    autoComplete="new-password"
                    placeholder="Au moins 8 caractères"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Confirmer le mot de passe
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    autoComplete="new-password"
                    placeholder="Ressaisis le mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-slate-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {error && (
                <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-60"
              >
                {isSubmitting && <Spinner size={18} />}
                Réinitialiser le mot de passe
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
              <Link href="/login" className="font-medium text-teal-700 hover:underline dark:text-teal-400">
                Retour à la connexion
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Spinner size={32} /></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}