import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { POLICIES, anchorOf, policyBlocks } from "@/lib/policies";
import { getPolicy } from "@/lib/server/policies";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getPolicy((await params).slug);
  if (!p) return { title: "Not found" };
  return { title: p.title, description: p.summary, alternates: { canonical: `/policies/${p.slug}` } };
}

/** A policy page (Shipping & Payment, Returns, Terms, Privacy): the text edited in Admin → Policies. */
export default async function PolicyPage({ params }: Props) {
  const p = await getPolicy((await params).slug);
  if (!p) notFound();
  const blocks = policyBlocks(p.body);
  const headings = blocks.filter((b) => b.kind === "h");

  return (
    <div className="container-x py-14 md:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow text-muted">Policies</p>
        <h1 className="display mt-3 text-4xl font-normal md:text-5xl">{p.title}</h1>
        <p className="mt-4 leading-relaxed text-ink/70">{p.summary}</p>
        {p.updatedAt && <p className="mt-2 text-xs text-muted">Last updated {new Date(p.updatedAt).toLocaleDateString("en-IN", { dateStyle: "long" })}</p>}
      </div>

      <div className="mx-auto mt-12 grid max-w-5xl items-start gap-8 lg:grid-cols-[1fr_2.2fr]">
        <aside className="space-y-6 lg:sticky lg:top-28">
          <nav aria-label="Policies" className="rounded-3xl border border-line bg-white p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">All policies</p>
            <ul className="mt-3 space-y-1 text-sm">
              {POLICIES.map((x) => (
                <li key={x.slug}>
                  <Link
                    href={`/policies/${x.slug}`}
                    aria-current={x.slug === p.slug ? "page" : undefined}
                    className={`block rounded-2xl px-3 py-2 transition-colors ${x.slug === p.slug ? "bg-ink text-white" : "text-ink/75 hover:bg-sand"}`}
                  >
                    {x.slug === p.slug ? p.title : x.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {headings.length > 2 && (
            <nav aria-label="On this page" className="hidden rounded-3xl border border-line bg-white p-5 lg:block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">On this page</p>
              <ul className="mt-3 space-y-2 text-sm text-ink/70">
                {headings.map((h) => (
                  <li key={h.text}>
                    <a href={`#${anchorOf(h.text)}`} className="hover:text-ink hover:underline">
                      {h.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </aside>

        <article className="rounded-3xl border border-line bg-white p-7 text-[15px] leading-relaxed text-ink/80 md:p-10">
          {blocks.map((b, i) =>
            b.kind === "h" ? (
              <h2 key={i} id={anchorOf(b.text)} className="title mb-3 scroll-mt-28 text-base text-ink [&:not(:first-child)]:mt-9">
                {b.text}
              </h2>
            ) : b.kind === "ul" ? (
              <ul key={i} className="mb-4 list-disc space-y-1.5 pl-5 marker:text-ink/40">
                {b.items.map((t, j) => (
                  <li key={j}>{t}</li>
                ))}
              </ul>
            ) : (
              <p key={i} className="mb-4">
                {b.text}
              </p>
            ),
          )}
          <p className="mt-10 border-t border-line pt-6 text-sm text-muted">
            Questions? <Link href="/contact" className="underline underline-offset-2">Contact us</Link> and we&apos;ll help.
          </p>
        </article>
      </div>
    </div>
  );
}
