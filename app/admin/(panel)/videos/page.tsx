import { loadCatalogData } from "@/lib/server/catalog";
import { listReels } from "@/lib/server/reels";
import { PageHead } from "../ui";
import { AddVideoForm, VideoRow } from "./video-forms";

export const metadata = { title: "Videos" };

export default async function VideosPage() {
  const [reels, { products }] = await Promise.all([listReels(), loadCatalogData()]);
  const options = products.map((p) => ({ slug: p.slug, name: p.name, active: p.active !== false }));
  const on = reels.filter((r) => r.active).length;
  const linked = reels.filter((r) => r.active && r.productSlug).length;
  return (
    <>
      <PageHead
        title="Videos"
        sub={`The “Follow Us on Instagram” row on the home page. ${on} of ${reels.length} shown · ${linked} linked to a product (tapping one opens that product).`}
      />
      <AddVideoForm products={options} />
      {reels.length === 0 ? (
        <p className="text-sm text-muted">No videos yet, so the home page hides the row. Add one above.</p>
      ) : (
        <ol className="space-y-4">
          {reels.map((r, i) => (
            <VideoRow key={r.id} reel={r} n={i + 1} first={i === 0} last={i === reels.length - 1} products={options} />
          ))}
        </ol>
      )}
    </>
  );
}
