import { NextResponse } from "next/server";
import { safeEqual } from "@/lib/server/auth";
import { orderForWaybill, refreshTracking } from "@/lib/server/shipments";

export const dynamic = "force-dynamic";

// Delhivery pushes a scan update here the moment a parcel moves (their tech team switches it on for
//   https://<site>/api/delhivery/webhook?token=<DELHIVERY_WEBHOOK_TOKEN>
// ). Their push isn't signed, so the token guards the URL, and the push itself is never trusted: it only
// says which waybill moved, and we ask Delhivery's API for the real status.

const tokenOk = (req: Request) => {
  const want = process.env.DELHIVERY_WEBHOOK_TOKEN;
  if (!want) return false;
  const got = new URL(req.url).searchParams.get("token") || req.headers.get("x-webhook-token") || (req.headers.get("authorization") || "").replace(/^(Bearer|Token)\s+/i, "");
  return !!got && safeEqual(got, want);
};

// Pushes come as one shipment or a list, with the waybill as AWB or Waybill.
function waybillsIn(body: unknown): string[] {
  const list = Array.isArray(body) ? body : [body];
  return [
    ...new Set(
      list
        .map((x) => {
          const s = x?.Shipment || x?.shipment || x || {};
          return String(s.AWB || s.Waybill || s.waybill || s.awb || "").trim();
        })
        .filter(Boolean),
    ),
  ];
}

export async function POST(req: Request) {
  if (!tokenOk(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const results = [];
  for (const wbn of waybillsIn(body).slice(0, 50)) {
    const id = await orderForWaybill(wbn);
    if (!id) {
      results.push({ waybill: wbn, result: "unknown" });
      continue;
    }
    const r = await refreshTracking(id).catch((e) => ({ error: (e as Error).message }));
    results.push({ waybill: wbn, order: id, ...r });
  }
  // Always 200 for a valid call, even for an unknown waybill, so Delhivery doesn't keep retrying.
  return NextResponse.json({ ok: true, results });
}

// Some setups test the URL with a GET before saving it.
export async function GET(req: Request) {
  if (!tokenOk(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ ok: true });
}
