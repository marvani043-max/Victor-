// Local preview of the Shopify theme: renders the theme's Liquid with liquidjs and a mock
// store built from the real Peak Side catalogue, so pages can be checked in a browser
// (phones, tablets, desktop) before uploading to Shopify.
//
//   npx tsx scripts/shopify-preview.ts   ->  shopify-preview/*.html (+ assets, images)
//
// This is an approximation of Shopify's renderer for testing layout and behaviour; the
// real store is the final check.
import fs from "node:fs";
import path from "node:path";
import { Liquid, Tag, TagToken, Context, TopLevelToken, Template, Emitter, Value, Hash } from "liquidjs";
import { products as catalogue, type Product as PSProduct } from "../src/data/products";
import manifestJson from "../src/data/image-manifest.json";

const ROOT = path.resolve(".");
const THEME = path.join(ROOT, "shopify-theme");
// BARE=1 simulates a store straight after upload: no tags, no pages, no collections.
const BARE = process.env.BARE === "1";
const OUT = path.join(ROOT, BARE ? "shopify-preview-bare" : "shopify-preview");
const M = manifestJson as Record<string, { w: number; h: number; widths: number[] }>;
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, "img"), { recursive: true });
fs.cpSync(path.join(THEME, "assets"), path.join(OUT, "assets"), { recursive: true });

// ---------------- mock images ----------------
const usedImages = new Set<string>();
const imgObj = (name: string, alt = "") => {
  const e = M[name];
  if (!e) throw new Error("missing image " + name);
  return { __img: name, src: name, width: e.w, height: e.h, alt, aspect_ratio: e.w / e.h, preview_image: null as unknown };
};
const imgUrl = (name: string, width = 960) => {
  const e = M[name];
  const w = e.widths.find((x) => x >= width) ?? e.widths[e.widths.length - 1];
  usedImages.add(`${name}-${w}.webp`);
  return `img/${name}-${w}.webp`;
};

// ---------------- mock catalogue ----------------
const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const TAGS: Record<string, string[]> = {
  "faded-hoodie-front-logo": ["warmth:cold", "fit:oversized", "place:tunnel"],
  "faded-hoodie-both-sides": ["warmth:cold", "fit:oversized", "place:tunnel"],
  "double-zip-hoodie": ["warmth:cold", "fit:boxy", "place:tunnel"],
  "black-summer-edition-tee": ["warmth:warm", "fit:classic", "place:trail", "place:tunnel"],
  "black-boxy-summer-edition-tee": ["warmth:warm", "fit:boxy", "place:trail"],
  "white-summer-edition-tee": ["warmth:warm", "fit:classic", "place:trail"],
  "white-boxy-summer-edition-tee": ["warmth:warm", "fit:boxy", "place:tunnel"],
  "black-off-shoulder-crop-top": ["warmth:warm", "fit:cropped", "place:tunnel"],
  "white-off-shoulder-crop-top": ["warmth:warm", "fit:cropped", "place:tunnel"],
  "grey-washed-crop-top": ["warmth:warm", "fit:cropped", "place:tunnel"],
};
const TYPE: Record<string, string> = { hoodies: "Hoodie", "zip-ups": "Zip-up", tees: "Tee", "crop-tops": "Crop top", bottoms: "Sweatpants" };
let nextId = 1000;

function toShopify(p: PSProduct) {
  const price = Math.round((p.price ?? 6500 / 100) * 100);
  const sizes = p.sizes.length ? p.sizes : ["S", "M", "L", "XL"];
  const colours = p.colorways.map((c) => c.name);
  const options: string[][] = colours.length > 1 ? [colours, sizes] : [sizes];
  const optionNames = colours.length > 1 ? ["Color", "Size"] : ["Size"];
  const media = p.colorways.flatMap((c) => c.images).filter((v, i, a) => a.indexOf(v) === i).map((n) => {
    const im = imgObj(n, `${p.name}`);
    im.preview_image = im;
    return { id: nextId++, alt: p.name, preview_image: im, media_type: "image" };
  });
  const variants: Record<string, unknown>[] = [];
  const combos = options.length === 2 ? options[0].flatMap((a) => options[1].map((b) => [a, b])) : options[0].map((a) => [a]);
  combos.forEach((opts, i) => {
    const colourIndex = options.length === 2 ? colours.indexOf(opts[0]) : 0;
    const firstImage = p.colorways[colourIndex].images[0];
    const m = media.find((x) => (x.preview_image as { src: string }).src === firstImage);
    variants.push({
      id: nextId++,
      title: opts.join(" / "),
      options: opts,
      option1: opts[0],
      option2: opts[1] ?? null,
      available: !!p.comingSoon || (p.inStock && !(opts.includes("2XL") && i % 3 === 0)),
      // Winter Drop: sold as a pre-order (tracked, no stock, "continue selling when out of stock").
      inventory_management: "shopify",
      inventory_policy: p.comingSoon ? "continue" : "deny",
      inventory_quantity: p.comingSoon ? 0 : 5,
      price,
      compare_at_price: null,
      featured_media: m ? { id: m.id } : null,
      url: `products/${p.slug}.html?variant=${i}`,
      sku: `${p.slug}-${i}`,
    });
  });
  const first = variants.find((v) => v.available) ?? variants[0];
  const spin = p.colorways[0].spin;
  const tags = BARE ? [] : [...(TAGS[p.slug] ?? [])];
  if (p.bestSeller && !BARE) tags.push("best-seller");
  // Winter Drop is a pre-order now: detected from the variants' inventory policy, no tag needed.
  const prod = {
    id: nextId++,
    handle: p.slug,
    title: p.name,
    url: `product-${p.slug}.html`,
    type: TYPE[p.category],
    vendor: "Peak Side",
    tags,
    available: p.inStock || !!p.comingSoon,
    price,
    price_min: price,
    price_varies: false,
    compare_at_price: null,
    description: `<p>${p.description ?? p.summary}</p>`,
    featured_media: media[0],
    media,
    variants,
    selected_or_first_available_variant: first,
    has_only_default_variant: false,
    options_with_values: optionNames.map((name, i) => ({ name, position: i + 1, values: options[i], selected_value: (first.options as string[])[i] })),
    metafields: {
      custom: {
        spin_front: spin ? { value: { preview_image: imgObj(`${spin.front}-cut`) } } : null,
        spin_back: spin ? { value: { preview_image: imgObj(`${spin.back}-cut`) } } : null,
        summary: { value: p.summary },
        fit_note: p.fit ? { value: p.fit } : null,
        size_chart: null,
      },
    },
  };
  return prod;
}
const products = catalogue.map(toShopify);
const byHandle = Object.fromEntries(products.map((p) => [p.handle, p]));
const coll = (handle: string, title: string, list: typeof products) => ({
  handle,
  title,
  url: `collection-${handle}.html`,
  products: list,
  products_count: list.length,
  all_products_count: list.length,
  description: "",
  image: null,
  filters: [
    {
      type: "list",
      label: "Product type",
      values: ["Hoodie", "Tee", "Crop top", "Sweatpants"].map((t) => ({ label: t, count: list.filter((p) => p.type === t).length, active: false, url_to_add: "#", url_to_remove: "#", param_name: "filter.p.product_type", value: t })),
      active_values: [],
    },
  ],
  sort_by: "manual",
  default_sort_by: "manual",
  sort_options: [
    { value: "manual", name: "Featured" },
    { value: "price-ascending", name: "Price, low to high" },
    { value: "price-descending", name: "Price, high to low" },
  ],
});
const collections: Record<string, unknown> = BARE ? { all: coll("all", "Shop all", products) } : {
  all: coll("all", "Shop all", products),
  "summer-edition": coll("summer-edition", "Summer Edition", products.filter((p) => catalogue.find((c) => c.slug === p.handle)?.collection === "Summer Edition")),
  "winter-drop": coll("winter-drop", "Winter Drop", products.filter((p) => catalogue.find((c) => c.slug === p.handle)?.comingSoon)),
  "best-sellers": coll("best-sellers", "Best sellers", products.filter((p) => p.tags.includes("best-seller"))),
};
const menu = (title: string, links: [string, string][]) => ({ title, links: links.map(([t, u]) => ({ title: t, url: u, current: false })) });
const linklists: Record<string, unknown> = {
  "main-menu": menu("Main menu", [["Shop all", "collection-all.html"], ["Winter Drop", "collection-winter-drop.html"], ["Summer Edition", "collection-summer-edition.html"], ["Story", "page-story.html"]]),
  footer: menu("Footer", [["FAQ", "page-faq.html"], ["Shipping policy", "#"], ["Refund policy", "#"]]),
};

// ---------------- engine ----------------
const locale = JSON.parse(fs.readFileSync(path.join(THEME, "locales/en.default.json"), "utf8"));
const settingsSchema = JSON.parse(fs.readFileSync(path.join(THEME, "config/settings_schema.json"), "utf8"));
const settingsFile = JSON.parse(fs.readFileSync(path.join(THEME, "config/settings_data.json"), "utf8"));
const settingsData = typeof settingsFile.current === "string" ? settingsFile.presets[settingsFile.current] : settingsFile.current;
const settings: Record<string, unknown> = {};
for (const group of settingsSchema) for (const s of group.settings ?? []) if ("default" in s) settings[s.id] = s.default;
Object.assign(settings, settingsData, { contact_email: "hello@peak-side.com" });

const engine = new Liquid({ root: [path.join(THEME, "snippets")], extname: ".liquid", strictFilters: true, jsTruthy: false, dynamicPartials: true });

const lookup = (key: string) => key.split(".").reduce((o: any, k) => (o == null ? undefined : o[k]), locale);
engine.registerFilter("t", (key: string, ...args: unknown[]) => {
  const hash = Object.fromEntries((args as [string, unknown][]).filter(Array.isArray));
  let v = lookup(key);
  if (v && typeof v === "object" && "count" in hash) v = hash.count === 1 ? v.one : v.other;
  if (typeof v !== "string") throw new Error("missing translation " + key);
  return v.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => String(hash[k] ?? ""));
});
const imageName = (x: any): string | null => (x == null ? null : typeof x === "string" ? x : x.__img ?? x.preview_image?.__img ?? null);
engine.registerFilter("image_url", (x: any, ...args: unknown[]) => {
  const hash = Object.fromEntries((args as [string, unknown][]).filter(Array.isArray));
  const n = imageName(x);
  return n ? imgUrl(n, Number(hash.width ?? 960)) : "";
});
engine.registerFilter("image_tag", (url: string, ...args: unknown[]) => {
  const h = Object.fromEntries((args as [string, unknown][]).filter(Array.isArray)) as Record<string, string>;
  const name = url.replace(/^img\//, "").replace(/-\d+\.webp$/, "");
  const e = M[name];
  const srcset = h.widths ? h.widths.split(",").map((w) => `${imgUrl(name, Number(w.trim()))} ${w.trim()}w`).join(", ") : "";
  return `<img src="${url}"${srcset ? ` srcset="${srcset}"` : ""}${h.sizes ? ` sizes="${h.sizes}"` : ""} alt="${(h.alt ?? "").toString().replace(/"/g, "&quot;")}" width="${e?.w ?? 1}" height="${e?.h ?? 1}"${h.loading ? ` loading="${h.loading}"` : ""}${h.class ? ` class="${h.class}"` : ""}${h.style ? ` style="${h.style}"` : ""}>`;
});
engine.registerFilter("asset_url", (name: string) => `/assets/${name}`); // absolute, like Shopify CDN URLs
engine.registerFilter("stylesheet_tag", (url: string) => `<link rel="stylesheet" href="${url}">`);
engine.registerFilter("preload_tag", (url: string) => `<link rel="preload" href="${url}" as="font" type="font/woff2" crossorigin>`);
engine.registerFilter("money", (c: number) => money(Number(c)));
engine.registerFilter("money_with_currency", (c: number) => `${money(Number(c))} USD`);
engine.registerFilter("money_without_currency", (c: number) => (Number(c) / 100).toFixed(2));
engine.registerFilter("money_without_trailing_zeros", (c: number) => money(Number(c)).replace(/\.00$/, ""));
engine.registerFilter("json", (v: unknown) => JSON.stringify(v ?? null));
engine.registerFilter("handle", (v: string) => String(v).toLowerCase().replace(/[^a-z0-9]+/g, "-"));
engine.registerFilter("placeholder_svg_tag", (_n: string, cls = "") => `<svg class="${cls}" viewBox="0 0 10 10"></svg>`);
engine.registerFilter("payment_type_svg_tag", () => `<svg class="h-6 w-10" viewBox="0 0 38 24"><rect width="38" height="24" rx="3" fill="#F3F0EA"/></svg>`);
engine.registerFilter("default_errors", () => "Error");
engine.registerFilter("format_address", () => "");
engine.registerFilter("format_code", (v: string) => v);
engine.registerFilter("link_to", (t: string, u: string) => `<a href="${u}">${t}</a>`);
engine.registerFilter("metafield_tag", () => "");
engine.registerFilter("video_tag", () => "");
engine.registerFilter("color_to_rgb", (v: string) => v);
engine.registerFilter("payment_terms", () => `<p class="text-[13px] text-granite">Pay in 4 interest-free installments with Shop Pay</p>`);
engine.registerFilter("payment_button", () => `<button type="button" class="shopify-payment-button__button--unbranded w-full border border-ink py-4">Buy with Shop Pay</button>`);

// {% form 'type', obj, id: '', class: '' %}...{% endform %}
class FormTag extends Tag {
  tpls: Template[] = [];
  hash: Hash;
  type: string;
  constructor(token: TagToken, remain: TopLevelToken[], liquid: Liquid) {
    super(token, remain, liquid);
    const args = token.args;
    this.type = (args.match(/^'([^']+)'/) ?? [])[1] ?? "form";
    const rest = args.replace(/^'[^']+'\s*,?\s*/, "").replace(/^[a-z_.]+\s*,\s*/, "").replace(/^product\s*$/, "").replace(/data-product-form:\s*''/, "");
    this.hash = new Hash(rest);
    while (remain.length) {
      const t = remain.shift()!;
      if ((t as TagToken).name === "endform") return;
      this.tpls.push(liquid.parser.parseToken(t, remain));
    }
  }
  *render(ctx: Context, emitter: Emitter) {
    const h = (yield this.hash.render(ctx)) as Record<string, string>;
    const action = this.type === "product" ? "cart-add.html" : "#";
    emitter.write(`<form method="post" action="${action}"${h.id ? ` id="${h.id}"` : ""}${h.class ? ` class="${h.class}"` : ""}${this.type === "product" ? " data-product-form" : ""}>`);
    ctx.push({ form: { errors: null, posted_successfully: false, password_needed: true } });
    yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter);
    ctx.pop();
    emitter.write(`</form>`);
  }
}
engine.registerTag("form", FormTag as any);

// {% paginate x by n %}...{% endpaginate %}
class PaginateTag extends Tag {
  tpls: Template[] = [];
  constructor(token: TagToken, remain: TopLevelToken[], liquid: Liquid) {
    super(token, remain, liquid);
    while (remain.length) {
      const t = remain.shift()!;
      if ((t as TagToken).name === "endpaginate") return;
      this.tpls.push(liquid.parser.parseToken(t, remain));
    }
  }
  *render(ctx: Context, emitter: Emitter) {
    ctx.push({ paginate: { pages: 1, parts: [], current_page: 1 } });
    yield this.liquid.renderer.renderTemplates(this.tpls, ctx, emitter);
    ctx.pop();
  }
}
engine.registerTag("paginate", PaginateTag as any);
engine.registerTag("layout", { parse() {}, render() {} } as any);

// ---------------- section rendering ----------------
const readSection = (type: string) => {
  const src = fs.readFileSync(path.join(THEME, "sections", `${type}.liquid`), "utf8");
  const m = src.match(/\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}/);
  return { body: src.replace(m ? m[0] : "", ""), schema: m ? JSON.parse(m[1]) : {} };
};
function resolveSetting(def: any, value: unknown) {
  if (def?.type === "collection") return typeof value === "string" && value ? collections[value] ?? null : null;
  if (def?.type === "product") return typeof value === "string" && value ? byHandle[value] ?? null : null;
  if (def?.type === "link_list") return typeof value === "string" ? linklists[value] ?? null : null;
  if (def?.type === "image_picker" || def?.type === "video") return null;
  return value;
}
function buildSettings(defs: any[] = [], given: Record<string, unknown> = {}) {
  const out: Record<string, unknown> = {};
  for (const d of defs) if (d.id) out[d.id] = resolveSetting(d, d.id in given ? given[d.id] : d.default);
  return out;
}
async function renderSection(id: string, type: string, data: any, globals: Record<string, unknown>) {
  const { body, schema } = readSection(type);
  const blocks = (data.block_order ?? Object.keys(data.blocks ?? {})).map((bid: string) => {
    const b = data.blocks[bid];
    const def = (schema.blocks ?? []).find((x: any) => x.type === b.type);
    return { id: bid, type: b.type, settings: buildSettings(def?.settings, b.settings), shopify_attributes: "" };
  });
  const section = { id, settings: buildSettings(schema.settings, data.settings), blocks, shopify_attributes: "" };
  // Shopify exposes store-wide objects (settings, collections, shop…) inside snippets too.
  const html = await engine.parseAndRender(body, { ...globals, section }, { globals });
  const cls = schema.class ? ` ${schema.class}` : "";
  return `<${schema.tag ?? "div"} id="shopify-section-${id}" class="shopify-section${cls}">${html}</${schema.tag ?? "div"}>`;
}
async function renderGroup(name: string, globals: Record<string, unknown>) {
  const g = JSON.parse(fs.readFileSync(path.join(THEME, "sections", `${name}.json`), "utf8"));
  const parts = [];
  for (const id of g.order) parts.push(await renderSection(id, g.sections[id].type, g.sections[id], globals));
  return parts.join("\n");
}
engine.registerTag("sections", {
  parse(token: TagToken) {
    (this as any).name = token.args.replace(/['"]/g, "").trim();
  },
  *render(ctx: Context, emitter: Emitter) {
    const html: string = yield renderGroup((this as any).name, ctx.getAll() as Record<string, unknown>);
    emitter.write(html);
  },
} as any);

async function renderPage(file: string, templateName: string, extra: Record<string, unknown>, templateFile = templateName) {
  const tplPath = path.join(THEME, "templates", `${templateFile}.json`);
  const tpl = JSON.parse(fs.readFileSync(tplPath, "utf8"));
  const globals: Record<string, unknown> = {
    shop: { name: "Peak Side", description: "An outdoor brand", url: "index.html", customer_accounts_enabled: true, enabled_payment_types: ["visa", "master", "shopify_pay"], password_message: "", shipping_policy: { url: "#", title: "Shipping policy" }, refund_policy: { url: "#", title: "Refund policy" } },
    routes: { root_url: "index.html", all_products_collection_url: "collection-all.html", search_url: "search.html", cart_url: "cart.html", account_url: "#", product_recommendations_url: "recommendations.html", account_register_url: "#", account_logout_url: "#", account_addresses_url: "#" },
    settings,
    collections,
    linklists,
    pages: BARE ? {} : { "our-story": { handle: "our-story", url: "page-story.html" }, faq: { handle: "faq", url: "page-faq.html" } },
    cart: { item_count: 2, currency: { iso_code: "USD" }, items: [], total_price: 8690 },
    request: { design_mode: false, page_type: templateName, locale: { iso_code: "en" }, origin: "https://www.peak-side.com" },
    template: { name: templateName },
    canonical_url: "https://www.peak-side.com/",
    page_title: "Peak Side",
    page_description: "Outdoor hoodies, tees and crop tops.",
    content_for_header: "",
    additional_checkout_buttons: false,
    ...extra,
  };
  const sections = [];
  for (const id of tpl.order) sections.push(await renderSection(id, tpl.sections[id].type, tpl.sections[id], globals));
  const layout = fs.readFileSync(path.join(THEME, "layout", `${tpl.layout ?? "theme"}.liquid`), "utf8");
  const html = await engine.parseAndRender(layout, { ...globals, content_for_layout: sections.join("\n") }, { globals });
  fs.writeFileSync(path.join(OUT, file), html);
}

(async () => {
  await renderPage("index.html", "index", {});
  for (const p of products) await renderPage(`product-${p.handle}.html`, "product", { product: p, page_title: p.title, recommendations: { performed: false } });
  for (const [h, c] of Object.entries(collections)) await renderPage(`collection-${h}.html`, "collection", { collection: c });
  // Tops / Bottoms views of all products (what /collections/all?view=tops renders on Shopify)
  await renderPage("collection-view-tops.html", "collection", { collection: collections.all }, "collection.tops");
  await renderPage("collection-view-bottoms.html", "collection", { collection: collections.all }, "collection.bottoms");
  await renderPage("cart.html", "cart", {
    cart: {
      item_count: 2,
      currency: { iso_code: "USD" },
      total_price: 8690,
      note: "",
      cart_level_discount_applications: [],
      items: [products[0], products[6]].map((p) => ({ url: p.url, image: p.featured_media.preview_image, title: p.title, product: p, variant: p.selected_or_first_available_variant, quantity: 1, properties: {}, url_to_remove: "#", original_line_price: p.price, final_line_price: p.price })),
    },
  });
  await renderPage("404.html", "404", {});
  await renderPage("search.html", "search", { search: { performed: true, terms: "hoodie", results: products.slice(0, 4).map((p) => ({ ...p, object_type: "product" })), results_count: 4 } });
  await renderPage("page-story.html", "page", { page: { title: "Our story", content: "" } }, "page.story");
  await renderPage("page-faq.html", "page", { page: { title: "FAQ", content: "<p>Answers to common questions.</p>" } }, "page.faq");
  await renderPage("password.html", "password", {});
  for (const f of usedImages) fs.copyFileSync(path.join(ROOT, "public/images", f), path.join(OUT, "img", f));
  console.log(`rendered ${fs.readdirSync(OUT).filter((f) => f.endsWith(".html")).length} pages, ${usedImages.size} images`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
