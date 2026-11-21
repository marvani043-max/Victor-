"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Img, { imageMeta } from "./Img";
import Accordion from "./Accordion";
import { Arrow, ArrowUpRight } from "./Icons";
import { type Product, formatPrice, categoryLabel } from "@/data/products";
import { site, storeProductUrl, restockMailto, STORE_URL } from "@/data/site";
import Link from "next/link";
import { imageSrc } from "./Img";

export default function ProductDetail({ product }: { product: Product }) {
  const [ci, setCi] = useState(0);
  const [slide, setSlide] = useState(0);
  const colorway = product.colorways[ci];
  const images = colorway.images;
  const rail = useRef<HTMLDivElement>(null);
  const cta = useRef<HTMLDivElement>(null);
  const [showBar, setShowBar] = useState(false);
  const spin = colorway.spin;
  const [mview, setMview] = useState<"spin" | "photos">(spin ? "spin" : "photos");

  useEffect(() => {
    setSlide(0);
    rail.current?.scrollTo({ left: 0 });
    setMview(product.colorways[ci].spin ? "spin" : "photos");
  }, [ci, product]);

  const spinEl = spin ? (
    <ps-spin
      front={imageSrc(`${spin.front}-cut`, 1200)}
      back={imageSrc(`${spin.back}-cut`, 1200)}
      label={`${product.name} in ${colorway.name}`}
      word={categoryLabel(product.category)}
      className="absolute inset-0"
    />
  ) : null;
  // On desktop the spin viewer replaces the first (front) studio shot.
  const deskImages = spin ? images.filter((n) => n !== spin.front) : images;

  useEffect(() => {
    const el = cta.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowBar(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const onScroll = () => {
    const el = rail.current;
    if (!el) return;
    setSlide(Math.round(el.scrollLeft / el.clientWidth));
  };

  const buyHref = storeProductUrl(product.storeSlug);
  const alt = (name: string, i: number) =>
    `${product.name} in ${colorway.name}${imageMeta(name)?.kind === "studio" ? (i === 1 ? ", back view" : ", product view") : ", worn"}`;

  const Primary = ({ compact = false }: { compact?: boolean }) =>
    product.comingSoon ? (
      <a href={product.storeSlug ? buyHref : `${STORE_URL}/`} className={`btn-ink w-full ${compact ? "py-3.5" : "py-5"}`}>
        Pre-order <span className="opacity-60">·</span> {product.price === null ? "Peak Side store" : formatPrice(product.price)} <ArrowUpRight />
      </a>
    ) : product.inStock ? (
      <a href={buyHref} className={`btn-ink w-full ${compact ? "py-3.5" : "py-5"}`}>
        Choose size &amp; checkout <span className="opacity-60">·</span> {formatPrice(product.price)}
        <Arrow />
      </a>
    ) : (
      <a href={restockMailto(product.name)} className={`btn-ink w-full ${compact ? "py-3.5" : "py-5"}`}>
        Email me when it&apos;s back <Arrow />
      </a>
    );

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
        {/* Gallery */}
        <div className="lg:col-span-7">
          {/* Mobile: 360° viewer or swipe rail */}
          {spin && (
            <div role="tablist" aria-label="Gallery view" className="mb-3 inline-flex border border-ink/15 p-1 lg:hidden">
              {(["spin", "photos"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  role="tab"
                  aria-selected={mview === v}
                  onClick={() => setMview(v)}
                  className={`label px-4 py-2.5 transition-colors ${mview === v ? "bg-ink text-bone" : ""}`}
                >
                  {v === "spin" ? "360° spin" : `Photos (${images.length})`}
                </button>
              ))}
            </div>
          )}
          {spin && mview === "spin" && <div className="relative -mx-4 aspect-[4/5] sm:-mx-6 lg:hidden">{spinEl}</div>}
          <div className={`relative -mx-4 sm:-mx-6 lg:hidden ${spin && mview === "spin" ? "hidden" : ""}`}>
            <div ref={rail} onScroll={onScroll} className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto" aria-label="Product images" tabIndex={0}>
              {images.map((name, i) => {
                const studio = imageMeta(name)?.kind === "studio";
                return (
                  <div key={name} className={`relative aspect-[4/5] w-full shrink-0 snap-center ${studio ? "bg-stone" : "bg-coal"}`}>
                    <Img name={name} alt={alt(name, i)} priority={i === 0} sizes="100vw" className={`absolute inset-0 h-full w-full ${studio ? "object-contain p-[10%]" : "object-cover"}`} />
                  </div>
                );
              })}
            </div>
            <div className="pointer-events-none absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
              {images.map((_, i) => (
                <span key={i} className={`h-[3px] transition-all duration-300 ${i === slide ? "w-6 bg-ink" : "w-3 bg-ink/25"}`} />
              ))}
            </div>
          </div>
          {/* Desktop: editorial stack */}
          <AnimatePresence mode="wait">
            <motion.div
              key={colorway.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="hidden grid-cols-2 gap-3 lg:grid"
            >
              {spin && <div className="relative col-span-2 aspect-[5/6]">{spinEl}</div>}
              {deskImages.map((name, j) => {
                const i = images.indexOf(name);
                const studio = imageMeta(name)?.kind === "studio";
                const full = spin ? deskImages.length % 2 === 1 && j === deskImages.length - 1 : i === 0 || (images.length % 2 === 0 && i === images.length - 1);
                return (
                  <div key={name} className={`relative overflow-hidden ${full ? "col-span-2 aspect-[5/6]" : "aspect-[4/5]"} ${studio ? "bg-stone" : "bg-coal"}`}>
                    <Img
                      name={name}
                      alt={alt(name, i)}
                      priority={i === 0}
                      sizes={full ? "58vw" : "29vw"}
                      className={`absolute inset-0 h-full w-full ${studio ? "object-contain p-[9%]" : "object-cover"}`}
                    />
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Buy panel */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
            <p className="label text-granite">
              {product.collection ? `${product.collection} · ` : ""}
              {categoryLabel(product.category)}
            </p>
            <h1 className="display mt-3 text-[12vw] sm:text-7xl lg:text-[4.25rem]">{product.name}</h1>
            <div className="mt-5 flex items-center gap-4">
              <p className={`font-mono text-xl ${product.inStock || product.comingSoon ? "" : "text-granite line-through"}`}>{formatPrice(product.price)}</p>
              {product.comingSoon && <span className="label bg-sakura px-2 py-1 text-ink">Pre-order</span>}
              {!product.inStock && !product.comingSoon && <span className="label bg-ink px-2 py-1 text-bone">Sold out</span>}
              {product.badge && <span className="label bg-sakura px-2 py-1">{product.badge}</span>}
            </div>
            {(product.inStock || product.comingSoon) && product.price !== null && (
              <p className="mt-2 text-[13px] text-granite">
                Or 4 interest-free payments of {formatPrice(Math.ceil((product.price / 4) * 100) / 100)} with PayPal at checkout.
              </p>
            )}

            <p className="mt-6 max-w-md text-[16px] leading-relaxed">{product.description ?? product.summary}</p>

            {/* Colour */}
            <fieldset className="mt-8">
              <legend className="label">
                Colour <span className="text-granite">— {colorway.name}</span>
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {product.colorways.map((c, i) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setCi(i)}
                    aria-pressed={i === ci}
                    aria-label={c.name}
                    className={`flex items-center gap-2 border px-3 py-2 transition-colors ${i === ci ? "border-ink" : "border-ink/15 hover:border-ink/50"}`}
                  >
                    <span className="h-4 w-4 rounded-full ring-1 ring-ink/20" style={{ background: c.swatch }} />
                    <span className="text-[13px]">{c.name}</span>
                  </button>
                ))}
              </div>
            </fieldset>

            {/* Sizes */}
            {product.sizes.length > 0 && (
              <div className="mt-7">
                <p className="label">Available sizes</p>
                <ul className="mt-3 flex flex-wrap gap-2" aria-label="Available sizes">
                  {product.sizes.map((s) => (
                    <li key={s} className="flex h-11 min-w-[3rem] items-center justify-center border border-ink/15 px-3 font-mono text-[13px]">
                      {s}
                    </li>
                  ))}
                </ul>
                {product.fit && <p className="mt-3 text-[13px] font-medium">Fit note: {product.fit}</p>}
              </div>
            )}

            <div ref={cta} className="mt-8">
              <Primary />
              <p className="mt-3 text-[12px] leading-relaxed text-granite">
                {product.comingSoon ? (
                  <>
                    Part of the new Winter Drop, available to pre-order. Opens the official Peak Side store, where you pick your size and pay. Use code{" "}
                    <span className="font-mono text-ink">{site.promo.code}</span> for free shipping.
                  </>
                ) : product.inStock ? (
                  <>
                    You&apos;ll pick your size and pay on the official Peak Side store. Use code{" "}
                    <span className="font-mono text-ink">{site.promo.code}</span> for free shipping.
                  </>
                ) : (
                  <>
                    This opens an email to Peak Side asking to be told about the restock. Or follow{" "}
                    <a className="underline" href={site.instagram.url} target="_blank" rel="noopener noreferrer">
                      {site.instagram.handle}
                    </a>{" "}
                    for drop announcements.
                  </>
                )}
              </p>
            </div>

            <div className="mt-8 border-t border-ink/15">
              <Accordion title="Details" open>
                <p>{product.summary}</p>
                {/* PLACEHOLDER — fabric composition, weight and care were not published on the store. */}
                <p className="mt-3 border-l-2 border-sakura pl-3 text-[13px] text-granite">
                  {product.comingSoon && product.price === null ? "Price, sizes, fabric and care instructions" : "Fabric, weight and care instructions"}: to be supplied by Peak Side.
                </p>
              </Accordion>
              <Accordion title="Fit & sizing">
                <p>{product.fit ?? "See the size chart on the checkout page for measurements."}</p>
                <p className="mt-3 border-l-2 border-sakura pl-3 text-[13px] text-granite">
                  Measured size chart (chest, length, sleeve in inches): to be supplied by Peak Side.
                </p>
              </Accordion>
              <Accordion title="Shipping & returns">
                <p>
                  Orders are processed within {site.policies.processing}, with tracking emailed when your order ships. Returns and
                  exchanges are accepted within {site.policies.returnWindow} of delivery on unworn, unwashed items with tags attached.
                </p>
                <Link href="/shipping-returns/" className="link-u mt-3 inline-flex items-center gap-1.5 font-medium">
                  Full policy <ArrowUpRight className="h-3 w-3" />
                </Link>
              </Accordion>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky buy bar */}
      <AnimatePresence>
        {showBar && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-bone/95 p-3 backdrop-blur lg:hidden"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            <Primary compact />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
