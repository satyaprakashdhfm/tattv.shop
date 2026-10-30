"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import type { Category } from "@/lib/products";
import { shrinkImage } from "@/lib/shrink-image";
import { deleteCategoryAction, saveCategoryAction } from "../../actions";

export function CategoryForm({ category, productCount = 0, returnTo }: { category?: Category; productCount?: number; returnTo?: string }) {
  const isNew = !category;
  const c: Partial<Category> = category ?? {};
  const [state, formAction, pending] = useActionState(saveCategoryAction, null);
  const [delState, delAction, deleting] = useActionState(deleteCategoryAction, null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  // The second photo: the wide banner on the category's shop page.
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [tone, setTone] = useState<"light" | "dark">(c.bannerTone ?? "light");
  const [align, setAlign] = useState<"left" | "right">(c.bannerAlign ?? "left");
  const formRef = useRef<HTMLFormElement>(null);

  // Once saved, the uploaded image is the category's image; don't send it again.
  useEffect(() => {
    if (state?.ok) {
      setFile(null);
      setPreview(null);
      setBannerFile(null);
      setBannerPreview(null);
    }
  }, [state]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(formRef.current!);
    fd.delete("picker");
    fd.delete("bannerPicker");
    if (file) fd.set("imageFile", file);
    if (bannerFile) fd.set("bannerFile", bannerFile);
    startTransition(() => formAction(fd));
  };

  return (
    <>
      <form ref={formRef} onSubmit={submit} className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
        <input type="hidden" name="create" value={isNew ? "1" : "0"} />
        <input type="hidden" name="id" value={category?.id ?? ""} />
        <input type="hidden" name="image" value={c.image ?? ""} />
        <input type="hidden" name="banner" value={c.banner ?? ""} />
        {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}

        <section className="adm-card space-y-4">
          <h2 className="adm-h2 !mb-0">Details</h2>
          <div>
            <label htmlFor="c-name" className="adm-label">
              Name *
            </label>
            <input id="c-name" name="name" defaultValue={c.name} required maxLength={60} placeholder="Rings" className="adm-input" />
            <p className="mt-1 text-xs text-muted">Used in menus, filters and breadcrumbs.</p>
          </div>
          <div>
            <label htmlFor="c-title" className="adm-label">
              Page title
            </label>
            <input id="c-title" name="title" defaultValue={c.title} maxLength={80} placeholder="Ring Theory" className="adm-input" />
            <p className="mt-1 text-xs text-muted">The editorial name on the category tile and page header. Defaults to the name.</p>
          </div>
          <div>
            <label htmlFor="c-blurb" className="adm-label">
              Short description
            </label>
            <textarea id="c-blurb" name="blurb" rows={2} defaultValue={c.blurb} maxLength={300} className="adm-input" />
          </div>
        </section>

        <div className="space-y-6">
          <section className="adm-card">
            <h2 className="adm-h2">Home page image</h2>
            <p className="mb-4 text-xs text-muted">The &ldquo;window&rdquo;: shown in the arch on the home page&apos;s Shop by Category. Use a tall (portrait) photo.</p>
            {(preview || c.image) && (
              // eslint-disable-next-line @next/next/no-img-element -- previews of local files
              <img src={preview || c.image} alt="" className="mx-auto mb-2 aspect-[3/4] w-40 rounded-t-full rounded-b-2xl object-cover" />
            )}
            <label className="btn btn-outline btn-sm cursor-pointer">
              {c.image || preview ? "Change Image" : "Upload Image"}
              <input
                type="file"
                name="picker"
                accept="image/*"
                className="sr-only"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const small = await shrinkImage(f);
                  setFile(small);
                  setPreview(URL.createObjectURL(small));
                }}
              />
            </label>
            {c.image && !preview && (
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input type="checkbox" name="removeImage" className="size-4 accent-ink" /> Remove image
              </label>
            )}
          </section>

          <section className="adm-card">
            <h2 className="adm-h2">Shop page banner</h2>
            <p className="mb-4 text-xs text-muted">The wide photo across the top of this category&apos;s shop page, behind its title. Use a landscape photo with an empty side for the words.</p>
            {(bannerPreview || c.banner) && (
              <div className={`relative mb-3 aspect-[8/3] overflow-hidden rounded-2xl ${tone === "light" ? "bg-sand text-ink" : "bg-ink text-white"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element -- previews of local files */}
                <img src={bannerPreview || c.banner} alt="" className="absolute inset-0 size-full object-cover" style={{ objectPosition: bannerPreview ? "50% 50%" : c.bannerPosition }} />
                <span className={`absolute top-1/2 -translate-y-1/2 px-4 text-sm font-medium ${align === "right" ? "right-0 text-right" : "left-0"} ${tone === "dark" ? "[text-shadow:0_1px_6px_rgba(0,0,0,0.6)]" : ""}`}>
                  {c.title || c.name || "Title"}
                </span>
              </div>
            )}
            <label className="btn btn-outline btn-sm cursor-pointer">
              {c.banner || bannerPreview ? "Change Banner" : "Upload Banner"}
              <input
                type="file"
                name="bannerPicker"
                accept="image/*"
                className="sr-only"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const small = await shrinkImage(f);
                  setBannerFile(small);
                  setBannerPreview(URL.createObjectURL(small));
                }}
              />
            </label>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="c-tone" className="adm-label">
                  Photo is
                </label>
                <select id="c-tone" name="bannerTone" value={tone} onChange={(e) => setTone(e.target.value as "light" | "dark")} className="adm-input">
                  <option value="light">Light (dark text)</option>
                  <option value="dark">Dark (white text)</option>
                </select>
              </div>
              <div>
                <label htmlFor="c-align" className="adm-label">
                  Title on the
                </label>
                <select id="c-align" name="bannerAlign" value={align} onChange={(e) => setAlign(e.target.value as "left" | "right")} className="adm-input">
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
              </div>
            </div>
            {c.banner && !bannerPreview && (
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input type="checkbox" name="removeBanner" className="size-4 accent-ink" /> Remove banner (the shop&apos;s general banner shows instead)
              </label>
            )}
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
            <button className="btn btn-dark w-full" disabled={pending}>
              {pending ? "Saving…" : isNew ? "Add Category" : "Save Changes"}
            </button>
            {!isNew && (
              <a href={`/shop?category=${category.id}`} target="_blank" rel="noopener noreferrer" className="block text-center text-xs uppercase tracking-[0.16em] text-muted underline underline-offset-4 hover:text-ink">
                View in store ↗
              </a>
            )}
          </div>
        </div>
      </form>

      {!isNew && (
        <form
          action={delAction}
          onSubmit={(e) => {
            if (!confirm(`Delete the “${category.name}” category?`)) e.preventDefault();
          }}
          className="adm-card flex flex-wrap items-center justify-between gap-4 border-red-200"
        >
          <input type="hidden" name="id" value={category.id} />
          {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
          <div>
            <b className="text-sm font-medium">Delete this category</b>
            <p className="text-xs text-muted">
              {productCount ? `It has ${productCount} product${productCount === 1 ? "" : "s"}: move them to another category first.` : "It has no products, so it can be deleted."}
            </p>
            {delState?.error && <p className="mt-2 text-xs text-red-700">{delState.error}</p>}
          </div>
          <button disabled={deleting} className="btn btn-sm border border-red-700 text-red-700 hover:bg-red-700 hover:text-white">
            Delete Category
          </button>
        </form>
      )}
    </>
  );
}
