"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { checkAdminLogin, endAdminSession, requireAdmin, startAdminSession } from "@/lib/server/auth";
import { adminUpdateOrder, setMessageStatus } from "@/lib/server/orders";
import { OrderError } from "@/lib/pricing";
import { deleteCategory, deleteProduct, moveCategory, moveProduct, quickUpdateProducts, saveCategory, saveImage, saveProduct, saveSettings, type ProductScope } from "@/lib/server/catalog";

export type FormState = { ok?: string; error?: string } | null;

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "");

export async function login(_prev: FormState, fd: FormData): Promise<FormState> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  const res = checkAdminLogin(fd.get("username"), str(fd, "password"), ip);
  if (!res.ok) return { error: res.error };
  await startAdminSession();
  redirect("/admin");
}

export async function logout() {
  await endAdminSession();
  redirect("/admin/login");
}

const refresh = (id?: string) => {
  revalidatePath("/admin", "layout");
  if (id) revalidatePath(`/admin/orders/${id}`);
};

// ── Orders ──
export async function updateStatus(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  await adminUpdateOrder(id, { status: str(fd, "status"), statusNote: fd.get("statusNote") });
  refresh(id);
}

export async function saveTracking(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const tracking = { courier: fd.get("courier"), number: fd.get("number"), url: fd.get("url") };
  const markShipped = fd.get("markShipped") === "on";
  await adminUpdateOrder(id, { tracking, ...(markShipped ? { status: "shipped", statusNote: "Tracking added" } : {}) });
  refresh(id);
}

export async function setPayment(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  await adminUpdateOrder(id, { paymentStatus: str(fd, "paymentStatus") });
  refresh(id);
}

export async function addNote(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id");
  const note = str(fd, "note").trim();
  if (note) await adminUpdateOrder(id, { note });
  refresh(id);
}

export async function markMessage(fd: FormData) {
  await requireAdmin();
  await setMessageStatus(str(fd, "id"), str(fd, "status"));
  refresh();
}

// ── Catalogue ──
// Known problems (empty name, bad price…) come back as { error } for the form to show.
async function attempt<T>(fn: () => Promise<T>): Promise<T | { error: string }> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message };
    throw e;
  }
}

const refreshStore = () => revalidatePath("/", "layout");

/** The admin list a pop-up editor was opened from (validated), with a notice added, so saving closes the pop-up. */
function backTo(fd: FormData, notice: Record<string, string>) {
  const to = str(fd, "returnTo");
  if (!/^\/admin\/[\w/-]*(\?[\w=&:%.-]*)?$/.test(to)) return null;
  const url = new URL(to, "http://x");
  url.searchParams.delete("edit");
  for (const [k, v] of Object.entries(notice)) url.searchParams.set(k, v);
  return url.pathname + url.search;
}

export async function saveProductAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const isNew = fd.get("create") === "1";
  const res = await attempt(async () => {
    // imageOrder lists existing photo URLs, and "new:<n>" for the n-th uploaded file.
    const order: string[] = JSON.parse(str(fd, "imageOrder") || "[]");
    const uploaded: (string | null)[] = [];
    for (const f of fd.getAll("newImages")) uploaded.push(await saveImage(f as File));
    const images = order.map((x) => (x.startsWith("new:") ? uploaded[Number(x.slice(4))] : x)).filter((x): x is string => !!x);
    const slug = await saveProduct(
      {
        slug: str(fd, "slug"),
        name: str(fd, "name"),
        category: str(fd, "category"),
        collection: str(fd, "collection"),
        price: fd.get("price"),
        compareAt: fd.get("compareAt"),
        stock: fd.get("stock"),
        material: str(fd, "material"),
        finish: str(fd, "finish"),
        sizeLabel: str(fd, "sizeLabel"),
        sizeValues: str(fd, "sizeValues"),
        badge: str(fd, "badge"),
        isNew: fd.get("isNew") === "on",
        bestseller: fd.get("bestseller") === "on",
        short: str(fd, "short"),
        description: str(fd, "description"),
        details: str(fd, "details"),
        active: fd.get("active") === "on",
        images,
      },
      { isNew },
    );
    return { saved: slug };
  });
  refreshStore();
  if ("error" in res) return res;
  const back = backTo(fd, { saved: res.saved });
  if (back) redirect(back);
  if (isNew) redirect(`/admin/products/${res.saved}?saved=1`);
  return { ok: "Saved. Changes are live on the store." };
}

export async function deleteProductAction(fd: FormData) {
  await requireAdmin();
  await deleteProduct(str(fd, "slug"));
  refreshStore();
  redirect(backTo(fd, { deleted: "1" }) ?? "/admin/products?deleted=1");
}

export async function moveProductAction(fd: FormData) {
  await requireAdmin();
  const dir = str(fd, "dir");
  const scope = str(fd, "scope");
  await moveProduct(str(fd, "slug"), dir === "top" ? "top" : Number(dir), /^(all|new|bestseller|cat:[\w-]+)$/.test(scope) ? (scope as ProductScope) : "all");
  refreshStore();
}

export async function quickUpdateAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const slugs = fd.getAll("slug").map(String);
  const res = await attempt(() =>
    quickUpdateProducts(slugs.map((s) => ({ slug: s, price: fd.get("price:" + s), stock: fd.get("stock:" + s), active: fd.get("active:" + s) === "on" }))),
  );
  refreshStore();
  return res && typeof res === "object" && "error" in res ? res : { ok: "Saved. Changes are live on the store." };
}

export async function saveCategoryAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const isNew = fd.get("create") === "1";
  const res = await attempt(async () => {
    let image = str(fd, "image");
    const upload = fd.get("imageFile") as File | null;
    if (upload && upload.size) image = (await saveImage(upload)) ?? image;
    if (fd.get("removeImage") === "on") image = "";
    await saveCategory({ id: str(fd, "id"), name: str(fd, "name"), title: str(fd, "title"), blurb: str(fd, "blurb"), image }, { isNew });
    return { saved: true };
  });
  refreshStore();
  if (res && typeof res === "object" && "error" in res) return res;
  const back = backTo(fd, { saved: "1" });
  if (back) redirect(back);
  if (isNew) redirect("/admin/categories?saved=1");
  return { ok: "Saved. Changes are live on the store." };
}

export async function deleteCategoryAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const res = await attempt(() => deleteCategory(str(fd, "id")));
  if (res && typeof res === "object" && "error" in res) return res;
  refreshStore();
  redirect(backTo(fd, { deleted: "1" }) ?? "/admin/categories?deleted=1");
}

export async function moveCategoryAction(fd: FormData) {
  await requireAdmin();
  await moveCategory(str(fd, "id"), Number(fd.get("dir")));
  refreshStore();
}

export async function saveSettingsAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  try {
    await saveSettings(Object.fromEntries(["instagram", "facebook", "twitter", "youtube", "announcement", "email", "phone", "whatsapp", "hours", "address"].map((k) => [k, fd.get(k)])));
  } catch (e) {
    return { error: (e as Error).message };
  }
  refreshStore();
  return { ok: "Saved. Changes are live on the store." };
}
