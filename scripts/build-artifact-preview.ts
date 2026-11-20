// Builds a self-contained, single-page preview of the site for sharing as a Claude Artifact.
// Same design, data and photos as the Next.js site, but plain HTML + a little vanilla JS,
// hash-routed views (#shop, #story, #product-<slug>…) and relative image paths.
//
//   npx tsx scripts/build-artifact-preview.ts   →  preview/index.html + preview/images/*
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { products, CATEGORIES, bestSellers, relatedTo, formatPrice, categoryLabel, categoryPlural, getProduct, winterDrop, featuredRank, sortablePrice, type Product } from "../src/data/products";
import { site, storeProductUrl, restockMailto } from "../src/data/site";
import { FAQ } from "../src/data/faq";
import manifestJson from "../src/data/image-manifest.json";
import { spinItems, fitFinderData, jsonForScript } from "../src/data/interactive";
import { buildSync } from "esbuild";

type Entry = { w: number; h: number; kind: string; widths: number[] };
const M = manifestJson as Record<string, Entry>;
const OUT = path.resolve("preview");
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, "images"), { recursive: true });

const used = new Map<string, number>(); // name -> width used
const pick = (name: string, target: number) => {
  const e = M[name];
  if (!e) throw new Error("missing image " + name);
  const w = e.widths.find((x) => x >= target) ?? e.widths[e.widths.length - 1];
  used.set(`${name}-${w}`, w);
  return `images/${name}-${w}.webp`;
};
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const img = (name: string, alt: string, cls = "", opts: { big?: boolean; eager?: boolean; style?: string; blend?: boolean } = {}) => {
  const e = M[name];
  const studio = e.kind === "studio" && opts.blend !== false;
  return `<img src="${pick(name, opts.big ? 1600 : 960)}" width="${e.w}" height="${e.h}" alt="${esc(alt)}" loading="${opts.eager ? "eager" : "lazy"}" decoding="async" class="${studio ? "studio " : ""}${cls}"${opts.style ? ` style="${opts.style}"` : ""}>`;
};

const arrow = `<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" class="h-3.5 w-3.5"><path d="M1 8h13M9 3l5 5-5 5" stroke="currentColor" stroke-width="1.5"/></svg>`;
const arrowUR = `<svg viewBox="0 0 16 16" fill="none" aria-hidden="true" class="h-3 w-3"><path d="M4 12L12 4M5 4h7v7" stroke="currentColor" stroke-width="1.5"/></svg>`;
const ig = (c = "h-4 w-4") => `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" class="${c}"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.6"/><circle cx="17.3" cy="6.7" r="1.1" fill="currentColor"/></svg>`;
const plus = `<svg viewBox="0 0 12 12" fill="none" aria-hidden="true" class="h-3 w-3 transition-transform duration-300 group-open:rotate-45"><path d="M6 0v12M0 6h12" stroke="currentColor" stroke-width="1.4"/></svg>`;
const ridge = (c: string) => `<svg viewBox="0 0 96 12" fill="none" aria-hidden="true" class="${c}" preserveAspectRatio="none"><path d="M0 11 L18 6 L27 9 L44 1 L58 8 L66 5 L80 10 L96 7" stroke="currentColor" stroke-width="1.25" vector-effect="non-scaling-stroke"/></svg>`;
const ext = `target="_blank" rel="noopener noreferrer"`;

// ---------- shared pieces ----------
const card = (p: Product, showBest = true) => {
  const first = p.colorways[0].images[0];
  const hover = p.lifestyle ?? p.colorways[0].images[1];
  const studio = M[first].kind === "studio";
  const badges = [
    p.comingSoon ? `<span class="label bg-sakura px-2 py-1 text-[10px] text-ink"><span class="hidden sm:inline">Winter drop · </span>Coming soon</span>` : "",
    !p.inStock && !p.comingSoon ? `<span class="label bg-ink px-2 py-1 text-[10px] text-bone">Sold out</span>` : "",
    p.badge ? `<span class="label bg-sakura px-2 py-1 text-[10px] text-ink">${p.badge}</span>` : "",
    showBest && p.inStock && p.bestSeller && !p.badge ? `<span class="label bg-bone/90 px-2 py-1 text-[10px] text-ink">Best seller</span>` : "",
  ].join("");
  const dots =
    p.colorways.length > 1
      ? `<div class="mt-2 flex items-center gap-1.5">${p.colorways.map((c) => `<span title="${c.name}" class="h-2.5 w-2.5 rounded-full ring-1 ring-ink/15" style="background:${c.swatch}"></span>`).join("")}<span class="label ml-1 text-[10px] text-granite">${p.colorways.length} colours</span></div>`
      : "";
  const spin = p.colorways[0].spin;
  // Prefer a transparent cut-out when one exists (multiply can render blank under the snow canvas).
  const cut = !spin && M[`${first}-cut`] ? `${first}-cut` : null;
  const media = spin
    ? `<div data-tilt class="flip-stage relative aspect-[4/5] overflow-hidden bg-stone">
    <div class="flip-inner">${img(`${spin.front}-cut`, "", "flip-face cut-shadow h-full w-full object-contain p-[9%]")}${img(`${spin.back}-cut`, "", "flip-face flip-back cut-shadow h-full w-full object-contain p-[9%]")}</div>
    <span class="label absolute bottom-3 right-3 bg-bone/90 px-2 py-1 text-[10px] text-ink">360°</span>
    <div class="absolute left-3 top-3 flex flex-col items-start gap-1.5">${badges}</div>
  </div>`
    : "";
  return `<a href="#product-${p.slug}" class="group block" aria-label="${esc(p.name)}, ${formatPrice(p.price)}${p.comingSoon ? ", coming soon" : p.inStock ? "" : ", sold out"}">
  ${
    media ||
    `<div data-tilt class="relative aspect-[4/5] overflow-hidden ${studio ? "bg-stone" : "bg-coal"}">
    ${img(cut ?? first, "", `absolute inset-0 h-full w-full transition-[transform,opacity] duration-700 ease-out ${cut ? "cut-shadow object-contain p-[9%] group-hover:scale-[1.04]" : studio ? "object-contain p-[8%] group-hover:scale-[1.04]" : "object-cover group-hover:scale-[1.03]"} ${hover ? "group-hover:opacity-0" : ""} ${p.inStock || p.comingSoon ? "" : "grayscale-[35%]"}`)}
    ${hover ? img(hover, "", "absolute inset-0 h-full w-full scale-[1.06] object-cover opacity-0 transition-[transform,opacity] duration-700 ease-out group-hover:scale-100 group-hover:opacity-100", { blend: false }) : ""}
    <div class="absolute left-3 top-3 flex flex-col items-start gap-1.5">${badges}</div>
  </div>`
  }
  <div class="mt-3 flex items-start justify-between gap-3">
    <div class="min-w-0"><h3 class="text-[15px] font-medium leading-snug">${esc(p.name)}</h3>${dots}</div>
    <p class="shrink-0 font-mono text-[13px] ${p.inStock || p.comingSoon ? "" : "text-granite line-through decoration-1"}">${formatPrice(p.price)}</p>
  </div>
</a>`;
};

const NAV = [
  ["#shop", "Shop all"],
  ["#shop-hoodies", "Hoodies"],
  ["#shop-tees", "Tees"],
  ["#shop-crop-tops", "Crop tops"],
  ["#story", "Story"],
];

const chrome = `
<div class="preview-bar bg-bloom text-ink">
  <div class="wrap flex min-h-8 flex-wrap items-center justify-center gap-x-3 py-1.5 text-center">
    <p class="label text-[10px] sm:text-[11px]"><strong class="font-medium">Design preview by Marvani<span class="hidden sm:inline"> for Peak Side</span></strong> · Not the official store<span class="hidden sm:inline"> · Buy buttons open the live Peak Side store</span></p>
  </div>
</div>
<div class="bg-ink text-bone">
  <div class="wrap flex h-9 items-center justify-center gap-3 text-center">
    <p class="label text-[10px] sm:text-[11px]">${site.promo.label} with code <span class="text-sakura">${site.promo.code}</span></p>
    <button type="button" id="copy-code" class="label border-b border-bone/40 text-[10px] transition-colors hover:border-sakura hover:text-sakura sm:text-[11px]">Copy</button>
  </div>
</div>
<header id="hdr" class="hdr sticky z-40" style="top:env(safe-area-inset-top,0px);height:var(--header-h)">
  <div class="wrap flex h-full items-center justify-between">
    <a href="#home" class="group flex items-center gap-1" aria-label="Peak Side home">
      <span aria-hidden="true" class="mask-pks block h-8 w-11 transition-transform duration-500 ease-out group-hover:-rotate-6"></span>
      <span class="display text-[22px] leading-none tracking-[0.01em]">Peak Side</span>
    </a>
    <nav aria-label="Main" class="hidden items-center gap-8 lg:flex">
      ${NAV.map(([h, l]) => `<a href="${h}" class="label link-u pb-0.5">${l}</a>`).join("")}
    </nav>
    <div class="flex items-center gap-4">
      <a href="${site.instagram.url}" ${ext} aria-label="Peak Side on Instagram" class="hidden transition-opacity hover:opacity-60 sm:block">${ig()}</a>
      <a href="#shop" class="hdr-cta hidden px-4 py-2.5 font-mono text-[11px] uppercase tracking-label transition-colors sm:inline-flex">Shop now</a>
      <button type="button" id="menu-btn" class="label flex h-10 items-center gap-2 lg:hidden" aria-expanded="false" aria-controls="mobile-menu">
        <span id="menu-label">Menu</span>
        <span aria-hidden="true" class="relative block h-2.5 w-5"><span class="bar1 absolute left-0 top-0 h-px w-full bg-current transition-transform duration-300"></span><span class="bar2 absolute bottom-0 left-0 h-px w-full bg-current transition-transform duration-300"></span></span>
      </button>
    </div>
  </div>
</header>
<div id="mobile-menu" hidden class="fixed inset-x-0 bottom-0 z-30 flex flex-col bg-bone lg:hidden" style="top:calc(var(--header-h) + var(--bars-h))" role="dialog" aria-modal="true" aria-label="Menu">
  <nav aria-label="Mobile" class="wrap flex flex-1 flex-col justify-center gap-1">
    ${[...NAV, ["#shipping", "Shipping & returns"]].map(([h, l]) => `<a href="${h}" class="display flex items-center justify-between border-b border-ink/10 py-3 text-[13vw] sm:text-7xl">${l} <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" class="h-5 w-5"><path d="M1 8h13M9 3l5 5-5 5" stroke="currentColor" stroke-width="1.5"/></svg></a>`).join("")}
  </nav>
  <div class="wrap flex items-center justify-between py-6">
    <a href="${site.instagram.url}" ${ext} class="label flex items-center gap-2">${ig()} ${site.instagram.handle}</a>
    <span class="label select-all">${site.email}</span>
  </div>
</div>`;

const footer = `
<footer class="relative overflow-hidden bg-ink text-bone">
  <div class="wrap pb-8 pt-20 sm:pt-28">
    <div class="grid gap-14 lg:grid-cols-12">
      <div class="lg:col-span-5">
        <p class="label text-mist">${site.descriptor}</p>
        <p class="display mt-4 text-[15vw] leading-[0.82] sm:text-8xl lg:text-[7.5rem]">Mountains<br>meet <span class="text-sakura">everyday.</span></p>
        <a href="${site.instagram.url}" ${ext} class="btn-bone mt-10">${ig()} Follow ${site.instagram.handle}</a>
      </div>
      <div class="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-6 lg:col-start-7 lg:pt-4">
        <div><h2 class="label text-mist">Shop</h2><ul class="mt-5 space-y-3">
          ${[["#shop", "All products"], ...CATEGORIES.map((c) => [`#shop-${c.id}`, c.plural])].map(([h, l]) => `<li><a href="${h}" class="link-u text-[15px]">${l}</a></li>`).join("")}
        </ul></div>
        <div><h2 class="label text-mist">Help</h2><ul class="mt-5 space-y-3">
          <li><a href="#shipping" class="link-u text-[15px]">Shipping &amp; returns</a></li>
          <li><a href="#faq" class="link-u text-[15px]">FAQ</a></li>
        </ul></div>
        <div><h2 class="label text-mist">Peak Side</h2><ul class="mt-5 space-y-3">
          <li><a href="#story" class="link-u text-[15px]">Our story</a></li>
          <li><a href="${site.instagram.url}" ${ext} class="link-u inline-flex items-center gap-1.5 text-[15px]">Instagram ${site.instagram.handle} ${arrowUR}</a></li>
        </ul></div>
      </div>
    </div>
    <div class="mt-20 flex flex-col gap-4 border-t border-bone/15 pt-6 text-mist sm:flex-row sm:items-center sm:justify-between">
      <p class="label">© 2026 Peak Side · Preview by Marvani</p>
      <p class="label">Secure checkout via the Peak Side store · PayPal Pay in 4 available</p>
      <p class="label select-all">${site.email}</p>
    </div>
  </div>
  <span aria-hidden="true" class="mask-pks pointer-events-none absolute -right-16 bottom-10 hidden h-64 w-80 text-bone/[0.04] lg:block"></span>
</footer>`;

// ---------- home ----------
const minPrice = Math.min(...products.flatMap((p) => (p.price === null ? [] : [p.price])));
const soldOut = products.filter((p) => !p.inStock && !p.comingSoon);
const LOOKS = {
  trail: {
    line: "Granite, spray and switchbacks. Tees that handle the climb and still look right at the top.",
    looks: [
      ["trail-falls-back", "Back of the black boxy Summer Edition tee beside a waterfall", "black-boxy-summer-edition-tee"],
      ["trail-overlook", "White Summer Edition tee at a canyon overlook", "white-summer-edition-tee"],
      ["trail-ridge", "White Summer Edition tee on a granite boulder", "white-summer-edition-tee"],
      ["trail-falls-wide", "Black boxy tee at the base of a waterfall", "black-boxy-summer-edition-tee"],
    ],
  },
  tunnel: {
    line: "Back in town: graffiti walls, late light, the whole crew. Same clothes, different backdrop.",
    looks: [
      ["tunnel-crop-duo-2", "Two friends in black off-shoulder crop tops against graffiti", "black-off-shoulder-crop-top"],
      ["tunnel-zip-black-2", "Black double zip hoodie worn in a graffiti tunnel", "double-zip-hoodie"],
      ["tunnel-tee-black-back", "Back print of the black Summer Edition tee", "black-summer-edition-tee"],
      ["tunnel-crop-white", "White off-shoulder crop top in a graffiti tunnel", "white-off-shoulder-crop-top"],
    ],
  },
} as const;

const lookPanel = (key: "trail" | "tunnel") =>
  `<div data-look="${key}" ${key === "tunnel" ? "hidden" : ""}>
  <p class="mt-5 max-w-sm text-[15px] leading-relaxed text-bone/75 lg:hidden">${LOOKS[key].line}</p>
  <ul class="look-grid no-scrollbar -mx-4 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-12 lg:gap-4 lg:overflow-visible lg:px-0">
  ${LOOKS[key].looks
    .map(([im, alt, slug], i) => {
      const p = getProduct(slug)!;
      const span = ["lg:col-span-5 lg:row-span-2", "lg:col-span-4", "lg:col-span-3 lg:mt-24", "lg:col-span-7"][i];
      const aspect = ["aspect-[3/4] lg:aspect-auto lg:h-full", "aspect-[3/4]", "aspect-[3/4]", "aspect-[3/4] lg:aspect-[16/10]"][i];
      return `<li class="look-item w-[78vw] shrink-0 snap-start sm:w-[46vw] lg:w-auto ${span}" style="--i:${i}">
      <a href="#product-${p.slug}" class="group relative block h-full overflow-hidden bg-coal">
        <div class="relative ${aspect}">${img(im, alt, "absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105", { big: i === 0 || i === 3 })}</div>
        <div class="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-ink/85 to-transparent p-4 pt-16">
          <div><p class="label text-[10px] text-mist">Wearing</p><p class="mt-1 text-[14px] font-medium">${esc(p.name)}</p></div>
          <span class="flex items-center gap-2 font-mono text-[12px]">${formatPrice(p.price)}<span class="grid h-8 w-8 place-items-center bg-bone text-ink transition-colors group-hover:bg-sakura">${arrow}</span></span>
        </div>
      </a></li>`;
    })
    .join("")}
  </ul></div>`;

const home = `
<section class="hero relative -mt-[var(--header-h)] h-[100svh] min-h-[600px] overflow-hidden bg-ink text-bone" aria-label="Peak Side">
  <div class="absolute inset-0 flex">
    <div class="hero-panel hp-1 relative h-full overflow-hidden">
      <div class="hero-img absolute inset-0">${img("trail-falls-front", "Wearing the black Summer Edition tee in front of a mountain waterfall", "h-full w-full object-cover", { big: true, eager: true, style: "object-position:28% 40%" })}</div>
      <div class="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-ink/40"></div>
      <p class="label absolute text-bone/80" style="left:1rem;top:calc(var(--header-h) + 1.25rem)">01 — Trail</p>
    </div>
    <div class="hero-panel hp-2 relative h-full overflow-hidden">
      <div class="hero-img absolute inset-0">${img("tunnel-pink-hoodie", "Two friends in Peak Side hoodies against a graffiti wall", "h-full w-full object-cover", { big: true, eager: true, style: "object-position:62% 30%" })}</div>
      <div class="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-ink/40"></div>
      <p class="label absolute text-bone/80" style="right:1rem;top:calc(var(--header-h) + 1.25rem)">02 — Tunnel</p>
    </div>
  </div>
  <div class="grain pointer-events-none absolute inset-0"></div>
  <div class="wrap pointer-events-none relative flex h-full flex-col justify-end pb-10 sm:pb-14">
    <h1 class="display text-[19vw] sm:text-[15vw] lg:text-[11.5vw] 2xl:text-[10rem]">
      <span class="block overflow-hidden pb-[0.04em]"><span class="hero-line block" style="--d:.55s">Mountains</span></span>
      <span class="block overflow-hidden pb-[0.04em]"><span class="hero-line block" style="--d:.67s">meet <span class="text-sakura">everyday.</span></span></span>
    </h1>
    <div class="hero-sub pointer-events-auto mt-5 flex flex-col gap-5 sm:mt-8 sm:gap-6 lg:flex-row lg:items-end lg:justify-between">
      <p class="max-w-md text-[15px] leading-relaxed text-bone/85 sm:text-[17px]">Heavyweight hoodies, Summer Edition tees and crop tops for days that start on a trail and end in town.</p>
      <div class="flex gap-3">
        <a href="#shop" class="btn-bone px-5 sm:px-6">Shop<span class="hidden sm:inline">&nbsp;the collection</span> ${arrow}</a>
        <a href="#story" class="btn border border-bone/50 px-5 text-bone hover:border-bone hover:bg-bone hover:text-ink sm:px-6">Our story</a>
      </div>
    </div>
  </div>
</section>

<section class="relative overflow-hidden bg-[#F6EEF0] py-24 sm:py-32"><ps-petals></ps-petals>
  <div class="wrap grid items-center gap-12 lg:grid-cols-12">
    <div class="relative lg:col-span-6"><div class="relative aspect-[4/5] overflow-hidden bg-coal">${img("detail-graphic-black", "Close-up of the cherry-blossom Peak Side graphic on a faded black tee", "h-full w-full object-cover")}</div></div>
    <div class="lg:col-span-5 lg:col-start-8">
      <p class="label text-granite">The graphic</p>
      <h2 class="display mt-4 text-7xl sm:text-8xl lg:text-[7.5rem]">Summer <span class="text-bloom">Edition</span></h2>
      <p class="mt-6 max-w-md text-[17px] leading-relaxed text-ink/80">Cherry-blossom branches wrapped around the Peak Side oval: small on the chest, full-size across the back. It runs across tees in black and white, regular and boxy, plus the washed crop top.</p>
      <p class="label mt-5 text-bloom">Move your cursor or tap to shake the blossom</p>
      <div class="mt-8 grid grid-cols-2 gap-3">${["black-boxy-summer-edition-tee", "white-boxy-summer-edition-tee"].map((s) => card(getProduct(s)!, false)).join("")}</div>
      <a href="#shop-tees" class="btn-ink mt-8">Shop Summer Edition ${arrow}</a>
    </div>
  </div>
</section>

<div class="marquee overflow-hidden border-b border-ink/10 bg-bone py-4"><div class="marquee-track flex w-max">
${[0, 1, 2, 3]
  .map(
    (k) =>
      `<div class="flex shrink-0 items-center" ${k ? 'aria-hidden="true"' : ""}>${[
        `Free shipping with code ${site.promo.code}`,
        `Ships in ${site.policies.processing}`,
        `${site.policies.returnWindow} returns & exchanges`,
        "PayPal Pay in 4 at checkout",
        "Sizes S to 3XL",
      ]
        .map((t) => `<span class="flex items-center"><span class="label whitespace-nowrap px-6 text-[12px]">${esc(t)}</span>${ridge("h-2.5 w-10 opacity-50")}</span>`)
        .join("")}</div>`
  )
  .join("")}
</div></div>

<section class="wrap py-20 sm:py-32">
  <div class="grid gap-12 lg:grid-cols-12">
    <div class="lg:col-span-3"><p class="label text-granite">Peak Side — ${site.descriptor}</p>${ridge("mt-4 h-3 w-28 text-bloom")}</div>
    <div class="lg:col-span-9">
      <h2 class="display-wide text-[8.5vw] leading-[1.02] sm:text-5xl lg:text-[4.1rem]">Clothes for the days that start on a trail and end in town. Started by a <span class="whitespace-nowrap text-bloom">16-year-old</span> who'd rather be outside.</h2>
      <div class="mt-14 grid grid-cols-3 gap-4 border-t border-ink/15 pt-6">
        ${[["16", "Founder's age at launch"], [String(products.length), "Pieces in the range"], [formatPrice(minPrice), "Starting price"]]
          .map(([n, l]) => `<div><p class="display text-5xl sm:text-8xl">${n}</p><p class="label mt-2 text-granite">${l}</p></div>`)
          .join("")}
      </div>
    </div>
  </div>
</section>

<section class="wrap pb-24 sm:pb-32">
  <div class="flex items-end justify-between gap-6 border-b border-ink pb-5">
    <h2 class="display text-6xl sm:text-8xl">Best sellers</h2>
    <a href="#shop" class="label link-u mb-2 hidden items-center gap-2 sm:inline-flex">Shop all ${products.length} ${arrow}</a>
  </div>
  <ul class="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4">${bestSellers().map((p) => `<li>${card(p, false)}</li>`).join("")}</ul>
  <a href="#shop" class="btn-line mt-10 w-full sm:hidden">Shop all ${products.length} pieces ${arrow}</a>
</section>

<section class="border-y border-ink/10 bg-bone py-20 sm:py-28" aria-label="Spin the drop"><div class="wrap">
  <ps-showcase><script type="application/json">${jsonForScript({ items: spinItems((p) => `#product-${p.slug}`, pick) })}</script></ps-showcase>
</div></section>

<section class="pb-24 pt-24 sm:pb-32 sm:pt-32"><h2 class="sr-only">Shop by category</h2>
  <div class="wrap grid gap-3 md:grid-cols-3">
  ${[
    ["Hoodies & zips", "#shop-hoodies", "tunnel-zip-black", "Black double zip hoodie worn against graffiti", "Oversized, faded, heavyweight"],
    ["Summer Edition", "#shop-tees", "trail-overlook", "White Summer Edition tee at a mountain overlook", "Tees in regular and boxy cuts"],
    ["Crop tops", "#shop-crop-tops", "tunnel-crop-white-2", "White off-shoulder crop top", "Off-shoulder and washed"],
  ]
    .map(
      ([t, h, im, alt, note]) => `<a href="${h}" class="group relative block aspect-[4/5] overflow-hidden bg-coal text-bone md:aspect-[2/3]">
      ${img(im, alt, "absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.06]")}
      <div class="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent"></div>
      <div class="absolute inset-x-0 bottom-0 p-5 sm:p-6"><p class="label text-bone/70">${note}</p>
        <div class="mt-2 flex items-end justify-between"><p class="display text-5xl sm:text-6xl">${esc(t)}</p><span class="mb-1 grid h-10 w-10 shrink-0 place-items-center bg-bone text-ink transition-all duration-500 group-hover:bg-sakura">${arrow}</span></div>
      </div></a>`
    )
    .join("")}
  </div>
</section>

<section class="bg-ink py-20 text-bone sm:py-28" aria-labelledby="lookbook-title">
  <div class="wrap">
    <div class="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
      <div><p class="label text-mist">The lookbook</p><h2 id="lookbook-title" class="display mt-4 text-[16vw] sm:text-8xl lg:text-[8.5rem]">Two places.<br>One wardrobe.</h2></div>
      <div class="max-w-sm">
        <div role="tablist" aria-label="Lookbook location" class="inline-flex border border-bone/25 p-1">
          <button role="tab" type="button" data-tab="trail" aria-selected="true" class="look-tab label px-6 py-3">Trail</button>
          <button role="tab" type="button" data-tab="tunnel" aria-selected="false" class="look-tab label px-6 py-3">Tunnel</button>
        </div>
        <p id="look-line" class="mt-5 hidden text-[15px] leading-relaxed text-bone/75 lg:block">${LOOKS.trail.line}</p>
      </div>
    </div>
    <div class="mt-4">${lookPanel("trail")}${lookPanel("tunnel")}</div>
  </div>
</section>

<section class="py-20 sm:py-28" aria-labelledby="fit-title">
  <div class="wrap grid gap-10 lg:grid-cols-12">
    <div class="lg:col-span-4">
      <p class="label text-granite">Fit finder</p>
      <h2 id="fit-title" class="display mt-4 text-6xl sm:text-8xl">Trail or <span class="text-bloom">tunnel?</span></h2>
      <p class="mt-5 max-w-sm text-[16px] leading-relaxed text-ink/75">Three taps and we'll point you to the piece that fits your day, your weather and the way you like to wear it.</p>
    </div>
    <div class="lg:col-span-8"><ps-fit><script type="application/json">${jsonForScript(fitFinderData((p) => `#product-${p.slug}`, pick))}</script></ps-fit></div>
  </div>
</section>

<section class="relative overflow-hidden bg-ink py-20 text-bone sm:py-28" aria-labelledby="winter-title">
  <ps-petals snow></ps-petals>
  <div class="wrap relative">
    <div class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p class="label text-sakura">New · Coming soon</p>
        <h2 id="winter-title" class="display mt-4 text-[17vw] sm:text-8xl lg:text-[9rem]">The Winter <span class="text-sakura">Drop.</span></h2>
      </div>
      <div class="max-w-sm">
        <p class="text-[16px] leading-relaxed text-bone/80">Plaid-lined hoodies and plaid-panel sweatpants in washed black, in pink or grey plaid, finished with the PKS script.</p>
        <a href="#shop" class="btn-bone mt-6">Shop the Winter Drop ${arrow}</a>
      </div>
    </div>
    <ul class="mt-12 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4">${winterDrop().map((p) => `<li>${card(p, false)}</li>`).join("")}</ul>
  </div>
</section>

<section class="relative overflow-hidden bg-stone">
  <div class="grid lg:grid-cols-2">
    <div class="relative min-h-[60vh] lg:min-h-[86vh]">${img("tunnel-crew", "The Peak Side crew lined up in front of a graffiti tunnel", "absolute inset-0 h-full w-full object-cover", { big: true })}</div>
    <div class="wrap flex flex-col justify-center py-20 lg:px-16 lg:py-24">
      <span aria-hidden="true" class="mask-pks block h-14 w-20 text-bloom"></span>
      <p class="label mt-8 text-granite">From the founder</p>
      <blockquote class="display-wide mt-5 text-3xl leading-[1.08] sm:text-[2.6rem]">“I realized there will never be any opportunity like this if I don't figure out how to get there myself.”</blockquote>
      <p class="mt-6 max-w-md text-[16px] leading-relaxed text-ink/75">Peak Side started with one teenager, a love of being outside and a long-held dream of running a clothing brand. It's since grown into a community of friends who wear it everywhere.</p>
      <a href="#story" class="btn-line mt-8 self-start">Read the story ${arrow}</a>
    </div>
  </div>
</section>

${soldOut.length ? `<section class="wrap py-24 sm:py-32">
  <div class="grid gap-10 lg:grid-cols-12">
    <div class="lg:col-span-4">
      <p class="label text-granite">Sold out</p>
      <h2 class="display mt-4 text-6xl sm:text-7xl">The heavyweight double zip-up</h2>
      <p class="mt-5 max-w-sm text-[16px] leading-relaxed text-ink/75">Our best-selling zip-up sold through in all three colours. Ask to be told the moment it's back, or grab the in-stock Double Zip Hoodie now.</p>
      <a href="#product-double-zip-hoodie" class="label link-u mt-6 inline-flex items-center gap-2">Shop the Double Zip Hoodie ${arrow}</a>
    </div>
    <div class="grid grid-cols-3 gap-3 lg:col-span-8">
    ${soldOut
      .map(
        (p) => `<div class="group"><a href="#product-${p.slug}" class="relative block aspect-[3/4] overflow-hidden bg-coal">${img(p.colorways[0].images[0], p.name, "h-full w-full object-cover transition-transform duration-700 group-hover:scale-105")}</a>
        <p class="mt-3 text-[13px] font-medium sm:text-[14px]">${p.colorways[0].name}</p>
        <a href="${restockMailto(p.name)}" class="label mt-1 inline-flex items-center gap-1.5 text-[10px] text-bloom hover:underline sm:text-[11px]">Notify me ${arrow}</a></div>`
      )
      .join("")}
    </div>
  </div>
</section>` : ""}

<section class="border-t border-ink/10 py-20 sm:py-28">
  <div class="wrap">
    <div class="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div><p class="label text-granite">Drops, restocks, the crew</p><h2 class="display mt-3 text-6xl sm:text-8xl">${site.instagram.handle}</h2></div>
      <a href="${site.instagram.url}" ${ext} class="btn-ink self-start sm:self-auto">${ig()} Follow on Instagram ${arrowUR}</a>
    </div>
    <div class="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
    ${[
      ["tunnel-crop-sit", "Friends in crop tops sitting in front of graffiti"],
      ["trail-path", "White Summer Edition tee on a forest trail by a waterfall"],
      ["night-boxy-trio", "Three friends showing off the boxy tee back print at night"],
      ["trail-falls-duo", "Two friends in Peak Side tees at the foot of a waterfall"],
    ]
      .map(([n, a]) => `<a href="${site.instagram.url}" ${ext} class="group relative block aspect-square overflow-hidden bg-coal">${img(n, a, "h-full w-full object-cover transition-transform duration-700 group-hover:scale-105")}<span class="absolute inset-0 grid place-items-center bg-ink/0 text-bone opacity-0 transition-all duration-500 group-hover:bg-ink/40 group-hover:opacity-100">${ig("h-7 w-7")}</span></a>`)
      .join("")}
    </div>
  </div>
</section>`;

// ---------- shop ----------
const shop = `
<div class="wrap pb-28 pt-10 sm:pt-16">
  <div class="flex flex-col gap-4 pb-8 sm:flex-row sm:items-end sm:justify-between">
    <h1 class="display text-[22vw] sm:text-[9rem] lg:text-[11rem]">The shop</h1>
    <p class="max-w-xs pb-3 text-[15px] leading-relaxed text-ink/70">Every piece in the current range. Pick a product to see colours and sizes, then check out securely on the Peak Side store.</p>
  </div>
  <div class="filters sticky z-20 -mx-4 border-y border-ink/10 bg-bone/95 px-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10" style="top:calc(env(safe-area-inset-top,0px) + var(--header-h))">
    <div class="flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
      <div role="group" aria-label="Filter by category" class="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
        ${[{ id: "all", plural: "All", n: products.length }, ...CATEGORIES.map((c) => ({ id: c.id, plural: c.plural, n: products.filter((p) => p.category === c.id).length }))]
          .map((c) => `<button type="button" data-cat="${c.id}" aria-pressed="${c.id === "all"}" class="cat-btn label shrink-0 whitespace-nowrap px-3.5 py-2.5 transition-colors">${c.plural} <span class="cat-n">${c.n}</span></button>`)
          .join("")}
      </div>
      <div class="flex items-center justify-between gap-6 lg:justify-end">
        <label class="label flex cursor-pointer select-none items-center gap-2" for="instock"><input id="instock" type="checkbox" class="h-4 w-4 accent-ink"> In stock only</label>
        <label class="label flex items-center gap-2" for="sort"><span class="text-granite">Sort</span>
          <select id="sort" class="label cursor-pointer border-b border-ink/30 bg-transparent py-1 pr-1 focus:outline-none">
            <option value="featured">Featured</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option>
          </select></label>
      </div>
    </div>
  </div>
  <p id="shop-count" class="label mt-6 text-granite" aria-live="polite">${products.length} products</p>
  <ul id="shop-grid" class="mt-4 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4 lg:gap-y-14">
  ${[...products]
    .sort((a, b) => featuredRank(a) - featuredRank(b))
    .map((p, i) => `<li class="shop-item" data-cat="${p.category}" data-price="${sortablePrice(p)}" data-stock="${p.inStock ? 1 : 0}" data-order="${i}">${card(p)}</li>`)
    .join("")}
  </ul>
</div>`;

// ---------- product views ----------
const accordion = (title: string, body: string, open = false) =>
  `<details class="group border-b border-ink/15"${open ? " open" : ""}><summary class="flex cursor-pointer list-none items-center justify-between py-4"><span class="label text-[12px]">${title}</span>${plus}</summary><div class="pb-5 text-[15px] leading-relaxed text-ink/80">${body}</div></details>`;
const note = (t: string) => `<p class="mt-3 border-l-2 border-sakura pl-3 text-[13px] text-granite">${t}</p>`;

const productView = (p: Product) => {
  const galleries = p.colorways
    .map((c, ci) => {
      const alt = (n: string, i: number) => `${p.name} in ${c.name}${M[n].kind === "studio" ? (i === 1 ? ", back view" : ", product view") : ", worn"}`;
      const spinTag = c.spin
        ? `<ps-spin class="absolute inset-0" front="${pick(`${c.spin.front}-cut`, 960)}" back="${pick(`${c.spin.back}-cut`, 960)}" label="${esc(`${p.name} in ${c.name}`)}" word="${esc(categoryLabel(p.category))}"></ps-spin>`
        : "";
      const toggle = c.spin
        ? `<div role="tablist" aria-label="Gallery view" class="mb-3 inline-flex border border-ink/15 p-1 lg:hidden">
          <button type="button" role="tab" aria-selected="true" data-gview="spin" class="gview label px-4 py-2.5 transition-colors">360° spin</button>
          <button type="button" role="tab" aria-selected="false" data-gview="photos" class="gview label px-4 py-2.5 transition-colors">Photos (${c.images.length})</button>
        </div><div class="gpanel-spin relative -mx-4 aspect-[4/5] sm:-mx-6 lg:hidden">${spinTag}</div>`
        : "";
      const mobile = `${toggle}<div class="gpanel-photos relative -mx-4 sm:-mx-6 lg:hidden"${c.spin ? " hidden" : ""}><div class="rail no-scrollbar flex snap-x snap-mandatory overflow-x-auto" tabindex="0" aria-label="Product images">
        ${c.images.map((n, i) => `<div class="relative aspect-[4/5] w-full shrink-0 snap-center ${M[n].kind === "studio" ? "bg-stone" : "bg-coal"}">${img(n, alt(n, i), `absolute inset-0 h-full w-full ${M[n].kind === "studio" ? "object-contain p-[10%]" : "object-cover"}`)}</div>`).join("")}
        </div><div class="pointer-events-none absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">${c.images.map((_, i) => `<span class="dot h-[3px] ${i === 0 ? "w-6 bg-ink" : "w-3 bg-ink/25"} transition-all duration-300"></span>`).join("")}</div></div>`;
      const deskImages = c.spin ? c.images.filter((n) => n !== c.spin!.front) : c.images;
      const desk = `<div class="hidden grid-cols-2 gap-3 lg:grid">${c.spin ? `<div class="relative col-span-2 aspect-[5/6]">${spinTag}</div>` : ""}${deskImages
        .map((n, j) => {
          const i = c.images.indexOf(n);
          const full = c.spin ? deskImages.length % 2 === 1 && j === deskImages.length - 1 : i === 0 || (c.images.length % 2 === 0 && i === c.images.length - 1);
          const st = M[n].kind === "studio";
          return `<div class="relative overflow-hidden ${full ? "col-span-2 aspect-[5/6]" : "aspect-[4/5]"} ${st ? "bg-stone" : "bg-coal"}">${img(n, alt(n, i), `absolute inset-0 h-full w-full ${st ? "object-contain p-[9%]" : "object-cover"}`, { big: full })}</div>`;
        })
        .join("")}</div>`;
      return `<div data-cw="${ci}" ${ci ? "hidden" : ""}>${mobile}${desk}</div>`;
    })
    .join("");

  const primary = (compact: boolean) =>
    p.comingSoon
      ? `<a href="${site.instagram.url}" ${ext} class="btn-ink w-full ${compact ? "py-3.5" : "py-5"}">Coming soon <span class="opacity-60">·</span> Follow for the drop ${arrowUR}</a>`
      : p.inStock
      ? `<a href="${storeProductUrl(p.storeSlug)}" ${ext} class="btn-ink w-full ${compact ? "py-3.5" : "py-5"}">Choose size &amp; checkout <span class="opacity-60">·</span> ${formatPrice(p.price)} ${arrowUR}</a>`
      : `<a href="${restockMailto(p.name)}" class="btn-ink w-full ${compact ? "py-3.5" : "py-5"}">Email me when it's back ${arrow}</a>`;

  return `
<div class="wrap pb-24 pt-6 sm:pt-10">
  <nav aria-label="Breadcrumb" class="label mb-6 flex items-center gap-2 text-granite"><a href="#home" class="link-u">Home</a><span aria-hidden="true">/</span><a href="#shop" class="link-u">Shop</a><span aria-hidden="true">/</span><a href="#shop-${p.category}" class="link-u">${categoryPlural(p.category)}</a></nav>
  <div class="grid gap-8 lg:grid-cols-12 lg:gap-12">
    <div class="lg:col-span-7">${galleries}</div>
    <div class="lg:col-span-5"><div class="lg:sticky" style="top:calc(var(--header-h) + 2rem)">
      <p class="label text-granite">${p.collection ? `${p.collection} · ` : ""}${categoryLabel(p.category)}</p>
      <h1 class="display mt-3 text-[12vw] sm:text-7xl lg:text-[4.25rem]">${esc(p.name)}</h1>
      <div class="mt-5 flex items-center gap-4">
        <p class="font-mono text-xl ${p.inStock || p.comingSoon ? "" : "text-granite line-through"}">${formatPrice(p.price)}</p>
        ${p.comingSoon ? `<span class="label bg-sakura px-2 py-1 text-ink">Coming soon</span>` : ""}${!p.inStock && !p.comingSoon ? `<span class="label bg-ink px-2 py-1 text-bone">Sold out</span>` : ""}${p.badge ? `<span class="label bg-sakura px-2 py-1">${p.badge}</span>` : ""}
      </div>
      ${p.inStock && p.price !== null ? `<p class="mt-2 text-[13px] text-granite">Or 4 interest-free payments of ${formatPrice(Math.ceil((p.price / 4) * 100) / 100)} with PayPal at checkout.</p>` : ""}
      <p class="mt-6 max-w-md text-[16px] leading-relaxed">${esc(p.description ?? p.summary)}</p>
      <fieldset class="mt-8"><legend class="label">Colour <span class="text-granite">— <span class="cw-name">${p.colorways[0].name}</span></span></legend>
        <div class="mt-3 flex flex-wrap gap-2">${p.colorways
          .map((c, ci) => `<button type="button" data-swatch="${ci}" data-name="${esc(c.name)}" aria-pressed="${ci === 0}" aria-label="${esc(c.name)}" class="swatch flex items-center gap-2 border px-3 py-2 transition-colors"><span class="h-4 w-4 rounded-full ring-1 ring-ink/20" style="background:${c.swatch}"></span><span class="text-[13px]">${esc(c.name)}</span></button>`)
          .join("")}</div></fieldset>
      ${
        p.sizes.length
          ? `<div class="mt-7"><p class="label">Available sizes</p><ul class="mt-3 flex flex-wrap gap-2" aria-label="Available sizes">${p.sizes.map((s) => `<li class="flex h-11 min-w-[3rem] items-center justify-center border border-ink/15 px-3 font-mono text-[13px]">${s}</li>`).join("")}</ul>${p.fit ? `<p class="mt-3 text-[13px] font-medium">Fit note: ${p.fit}</p>` : ""}</div>`
          : ""
      }
      <div class="buy-cta mt-8">${primary(false)}
        <p class="mt-3 text-[12px] leading-relaxed text-granite">${
          p.comingSoon
            ? `Part of the new Winter Drop and not on sale yet. Follow <a class="underline" href="${site.instagram.url}" ${ext}>${site.instagram.handle}</a> to hear the moment it's live.`
            : p.inStock
            ? `Opens the official Peak Side store, where you pick your size and pay. Use code <span class="font-mono text-ink">${site.promo.code}</span> for free shipping.`
            : `Opens an email to Peak Side (<span class="select-all">${site.email}</span>) asking about the restock. Or follow <a class="underline" href="${site.instagram.url}" ${ext}>${site.instagram.handle}</a> for drops.`
        }</p></div>
      <div class="mt-8 border-t border-ink/15">
        ${accordion("Details", `<p>${esc(p.summary)}</p>${note(`${p.comingSoon ? "Price, sizes, fabric and care instructions" : "Fabric, weight and care instructions"}: to be supplied by Peak Side.`)}`, true)}
        ${accordion("Fit &amp; sizing", `<p>${esc(p.fit ?? "See the size chart on the checkout page for measurements.")}</p>${note("Measured size chart (chest, length, sleeve in inches): to be supplied by Peak Side.")}`)}
        ${accordion("Shipping &amp; returns", `<p>Orders are processed within ${site.policies.processing}, with tracking emailed when your order ships. Returns and exchanges are accepted within ${site.policies.returnWindow} of delivery on unworn, unwashed items with tags attached.</p><a href="#shipping" class="link-u mt-3 inline-flex items-center gap-1.5 font-medium">Full policy ${arrowUR}</a>`)}
      </div>
    </div></div>
  </div>
</div>
<div class="sticky-buy fixed inset-x-0 bottom-0 z-30 border-t border-ink/10 bg-bone/95 p-3 backdrop-blur lg:hidden" hidden style="padding-bottom:max(.75rem,env(safe-area-inset-bottom));padding-left:max(.75rem,env(safe-area-inset-left));padding-right:max(.75rem,env(safe-area-inset-right))">${primary(true)}</div>
<section class="border-t border-ink/10 py-20"><div class="wrap"><h2 class="display text-5xl sm:text-7xl">Wear it with</h2>
  <ul class="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4">${relatedTo(p).map((r) => `<li>${card(r)}</li>`).join("")}</ul></div></section>`;
};

// ---------- story ----------
const story = `
<section class="relative h-[78svh] min-h-[520px] overflow-hidden bg-ink text-bone">
  ${img("trail-falls-rock", "Standing on granite at the foot of a waterfall in a Peak Side tee", "absolute inset-0 h-full w-full object-cover", { big: true, style: "object-position:50% 72%" })}
  <div class="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-ink/30"></div>
  <div class="wrap relative flex h-full flex-col justify-end pb-12"><p class="label text-bone/75">Our story</p>
    <h1 class="display mt-4 text-[18vw] sm:text-[9rem] lg:text-[11rem]">Started at 16.<br><span class="text-sakura">Built outside.</span></h1></div>
</section>
<section class="wrap py-20 sm:py-28"><div class="grid gap-12 lg:grid-cols-12">
  <div class="lg:col-span-3"><span aria-hidden="true" class="mask-pks block h-12 w-16 text-bloom"></span><p class="label mt-6 text-granite">In the founder's words</p>${ridge("mt-4 h-3 w-24 text-ink/40")}</div>
  <div class="space-y-8 lg:col-span-8 lg:col-start-5">
    <p class="display-wide text-[7vw] leading-[1.1] sm:text-4xl lg:text-[2.9rem]">“I am a 16-year-old that started this brand because I love being outside, and it has been my dream to own a clothing brand ever since I was younger.”</p>
    <p class="max-w-2xl text-[18px] leading-relaxed text-ink/80">“How it got to here: I had a week where I was looking at stuff from a different perspective and realized there will never be any opportunity like this if I don't figure out how to get there myself.”</p>
    <p class="max-w-2xl text-[18px] leading-relaxed text-ink/80">“This brand has not only helped me but also brought the community together and has started many new relationships.”</p>
  </div></div></section>
<section class="pb-20 sm:pb-28"><div class="wrap grid grid-cols-2 gap-3 md:grid-cols-12">
  <div class="col-span-2 md:col-span-7"><div class="relative aspect-[3/2] overflow-hidden bg-coal">${img("tunnel-crew", "The Peak Side crew wearing tees, hoodies and crop tops", "h-full w-full object-cover", { big: true })}</div></div>
  <div class="md:col-span-5"><div class="relative aspect-[3/4] overflow-hidden bg-coal md:aspect-auto md:h-full">${img("trail-overlook", "White Summer Edition tee at a canyon overlook", "h-full w-full object-cover")}</div></div>
  <div class="md:hidden"><div class="relative aspect-[3/4] overflow-hidden bg-coal">${img("tunnel-pink-hoodie", "Pink faded hoodie and black hoodie against graffiti", "h-full w-full object-cover")}</div></div>
</div></section>
<section class="border-t border-ink/10 bg-stone py-24 sm:py-32"><div class="wrap grid gap-12 lg:grid-cols-12">
  <div class="lg:col-span-6"><p class="label text-granite">What we make</p><h2 class="display mt-4 text-6xl sm:text-8xl">Made for<br><span class="text-bloom">both places.</span></h2></div>
  <div class="space-y-6 text-[17px] leading-relaxed text-ink/80 lg:col-span-5 lg:col-start-8 lg:pt-10">
    <p>Hoodies made for snow days on the mountain and school days in town. Summer Edition tees and crop tops for long afternoons on the trail. Everything is designed to work in both places.</p>
    <p class="border-l-2 border-sakura pl-4 text-[14px] text-granite">Placeholder: founding year, home mountains and how the pieces are made, to be supplied by Peak Side.</p>
    <div class="flex flex-wrap gap-3 pt-4"><a href="#shop" class="btn-ink">Shop the collection ${arrow}</a><a href="${site.instagram.url}" ${ext} class="btn-line">Follow ${site.instagram.handle}</a></div>
  </div></div></section>`;

// ---------- shipping ----------
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
const shipping = `
<div class="wrap pb-28 pt-10 sm:pt-16">
  <h1 class="display text-[17vw] sm:text-[8rem] lg:text-[10rem]">Shipping<br>&amp; returns</h1>
  <div class="mt-10 grid grid-cols-1 gap-px bg-ink/15 sm:grid-cols-3">
    ${[[site.policies.processing, "Processing time"], [site.policies.returnWindow, "Returns & exchanges"], [site.promo.code, "Free shipping code"]]
      .map(([v, l]) => `<div class="bg-bone py-6 sm:px-6 sm:first:pl-0"><p class="display text-4xl sm:text-5xl">${v}</p><p class="label mt-2 text-granite">${esc(l)}</p></div>`)
      .join("")}
  </div>
  <div class="mt-16 grid gap-16 lg:grid-cols-2">
    ${([["Shipping policy", SHIPPING], ["Return & exchange policy", RETURNS]] as const)
      .map(([t, items]) => `<section><h2 class="label border-b border-ink pb-3 text-[12px]">${esc(t)}</h2><ol class="mt-2">${items.map((x, i) => `<li class="flex gap-5 border-b border-ink/10 py-4 text-[16px] leading-relaxed"><span class="font-mono text-[12px] text-granite">${String(i + 1).padStart(2, "0")}</span><span>${esc(x)}</span></li>`).join("")}</ol></section>`)
      .join("")}
  </div>
  <section id="faq-anchor" class="mt-24 grid gap-10 lg:grid-cols-12">
    <div class="lg:col-span-4"><h2 class="display text-6xl sm:text-8xl">FAQ</h2>
      <p class="mt-4 max-w-xs text-[15px] leading-relaxed text-ink/70">Can't find your answer? Email Peak Side at <span class="select-all font-medium text-ink">${site.email}</span>.</p>
      <button type="button" id="copy-email" class="btn-ink mt-6">Copy email address</button></div>
    <div class="border-t border-ink/15 lg:col-span-8">${FAQ.map((f) => accordion(esc(f.q), `<p>${esc(f.a)}</p>`)).join("")}</div>
  </section>
</div>`;

// ---------- assemble ----------
const views = [
  ["home", home],
  ["shop", shop],
  ["story", story],
  ["shipping", shipping],
  ...products.map((p) => [`product-${p.slug}`, productView(p)]),
];

const body = `${chrome}
<main id="main">
${views.map(([id, html]) => `<div class="view" data-view="${id}"${id === "home" ? "" : " hidden"}>${html}</div>`).join("\n")}
</main>
${footer}`;

const script = `
(function(){
  var views = document.querySelectorAll('.view');
  var hdr = document.getElementById('hdr');
  var menu = document.getElementById('mobile-menu');
  var menuBtn = document.getElementById('menu-btn');
  var current = 'home';
  var CATS = ${JSON.stringify(CATEGORIES.map((c) => c.id))};

  function setMenu(open){
    menu.hidden = !open; menuBtn.setAttribute('aria-expanded', open);
    document.getElementById('menu-label').textContent = open ? 'Close' : 'Menu';
    document.body.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    updateHeader();
  }
  menuBtn.addEventListener('click', function(){ setMenu(menu.hidden); });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape' && !menu.hidden) setMenu(false); });

  function updateHeader(){
    var clear = current==='home' && window.scrollY < 24 && menu.hidden;
    hdr.classList.toggle('is-clear', clear);
  }
  window.addEventListener('scroll', updateHeader, {passive:true});

  function route(){
    var h = (location.hash || '#home').slice(1);
    var target = h, cat = null, anchor = null;
    if (h.indexOf('shop-')===0 && CATS.indexOf(h.slice(5))>-1){ target='shop'; cat=h.slice(5); }
    else if (h==='shop'){ cat='all'; }
    else if (h==='faq'){ target='shipping'; anchor='faq-anchor'; }
    var el = document.querySelector('.view[data-view="'+target+'"]');
    if(!el){ target='home'; el=document.querySelector('.view[data-view="home"]'); }
    views.forEach(function(v){ v.hidden = v!==el; });
    var prev = current; current = target;
    if(!menu.hidden) setMenu(false);
    if(cat) setCat(cat);
    if(anchor){ var a=document.getElementById(anchor); a && setTimeout(function(){ a.scrollIntoView(); },0); }
    else if(prev!==target || cat) window.scrollTo(0,0);
    el.classList.remove('enter'); void el.offsetWidth; el.classList.add('enter');
    updateHeader(); watchBuy();
  }
  window.addEventListener('hashchange', route);

  // copy helpers
  function copy(text, btn, done){
    var ok = function(){ var t=btn.textContent; btn.textContent=done; setTimeout(function(){ btn.textContent=t; },2000); };
    try { navigator.clipboard.writeText(text).then(ok, function(){ fallback(); }); } catch(e){ fallback(); }
    function fallback(){ var s=document.createElement('textarea'); s.value=text; document.body.appendChild(s); s.select(); try{document.execCommand('copy'); ok();}catch(e){} s.remove(); }
  }
  document.getElementById('copy-code').addEventListener('click', function(e){ copy(${JSON.stringify(site.promo.code)}, e.currentTarget, 'Copied ✓'); });
  var ce = document.getElementById('copy-email'); ce && ce.addEventListener('click', function(e){ copy(${JSON.stringify(site.email)}, e.currentTarget, 'Copied ✓'); });

  // lookbook
  var lines = ${JSON.stringify({ trail: LOOKS.trail.line, tunnel: LOOKS.tunnel.line })};
  document.querySelectorAll('.look-tab').forEach(function(b){
    b.addEventListener('click', function(){
      var k=b.dataset.tab;
      document.querySelectorAll('.look-tab').forEach(function(x){ x.setAttribute('aria-selected', x===b); });
      document.querySelectorAll('[data-look]').forEach(function(p){ p.hidden = p.dataset.look!==k; if(!p.hidden){ p.classList.remove('enter'); void p.offsetWidth; p.classList.add('enter'); } });
      document.getElementById('look-line').textContent = lines[k];
    });
  });

  // shop
  var state = {cat:'all', instock:false, sort:'featured'};
  var grid = document.getElementById('shop-grid');
  var items = Array.prototype.slice.call(grid.children);
  function setCat(c){ state.cat=c; applyShop(); }
  function applyShop(){
    document.querySelectorAll('.cat-btn').forEach(function(b){ b.setAttribute('aria-pressed', b.dataset.cat===state.cat); });
    var list = items.slice();
    if(state.sort==='price-asc') list.sort(function(a,b){ return a.dataset.price-b.dataset.price; });
    else if(state.sort==='price-desc') list.sort(function(a,b){ var pa=+a.dataset.price, pb=+b.dataset.price; return (isFinite(pb)?pb:-1)-(isFinite(pa)?pa:-1); });
    else list.sort(function(a,b){ return a.dataset.order-b.dataset.order; });
    var n=0;
    list.forEach(function(li){
      var show = (state.cat==='all'||li.dataset.cat===state.cat) && (!state.instock||li.dataset.stock==='1');
      li.hidden=!show; if(show) n++; grid.appendChild(li);
    });
    document.getElementById('shop-count').textContent = n + (n===1?' product':' products');
  }
  document.querySelectorAll('.cat-btn').forEach(function(b){ b.addEventListener('click', function(){ setCat(b.dataset.cat); }); });
  document.getElementById('instock').addEventListener('change', function(e){ state.instock=e.target.checked; applyShop(); });
  document.getElementById('sort').addEventListener('change', function(e){ state.sort=e.target.value; applyShop(); });

  // product colourways + mobile rail dots
  document.querySelectorAll('.view[data-view^="product-"]').forEach(function(v){
    v.querySelectorAll('.swatch').forEach(function(s){
      s.addEventListener('click', function(){
        var i=s.dataset.swatch;
        v.querySelectorAll('.swatch').forEach(function(x){ x.setAttribute('aria-pressed', x===s); });
        v.querySelectorAll('[data-cw]').forEach(function(g){ g.hidden = g.dataset.cw!==i; });
        v.querySelector('.cw-name').textContent = s.dataset.name;
      });
    });
    v.querySelectorAll('[data-cw]').forEach(function(g){
      g.querySelectorAll('.gview').forEach(function(b){
        b.addEventListener('click', function(){
          var spin = b.dataset.gview==='spin';
          g.querySelectorAll('.gview').forEach(function(x){ x.setAttribute('aria-selected', x===b); });
          var sp=g.querySelector('.gpanel-spin'), ph=g.querySelector('.gpanel-photos');
          if(sp) sp.hidden=!spin; if(ph) ph.hidden=spin;
        });
      });
    });
    v.querySelectorAll('.rail').forEach(function(r){
      r.addEventListener('scroll', function(){
        var k=Math.round(r.scrollLeft/r.clientWidth);
        r.parentNode.querySelectorAll('.dot').forEach(function(d,j){ d.className='dot h-[3px] transition-all duration-300 '+(j===k?'w-6 bg-ink':'w-3 bg-ink/25'); });
      }, {passive:true});
    });
  });

  // mobile sticky buy bar
  var io;
  function watchBuy(){
    if(io) io.disconnect();
    document.querySelectorAll('.sticky-buy').forEach(function(b){ b.hidden=true; });
    var v=document.querySelector('.view[data-view="'+current+'"]');
    var cta=v && v.querySelector('.buy-cta'); if(!cta || !('IntersectionObserver' in window)) return;
    var bar=v.querySelector('.sticky-buy');
    io=new IntersectionObserver(function(es){ var e=es[0]; bar.hidden = e.isIntersecting || e.boundingClientRect.top>0; });
    io.observe(cta);
  }

  route();
})();`;

const extraCss = `
:root{--header-h:64px;--bars-h:4.25rem}
body{background:#F3F0EA;color:#11110F}
.wrap{padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
@media (min-width:640px){.wrap{padding-left:max(24px,env(safe-area-inset-left,0px));padding-right:max(24px,env(safe-area-inset-right,0px))}}
@media (min-width:1024px){.wrap{padding-left:max(40px,env(safe-area-inset-left,0px));padding-right:max(40px,env(safe-area-inset-right,0px))}}
body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:50;background:#11110F}
.hdr{background:rgba(243,240,234,.92);color:#11110F;box-shadow:0 1px 0 rgba(17,17,15,.08);-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);transition:background-color .5s,color .5s,box-shadow .5s}
.hdr.is-clear{background:transparent;color:#F3F0EA;box-shadow:none;-webkit-backdrop-filter:none;backdrop-filter:none}
.hdr-cta{background:#11110F;color:#F3F0EA}.hdr-cta:hover{background:#E0558F}
.hdr.is-clear .hdr-cta{background:#F3F0EA;color:#11110F}.hdr.is-clear .hdr-cta:hover{background:#F2A3C4}
.menu-open .bar1{transform:translateY(5px) rotate(45deg)}.menu-open .bar2{transform:translateY(-4px) rotate(-45deg)}
.cat-btn[aria-pressed="true"]{background:#11110F;color:#F3F0EA}.cat-btn[aria-pressed="false"]:hover{background:#E6E2DA}
.cat-btn .cat-n{color:#6F6C66}.cat-btn[aria-pressed="true"] .cat-n{color:#F2A3C4}
.swatch[aria-pressed="true"]{border-color:#11110F}.swatch[aria-pressed="false"]{border-color:rgba(17,17,15,.15)}
.gview[aria-selected="true"]{background:#11110F;color:#F3F0EA}
.look-tab{transition:background-color .4s,color .4s}.look-tab[aria-selected="true"]{background:#F3F0EA;color:#11110F}
.mask-pks{-webkit-mask:url(images/mark-pks-480.webp) center/contain no-repeat;mask:url(images/mark-pks-480.webp) center/contain no-repeat;background:currentColor}
.hero-panel{flex:1 1 0;transition:flex-grow .9s cubic-bezier(.22,1,.36,1)}
@media (hover:hover){.hero:has(.hp-1:hover) .hp-1,.hero:has(.hp-2:hover) .hp-2{flex-grow:1.45}.hero:has(.hp-1:hover) .hp-2,.hero:has(.hp-2:hover) .hp-1{flex-grow:.55}}
@keyframes wipeL{from{clip-path:inset(0 100% 0 0)}to{clip-path:inset(0 0 0 0)}}
@keyframes wipeR{from{clip-path:inset(0 0 0 100%)}to{clip-path:inset(0 0 0 0)}}
@keyframes settle{from{transform:scale(1.18)}to{transform:scale(1)}}
@keyframes rise{from{transform:translateY(105%)}to{transform:none}}
@keyframes fadeUp{from{opacity:.0;transform:translateY(16px)}to{opacity:1;transform:none}}
@keyframes enter{from{opacity:.4;transform:translateY(10px)}to{opacity:1;transform:none}}
.hp-1{animation:wipeL 1.2s cubic-bezier(.22,1,.36,1) .1s both}.hp-2{animation:wipeR 1.2s cubic-bezier(.22,1,.36,1) .22s both}
.hero-img{animation:settle 2.2s cubic-bezier(.22,1,.36,1) .1s both}
.hero-line{animation:rise 1.1s cubic-bezier(.22,1,.36,1) var(--d) both}
.hero-sub{animation:fadeUp .9s cubic-bezier(.22,1,.36,1) 1s both}
.view.enter{animation:enter .5s cubic-bezier(.22,1,.36,1)}
[data-look].enter .look-item{animation:fadeUp .8s cubic-bezier(.22,1,.36,1) calc(var(--i)*70ms) both}
.preview-bar strong{font-weight:500}
`;

const interactiveJs = buildSync({ entryPoints: ["src/interactive/index.ts"], bundle: true, format: "iife", minify: true, write: false, target: "es2020" })
  .outputFiles[0].text.replace(/<\/script/gi, "<\\/script");

const page = `<title>Peak Side Preview</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="robots" content="noindex, nofollow">
<style>/*__CSS__*/</style>
${body}
<script>${interactiveJs}</script>
<script>${script}</script>
`;

const htmlPath = path.join(OUT, "index.html");
fs.writeFileSync(htmlPath, page);

// Compile Tailwind against the generated markup.
const input = path.join(OUT, "_input.css");
const globals = fs
  .readFileSync("src/app/globals.css", "utf8")
  .replace(/^@import .*$/gm, "")
  .replace(/\s*-webkit-mask: var\(--pks\)[^;]*;\s*mask: var\(--pks\)[^;]*;/, "");
fs.writeFileSync(input, globals);
const cssOut = path.join(OUT, "_out.css");
execFileSync("npx", ["tailwindcss", "-c", "tailwind.config.ts", "-i", input, "-o", cssOut, "--content", htmlPath, "--minify"], { stdio: "inherit" });
// Embed the brand fonts so the preview renders identically without any external font host.
const font = (f: string) => `data:font/woff2;base64,${fs.readFileSync(path.join("node_modules", f)).toString("base64")}`;
const fontCss =
  `@font-face{font-family:"Archivo Variable";font-style:normal;font-display:swap;font-weight:100 900;font-stretch:62% 125%;src:url(${font("@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2")}) format("woff2-variations")}` +
  `@font-face{font-family:"IBM Plex Mono";font-style:normal;font-display:swap;font-weight:400;src:url(${font("@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff2")}) format("woff2")}` +
  `@font-face{font-family:"IBM Plex Mono";font-style:normal;font-display:swap;font-weight:500;src:url(${font("@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff2")}) format("woff2")}`;
let css = fontCss + fs.readFileSync(cssOut, "utf8") + extraCss;
fs.writeFileSync(htmlPath, page.replace("/*__CSS__*/", () => css));
fs.rmSync(input);
fs.rmSync(cssOut);

// Copy only the image files the page references.
for (const name of used.keys()) fs.copyFileSync(path.join("public/images", `${name}.webp`), path.join(OUT, "images", `${name}.webp`));
fs.copyFileSync("public/images/mark-pks-480.webp", path.join(OUT, "images", "mark-pks-480.webp"));

const size = fs.statSync(htmlPath).size;
console.log(`preview/index.html ${(size / 1024).toFixed(0)} KB, ${used.size + 1} images`);
