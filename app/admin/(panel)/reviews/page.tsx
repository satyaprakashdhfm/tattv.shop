import Link from "next/link";
import { listReviews, type ReviewStatus } from "@/lib/server/reviews";
import { deleteReviewAction, setReviewStatusAction } from "../../actions";
import { PageHead, when } from "../ui";

export const metadata = { title: "Reviews" };

const TABS: [ReviewStatus | "all", string][] = [
  ["pending", "To review"],
  ["published", "On the site"],
  ["hidden", "Hidden"],
  ["all", "All"],
];

const Stars = ({ n }: { n: number }) => (
  <span role="img" aria-label={`${n} out of 5 stars`} className="text-[15px] tracking-[0.06em] text-[#b8862b]">
    {"★".repeat(n)}
    <span className="text-line">{"★".repeat(5 - n)}</span>
  </span>
);

export default async function ReviewsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const show = ((await searchParams).show || "pending") as ReviewStatus | "all";
  const all = await listReviews();
  const list = show === "all" ? all : all.filter((r) => r.status === show);
  const avg = all.length ? all.reduce((s, r) => s + r.rating, 0) / all.length : 0;

  return (
    <>
      <PageHead
        title="Reviews"
        sub={
          all.length
            ? `${all.length} from delivered orders · average ${avg.toFixed(1)} ★. Publish the ones to show on the home page; the rest stay private.`
            : "Once an order is delivered, its page asks the customer for a star rating and a few words. They arrive here."
        }
      />
      <nav aria-label="Reviews" className="adm-chips">
        {TABS.map(([id, label]) => (
          <Link key={id} href={id === "pending" ? "/admin/reviews" : `/admin/reviews?show=${id}`} aria-current={show === id ? "page" : undefined} className="adm-chip">
            {label} <span className="adm-chip-n">{id === "all" ? all.length : all.filter((r) => r.status === id).length}</span>
          </Link>
        ))}
      </nav>
      {all.filter((r) => r.status === "published").length === 0 && (
        <p className="adm-note">No review is published yet, so the home page shows the sample reviews (see lib/reviews.ts). Publishing the first real one replaces them.</p>
      )}
      {list.length === 0 && <p className="text-sm text-muted">Nothing here.</p>}
      <ul className="space-y-4">
        {list.map((r) => (
          <li key={r.id} className={`adm-card ${r.status === "pending" ? "border-l-4 border-l-ink" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="flex flex-wrap items-center gap-3">
                  <Stars n={r.rating} />
                  {r.status === "published" && <span className="pill pill-delivered">On the site</span>}
                  {r.status === "hidden" && <span className="pill pill-hidden">Hidden</span>}
                  {r.status === "pending" && <span className="pill pill-confirmed">New</span>}
                </p>
                {r.title && <p className="mt-2 font-medium">{r.title}</p>}
                <p className="mt-1 text-xs text-muted">
                  {r.name || "Customer"}
                  {r.city && `, ${r.city}`} ·{" "}
                  <Link href={`/admin/orders/${r.orderId}`} className="underline underline-offset-2">
                    {r.orderId}
                  </Link>{" "}
                  · {when(r.createdAt)}
                </p>
              </div>
              <form action={setReviewStatusAction} className="flex flex-wrap gap-2">
                <input type="hidden" name="id" value={r.id} />
                {r.status !== "published" && (
                  <button name="status" value="published" className="btn btn-dark btn-sm">
                    Publish
                  </button>
                )}
                {r.status !== "hidden" && (
                  <button name="status" value="hidden" className="btn btn-outline btn-sm">
                    {r.status === "published" ? "Take Off Site" : "Hide"}
                  </button>
                )}
              </form>
            </div>
            {r.body ? <p className="mt-4 whitespace-pre-wrap rounded-2xl bg-paper p-4 text-sm leading-relaxed">{r.body}</p> : <p className="mt-3 text-xs text-muted">Stars only, no words.</p>}
            <form action={deleteReviewAction} className="mt-3 text-right">
              <input type="hidden" name="id" value={r.id} />
              <button className="text-[11px] uppercase tracking-[0.12em] text-muted underline underline-offset-2 hover:text-red-700">Delete</button>
            </form>
          </li>
        ))}
      </ul>
    </>
  );
}
