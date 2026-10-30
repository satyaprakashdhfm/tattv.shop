import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Search engines may read the store, not the admin, the API or anyone's bag, account or orders.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/checkout", "/cart", "/account", "/orders/", "/wishlist"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
