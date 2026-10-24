import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Full-width campaign banner. From lg up the copy overlays the photo's dark left side;
 * below lg it stacks above the photo so it never covers the jewellery.
 */
export function EditorialBanner({
  image,
  alt,
  eyebrow,
  title,
  cta,
  href,
  ratio = "lg:aspect-[3/1]",
  position = "object-[72%_55%] sm:object-[70%_50%] lg:object-center",
  className = "",
}: {
  image: string;
  alt: string;
  eyebrow: string;
  title: string;
  cta: string;
  href: string;
  /** Desktop aspect ratio class, matched to the photo. */
  ratio?: string;
  /** object-position classes keeping the subject in frame at each size. */
  position?: string;
  className?: string;
}) {
  return (
    <section className={`relative flex flex-col-reverse overflow-hidden bg-[#0d0d0b] text-white lg:block ${ratio} ${className}`}>
      <div className="relative aspect-[3/2] w-full sm:aspect-[2/1] lg:absolute lg:inset-0 lg:aspect-auto">
        <Image src={image} alt={alt} fill sizes="100vw" className={`object-cover ${position}`} />
      </div>
      <div className="container-x relative pb-2 pt-10 lg:absolute lg:inset-0 lg:flex lg:items-center lg:py-0">
        <div className="max-w-md">
          <p className="eyebrow text-white/60">{eyebrow}</p>
          <h2 className="display mt-4 text-3xl font-normal leading-tight md:text-[42px]">{title}</h2>
          <Link href={href} className="mt-7 inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.22em] text-white/90 hover:text-white">
            <span className="underline-reveal">{cta}</span> <ArrowRight size={14} strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </section>
  );
}
