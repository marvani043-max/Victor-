// Exports the catalogue as Shopify import files:
//   docs/import/products.csv   → Shopify admin → Products → Import
//   docs/import/redirects.csv  → Shopify admin → Content → Menus → URL Redirects → Import (old Wix URLs → new URLs)
// Images are NOT included (Shopify needs public image URLs). Upload photos in admin and use the alt-text convention.
import fs from 'node:fs';
import { PRODUCTS } from './data/products.mjs';

const esc = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const header = [
  'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Product Category', 'Type', 'Tags', 'Published',
  'Option1 Name', 'Option1 Value', 'Option2 Name', 'Option2 Value', 'Variant SKU', 'Variant Grams',
  'Variant Inventory Tracker', 'Variant Inventory Qty', 'Variant Inventory Policy', 'Variant Fulfillment Service',
  'Variant Price', 'Variant Compare At Price', 'Variant Requires Shipping', 'Variant Taxable', 'Gift Card',
  'SEO Title', 'SEO Description', 'Fit profile (product.metafields.custom.fit_profile)', 'Fit note (product.metafields.custom.fit_note)', 'Status',
];
const rows = [header];
for (const p of PRODUCTS) {
  let first = true;
  for (const color of p.colors) {
    for (const size of p.sizes) {
      const text = p.description.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      rows.push([
        p.handle, first ? p.title : '', first ? p.description : '', first ? 'Peak Side' : '', first ? 'Apparel & Accessories > Clothing' : '', first ? p.type : '',
        first ? p.tags.join(', ') : '', first ? 'TRUE' : '', 'Color', color, 'Size', size, '', '',
        'shopify', 0, 'deny', 'manual', p.price.toFixed(2), '', 'TRUE', 'TRUE', first ? 'FALSE' : '',
        first ? `${p.title} | Peak Side` : '', first ? text.slice(0, 155) : '', first ? p.fit || '' : '', first ? p.fitNote || '' : '', first ? 'draft' : '',
      ]);
      first = false;
    }
  }
}
fs.writeFileSync('docs/import/products.csv', rows.map((r) => r.map(esc).join(',')).join('\n') + '\n');

const redirects = [['Redirect from', 'Redirect to'], ...PRODUCTS.map((p) => [`/product-page/${p.wixSlug}`, `/products/${p.handle}`]), ['/category/men', '/collections/all'], ['/category/all-products', '/collections/all']];
fs.writeFileSync('docs/import/redirects.csv', redirects.map((r) => r.map(esc).join(',')).join('\n') + '\n');

const details = PRODUCTS.map((p) => ({ product: p.handle, alt_text_convention: p.media.map(([, alt]) => alt), garment_details: p.details }));
fs.writeFileSync('docs/import/garment-details.json', JSON.stringify(details, null, 2) + '\n');
console.log(`products.csv: ${rows.length - 1} variant rows for ${PRODUCTS.length} products; redirects.csv: ${redirects.length - 1}; garment-details.json`);
