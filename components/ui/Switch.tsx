"use client";

interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}

/** Accessible on/off switch, styled like the Android clock toggle. */
export function Switch({ checked, onChange, label, disabled = false }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border-2 transition-colors disabled:opacity-50 ${
        checked
          ? "border-teal-100 bg-teal-100"
          : "border-slate-400 bg-transparent dark:border-slate-500"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full transition-transform ${
          checked ? "translate-x-7 bg-teal-800" : "translate-x-1 bg-slate-500 dark:bg-slate-400"
        }`}
      />
    </button>
  );
}
