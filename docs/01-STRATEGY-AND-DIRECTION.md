# Peak Side: strategy and approved direction

Prepared by Marvani Marketing. This is the record of Stage A (discovery and direction) and the decisions confirmed by the client before the build.

## Source labels

| Label | Meaning |
| --- | --- |
| **Observed** | Seen directly in the research PDF's screenshots (captured 14 Nov 2026) |
| **Described** | Stated in the research PDF's text |
| **Client** | Confirmed by the client in this project's discovery answers (19 Nov 2026) |
| **Proposed** | Marvani recommendation. Not a business fact |

No reference websites (Zara, YoungLA, etc.) were browsed during this project, and no reference animation was watched.
The design draws on general principles only (listed below), not on any one site.

## Discovery answers (Client)

| Topic | Answer | How the build uses it |
| --- | --- | --- |
| Platform | Shopify store | Custom Shopify Online Store 2.0 theme. Products, checkout, payments and analytics stay in Shopify admin |
| Photos | Shot by a professional photographer; the people pictured are 18+ | Photos are uploaded by the store owner into Shopify. The theme ships with **no** photographs. Written licence and model releases still need to be filed (see risk register) |
| Product copy | "Give a description people would enjoy" | New product descriptions written from the store's own copy and what's visible in photos. **Fibre content is not invented**: US textile labelling rules require it to be accurate, so it's a clearly marked field to fill in |
| Location | Reno, Nevada; ships anywhere; anyone can buy | Shown as "Based in Reno, Nevada". Worldwide shipping is configured in Shopify Markets. Privacy questions for an international audience are flagged |
| Email | Use a placeholder for now | `hello@peak-side.com` as a theme setting, marked DO NOT PUBLISH until the mailbox exists |
| Analytics | Visitor counts and "anything you can think of" | Shopify Analytics (built in), plus consent-aware custom interaction events and an optional GA4 custom pixel that isn't switched on (see `ANALYTICS.md`) |
| Tagline | "MOUNTAINS MEET EVERYDAY", do what's best | Used as the opening headline. Flagged for a trademark check |
| Claims | No claims, no free-shipping codes | No promo codes, "best seller" labels, review stars, scarcity, age claims or payment-plan claims |

### Assumptions (not business facts)

- **Audience:** teens and young adults (18+ in campaign photos) into skiing, snowboarding, being outside and oversized streetwear. Inferred from the product copy, not from analytics.
- **Mobile Instagram traffic:** many visitors arrive from Instagram on phones (Observed: research screenshots were taken in Instagram's in-app browser).
- **Shipping and returns policy:** carried over from the current site (Described). Must be re-entered and confirmed in Shopify's policy settings.
- **Fit profiles** (cropped, regular, boxy, oversized) come from product titles and the store's own fit notes. Two products (the White Globe Hoodie and the Crewneck) have no stated fit, so none is assigned.

## Strategy

- **Offer:** 15 tops ($25.95–$64.95): faded oversized hoodies, double-zip hoodies, a crewneck, Summer Edition tees and off-shoulder crop tops (Described).
- **Visitor's main question:** "Will this fit me, and is it worth it?" Visitors have already seen the vibe on Instagram. The site has to add confidence.
- **Objections and answers:**

| Objection | Answer on the site |
| --- | --- |
| How does it fit? | A fit scale on every product, the brand's own fit notes, and a how-to-measure guide. Measured chart is pending |
| What's it like? | Front/back views, detail markers and descriptions on every product |
| Can I trust a small brand? | Shipping and returns summary next to the buy button, a real contact form, and Shopify's own checkout |
| It's sold out | Restock request form (real submission through Shopify's contact form) |

- **Conversion path:** Instagram → product page (pick colour, check fit) → Add to bag → Shopify checkout.
  - Fallbacks: restock request, newsletter, Instagram.

## Three directions presented

| | A. Trail / Tunnel | **B. Field Tag (approved)** | C. Camera Roll |
| --- | --- | --- | --- |
| Thesis | Every piece lives in two places; move between mountain and town | The garment is the subject. Honest fit facts help a first-time buyer choose | The friend group became a brand; the site is their camera roll |
| Built around | Lifestyle photography | Product and fit information | Candid photos |
| Signature | Ridge-line scrubber through looks | Garment Explorer | Swipeable photo stack with tap-to-shop tags |
| Main risk | Depends on photos of people | Can feel like a catalogue; needs consistent product photos | Cluttered on mobile; heaviest reliance on people and graffiti art |

## Approved direction: Field Tag, with brand blossom pink

The client asked us to "do everything possible to make the best website," and that was taken as approval of the recommended direction.
One supporting principle comes from A: trail and town photography as context, each photo tagged with what's being worn.
The accent colour was switched from blaze orange to Peak Side's own blossom pink (homepage banner, pink faded hoodie, cherry-blossom graphic) so the site matches the products.

### Principles that informed the concept (general, not copied)

1. Show the product first, on a consistent ground, at a size where you can judge it.
2. Answer fit and quality questions next to the buy button, not in the footer.
3. Use lifestyle photography as evidence of how the clothes are worn, and make it shoppable.
4. Keep the visual system quiet so the garments and photos do the talking.

### What makes it independently distinctive

- **A visual language taken from Peak Side's own world:**
  - Hang-tag spec chips (type, fit, sizes).
  - Numbered trail-blaze markers for garment details and lookbook tags.
  - A hand-drawn ridge line as the only ornament.
- **The Garment Explorer** is built around this catalogue's real data: colourways, front/back views, store-copy details and fit notes.
- **Pine (actions) + blossom (markers):** the trail and the street, matching the photos (pine trees, pink hoodie, blossom print).

### Similarity concerns for human review (design precaution, not a legal opinion)

- Spec-sheet and utility aesthetics are common across outdoor and streetwear retail. No single brand's label shapes, typography or layout were referenced, but a designer should check against Peak Side's direct competitors.
- "Peak Side", the PKS script mark and "MOUNTAINS MEET EVERYDAY" have **not** had a trademark search. Other "Peak"-named outdoor brands exist in the category generally. Needs qualified clearance before any trademark investment.
- Graffiti in the town photos is third-party artwork (see risk register).

## Sitemap

```
Home
Shop (/collections/all) — filter: type, colour, size, fit, availability, price; sort
  Hoodies · Zip-ups · Tees · Crop tops · Crewnecks · Summer Edition
Product pages ×15 (Garment Explorer, buy box, fit, shipping/returns)
Fit guide (/pages/fit-guide)
Story (/pages/story)
Contact (/pages/contact) — real Shopify contact form; restock requests use it too
Shipping & returns (Shopify policy pages + FAQ)
Search · Cart · 404 · Password (pre-launch)
```

## Homepage sequence

1. **Opening screen:**
   - Headline "MOUNTAINS MEET EVERYDAY." What Peak Side sells, the price range, sizes and where it's based.
   - Buttons: **Shop the range** and **Find your fit**.
   - A live Garment Explorer on a featured hoodie.
2. **Facts strip:** shipping, returns and contact (all editable in the theme editor; no promotional claims).
3. **Shop by type:** counts and starting prices pulled live from Shopify.
4. **The range:** product grid with colour swatches and sold-out states.
5. **Fit, in plain words:** an interactive fit scale that filters products by cut.
6. **Trail & Town:** campaign photos with numbered markers for what's worn.
7. **Story:** the founder's outdoors-to-brand story (no age or personal details).
8. **Help:** shipping/returns summary, FAQ, contact.
9. **Newsletter:** a separate, explicit marketing opt-in.
