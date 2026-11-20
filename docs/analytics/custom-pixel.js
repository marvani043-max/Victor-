/*
  Peak Side custom pixel (NOT ACTIVE). Paste into Shopify admin → Settings → Customer events → Add custom pixel.
  Before activating:
    1. Turn on Shopify's cookie banner / Customer privacy settings for the regions you sell to.
    2. In the pixel's "Customer privacy" settings, require Analytics permission (Shopify then only runs it with consent where required).
    3. Replace G-XXXXXXXXXX with Peak Side's own GA4 Measurement ID, then click Connect.
  Standard events (page views, product views, add to cart, checkout) are already reported in Shopify Analytics and,
  if installed, by the Google & YouTube app. This pixel only adds the theme's interaction events.
*/
const GA4_ID = 'G-XXXXXXXXXX';

const script = document.createElement('script');
script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
script.async = true;
document.head.appendChild(script);
window.dataLayer = window.dataLayer || [];
function gtag() { window.dataLayer.push(arguments); }
gtag('js', new Date());
gtag('config', GA4_ID, { send_page_view: false });

// Theme interaction events published with Shopify.analytics.publish('ps_*', data)
const THEME_EVENTS = [
  'ps_explorer_colour_changed',   // { product, colour, source? }
  'ps_explorer_view_changed',     // { product, view: front | back | detail | worn }
  'ps_explorer_detail_opened',    // { product, detail }
  'ps_explorer_zoom_opened',      // { product, view }
  'ps_size_selected',             // { product, size }
  'ps_size_guide_opened',         // { product }
  'ps_fit_selected',              // { fit }
  'ps_filter_applied',            // { query }
  'ps_lookbook_tag_opened',       // { product }
  'ps_card_colour_previewed',     // { colour }
  'ps_restock_requested',         // { confirmed: true } — only after Shopify confirms the form
  'ps_contact_submitted',         // { confirmed: true }
  'ps_newsletter_signup',         // { confirmed: true }
  'ps_motion_toggled',            // { reduce }
];
THEME_EVENTS.forEach((name) => {
  analytics.subscribe(name, (event) => {
    gtag('event', name.replace(/^ps_/, ''), event.customData || {});
  });
});
