"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Logo from "./Logo";
import { Instagram, Arrow } from "./Icons";
import { site } from "@/data/site";

const NAV = [
  { href: "/shop/", label: "Shop all" },
  { href: "/shop/?c=hoodies", label: "Hoodies" },
  { href: "/shop/?c=tees", label: "Tees" },
  { href: "/shop/?c=crop-tops", label: "Crop tops" },
  { href: "/story/", label: "Story" },
];

export default function Header() {
  const pathname = usePathname();
  const overlay = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  const clear = overlay && !scrolled && !open;

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-[background-color,color,box-shadow] duration-500 ease-out ${
          clear ? "text-bone" : "bg-bone/90 text-ink shadow-[0_1px_0_rgba(17,17,15,0.08)] backdrop-blur-md"
        } ${overlay ? "-mb-[var(--header-h)]" : ""}`}
        style={{ height: "var(--header-h)" }}
      >
        <div className="wrap flex h-full items-center justify-between">
          <Logo />
          <nav aria-label="Main" className="hidden items-center gap-8 lg:flex">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="label link-u pb-0.5">
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <a
              href={site.instagram.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Peak Side on Instagram"
              className="hidden transition-opacity hover:opacity-60 sm:block"
            >
              <Instagram />
            </a>
            <Link
              href="/shop/"
              className={`hidden px-4 py-2.5 font-mono text-[11px] uppercase tracking-label transition-colors sm:inline-flex ${
                clear ? "bg-bone text-ink hover:bg-sakura" : "bg-ink text-bone hover:bg-bloom"
              }`}
            >
              Shop now
            </Link>
            <button
              type="button"
              className="label flex h-10 items-center gap-2 lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
            >
              <span>{open ? "Close" : "Menu"}</span>
              <span aria-hidden="true" className="relative block h-2.5 w-5">
                <span className={`absolute left-0 top-0 h-px w-full bg-current transition-transform duration-300 ${open ? "translate-y-[5px] rotate-45" : ""}`} />
                <span className={`absolute bottom-0 left-0 h-px w-full bg-current transition-transform duration-300 ${open ? "-translate-y-[4px] -rotate-45" : ""}`} />
              </span>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="fixed inset-x-0 bottom-0 z-30 flex flex-col bg-bone lg:hidden"
            style={{ top: "var(--header-h)" }}
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <nav aria-label="Mobile" className="wrap flex flex-1 flex-col justify-center gap-1">
              {[...NAV, { href: "/shipping-returns/", label: "Shipping & returns" }].map((n, i) => (
                <motion.div
                  key={n.href}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + i * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link href={n.href} className="display flex items-center justify-between border-b border-ink/10 py-3 text-[13vw] sm:text-7xl">
                    {n.label}
                    <Arrow className="h-5 w-5" />
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div className="wrap flex items-center justify-between py-6">
              <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="label flex items-center gap-2">
                <Instagram /> {site.instagram.handle}
              </a>
              <a href={`mailto:${site.email}`} className="label">
                Email us
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
