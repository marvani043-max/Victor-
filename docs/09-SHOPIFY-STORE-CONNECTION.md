# Connecting the theme to Peak Side's existing Shopify store (v1.1.0)

The theme ZIP (`npm run package` → `dist/peak-side-field-tag-theme.zip`) is a Shopify Online Store 2.0 theme.
It **reads** the store's live data: products, photos, descriptions, prices, compare-at prices, inventory, options, variants, collections, menus, pages, policies and cart.
It contains no product data, no prices and no stock levels, and it doesn't create, change or delete anything in the store.
Checkout is Shopify's own.

> **Not yet checked against the real store.** The admin screenshots mentioned in the request did not arrive. Marvani has no access to the store.
> v1.1 was therefore built so it doesn't depend on exact collection handles, option names or alt text.
> Check the items in "To confirm on the real store" in the theme preview before publishing.

## What changed from v1.0 (and why)

| Area | v1.0 assumed | v1.1 behaviour on the existing store |
| --- | --- | --- |
| Home and Story templates | Product handles, collection handles (hoodies, tees…) and image files from a fresh setup | Only references every store has: the `all` collection and the default `main-menu` and `footer` menus. Photos and products are chosen in the theme editor. |
| Shop by type | Five hard-coded collections | With no blocks, lists the store's **own collections** automatically (skips "All", "Home page" and empty ones), so **Cabin plaid, Tops and Bottoms** appear without setup. Add blocks to choose the order. |
| Opening-screen product | A fixed handle | The product picked in the editor, otherwise the first in-stock product with photos |
| Product photos ↔ colours | Alt text had to name the colour and view | Colour comes from alt text **or from Shopify variant images** (the image attached to each variant). Photos linked to no colour show for every colour. |
| Reaching every photo | One photo per view | Thumbnails, previous/next buttons and arrow keys. Front/Back/Detail/Worn buttons appear only when the alt text names those views; otherwise the corner shows "2 / 5". Shopify videos are supported. |
| Colour-type option | Option named Color/Colour | Any option whose name contains Color or Colour, or is Pattern or Print, gets swatches. Swatches use Shopify's native option swatches (colour or image), then common colour names, then the **variant's own photo** (good for patterns like a plaid). Other options get dropdowns. |
| Selected variant | Explorer followed colour only | Choosing a variant also shows its own photo if the store has assigned one |
| Sale prices | Not shown | The compare-at price is shown struck through when Shopify has one higher than the price. It updates per variant. |
| Fit | Metafield only | Metafield `custom.fit_profile`, then a tag such as `fit:boxy`, then the words Oversized, Boxy or Crop in the product title. The fit finder hides itself if no product has a cut. |
| Lookbook / Story | Showed empty "Image" boxes without photos | The lookbook stays hidden until a look has a photo. Story falls back to text only and can link to the store's story, about-us or about page. |
| Contact and fit-guide links | Pages selected in theme settings | Theme setting, otherwise the store's own page with handle `contact` / `fit-guide`. Links are hidden if neither exists. |
| Customer accounts | No templates (new accounts only) | All seven classic account templates (login, register, account, order, addresses, activate, reset), so either account type works |
| Copy | Some fit claims about specific products in section text | Section text is general. Product facts come only from each product's own data. |
| Product import CSV | Suggested importing products | **Removed.** The store already has its catalogue, and importing would create duplicates. |

## Installing without touching the live site

1. **Online Store → Themes → Add theme → Upload zip file** and choose `peak-side-field-tag-theme.zip`. It's added as an **unpublished** theme; the live theme and all store data are untouched.
2. Use **Customize** on the new theme to preview it with the real catalogue. Nothing changes for shoppers until someone clicks Publish.
3. In the theme editor:
   - Opening screen: optionally pick the product for the Garment Explorer.
   - Shop by type: leave empty to list all collections, or add blocks for Cabin plaid, Tops and Bottoms in your order.
   - Trail & Town and Story: choose **licensed** photos (see the asset and risk registers), tag products, set marker positions.
   - Theme settings → Contact: replace the placeholder email.
   - Theme settings → Content review: placeholders for missing fabric and size-chart facts are **on** for the preview. They show "To be supplied" boxes. Turn them off before publishing, or fill in the facts.
4. **Optional data** (nothing is required for the theme to work). These change store settings, so do them only when Peak Side approves:
   - Product metafields `custom.fit_profile`, `custom.fit_note`, `custom.fabric_care`, `custom.size_chart`, or `fit:` tags.
   - Variant images per colour (Products → variant → image).
   - Native option swatches (Products → option values).
   - Assign the `page.contact`, `page.fit-guide` and `page.story` templates to existing pages.

## To confirm on the real store (in the unpublished theme's preview)

- [ ] Collection handles and titles for Cabin plaid, Tops and Bottoms appear in Shop by type, and their collection pages filter correctly.
- [ ] Option names (for example Color and Size): swatches and size buttons appear. Any other option gets a working dropdown.
- [ ] Choosing each colour shows the right photos. If not, attach variant images or add the colour name to the photo alt text.
- [ ] Prices, compare-at prices and sold-out sizes match Shopify admin for a few products.
- [ ] Add to bag → bag drawer → **Check out** opens Shopify checkout (test with Shopify's test payments or a draft order; don't place a real order unintentionally).
- [ ] Filters on collection pages: the store's Search & Discovery filters appear. Colour swatches use native swatch colours where set.
- [ ] Customer account links work with the store's account type (new or classic).
- [ ] Contact and restock forms arrive at the store's sender email.

## What the theme reads (no writes)

| Shopify data | Used for |
| --- | --- |
| `product.title`, `description`, `media`, `variants`, `options_with_values`, `price`, `compare_at_price`, `available`, `type`, `tags`, `vendor` | Product pages, cards, explorer, variant picker, availability, sale prices |
| `variant.featured_media` | Colour → photo mapping, swatch images, showing the selected variant's photo |
| `collections`, `collection.products`, `collection.filters`, `sort_options` | Shop by type, collection pages, filters, the product range |
| `product.metafields.custom.*` (optional) | Fit, fit note, fabric & care, size chart, detail markers |
| `linklists['main-menu']`, `linklists.footer` | Header, mobile menu and footer navigation |
| `pages`, `shop.policies` | Contact, fit guide and story links; policy links |
| `cart`, `/cart/add.js`, `/cart/change.js`, `/checkout` | Bag drawer, cart page, Shopify checkout |
| `recommendations` | "Wear it with" |
| `customer`, `customer.orders`, `customer.addresses` | Account pages (classic accounts) |
