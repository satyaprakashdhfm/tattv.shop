"use client";

import { useActionState, useEffect, useState } from "react";
import type { AdminReel } from "@/lib/server/reels";
import { addReelAction, deleteReelAction, moveReelAction, updateReelAction } from "../../actions";

type ProductOption = { slug: string; name: string; active: boolean };

function ProductSelect({ id, defaultValue, products }: { id: string; defaultValue?: string | null; products: ProductOption[] }) {
  return (
    <select id={id} name="product" defaultValue={defaultValue ?? ""} className="adm-input">
      <option value="">Not linked (tapping does nothing)</option>
      {products.map((p) => (
        <option key={p.slug} value={p.slug}>
          {p.name}
          {p.active ? "" : " (hidden)"}
        </option>
      ))}
    </select>
  );
}

/** One video: a preview, its caption and linked product, on/off, order and delete. */
export function VideoRow({ reel, n, first, last, products }: { reel: AdminReel; n: number; first: boolean; last: boolean; products: ProductOption[] }) {
  const [state, action, pending] = useActionState(updateReelAction, null);
  const linked = products.find((p) => p.slug === reel.productSlug);
  return (
    <li className="adm-card grid gap-5 md:grid-cols-[150px_1fr_auto]">
      <div className="relative mx-auto aspect-[9/16] w-[150px] overflow-hidden rounded-2xl bg-ink">
        <span className="absolute left-2 top-2 z-10 flex size-6 items-center justify-center rounded-full bg-white text-[11px] font-semibold">{n}</span>
        <video src={reel.video} poster={reel.poster || undefined} muted loop playsInline preload="metadata" controls className="size-full object-cover" />
      </div>
      <form action={action} className="space-y-3">
        <input type="hidden" name="id" value={reel.id} />
        <div>
          <label htmlFor={`cap-${reel.id}`} className="adm-label">
            Caption
          </label>
          <input id={`cap-${reel.id}`} name="caption" defaultValue={reel.caption} maxLength={80} placeholder="The Medusa ring" className="adm-input" />
        </div>
        <div>
          <label htmlFor={`prod-${reel.id}`} className="adm-label">
            Product in this video
          </label>
          <ProductSelect id={`prod-${reel.id}`} defaultValue={reel.productSlug} products={products} />
          <p className="mt-1 text-xs text-muted">
            {linked ? (linked.active ? `Tapping the video opens ${linked.name}.` : `${linked.name} is hidden in the store, so the video shows without a link for now.`) : "Pick the piece shown, so customers can tap through and buy it."}
          </p>
        </div>
        <div>
          <label htmlFor={`poster-${reel.id}`} className="adm-label">
            Change cover photo
          </label>
          <input id={`poster-${reel.id}`} name="poster" type="file" accept="image/*" className="adm-input py-2 text-xs" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={reel.active} className="size-4 accent-ink" /> Show on the home page
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn btn-dark btn-sm" disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </button>
          {state?.error && (
            <span role="alert" className="adm-error">
              {state.error}
            </span>
          )}
          {state?.ok && (
            <span role="status" className="adm-ok">
              {state.ok}
            </span>
          )}
        </div>
      </form>
      <div className="flex items-start justify-between gap-3 md:flex-col md:items-end">
        <form action={moveReelAction} className="flex items-center gap-2">
          <input type="hidden" name="id" value={reel.id} />
          <button name="dir" value="top" disabled={first} aria-label={`Move video ${n} to the top`} className="h-8 rounded-full border border-line bg-white px-3 text-[11px] font-medium uppercase tracking-[0.12em] transition-colors hover:border-ink disabled:opacity-30">
            Top
          </button>
          <span className="adm-order-btns">
            <button name="dir" value="-1" disabled={first} aria-label={`Move video ${n} up`}>
              ↑
            </button>
            <button name="dir" value="1" disabled={last} aria-label={`Move video ${n} down`}>
              ↓
            </button>
          </span>
        </form>
        <form
          action={deleteReelAction}
          onSubmit={(e) => {
            if (!confirm("Delete this video from the home page?")) e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={reel.id} />
          <button className="text-[11px] uppercase tracking-[0.12em] text-red-700 underline underline-offset-2">Delete</button>
        </form>
      </div>
    </li>
  );
}

/** Upload one more video: MP4 up to 25 MB, with a caption and the product it shows. */
export function AddVideoForm({ products }: { products: ProductOption[] }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [state, action, pending] = useActionState(addReelAction, null);
  useEffect(() => {
    if (state?.ok) setPreview(null);
  }, [state]);
  const show = (url: string | null) =>
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return url;
    });

  return (
    <form action={action} className="adm-card grid gap-6 md:grid-cols-[1fr_200px]" key={state?.ok}>
      <div className="space-y-4">
        <div>
          <h2 className="adm-h2 !mb-1">Add a video</h2>
          <p className="text-xs text-muted">Upright (9:16) clips like Instagram reels fit best. Keep them short, 10 to 30 seconds, MP4, up to 25 MB: every visitor who scrolls past downloads it.</p>
        </div>
        <div>
          <label htmlFor="v-file" className="adm-label">
            Video file *
          </label>
          <input
            id="v-file"
            name="video"
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            required
            onChange={(e) => {
              const f = e.target.files?.[0];
              show(f ? URL.createObjectURL(f) : null);
            }}
            className="adm-input py-2 text-xs"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="v-caption" className="adm-label">
              Caption
            </label>
            <input id="v-caption" name="caption" maxLength={80} placeholder="The Medusa ring" className="adm-input" />
          </div>
          <div>
            <label htmlFor="v-product" className="adm-label">
              Product in this video
            </label>
            <ProductSelect id="v-product" products={products} />
          </div>
        </div>
        <div>
          <label htmlFor="v-poster" className="adm-label">
            Cover photo (optional)
          </label>
          <input id="v-poster" name="poster" type="file" accept="image/*" className="adm-input py-2 text-xs" />
          <p className="mt-1 text-xs text-muted">Shown until the video starts. Without one, the first frame is used.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn btn-dark btn-sm" disabled={pending}>
            {pending ? "Uploading… (can take a minute)" : "Add Video"}
          </button>
          {state?.error && (
            <span role="alert" className="adm-error">
              {state.error}
            </span>
          )}
          {state?.ok && (
            <span role="status" className="adm-ok">
              {state.ok}
            </span>
          )}
        </div>
      </div>
      <div className="mx-auto aspect-[9/16] w-[200px] overflow-hidden rounded-2xl bg-sand">
        {preview ? <video src={preview} muted loop autoPlay playsInline className="size-full object-cover" /> : <p className="flex h-full items-center p-4 text-center text-xs text-muted">The new video shows here before you add it.</p>}
      </div>
    </form>
  );
}
