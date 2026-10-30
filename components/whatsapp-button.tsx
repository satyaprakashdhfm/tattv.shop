"use client";

import { usePathname } from "next/navigation";
import { whatsappHello } from "@/lib/site";
import { WhatsAppIcon } from "./social-icons";
import { useCheckoutBarShown } from "./checkout-bar";
import { useFloatingClear } from "./use-floating-clear";
import { useCatalog, useStore } from "./store-provider";

/**
 * Floating WhatsApp chat button, bottom right on every storefront page. On phones it sits above
 * the floating checkout bar and the checkout page's pay bar so the two never overlap.
 */
export function WhatsAppButton() {
  const { cartOpen } = useStore();
  const { settings } = useCatalog();
  const pathname = usePathname();
  const barShown = useCheckoutBarShown();
  const clear = useFloatingClear();
  if (cartOpen) return null;
  // The checkout pay bar shows below lg; the floating checkout bar is narrow enough from md up.
  const offset = pathname.startsWith("/checkout") ? "bottom-24 lg:bottom-7" : barShown ? "bottom-24 md:bottom-7" : "bottom-5 md:bottom-7";

  return (
    <a
      href={whatsappHello(settings.phone)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className={`group fixed right-4 z-30 flex size-14 animate-fade-in items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_12px_30px_-8px_rgba(0,0,0,0.4)] transition-[bottom,transform,opacity] duration-300 hover:scale-105 md:right-6 ${offset} ${clear ? "pointer-events-none translate-y-4 opacity-0" : ""}`}
      aria-hidden={clear || undefined}
      tabIndex={clear ? -1 : undefined}
    >
      <WhatsAppIcon size={28} />
      <span className="pointer-events-none absolute right-full mr-3 hidden whitespace-nowrap rounded-full bg-ink px-3.5 py-2 text-xs text-white opacity-0 shadow-soft transition-opacity duration-300 group-hover:opacity-100 md:block">
        Chat with us
      </span>
    </a>
  );
}
