import { Loader2 } from "lucide-react";

interface SpinnerProps {
  size?: number;
  label?: string;
  className?: string;
}

export function Spinner({ size = 20, label, className = "" }: SpinnerProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} role="status" aria-live="polite">
      <Loader2 style={{ width: size, height: size }} className="animate-spin text-current" />
      {label && <span className="text-sm">{label}</span>}
    </span>
  );
}

export function FullPageSpinner({ label = "Chargement..." }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] w-full flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  );
}
