// Data for the interactive elements (<ps-showcase>, <ps-fit>), shared by the Next.js site
// and the single-file preview. Callers pass their own link and image URL builders.
import { products, formatPrice, type Category, type Product } from "./products";

type Href = (p: Product) => string;
type ImgUrl = (name: string, width: number) => string;

const WORD: Record<Category, string> = {
  hoodies: "Hoodie",
  "zip-ups": "Zip-up",
  tees: "Tee",
  "crop-tops": "Crop top",
  bottoms: "Pants",
};

/** Every colourway with studio front + back shots: Winter Drop first, then best sellers. */
export function spinItems(href: Href, img: ImgUrl) {
  const rank = (p: Product) => (p.comingSoon ? 0 : p.bestSeller ? 1 : 2);
  return [...products]
    .filter((p) => p.inStock || p.comingSoon)
    .sort((a, b) => rank(a) - rank(b))
    .flatMap((p) =>
      p.colorways
        .filter((c) => c.spin)
        .map((c) => ({
          name: p.name,
          price: formatPrice(p.price),
          colour: c.name,
          href: href(p),
          front: img(`${c.spin!.front}-cut`, 960),
          back: img(`${c.spin!.back}-cut`, 960),
          thumb: img(`${c.spin!.front}-cut`, 480),
          word: WORD[p.category],
        }))
    );
}

// Fit-finder tags. Warmth and fit come from the store's own product copy and titles
// ("oversized", "boxy", "crop top", "keeps you warm while skiing"); places come from
// where the brand photographed each piece (trail shoots vs. the graffiti tunnel).
type Tags = { warmth: "cold" | "warm"; fit: "oversized" | "boxy" | "cropped" | "classic"; places: ("trail" | "tunnel")[] };
const TAGS: Record<string, Tags> = {
  "faded-hoodie-front-logo": { warmth: "cold", fit: "oversized", places: ["tunnel"] },
  "faded-hoodie-both-sides": { warmth: "cold", fit: "oversized", places: ["tunnel"] },
  "double-zip-hoodie": { warmth: "cold", fit: "boxy", places: ["tunnel"] },
  "white-globe-hoodie": { warmth: "cold", fit: "classic", places: ["trail"] },
  "peak-side-crewneck": { warmth: "cold", fit: "classic", places: ["trail", "tunnel"] },
  "black-summer-edition-tee": { warmth: "warm", fit: "classic", places: ["trail", "tunnel"] },
  "black-boxy-summer-edition-tee": { warmth: "warm", fit: "boxy", places: ["trail"] },
  "white-summer-edition-tee": { warmth: "warm", fit: "classic", places: ["trail"] },
  "white-boxy-summer-edition-tee": { warmth: "warm", fit: "boxy", places: ["tunnel"] },
  "black-off-shoulder-crop-top": { warmth: "warm", fit: "cropped", places: ["tunnel"] },
  "white-off-shoulder-crop-top": { warmth: "warm", fit: "cropped", places: ["tunnel"] },
  "grey-washed-crop-top": { warmth: "warm", fit: "cropped", places: ["tunnel"] },
};

export function fitFinderData(href: Href, img: ImgUrl) {
  return {
    trail: img("trail-falls-front", 960),
    tunnel: img("tunnel-pink-hoodie", 960),
    products: products
      .filter((p) => p.inStock && TAGS[p.slug])
      .map((p) => {
        const c = p.colorways[0];
        return {
          name: p.name,
          price: formatPrice(p.price),
          href: href(p),
          img: c.spin ? img(`${c.spin.front}-cut`, 960) : img(p.lifestyle ?? c.images[0], 960),
          cut: !!c.spin,
          bestSeller: !!p.bestSeller,
          ...TAGS[p.slug],
        };
      }),
  };
}

/** Escape JSON for safe embedding inside a <script type="application/json"> tag. */
export const jsonForScript = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c");
