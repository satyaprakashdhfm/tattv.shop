import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowUpRight, LogOut } from "lucide-react";
import { adminTestLogin, requireAdmin } from "@/lib/server/auth";
import { listMessages, listOrders } from "@/lib/server/orders";
import { logout } from "../actions";
import { AdminNav } from "./admin-nav";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  const [orders, messages] = await Promise.all([listOrders(), listMessages()]);
  const counts = {
    toPack: orders.filter((o) => o.status === "confirmed").length,
    messages: messages.filter((m) => m.status === "new").length,
  };
  return (
    <div className="min-h-screen bg-paper">
      <header className="no-print sticky top-0 z-30 border-b border-line bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3.5 md:px-6">
          <Link href="/admin" className="flex items-center gap-3.5">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-ink shadow-soft">
              <Image src="/brand/mark-white.png" alt="" width={253} height={294} className="h-auto w-[18px]" />
            </span>
            <span>
              <span className="block text-lg font-semibold leading-tight tracking-[0.02em]">TATTV Admin</span>
              <span className="block text-xs text-muted">Orders, products and stock</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/" target="_blank" className="btn btn-outline btn-sm hidden border-line sm:inline-flex">
              View store <ArrowUpRight size={13} />
            </Link>
            <form action={logout}>
              <button className="btn btn-outline btn-sm border-line" aria-label="Sign out">
                <LogOut size={13} /> <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1440px] gap-6 px-4 py-5 md:flex md:px-6 md:py-6">
        <aside className="no-print mb-5 md:sticky md:top-[96px] md:mb-0 md:h-[calc(100vh-120px)] md:w-60 md:shrink-0">
          <div className="rounded-[1.75rem] border border-line bg-white p-2.5 shadow-soft md:h-full md:overflow-y-auto md:p-3">
            <AdminNav counts={counts} />
          </div>
        </aside>
        <main className="min-w-0 flex-1 space-y-6">
          {adminTestLogin() && (
            <p className="no-print rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-xs text-amber-900">
              Test login is on: anyone can sign in with admin / tattv-test. Remove <code>ADMIN_TEST_LOGIN</code> before taking real orders.
            </p>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
