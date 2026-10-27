import { loadCatalogData } from "@/lib/server/catalog";
import { isLive, listOrders } from "@/lib/server/orders";
import { PageHead } from "../ui";
import { StockForm } from "./stock-form";

export const metadata = { title: "Stock & prices" };

export default async function StockPage() {
  const [{ products }, orders] = await Promise.all([loadCatalogData(), listOrders()]);
  const sold: Record<string, number> = {};
  for (const o of orders.filter(isLive)) for (const l of o.lines) sold[l.slug] = (sold[l.slug] || 0) + l.qty;

  return (
    <>
      <PageHead title="Stock & Prices" />
      <p className="adm-note">
        Change prices and stock for every piece on one screen. Stock goes down automatically when an order is confirmed and back up if you cancel it. Leave stock <b className="font-medium">empty</b> to stop tracking it (always available). At{" "}
        <b className="font-medium">0</b> the piece shows as sold out.
      </p>
      <StockForm products={products.map((p) => ({ slug: p.slug, name: p.name, image: p.images[0] ?? "", price: p.price, stock: p.stock ?? null, active: p.active !== false, sold: sold[p.slug] || 0 }))} />
    </>
  );
}
