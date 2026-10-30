"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { checkAdminLogin, endAdminSession, requireAdmin, startAdminSession } from "@/lib/server/auth";
import { adminUpdateOrder, listOrders, setMessageStatus } from "@/lib/server/orders";
import { OrderError } from "@/lib/pricing";
import { deleteCoupon, saveCoupon, setCouponActive } from "@/lib/server/coupons";
import { deleteReview, saveReview, setReviewStatus } from "@/lib/server/reviews";
import { resetPolicy, savePolicy } from "@/lib/server/policies";
import { awaitingPickup, bookShipment, cancelBooking, refreshAllInTransit, refreshTracking, registerPickup, requestPickup } from "@/lib/server/shipments";
import { deletePickupAddress, saveParcelSettings, savePickupAddress, saveWeights, setDefaultPickup } from "@/lib/server/pickup";
import { deleteAlert, markAlertSent, notifyRestocked } from "@/lib/server/stock-alerts";
import { confirmMoneyCode, requestMoneyCode } from "@/lib/server/refunds";
import { addReel, deleteReel, moveReel, saveVideo, updateReel } from "@/lib/server/reels";
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
  // Cancelling goes through "Cancel or refund", which needs the owner's code and refunds the money.
  if (str(fd, "status") === "cancelled") return;
  await adminUpdateOrder(id, { status: str(fd, "status"), statusNote: fd.get("statusNote") });
  refresh(id);
}

/** Cancel or refund, step 1: check the request and text the owner a code. */
export async function moneyCodeAction(id: string, input: { kind?: string; reason?: string; reasonCode?: string; amount?: string; note?: string }) {
  await requireAdmin();
  return attempt(() =>
    requestMoneyCode(String(id), { kind: input?.kind, reason: input?.reason, reasonCode: input?.reasonCode, amount: input?.amount, note: input?.note }),
  );
}

/** Step 2: the owner's code (or MSG91's token for it). Only now is anything cancelled or refunded. */
export async function moneyConfirmAction(id: string, proof: { code?: string; accessToken?: string }) {
  await requireAdmin();
  const res = await attempt(() => confirmMoneyCode(String(id), { code: String(proof?.code || "").trim(), accessToken: proof?.accessToken ? String(proof.accessToken) : "" }));
  refresh(String(id));
  return res;
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
        care: str(fd, "care"),
        shippingReturns: str(fd, "shippingReturns"),
        costPrice: fd.get("costPrice"),
        // A new upload replaces the video; "video" carries the one kept (empty once removed).
        video: (await saveVideo(fd.get("videoFile") as File | null)) ?? str(fd, "video"),
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
    let banner = str(fd, "banner");
    const bannerUpload = fd.get("bannerFile") as File | null;
    if (bannerUpload && bannerUpload.size) banner = (await saveImage(bannerUpload)) ?? banner;
    if (fd.get("removeBanner") === "on") banner = "";
    await saveCategory(
      { id: str(fd, "id"), name: str(fd, "name"), title: str(fd, "title"), blurb: str(fd, "blurb"), image, banner, bannerTone: str(fd, "bannerTone"), bannerAlign: str(fd, "bannerAlign") },
      { isNew },
    );
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
    await saveSettings({
      ...Object.fromEntries(["instagram", "facebook", "twitter", "youtube", "email", "phone", "hours", "address", "freeShippingAbove", "shippingFee", "giftWrapFee", "codAdvancePercent"].map((k) => [k, fd.get(k)])),
      announcements: fd.getAll("announcements"),
    });
  } catch (e) {
    return { error: (e as Error).message };
  }
  refreshStore();
  return { ok: "Saved. Changes are live on the store." };
}

// ── Coupons ──
export async function saveCouponAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const isNew = fd.get("create") === "1";
  const res = await attempt(() =>
    saveCoupon(
      {
        code: fd.get("code"),
        kind: fd.get("kind"),
        value: fd.get("value"),
        label: fd.get("label"),
        active: fd.get("active") === "on",
        showAtCheckout: fd.get("showAtCheckout") === "on",
        firstOrderOnly: fd.get("firstOrderOnly") === "on",
        minSubtotal: fd.get("minSubtotal"),
        maxUses: fd.get("maxUses"),
        perCustomer: fd.get("perCustomer"),
        startsOn: fd.get("startsOn"),
        expiresOn: fd.get("expiresOn"),
        ownerEmail: fd.get("ownerEmail"),
        ownerPhone: fd.get("ownerPhone"),
        note: fd.get("note"),
      },
      { isNew },
    ),
  );
  if (typeof res === "object") return res;
  revalidatePath("/admin/coupons");
  redirect(backTo(fd, { saved: res }) ?? `/admin/coupons?saved=${res}`);
}

export async function toggleCouponAction(fd: FormData) {
  await requireAdmin();
  await setCouponActive(str(fd, "code"), fd.get("active") === "1");
  revalidatePath("/admin/coupons");
}

export async function deleteCouponAction(fd: FormData) {
  await requireAdmin();
  await deleteCoupon(str(fd, "code"));
  revalidatePath("/admin/coupons");
  redirect(backTo(fd, { deleted: "1" }) ?? "/admin/coupons?deleted=1");
}

// ── Home page videos ──
const refreshVideos = () => {
  revalidatePath("/admin/videos");
  revalidatePath("/");
};

export async function addReelAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const res = await attempt(async () => {
    const video = await saveVideo(fd.get("video") as File | null);
    const poster = await saveImage(fd.get("poster") as File | null);
    await addReel({ video, poster, caption: fd.get("caption"), product: fd.get("product") });
  });
  if (res && typeof res === "object" && "error" in res) return res;
  refreshVideos();
  return { ok: "Added. It plays first on the home page." };
}

export async function updateReelAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const res = await attempt(async () => {
    const poster = await saveImage(fd.get("poster") as File | null);
    await updateReel(str(fd, "id"), { caption: fd.get("caption"), product: fd.get("product"), active: fd.get("active") === "on", poster });
  });
  if (res && typeof res === "object" && "error" in res) return res;
  refreshVideos();
  return { ok: "Saved." };
}

export async function moveReelAction(fd: FormData) {
  await requireAdmin();
  const dir = str(fd, "dir");
  await moveReel(str(fd, "id"), dir === "top" ? "top" : Number(dir) < 0 ? -1 : 1);
  refreshVideos();
}

export async function deleteReelAction(fd: FormData) {
  await requireAdmin();
  await deleteReel(str(fd, "id"));
  refreshVideos();
}

// ── Reviews ──
export async function setReviewStatusAction(fd: FormData) {
  await requireAdmin();
  await setReviewStatus(str(fd, "id"), str(fd, "status"));
  revalidatePath("/admin/reviews");
  revalidatePath("/");
}

export async function deleteReviewAction(fd: FormData) {
  await requireAdmin();
  await deleteReview(str(fd, "id"));
  revalidatePath("/admin/reviews");
  revalidatePath("/");
}

// ── Policies ──
export async function savePolicyAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const slug = str(fd, "slug");
  const res = await attempt(() => savePolicy(slug, { title: fd.get("title"), body: fd.get("body") }));
  if (res && typeof res === "object" && "error" in res) return res;
  revalidatePath("/admin/policies");
  revalidatePath(`/policies/${slug}`);
  return { ok: "Saved. The page is live." };
}

export async function resetPolicyAction(fd: FormData) {
  await requireAdmin();
  const slug = str(fd, "slug");
  await resetPolicy(slug);
  revalidatePath("/admin/policies");
  revalidatePath(`/policies/${slug}`);
}

// ── Delhivery ──
export async function bookShipmentAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = str(fd, "id");
  const res = await attempt(() => bookShipment(id, fd.get("grams")));
  refresh(id);
  return typeof res === "object" ? res : { ok: `Booked with Delhivery: waybill ${res}. Print the label and pack the parcel.` };
}

export async function shipmentAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = str(fd, "id");
  const what = str(fd, "do");
  const res = await attempt(async () => {
    if (what === "cancel") {
      await cancelBooking(id);
      return "Delhivery booking cancelled.";
    }
    const t = await refreshTracking(id);
    return `Delhivery says: ${t.status || "no scans yet"}${t.location ? `, ${t.location}` : ""}.`;
  });
  refresh(id);
  return typeof res === "object" ? res : { ok: res };
}

// ── Admin → Delivery ──
// Each action goes back to the Delivery page with a one-line notice (?note=…, or ?err=… when it failed).
async function delivery(fn: () => Promise<string>) {
  const res = await attempt(fn);
  revalidatePath("/admin/delivery");
  redirect(`/admin/delivery?${typeof res === "object" ? "err" : "note"}=${encodeURIComponent(typeof res === "object" ? res.error : res)}`);
}

export async function savePickupAddressAction(fd: FormData) {
  await requireAdmin();
  await delivery(async () => {
    await savePickupAddress(Object.fromEntries(fd));
    return "Pickup address saved. Press Register with Delhivery if it is new or its details changed.";
  });
}

export async function defaultPickupAction(fd: FormData) {
  await requireAdmin();
  await delivery(async () => {
    await setDefaultPickup(str(fd, "id"));
    return "Default pickup address changed. New shipments are booked from it.";
  });
}

export async function deletePickupAddressAction(fd: FormData) {
  await requireAdmin();
  await delivery(async () => {
    await deletePickupAddress(str(fd, "id"));
    return "Pickup address deleted.";
  });
}

export async function registerPickupAction(fd: FormData) {
  await requireAdmin();
  await delivery(async () => {
    const r = await registerPickup(str(fd, "id"));
    return r.existed ? `Delhivery already had “${r.name}”; its details are updated.` : `“${r.name}” registered with Delhivery. They may take up to a day to switch it on.`;
  });
}

export async function saveParcelSettingsAction(fd: FormData) {
  await requireAdmin();
  await delivery(async () => {
    await saveParcelSettings(Object.fromEntries(fd));
    return "Parcel weight settings saved. They apply to shipments booked from now on.";
  });
}

export async function saveWeightsAction(fd: FormData) {
  await requireAdmin();
  await delivery(async () => {
    await saveWeights(fd.getAll("slug").map(String).map((slug) => ({ slug, grams: fd.get(`w:${slug}`) })));
    return "Packed weights saved.";
  });
}

export async function requestPickupAction(fd: FormData) {
  await requireAdmin();
  await delivery(async () => {
    const r = await requestPickup({ date: str(fd, "date"), time: str(fd, "time"), count: fd.get("count"), from: str(fd, "from"), orders: awaitingPickup(await listOrders()) });
    return `Pickup requested from ${r.location}${r.id ? ` (Delhivery pickup ID ${r.id})` : ""}.`;
  });
}

export async function refreshAllTrackingAction() {
  await requireAdmin();
  await delivery(async () => {
    const r = await refreshAllInTransit();
    return r.checked ? `Asked Delhivery about ${r.checked} parcel${r.checked === 1 ? "" : "s"}.` : "No parcels are on their way.";
  });
}

export async function saveReviewAction(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const res = await attempt(() => saveReview(Object.fromEntries(fd)));
  if (res && typeof res === "object" && "error" in res) return res;
  revalidatePath("/admin/reviews");
  revalidatePath("/");
  const back = backTo(fd, { saved: "1" });
  if (back) redirect(back);
  return { ok: "Saved." };
}

// ── Notify requests (back in stock) ──
export async function markAlertSentAction(fd: FormData) {
  await requireAdmin();
  await markAlertSent(str(fd, "id"));
  revalidatePath("/admin/notify");
}

export async function deleteAlertAction(fd: FormData) {
  await requireAdmin();
  await deleteAlert(str(fd, "id"));
  revalidatePath("/admin/notify");
}

export async function sendRestockNowAction() {
  await requireAdmin();
  await notifyRestocked();
  revalidatePath("/admin/notify");
  redirect("/admin/notify?note=" + encodeURIComponent("Waiting messages sent where possible. Any that failed show why."));
}
