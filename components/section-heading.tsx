import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeading({ title, href, cta = "Shop All" }: { title: string; href?: string; cta?: string }) {
  return (
    <div className="relative mb-8 flex flex-col items-center gap-3 md:mb-10">
      <h2 className="title text-center text-lg md:text-xl">{title}</h2>
      {href && (
        <Link
          href={href}
          className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.2em] text-muted hover:text-ink md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2"
        >
          <span className="underline-reveal">{cta}</span> <ArrowRight size={13} />
        </Link>
      )}
    </div>
  );
}
