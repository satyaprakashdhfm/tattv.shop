import Image from "next/image";
import Link from "next/link";
import { Phone } from "lucide-react";
import { CONTACT } from "@/lib/site";
import { NewsletterForm } from "./newsletter-form";
import { InstagramIcon, WhatsAppIcon, YouTubeIcon } from "./social-icons";

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
      { label: "My Account", href: "/account" },
      { label: "Wishlist", href: "/wishlist" },
    ],
  },
];

const SOCIAL = [
  { label: "Instagram", href: CONTACT.instagram, icon: InstagramIcon, external: true },
  { label: "WhatsApp", href: `https://wa.me/${CONTACT.whatsapp}`, icon: WhatsAppIcon, external: true },
  { label: "Call us", href: `tel:${CONTACT.phone}`, icon: Phone, external: false },
  { label: "YouTube", href: CONTACT.youtube, icon: YouTubeIcon, external: true },
];

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
          <ul className="flex items-center gap-3">
            {SOCIAL.map(({ label, href, icon: Icon, external }) => (
              <li key={label}>
                <a
                  href={href}
                  aria-label={label}
                  title={label}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/70 transition-colors hover:border-white hover:text-white"
                >
                  <Icon size={18} strokeWidth={1.5} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
