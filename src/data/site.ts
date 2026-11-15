// Single source of truth for business facts.
// Everything here was taken from the live peak-side.com store (Nov 2026).
// Anything not verified is marked TODO and must be confirmed with Peak Side before launch.

/** Sub-folder the site is served from ("" at a domain root, "/Victor-" on GitHub Pages). */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.peak-side.com").replace(/\/$/, "");

// Checkout lives on the existing Wix store. Product buttons send shoppers to
// `${STORE_URL}/product-page/<storeSlug>` where size, colour and payment are handled.
// If this front-end takes over the main domain, move the Wix store to a subdomain
// (e.g. shop.peak-side.com) and update NEXT_PUBLIC_STORE_URL.
// Preview/staging builds: set NEXT_PUBLIC_NOINDEX=1 so search engines ignore the copy.
export const NOINDEX = process.env.NEXT_PUBLIC_NOINDEX === "1";

export const STORE_URL = (process.env.NEXT_PUBLIC_STORE_URL || "https://www.peak-side.com").replace(/\/$/, "");

export const site = {
  name: "Peak Side",
  tagline: "Mountains meet everyday.",
  descriptor: "an outdoor brand",
  description:
    "Peak Side makes heavyweight hoodies, Summer Edition tees and crop tops for days that start on a trail and end in town. An outdoor clothing brand started by a 16-year-old.",
  // Published on the live store's footer. TODO: recommend a brand address (e.g. hello@peak-side.com).
  email: "adnelson2010@outlook.com",
  instagram: { handle: "@peak.side", url: "https://www.instagram.com/peak.side" },
  // Live on peak-side.com as of 15 Nov 2026. TODO: confirm expiry with Peak Side.
  promo: { code: "FREESHIP2026", label: "Free shipping" },
  // TODO: location not published. Add city/region for local SEO once confirmed.
  location: null as string | null,
  policies: {
    processing: "2–5 business days",
    returnWindow: "30 days",
    damageWindow: "7 days",
  },
} as const;

export const storeProductUrl = (storeSlug: string) => `${STORE_URL}/product-page/${storeSlug}`;

export const restockMailto = (productName: string) =>
  `mailto:${site.email}?subject=${encodeURIComponent(`Restock alert: ${productName}`)}&body=${encodeURIComponent(
    `Hi Peak Side,\n\nPlease let me know when the ${productName} is back in stock.\n\nSize I'm after: \n\nThanks!`
  )}`;

// Optional cinematic hero. Set to { src: "/video/hero.mp4", poster: "<image-manifest name>" }
// once a Higgsfield (or other) hero film is produced. See docs/HIGGSFIELD-PROMPTS.md.
export const HERO_VIDEO: { src: string; poster: string } | null = null;
