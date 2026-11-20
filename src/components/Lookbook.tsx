"use client";
import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Img from "./Img";
import { Arrow } from "./Icons";
import { getProduct, formatPrice } from "@/data/products";

type Look = { image: string; alt: string; product: string };
const SETS: Record<"trail" | "tunnel", { title: string; line: string; looks: Look[] }> = {
  trail: {
    title: "Trail",
    line: "Granite, spray and switchbacks. Tees that handle the climb and still look right at the top.",
    looks: [
      { image: "trail-falls-back", alt: "Back of the black boxy Summer Edition tee beside a waterfall", product: "black-boxy-summer-edition-tee" },
      { image: "trail-overlook", alt: "White Summer Edition tee at a canyon overlook", product: "white-summer-edition-tee" },
      { image: "trail-ridge", alt: "White Summer Edition tee on a granite boulder above the treeline", product: "white-summer-edition-tee" },
      { image: "trail-falls-wide", alt: "Black boxy tee at the base of a waterfall", product: "black-boxy-summer-edition-tee" },
    ],
  },
  tunnel: {
    title: "Tunnel",
    line: "Back in town: graffiti walls, late light, the whole crew. Same clothes, different backdrop.",
    looks: [
      { image: "tunnel-crop-duo-2", alt: "Two friends in black off-shoulder crop tops against graffiti", product: "black-off-shoulder-crop-top" },
      { image: "tunnel-zip-black-2", alt: "Black double zip hoodie worn in a graffiti tunnel", product: "double-zip-hoodie" },
      { image: "tunnel-tee-black-back", alt: "Back print of the black Summer Edition tee", product: "black-summer-edition-tee" },
      { image: "tunnel-crop-white", alt: "White off-shoulder crop top in a graffiti tunnel", product: "white-off-shoulder-crop-top" },
    ],
  },
};

export default function Lookbook() {
  const [tab, setTab] = useState<"trail" | "tunnel">("trail");
  const set = SETS[tab];
  return (
    <section className="bg-ink py-20 text-bone sm:py-28" aria-labelledby="lookbook-title">
      <div className="wrap">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="label text-mist">The lookbook</p>
            <h2 id="lookbook-title" className="display mt-4 text-[16vw] sm:text-8xl lg:text-[8.5rem]">
              Two places.
              <br />
              One wardrobe.
            </h2>
          </div>
          <div className="max-w-sm">
            <div role="tablist" aria-label="Lookbook location" className="inline-flex border border-bone/25 p-1">
              {(Object.keys(SETS) as ("trail" | "tunnel")[]).map((k) => (
                <button
                  key={k}
                  role="tab"
                  type="button"
                  id={`tab-${k}`}
                  aria-selected={tab === k}
                  aria-controls="lookbook-panel"
                  onClick={() => setTab(k)}
                  className="label relative px-6 py-3"
                >
                  {tab === k && <motion.span layoutId="lb-pill" className="absolute inset-0 bg-bone" transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} />}
                  <span className={`relative transition-colors duration-300 ${tab === k ? "text-ink" : ""}`}>{SETS[k].title}</span>
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.p key={tab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="mt-5 text-[15px] leading-relaxed text-bone/75">
                {set.line}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div id="lookbook-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} className="mt-12">
          <AnimatePresence mode="wait">
            <motion.ul key={tab} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-12 lg:gap-4 lg:overflow-visible lg:px-0">
              {set.looks.map((l, i) => {
                const p = getProduct(l.product)!;
                const span = ["lg:col-span-5 lg:row-span-2", "lg:col-span-4", "lg:col-span-3 lg:mt-24", "lg:col-span-7"][i];
                const aspect = ["aspect-[3/4] lg:aspect-auto lg:h-full", "aspect-[3/4]", "aspect-[3/4]", "aspect-[3/4] lg:aspect-[16/10]"][i];
                return (
                  <motion.li
                    key={l.image}
                    className={`w-[78vw] shrink-0 snap-start sm:w-[46vw] lg:w-auto ${span}`}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20, transition: { duration: 0.25 } }}
                    transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: i * 0.07 }}
                  >
                    <Link href={`/shop/${p.slug}/`} className="group relative block h-full overflow-hidden bg-coal">
                      <div className={`relative ${aspect}`}>
                        <Img name={l.image} alt={l.alt} sizes="(min-width:1024px) 40vw, 78vw" className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105" />
                      </div>
                      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-ink/85 to-transparent p-4 pt-16">
                        <div>
                          <p className="label text-[10px] text-mist">Wearing</p>
                          <p className="mt-1 text-[14px] font-medium">{p.name}</p>
                        </div>
                        <span className="flex items-center gap-2 font-mono text-[12px]">
                          {formatPrice(p.price)}
                          <span className="grid h-8 w-8 place-items-center bg-bone text-ink transition-colors group-hover:bg-sakura">
                            <Arrow />
                          </span>
                        </span>
                      </div>
                    </Link>
                  </motion.li>
                );
              })}
            </motion.ul>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
