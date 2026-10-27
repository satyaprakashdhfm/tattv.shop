// PREVIEW ONLY: a sample customer so the signed-in account area can be reviewed before real
// authentication exists. Their orders are real orders in the database under this email (see
// scripts/seed-demo.mjs). Credentials are checked in the browser, so they are not secret;
// replace this module with a real auth provider before launch.

export interface Account {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  memberSince: string;
}

export interface Address {
  id: string;
  label: string;
  name: string;
  lines: string[];
  phone: string;
  isDefault?: boolean;
}

/** Pieces already in the preview account's wishlist. */
export const DEMO_WISHLIST = ["twin-cable-bangle", "curb-link-ring", "tan-leather-office-messenger"];

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

/** Returns the demo account when the credentials match (case-insensitive email). */
export function checkDemoCredentials(email: string, password: string): Account | null {
  return email.trim().toLowerCase() === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password ? DEMO_ACCOUNT : null;
}
