# Test report

The run date is recorded in `dev/tests/results.json`. Every check below was actually run.
Environment: headless Chromium (Playwright 1.63) against the local preview server. The preview renders the real theme Liquid, CSS and JS with mock Shopify data.
Passing here means the theme's front-end behaves as specified in that environment. **It does not mean the live Shopify store is tested, accessible, secure or compliant.**

## Results

| Check | Result |
| --- | --- |
| Shopify Theme Check (`npm run theme:check`, @shopify/theme-check-node 3.22, recommended config) | **0 offenses** |
| Colour contrast for every token pair used (`npm run contrast`) | **33 / 33 pass** WCAG 2.2 AA (see `contrast-report.md`) |
| End-to-end checks (`npm test`) | **36 / 36 pass** (v1.1) |
| Theme Check on the extracted upload ZIP | **0 offenses**; no preview files, mock data or hard-coded prices inside |

### End-to-end checks

| Area | What was checked |
| --- | --- |
| Layout | Ran at 360, 768 and 1440 px on 25 pages (home, 5 collection and list pages, 3 content pages, search, cart, all 15 products). Each returns 200, has no horizontal overflow, has exactly one h1, gives every image alt plus width and height, and logs no console or network errors. |
| 404 | Returns status 404, with shop and search links. |
| Links | 37 unique internal hrefs resolve. No `#` placeholder links. |
| Accessibility | axe-core 4.10 (WCAG 2.0/2.1/2.2 A and AA plus best-practice rules) on 8 key pages at 360 and 1440 px: **0 violations**. Skip link is the first Tab stop and moves focus to main. A visible focus indicator was confirmed on the first 25 Tab stops. |
| Garment Explorer | Colour swap. Views with no photo are hidden (pink has no back view). Markers and the details list stay in sync. A list item switches to its view. Arrow keys move between views. Zoom dialog: Esc closes and focus returns. |
| Product | Colour choice updates the explorer, size label and URL. Add to bag shows `aria-busy`, and the drawer opens only after the add succeeds. Bag count updates; quantity and remove work. Sold-out items show a disabled button with text, and the server rejects the add (422). The mobile sticky bar appears after scrolling. The size guide dialog shows the brand fit note. |
| Forms | Restock, contact and newsletter: inline errors with `aria-invalid` and focus on the first error. Server-side errors render. Success appears only after the (simulated) Shopify redirect, and the confirmation gets focus. |
| Filters | The grid updates without a page reload, the URL updates, the count is announced in the live region, chips remove filters, sort works, and Back restores the view. The mobile drawer is modal, traps focus, and Esc returns focus. |
| Navigation | Mobile menu dialog: `aria-expanded` updates, Esc closes it and focus returns. The header search focuses its field and returns results. |
| Fit finder, Trail & Town | Choosing a cut shows the matching pieces. Lookbook markers open product cards and Esc closes them. The product list under each photo is always present. |
| Motion | `prefers-reduced-motion` sets durations to 0 and the explorer swaps instantly. The footer toggle persists across pages. |
| Analytics | Explorer and fit interactions publish `ps_*` events through `Shopify.analytics.publish` (a stub in the preview). |
| Layout shift | Cumulative layout shift during load plus 1.5 s: 0.000–0.002 on home, product and collection at 360 and 1440 px. This is a measurement, not a Lighthouse score. |

### Page weight (measured once, local server, desktop Chromium)

| Page | Width | Transferred | Images |
| --- | --- | --- | --- |
| Home | 390 px | 382 KB | 11 |
| Home | 1440 px | 441 KB | 18 |
| Product (Double Zip Hoodie) | 390 px | 233 KB | 1 |
| Collection (all) | 390 px | 520 KB | 27 |

On real touch devices the hover-only back images aren't downloaded, so the collection figure there should be lower (not measured).
No frame-rate or Lighthouse score is claimed.

### v1.1 store-connection checks

These were added for the existing store. They run against the mock catalogue, set up to look like a real store: plain alt text, variant images, and no fit metafields on most products.

- **Variant images:** with plain alt text, variant images still map photos to colours, and choosing Flower Gray shows that variant's own photo and its 3 thumbnails.
- **Every photo reachable:** thumbnails, previous/next and arrow keys work. The counter ("1 / 2") replaces view buttons when views are unknown.
- **Fit:** the cut comes from the metafield, then the tag, then the title. Crop tops are inferred from their titles, and products with no signal show no fit.
- **Theme as uploaded** (no preview demo photos):
  - "Shop by type" lists the store's collections automatically.
  - No empty photo boxes.
  - Story falls back to text.
  - The hero picks an in-stock product.
  - No overflow.
- **Sale prices:** the compare-at price shows struck through only when it's higher than the price.

**Not verified:** behaviour on Peak Side's real store. Collection handles, option names and photo setup could not be checked because the admin screenshots weren't received. See `09-SHOPIFY-STORE-CONNECTION.md`.

## Status of each part

**Verified in the local preview** (automated, Chromium):
- Everything in the end-to-end table above, plus Theme Check and contrast.

**Implemented but untested on a real Shopify store:**
- Cart AJAX and Section Rendering with real section IDs.
- Search & Discovery filter output, including the Fit metafield filter.
- Product recommendations and `structured_data` output.
- `preload_tag`.
- Metaobject field access for garment details.
- Contact, customer and localization forms.
- Policy URLs.
- The theme editor experience.

**Untested anywhere:**
- Safari and Firefox. Only Chromium was run, so check `<dialog>` and `:has()` behaviour on older iOS versions.
- Real phones.
- Manual screen readers (VoiceOver, NVDA, TalkBack).
- Zoom to 400% and Windows High Contrast.

**Prototype-only:**
- `dev/server.mjs` and its mock data.
- Simulated checkout page.
- Simulated form delivery (nothing is emailed).
- The `Shopify.analytics` stub.
- The "LOCAL PREVIEW" banner.

**Needs external integration or assets:**
- Real product photos with licences.
- Fabric, care and country of origin.
- Size charts.
- A real contact mailbox.
- Shopify Markets, shipping and tax settings.
- GA4 pixel activation (after consent setup).
- Optional apps: back-in-stock automation, genuine reviews, email platform.

## Stage C: five highest-impact weaknesses found and what was done

| # | Weakness | Fix |
| --- | --- | --- |
| 1 | The opening section ran almost two screens tall on mobile, because the hero explorer showed the full details list | Added a compact explorer mode on the home page: labels in two columns, notes kept for screen readers. The full list stays on product pages. |
| 2 | Product pages downloaded every colourway's photos up front (735 KB on mobile) | Inactive slides use `display: none`, so lazy images load only when chosen. Hover images are skipped on touch screens. Mobile product page dropped to 233 KB. |
| 3 | On mobile, the details list pushed the title, price and Add to bag far below the photo | Reordered on mobile: photo, view controls, then title, price and buy box, then the details list. |
| 4 | Story copy put words in the founder's mouth ("The idea was simple…") | Rewritten as a neutral brand line. All story copy is flagged for founder approval. |
| 5 | Product photography is inconsistent: studio cut-outs mixed with floor flat-lays, and a point-of-view shot for the White Globe Hoodie | Partly mitigated: non-square photos now fill their frames instead of floating on the stone ground. **Can't be fixed in code.** A reshoot is recommended (risk register #15). |

Other bugs found by the tests and fixed:
- Bag count didn't update after an add (the count was read after the drawer node had moved).
- The sticky buy bar didn't appear when the page jumped past the button.
- The form confirmation lost focus to the URL fragment.
- The Story page had no h1.
- The announcement bar sat outside a landmark.
- A heading-order skip in the explorer.
- The default sort was written into filter URLs.
- The size-guide link sat on the wrong line.
- The facts strip lost its side padding because of a list-reset specificity clash.
