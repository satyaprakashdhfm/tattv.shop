// Runs once when the server starts: the Delhivery tracking check (lib/server/sweeps.ts), in production
// only. The import sits inside the NEXT_RUNTIME check so the edge build of this file leaves the server code
// (database, sharp) out; an early return is not enough for the bundler.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NODE_ENV === "production") {
    const { startShipmentSweeps } = await import("./lib/server/sweeps");
    startShipmentSweeps();
  }
}
