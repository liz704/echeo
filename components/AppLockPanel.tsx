"use client";

import { FormEvent, useEffect, useState } from "react";
import { Lock, LockOpen } from "lucide-react";
import { disableLock, enableLock, isLockEnabled, isValidPin, lockNow } from "@/lib/appLock";
import { useLocale } from "@/contexts/LocaleContext";
import { useToast } from "@/contexts/ToastContext";

const INPUT =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

/** Réglage du verrouillage de l'application par code PIN (profil entier). */
export function AppLockPanel() {
  const { t } = useLocale();
  const { showSuccess, showError } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [currentPin, setCurrentPin] = useState("");

  useEffect(() => {
    setEnabled(isLockEnabled());
  }, []);

  const digits = (v: string) => v.replace(/\D/g, "").slice(0, 8);

  async function handleEnable(e: FormEvent) {
    e.preventDefault();
    if (!isValidPin(pin)) return showError(t("v2.pinInvalid"));
    if (pin !== pin2) return showError(t("v2.pinMismatch"));
    await enableLock(pin);
    setEnabled(true);
    setPin("");
    setPin2("");
    showSuccess(t("v2.pinEnabled"));
  }

  async function handleDisable(e: FormEvent) {
    e.preventDefault();
    if (await disableLock(currentPin)) {
      setEnabled(false);
      setCurrentPin("");
      showSuccess(t("v2.pinDisabled"));
    } else {
      showError(t("v2.pinWrong"));
    }
  }

  function handleLockNow() {
    lockNow();
    window.dispatchEvent(new Event("echeo-lock-changed"));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">{t("v2.lockIntro")}</p>
      <p className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-100">
        {enabled ? <Lock className="h-4 w-4 text-teal-600" /> : <LockOpen className="h-4 w-4 text-slate-400" />}
        {enabled ? t("v2.lockEnabledState") : t("v2.lockDisabledState")}
      </p>

      {!enabled ? (
        <form onSubmit={handleEnable} className="space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("v2.pinNew")}</label>
            <input type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(digits(e.target.value))} className={INPUT} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("v2.pinConfirm")}</label>
            <input type="password" inputMode="numeric" value={pin2} onChange={(e) => setPin2(digits(e.target.value))} className={INPUT} />
          </div>
          <button type="submit" className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700">
            {t("v2.pinEnable")}
          </button>
        </form>
      ) : (
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleLockNow}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {t("v2.lockNow")}
          </button>
          <form onSubmit={handleDisable} className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">{t("v2.pinCurrent")}</label>
              <input type="password" inputMode="numeric" value={currentPin} onChange={(e) => setCurrentPin(digits(e.target.value))} className={INPUT} />
            </div>
            <button type="submit" className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700">
              {t("v2.pinDisable")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
