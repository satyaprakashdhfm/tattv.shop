import { handler, json } from "@/lib/server/http";
import { otpConfig } from "@/lib/server/otp";

export const dynamic = "force-dynamic";

// Which mobile login the browser should show: MSG91's widget (its id and token are public by design),
// our own texted code, or none yet.
export const GET = handler(async () => json(otpConfig()));
