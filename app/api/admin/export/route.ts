import { isAdmin } from "@/lib/server/auth";
import { listOrders } from "@/lib/server/orders";
import { ORDER_STATUSES, PAYMENT_LABELS } from "@/lib/site";

export const dynamic = "force-dynamic";

const esc = (v: unknown) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// Every order as a spreadsheet-friendly CSV, one row per order.
export async function GET() {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });
  const orders = await listOrders();
  const head = ["Order", "Date", "Status", "Payment method", "Payment", "Items", "Subtotal", "Discount", "Code", "Shipping", "Gift packing", "Total",
    "Name", "Email", "Phone", "Address", "City", "State", "Pincode", "Courier", "Tracking", "Gift message"];
  const rows = orders.map((o) => [
    o.id, new Date(o.createdAt).toLocaleString("en-IN"), ORDER_STATUSES[o.status]?.label, o.payment.method, PAYMENT_LABELS[o.payment.status],
    o.lines.map((l) => `${l.qty} x ${l.name}${l.size ? ` (${l.size})` : ""}`).join("; "), o.subtotal, o.discount, o.discountCode, o.shipping, o.gift?.fee ?? 0, o.total,
    `${o.customer.firstName} ${o.customer.lastName}`, o.customer.email, o.customer.phone,
    [o.customer.address, o.customer.apartment].filter(Boolean).join(", "), o.customer.city, o.customer.state, o.customer.pin,
    o.tracking?.courier, o.tracking?.number, o.gift ? [o.gift.occasion, o.gift.message].filter(Boolean).join(": ") : "",
  ]);
  const csv = "﻿" + [head, ...rows].map((r) => r.map(esc).join(",")).join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tattv-orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
