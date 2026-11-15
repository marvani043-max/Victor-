# Peak Side: creative direction & launch notes

## The idea: Trail / Tunnel

Peak Side's own photos keep returning to two places: **granite waterfalls and switchbacks**, and **graffiti tunnels in town**.
The tagline already says it: *Mountains meet everyday.* The old site hid this behind a white template grid.
The redesign builds the whole experience around that tension:

- **Hero:** the screen is split between trail and tunnel. On desktop, hovering a side opens it up.
- **Lookbook:** a Trail / Tunnel toggle. Every look links to the exact product being worn.
- **Ridge-line divider:** a small hand-drawn mountain profile used as the recurring graphic motif.

## Visual system

| | |
| --- | --- |
| **Display type** | Archivo Variable at 62% width, weight 800, uppercase. Condensed and loud, like a trail sign or a sticker. |
| **Statement type** | Archivo at 125% width for wide editorial lines. The same family, so the type stays coherent. |
| **Labels** | IBM Plex Mono, uppercase, tracked out. Reads like a trail marker or a garment tag. |
| **Ink** `#11110F` | Primary text and dark sections |
| **Bone** `#F3F0EA` | Base background: warmer than white, like unbleached cotton |
| **Stone** `#E6E2DA` | Product-card ground. Studio cut-outs are blended onto it with `multiply` so the white boxes disappear |
| **Granite** `#6F6C66` | Secondary text |
| **Sakura** `#F2A3C4` / **Bloom** `#E0558F` | The only accent, taken from the brand's own cherry-blossom graphic and pink faded hoodie |

Sharp corners throughout, with no rounded "app" cards. Motion is slow and eased (0.22, 1, 0.36, 1): reveals,
clip-path wipes and hover image swaps. Everything respects `prefers-reduced-motion`.

## Conversion decisions

- **Checkout handoff is explicit.** The button reads "Choose size & checkout · $55.95", and the line under it says
  you'll pick your size and pay on the official store. There is no fake cart.
- **Promo code** is in the announcement bar with a one-tap Copy, and repeated under every buy button.
- **PayPal Pay in 4** is shown under the price, matching what the store displays.
- **Sold-out best seller turned into a lead.** The three heavyweight zip-ups have "Notify me" buttons that open a
  pre-filled restock email, and the home page points people to the in-stock Double Zip Hoodie.
- **Sticky buy bar on mobile** appears once the main button scrolls out of view.
- **Shoppable lookbook:** every campaign photo links to the product in it.
- **Navigation by product type.** Hoodies, Zip-ups, Tees, Crop tops and Crewnecks replace the old Men/Women split,
  which pointed to an empty women's category.

## SEO

- Unique title and description on every page, plus canonical URLs, an XML sitemap and robots.txt.
- JSON-LD: `Organization` site-wide, `Product` + `Offer` (price and availability) + `BreadcrumbList` on every product page,
  and `FAQPage` on Shipping & Returns.
- Semantic headings (one H1 per page), descriptive alt text on all product and campaign images.
- Static HTML with self-hosted fonts, responsive WebP `srcset` and lazy loading below the fold.
- **Local SEO is not set up yet:** no location is published. Add the city or region to `site.location` and the Story copy once confirmed.

## Before launch: checklist for Peak Side

1. **Approve image use.** All photos come from peak-side.com. Confirm everyone pictured is happy to appear,
   including parental consent where needed.
2. **Email.** The site uses the address published on the current store. A brand address (for example hello@peak-side.com) is recommended.
3. **Promo code.** Confirm `FREESHIP2026` is still valid and when it expires.
4. **Fabric, weight and care** for each product, plus a measured size chart.
5. **Story details:** founding year, home region, and whether the founder wants their first name shown.
6. **Product names.** The store spells "White globe hooide". This site shows "White Globe Hoodie". Fixing the Wix
   title is fine, but keep its URL slug or update `storeSlug`.
7. **Reshoot** the five floor flat-lay products on a seamless background (see `HIGGSFIELD-PROMPTS.md`).
8. **Domain plan:** decide whether this site takes over `peak-side.com` and Wix moves to `shop.`.
9. **Reviews.** The store has a review page but no published reviews. Add a reviews section only once real ones exist.

## Possible next phase

- **Wix Headless cart:** a real on-site bag with variant selection, redirecting to Wix checkout. Needs a Wix Headless OAuth client ID
  and Wix's `@wix/sdk` + `@wix/ecom` packages. This would remove the size re-selection step.
- **Restock alerts and newsletter** through an email platform (Klaviyo, Mailchimp or Wix Automations) instead of `mailto:`.
- **Analytics:** GA4 or Plausible, with outbound-click events on the checkout buttons.
