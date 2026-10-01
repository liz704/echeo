"use client";

import { InputHTMLAttributes, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  /** Affiche l'icône cadenas à gauche (défaut: true) */
  showLockIcon?: boolean;
};

/**
 * Champ mot de passe avec bouton afficher / masquer.
 * Utilisable sur login, register, reset-password, settings.
 */
export function PasswordInput({
  className = "",
  showLockIcon = true,
  ...rest
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      {showLockIcon && (
        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      )}
      <input
        {...rest}
        type={visible ? "text" : "password"}
        className={`${showLockIcon ? "pl-10" : "pl-3"} w-full rounded-xl border border-slate-300 py-2.5 pr-10 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white ${className}`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
