import Image from "next/image";

/** 2×2 grid of photos, used where one large photo would be too low-resolution. */
export function PhotoMosaic({ images, className = "" }: { images: string[]; className?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-px ${className}`}>
      {images.map((src) => (
        <div key={src} className="relative aspect-square overflow-hidden">
          <Image src={src} alt="" fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover transition-transform duration-[1.5s] group-hover:scale-105" />
        </div>
      ))}
    </div>
  );
}
