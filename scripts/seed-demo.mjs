// Fills a store database with sample orders and messages, so the admin dashboard, order lists and
// the preview customer's My Account (demo@tattv.shop) have something to show in a demo.
//
//   node scripts/seed-demo.mjs                      uses DATABASE_URL from .env.local
//   node scripts/seed-demo.mjs "postgres://…"       any other database (e.g. Railway's public URL)
//
// Runs once per database (marked in app_meta as 'demo-data'). Sample orders don't change stock.
// Remove them before launch: DELETE FROM orders WHERE email LIKE '%@example.com' OR email = 'demo@tattv.shop';
// DELETE FROM messages WHERE email LIKE '%@example.com'; DELETE FROM app_meta WHERE key = 'demo-data';
import crypto from "node:crypto";
import fs from "node:fs";
import pg from "pg";

const url = process.argv[2] || fs.readFileSync(new URL("../.env.local", import.meta.url), "utf8").match(/^DATABASE_URL=(.*)$/m)?.[1]?.trim();
if (!url) throw new Error("No database URL: pass one, or set DATABASE_URL in .env.local");
const local = /localhost|127\.0\.0\.1/.test(url);
const db = new pg.Client({ connectionString: url, ssl: local ? false : { rejectUnauthorized: false } });

const DAY = 86400_000;
const HOUR = 3600_000;
const now = Date.now();

// A repeatable "random" sequence, so every database gets the same sample data.
let seed = 20261027;
const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = (list) => list[Math.floor(rand() * list.length)];

const CUSTOMERS = [
  ["Rohan", "Kapoor", "Mumbai", "Maharashtra", "400050", "Flat 702, Sea Breeze Apartments, Bandra West"],
  ["Vikram", "Reddy", "Hyderabad", "Telangana", "500033", "Plot 41, Road No. 12, Banjara Hills"],
  ["Aditya", "Sharma", "New Delhi", "Delhi", "110024", "C-118, Lajpat Nagar II"],
  ["Karan", "Malhotra", "Gurugram", "Haryana", "122002", "Tower B-1104, DLF Phase 4"],
  ["Siddharth", "Iyer", "Bengaluru", "Karnataka", "560038", "22, 12th Main, Indiranagar"],
  ["Neha", "Gupta", "Pune", "Maharashtra", "411001", "5, Lane 7, Koregaon Park"],
  ["Arnav", "Joshi", "Ahmedabad", "Gujarat", "380015", "B-32, Satellite Road"],
  ["Rahul", "Nair", "Kochi", "Kerala", "682020", "House 14, Panampilly Nagar"],
  ["Ishaan", "Verma", "Lucknow", "Uttar Pradesh", "226010", "3/112, Gomti Nagar"],
  ["Priya", "Menon", "Chennai", "Tamil Nadu", "600018", "Flat 3C, Alwarpet Residency"],
  ["Kabir", "Singh", "Chandigarh", "Chandigarh", "160009", "House 1203, Sector 9"],
  ["Dev", "Patel", "Surat", "Gujarat", "395007", "A-401, Vesu Heights"],
  ["Ananya", "Rao", "Bengaluru", "Karnataka", "560102", "88, HSR Layout Sector 2"],
  ["Yash", "Agarwal", "Jaipur", "Rajasthan", "302017", "C-56, Malviya Nagar"],
  ["Manav", "Desai", "Mumbai", "Maharashtra", "400076", "Flat 9B, Hiranandani Gardens, Powai"],
  ["Tanmay", "Kulkarni", "Nagpur", "Maharashtra", "440010", "12, Dharampeth Extension"],
  ["Arjun", "Bhatia", "Kolkata", "West Bengal", "700019", "7A, Ballygunge Place"],
  ["Riya", "Chopra", "Indore", "Madhya Pradesh", "452001", "201, Vijay Nagar Scheme 54"],
].map(([firstName, lastName, city, state, pin, address], i) => ({
  firstName, lastName, city, state, pin, address, apartment: "",
  email: `${firstName}.${lastName}`.toLowerCase() + "@example.com",
  phone: String(9800000000 + i * 104729 + 31),
}));

// The preview account from lib/demo-account.ts.
const ARJUN = {
  firstName: "Arjun", lastName: "Mehta", email: "demo@tattv.shop", phone: "9000000000",
  address: "Flat 12B, Sample Residency, Road No. 1, Sample Nagar", apartment: "", city: "Hyderabad", state: "Telangana", pin: "500001",
};

const COURIERS = [
  ["Delhivery", (awb) => `https://www.delhivery.com/track/package/${awb}`],
  ["Blue Dart", (awb) => `https://www.bluedart.com/tracking?awb=${awb}`],
  ["DTDC", (awb) => `https://www.dtdc.in/tracking.asp?awb=${awb}`],
];
const COUPONS = { WELCOME10: 10, TATTV15: 15, ELEMENT20: 20 };
const MESSAGES_OF_GIFTS = [
  ["Birthday", "Happy birthday! Wear it every day. Love, Meera"],
  ["Anniversary", "Five years and counting. Here's to many more."],
  ["Thank you", "For always having my back. Thank you, bhai."],
];

// Where an order of a given age has got to, with the time of each step.
function timeline(created, final) {
  const steps = [["pending_payment", 0, "Order created"]];
  const add = (status, after, note) => steps.push([status, after, note]);
  if (final === "cancelled") {
    add("confirmed", 2 * 60_000, "Order placed");
    add("cancelled", 5 * HOUR, "Cancelled at the customer's request");
    return steps;
  }
  add("confirmed", 2 * 60_000, "Order placed");
  const order = ["packed", "shipped", "out_for_delivery", "delivered"];
  const at = { packed: 18 * HOUR, shipped: 28 * HOUR, out_for_delivery: 3 * DAY, delivered: 3 * DAY + 7 * HOUR };
  const notes = { packed: "Packed and ready for pickup", shipped: "Handed to the courier", out_for_delivery: "Out for delivery", delivered: "Delivered" };
  for (const s of order.slice(0, order.indexOf(final) + 1)) add(s, at[s], notes[s]);
  return steps.filter(([, after]) => created + after < now);
}

function finalFor(ageDays) {
  if (ageDays < 0.8) return "confirmed";
  if (ageDays < 1.3) return pick(["confirmed", "packed"]);
  if (ageDays < 2.5) return pick(["packed", "shipped"]);
  if (ageDays < 3.3) return pick(["shipped", "out_for_delivery"]);
  return rand() < 0.07 ? "cancelled" : "delivered";
}

await db.connect();
try {
  const done = await db.query("SELECT 1 FROM app_meta WHERE key = 'demo-data'");
  if (done.rowCount) {
    console.log("Sample data is already in this database.");
    process.exit(0);
  }
  await db.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS gift_wrap integer NOT NULL DEFAULT 0");
  await db.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS gift_message text NOT NULL DEFAULT ''");
  await db.query("ALTER TABLE orders ADD COLUMN IF NOT EXISTS gift_occasion text NOT NULL DEFAULT ''");

  const { rows: products } = await db.query(`
    SELECT p.slug, p.name, p.price, p.size_values, p.bestseller,
      COALESCE((SELECT url FROM product_images i WHERE i.product_slug = p.slug ORDER BY position LIMIT 1), '') AS image
    FROM products p WHERE p.active ORDER BY p.sort_order`);
  if (!products.length) throw new Error("No products yet: open the store once so the catalogue is seeded, then run this again.");
  // Bestsellers sell more often.
  const weighted = products.flatMap((p) => (p.bestseller ? [p, p, p] : [p]));

  // Sample orders: busier recently, so the 14-day chart has shape. Ages in days.
  const plans = [];
  for (let d = 0; d < 45; d++) {
    const perDay = d < 14 ? [1, 2, 3, 1, 2, 4, 2, 1, 3, 2, 0, 2, 1, 3][d] : rand() < 0.55 ? 1 : 0;
    for (let k = 0; k < perDay; k++) plans.push({ age: d + 0.05 + rand() * 0.9, customer: pick(CUSTOMERS) });
  }
  // The preview customer: one on its way (with tracking), one delivered last week, an older gift order.
  plans.push(
    { age: 2.1, customer: ARJUN, final: "shipped", lines: ["onyx-signet-ring", "layered-curb-chain"] },
    { age: 6.4, customer: ARJUN, final: "delivered", lines: ["leather-card-wallet"] },
    { age: 38, customer: ARJUN, final: "delivered", lines: ["mesh-inlay-bangle", "star-dog-tag-pendant"], gift: 1 },
  );
  plans.sort((a, b) => b.age - a.age);

  let n = 0;
  for (const plan of plans) {
    const created = now - plan.age * DAY;
    const final = plan.final ?? finalFor(plan.age);
    const c = plan.customer;

    const chosen = plan.lines
      ? plan.lines.map((slug) => products.find((p) => p.slug === slug)).filter(Boolean)
      : [...new Set(Array.from({ length: rand() < 0.65 ? 1 : rand() < 0.7 ? 2 : 3 }, () => pick(weighted)))];
    if (!chosen.length) continue;
    const lines = chosen.map((p) => ({
      ...p,
      size: p.size_values?.length ? p.size_values[Math.floor(rand() * p.size_values.length)] : null,
      qty: rand() < 0.9 ? 1 : 2,
    }));
    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
    const code = rand() < 0.25 ? pick(Object.keys(COUPONS).filter((k) => k === "WELCOME10" || (k === "TATTV15" ? subtotal >= 2999 : subtotal >= 4999))) : null;
    const discount = code ? Math.round((subtotal * COUPONS[code]) / 100) : 0;
    const shipping = subtotal >= 999 ? 0 : 99;
    const gift = plan.gift !== undefined ? MESSAGES_OF_GIFTS[plan.gift] : rand() < 0.15 ? pick(MESSAGES_OF_GIFTS) : null;
    const giftFee = gift ? 99 : 0;
    const total = subtotal - discount + shipping + giftFee;

    const cod = rand() < 0.4;
    const steps = timeline(created, final);
    const status = steps.at(-1)[0];
    const reached = (s) => steps.some(([x]) => x === s);
    const payStatus = cod ? (status === "delivered" ? "paid" : status === "cancelled" ? "cod_due" : "cod_due") : status === "cancelled" ? "refunded" : "paid";
    const [courier, link] = pick(COURIERS);
    const awb = String(Math.floor(10_000_000_000 + rand() * 89_999_999_999));
    const shipped = reached("shipped");

    const seq = await db.query("SELECT nextval('order_number_seq') AS n");
    const id = `TTV-${seq.rows[0].n}`;
    await db.query(
      `INSERT INTO orders (id, token, created_at, status, email, phone, first_name, last_name, address, apartment, city, state, pin,
         subtotal, discount, discount_code, shipping, total, payment_method, payment_status, payment_id, paid_at,
         tracking_courier, tracking_number, tracking_url, stock_applied, gift_wrap, gift_occasion, gift_message)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,true,$26,$27,$28)`,
      [
        id, crypto.randomBytes(16).toString("hex"), new Date(created), status, c.email, c.phone, c.firstName, c.lastName, c.address, c.apartment, c.city, c.state, c.pin,
        subtotal, discount, code, shipping, total, cod ? "cod" : "razorpay", payStatus,
        cod ? null : "pay_demo" + crypto.randomBytes(5).toString("hex"), cod ? (status === "delivered" ? new Date(created + 3.3 * DAY) : null) : new Date(created + 60_000),
        shipped ? courier : null, shipped ? awb : null, shipped ? link(awb) : null,
        giftFee, gift?.[0] ?? "", gift?.[1] ?? "",
      ],
    );
    for (const [i, l] of lines.entries()) {
      await db.query("INSERT INTO order_items (order_id, line_no, product_slug, name, size, price, qty, image) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)", [
        id, i, l.slug, l.name, l.size, l.price, l.qty, l.image,
      ]);
    }
    for (const [s, after, note] of steps) {
      const label = s === "confirmed" ? (cod ? "Cash on delivery order placed" : "Payment received") : note;
      await db.query("INSERT INTO order_events (order_id, at, status, note, by_admin) VALUES ($1,$2,$3,$4,$5)", [id, new Date(created + after), s, label, !["pending_payment", "confirmed"].includes(s)]);
    }
    n++;
  }

  const messages = [
    [0.2, "contact", "Neha Gupta", "neha.gupta@example.com", "Ring sizing", "Hi! I usually wear a size 20 in another brand. Which TATTV size should I order for the Onyx Signet?", "new"],
    [0.6, "contact", "Kabir Singh", "kabir.singh@example.com", "Bulk order for a wedding", "Looking for 8 matching bracelets for groomsmen in December. Do you offer engraving?", "new"],
    [1.4, "return", "Rahul Nair", "rahul.nair@example.com", "Exchange request RX-482913 · order TTV-104812", "Order: TTV-104812\nItem(s): Woven Leather Bracelet\nReason: Wrong size or fit\nExchange for: Wrist L\n\nFits a little tight, would like the next size up.", "new"],
    [3.2, "contact", "Priya Menon", "priya.menon@example.com", "Gift packing", "Can I add a gift message after placing the order? It's for my brother's birthday.", "read"],
    [9, "contact", "Yash Agarwal", "yash.agarwal@example.com", "Plating care", "How should I clean the gold-plated chain so it stays shiny?", "archived"],
  ];
  for (const [age, kind, name, email, subject, body, status] of messages) {
    await db.query("INSERT INTO messages (id, created_at, kind, name, email, subject, body, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)", [
      "msg_demo" + crypto.randomBytes(4).toString("hex"), new Date(now - age * DAY), kind, name, email, subject, body, status,
    ]);
  }

  await db.query("INSERT INTO app_meta (key, value) VALUES ('demo-data', $1)", [JSON.stringify(new Date().toISOString())]);
  console.log(`Added ${n} sample orders and ${messages.length} messages.`);
} finally {
  await db.end();
}
