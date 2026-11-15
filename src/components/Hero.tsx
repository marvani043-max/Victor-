"use client";
import Link from "next/link";
import { useState } from "react";
import { motion } from "framer-motion";
import Img from "./Img";
import { Arrow } from "./Icons";
import { HERO_VIDEO } from "@/data/site";

const PANELS = [
  { key: "trail", label: "01 — Trail", image: "trail-falls-front", alt: "Wearing the black Summer Edition tee in front of a mountain waterfall", pos: "28% 40%" },
  { key: "tunnel", label: "02 — Tunnel", image: "tunnel-pink-hoodie", alt: "Two friends in Peak Side hoodies against a graffiti wall", pos: "62% 30%" },
];

const ease = [0.22, 1, 0.36, 1] as const;

export default function Hero() {
  const [hot, setHot] = useState<string | null>(null);
  return (
    <section className="relative h-[100svh] min-h-[600px] overflow-hidden bg-ink text-bone" aria-label="Peak Side">
      {HERO_VIDEO ? (
        <div className="absolute inset-0">
          <Img name={HERO_VIDEO.poster} alt="" priority className="absolute inset-0 h-full w-full object-cover" />
          <video
            className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
            src={HERO_VIDEO.src}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          />
        </div>
      ) : (
        <div className="absolute inset-0 flex">
          {PANELS.map((p, i) => (
            <motion.div
              key={p.key}
              className="relative h-full overflow-hidden"
              initial={{ clipPath: i === 0 ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)" }}
              animate={{ clipPath: "inset(0 0% 0 0%)", flexGrow: hot === null ? 1 : hot === p.key ? 1.45 : 0.55 }}
              transition={{ clipPath: { duration: 1.2, ease, delay: 0.1 + i * 0.12 }, flexGrow: { duration: 0.9, ease } }}
              style={{ flexBasis: 0 }}
              onMouseEnter={() => setHot(p.key)}
              onMouseLeave={() => setHot(null)}
            >
              <motion.div className="absolute inset-0" initial={{ scale: 1.18 }} animate={{ scale: 1 }} transition={{ duration: 2.2, ease, delay: 0.1 }}>
                <Img name={p.image} alt={p.alt} priority sizes="(min-width:1024px) 70vw, 50vw" className="h-full w-full object-cover" style={{ objectPosition: p.pos }} />
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-ink/40" />
              <p className="label absolute top-[calc(var(--header-h)+1.25rem)] text-bone/80" style={i === 0 ? { left: "1rem" } : { right: "1rem" }}>
                {p.label}
              </p>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grain pointer-events-none absolute inset-0" />

      <div className="wrap pointer-events-none relative flex h-full flex-col justify-end pb-10 sm:pb-14">
        <h1 className="display text-[19vw] sm:text-[15vw] lg:text-[11.5vw] 2xl:text-[10rem]">
          {["Mountains", "meet everyday."].map((line, i) => (
            <span key={line} className="block overflow-hidden pb-[0.04em]">
              <motion.span
                className="block"
                initial={{ y: "105%" }}
                animate={{ y: 0 }}
                transition={{ duration: 1.1, ease, delay: 0.55 + i * 0.12 }}
              >
                {i === 1 ? (
                  <>
                    meet <span className="text-sakura">everyday.</span>
                  </>
                ) : (
                  line
                )}
              </motion.span>
            </span>
          ))}
        </h1>
        <motion.div
          className="pointer-events-auto mt-5 flex flex-col gap-5 sm:mt-8 sm:gap-6 lg:flex-row lg:items-end lg:justify-between"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease, delay: 1 }}
        >
          <p className="max-w-md text-[15px] leading-relaxed text-bone/85 sm:text-[17px]">
            Heavyweight hoodies, Summer Edition tees and crop tops for days that start on a trail and end in town.
          </p>
          <div className="flex gap-3">
            <Link href="/shop/" className="btn-bone px-5 sm:px-6">
              Shop<span className="hidden sm:inline"> the collection</span> <Arrow />
            </Link>
            <Link href="/story/" className="btn border border-bone/50 px-5 text-bone hover:border-bone hover:bg-bone hover:text-ink sm:px-6">
              Our story
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
