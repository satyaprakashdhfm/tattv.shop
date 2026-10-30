const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export const formatPrice = (amount: number) => inr.format(amount);

/** The shipping rule, from Admin → Site Settings (never from the browser: the server prices every order with the stored one). */
export interface ShippingRules {
  freeShippingAbove: number;
  shippingFee: number;
}

export const shippingFor = (subtotal: number, r: ShippingRules) => (subtotal === 0 || subtotal >= r.freeShippingAbove ? 0 : r.shippingFee);
