import Image from "next/image";
import { CONTACT } from "@/lib/site";
import { InstagramIcon } from "./social-icons";

/** Photos for the strip; real Instagram posts can replace these. */
const PHOTOS = [
  "/images/products/preview/onyx-stud-earrings.jpg",
  "/images/categories/chains.jpg",
  "/images/products/mesh-inlay-bangle.jpg",
  "/images/trends/trend-2.jpg",
  "/images/products/preview/octagon-onyx-studs.jpg",
  "/images/categories/rings.jpg",
  "/images/products/preview/gold-cable-bangle.jpg",
  "/images/categories/wallets.jpg",
  "/images/products/preview/hammered-disc-studs.jpg",
  "/images/trends/trend-1.jpg",
  "/images/products/twin-cable-bangle.jpg",
  "/images/products/preview/onyx-signet-ring.jpg",
];

/**
 * "Follow us on Instagram": a strip that drifts continuously (the list is rendered twice and the
 * track slides by half its width, so it loops seamlessly). Hovering pauses it; for reduced-motion
 * visitors it stands still and scrolls by hand instead.
 */
export function InstagramMarquee() {
  return (
    <section className="py-14 md:py-20">
      <div className="container-x mb-8 text-center md:mb-10">
        <h2 className="title text-lg md:text-xl">Follow Us on Instagram</h2>
        <a
          href={CONTACT.instagram}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink"
        >
          <InstagramIcon size={15} strokeWidth={1.5} /> {CONTACT.instagramHandle}
        </a>
      </div>

      <div className="group overflow-hidden motion-reduce:overflow-x-auto">
        <ul className="flex w-max animate-[marquee_45s_linear_infinite] gap-3 group-hover:[animation-play-state:paused] motion-reduce:animate-none md:gap-4">
          {[...PHOTOS, ...PHOTOS].map((src, i) => (
            <li key={i} aria-hidden={i >= PHOTOS.length || undefined}>
              <a
                href={CONTACT.instagram}
                target="_blank"
                rel="noopener noreferrer"
                tabIndex={i >= PHOTOS.length ? -1 : undefined}
                aria-label={`TATTV on Instagram, photo ${(i % PHOTOS.length) + 1}`}
                className="group/tile relative block size-52 overflow-hidden bg-sand md:size-64"
              >
                <Image src={src} alt="" fill sizes="256px" className="object-cover transition-transform duration-700 group-hover/tile:scale-105" />
                <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition duration-300 group-hover/tile:bg-black/35 group-hover/tile:opacity-100">
                  <InstagramIcon size={26} strokeWidth={1.5} />
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
