import type { Metadata } from "next";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, formatPrice } from "@/lib/format";
import { CONTACT } from "@/lib/site";

export const metadata: Metadata = {
  title: "Client Care",
  description: "Shipping, returns, size guide, jewellery care and contact details for TATTV.",
};

const RING_SIZES = [
  ["8", "15.3", "48.0"],
  ["10", "15.9", "50.0"],
  ["12", "16.5", "51.9"],
  ["14", "17.2", "54.0"],
  ["16", "17.8", "55.9"],
  ["18", "18.5", "58.1"],
  ["20", "19.1", "60.0"],
  ["22", "19.8", "62.2"],
  ["24", "20.4", "64.1"],
];

const CHAIN_LENGTHS = [
  ['18"', "Sits at the base of the neck, like a choker on most men"],
  ['20"', "Falls just below the collarbone; our most popular length"],
  ['22"', "Sits at the upper chest; ideal for pendants over a shirt"],
  ['24"', "Falls mid-chest; best for layering"],
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 border-t border-line py-12">
      <h2 className="title text-lg md:text-xl">{title}</h2>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-ink/75">{children}</div>
    </section>
  );
}

export default function HelpPage() {
  return (
    <div className="container-x grid gap-12 py-16 lg:grid-cols-12">
      <aside className="lg:col-span-3">
        <div className="lg:sticky lg:top-28">
          <h1 className="title text-xl md:text-2xl">Client Care</h1>
          <nav className="mt-8 flex flex-wrap gap-x-6 gap-y-3 lg:flex-col" aria-label="Help topics">
            {[
              ["shipping", "Shipping"],
              ["returns", "Returns & Exchanges"],
              ["size-guide", "Size Guide"],
              ["care", "Jewellery Care"],
              ["contact", "Contact Us"],
            ].map(([id, label]) => (
              <a key={id} href={`#${id}`} className="eyebrow link-underline w-fit">
                {label}
              </a>
            ))}
          </nav>
        </div>
      </aside>
      <div className="lg:col-span-8 lg:col-start-5">
        <Section id="shipping" title="Shipping">
          <p>
            We ship across India with fully insured courier partners. Orders above {formatPrice(FREE_SHIPPING_THRESHOLD)} ship free; a flat {formatPrice(SHIPPING_FEE)} applies
            otherwise.
          </p>
          <p>Orders are dispatched within 24 hours. Metro cities: 2–3 business days. Rest of India: 4–6 business days.</p>
        </Section>
        <Section id="returns" title="Returns & Exchanges">
          <p>Not quite right? Return or exchange unworn pieces in original packaging within 15 days of delivery. We&apos;ll arrange a free pickup.</p>
          <p>Engraved and personalised pieces are final sale. Refunds are processed to the original payment method within 5–7 business days.</p>
        </Section>
        <Section id="size-guide" title="Size Guide">
          <h3 className="eyebrow pt-2 text-ink">Rings (Indian sizing)</h3>
          <div className="overflow-x-auto">
            <table className="w-full max-w-lg text-left">
              <thead>
                <tr className="border-b border-ink">
                  <th className="py-2 font-medium">Size</th>
                  <th className="py-2 font-medium">Diameter (mm)</th>
                  <th className="py-2 font-medium">Circumference (mm)</th>
                </tr>
              </thead>
              <tbody>
                {RING_SIZES.map(([s, d, c]) => (
                  <tr key={s} className="border-b border-line">
                    <td className="py-2">{s}</td>
                    <td className="py-2">{d}</td>
                    <td className="py-2">{c}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3 className="eyebrow pt-6 text-ink">Chain Lengths</h3>
          <ul className="space-y-2">
            {CHAIN_LENGTHS.map(([len, desc]) => (
              <li key={len}>
                <span className="inline-block w-12 font-medium text-ink">{len}</span> {desc}
              </li>
            ))}
          </ul>
          <h3 className="eyebrow pt-6 text-ink">Bracelets</h3>
          <p>Sizes refer to bracelet length. Measure your wrist snugly and add about ½&quot; for a comfortable fit: S (7&quot;) suits a 6.5&quot; wrist, M (7.5&quot;) a 7&quot; wrist, L (8&quot;) a 7.5&quot; wrist and XL (8.5&quot;) an 8&quot; wrist.</p>
        </Section>
        <Section id="care" title="Jewellery Care">
          <p>Store each piece in its TATTV pouch and wipe it with a soft, dry cloth after wearing to keep the finish bright.</p>
          <p>Remove jewellery before swimming, showering, exercising or applying fragrance. Leather should be kept dry and conditioned occasionally.</p>
          <p>Something not looking its best? Get in touch and we will help you care for it.</p>
        </Section>
        <Section id="contact" title="Contact Us">
          <p>Our client care team is available Monday to Saturday, 10am to 7pm IST.</p>
          <p>
            Email: <a href={`mailto:${CONTACT.email}`} className="text-ink underline underline-offset-4">{CONTACT.email}</a>
            <br />
            WhatsApp / Call: <a href={`https://wa.me/${CONTACT.whatsapp}`} className="text-ink underline underline-offset-4">{CONTACT.phoneDisplay}</a>
          </p>
        </Section>
      </div>
    </div>
  );
}
