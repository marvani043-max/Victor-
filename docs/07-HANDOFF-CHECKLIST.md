# Handoff checklist: Marvani Marketing × Peak Side

None of these items is resolved by this document. Tick an item only when the actual agreement, approval or setting exists. No contract language is supplied here.

## A. Agency–client items to confirm

- [ ] **Approved scope and deliverables.** This repository delivers:
  - a custom Shopify theme
  - a local preview and test suite
  - product import and redirect CSVs
  - design, interaction, asset, risk and analytics documentation

  Confirm this matches the signed scope, and list anything else expected (for example a photo reshoot, app setup or email marketing).
- [ ] **Ownership and licensing of the final work.** Who owns the theme code, icons, ridge ornament and copy once paid? Is the agency allowed to reuse generic code?
- [ ] **AI assistance.** The theme code and copy were drafted with an AI coding assistant. Confirm the client is told, if the agreement requires it, and that human review is done.
- [ ] **Client responsibilities for supplied content and claims:**
  - photo licences and model releases
  - fibre content, care and country of origin
  - product statements
  - prices and stock
  - shipping, returns and privacy policies
- [ ] **Third-party fees and renewals:**
  - Shopify plan
  - any apps (back-in-stock, reviews, email)
  - domain renewal
  - Google Analytics (free tier)

  Confirm who pays each and who gets the renewal notices.
- [ ] **Portfolio publication.** May Marvani show this project publicly? If so, when, and with which images? (The lifestyle photos need the photographer's and models' permission for that use too.)
- [ ] **Hosting, domain and account ownership:**
  - The Shopify store should be owned by Peak Side, with Marvani added as a collaborator or staff account.
  - Domain registrar, DNS and email accounts in Peak Side's name.
  - Google Analytics property owned by Peak Side.
- [ ] **Maintenance and security:**
  - who updates the theme
  - who applies Shopify changes
  - who monitors forms and the inbox
  - 2-step verification on all accounts
  - response time for issues
- [ ] **Outstanding integrations and launch approvals.** Every **DO NOT PUBLISH** item in `05-RISK-REGISTER.md` needs to be resolved, and a named person at Peak Side signs off before launch.

## B. Shopify setup steps (in order)

1. **Store basics:**
   - Store name and sender email: Settings → Notifications.
   - Currency, Markets and shipping zones for "ships worldwide".
   - Taxes and duties, with an adviser.
2. **Metafield definitions** (Settings → Custom data → Products):
   - `custom.fit_profile`: single-line text, with choices `cropped`, `regular`, `boxy`, `oversized`.
   - `custom.fit_note`: single-line text.
   - `custom.fabric_care`: rich text. **Required before launch.**
   - `custom.size_chart`: rich text (optional, per product).
   - `custom.details`: list of metaobject references → `garment_detail`.
3. **Metaobject definition** `garment_detail`, with fields:
   - `label` (single-line text)
   - `note` (single-line text)
   - `view` (single-line text: `front` or `back`)
   - `x` (decimal, 0–100)
   - `y` (decimal, 0–100)

   Create entries from `docs/import/garment-details.json`.
4. **Import products:**
   - Products → Import → `docs/import/products.csv`.
   - Products import as **draft** with **0 stock**. Set the real stock for each variant.
5. **Upload product photos** to each product. Write alt text that names the colour and the view, for example `Black, front view`, `Black, back view`, `Pink, worn on the trail` or `Navy, detail of the zipper`. The Garment Explorer groups photos by this text. The suggested alt text for every current photo is in `garment-details.json`.
6. **Collections:**
   - `hoodies`, `zip-ups`, `tees`, `crop-tops` and `crewnecks`: automated, by product type.
   - `summer-edition`: automated, by tag.
   - `all` exists by default.
7. **Pages:**
   - `Our story` (template `page.story`)
   - `Contact` (template `page.contact`)
   - `Fit guide` (template `page.fit-guide`)
8. **Menus:**
   - `main-menu`: Shop all, Hoodies, Zip-ups, Tees, Crop tops, Fit guide, Story.
   - `footer`: Fit guide, Contact, Shipping policy, Refund policy, Search.
9. **Policies:** write the Shipping, Refund, Privacy and Terms pages in Settings → Policies (drafts need review).
10. **Search & Discovery app** → Filters: Availability, Product type, Color, Size, Price, and **Fit** (product metafield `custom.fit_profile`).
11. **Theme upload:**
    - `npm run package`, then upload `dist/peak-side-field-tag-theme.zip` (Online Store → Themes → Add theme).
    - Or use Shopify CLI: `shopify theme push --path theme --unpublished`.
12. **Theme editor:**
    - Re-pick the images for Trail & Town and Story.
    - Set the contact email.
    - Check the facts strip against the policies.
    - Pick the featured explorer product.
    - Turn **off** "Show missing-content placeholders" once fabric, care and size charts are filled in.
13. **Privacy:**
    - Settings → Customer privacy: cookie banner and regions.
    - Then, optionally, the custom pixel (`docs/analytics/custom-pixel.js`).
14. **Redirects:** Online Store → Navigation → URL Redirects → Import `docs/import/redirects.csv`.
15. **Spam protection:** Online Store → Preferences → turn on Shopify's spam protection (CAPTCHA) for contact and customer forms.
16. **Test on the real store:**
    - Add to bag, filters, recommendations and forms (contact, restock, newsletter all reach the inbox or Customers).
    - Checkout with Shopify's test payment gateway.
    - Real phones (iOS Safari, Android Chrome).
    - Manual screen-reader pass.
17. **Domain:** connect `peak-side.com`. Keep email DNS records. Keep Wix running until redirects and orders are verified.
