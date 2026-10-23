import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <Image src="/brand/mark-black.png" alt="" width={253} height={294} className="h-auto w-12" />
      <h1 className="display mt-8 text-5xl">Page not found</h1>
      <p className="mt-3 text-muted">The page you&apos;re looking for has moved or no longer exists.</p>
      <Link href="/shop" className="btn btn-dark mt-10">
        Continue Shopping
      </Link>
    </div>
  );
}
