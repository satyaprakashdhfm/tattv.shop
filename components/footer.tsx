import Image from "next/image";
import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { CONTACT } from "@/lib/site";
import { InstagramIcon, WhatsAppIcon, YouTubeIcon } from "./social-icons";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { label: "Earrings", href: "/shop?category=earrings" },
      { label: "Chains", href: "/shop?category=chains" },
      { label: "Rings", href: "/shop?category=rings" },
      { label: "Bracelets", href: "/shop?category=bracelets" },
      { label: "Daily Objects", href: "/shop?category=wallets" },
    ],
  },
  {
    title: "Client Care",
    links: [
      { label: "Shipping", href: "/help#shipping" },
      { label: "Returns & Exchanges", href: "/returns" },
      { label: "Size Guide", href: "/help#size-guide" },
      { label: "Jewellery Care", href: "/help#care" },
      { label: "Contact Us", href: "/contact" },
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
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-white/60">Modern and classic jewellery for men, made to be worn every day.</p>
          <ul className="mt-6 flex items-center gap-3">
            {SOCIAL.map(({ label, href, icon: Icon, external }) => (
              <li key={label}>
                <a
                  href={href}
                  aria-label={label}
                  title={label}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/70 transition-colors hover:border-white hover:text-white"
                >
                  <Icon size={17} strokeWidth={1.5} />
                </a>
              </li>
            ))}
          </ul>
          <ul className="mt-6 space-y-2.5 text-sm text-white/80">
            <li>
              <a href={`tel:${CONTACT.phone}`} className="inline-flex items-center gap-3 hover:text-white">
                <Phone size={15} strokeWidth={1.5} className="text-white/50" />
                <span className="link-underline">{CONTACT.phoneDisplay}</span>
              </a>
            </li>
            <li>
              <a href={`mailto:${CONTACT.email}`} className="inline-flex items-center gap-3 hover:text-white">
                <Mail size={15} strokeWidth={1.5} className="text-white/50" />
                <span className="link-underline break-all">{CONTACT.email}</span>
              </a>
            </li>
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-10 md:grid-cols-3 lg:col-span-8 lg:col-start-5">
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
        <div className="container-x flex flex-col gap-2 py-6 text-xs text-white/50 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} TATTV. All rights reserved.</p>
          <p className="tracking-[0.14em] uppercase">Energize Your Style Element</p>
        </div>
      </div>
    </footer>
  );
}
