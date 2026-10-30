// Policy pages (/policies/<slug>): their standard text. The live text is edited in Admin → Policies
// (table `policies`); until a page is saved there, this text shows.
//
// PLACEHOLDER: these are general starting drafts for an Indian online store, written so the site is
// complete for review and for Razorpay's website check (which looks for Terms, Privacy, Refund and
// Shipping policies). They are not legal advice. Replace them with the text TATTV's own advisor approves
// (legal name, GSTIN and grievance officer especially) before launch.
//
// Writing format, kept simple for the admin: "## " starts a heading, "- " a bullet point, a blank line a
// new paragraph. {email}, {phone}, {address}, {hours}, {freeShipping}, {shippingFee} and {returnDays}
// are filled in from Site Settings, so a changed phone number updates every policy.

export interface PolicyPage {
  slug: string;
  title: string;
  /** One line under the title on the page and in search results. */
  summary: string;
  body: string;
}

export const POLICIES: PolicyPage[] = [
  {
    slug: "shipping-payment",
    title: "Shipping & Payment Policy",
    summary: "How we ship across India, delivery times and charges, and the ways you can pay.",
    body: `## Where we ship
We deliver to serviceable PIN codes across India through trusted courier partners. We do not ship outside India at the moment. Checkout tells you if your PIN code is not serviceable.

## Shipping charges
- Orders of {freeShipping} and above ship free.
- Orders below that pay a flat {shippingFee}, shown at checkout before you pay.
- Every parcel is insured until it reaches you.

## Dispatch and delivery times
- Orders are packed and dispatched within 1 to 2 working days (Monday to Saturday, except public holidays).
- Delivery usually takes 3 to 7 working days after dispatch, depending on your location. Remote areas can take longer.
- Once your order ships, we share the courier name and tracking number by SMS, WhatsApp or email, and on your order page.

## Delays
Delivery times are estimates. Weather, strikes, festivals or courier issues can delay a parcel; we will keep you informed and help you track it. If a parcel has not moved for 7 days, contact us and we will raise it with the courier.

## Receiving your parcel
Please check that the outer packaging is sealed and undamaged before accepting it. If it looks tampered with, refuse the delivery or record a short unboxing video and contact us within 48 hours.

## Ways to pay
- Online: UPI, debit and credit cards, net banking and wallets, processed securely by Razorpay. We never see or store your card details.
- Cash on delivery (COD): available on most PIN codes. Please keep the exact amount ready; the courier may also accept UPI.
- All prices are in Indian Rupees (₹) and include GST.

## Failed or duplicate payments
If money was deducted but your order did not go through, it is refunded automatically by your bank or Razorpay, usually within 5 to 7 working days. If it is not, write to {email} with your order number and the transaction reference.

## Contact
Questions about shipping or payment: {email} or {phone}, {hours}.`,
  },
  {
    slug: "returns-refunds",
    title: "Returns, Refunds & Cancellation",
    summary: "Return or exchange within the return window, how refunds are paid, and cancelling an order.",
    body: `## Returns and exchanges
You can return or exchange a piece within {returnDays} days of delivery, as long as it is unworn, undamaged and in its original packaging with all tags and the TATTV pouch.

Start a return from the Returns page or by writing to {email} with your order number. We will arrange a pickup where the courier serves your PIN code, or share the address to send it to.

## Pieces that cannot be returned
- Engraved, personalised or custom-made pieces.
- Earrings and studs, for hygiene reasons, unless they arrive damaged.
- Pieces that show signs of wear, damage or alteration.

## Damaged or wrong item
If your order arrives damaged, or is not what you ordered, tell us within 48 hours of delivery with photos (an unboxing video helps). We will replace it or refund you in full, including shipping.

## Refunds
- Once the returned piece reaches us and passes a quality check, we process the refund within 5 to 7 working days.
- Online payments are refunded to the original payment method. Your bank may take a few more days to show it.
- Cash on delivery orders are refunded by bank transfer or UPI to the account you share with us.
- Shipping charges and gift packing are not refunded, except for damaged or wrong items.

## Cancelling an order
- You can cancel before the order is shipped by writing to {email} or calling {phone}. Paid orders are refunded in full.
- Once shipped, an order cannot be cancelled, but you can return it after delivery as above.
- We may cancel an order if a piece is out of stock, the address is not serviceable, or the payment looks suspicious. You are refunded in full if so.`,
  },
  {
    slug: "terms",
    title: "Terms & Conditions",
    summary: "The terms for using tattv.shop and buying from TATTV.",
    body: `## About these terms
These terms apply when you visit tattv.shop or buy from TATTV ("we", "us"). The store is run by [TATTV legal business name], [registered address], GSTIN [GSTIN]. By using the site or placing an order you agree to these terms, our Privacy Policy, our Shipping & Payment Policy and our Returns, Refunds & Cancellation policy.

## Using the site
- You must be at least 18 years old, or use the site with a parent or guardian's consent.
- Give accurate contact and delivery details. We are not responsible for delays caused by an incorrect address or phone number.
- Do not misuse the site: no fraud, scraping, attempts to break its security, or orders placed in someone else's name without their permission.

## Products and prices
- We describe and photograph every piece as accurately as we can. Colours can look slightly different on different screens, and handmade finishes vary a little from piece to piece.
- Prices are in Indian Rupees and include GST. We may change prices at any time; the price you pay is the one shown at checkout.
- If a piece is listed at a clearly wrong price because of an error, we may cancel the order and refund you in full.

## Orders
Your order is accepted once it is confirmed on screen and by message. We may refuse or cancel an order (with a full refund) if a piece is unavailable, the address cannot be served, or we suspect fraud.

## Coupons and offers
Coupon codes have their own rules (minimum order, first order only, end date, number of uses). Only one code applies per order. Codes have no cash value, cannot be exchanged, and may be withdrawn if misused.

## Reviews
Reviews you leave must be honest and about your own order. We may publish them on the site with your first name, initial and city, and we may choose not to publish a review.

## Intellectual property
The TATTV name, logo, photographs, designs and text on this site belong to TATTV and may not be copied or used without our written permission.

## Liability
We are responsible for delivering what you ordered as described. We are not liable for indirect losses, or for delays caused by events outside our control. Nothing in these terms limits your rights under the Consumer Protection Act, 2019 and the Consumer Protection (E-Commerce) Rules, 2020.

## Governing law
These terms are governed by the laws of India. Any dispute is subject to the courts of [Hyderabad, Telangana].

## Grievance officer
In line with the Consumer Protection (E-Commerce) Rules, 2020: [Grievance officer's name], {email}, {phone}, {address}. We acknowledge complaints within 48 hours and resolve them within one month.

## Changes
We may update these terms from time to time. The version on this page when you place an order applies to that order.`,
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    summary: "What we collect, why, and how we keep it safe.",
    body: `## What we collect
- Details you give us: name, email, mobile number, delivery address, and messages you send.
- Order details: what you bought, how you paid (not your card or UPI details, which go straight to Razorpay), and delivery updates.
- Basic technical data: device and browser type, pages visited, and cookies needed for your bag and sign-in.

## Why we use it
- To process, ship and support your orders, including sharing the delivery details a courier needs.
- To send order and delivery updates by SMS, WhatsApp or email.
- To answer your questions, returns and reviews.
- To prevent fraud and keep the site secure.
- With your consent, to tell you about new collections and offers. You can opt out at any time.

## Who we share it with
Only with the services that help us run the store, and only what they need: payment processing (Razorpay), couriers, SMS and email providers, and hosting. We never sell your personal data.

## How long we keep it
Order records are kept as long as tax and accounting laws require. Other details are deleted when no longer needed, or when you ask us to.

## Your rights
Under the Digital Personal Data Protection Act, 2023 you may ask to see, correct or delete your personal data, or withdraw consent for marketing. Write to {email}.

## Security
The site uses HTTPS, payments are handled by Razorpay's PCI-DSS compliant systems, and access to customer data is restricted to the TATTV team.

## Cookies
We use cookies to keep your bag, sign-in and preferences. You can clear them in your browser; the store still works, but your bag may be emptied.

## Contact
Questions about your data: {email}, {phone}, {address}.`,
  },
];

export const policyBySlug = (slug: string) => POLICIES.find((p) => p.slug === slug);

export interface PolicyVars {
  email: string;
  phone: string;
  address: string;
  hours: string;
  freeShipping: string;
  shippingFee: string;
  returnDays: string;
}

/** Fills {email}, {phone}… from Site Settings. Unknown {names} are left as they are. */
export const fillPolicy = (text: string, vars: PolicyVars) => text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? vars[k as keyof PolicyVars] : m));

export type PolicyBlock = { kind: "h"; text: string } | { kind: "p"; text: string } | { kind: "ul"; items: string[] };

/** The simple writing format as blocks: "## " headings, "- " bullets, blank lines between paragraphs. */
export function policyBlocks(text: string): PolicyBlock[] {
  const blocks: PolicyBlock[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ kind: "p", text: para.join(" ") });
    para = [];
  };
  for (const raw of text.replace(/\r/g, "").split("\n")) {
    const line = raw.trim();
    if (!line) flush();
    else if (line.startsWith("## ")) {
      flush();
      blocks.push({ kind: "h", text: line.slice(3).trim() });
    } else if (/^[-•*] /.test(line)) {
      flush();
      const last = blocks[blocks.length - 1];
      if (last?.kind === "ul") last.items.push(line.slice(2).trim());
      else blocks.push({ kind: "ul", items: [line.slice(2).trim()] });
    } else para.push(line);
  }
  flush();
  return blocks;
}

/** Heading text as a link anchor ("Ways to pay" → "ways-to-pay"). */
export const anchorOf = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
