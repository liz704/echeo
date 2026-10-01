"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Mail, Send } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { forgotPassword } from "@/lib/endpoints";
import { useLocale } from "@/contexts/LocaleContext";

export default function ForgotPasswordPage() {
  const { t, locale, setLocale } = useLocale();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) {
      setError(t("auth.emailRequired"));
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      await forgotPassword({ email: email.trim() });
      setIsSent(true);
    } catch (err) {
      // Le backend renvoie volontairement un message neutre pour ne pas
      // révéler si l'email existe — on l'affiche tel quel.
      const message = err instanceof Error ? err.message : t("common.error");
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 to-slate-100 px-4 py-12 dark:from-slate-950 dark:to-slate-900">
      <div className="absolute right-4 top-4 flex gap-1 rounded-full border border-slate-200 bg-white p-0.5 text-xs font-medium shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setLocale("fr")}
          className={`rounded-full px-2.5 py-1 ${locale === "fr" ? "bg-teal-600 text-white" : "text-slate-500"}`}
        >
          FR
        </button>
        <button
          type="button"
          onClick={() => setLocale("en")}
          className={`rounded-full px-2.5 py-1 ${locale === "en" ? "bg-teal-600 text-white" : "text-slate-500"}`}
        >
          EN
        </button>
      </div>

      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-slate-900">
        <Link
          href="/login"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-teal-700 dark:text-slate-400 dark:hover:text-teal-400"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("auth.backToLogin")}
        </Link>

        {isSent ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{t("auth.forgotSentTitle")}</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {t("auth.forgotSentHint", { email })}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{t("auth.forgotTitle")}</h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {t("auth.forgotHint")}
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
                  {t("auth.email")}
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="vous@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                {isSubmitting ? <Spinner size={18} /> : <Send className="h-4 w-4" />}
                {t("auth.forgotCta")}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
