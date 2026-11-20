# Analytics and data inventory

## "How many people viewed the website?"

**Shopify Analytics** is built into every Shopify plan and needs no code. It starts collecting when the store goes live.

| Question | Where to look in Shopify admin |
| --- | --- |
| How many people visited | Analytics → Reports → *Sessions over time* and *Online store visitors* |
| Who's on the site right now | Analytics → **Live View** |
| Where visitors came from (Instagram, Google, direct) | Reports → *Sessions by referrer* |
| Phone or desktop | Reports → *Sessions by device type* |
| Which countries and cities | Reports → *Sessions by location* |
| Which products get viewed and bought | Reports → *Product views* / *Top products by units sold* |
| Where shoppers drop off | Reports → *Conversion over time* (sessions → added to cart → reached checkout → purchased) |
| Which searches find nothing | Search & Discovery app → *Search terms with no results* |

Shopify's own data collection follows the store's Customer privacy settings.

## Theme interaction events ("anything you can think of")

These show which tools actually help shoppers. The theme publishes them with `Shopify.analytics.publish()` into Shopify Customer Events.
They contain no personal data: event name, product handle and the choice made. They can be turned off in Theme settings → Analytics.

| Event | Sent when | Data |
| --- | --- | --- |
| `ps_explorer_colour_changed` | A colourway is chosen in the Garment Explorer or variant picker | product, colour |
| `ps_explorer_view_changed` | Front, Back, Detail or Worn is chosen | product, view |
| `ps_explorer_detail_opened` | A numbered detail is opened | product, detail |
| `ps_explorer_zoom_opened` | The zoom is opened | product, view |
| `ps_size_selected` | A size is chosen | product, size |
| `ps_size_guide_opened` | The size guide is opened | product |
| `ps_fit_selected` | A cut is chosen in the fit finder | fit |
| `ps_filter_applied` | Collection or search filters change | query string |
| `ps_lookbook_tag_opened` | A Trail & Town tag is opened | product |
| `ps_card_colour_previewed` | A swatch is tapped on a product card | colour |
| `ps_restock_requested` | **After Shopify confirms** a restock request | confirmed |
| `ps_contact_submitted` | **After Shopify confirms** a contact message | confirmed |
| `ps_newsletter_signup` | **After Shopify confirms** a sign-up | confirmed |
| `ps_motion_toggled` | The reduce-motion toggle is used | reduce |

Shopify reports the standard events itself: page viewed, product viewed, collection viewed, search, added to cart, checkout started and completed.

### Sending the events to Google Analytics 4 (supplied, not activated)

`docs/analytics/custom-pixel.js` is a ready Shopify custom pixel. **It should only be activated after:**

1. The privacy policy and Shopify's cookie banner are set up for the regions Peak Side sells to (risk register item 5).
2. The pixel's privacy permission is set to require Analytics consent.
3. Peak Side's own GA4 Measurement ID replaces `G-XXXXXXXXXX`.

For standard e-commerce events in GA4, Shopify's **Google & YouTube** app is the simpler route. The custom pixel then only adds the interaction events above.

## Data inventory: what each feature collects

| Feature | Data collected | Where it goes | Retention / notes | Status |
| --- | --- | --- | --- | --- |
| Contact form | Name (optional), email, topic, message | Emailed to the store's sender address by Shopify | Lives in that inbox. Not added to marketing. The page says so; that must stay true. | Implemented (Shopify) |
| Restock request | Email, product, size | Emailed to the store by Shopify | Peak Side follows up manually. A back-in-stock app would automate it (needs integration). | Implemented (Shopify) |
| Newsletter | Email, `newsletter` tag, marketing consent | Shopify Customers, email-marketing status "subscribed" | Kept separate from the contact and restock forms. Unsubscribe via Shopify Email or the chosen platform. | Implemented (Shopify) |
| Cart and checkout | Order, address and payment data | Shopify checkout (hosted; the theme never sees card data) | Shopify's terms and the store's privacy policy | Shopify |
| Shopify Analytics | Sessions, device, approximate location, referrer, cookies | Shopify | Shopify's cookie policy; respects consent settings | Built in |
| Theme interaction events | Event name plus product or choice (no personal data) | Shopify Customer Events. Only goes elsewhere if a pixel is activated. | — | Implemented |
| GA4 custom pixel | Google cookies, interaction events | Google | Requires consent configuration first | **Not activated** |
| Reduce-motion preference | `ps-motion` in localStorage | Visitor's own browser only | Functional preference, never sent anywhere | Implemented |

### Questions for qualified review (no single rule is assumed)

- Which countries will Peak Side actively market to? This drives cookie-consent needs (for example EU/UK).
- Do US state privacy laws apply at Peak Side's size? Nevada's online privacy notice requirements and any sale/share opt-out obligations should be checked.
- How long should contact and restock emails be kept, and who can access the inbox?
- Age policy for newsletter sign-ups and purchases, given the young audience.
- Wording of the newsletter consent line, and whether double opt-in should be enabled in Shopify (Settings → Customer privacy / Marketing).
