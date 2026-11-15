"use client";
import { useState } from "react";
import { site } from "@/data/site";

export default function AnnouncementBar() {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.promo.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard can be blocked (e.g. insecure context). The code is visible either way.
    }
  };
  return (
    <div className="relative z-50 bg-ink text-bone">
      <div className="wrap flex h-9 items-center justify-center gap-3 text-center">
        <p className="label text-[10px] sm:text-[11px]">
          {site.promo.label} with code <span className="text-sakura">{site.promo.code}</span>
        </p>
        <button
          type="button"
          onClick={copy}
          className="label border-b border-bone/40 text-[10px] transition-colors hover:border-sakura hover:text-sakura sm:text-[11px]"
          aria-label={`Copy discount code ${site.promo.code}`}
        >
          {copied ? "Copied ✓" : "Copy"}
        </button>
        <span className="sr-only" aria-live="polite">
          {copied ? "Code copied to clipboard" : ""}
        </span>
      </div>
    </div>
  );
}
