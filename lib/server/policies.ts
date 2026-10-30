import "server-only";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, formatPrice } from "@/lib/format";
import { OrderError } from "@/lib/pricing";
import { POLICIES, fillPolicy, policyBySlug, type PolicyPage } from "@/lib/policies";
import { RETURN_WINDOW_DAYS } from "@/lib/site";
import { loadCatalogData } from "./catalog";
import { query } from "./db";

// Policy pages as edited in Admin → Policies, over the standard text in lib/policies.ts.

export interface StoredPolicy extends PolicyPage {
  /** False while the page still shows the standard text. */
  edited: boolean;
  updatedAt: string | null;
}

export async function listPolicies(): Promise<StoredPolicy[]> {
  const r = await query<{ slug: string; title: string; body: string; updated_at: Date }>("SELECT slug, title, body, updated_at FROM policies");
  return POLICIES.map((p) => {
    const row = r.rows.find((x) => x.slug === p.slug);
    return row ? { ...p, title: row.title, body: row.body, edited: true, updatedAt: row.updated_at.toISOString() } : { ...p, edited: false, updatedAt: null };
  });
}

/** One policy with Site Settings filled in, ready to show; null for an unknown slug. */
export async function getPolicy(slug: string) {
  const p = (await listPolicies()).find((x) => x.slug === slug);
  if (!p) return null;
  const { settings } = await loadCatalogData();
  const vars = {
    email: settings.email,
    phone: settings.phone,
    address: settings.address.replace(/\n/g, ", "),
    hours: settings.hours,
    freeShipping: formatPrice(FREE_SHIPPING_THRESHOLD),
    shippingFee: formatPrice(SHIPPING_FEE),
    returnDays: String(RETURN_WINDOW_DAYS),
  };
  return { ...p, body: fillPolicy(p.body, vars) };
}

export async function savePolicy(slug: string, input: { title: unknown; body: unknown }) {
  if (!policyBySlug(slug)) throw new OrderError("Unknown policy", 404);
  const title = String(input.title || "").trim().slice(0, 120);
  const body = String(input.body || "").replace(/\r/g, "").trim().slice(0, 30_000);
  if (!title) throw new OrderError("Give the page a title.");
  if (!body) throw new OrderError("The policy can't be empty. Use “Reset to standard text” to start again.");
  await query(
    "INSERT INTO policies (slug, title, body) VALUES ($1,$2,$3) ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body, updated_at = now()",
    [slug, title, body],
  );
}

/** Back to the standard text in lib/policies.ts. */
export async function resetPolicy(slug: string) {
  await query("DELETE FROM policies WHERE slug = $1", [slug]);
}
