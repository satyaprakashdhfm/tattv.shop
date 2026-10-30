import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import { searchConsoleProblem, searchConsoleSite, seoReport, serviceAccountEmail, type SearchRow } from "@/lib/server/search-console";
import { PageHead } from "../ui";

export const metadata = { title: "Google Search" };
export const dynamic = "force-dynamic";

const RANGES = [
  { id: "7d", days: 7, label: "7 days" },
  { id: "28d", days: 28, label: "28 days" },
  { id: "90d", days: 90, label: "90 days" },
  { id: "1y", days: 365, label: "1 year" },
] as const;

// Google's numbers run about two days behind, so periods end two days ago (India time).
const dayKey = (daysAgo: number) => new Date(Date.now() + 5.5 * 3600_000 - daysAgo * 86400_000).toISOString().slice(0, 10);
const num = (n: number) => n.toLocaleString("en-IN");
const pos = (p: number | null) => (p == null ? "–" : p.toFixed(1));

function Rows({ title, rows, first }: { title: string; rows: SearchRow[]; first: string }) {
  return (
    <section className="adm-card overflow-x-auto !p-0">
      <h2 className="adm-h2 px-6 pt-5">{title}</h2>
      {rows.length === 0 ? (
        <p className="px-6 pb-6 text-sm text-muted">Nothing yet for these dates.</p>
      ) : (
        <table className="adm-table">
          <thead>
            <tr>
              <th>{first}</th>
              <th className="text-right">Shown</th>
              <th className="text-right">Clicks</th>
              <th className="text-right">Position</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <td className="max-w-[18rem] truncate">
                  {first === "Page" ? (
                    <a href={r.label} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {r.label}
                    </a>
                  ) : (
                    r.label
                  )}
                </td>
                <td className="text-right">{num(r.impressions)}</td>
                <td className="text-right">{num(r.clicks)}</td>
                <td className="text-right">{pos(r.position)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

/** Admin → Google Search: the SEO setup checklist, and how the store shows up in Google (Search Console). */
export default async function SeoPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const picked = (await searchParams).range;
  const range = RANGES.find((r) => r.id === picked) ?? RANGES[1];
  const to = dayKey(2);
  const from = dayKey(range.days + 1);
  const keyProblem = searchConsoleProblem();
  const report = keyProblem ? null : await seoReport(from, to);
  const peak = Math.max(1, ...(report?.days ?? []).map((d) => d.impressions));
  const verified = !!process.env.GOOGLE_SITE_VERIFICATION;

  const setup: [boolean, string][] = [
    [true, `Sitemap is live at ${SITE_URL}/sitemap.xml: every product, category and policy page, updated as you edit the catalogue`],
    [true, "robots.txt keeps the admin, checkout, bag and accounts out of Google"],
    [true, "Products carry price, stock and photo details for Google's rich results, and share previews for WhatsApp and Instagram"],
    [!!process.env.NEXT_PUBLIC_SITE_URL, process.env.NEXT_PUBLIC_SITE_URL ? `Site address is ${SITE_URL}` : "Set NEXT_PUBLIC_SITE_URL to the live address (https://tattv.shop) so sitemap links are right"],
    [
      verified,
      verified
        ? "Search Console ownership tag is on the site"
        : "Verify the site in Search Console: a Domain property by DNS record (recommended), or set GOOGLE_SITE_VERIFICATION to the HTML tag's content value",
    ],
    [!keyProblem, keyProblem ? `Search reports: ${keyProblem} Add a service account key with the Search Console API switched on.` : `Reports read from ${searchConsoleSite()} as ${serviceAccountEmail()}`],
  ];

  return (
    <>
      <PageHead title="Google Search" sub="How often TATTV shows up on Google, what people searched, and which pages they found. From Google Search Console." />

      <section className="adm-card">
        <h2 className="adm-h2">SEO setup</h2>
        <ul className="space-y-2 text-sm">
          {setup.map(([ok, text]) => (
            <li key={text} className="flex items-start gap-3">
              <span aria-hidden className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] ${ok ? "bg-ink text-white" : "border border-amber-400 text-amber-700"}`}>
                {ok ? "✓" : "!"}
              </span>
              {!ok && <span className="sr-only">To do: </span>}
              {text}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-muted">
          Once the site is verified, submit <b className="font-medium">{SITE_URL}/sitemap.xml</b> under Search Console → Sitemaps. Google shows product names, one-line summaries and photos, so keep them filled in (Products).
        </p>
      </section>

      {report && (
        <>
          <section className="adm-card !p-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-4">
              <h2 className="adm-h2 !mb-0">Search results</h2>
              <nav aria-label="Period" className="flex rounded-full bg-[#f1f1ef] p-1 text-xs">
                {RANGES.map((r) => (
                  <Link
                    key={r.id}
                    href={r.id === "28d" ? "/admin/seo" : `/admin/seo?range=${r.id}`}
                    scroll={false}
                    aria-current={r.id === range.id ? "page" : undefined}
                    className={`whitespace-nowrap rounded-full px-3 py-1.5 transition-colors ${r.id === range.id ? "bg-white font-medium text-ink shadow-soft" : "text-ink/55 hover:text-ink"}`}
                  >
                    {r.label}
                  </Link>
                ))}
              </nav>
            </div>
            {report.problem && <p className="adm-error mx-6 mt-4">{report.problem}</p>}
            <dl className="grid grid-cols-2 divide-line md:grid-cols-4 md:divide-x">
              {[
                ["Shown in Google", report.totals ? num(report.totals.impressions) : "–"],
                ["Clicks from Google", report.totals ? num(report.totals.clicks) : "–"],
                ["Click rate", report.totals?.impressions ? `${((report.totals.clicks / report.totals.impressions) * 100).toFixed(1)}%` : "–"],
                ["Average position", pos(report.totals?.position ?? null)],
              ].map(([k, v]) => (
                <div key={k} className="px-6 py-5">
                  <dt className="text-xs text-muted">{k}</dt>
                  <dd className="mt-2 text-2xl font-semibold tracking-tight">{v}</dd>
                </div>
              ))}
            </dl>
            {report.days.length > 0 && (
              <div className="flex h-32 items-end gap-0.5 border-t border-line px-6 pb-4 pt-4" role="img" aria-label="Times shown in Google per day">
                {report.days.map((d) => (
                  <span key={d.date} title={`${d.date}: shown ${d.impressions}, ${d.clicks} clicks`} className="min-h-0.5 flex-1 rounded-t bg-[#d9d9d6] hover:bg-ink/60" style={{ height: `${(d.impressions / peak) * 100}%` }} />
                ))}
              </div>
            )}
            <p className="border-t border-line px-6 py-3 text-xs text-muted">
              {from} to {to}. Google&apos;s numbers run about two days behind. Position is where the page sat in results on average; 1 to 10 is the first page.
            </p>
          </section>
          <div className="grid gap-6 lg:grid-cols-2">
            <Rows title="Top searches" rows={report.queries} first="Search" />
            <Rows title="Top pages" rows={report.pages} first="Page" />
          </div>
          <section className="adm-card text-sm">
            <h2 className="adm-h2">Sitemap</h2>
            {report.sitemap ? (
              <p>
                Google last read <b className="font-medium">{report.sitemap.path}</b>
                {report.sitemap.lastRead ? ` on ${new Date(report.sitemap.lastRead).toLocaleDateString("en-IN", { dateStyle: "medium" })}` : ""}: {report.sitemap.pages} pages, {report.sitemap.errors} errors,{" "}
                {report.sitemap.warnings} warnings.
              </p>
            ) : (
              <p className="text-muted">Not submitted yet. Add {SITE_URL}/sitemap.xml under Search Console → Sitemaps.</p>
            )}
          </section>
        </>
      )}
    </>
  );
}
