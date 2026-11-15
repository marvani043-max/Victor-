import Link from "next/link";
import { site } from "@/data/site";
import { Instagram, ArrowUpRight } from "./Icons";

const COLS = [
  {
    title: "Shop",
    links: [
      { href: "/shop/", label: "All products" },
      { href: "/shop/?c=hoodies", label: "Hoodies" },
      { href: "/shop/?c=zip-ups", label: "Zip-ups" },
      { href: "/shop/?c=tees", label: "Tees" },
      { href: "/shop/?c=crop-tops", label: "Crop tops" },
      { href: "/shop/?c=crewnecks", label: "Crewnecks" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/shipping-returns/", label: "Shipping & returns" },
      { href: "/shipping-returns/#faq", label: "FAQ" },
      { href: `mailto:${site.email}`, label: "Contact" },
    ],
  },
  {
    title: "Peak Side",
    links: [
      { href: "/story/", label: "Our story" },
      { href: site.instagram.url, label: `Instagram ${site.instagram.handle}`, external: true },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-ink text-bone">
      <div className="wrap pb-8 pt-20 sm:pt-28">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="label text-mist">{site.descriptor}</p>
            <p className="display mt-4 text-[15vw] leading-[0.82] sm:text-8xl lg:text-[7.5rem]">
              Mountains
              <br />
              meet <span className="text-sakura">everyday.</span>
            </p>
            <a
              href={site.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-bone mt-10"
            >
              <Instagram /> Follow {site.instagram.handle}
            </a>
          </div>
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-6 lg:col-start-7 lg:pt-4">
            {COLS.map((c) => (
              <div key={c.title}>
                <h2 className="label text-mist">{c.title}</h2>
                <ul className="mt-5 space-y-3">
                  {c.links.map((l) =>
                    "external" in l && l.external ? (
                      <li key={l.href}>
                        <a href={l.href} target="_blank" rel="noopener noreferrer" className="link-u inline-flex items-center gap-1.5 text-[15px]">
                          {l.label} <ArrowUpRight className="h-3 w-3" />
                        </a>
                      </li>
                    ) : l.href.startsWith("mailto:") ? (
                      <li key={l.href}>
                        <a href={l.href} className="link-u text-[15px]">
                          {l.label}
                        </a>
                      </li>
                    ) : (
                      <li key={l.href}>
                        <Link href={l.href} className="link-u text-[15px]">
                          {l.label}
                        </Link>
                      </li>
                    )
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-20 flex flex-col gap-4 border-t border-bone/15 pt-6 text-mist sm:flex-row sm:items-center sm:justify-between">
          <p className="label">© {new Date().getFullYear()} Peak Side</p>
          <p className="label">Secure checkout via the Peak Side store · PayPal Pay in 4 available</p>
          <a href={`mailto:${site.email}`} className="label link-u">
            {site.email}
          </a>
        </div>
      </div>
      <span aria-hidden="true" className="mask-pks pointer-events-none absolute -right-16 bottom-10 hidden h-64 w-80 text-bone/[0.04] lg:block" />
    </footer>
  );
}
