# Peak Side Shopify theme: setup guide

Two files:
- **peak-side-shopify-theme.zip**: the theme. Upload it as-is; don't unzip it.
- **peak-side-360-images.zip**: front and back cut-outs for the 360° spin (28 images).

## 1. Upload the theme (about 2 minutes)
1. Shopify admin → **Online Store → Themes**.
2. **Add theme → Upload zip file** → choose `peak-side-shopify-theme.zip`.
3. On the uploaded theme, click **Customize** to preview it with the store's real products.
4. When it looks right, click **Publish**. The store can stay password-protected while you do this.

## 2. Collections (Products → Collections)
Create these collections. The home page looks for them by these exact handles:

| Collection | Handle | Used for |
| --- | --- | --- |
| Summer Edition | `summer-edition` | Summer Edition section under the hero |
| Winter Drop | `winter-drop` | Winter Drop section (snow) |
| Best Sellers | `best-sellers` | Best sellers grid. Optional: products tagged `best-seller` are used otherwise |
| Hoodies, Crop Tops | `hoodies`, `crop-tops` | Category tiles |

You can also pick any collection for each section in **Customize**.

## 3. Menus (Online Store → Navigation)
- `main-menu`: header and footer "Shop" column (for example Shop all, Winter Drop, Summer Edition, Story).
- `footer`: footer "Help" column (for example FAQ, Shipping policy, Refund policy).

## 4. Product tags (on each product)
- `best-seller`: shows the Best seller badge.
- `coming-soon`: shows "Coming soon" instead of Add to bag, for the Winter Drop until pre-orders open.
- Fit finder quiz: one `warmth:` tag, one `fit:` tag, and one or more `place:` tags, for example `warmth:cold`, `fit:oversized`, `place:tunnel`.
  - Warmth: `warmth:cold`, `warmth:warm`
  - Fit: `fit:oversized`, `fit:boxy`, `fit:cropped`, `fit:classic`
  - Place: `place:trail`, `place:tunnel`

## 5. 360° spin
1. **Settings → Custom data → Products → Add definition** twice:
   - Name "Spin front", key `custom.spin_front`, type **File (image)**.
   - Name "Spin back", key `custom.spin_back`, type **File (image)**.
2. On each product, set Spin front and Spin back using the matching images from `peak-side-360-images.zip`. The file names match the product names.

The quick alternative is to tag a product `360`. It then spins using its first two product photos.

Optional extra metafields: `custom.summary` (a short line under the price), `custom.fit_note` (for example "Size down for the best fit") and `custom.size_chart` (rich text).

## 6. Pages (Online Store → Pages)
- **Our story**: handle `our-story`, theme template **page.story**.
- **FAQ**: theme template **page.faq**. Edit the questions in Customize.

## 7. Theme settings (Customize → Theme settings)
Add the Instagram and TikTok links, the support email and a favicon. The discount code in the announcement bar is editable in the header section.

## Mobile
The theme was tested before delivery on iPhone SE, iPhone 13, iPhone 14 Pro Max, Pixel 7, Galaxy S9+, iPad Mini, iPad Pro and desktop. Checks covered: no sideways scrolling, all buttons large enough to tap, 16px form fields so iPhone doesn't zoom on tap, touch spinning, the sticky Add to bag bar, safe areas around the iPhone notch, and reduced-motion settings.

Before publishing, open Customize → **Share preview** and check the store on a real iPhone and a real Android phone.

## Good to know
- Every image section uses bundled Peak Side photos until you upload your own in Customize.
- Selling before stock arrives needs a Shopify pre-order app; the theme's `coming-soon` tag only changes the display.
- Product names, prices, sizes and stock all come from the Shopify admin.
