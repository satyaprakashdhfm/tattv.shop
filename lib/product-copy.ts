// The standard Care and Shipping & Returns text on product pages. A product can override either in
// Admin → Products; left as the standard text, it follows these (so a rule change updates every piece).
import { formatPrice, type ShippingRules } from "./format";
import { RETURN_WINDOW_DAYS } from "./site";

const METAL_CARE = [
  "Store in the TATTV pouch, away from moisture and perfume.",
  "Wipe gently with a soft, dry cloth after wearing.",
  "Remove before swimming, showering or exercising.",
];

const LEATHER_CARE = [
  "Wipe clean with a soft, dry cloth.",
  "Condition every few months to keep the leather supple.",
  "Keep away from direct heat and prolonged moisture to preserve the patina.",
];

export const defaultCare = (finish?: string) => (finish === "leather" ? LEATHER_CARE : METAL_CARE);

/** The standard Shipping & Returns points, with the shipping rule from Site Settings. */
export const defaultShippingReturns = (r: ShippingRules) => [
  `Complimentary insured shipping on orders above ${formatPrice(r.freeShippingAbove)} (${formatPrice(r.shippingFee)} below that).`,
  "Dispatched within 24 hours; tracking is shared once it ships.",
  `Returns and exchanges within ${RETURN_WINDOW_DAYS} days of delivery, unworn and in the original packaging.`,
  "Engraved or personalised pieces are final sale.",
];

/** Lines from a textarea; empty when they match the standard text (so the product follows the standard). */
export function customLines(text: unknown, standard: string[]) {
  const lines = String(text ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12)
    .map((s) => s.slice(0, 300));
  return lines.join("\n") === standard.join("\n") ? [] : lines;
}
