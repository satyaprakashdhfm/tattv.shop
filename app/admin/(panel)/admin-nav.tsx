"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, Clapperboard, FileText, LayoutGrid, MessageSquare, Package, Receipt, Search, Settings, Star, Tags, TicketPercent, Truck, Users, type LucideIcon } from "lucide-react";

type Count = "toPack" | "messages" | "reviews";
type Item = [href: string, label: string, icon: LucideIcon, count: Count | null];

const GROUPS: [string, Item[]][] = [
  ["Insights", [["/admin", "Overview", LayoutGrid, null]]],
  [
    "Orders",
    [
      ["/admin/orders", "Orders", Receipt, "toPack"],
      ["/admin/delivery", "Delivery", Truck, null],
      ["/admin/coupons", "Coupons", TicketPercent, null],
    ],
  ],
  [
    "Catalogue",
    [
      ["/admin/products", "Products", Package, null],
      ["/admin/categories", "Categories", Tags, null],
      ["/admin/stock", "Stock & Prices", Boxes, null],
    ],
  ],
  [
    "People",
    [
      ["/admin/customers", "Customers", Users, null],
      ["/admin/messages", "Messages", MessageSquare, "messages"],
      ["/admin/reviews", "Reviews", Star, "reviews"],
    ],
  ],
  [
    "Store",
    [
      ["/admin/videos", "Videos", Clapperboard, null],
      ["/admin/policies", "Policies", FileText, null],
      ["/admin/seo", "Google Search", Search, null],
      ["/admin/settings", "Site Settings", Settings, null],
    ],
  ],
];

export function AdminNav({ counts }: { counts: Record<Count, number> }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="no-scrollbar flex gap-1 overflow-x-auto md:block md:space-y-4">
      {GROUPS.map(([group, items]) => (
        <div key={group} className="contents md:block">
          <p className="hidden px-3 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted md:block">{group}</p>
          <div className="contents md:block md:space-y-1">
            {items.map(([href, label, Icon, countKey]) => {
              const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
              const n = countKey ? counts[countKey] : 0;
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex shrink-0 items-center gap-3 whitespace-nowrap rounded-2xl px-3.5 py-2.5 text-sm transition-[background-color,color,box-shadow] duration-200 ${
                    active ? "bg-ink font-medium text-white shadow-[0_8px_20px_-10px_rgba(0,0,0,0.6)]" : "text-ink/75 hover:bg-sand hover:text-ink"
                  }`}
                >
                  <Icon size={17} strokeWidth={1.7} />
                  <span className="flex-1">{label}</span>
                  {n > 0 && (
                    <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold ${active ? "bg-white text-ink" : "bg-ink text-white"}`}>{n}</span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
