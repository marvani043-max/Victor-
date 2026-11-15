import type { MetadataRoute } from "next";
import { products } from "@/data/products";
import { SITE_URL } from "@/data/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, priority: 1 },
    { url: `${SITE_URL}/shop/`, lastModified: now, priority: 0.9 },
    ...products.map((p) => ({ url: `${SITE_URL}/shop/${p.slug}/`, lastModified: now, priority: p.inStock ? 0.8 : 0.5 })),
    { url: `${SITE_URL}/story/`, lastModified: now, priority: 0.6 },
    { url: `${SITE_URL}/shipping-returns/`, lastModified: now, priority: 0.5 },
  ];
}
