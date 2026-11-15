import Link from "next/link";
import Img, { imageMeta } from "./Img";
import { type Product, formatPrice } from "@/data/products";

type Props = { product: Product; sizes?: string; priority?: boolean; showBestSeller?: boolean };

export default function ProductCard({ product, sizes = "(min-width:1024px) 25vw, 50vw", priority, showBestSeller = true }: Props) {
  const first = product.colorways[0].images[0];
  const hover = product.lifestyle ?? product.colorways[0].images[1];
  const studio = imageMeta(first)?.kind === "studio";
  return (
    <Link href={`/shop/${product.slug}/`} className="group block" aria-label={`${product.name}, ${formatPrice(product.price)}${product.inStock ? "" : ", sold out"}`}>
      <div className={`relative aspect-[4/5] overflow-hidden ${studio ? "bg-stone" : "bg-coal"}`}>
        <Img
          name={first}
          alt=""
          sizes={sizes}
          priority={priority}
          className={`absolute inset-0 h-full w-full transition-[transform,opacity] duration-700 ease-out ${
            studio ? "object-contain p-[8%] group-hover:scale-[1.04]" : "object-cover group-hover:scale-[1.03]"
          } ${hover ? "group-hover:opacity-0" : ""} ${product.inStock ? "" : "grayscale-[35%]"}`}
        />
        {hover && (
          <Img
            name={hover}
            alt=""
            sizes={sizes}
            blend={false}
            className="absolute inset-0 h-full w-full scale-[1.06] object-cover opacity-0 transition-[transform,opacity] duration-700 ease-out group-hover:scale-100 group-hover:opacity-100"
          />
        )}
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {!product.inStock && <span className="label bg-ink px-2 py-1 text-[10px] text-bone">Sold out</span>}
          {product.badge && <span className="label bg-sakura px-2 py-1 text-[10px] text-ink">{product.badge}</span>}
          {showBestSeller && product.inStock && product.bestSeller && !product.badge && (
            <span className="label bg-bone/90 px-2 py-1 text-[10px] text-ink">Best seller</span>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-medium leading-snug">{product.name}</h3>
          {product.colorways.length > 1 && (
            <div className="mt-2 flex items-center gap-1.5" aria-label={`${product.colorways.length} colours`}>
              {product.colorways.map((c) => (
                <span key={c.name} title={c.name} className="h-2.5 w-2.5 rounded-full ring-1 ring-ink/15" style={{ background: c.swatch }} />
              ))}
              <span className="label ml-1 text-[10px] text-granite">{product.colorways.length} colours</span>
            </div>
          )}
        </div>
        <p className={`shrink-0 font-mono text-[13px] ${product.inStock ? "" : "text-granite line-through decoration-1"}`}>{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}
