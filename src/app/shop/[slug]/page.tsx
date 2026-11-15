import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductDetail from "@/components/ProductDetail";
import ProductCard from "@/components/ProductCard";
import { products, getProduct, relatedTo, categoryLabel } from "@/data/products";
import { SITE_URL, storeProductUrl } from "@/data/site";
import { imageSrc } from "@/components/Img";

export const dynamicParams = false;
export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const p = getProduct((await params).slug);
  if (!p) return {};
  const img = imageSrc(p.lifestyle ?? p.colorways[0].images[0], 1600);
  return {
    title: `${p.name} — $${p.price.toFixed(2)}`,
    description: `${p.description ?? p.summary} ${p.inStock ? `Sizes ${p.sizes.join(", ")}.` : "Currently sold out."}`.trim(),
    alternates: { canonical: `/shop/${p.slug}/` },
    openGraph: { images: [{ url: img }], title: p.name },
  };
}

export default async function ProductPage({ params }: Params) {
  const p = getProduct((await params).slug);
  if (!p) notFound();
  const related = relatedTo(p);
  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: p.name,
        description: p.description ?? p.summary,
        brand: { "@type": "Brand", name: "Peak Side" },
        category: categoryLabel(p.category),
        image: p.colorways.flatMap((c) => c.images.slice(0, 2)).map((n) => `${SITE_URL}${imageSrc(n, 1600)}`),
        color: p.colorways.map((c) => c.name).join(", "),
        size: p.sizes.length ? p.sizes.join(", ") : undefined,
        offers: {
          "@type": "Offer",
          url: storeProductUrl(p.storeSlug),
          priceCurrency: "USD",
          price: p.price.toFixed(2),
          availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "Shop", item: `${SITE_URL}/shop/` },
          { "@type": "ListItem", position: 3, name: p.name, item: `${SITE_URL}/shop/${p.slug}/` },
        ],
      },
    ],
  };

  return (
    <>
      <div className="wrap pb-24 pt-6 sm:pt-10">
        <nav aria-label="Breadcrumb" className="label mb-6 flex items-center gap-2 text-granite">
          <Link href="/" className="link-u">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <Link href="/shop/" className="link-u">
            Shop
          </Link>
          <span aria-hidden="true">/</span>
          <Link href={`/shop/?c=${p.category}`} className="link-u">
            {categoryLabel(p.category)}s
          </Link>
        </nav>
        <ProductDetail product={p} />
      </div>

      <section className="border-t border-ink/10 py-20" aria-labelledby="related-title">
        <div className="wrap">
          <h2 id="related-title" className="display text-5xl sm:text-7xl">
            Wear it with
          </h2>
          <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4">
            {related.map((r) => (
              <li key={r.slug}>
                <ProductCard product={r} />
              </li>
            ))}
          </ul>
        </div>
      </section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </>
  );
}
