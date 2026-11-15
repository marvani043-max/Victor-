import type { Metadata } from "next";
import { Suspense } from "react";
import ShopGrid from "@/components/ShopGrid";
import { products } from "@/data/products";

export const metadata: Metadata = {
  title: "Shop Hoodies, Tees & Crop Tops",
  description: `Shop all ${products.length} Peak Side pieces: oversized faded hoodies, double zip hoodies, Summer Edition tees and off-shoulder crop tops. Free shipping with code FREESHIP2026.`,
  alternates: { canonical: "/shop/" },
};

export default function ShopPage() {
  return (
    <div className="wrap pb-28 pt-10 sm:pt-16">
      <div className="flex flex-col gap-4 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="display text-[22vw] sm:text-[9rem] lg:text-[11rem]">The shop</h1>
        <p className="max-w-xs pb-3 text-[15px] leading-relaxed text-ink/70">
          Every piece in the current range. Pick a product to see colours and sizes, then check out securely on the Peak Side store.
        </p>
      </div>
      <Suspense fallback={<div className="h-96" />}>
        <ShopGrid />
      </Suspense>
    </div>
  );
}
