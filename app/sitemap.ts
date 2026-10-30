import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/server/catalog";
import { POLICIES } from "@/lib/policies";
import { SITE_URL } from "@/lib/site";

// Every public page, for Google (submit https://tattv.shop/sitemap.xml in Search Console once).
// Built from the live catalogue, so new products appear without a deploy.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, categories } = await getCatalog();
  const u = (path: string) => SITE_URL + path;
  return [
    { url: u("/"), changeFrequency: "daily", priority: 1 },
    { url: u("/shop"), changeFrequency: "daily", priority: 0.9 },
    { url: u("/collections"), changeFrequency: "weekly", priority: 0.7 },
    ...categories.filter((c) => products.some((p) => p.category === c.id)).map((c) => ({ url: u(`/shop?category=${c.id}`), changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: u(`/product/${p.slug}`), changeFrequency: "weekly" as const, priority: 0.8, images: p.images.slice(0, 3).map((i) => (i.startsWith("http") ? i : u(i))) })),
    { url: u("/about"), changeFrequency: "monthly", priority: 0.5 },
    { url: u("/contact"), changeFrequency: "yearly", priority: 0.4 },
    { url: u("/help"), changeFrequency: "monthly", priority: 0.4 },
    { url: u("/returns"), changeFrequency: "yearly", priority: 0.3 },
    ...POLICIES.map((p) => ({ url: u(`/policies/${p.slug}`), changeFrequency: "yearly" as const, priority: 0.2 })),
  ];
}
