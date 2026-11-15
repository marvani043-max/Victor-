# Peak Side: storefront front-end

A custom brand storefront for **Peak Side**, built by Marvani. Visitors browse, filter and explore products here.
Size selection, cart and payment are handed off to the existing Peak Side store on Wix, at
`peak-side.com/product-page/<slug>`.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # static export to ./out
npm start          # serve ./out locally
npm run typecheck
```

Requires Node 20 or later.

## Configuration

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | `https://www.peak-side.com` | Canonical URLs, sitemap, Open Graph, JSON-LD |
| `NEXT_PUBLIC_STORE_URL` | `https://www.peak-side.com` | Where "Choose size & checkout" sends shoppers |
| `NEXT_PUBLIC_NOINDEX` | unset | Set to `1` for client-preview builds so search engines ignore them |

> **Domain plan.** If this site replaces the Wix site on `peak-side.com`, move the Wix store to a subdomain
> (for example `shop.peak-side.com`) and set `NEXT_PUBLIC_STORE_URL` to match. Otherwise the checkout links point at this site.

## Deploying

The build is a fully static export (`out/`), so it can be hosted anywhere.

- **Vercel / Netlify / Cloudflare Pages:** build command `npm run build`, output directory `out`.
- Set the two environment variables above in the host's dashboard.

## Claude Artifact preview

`npx tsx scripts/build-artifact-preview.ts` builds `preview/`: a single-page version of the site (same data, photos and design) for sharing as a Claude Artifact. It carries a "Design preview by Marvani" bar so it can't be mistaken for the official store.

## Where things live

```
src/data/site.ts        Business facts: email, Instagram, promo code, policies, store URL, optional hero video
src/data/products.ts    All 15 products: price, stock, sizes, colourways, images, store slug
src/data/faq.ts         FAQ (restates the published policy only)
src/components/         Header, Hero, Lookbook, ShopGrid, ProductDetail, ProductCard, ...
src/app/                Routes: /, /shop, /shop/[slug], /story, /shipping-returns, sitemap, robots
scripts/process-images.mjs  Turns original photos into responsive WebP files in public/images
docs/                   Creative direction and Higgsfield asset brief
```

### Updating products

Products are hand-maintained in `src/data/products.ts`. To change price or stock, edit the entry and redeploy.
`storeSlug` must match the product's URL on the Wix store.

### Adding images

1. Put the originals in a folder, named starting with an ID (for example `abc12345.jpg`).
2. Add `"my-image-name": ["abc12345", "photo" | "studio"]` to `MAP` in `scripts/process-images.mjs`.
3. Run `SRC=/path/to/folder npm run images`, then reference `"my-image-name"` in the data files.

## What's real and what's a placeholder

Everything shown was taken from the live store on **15 Nov 2026**: products, prices, stock, sizes, colours,
descriptions, the founder's About text, the shipping and returns policy, the email, Instagram and the promo code.
No reviews, awards, statistics or history were invented.

Clearly marked placeholders, shown on the page with a pink rule, still need Peak Side's input:

- Fabric composition, weight and care, for every product
- A measured size chart
- Founding year, home region and how the pieces are made (Story page)

See `docs/CREATIVE-DIRECTION.md` for the full launch checklist.
