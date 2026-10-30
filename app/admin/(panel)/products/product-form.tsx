"use client";

import Link from "next/link";
import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { COLLECTIONS, MATERIALS, type Category, type Product } from "@/lib/products";
import { shrinkImage } from "@/lib/shrink-image";
import { deleteProductAction, saveProductAction } from "../../actions";
import { defaultCare } from "@/lib/product-copy";

let nextKey = 0;
type Photo = { key: number; url?: string; file?: File; preview?: string };

const SIZE_PRESETS: { label: string; name: string; values: string }[] = [
  { label: "Chain lengths", name: "Length", values: '18", 20", 22", 24"' },
  { label: "Ring sizes", name: "Ring Size", values: "8, 10, 12, 14, 16, 18, 20, 22, 24" },
  { label: "Wrist sizes", name: "Wrist Size", values: 'S · 7", M · 7.5", L · 8", XL · 8.5"' },
];

export function ProductForm({
  product,
  cost,
  categories,
  standardShipping,
  savedNotice,
  returnTo,
}: {
  product?: Product;
  /** Cost price (admin only, kept apart from the product). */
  cost?: number | null;
  categories: Category[];
  /** The standard Shipping & Returns points (they quote the shipping rule in Site Settings). */
  standardShipping: string[];
  savedNotice?: boolean;
  returnTo?: string;
}) {
  const isNew = !product;
  const p: Partial<Product> = product ?? { collection: "classic", finish: "silver", details: [], images: [], active: true };
  const [state, formAction, pending] = useActionState(saveProductAction, savedNotice ? { ok: "Saved. Changes are live on the store." } : null);
  const [photos, setPhotos] = useState<Photo[]>(() => (p.images ?? []).map((url) => ({ key: nextKey++, url })));
  const [preparing, setPreparing] = useState(false);
  const [sizeLabel, setSizeLabel] = useState(p.sizes?.label ?? "");
  const [sizeValues, setSizeValues] = useState(p.sizes?.values.join(", ") ?? "");
  const [price, setPrice] = useState(p.price ? String(p.price) : "");
  const [costPrice, setCostPrice] = useState(cost != null ? String(cost) : "");
  const margin = Number(price) > 0 && costPrice !== "" ? Number(price) - Number(costPrice) : null;
  // The video kept (its URL, "" for none) and a preview of a newly chosen file.
  const [video, setVideo] = useState(p.video ?? "");
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  // After a save, show the stored video (so a new upload isn't sent twice).
  useEffect(() => {
    setVideo(product?.video ?? "");
    setVideoPreview(null);
    if (videoInput.current) videoInput.current.value = "";
  }, [product?.video]);
  const formRef = useRef<HTMLFormElement>(null);

  // After a save the page re-renders with the stored product: show its saved photos (so new uploads aren't sent twice).
  const imagesKey = product?.images.join("|");
  useEffect(() => {
    if (product) setPhotos(product.images.map((url) => ({ key: nextKey++, url })));
  }, [imagesKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const addFiles = async (files: File[]) => {
    setPreparing(true);
    const added: Photo[] = [];
    for (const f of files) {
      const file = await shrinkImage(f);
      added.push({ key: nextKey++, file, preview: URL.createObjectURL(file) });
    }
    setPhotos((list) => [...list, ...added]);
    setPreparing(false);
  };

  const move = (i: number, to: number) =>
    setPhotos((list) => {
      const next = [...list];
      const [item] = next.splice(i, 1);
      next.splice(Math.max(0, Math.min(next.length, to)), 0, item);
      return next;
    });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(formRef.current!);
    fd.delete("photoPicker");
    let n = 0;
    const order = photos.map((img) => {
      if (img.url) return img.url;
      fd.append("newImages", img.file!);
      return `new:${n++}`;
    });
    fd.set("imageOrder", JSON.stringify(order));
    startTransition(() => formAction(fd));
  };

  const busy = pending || preparing;

  return (
    <>
      <form ref={formRef} onSubmit={submit} className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
        <input type="hidden" name="create" value={isNew ? "1" : "0"} />
        <input type="hidden" name="slug" value={product?.slug ?? ""} />
        {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}

        <div className="space-y-6">
          <section className="adm-card grid gap-4 sm:grid-cols-2">
            <h2 className="adm-h2 sm:col-span-2 !mb-0">Details</h2>
            <div className="sm:col-span-2">
              <label htmlFor="f-name" className="adm-label">
                Product name *
              </label>
              <input id="f-name" name="name" defaultValue={p.name} required maxLength={120} placeholder="e.g. Onyx Signet Ring" className="adm-input" />
            </div>
            <div>
              <label htmlFor="f-price" className="adm-label">
                Price (₹) *
              </label>
              <input id="f-price" name="price" type="number" min="1" step="1" value={price} onChange={(e) => setPrice(e.target.value)} required className="adm-input" />
            </div>
            <div>
              <label htmlFor="f-compare" className="adm-label">
                Original price (₹)
              </label>
              <input id="f-compare" name="compareAt" type="number" min="1" step="1" defaultValue={p.compareAt ?? ""} placeholder="Shows crossed out" className="adm-input" />
            </div>
            <div>
              <label htmlFor="f-cost" className="adm-label">
                Cost price (₹)
              </label>
              <input id="f-cost" name="costPrice" type="number" min="0" step="1" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} placeholder="What one costs TATTV" className="adm-input" />
              <p className="mt-1 text-xs text-muted">Only the admin sees this. Used for profit on the dashboard.</p>
            </div>
            <div className="self-start rounded-2xl bg-sand/60 px-4 py-3 text-sm sm:mt-6">
              {margin == null ? (
                <span className="text-muted">Add the cost price to see the profit on each sale.</span>
              ) : (
                <>
                  Profit per piece{" "}
                  <b className={`font-semibold ${margin < 0 ? "text-red-700" : ""}`}>₹{margin.toLocaleString("en-IN")}</b>
                  <span className="text-muted"> · {Math.round((margin / Number(price)) * 100)}% margin</span>
                </>
              )}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="f-short" className="adm-label">
                One-line summary
              </label>
              <input id="f-short" name="short" defaultValue={p.short} maxLength={300} placeholder="A square steel signet set with black onyx." className="adm-input" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="f-desc" className="adm-label">
                Description
              </label>
              <textarea id="f-desc" name="description" rows={4} defaultValue={p.description} className="adm-input" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="f-details" className="adm-label">
                Details (one per line)
              </label>
              <textarea id="f-details" name="details" rows={4} defaultValue={p.details?.join("\n")} placeholder={"Face: 13 × 13mm\nStainless steel, natural onyx"} className="adm-input" />
              <p className="mt-1 text-xs text-muted">Shown as bullet points; a line with a measurement (e.g. “Width: 8mm”) also fills the Dimensions row.</p>
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="f-care" className="adm-label">
                Care (one per line)
              </label>
              <textarea id="f-care" name="care" rows={3} defaultValue={(p.care ?? defaultCare(p.finish)).join("\n")} className="adm-input" />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="f-ship" className="adm-label">
                Shipping &amp; Returns (one per line)
              </label>
              <textarea id="f-ship" name="shippingReturns" rows={4} defaultValue={(p.shippingReturns ?? standardShipping).join("\n")} className="adm-input" />
              <p className="mt-1 text-xs text-muted">Both start with the store&apos;s standard text. Edit them for this piece if needed; left unchanged, they follow the standard.</p>
            </div>
          </section>

          <section className="adm-card">
            <h2 className="adm-h2">Photos</h2>
            <p className="mb-4 text-xs text-muted">Add as many photos as you like: choose several at once, or press + Add Photos again. The first is the main one in the shop and the second shows on hover; use the arrows to reorder.</p>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {photos.map((img, i) => (
                <li key={img.key} className={`relative overflow-hidden rounded-2xl border bg-sand ${i === 0 ? "border-ink" : "border-line"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- previews of local files */}
                  <img src={img.url || img.preview} alt={`Photo ${i + 1}`} className="aspect-square w-full object-cover" />
                  {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-ink px-2 py-0.5 text-[9px] uppercase tracking-[0.14em] text-white">Main</span>}
                  {!img.url && <span className="absolute right-2 top-2 rounded-full bg-white px-2 py-0.5 text-[9px] uppercase tracking-[0.14em]">New</span>}
                  <div className="flex border-t border-line bg-white text-sm">
                    <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move left" className="flex-1 py-1.5 hover:bg-sand disabled:opacity-30">
                      ←
                    </button>
                    {i !== 0 && (
                      <button type="button" onClick={() => move(i, 0)} aria-label="Make main photo" className="flex-1 py-1.5 hover:bg-sand">
                        ★
                      </button>
                    )}
                    <button type="button" onClick={() => move(i, i + 1)} disabled={i === photos.length - 1} aria-label="Move right" className="flex-1 py-1.5 hover:bg-sand disabled:opacity-30">
                      →
                    </button>
                    <button type="button" onClick={() => setPhotos((l) => l.filter((_, k) => k !== i))} aria-label="Remove photo" className="flex-1 py-1.5 text-red-700 hover:bg-red-50">
                      ✕
                    </button>
                  </div>
                </li>
              ))}
              <li>
                <label className="flex aspect-square cursor-pointer items-center justify-center rounded-2xl border border-dashed border-ink/30 text-[11px] uppercase tracking-[0.16em] text-muted hover:border-ink hover:text-ink">
                  <input
                    type="file"
                    name="photoPicker"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                      addFiles([...(e.target.files ?? [])]);
                      e.target.value = "";
                    }}
                  />
                  {preparing ? "Preparing…" : "+ Add Photos"}
                </label>
              </li>
            </ul>
          </section>

          <section className="adm-card">
            <h2 className="adm-h2">Video</h2>
            <p className="mb-4 text-xs text-muted">Optional: a short clip of the piece being worn or turned in the hand (MP4, up to 25 MB, 5 to 20 seconds is plenty). It shows in the product&apos;s gallery after the main photo.</p>
            <input type="hidden" name="video" value={video} />
            <div className="flex flex-wrap items-start gap-4">
              {(videoPreview || video) && (
                <div className="relative aspect-[4/5] w-40 overflow-hidden rounded-2xl border border-line bg-ink">
                  <video src={videoPreview || video} muted loop autoPlay playsInline className="size-full object-cover" />
                  {videoPreview && <span className="absolute right-2 top-2 rounded-full bg-white px-2 py-0.5 text-[9px] uppercase tracking-[0.14em]">New</span>}
                </div>
              )}
              <div className="space-y-2">
                <label className="inline-flex cursor-pointer items-center rounded-full border border-dashed border-ink/30 px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-muted hover:border-ink hover:text-ink">
                  <input
                    ref={videoInput}
                    type="file"
                    name="videoFile"
                    accept="video/mp4,video/webm,video/quicktime"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      setVideoPreview((old) => {
                        if (old) URL.revokeObjectURL(old);
                        return f ? URL.createObjectURL(f) : null;
                      });
                    }}
                  />
                  {video || videoPreview ? "Replace Video" : "+ Add Video"}
                </label>
                {(video || videoPreview) && (
                  <button
                    type="button"
                    onClick={() => {
                      setVideo("");
                      setVideoPreview(null);
                      if (videoInput.current) videoInput.current.value = "";
                    }}
                    className="block text-xs text-red-700 underline underline-offset-2"
                  >
                    Remove video
                  </button>
                )}
              </div>
            </div>
          </section>

          <section className="adm-card grid gap-4 sm:grid-cols-2">
            <h2 className="adm-h2 sm:col-span-2 !mb-0">Sizes</h2>
            <p className="-mt-2 text-xs text-muted sm:col-span-2">Leave both empty if the piece has no sizes (e.g. wallets, studs). Customers must pick one before adding to the bag.</p>
            <div>
              <label htmlFor="f-sizelabel" className="adm-label">
                Option name
              </label>
              <input id="f-sizelabel" name="sizeLabel" value={sizeLabel} onChange={(e) => setSizeLabel(e.target.value)} placeholder="Ring Size" className="adm-input" />
            </div>
            <div>
              <label htmlFor="f-sizevalues" className="adm-label">
                Values (comma separated)
              </label>
              <input id="f-sizevalues" name="sizeValues" value={sizeValues} onChange={(e) => setSizeValues(e.target.value)} placeholder="8, 10, 12" className="adm-input" />
            </div>
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              {SIZE_PRESETS.map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => {
                    setSizeLabel(s.name);
                    setSizeValues(s.values);
                  }}
                  className="rounded-full border border-line px-3 py-1 text-xs transition-colors hover:border-ink"
                >
                  {s.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setSizeLabel("");
                  setSizeValues("");
                }}
                className="px-2.5 py-1 text-xs text-muted underline underline-offset-2 hover:text-ink"
              >
                No sizes
              </button>
            </div>
          </section>
        </div>

        <div className="space-y-6 lg:sticky lg:top-24">
          <section className="adm-card space-y-4">
            <h2 className="adm-h2 !mb-0">Status &amp; stock</h2>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="active" defaultChecked={p.active !== false} className="size-4 accent-ink" /> Show in the store
            </label>
            <div>
              <label htmlFor="f-stock" className="adm-label">
                Stock
              </label>
              <input id="f-stock" name="stock" type="number" min="0" defaultValue={p.stock ?? ""} placeholder="Empty = always available" className="adm-input" />
              <p className="mt-1 text-xs text-muted">Goes down when an order is confirmed; at 0 the piece shows as sold out.</p>
            </div>
          </section>

          <section className="adm-card space-y-4">
            <h2 className="adm-h2 !mb-0">Organise</h2>
            <div>
              <label htmlFor="f-cat" className="adm-label">
                Category *
              </label>
              <select id="f-cat" name="category" defaultValue={p.category ?? categories[0]?.id} required className="adm-input">
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <Link href="/admin/categories/new" className="mt-1 inline-block text-xs text-muted underline underline-offset-2 hover:text-ink">
                + New category
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="f-col" className="adm-label">
                  Collection
                </label>
                <select id="f-col" name="collection" defaultValue={p.collection} className="adm-input">
                  {COLLECTIONS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="f-finish" className="adm-label">
                  Finish
                </label>
                <select id="f-finish" name="finish" defaultValue={p.finish} className="adm-input">
                  {MATERIALS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="f-material" className="adm-label">
                Material
              </label>
              <input id="f-material" name="material" defaultValue={p.material} placeholder="Stainless Steel & Onyx" className="adm-input" />
            </div>
            <div>
              <label htmlFor="f-badge" className="adm-label">
                Badge on the photo
              </label>
              <select id="f-badge" name="badge" defaultValue={p.badge ?? ""} className="adm-input">
                <option value="">None</option>
                <option>New</option>
                <option>Bestseller</option>
                <option>Limited Edition</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isNew" defaultChecked={!!p.isNew} className="size-4 accent-ink" /> In New Arrivals
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="bestseller" defaultChecked={!!p.bestseller} className="size-4 accent-ink" /> In Bestsellers
            </label>
          </section>

          <div className="adm-card space-y-3">
            {state?.error && (
              <p role="alert" className="adm-error">
                {state.error}
              </p>
            )}
            {state?.ok && (
              <p role="status" className="adm-ok">
                {state.ok}
              </p>
            )}
            <button className="btn btn-dark w-full" disabled={busy}>
              {pending ? "Saving…" : isNew ? "Add Product" : "Save Changes"}
            </button>
            {!isNew && (
              <a href={`/product/${product.slug}`} target="_blank" rel="noopener noreferrer" className="block text-center text-xs uppercase tracking-[0.16em] text-muted underline underline-offset-4 hover:text-ink">
                View in store ↗
              </a>
            )}
          </div>
        </div>
      </form>

      {!isNew && (
        <form
          action={deleteProductAction}
          onSubmit={(e) => {
            if (!confirm(`Delete “${product.name}”? This can't be undone. Past orders keep their details.`)) e.preventDefault();
          }}
          className="adm-card flex flex-wrap items-center justify-between gap-4 border-red-200"
        >
          <input type="hidden" name="slug" value={product.slug} />
          {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
          <div>
            <b className="text-sm font-medium">Delete this product</b>
            <p className="text-xs text-muted">Tip: untick “Show in the store” to hide it instead.</p>
          </div>
          <button className="btn btn-sm border border-red-700 text-red-700 hover:bg-red-700 hover:text-white">Delete Product</button>
        </form>
      )}
    </>
  );
}
