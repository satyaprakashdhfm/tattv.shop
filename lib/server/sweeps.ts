import "server-only";
import { delhiveryConfigured } from "./delhivery";
import { refreshAllInTransit } from "./shipments";

// Every DELHIVERY_POLL_MINUTES (30 by default; 0 switches it off) the server asks Delhivery about every
// parcel still on its way, so orders move on even if a webhook push is missed.
let started = false;

export function startShipmentSweeps() {
  const minutes = Number(process.env.DELHIVERY_POLL_MINUTES ?? 30);
  if (started || !delhiveryConfigured() || !(minutes > 0)) return;
  started = true;
  const run = () =>
    refreshAllInTransit()
      .then((r) => r.checked && console.log(`[DELHIVERY] tracking sweep | checked=${r.checked} | updated=${r.moved}`))
      .catch((e) => console.error("[DELHIVERY] tracking sweep failed", (e as Error).message));
  setTimeout(run, 60_000);
  setInterval(run, minutes * 60_000).unref?.();
}
