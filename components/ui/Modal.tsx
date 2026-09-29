"use client";

import { ReactNode, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  isDangerous = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) onCancel();
      }}
    >
      <div className="flex min-h-full w-full items-end justify-center sm:items-center">
        <div className="max-h-[92dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-2xl bg-white p-5 shadow-2xl sm:rounded-xl sm:p-6 dark:bg-slate-900">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              {isDangerous && (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                </span>
              )}
              <h2
                id="confirm-modal-title"
                className="text-lg font-semibold text-slate-900 dark:text-white"
              >
                {title}
              </h2>
            </div>
            <button
              type="button"
              onClick={onCancel}
              aria-label="Fermer"
              className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <p className="mb-6 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {description}
          </p>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition disabled:opacity-60 ${
                isDangerous
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-teal-600 hover:bg-teal-700"
              }`}
            >
              {isLoading && <Spinner size={16} />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Conteneur qui permet le scroll vertical sur petit écran */}
      <div className="flex min-h-full w-full items-end justify-center sm:items-center">
        <div className="flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-xl dark:bg-slate-900">
          {/* En-tête fixe */}
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <h2 className="pr-2 text-lg font-semibold text-slate-900 dark:text-white">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Corps défilable — c'est ici que le long formulaire événement peut scroller */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
