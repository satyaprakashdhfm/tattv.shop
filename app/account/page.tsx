"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronRight, Headphones, Heart, LayoutGrid, LogOut, MapPin, Package, RotateCcw, Truck, User } from "lucide-react";
import { useStore } from "@/components/store-provider";
import { ProductCard } from "@/components/product-card";
import { ProductImage } from "@/components/product-image";
import { PRODUCTS, getProduct } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { DEMO_ADDRESSES, DEMO_CREDENTIALS, DEMO_ORDERS, type Account, type Order, type OrderStatus } from "@/lib/demo-account";

const SECTIONS = [
  { id: "overview", label: "Overview", icon: LayoutGrid },
  { id: "orders", label: "Orders", icon: Package },
  { id: "addresses", label: "Addresses", icon: MapPin },
  { id: "wishlist", label: "Wishlist", icon: Heart },
  { id: "details", label: "Account Details", icon: User },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const HELP_LINKS = [
  { href: "/returns", icon: RotateCcw, title: "Returns & Exchanges", text: "Start a return or exchange" },
  { href: "/contact", icon: Headphones, title: "Contact Support", text: "Email, WhatsApp or call us" },
];

const orderTotal = (order: Order) =>
  order.items.reduce((sum, i) => sum + (getProduct(i.slug)?.price ?? 0) * i.qty, 0) + order.shipping;

const STATUS_STYLE: Record<OrderStatus, string> = {
  Processing: "bg-amber-100 text-amber-800",
  Shipped: "bg-sky-100 text-sky-800",
  Delivered: "bg-emerald-100 text-emerald-800",
  Returned: "bg-sand-dark text-ink/70",
};

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

        <div className="mt-8 border border-dashed border-ink/25 bg-sand px-5 py-4 text-sm">
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

        <div className="mt-8 grid grid-cols-2 border-b border-line">
          {(["signin", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setMessage(null);
              }}
              className={`eyebrow -mb-px border-b pb-3 ${mode === m ? "border-ink" : "border-transparent text-muted"}`}
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

  return (
    <div className="container-x py-10 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="eyebrow text-muted">My Account</p>
          <h1 className="display mt-2 text-3xl font-normal md:text-4xl">Welcome back, {account.firstName}</h1>
        </div>
        <p className="text-sm text-muted">Member since {account.memberSince}</p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[240px_1fr] lg:gap-12">
        <nav aria-label="Account" className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:flex-col lg:gap-1 lg:px-0">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              aria-current={section === id ? "page" : undefined}
              className={`flex shrink-0 items-center gap-3 px-4 py-2.5 text-sm transition-colors lg:py-3 ${
                section === id ? "bg-ink text-white" : "bg-white text-ink/80 hover:bg-sand lg:bg-transparent"
              }`}
            >
              <Icon size={16} strokeWidth={1.5} /> {label}
            </button>
          ))}
          <p className="mt-5 hidden px-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted lg:block">Help</p>
          {HELP_LINKS.map(({ href, icon: Icon, title }) => (
            <Link key={href} href={href} className="flex shrink-0 items-center gap-3 bg-white px-4 py-2.5 text-sm text-ink/80 transition-colors hover:bg-sand lg:bg-transparent lg:py-3">
              <Icon size={16} strokeWidth={1.5} /> {title}
            </Link>
          ))}
          <button onClick={signOut} className="flex shrink-0 items-center gap-3 px-4 py-2.5 text-sm text-ink/70 hover:bg-sand lg:mt-4 lg:border-t lg:border-line lg:py-3">
            <LogOut size={16} strokeWidth={1.5} /> Sign Out
          </button>
        </nav>

        <div className="min-w-0">
          {section === "overview" && <Overview account={account} go={setSection} />}
          {section === "orders" && <Orders />}
          {section === "addresses" && <Addresses />}
          {section === "wishlist" && <Wishlist />}
          {section === "details" && <Details account={account} />}
        </div>
      </div>
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

function Overview({ account, go }: { account: Account; go: (s: SectionId) => void }) {
  const { wishlist } = useStore();
  const latest = DEMO_ORDERS[0];
  const stats = [
    { label: "Orders", value: DEMO_ORDERS.length, to: "orders" as const },
    { label: "Wishlist", value: wishlist.length, to: "wishlist" as const },
    { label: "Saved Addresses", value: DEMO_ADDRESSES.length, to: "addresses" as const },
  ];
  const home = DEMO_ADDRESSES.find((a) => a.isDefault) ?? DEMO_ADDRESSES[0];

  return (
    <div className="space-y-10">
      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <button key={s.label} onClick={() => go(s.to)} className="border border-line bg-white p-5 text-left transition-colors hover:border-ink">
            <p className="text-3xl font-medium">{s.value}</p>
            <p className="mt-1 text-sm text-muted">{s.label}</p>
          </button>
        ))}
      </div>

      <section>
        <SectionTitle
          action={
            <button onClick={() => go("orders")} className="text-xs text-muted underline underline-offset-4 hover:text-ink">
              View all orders
            </button>
          }
        >
          Latest Order
        </SectionTitle>
        <OrderCard order={latest} />
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="border border-line bg-white p-6">
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
        <div className="border border-line bg-white p-6">
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

      <section>
        <SectionTitle>Need Help?</SectionTitle>
        <div className="grid gap-3 md:grid-cols-2">
          {HELP_LINKS.map(({ href, icon: Icon, title, text }) => (
            <Link key={href} href={href} className="group flex items-center gap-4 border border-line bg-white p-5 transition-colors hover:border-ink">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sand">
                <Icon size={17} strokeWidth={1.5} />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-medium">{title}</span>
                <span className="block text-xs text-muted">{text}</span>
              </span>
              <ChevronRight size={16} className="text-muted transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function OrderCard({ order }: { order: Order }) {
  const { addToCart } = useStore();
  return (
    <article className="border border-line bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-sand px-5 py-3 text-sm">
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <p>
            <span className="text-muted">Order</span> <span className="font-medium">{order.id}</span>
          </p>
          <p>
            <span className="text-muted">Placed</span> {order.date}
          </p>
          <p>
            <span className="text-muted">Total</span> <span className="font-medium">{formatPrice(orderTotal(order))}</span>
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[order.status]}`}>{order.status}</span>
      </header>
      <ul className="divide-y divide-line">
        {order.items.map((item) => {
          const product = getProduct(item.slug);
          if (!product) return null;
          return (
            <li key={item.slug} className="flex items-center gap-4 px-5 py-4">
              <Link href={`/product/${product.slug}`} className="relative h-16 w-16 shrink-0 overflow-hidden bg-sand">
                <ProductImage product={product} sizes="64px" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/product/${product.slug}`} className="text-sm font-medium hover:underline">
                  {product.name}
                </Link>
                <p className="text-xs text-muted">
                  Qty {item.qty}
                  {item.size && ` · ${product.sizes?.label ?? "Size"} ${item.size}`}
                </p>
              </div>
              <p className="hidden text-sm sm:block">{formatPrice(product.price * item.qty)}</p>
              {order.status === "Delivered" && !product.soldOut && (
                <button onClick={() => addToCart({ slug: product.slug, size: item.size })} className="shrink-0 border border-ink px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.12em] hover:bg-ink hover:text-white">
                  Buy Again
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3 text-xs text-muted">
        <span>Ship to: {order.address}</span>
        {order.status === "Delivered" && (
          <Link
            href={`/returns?order=${order.id}&item=${encodeURIComponent(order.items.map((i) => getProduct(i.slug)?.name ?? i.slug).join(", "))}`}
            className="flex items-center gap-1.5 text-ink underline underline-offset-4"
          >
            <RotateCcw size={13} strokeWidth={1.5} /> Return / Exchange
          </Link>
        )}
        {order.tracking && (
          <span className="flex items-center gap-2 text-ink">
            <Truck size={14} strokeWidth={1.5} /> {order.tracking}
          </span>
        )}
      </footer>
    </article>
  );
}

function Orders() {
  return (
    <section>
      <SectionTitle>Order History</SectionTitle>
      <div className="space-y-5">
        {DEMO_ORDERS.map((o) => (
          <OrderCard key={o.id} order={o} />
        ))}
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
      {note && <p className="mb-4 bg-sand px-4 py-2 text-sm text-muted">{note}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {DEMO_ADDRESSES.map((a) => (
          <div key={a.id} className={`border bg-white p-6 ${a.isDefault ? "border-ink" : "border-line"}`}>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em]">{a.label}</p>
              {a.isDefault && <span className="bg-ink px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-white">Default</span>}
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
  const { wishlist } = useStore();
  const items = PRODUCTS.filter((p) => wishlist.includes(p.slug));
  return (
    <section>
      <SectionTitle>Wishlist</SectionTitle>
      {items.length === 0 ? (
        <div className="border border-dashed border-line bg-white px-6 py-14 text-center">
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
    <section className="max-w-xl">
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
