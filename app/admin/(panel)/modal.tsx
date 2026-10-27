"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

/** Pop-up editor over an admin list. Closing (✕, Esc or a click outside) goes back to `closeHref`, the list without `?edit=`. */
export function Modal({ title, sub, closeHref, children }: { title: ReactNode; sub?: ReactNode; closeHref: string; children: ReactNode }) {
  const router = useRouter();
  const close = () => router.replace(closeHref, { scroll: false });

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && router.replace(closeHref, { scroll: false });
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [closeHref, router]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 md:p-8" role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : "Edit"}>
      <div className="fixed inset-0 animate-fade-in bg-ink/40 backdrop-blur-[2px]" onClick={close} />
      <div className="relative my-auto w-full max-w-6xl animate-slide-down rounded-[2rem] bg-paper shadow-lift">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 rounded-t-[2rem] border-b border-line bg-paper/95 px-5 py-4 backdrop-blur md:px-7">
          <div className="min-w-0">
            <h2 className="title truncate text-lg">{title}</h2>
            {sub && <p className="text-xs text-muted">{sub}</p>}
          </div>
          <button type="button" onClick={close} aria-label="Close" className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-white transition-colors hover:border-ink">
            <X size={18} />
          </button>
        </header>
        <div className="space-y-6 p-4 md:p-7">{children}</div>
      </div>
    </div>
  );
}
