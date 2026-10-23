import Image from "next/image";
import Link from "next/link";
import { NewsletterForm } from "./newsletter-form";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { label: "Chains & Pendants", href: "/shop?category=chains" },
      { label: "Rings", href: "/shop?category=rings" },
      { label: "Bracelets", href: "/shop?category=bracelets" },
      { label: "Wallets", href: "/shop?category=wallets" },
      { label: "Gifts", href: "/shop?tag=gifts" },
    ],
  },
  {
    title: "Client Care",
    links: [
      { label: "Shipping", href: "/help#shipping" },
      { label: "Returns & Exchanges", href: "/help#returns" },
      { label: "Size Guide", href: "/help#size-guide" },
      { label: "Jewellery Care", href: "/help#care" },
      { label: "Contact Us", href: "/help#contact" },
    ],
  },
  {
    title: "TATTV",
    links: [
      { label: "Our Story", href: "/about" },
      { label: "Collections", href: "/collections" },
      { label: "Pancha Tattva", href: "/shop?tag=elements" },
      { label: "My Account", href: "/account" },
      { label: "Wishlist", href: "/wishlist" },
    ],
  },
];

const SOCIAL = ["Instagram", "Facebook", "Pinterest", "YouTube"];

export function Footer() {
  return (
    <footer className="bg-ink text-white">
      <div className="container-x grid gap-12 py-16 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-4">
          <Image src="/brand/logo-white.png" alt="TATTV" width={1147} height={294} className="h-auto w-[180px]" />
          <p className="mt-8 font-serif text-2xl leading-snug">Join the TATTV circle</p>
          <p className="mt-2 max-w-sm text-sm text-white/60">Early access to new collections, private events and stories of craft. No noise.</p>
          <NewsletterForm />
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-7 lg:col-start-6">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="eyebrow mb-5 text-white/50">{col.title}</p>
              <ul className="space-y-3 text-sm">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="link-underline text-white/85 hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-4 py-6 text-xs text-white/50 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} TATTV. Energize Your Style Element.</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {SOCIAL.map((s) => (
              <span key={s} className="uppercase tracking-[0.18em] hover:text-white cursor-pointer">
                {s}
              </span>
            ))}
          </div>
          <p>UPI · Visa · Mastercard · RuPay · Net Banking</p>
        </div>
      </div>
    </footer>
  );
}
