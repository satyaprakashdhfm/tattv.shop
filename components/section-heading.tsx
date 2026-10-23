import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeading({
  eyebrow,
  title,
  href,
  cta = "Shop All",
  center,
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  cta?: string;
  center?: boolean;
}) {
  return (
    <div className={`mb-10 flex flex-col gap-4 md:mb-12 ${center ? "items-center text-center" : "md:flex-row md:items-end md:justify-between"}`}>
      <div>
        {eyebrow && <p className="eyebrow mb-3 text-muted">{eyebrow}</p>}
        <h2 className="display text-4xl md:text-5xl">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="eyebrow flex items-center gap-2 border-b border-ink pb-1 hover:opacity-60">
          {cta} <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}
