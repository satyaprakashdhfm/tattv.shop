import Image from "next/image";
import Link from "next/link";
import { loadCatalogData } from "@/lib/server/catalog";
import { listAlerts, restockMessage, type AlertStatus } from "@/lib/server/stock-alerts";
import { whatsappConfigured } from "@/lib/server/whatsapp";
import { deleteAlertAction, markAlertSentAction, sendRestockNowAction } from "../../actions";
import { PageHead, when } from "../ui";

export const metadata = { title: "Notify Requests" };
export const dynamic = "force-dynamic";

const STATUS: Record<AlertStatus, [string, string]> = {
  waiting: ["Waiting for stock", "pill-hidden"],
  ready: ["Back in stock, message waiting", "pill-packed"],
  sent: ["Message sent", "pill-delivered"],
  failed: ["Not sent", "pill-cancelled"],
};

/** Admin → Notify Requests: who asked to hear when a sold-out piece is back, grouped by product. */
export default async function NotifyPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const [alerts, { products }] = await Promise.all([listAlerts(), loadCatalogData()]);
  const connected = whatsappConfigured();
  const groups = [...new Set(alerts.map((a) => a.productSlug))]
    .map((slug) => ({ product: products.find((p) => p.slug === slug), slug, list: alerts.filter((a) => a.productSlug === slug) }))
    .sort((a, b) => b.list.filter((x) => x.status !== "sent").length - a.list.filter((x) => x.status !== "sent").length);
  const toSend = alerts.filter((a) => a.status === "ready" || a.status === "failed").length;

  return (
    <>
      <PageHead
        title="Notify Requests"
        sub={`${alerts.filter((a) => a.status === "waiting").length} waiting for stock · ${toSend} back in stock, to message · ${alerts.filter((a) => a.status === "sent").length} told`}
      >
        {connected && toSend > 0 && (
          <form action={sendRestockNowAction}>
            <button className="btn btn-dark btn-sm">Send Waiting Messages</button>
          </form>
        )}
      </PageHead>
      {sp.note && <p className="adm-ok">{sp.note}</p>}
      <p className="adm-note">
        Shoppers tap <b className="font-medium">Notify Me</b> on a sold-out piece and leave their WhatsApp number. When its stock goes above 0 (product form, Stock &amp; Prices, or a cancelled order),{" "}
        {connected ? "each one gets a WhatsApp message automatically and is marked Message sent." : "they move to “Back in stock”. WhatsApp isn't connected yet, so tap WhatsApp to send the message, then Mark Sent. Once it is connected, this happens by itself."}
      </p>

      {groups.length === 0 && <p className="text-sm text-muted">No requests yet.</p>}
      <div className="space-y-5">
        {groups.map(({ product, slug, list }) => (
          <section key={slug} className="adm-card overflow-x-auto !p-0">
            <div className="flex flex-wrap items-center gap-4 px-6 pt-5">
              <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-sand">{product?.images[0] && <Image src={product.images[0]} alt="" fill sizes="48px" className="object-cover" />}</span>
              <div className="min-w-0 flex-1">
                <Link href={`/admin/products?edit=${slug}`} className="font-medium underline-offset-2 hover:underline">
                  {product?.name ?? slug}
                </Link>
                <p className="text-xs text-muted">
                  {product?.stock === 0 ? <b className="font-medium text-red-700">Sold out</b> : product?.stock == null ? "In stock" : `${product.stock} in stock`} · {list.length} {list.length === 1 ? "request" : "requests"}
                </p>
              </div>
            </div>
            <table className="adm-table mt-3">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th className="hidden md:table-cell">Asked</th>
                  <th>Status</th>
                  <th className="text-right" />
                </tr>
              </thead>
              <tbody>
                {list.map((a) => (
                  <tr key={a.id}>
                    <td>
                      {a.name || <span className="text-muted">(no name)</span>}
                      <span className="block text-xs text-muted">+91 {a.phone}</span>
                    </td>
                    <td className="hidden text-sm text-muted md:table-cell">{when(a.createdAt)}</td>
                    <td>
                      <span className={`pill ${STATUS[a.status][1]}`}>{STATUS[a.status][0]}</span>
                      {a.notifiedAt && <span className="block text-xs text-muted">{when(a.notifiedAt)}</span>}
                      {a.status === "failed" && <span className="block text-xs text-red-700">{a.note}</span>}
                    </td>
                    <td className="text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        {(a.status === "ready" || a.status === "failed") && (
                          <>
                            <a
                              href={`https://wa.me/91${a.phone}?text=${encodeURIComponent(restockMessage(a.name, product?.name ?? slug, slug))}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm bg-[#25d366] text-white"
                            >
                              WhatsApp
                            </a>
                            <form action={markAlertSentAction}>
                              <input type="hidden" name="id" value={a.id} />
                              <button className="btn btn-outline btn-sm">Mark Sent</button>
                            </form>
                          </>
                        )}
                        <form action={deleteAlertAction}>
                          <input type="hidden" name="id" value={a.id} />
                          <button className="text-[11px] uppercase tracking-[0.12em] text-muted underline underline-offset-2 hover:text-red-700">Delete</button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </>
  );
}
