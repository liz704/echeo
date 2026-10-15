"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { isLockEnabled, isUnlocked, unlock } from "@/lib/appLock";
import { useLocale } from "@/contexts/LocaleContext";

/** Affiche un écran de déverrouillage (code PIN) tant que le verrouillage est actif et non levé. */
export function AppLockGate({ children }: { children: ReactNode }) {
  const { t } = useLocale();
  const [locked, setLocked] = useState(false);
  const [ready, setReady] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    setLocked(isLockEnabled() && !isUnlocked());
    setReady(true);
    const onLock = () => setLocked(isLockEnabled() && !isUnlocked());
    window.addEventListener("echeo-lock-changed", onLock);
    return () => window.removeEventListener("echeo-lock-changed", onLock);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (await unlock(pin)) {
      setLocked(false);
      setPin("");
      setError(false);
    } else {
      setError(true);
    }
  }

  if (!ready) return null;
  if (!locked) return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
            <Lock className="h-6 w-6" />
          </span>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white">{t("v2.unlockTitle")}</h1>
          <p className="text-sm text-slate-500">{t("v2.unlockHint")}</p>
        </div>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-lg tracking-widest text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        {error && (
          <p role="alert" className="text-center text-sm text-red-600">
            {t("v2.pinWrong")}
          </p>
        )}
        <button
          type="submit"
          className="w-full rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
        >
          {t("v2.unlockButton")}
        </button>
      </form>
    </div>
  );
}
