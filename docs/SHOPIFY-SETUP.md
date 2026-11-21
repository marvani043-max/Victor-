# Peak Side Shopify theme: setup guide

Files:
- **peak-side-shopify-theme.zip**: the website as a Shopify theme. Upload it as-is; don't unzip it.
- **peak-side-360-images.zip**: front and back images for the 360° spin (optional, see step 4).

## Required: upload and publish (about 2 minutes)
1. Shopify admin → **Online Store → Themes**.
2. **Add theme → Upload zip file** → choose `peak-side-shopify-theme.zip`.
3. Click **Customize** to preview it with the store's real products.
4. Click **Publish**. This works while the store is still password-protected.

That's all that's required. The site then works on its own:
- The menu shows **Shop all, Tops, Bottoms** (and Story once that page exists). Tops and Bottoms sort themselves: anything whose type or title says pants, sweatpants, joggers or shorts is a bottom, everything else is a top. If the store has its own collections with the handles `tops` and `bottoms`, the links use those instead.
- The Winter Drop sits right after "Mountains meet everyday." It fills itself with products tagged `coming-soon` or with "plaid" in the title. Summer Edition uses titles containing "Summer Edition"; Best sellers uses products tagged `best-seller`, otherwise the newest products.
- **Pre-orders:** a product shows "Pre-order" (badge and button) and can be bought when a size has **"Continue selling when out of stock"** turned on and no stock left, or when the product is tagged `pre-order`.
- Buttons never point at pages that don't exist. "Our story" stays hidden until that page is created (step 3).
- Products, prices, sizes, colours, stock, cart and checkout all come from Shopify.

## Recommended (makes it match the website exactly)
1. **Tags on products:**
   - `best-seller` on the best sellers.
   - `coming-soon` only on pieces that can't be bought yet (they show "Coming soon"). Don't use it on pre-order pieces: it hides the buy button.
2. **Fit finder quiz tags:** it only appears once at least two products have these tags, for example:
   - `warmth:cold` or `warmth:warm`
   - `fit:oversized`, `fit:boxy`, `fit:cropped` or `fit:classic`
   - `place:trail` and/or `place:tunnel`
3. **Pages** (Online Store → Pages):
   - Create "Our story" with handle `our-story` and theme template **page.story**.
   - Create "FAQ" with theme template **page.faq**.
4. **360° spin:**
   1. Go to **Settings → Custom data → Products → Add definition** and add two definitions: `custom.spin_front` and `custom.spin_back`, both of type **File (image)**.
   2. On each product, upload the matching images from `peak-side-360-images.zip` (the file names match the product names).
   3. Shortcut: tagging a product `360` makes it spin using its first two photos.
5. **Menus** (Online Store → Navigation): `main-menu` for the header (for example Shop all, Winter Drop, Summer Edition, Story); `footer` for the Help links.
6. **Scrolling banner:** it says "PayPal Pay in 4 at checkout", as on the website. Keep that only if PayPal is turned on in Shopify payments; you can edit it in Customize.

## Phones and tablets
Tested before delivery on iPhone SE, iPhone 13, iPhone 14 Pro Max, Pixel 7, Galaxy S9+, iPad Mini, iPad Pro and desktop:
- No sideways scrolling.
- Buttons large enough to tap.
- Form fields at 16px, so iPhone doesn't zoom when tapped.
- Touch works for the 360° spin, size and colour pickers, quantity, the sticky Add to bag bar and the cart.

Before going live, open **Customize → Share preview** and check the store on a real iPhone and a real Android phone.

## Good to know
- Every photo section uses the bundled Peak Side photos until you upload your own in Customize.
- Pre-orders work without an app (see above). A pre-order app is only needed for extras like deposits or a separate pre-order checkout.
