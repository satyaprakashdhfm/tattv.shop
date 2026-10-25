// PREVIEW ONLY: a sample customer so the signed-in account area can be reviewed before real
// authentication exists. Credentials are checked in the browser, so they are not secret;
// replace this module with a real auth provider before launch.

export interface Account {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  memberSince: string;
}

export type OrderStatus = "Processing" | "Shipped" | "Delivered" | "Returned";

export interface Order {
  id: string;
  date: string;
  status: OrderStatus;
  items: { slug: string; qty: number; size?: string }[];
  shipping: number;
  address: string;
  /** Present once dispatched. */
  tracking?: string;
}

export interface Address {
  id: string;
  label: string;
  name: string;
  lines: string[];
  phone: string;
  isDefault?: boolean;
}

export const DEMO_CREDENTIALS = { email: "demo@tattv.shop", password: "tattv123" };

export const DEMO_ACCOUNT: Account = {
  firstName: "Arjun",
  lastName: "Mehta",
  email: DEMO_CREDENTIALS.email,
  phone: "+91 00000 00000",
  memberSince: "March 2026",
};

export const DEMO_ADDRESSES: Address[] = [
  {
    id: "home",
    label: "Home",
    name: "Arjun Mehta",
    lines: ["Flat 12B, Sample Residency", "Road No. 1, Sample Nagar", "Hyderabad, Telangana 500001"],
    phone: "+91 00000 00000",
    isDefault: true,
  },
  {
    id: "work",
    label: "Work",
    name: "Arjun Mehta",
    lines: ["4th Floor, Sample Tower", "Business District", "Bengaluru, Karnataka 560001"],
    phone: "+91 00000 00000",
  },
];

export const DEMO_ORDERS: Order[] = [
  {
    id: "TTV-104829",
    date: "18 Oct 2026",
    status: "Shipped",
    items: [
      { slug: "onyx-signet-ring", qty: 1, size: "18" },
      { slug: "layered-curb-chain", qty: 1, size: '20"' },
    ],
    shipping: 0,
    address: "Home",
    tracking: "DTDC · D88214093",
  },
  {
    id: "TTV-103377",
    date: "02 Sep 2026",
    status: "Delivered",
    items: [{ slug: "leather-card-wallet", qty: 1 }],
    shipping: 149,
    address: "Work",
  },
  {
    id: "TTV-101902",
    date: "14 Jul 2026",
    status: "Delivered",
    items: [
      { slug: "mesh-inlay-bangle", qty: 1, size: 'M · 7.5"' },
      { slug: "star-dog-tag-pendant", qty: 1, size: '22"' },
    ],
    shipping: 0,
    address: "Home",
  },
];

/** Returns the demo account when the credentials match (case-insensitive email). */
export function checkDemoCredentials(email: string, password: string): Account | null {
  return email.trim().toLowerCase() === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password ? DEMO_ACCOUNT : null;
}
