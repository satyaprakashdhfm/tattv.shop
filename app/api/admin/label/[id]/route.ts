import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/server/auth";
import { handler } from "@/lib/server/http";
import { labelFor } from "@/lib/server/shipments";

type Ctx = { params: Promise<{ id: string }> };

// The Delhivery shipping label (4x6 PDF) for an order, to print and stick on the parcel.
export const GET = handler<Ctx>(async (_req, { params }) => {
  if (!(await isAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const r = await labelFor(id);
  if (r.link) return NextResponse.redirect(r.link);
  return new Response(new Uint8Array(r.pdf!), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="label-${id}.pdf"` } });
});
