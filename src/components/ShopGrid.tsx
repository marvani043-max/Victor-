"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import ProductCard from "./ProductCard";
import { CATEGORIES, SHOP_GROUPS, groupOf, products, featuredRank, sortablePrice, type Category, type ShopGroup } from "@/data/products";

/** ?c= takes a shop category (tops, bottoms) or, for older links and the home tiles, a product type. */
type Filter = ShopGroup | Category;
const matches = (c: Category, f: Filter | null) => !f || f === c || f === groupOf(c);
const chipFor = (f: Filter | null): ShopGroup | null => (!f ? null : SHOP_GROUPS.some((g) => g.id === f) ? (f as ShopGroup) : groupOf(f as Category));

type Sort = "featured" | "price-asc" | "price-desc";

export default function ShopGrid() {
  const params = useSearchParams();
  const router = useRouter();

  const read = () => {
    const raw = params.get("c");
    const s = params.get("sort") || "";
    return {
      cat: (SHOP_GROUPS.some((g) => g.id === raw) || CATEGORIES.some((c) => c.id === raw) ? raw : null) as Filter | null,
      sort: (["price-asc", "price-desc"].includes(s) ? s : "featured") as Sort,
      hideSold: params.get("instock") === "1",
    };
  };
  // Local state updates instantly; the URL is kept in sync for sharing and back/forward.
  const [state, setState] = useState(read);
  const { cat, sort, hideSold } = state;
  useEffect(() => {
    setState(read());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const set = (key: "c" | "sort" | "instock", value: string | null) => {
    setState((prev) => ({
      ...prev,
      ...(key === "c" ? { cat: value as Filter | null } : key === "sort" ? { sort: (value ?? "featured") as Sort } : { hideSold: value === "1" }),
    }));
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const qs = next.toString();
    router.replace(`/shop/${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const list = useMemo(() => {
    let l = products.filter((p) => matches(p.category, cat) && (!hideSold || p.inStock || p.comingSoon));
    if (sort === "price-asc") l = [...l].sort((a, b) => sortablePrice(a) - sortablePrice(b));
    else if (sort === "price-desc") l = [...l].sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
    else l = [...l].sort((a, b) => featuredRank(a) - featuredRank(b));
    return l;
  }, [cat, sort, hideSold]);

  const count = (g: ShopGroup | null) => products.filter((p) => !g || groupOf(p.category) === g).length;

  return (
    <div>
      <div className="sticky top-[var(--header-h)] z-20 -mx-4 border-y border-ink/10 bg-bone/95 px-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
        <div className="flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
          <div role="group" aria-label="Filter by category" className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
            {[{ id: null as ShopGroup | null, plural: "All" }, ...SHOP_GROUPS.map((g) => ({ id: g.id as ShopGroup | null, plural: g.label }))].map((c) => {
              const active = chipFor(cat) === c.id;
              return (
                <button
                  key={c.plural}
                  type="button"
                  aria-pressed={active}
                  onClick={() => set("c", c.id)}
                  className={`label shrink-0 whitespace-nowrap px-3.5 py-2.5 transition-colors ${
                    active ? "bg-ink text-bone" : "hover:bg-stone"
                  }`}
                >
                  {c.plural} <span className={active ? "text-sakura" : "text-granite"}>{count(c.id)}</span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between gap-6 lg:justify-end">
            <label className="label flex cursor-pointer select-none items-center gap-2">
              <input
                type="checkbox"
                checked={hideSold}
                onChange={(e) => set("instock", e.target.checked ? "1" : null)}
                className="h-4 w-4 accent-ink"
              />
              In stock only
            </label>
            <label className="label flex items-center gap-2">
              <span className="text-granite">Sort</span>
              <select
                value={sort}
                onChange={(e) => set("sort", e.target.value === "featured" ? null : e.target.value)}
                className="label cursor-pointer border-b border-ink/30 bg-transparent py-1 pr-1 focus:outline-none"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <p className="label mt-6 text-granite" aria-live="polite">
        {list.length} {list.length === 1 ? "product" : "products"}
      </p>

      <motion.ul layout className="mt-4 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4 lg:gap-y-14">
        <AnimatePresence mode="popLayout">
          {list.map((p, i) => (
            <motion.li
              key={p.slug}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: Math.min(i, 8) * 0.03 }}
            >
              <ProductCard product={p} priority={i < 4} />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
      {list.length === 0 && (
        <div className="py-24 text-center">
          <p className="display text-5xl">Nothing here yet</p>
          <button type="button" onClick={() => router.replace("/shop/")} className="btn-line mt-6">
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
