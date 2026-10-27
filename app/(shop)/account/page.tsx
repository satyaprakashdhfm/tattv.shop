"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Headphones,
  Heart,
  House,
  LayoutGrid,
  LogOut,
  Mail,
  MapPin,
  Navigation,
  Package,
  PackageCheck,
  Phone,
  RotateCcw,
  Truck,
  User,
  X,
} from "lucide-react";
import { useCatalog, useStore } from "@/components/store-provider";
import { ProductCard } from "@/components/product-card";
import { WhatsAppIcon } from "@/components/social-icons";
import { formatPrice } from "@/lib/format";
import { api, myOrders } from "@/lib/client-api";
import { CONTACT, ORDER_STATUSES, RETURN_WINDOW_DAYS, TRACKER_STEPS, WHATSAPP_HELLO, whatsappLink, type OrderStatus } from "@/lib/site";
import { DEMO_ADDRESSES, DEMO_CREDENTIALS, type Account } from "@/lib/demo-account";
import { ContactForm } from "../contact/contact-form";
import { ReturnsForm } from "../returns/returns-form";

const SECTIONS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "orders", label: "Orders", icon: Package },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "wishlist", label: "Wishlist", icon: Heart },
  { id: "details", label: "Account Details", icon: User },
  { id: "support", label: "Contact & Support", icon: Headphones },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

/** An order as the account page gets it from /api/account/orders. */
interface AccountOrder {
  id: string;
  token: string;
  createdAt: string;
  status: OrderStatus;
  customer: { firstName: string; lastName: string; email: string; address: string; apartment: string; city: string; state: string; pin: string };
  lines: { slug: string; name: string; size: string | null; price: number; qty: number; image: string }[];
  total: number;
  tracking: { courier: string; number: string; url: string } | null;
  history: { at: string; status: OrderStatus; note: string }[];
}

const STATUS_STYLE: Record<OrderStatus, string> = {
  pending_payment: "bg-line text-ink/70",
  confirmed: "bg-amber-100 text-amber-800",
  packed: "bg-orange-100 text-orange-800",
  shipped: "bg-sky-100 text-sky-800",
  out_for_delivery: "bg-indigo-100 text-indigo-800",
  delivered: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-sand-dark text-ink/70",
};

const STEP_ICON = { confirmed: ClipboardCheck, packed: PackageCheck, shipped: Truck, out_for_delivery: Navigation, delivered: House } as Record<OrderStatus, typeof Truck>;

const day = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const date = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
const orderLink = (o: AccountOrder) => `/orders/${o.id}?t=${o.token}`;

/** When each tracker step was reached (the latest event for that status). */
const reachedAt = (o: AccountOrder, s: OrderStatus) => [...o.history].reverse().find((e) => e.status === s)?.at;

/** Returns and exchanges are open for RETURN_WINDOW_DAYS after delivery. */
function canReturn(o: AccountOrder) {
  const delivered = reachedAt(o, "delivered");
  return o.status === "delivered" && !!delivered && Date.now() - Date.parse(delivered) < RETURN_WINDOW_DAYS * 86400_000;
}

/** Orders placed in this browser, plus the preview customer's orders when that account is signed in. */
function useAccountOrders(account: Account) {
  const [orders, setOrders] = useState<AccountOrder[] | null>(null);
  useEffect(() => {
    api<{ orders: AccountOrder[] }>("/api/account/orders", {
      method: "POST",
      body: { refs: myOrders(), preview: account.email === DEMO_CREDENTIALS.email },
    })
      .then((d) => setOrders(d.orders))
      .catch(() => setOrders([]));
  }, [account.email]);
  return orders;
}

export default function AccountPage() {
  const { account, sessionReady } = useStore();
  if (!sessionReady) return <div className="min-h-[60vh]" />;
  return account ? <Dashboard account={account} /> : <SignIn />;
}

function SignIn() {
  const { signIn } = useStore();
  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="container-x flex justify-center py-16 md:py-24">
      <div className="w-full max-w-md">
        <h1 className="title text-center text-xl md:text-2xl">{mode === "signin" ? "Sign In" : "Create Account"}</h1>
        <p className="mt-3 text-center text-sm text-muted">
          {mode === "signin" ? "Access your orders, wishlist and saved addresses." : "Join TATTV for early access and faster checkout."}
        </p>

        <div className="mt-8 rounded-2xl border border-dashed border-ink/25 bg-sand px-5 py-4 text-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">Preview account</p>
          <p className="mt-2 text-ink/75">
            Email: <span className="font-medium text-ink">{DEMO_CREDENTIALS.email}</span>
            <br />
            Password: <span className="font-medium text-ink">{DEMO_CREDENTIALS.password}</span>
          </p>
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setEmail(DEMO_CREDENTIALS.email);
              setPassword(DEMO_CREDENTIALS.password);
              setMessage(null);
            }}
            className="mt-3 text-xs font-medium underline underline-offset-4"
          >
            Fill in for me
          </button>
        </div>

        <div className="mt-8 grid grid-cols-2 rounded-full bg-sand p-1">
          {(["signin", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setMessage(null);
              }}
              className={`eyebrow rounded-full py-2.5 transition-colors ${mode === m ? "bg-white text-ink shadow-soft" : "text-muted"}`}
            >
              {m === "signin" ? "Sign In" : "Register"}
            </button>
          ))}
        </div>
        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (mode === "register") {
              setMessage("Registration opens at launch. Use the preview account above to look around.");
            } else if (!signIn(email, password)) {
              setMessage("That email and password don't match. Try the preview account above.");
            }
          }}
        >
          {mode === "register" && <input required placeholder="Full name" aria-label="Full name" className="field" />}
          <input required type="email" placeholder="Email" aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" />
          <input
            required
            type="password"
            placeholder="Password"
            aria-label="Password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="field"
          />
          <button type="submit" className="btn btn-dark w-full">
            {mode === "signin" ? "Sign In" : "Create Account"}
          </button>
          {message && (
            <p role="alert" className="text-center text-sm text-muted">
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

function Dashboard({ account }: { account: Account }) {
  const { signOut } = useStore();
  const [section, setSection] = useState<SectionId>("overview");
  const orders = useAccountOrders(account);
  const [returning, setReturning] = useState<AccountOrder | null>(null);
  const go = (s: SectionId) => {
    setSection(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="bg-sand/40">
      <div className="container-x py-10 md:py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-muted">My Account</p>
            <h1 className="display mt-2 text-3xl font-normal md:text-4xl">Welcome back, {account.firstName}</h1>
          </div>
          <p className="rounded-full bg-white px-4 py-2 text-xs text-muted shadow-soft">Member since {account.memberSince}</p>
        </div>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[250px_1fr] lg:gap-8">
          <nav aria-label="Account" className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:sticky lg:top-24 lg:mx-0 lg:flex-col lg:gap-1 lg:overflow-visible lg:rounded-3xl lg:bg-white lg:p-2.5 lg:shadow-soft">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => go(id)}
                aria-current={section === id ? "page" : undefined}
                className={`flex shrink-0 items-center gap-3 rounded-full px-4 py-2.5 text-sm transition-colors lg:rounded-2xl lg:py-3 ${
                  section === id ? "bg-ink text-white" : "bg-white text-ink/80 shadow-soft hover:bg-sand lg:shadow-none"
                }`}
              >
                <Icon size={16} strokeWidth={1.5} /> {label}
              </button>
            ))}
            <span className="mx-3 my-1.5 hidden h-px bg-line lg:block" />
            <button onClick={signOut} className="flex shrink-0 items-center gap-3 rounded-full bg-white px-4 py-2.5 text-sm text-ink/70 shadow-soft hover:bg-sand lg:rounded-2xl lg:py-3 lg:shadow-none">
              <LogOut size={16} strokeWidth={1.5} /> Sign Out
            </button>
          </nav>

          <div className="min-w-0">
            {section === "overview" && <Overview account={account} orders={orders} go={go} onReturn={setReturning} />}
            {section === "orders" && <Orders orders={orders} onReturn={setReturning} />}
            {section === "addresses" && <Addresses />}
            {section === "wishlist" && <Wishlist />}
            {section === "details" && <Details account={account} />}
            {section === "support" && <Support />}
          </div>
        </div>
      </div>

      {returning && <ReturnModal order={returning} email={account.email} onClose={() => setReturning(null)} />}
    </div>
  );
}

function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <h2 className="title text-base md:text-lg">{children}</h2>
      {action}
    </div>
  );
}

const card = "rounded-3xl bg-white shadow-soft";

function Overview({ account, orders, go, onReturn }: { account: Account; orders: AccountOrder[] | null; go: (s: SectionId) => void; onReturn: (o: AccountOrder) => void }) {
  const { wishlist } = useStore();
  const latest = orders?.[0];
  const stats = [
    { label: "Orders", value: orders?.length ?? "–", to: "orders" as const, icon: Package },
    { label: "Wishlist", value: wishlist.length, to: "wishlist" as const, icon: Heart },
    { label: "Saved Addresses", value: DEMO_ADDRESSES.length, to: "addresses" as const, icon: MapPin },
  ];
  const home = DEMO_ADDRESSES.find((a) => a.isDefault) ?? DEMO_ADDRESSES[0];

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map(({ label, value, to, icon: Icon }) => (
          <button key={label} onClick={() => go(to)} className={`${card} group flex items-center gap-4 p-5 text-left transition-shadow hover:shadow-lift`}>
            <span className="flex size-11 items-center justify-center rounded-2xl bg-sand">
              <Icon size={18} strokeWidth={1.5} />
            </span>
            <span className="flex-1">
              <span className="block text-2xl font-medium">{value}</span>
              <span className="block text-xs text-muted">{label}</span>
            </span>
            <ChevronRight size={16} className="text-muted transition-transform group-hover:translate-x-0.5" />
          </button>
        ))}
      </div>

      <section>
        <SectionTitle
          action={
            orders && orders.length > 1 ? (
              <button onClick={() => go("orders")} className="text-xs text-muted underline underline-offset-4 hover:text-ink">
                View all orders
              </button>
            ) : undefined
          }
        >
          Latest Order
        </SectionTitle>
        {orders === null ? <div className={`${card} h-64 animate-pulse`} /> : latest ? <OrderCard order={latest} onReturn={onReturn} /> : <NoOrders />}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className={`${card} p-6`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">Profile</p>
          <p className="mt-3 font-medium">
            {account.firstName} {account.lastName}
          </p>
          <p className="mt-1 text-sm text-muted">{account.email}</p>
          <p className="text-sm text-muted">{account.phone}</p>
          <button onClick={() => go("details")} className="mt-4 text-xs underline underline-offset-4">
            Edit details
          </button>
        </div>
        <div className={`${card} p-6`}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">Default Address</p>
          <p className="mt-3 font-medium">{home.name}</p>
          {home.lines.map((l) => (
            <p key={l} className="text-sm text-muted">
              {l}
            </p>
          ))}
          <button onClick={() => go("addresses")} className="mt-4 text-xs underline underline-offset-4">
            Manage addresses
          </button>
        </div>
      </section>

      <button onClick={() => go("support")} className={`${card} group flex w-full items-center gap-4 p-5 text-left transition-shadow hover:shadow-lift`}>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sand">
          <Headphones size={18} strokeWidth={1.5} />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-medium">Need help?</span>
          <span className="block text-xs text-muted">Email, WhatsApp or call us. For a return or exchange, use the button on the order.</span>
        </span>
        <ChevronRight size={16} className="text-muted transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}

function NoOrders() {
  return (
    <div className={`${card} px-6 py-14 text-center`}>
      <Package size={28} strokeWidth={1.2} className="mx-auto" />
      <p className="mt-4 text-sm text-muted">No orders yet. Your orders and their tracking will show up here.</p>
      <Link href="/shop" className="btn btn-dark mt-6">
        Start Shopping
      </Link>
    </div>
  );
}

/** The delivery steps, with the date each one was reached. */
function Tracker({ order }: { order: AccountOrder }) {
  const step = TRACKER_STEPS.indexOf(order.status);
  if (step < 0) return null;
  return (
    <ol className="grid grid-cols-5" aria-label="Delivery progress">
      {TRACKER_STEPS.map((s, i) => {
        const Icon = STEP_ICON[s];
        const done = i <= step;
        const at = done ? reachedAt(order, s) : undefined;
        return (
          <li key={s} aria-current={i === step ? "step" : undefined} className="relative flex flex-col items-center text-center">
            {i > 0 && <span className={`absolute left-[-50%] right-1/2 top-[17px] h-0.5 ${i <= step ? "bg-ink" : "bg-line"}`} />}
            <span className={`relative z-[1] flex size-9 items-center justify-center rounded-full transition-colors ${i === step ? "bg-ink text-white ring-4 ring-ink/10" : done ? "bg-ink text-white" : "bg-sand text-ink/35"}`}>
              <Icon size={15} strokeWidth={1.6} />
            </span>
            <span className={`mt-2 text-[10px] uppercase leading-tight tracking-[0.1em] md:text-[11px] ${done ? "text-ink" : "text-muted"}`}>{ORDER_STATUSES[s].customer}</span>
            {at && <span className="mt-0.5 text-[10px] text-muted">{day(at)}</span>}
          </li>
        );
      })}
    </ol>
  );
}

function OrderCard({ order, onReturn }: { order: AccountOrder; onReturn: (o: AccountOrder) => void }) {
  const { getProduct } = useCatalog();
  const { addToCart } = useStore();
  const delivered = order.status === "delivered";
  const inTransit = order.status === "shipped" || order.status === "out_for_delivery";

  return (
    <article className={`${card} overflow-hidden`}>
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 pb-4 pt-5 md:px-6">
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <p>
            <span className="text-muted">Order</span> <span className="font-medium">{order.id}</span>
          </p>
          <p>
            <span className="text-muted">Placed</span> {date(order.createdAt)}
          </p>
          <p>
            <span className="text-muted">Total</span> <span className="font-medium">{formatPrice(order.total)}</span>
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[order.status]}`}>{ORDER_STATUSES[order.status].customer}</span>
      </header>

      <div className="mx-5 rounded-2xl bg-sand/60 px-3 py-5 md:mx-6 md:px-5">
        {order.status === "cancelled" ? (
          <p className="text-center text-sm text-muted">This order was cancelled. Any payment made is refunded to the original method.</p>
        ) : (
          <>
            <Tracker order={order} />
            <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl bg-white px-4 py-3 text-sm">
              <Truck size={17} strokeWidth={1.5} className="shrink-0" />
              {order.tracking ? (
                <>
                  <span className="min-w-0 flex-1">
                    {delivered ? "Delivered by" : "Shipped with"} <b className="font-medium">{order.tracking.courier || "our courier"}</b>
                    {order.tracking.number && <span className="text-muted"> · AWB {order.tracking.number}</span>}
                  </span>
                  {order.tracking.url && (
                    <a href={order.tracking.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-white transition-opacity hover:opacity-85">
                      Track Parcel <ArrowUpRight size={13} />
                    </a>
                  )}
                </>
              ) : (
                <span className="flex-1 text-muted">{inTransit || delivered ? "On its way with our courier." : "We dispatch within 24 hours. The courier tracking link appears here as soon as it ships."}</span>
              )}
            </div>
          </>
        )}
      </div>

      <ul className="divide-y divide-line px-5 md:px-6">
        {order.lines.map((l) => {
          const product = getProduct(l.slug);
          return (
            <li key={`${l.slug}|${l.size}`} className="flex items-center gap-4 py-4">
              <Link href={`/product/${l.slug}`} className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-sand">
                {l.image && <Image src={l.image} alt="" fill sizes="64px" className="object-cover" />}
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/product/${l.slug}`} className="text-sm font-medium hover:underline">
                  {l.name}
                </Link>
                <p className="text-xs text-muted">
                  Qty {l.qty}
                  {l.size && ` · ${product?.sizes?.label ?? "Size"} ${l.size}`}
                </p>
              </div>
              <p className="hidden text-sm sm:block">{formatPrice(l.price * l.qty)}</p>
              {delivered && product && !product.soldOut && (
                <button onClick={() => addToCart({ slug: l.slug, size: l.size ?? undefined })} className="shrink-0 rounded-full border border-ink px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] hover:bg-ink hover:text-white">
                  Buy Again
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <footer className="flex flex-wrap items-center gap-2 border-t border-line px-5 py-4 md:px-6">
        <Link href={orderLink(order)} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-ink px-4 text-[11px] font-medium uppercase tracking-[0.12em] transition-colors hover:bg-ink hover:text-white">
          Order Details <ChevronRight size={13} />
        </Link>
        {canReturn(order) && (
          <button type="button" onClick={() => onReturn(order)} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-4 text-[11px] font-medium uppercase tracking-[0.12em] transition-colors hover:border-ink">
            <RotateCcw size={13} strokeWidth={1.6} /> Return / Exchange
          </button>
        )}
        <a
          href={whatsappLink(`Hi TATTV! A question about my order ${order.id}`)}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted underline-offset-4 hover:text-ink hover:underline"
        >
          <WhatsAppIcon size={14} /> Help with this order
        </a>
      </footer>
    </article>
  );
}

function Orders({ orders, onReturn }: { orders: AccountOrder[] | null; onReturn: (o: AccountOrder) => void }) {
  return (
    <section>
      <SectionTitle>Order History</SectionTitle>
      {orders === null ? (
        <div className={`${card} h-64 animate-pulse`} />
      ) : orders.length === 0 ? (
        <NoOrders />
      ) : (
        <div className="space-y-5">
          {orders.map((o) => (
            <OrderCard key={o.id} order={o} onReturn={onReturn} />
          ))}
        </div>
      )}
    </section>
  );
}

/** Return or exchange, in a pop-up over the orders. */
function ReturnModal({ order, email, onClose }: { order: AccountOrder; email: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 p-0 backdrop-blur-[2px] md:items-center md:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="return-title"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92svh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-6 shadow-lift md:rounded-3xl md:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow text-muted">Order {order.id}</p>
            <h2 id="return-title" className="display mt-2 text-2xl font-normal">
              Return or exchange
            </h2>
            <p className="mt-2 text-sm text-muted">Unworn pieces, within {RETURN_WINDOW_DAYS} days of delivery. We arrange a free pickup.</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="flex size-10 shrink-0 items-center justify-center rounded-full border border-line transition-colors hover:border-ink">
            <X size={17} />
          </button>
        </div>
        <div className="mt-6">
          <ReturnsForm order={order.id} items={order.lines.map((l) => l.name + (l.size ? ` (${l.size})` : "")).join(", ")} email={email} onDone={onClose} />
        </div>
      </div>
    </div>
  );
}

function Support() {
  const channels = [
    { icon: Mail, title: "Email", value: CONTACT.email, href: `mailto:${CONTACT.email}`, note: "We reply within 24 hours" },
    { icon: WhatsAppIcon, title: "WhatsApp", value: CONTACT.phoneDisplay, href: WHATSAPP_HELLO, note: "Message us anytime", external: true },
    { icon: Phone, title: "Phone", value: CONTACT.phoneDisplay, href: `tel:${CONTACT.phone}`, note: CONTACT.hours },
  ];
  return (
    <section className="space-y-5">
      <SectionTitle>Contact &amp; Support</SectionTitle>
      <div className="grid gap-3 md:grid-cols-3">
        {channels.map(({ icon: Icon, title, value, href, note, external }) => (
          <a key={title} href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className={`${card} group p-5 transition-shadow hover:shadow-lift`}>
            <span className="flex size-11 items-center justify-center rounded-2xl bg-sand">
              <Icon size={18} strokeWidth={1.5} />
            </span>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em]">{title}</p>
            <p className="mt-1 truncate text-sm text-ink/85 group-hover:underline">{value}</p>
            <p className="mt-0.5 text-xs text-muted">{note}</p>
          </a>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className={`${card} flex gap-4 p-5`}>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sand">
            <RotateCcw size={18} strokeWidth={1.5} />
          </span>
          <div className="text-sm">
            <p className="font-medium">Returns &amp; exchanges</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">
              Open Orders and press <b className="font-medium text-ink">Return / Exchange</b> on a delivered order, within {RETURN_WINDOW_DAYS} days of delivery. We arrange a free pickup.
            </p>
          </div>
        </div>
        <div className={`${card} flex gap-4 p-5`}>
          <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sand">
            <Clock size={18} strokeWidth={1.5} />
          </span>
          <div className="text-sm">
            <p className="font-medium">Support hours</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{CONTACT.hours}. Messages sent outside these hours are answered the next working day.</p>
          </div>
        </div>
      </div>

      <div className={`${card} p-6 md:p-8`}>
        <h3 className="display text-2xl font-normal">Send us a message</h3>
        <p className="mb-6 mt-2 text-sm text-muted">Questions about a piece, an order or a gift? Write to us here.</p>
        <ContactForm />
      </div>
    </section>
  );
}

function Addresses() {
  const [note, setNote] = useState<string | null>(null);
  const demoOnly = () => setNote("Saving changes is available once accounts go live.");
  return (
    <section>
      <SectionTitle
        action={
          <button onClick={demoOnly} className="btn btn-outline h-9 px-4">
            Add Address
          </button>
        }
      >
        Saved Addresses
      </SectionTitle>
      {note && <p className="mb-4 rounded-2xl bg-white px-4 py-2 text-sm text-muted shadow-soft">{note}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {DEMO_ADDRESSES.map((a) => (
          <div key={a.id} className={`${card} p-6 ${a.isDefault ? "ring-1 ring-ink" : ""}`}>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">{a.label}</p>
              {a.isDefault && <span className="rounded-full bg-ink px-2.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-white">Default</span>}
            </div>
            <p className="mt-3 font-medium">{a.name}</p>
            {a.lines.map((l) => (
              <p key={l} className="text-sm text-muted">
                {l}
              </p>
            ))}
            <p className="mt-1 text-sm text-muted">{a.phone}</p>
            <div className="mt-4 flex gap-4 text-xs">
              <button onClick={demoOnly} className="underline underline-offset-4">
                Edit
              </button>
              {!a.isDefault && (
                <button onClick={demoOnly} className="underline underline-offset-4">
                  Set as default
                </button>
              )}
              <button onClick={demoOnly} className="text-muted underline underline-offset-4">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Wishlist() {
  const { wishlist, catalog } = useStore();
  const items = catalog.products.filter((p) => wishlist.includes(p.slug));
  return (
    <section>
      <SectionTitle>Wishlist</SectionTitle>
      {items.length === 0 ? (
        <div className={`${card} px-6 py-14 text-center`}>
          <Heart size={28} strokeWidth={1.2} className="mx-auto" />
          <p className="mt-4 text-sm text-muted">Nothing saved yet. Tap the heart on any piece to keep it here.</p>
          <Link href="/shop" className="btn btn-dark mt-6">
            Explore the Collection
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
          {items.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}

function Details({ account }: { account: Account }) {
  const [note, setNote] = useState<string | null>(null);
  return (
    <section className={`${card} max-w-2xl p-6 md:p-8`}>
      <SectionTitle>Account Details</SectionTitle>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setNote("Saving changes is available once accounts go live.");
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1.5 block text-muted">First name</span>
            <input defaultValue={account.firstName} className="field" />
          </label>
          <label className="text-sm">
            <span className="mb-1.5 block text-muted">Last name</span>
            <input defaultValue={account.lastName} className="field" />
          </label>
        </div>
        <label className="block text-sm">
          <span className="mb-1.5 block text-muted">Email</span>
          <input type="email" defaultValue={account.email} className="field" />
        </label>
        <label className="block text-sm">
          <span className="mb-1.5 block text-muted">Mobile</span>
          <input type="tel" defaultValue={account.phone} className="field" />
        </label>

        <p className="pt-4 text-[11px] font-semibold uppercase tracking-[0.16em]">Change Password</p>
        <input type="password" placeholder="Current password" aria-label="Current password" className="field" />
        <input type="password" placeholder="New password" aria-label="New password" className="field" />

        <button type="submit" className="btn btn-dark">
          Save Changes
        </button>
        {note && (
          <p role="status" className="text-sm text-muted">
            {note}
          </p>
        )}
      </form>
    </section>
  );
}
