"use client";

import { ReactNode, useState } from "react";
import { ChevronDown } from "lucide-react";

/** Section repliée par défaut : on clique sur l'en-tête pour voir son contenu. */
export function Collapsible({
  header,
  children,
  className = "",
  defaultOpen = false,
}: {
  header: ReactNode;
  children: ReactNode;
  className?: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={className}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="min-w-0 flex-1">{header}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="mt-5">{children}</div>}
    </section>
  );
}
