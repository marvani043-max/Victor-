import type { Metadata } from "next";
import Accordion from "@/components/Accordion";
import { FAQ } from "@/data/faq";
import { site } from "@/data/site";
import { Arrow } from "@/components/Icons";

export const metadata: Metadata = {
  title: "Shipping, Returns & FAQ",
  description: `Peak Side orders ship in ${site.policies.processing} with tracking. Returns and exchanges within ${site.policies.returnWindow} of delivery. Answers to common questions about sizing, payment and orders.`,
  alternates: { canonical: "/shipping-returns/" },
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

const SHIPPING = [
  `Orders are typically processed within ${site.policies.processing}.`,
  "Once your order ships, you'll receive an email with your tracking information.",
  "Shipping times vary with your location and the shipping method selected at checkout. Delays caused by carriers, weather, holidays or other circumstances outside our control may occur.",
  "Please make sure your shipping address is correct before placing your order. Peak Side is not responsible for orders shipped to an incorrect address provided at checkout.",
  "If your package is marked as delivered but you can't find it, please contact the shipping carrier first.",
];

const RETURNS = [
  `We accept returns and exchanges within ${site.policies.returnWindow} of delivery.`,
  "Items must be unworn and unused, unwashed, in original condition, and have original tags attached.",
  "Sale and final-sale items cannot be returned or exchanged.",
  "Customers are responsible for return shipping costs unless the item was damaged, defective, or the wrong item was sent.",
  `If you received a damaged or incorrect item, contact us within ${site.policies.damageWindow} of delivery with your order number and photos of the item.`,
  "Once your return is received and approved, your refund will be sent to your original payment method.",
];

export default function ShippingPage() {
  return (
    <div className="wrap pb-28 pt-10 sm:pt-16">
      <h1 className="display text-[17vw] sm:text-[8rem] lg:text-[10rem]">
        Shipping
        <br />& returns
      </h1>

      <div className="mt-10 grid grid-cols-1 gap-px bg-ink/15 sm:grid-cols-3">
        {[
          [site.policies.processing, "Processing time"],
          [site.policies.returnWindow, "Returns & exchanges"],
          [site.promo.code, "Free shipping code"],
        ].map(([v, l]) => (
          <div key={l} className="bg-bone py-6 sm:px-6 sm:first:pl-0">
            <p className="display text-4xl sm:text-5xl">{v}</p>
            <p className="label mt-2 text-granite">{l}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 grid gap-16 lg:grid-cols-2">
        {[
          ["Shipping policy", SHIPPING],
          ["Return & exchange policy", RETURNS],
        ].map(([title, items]) => (
          <section key={title as string} aria-labelledby={(title as string).replace(/\W/g, "")}>
            <h2 id={(title as string).replace(/\W/g, "")} className="label border-b border-ink pb-3 text-[12px]">
              {title as string}
            </h2>
            <ol className="mt-2">
              {(items as string[]).map((t, i) => (
                <li key={i} className="flex gap-5 border-b border-ink/10 py-4 text-[16px] leading-relaxed">
                  <span className="font-mono text-[12px] text-granite">{String(i + 1).padStart(2, "0")}</span>
                  <span>{t}</span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <section id="faq" className="mt-24 grid scroll-mt-28 gap-10 lg:grid-cols-12" aria-labelledby="faq-title">
        <div className="lg:col-span-4">
          <h2 id="faq-title" className="display text-6xl sm:text-8xl">
            FAQ
          </h2>
          <p className="mt-4 max-w-xs text-[15px] leading-relaxed text-ink/70">Can&apos;t find your answer? Email us and we&apos;ll get back to you.</p>
          <a href={`mailto:${site.email}`} className="btn-ink mt-6">
            Email Peak Side <Arrow />
          </a>
        </div>
        <div className="border-t border-ink/15 lg:col-span-8">
          {FAQ.map((f) => (
            <Accordion key={f.q} title={f.q}>
              <p>{f.a}</p>
            </Accordion>
          ))}
        </div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
    </div>
  );
}
