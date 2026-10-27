import type { ReactNode } from "react";
import { ShopChrome } from "@/components/shop-chrome";

// Products, prices and stock come from the database (edited in the admin), so storefront pages render per request.
export const dynamic = "force-dynamic";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return <ShopChrome>{children}</ShopChrome>;
}
