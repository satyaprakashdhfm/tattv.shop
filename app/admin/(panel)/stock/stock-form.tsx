"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState } from "react";
import { quickUpdateAction } from "../../actions";

interface Row {
  slug: string;
  name: string;
  image: string;
  price: number;
  stock: number | null;
  active: boolean;
  sold: number;
}

export function StockForm({ products }: { products: Row[] }) {
  const [state, action, pending] = useActionState(quickUpdateAction, null);
  return (
    <form action={action} className="adm-card overflow-x-auto !p-0">
      <table className="adm-table">
        <thead>
          <tr>
            <th>Product</th>
            <th className="hidden text-right md:table-cell">Sold</th>
            <th className="text-right">Price (₹)</th>
            <th className="text-right">In stock</th>
            <th className="text-right">Show</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.slug}>
              <td>
                <input type="hidden" name="slug" value={p.slug} />
                <Link href={`/admin/products/${p.slug}`} className="group flex items-center gap-3">
                  <span className="relative size-10 shrink-0 overflow-hidden rounded-xl bg-sand">{p.image && <Image src={p.image} alt="" fill sizes="40px" className="object-cover" />}</span>
                  <span>
                    <span className="group-hover:underline">{p.name}</span>
                    {p.stock === 0 ? <b className="block text-xs font-medium text-red-700">Sold out</b> : p.stock != null && p.stock <= 5 ? <b className="block text-xs font-medium text-amber-700">Running low</b> : null}
                  </span>
                </Link>
              </td>
              <td className="hidden text-right md:table-cell">{p.sold}</td>
              <td className="text-right">
                <label className="sr-only" htmlFor={`p-${p.slug}`}>
                  Price for {p.name}
                </label>
                <input id={`p-${p.slug}`} name={`price:${p.slug}`} type="number" min="1" step="1" defaultValue={p.price} required className="adm-input w-24 text-right" />
              </td>
              <td className="text-right">
                <label className="sr-only" htmlFor={`s-${p.slug}`}>
                  Stock for {p.name}
                </label>
                <input id={`s-${p.slug}`} name={`stock:${p.slug}`} type="number" min="0" inputMode="numeric" defaultValue={p.stock ?? ""} placeholder="—" className="adm-input w-20 text-right" />
              </td>
              <td className="text-right">
                <input type="checkbox" name={`active:${p.slug}`} defaultChecked={p.active} aria-label={`Show ${p.name} in the store`} className="size-5 accent-ink" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line p-4">
        {state?.error && (
          <p role="alert" className="adm-error mr-auto">
            {state.error}
          </p>
        )}
        {state?.ok && (
          <p role="status" className="adm-ok mr-auto">
            {state.ok}
          </p>
        )}
        <button className="btn btn-dark btn-sm" disabled={pending}>
          {pending ? "Saving…" : "Save All"}
        </button>
      </div>
    </form>
  );
}
