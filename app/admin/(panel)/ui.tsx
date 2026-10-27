import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/site";

/** Page title row: optional back link, the title (and a subtitle), actions on the right. */
export function PageHead({ title, sub, back, children }: { title: ReactNode; sub?: ReactNode; back?: { href: string; label: string }; children?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {back && (
          <Link href={back.href} className="mb-3 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted hover:text-ink">
            <ArrowLeft size={13} /> {back.label}
          </Link>
        )}
        <h1 className="title flex flex-wrap items-center gap-3 text-xl md:text-2xl">{title}</h1>
        {sub && <p className="mt-1.5 text-sm text-muted">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </header>
  );
}

export const StatusPill = ({ status }: { status: OrderStatus }) => <span className={`pill pill-${status}`}>{ORDER_STATUSES[status]?.label ?? status}</span>;

export const when = (iso: string) => new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
