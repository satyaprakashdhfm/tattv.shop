import Link from "next/link";
import { listReviews, type ReviewStatus } from "@/lib/server/reviews";
import { deleteReviewAction, setReviewStatusAction } from "../../actions";
import { PageHead, when } from "../ui";
import { Modal } from "../modal";
import { ReviewForm } from "./review-form";

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
  const sp = await searchParams;
  const all = await listReviews();
  // Opens on "To review" when customers have sent new ones, else on what the site shows.
  const show = (sp.show || (all.some((r) => r.status === "pending") ? "pending" : "published")) as ReviewStatus | "all";
  const listHref = `/admin/reviews?show=${show}`;
  const editing = sp.edit === "new" ? "new" : all.find((r) => r.id === sp.edit);
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
      >
        <Link href={`${listHref}&edit=new`} scroll={false} className="btn btn-dark btn-sm">
          + Write a Review
        </Link>
      </PageHead>
      {sp.saved && <p className="adm-ok">Review saved. Published reviews show on the home page straight away.</p>}
      <nav aria-label="Reviews" className="adm-chips">
        {TABS.map(([id, label]) => (
          <Link key={id} href={`/admin/reviews?show=${id}`} aria-current={show === id ? "page" : undefined} className="adm-chip">
            {label} <span className="adm-chip-n">{id === "all" ? all.length : all.filter((r) => r.status === id).length}</span>
          </Link>
        ))}
      </nav>
      {all.some((r) => r.source === "sample" && r.status === "published") && (
        <p className="adm-note">Reviews marked Sample are placeholders so the home page can be seen before real ones arrive. Edit them, or hide or delete them before launch.</p>
      )}
      {all.every((r) => r.status !== "published") && <p className="adm-note">No review is published, so the home page hides the reviews section.</p>}
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
                  {r.source === "sample" && <span className="pill pill-packed">Sample</span>}
                  {r.source === "admin" && <span className="pill pill-shipped">Written in admin</span>}
                </p>
                {r.title && <p className="mt-2 font-medium">{r.title}</p>}
                <p className="mt-1 text-xs text-muted">
                  {r.name || "Customer"}
                  {r.city && `, ${r.city}`} ·{" "}
                  {r.orderId ? (
                    <>
                      <Link href={`/admin/orders/${r.orderId}`} className="underline underline-offset-2">
                        {r.orderId}
                      </Link>{" "}
                      ·{" "}
                    </>
                  ) : null}
                  {when(r.createdAt)}
                </p>
              </div>
              <form action={setReviewStatusAction} className="flex flex-wrap gap-2">
                <input type="hidden" name="id" value={r.id} />
                <Link href={`${listHref}&edit=${r.id}`} scroll={false} className="btn btn-outline btn-sm">
                  Edit
                </Link>
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

      {editing && (
        <Modal closeHref={listHref} title={editing === "new" ? "Write a Review" : "Edit Review"} sub={editing === "new" ? "For a review a customer sent you another way (WhatsApp, Instagram…)." : editing.orderId ? `From order ${editing.orderId}` : undefined}>
          <ReviewForm key={editing === "new" ? "new" : editing.id} review={editing === "new" ? undefined : editing} returnTo={listHref} />
        </Modal>
      )}
    </>
  );
}
