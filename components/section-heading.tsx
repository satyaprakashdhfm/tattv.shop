import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** Section title in the site's bold uppercase style, flanked by fine horizontal lines. */
export function HeadingRule({ title, as: Tag = "h2", tone = "ink" }: { title: string; as?: "h1" | "h2"; tone?: "ink" | "light" }) {
  const line = `h-px w-8 shrink-0 sm:w-14 md:w-20 ${tone === "light" ? "bg-white/40" : "bg-ink/25"}`;
  return (
    <div className="flex items-center justify-center gap-4 md:gap-5">
      <span className={line} />
      <Tag className="title text-center text-lg md:text-xl">{title}</Tag>
      <span className={line} />
    </div>
  );
}

export function SectionHeading({ title, href, cta = "Shop All" }: { title: string; href?: string; cta?: string }) {
  return (
    <div className="relative mb-8 flex flex-col items-center gap-3 md:mb-10">
      <HeadingRule title={title} />
      {href && (
        <Link
          href={href}
          className="flex h-10 items-center gap-2 rounded-full border border-line bg-white px-5 text-[11px] font-medium uppercase tracking-[0.2em] text-ink/80 transition duration-300 hover:border-ink hover:text-ink md:absolute md:right-0 md:top-1/2 md:-translate-y-1/2"
        >
          <span>{cta}</span> <ArrowRight size={13} />
        </Link>
      )}
    </div>
  );
}
