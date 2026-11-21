# Peak Side: custom Shopify theme ("Field Tag")

An original Shopify Online Store 2.0 theme for **Peak Side**, a Reno, Nevada clothing brand. Built by Marvani Marketing.
The products are the main subject:
- a **Garment Explorer** on every product (colourway → front, back, detail or worn → numbered details)
- honest fit information
- Trail & Town photos tagged with what's being worn

Products, checkout, payments and analytics stay in Shopify admin.

> **Status: built and tested locally. Not launch-ready.** Several items are marked **DO NOT PUBLISH UNTIL RESOLVED** in
> [`docs/05-RISK-REGISTER.md`](docs/05-RISK-REGISTER.md): photo licences and model releases, product image rights, fibre content, care and country of origin, and the placeholder email.

## Quick start

```bash
npm install
npm run dev            # local preview at http://localhost:4173 (real theme files, mock data)
npm test               # 36 end-to-end checks (Playwright + axe-core) → dev/tests/results.json
npm run theme:check    # Shopify Theme Check
npm run contrast       # WCAG contrast for every colour token pair → docs/contrast-report.md
npm run screenshots    # docs/screenshots/*.jpg
npm run package        # dist/peak-side-field-tag-theme.zip, ready to upload to Shopify
npm run artifact       # dist/artifact/: static multi-page design preview (shared as a private Claude Artifact)
```

Requires Node 20 or later. Playwright with Chromium must be available for `npm test` and `npm run screenshots`.

The preview server is a development tool, not Shopify. It renders `theme/` with LiquidJS and imitates the cart, filter, section-rendering and form endpoints.
Checkout, email delivery and analytics are **simulated**, and every page carries a "LOCAL PREVIEW" banner.

## Installing on Peak Side's existing Shopify store

The theme reads the store's own catalogue: products, photos, prices, inventory, variants, collections (including Cabin plaid, Tops and Bottoms), menus and cart. Checkout is Shopify's.

1. Use `release/peak-side-field-tag-theme-v1.1.0.zip` (or rebuild it with `npm run package`).
2. Shopify admin → Online Store → Themes → **Add theme → Upload zip file**. It installs **unpublished**; store data and the live theme are untouched.
3. Preview with **Customize** and work through [`docs/09-SHOPIFY-STORE-CONNECTION.md`](docs/09-SHOPIFY-STORE-CONNECTION.md).

## Repository layout

```
theme/                      The Shopify theme (this is what gets uploaded)
  layout/                   theme.liquid, password.liquid
  templates/                JSON templates: index, product, collection, page.story, page.contact, page.fit-guide, …
  sections/                 hero (opening screen), facts-strip, collection-tiles, featured-collection, fit-finder,
                            lookbook (Trail & Town), story-split, faq, main-product, main-collection, cart-drawer, …
  snippets/                 garment-explorer, product-card, facets, fit-scale, restock-form, image, icon, …
  assets/                   base.css (design tokens first), global.js, explorer.js, product.js, OFL fonts + licences
  config/, locales/         Theme settings and UI strings
dev/                        Local preview server, mock catalogue, tests, exporters (not uploaded)
  data/products.mjs         The 15 products: copy, colours, sizes, fit, detail-marker positions
  images/                   Preview-only copies of the current store photos (NOT CLEARED, see asset register)
docs/                       Strategy, design system, interactions, asset register, risk register,
                            analytics & data inventory, handoff checklist, test report, screenshots, import files
```

## Documentation

| Doc | Contents |
| --- | --- |
| [01 Strategy and direction](docs/01-STRATEGY-AND-DIRECTION.md) | Discovery answers, assumptions, three concepts, chosen direction, originality notes, sitemap |
| [02 Design system](docs/02-DESIGN-SYSTEM.md) | Three palettes with contrast, tokens, type, grid, motion |
| [03 Interactions](docs/03-INTERACTIONS.md) | Spec table for every interactive feature (written before coding) |
| [04 Asset register](docs/04-ASSET-REGISTER.md) | Every asset, its licence basis and clearance status |
| [05 Risk register](docs/05-RISK-REGISTER.md) | Pre-launch items, owners, next actions |
| [06 Analytics and privacy](docs/06-ANALYTICS-AND-PRIVACY.md) | Where to see visitor numbers, event dictionary, data inventory |
| [07 Handoff checklist](docs/07-HANDOFF-CHECKLIST.md) | Agency–client confirmations and Shopify setup steps |
| [08 Test report](docs/08-TEST-REPORT.md) | What was tested, results, what remains untested |
| [09 Shopify store connection](docs/09-SHOPIFY-STORE-CONNECTION.md) | v1.1 changes for the existing store, install steps, what to confirm |

## What's real and what isn't

- **Real (from the research PDF and Peak Side's store):**
  - product names, prices, sizes, colours and stock status as of 14 Nov 2026
  - the store's own product copy and fit notes
  - the shipping and returns policy wording
  - Reno, Nevada and worldwide shipping (client)
  - the tagline
- **Written new:** product descriptions and site copy (drafts for client approval). No claims, promo codes, reviews, badges, scarcity or invented history.
- **Not supplied, and not invented:** fibre content, weight, care, country of origin, measured size charts, the founder's details. These show as clearly marked placeholders while "Show missing-content placeholders" is on.
- **Placeholder:** contact email `hello@peak-side.com`.
