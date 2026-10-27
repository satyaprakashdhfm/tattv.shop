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
  const formRef = useRef<HTMLFormElement>(null);

  // Once saved, the uploaded image is the category's image; don't send it again.
  useEffect(() => {
    if (state?.ok) {
      setFile(null);
      setPreview(null);
    }
  }, [state]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(formRef.current!);
    fd.delete("picker");
    if (file) fd.set("imageFile", file);
    startTransition(() => formAction(fd));
  };

  return (
    <>
      <form ref={formRef} onSubmit={submit} className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
        <input type="hidden" name="create" value={isNew ? "1" : "0"} />
        <input type="hidden" name="id" value={category?.id ?? ""} />
        <input type="hidden" name="image" value={c.image ?? ""} />
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
            <h2 className="adm-h2">Image</h2>
            <p className="mb-4 text-xs text-muted">Shown in the arch on the home page&apos;s Shop by Category. Use a tall (portrait) photo.</p>
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
