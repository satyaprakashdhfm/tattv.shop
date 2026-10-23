const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export const formatPrice = (amount: number) => inr.format(amount);

export const FREE_SHIPPING_THRESHOLD = 1999;
export const SHIPPING_FEE = 149;

export const shippingFor = (subtotal: number) => (subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE);
