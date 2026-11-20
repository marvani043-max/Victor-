// Product catalogue, taken from the live peak-side.com store on 15 Nov 2026.
// Prices, stock, sizes, colours and descriptions are verbatim from the store
// (with spelling corrected). Names are tidied for display; `storeSlug` keeps the
// exact store URL so checkout handoff lands on the right product.

export type Category = "hoodies" | "zip-ups" | "tees" | "crop-tops" | "crewnecks";

export type Colorway = {
  name: string;
  swatch: string;
  images: string[];
  /** Studio front/back shots (image names) used for the 360° viewer and card flip. */
  spin?: { front: string; back: string };
};

export type Product = {
  slug: string;
  storeSlug: string;
  name: string;
  category: Category;
  price: number;
  inStock: boolean;
  collection?: "Summer Edition";
  badge?: string;
  bestSeller?: boolean;
  /** Brand-written copy from the store, lightly corrected. */
  description?: string;
  /** Plain facts visible in product photos / title. Used where the store has no copy. */
  summary: string;
  fit?: string;
  sizes: string[];
  colorways: Colorway[];
  /** Lifestyle shot for card hover and the lookbook. */
  lifestyle?: string;
};

export const CATEGORIES: { id: Category; label: string; plural: string }[] = [
  { id: "hoodies", label: "Hoodie", plural: "Hoodies" },
  { id: "zip-ups", label: "Zip-up", plural: "Zip-ups" },
  { id: "tees", label: "Tee", plural: "Tees" },
  { id: "crop-tops", label: "Crop top", plural: "Crop tops" },
  { id: "crewnecks", label: "Crewneck", plural: "Crewnecks" },
];

const BLACK = "#1B1B1A";
const WHITE = "#F7F6F2";

export const products: Product[] = [
  {
    slug: "faded-hoodie-front-logo",
    storeSlug: "oversized-faded-hoodie-with-front-logo-only-1",
    name: "Oversized Faded Hoodie — Front Logo",
    category: "hoodies",
    price: 55.95,
    inStock: true,
    bestSeller: true,
    summary:
      "Oversized pullover with a sun-faded wash that darkens toward the hem. The PKS script sits small on the chest; the back is left clean.",
    sizes: ["S", "M", "L", "XL", "2XL"],
    colorways: [
      { name: "Black", swatch: "#2A2A2A", images: ["hoodie-faded-black-front", "hoodie-faded-black-back"], spin: { front: "hoodie-faded-black-front", back: "hoodie-faded-black-back" } },
      { name: "Pink", swatch: "#EC5C9B", images: ["hoodie-faded-pink-front", "hoodie-faded-pink-alt", "tunnel-pink-hoodie"] },
    ],
    lifestyle: "tunnel-pink-hoodie",
  },
  {
    slug: "faded-hoodie-both-sides",
    storeSlug: "heavyweight-sunfade-oversized-hoodie",
    name: "Oversized Faded Hoodie — Front & Back",
    category: "hoodies",
    price: 61.94,
    inStock: true,
    bestSeller: true,
    summary:
      "The same oversized, sun-faded hoodie with logos on both sides: PKS script on the chest and hand-drawn PEAK SIDE lettering across the back.",
    sizes: ["S", "M", "L", "XL", "2XL"],
    colorways: [
      { name: "Black", swatch: "#2A2A2A", images: ["hoodie-both-black-front", "hoodie-both-black-back", "tunnel-pink-hoodie"], spin: { front: "hoodie-both-black-front", back: "hoodie-both-black-back" } },
      { name: "Pink", swatch: "#EC5C9B", images: ["hoodie-both-pink-front"] },
    ],
    lifestyle: "tunnel-pink-hoodie",
  },
  {
    slug: "double-zip-hoodie",
    storeSlug: "essential-oversized-fleece-boxy-hoodie",
    name: "Double Zip Hoodie",
    category: "zip-ups",
    price: 54.95,
    inStock: true,
    summary: "Boxy full-zip hoodie with a two-way zipper and the PKS script on the chest. Three colourways.",
    sizes: ["S", "M", "L", "XL", "2XL"],
    colorways: [
      { name: "Black", swatch: "#232323", images: ["zip-black-front", "zip-black-back", "tunnel-zip-black", "tunnel-zip-black-2"], spin: { front: "zip-black-front", back: "zip-black-back" } },
      { name: "Navy Blue", swatch: "#2E4462", images: ["zip-navy-front", "zip-navy-back", "tunnel-zip-navy", "tunnel-zip-navy-2"], spin: { front: "zip-navy-front", back: "zip-navy-back" } },
      { name: "Flower Gray", swatch: "#C9C9C7", images: ["zip-grey-front", "zip-grey-back", "tunnel-zip-grey"], spin: { front: "zip-grey-front", back: "zip-grey-back" } },
    ],
    lifestyle: "tunnel-zip-black",
  },
  {
    slug: "white-globe-hoodie",
    storeSlug: "white-globe-hooide",
    name: "White Globe Hoodie",
    category: "hoodies",
    price: 59.95,
    inStock: true,
    description:
      "This hoodie will keep you warm all year round but really shines when snow is on the ground. Known for keeping people warm while skiing and snowboarding, this is my go-to hoodie.",
    summary: "Off-white pullover with a small globe graphic on the chest and a large globe-and-lettering print on the back.",
    sizes: ["S", "M", "L"],
    colorways: [{ name: "White", swatch: WHITE, images: ["globe-front", "globe-back"] }],
  },
  {
    slug: "peak-side-crewneck",
    storeSlug: "peak-side-crew-neck",
    name: "Peak Side Crewneck",
    category: "crewnecks",
    price: 34.95,
    inStock: true,
    description:
      "Warm crewneck that will keep you warm whether you are skiing or in school. An everyday essential that goes with most outfit choices.",
    summary: "Heather-grey crewneck with a small chest graphic and a large PEAK SIDE WEAR print on the back.",
    sizes: ["S", "M", "L"],
    colorways: [{ name: "Grey", swatch: "#B5B4B0", images: ["crew-front", "crew-back"] }],
  },
  {
    slug: "black-summer-edition-tee",
    storeSlug: "black-summer-edition-t-shirt-1",
    name: "Summer Edition Tee — Black",
    category: "tees",
    collection: "Summer Edition",
    price: 30.95,
    inStock: true,
    summary:
      "Black tee with the cherry-blossom Peak Side oval: small on the chest, full-size across the back.",
    sizes: ["S", "M", "L", "XL", "2XL"],
    colorways: [
      {
        name: "Black",
        swatch: BLACK,
        spin: { front: "tee-black-alt", back: "tee-black-front" },
        images: ["tee-black-alt", "tee-black-front", "tunnel-tee-black-front", "tunnel-tee-black-back", "trail-falls-front", "detail-graphic-black-2", "portrait-tee-black"],
      },
    ],
    lifestyle: "trail-falls-front",
  },
  {
    slug: "black-boxy-summer-edition-tee",
    storeSlug: "black-boxy-summer-edition-t-shirt",
    name: "Summer Edition Boxy Tee — Black",
    category: "tees",
    collection: "Summer Edition",
    price: 30.95,
    inStock: true,
    bestSeller: true,
    description:
      "More unique than the white Summer Edition tee because it has a little fade and makes your outfits pop and stand out more.",
    summary: "Boxy-cut black tee with a light fade and the cherry-blossom Peak Side graphic.",
    sizes: ["S", "M", "L", "XL", "2XL"],
    colorways: [
      {
        name: "Faded Black",
        swatch: "#2C2C2B",
        spin: { front: "tee-black-boxy-alt", back: "tee-black-boxy-front" },
        images: ["tee-black-boxy-alt", "tee-black-boxy-front", "trail-falls-back", "trail-falls-wide", "detail-graphic-black", "tee-black-boxy-flat"],
      },
    ],
    lifestyle: "trail-falls-back",
  },
  {
    slug: "white-summer-edition-tee",
    storeSlug: "white-summer-edition-t-shirt-1",
    name: "Summer Edition Tee — White",
    category: "tees",
    collection: "Summer Edition",
    price: 30.95,
    inStock: true,
    description: "The best shirt for summer and fall that gives you that clean, perfect look with all of your outfits.",
    summary: "White tee with the cherry-blossom Peak Side oval on the chest and full-size on the back.",
    sizes: ["S", "M", "L", "XL", "2XL", "3XL"],
    colorways: [
      {
        name: "White",
        swatch: WHITE,
        spin: { front: "tee-white-front", back: "tee-white-back" },
        images: ["tee-white-front", "tee-white-back", "trail-overlook", "trail-ridge", "trail-path", "tunnel-tee-white-back-2"],
      },
    ],
    lifestyle: "trail-overlook",
  },
  {
    slug: "white-boxy-summer-edition-tee",
    storeSlug: "white-boxy-summer-edition-t-shirt",
    name: "Summer Edition Boxy Tee — White",
    category: "tees",
    collection: "Summer Edition",
    price: 30.95,
    inStock: true,
    description:
      "The perfect boxy tee for summer and fall. It's exactly the same as the normal Summer Edition tee, just boxy.",
    fit: "Boxy fit. Stay true to size.",
    summary: "Boxy-cut white tee with the cherry-blossom Peak Side graphic, full-size across the back.",
    sizes: ["S", "M", "L", "XL", "2XL"],
    colorways: [
      {
        name: "White",
        swatch: WHITE,
        spin: { front: "tee-white-boxy-front", back: "tee-white-boxy-back" },
        images: ["tee-white-boxy-front", "tee-white-boxy-back", "night-boxy-trio", "tunnel-tee-white-back", "tunnel-tee-white-back-3"],
      },
    ],
    lifestyle: "night-boxy-trio",
  },
  {
    slug: "black-off-shoulder-crop-top",
    storeSlug: "black-off-shoulder-crop-top",
    name: "Off-Shoulder Crop Top — Black",
    category: "crop-tops",
    price: 25.95,
    inStock: true,
    bestSeller: true,
    description: "The perfect crop top for summer and fall that will upgrade your style.",
    fit: "For the best fit, size down.",
    summary: "Black off-shoulder cropped tee with the cherry-blossom Peak Side oval on the chest.",
    sizes: ["S", "M", "L", "XL", "2XL"],
    colorways: [
      {
        name: "Black",
        swatch: BLACK,
        spin: { front: "crop-black-front", back: "crop-black-plain" },
        images: ["crop-black-front", "crop-black-plain", "tunnel-crop-duo-2", "tunnel-crop-black", "tunnel-crop-sit", "tunnel-crop-black-2"],
      },
    ],
    lifestyle: "tunnel-crop-duo-2",
  },
  {
    slug: "white-off-shoulder-crop-top",
    storeSlug: "white-off-shoulder-crop-top",
    name: "Off-Shoulder Crop Top — White",
    category: "crop-tops",
    price: 25.95,
    inStock: true,
    description: "The perfect crop top for summer and fall that will upgrade your style.",
    fit: "For the best fit, size down.",
    summary: "White off-shoulder cropped tee with the cherry-blossom Peak Side oval on the chest.",
    sizes: ["S", "M", "L", "XL", "2XL"],
    colorways: [
      {
        name: "White",
        swatch: WHITE,
        spin: { front: "crop-white-front", back: "crop-white-plain" },
        images: ["crop-white-front", "crop-white-plain", "tunnel-crop-white", "tunnel-crop-white-3", "tunnel-crop-white-2"],
      },
    ],
    lifestyle: "tunnel-crop-white",
  },
  {
    slug: "grey-washed-crop-top",
    storeSlug: "grey-washed-crop-top",
    name: "Washed Crop Top — Grey",
    category: "crop-tops",
    collection: "Summer Edition",
    price: 25.95,
    inStock: true,
    description:
      "An over-shoulder crop top that's part of the Summer Edition, and a great piece that goes with almost every outfit.",
    summary: "Washed charcoal cropped tee with contrast stitching and the Peak Side oval on the chest.",
    sizes: ["S", "M", "L"],
    colorways: [{ name: "Classic Black", swatch: "#4A4947", images: ["crop-grey-front", "crop-grey-back"], spin: { front: "crop-grey-front", back: "crop-grey-back" } }],
  },
  {
    slug: "navy-double-zip-up",
    storeSlug: "navy-double-zip-up",
    name: "Heavyweight Double Zip-Up — Navy",
    category: "zip-ups",
    price: 64.95,
    inStock: false,
    badge: "Best Seller",
    description:
      "Heavyweight boxy hood with double zippers. It's the perfect hoodie for all year round and your adventures.",
    summary: "Heavyweight, boxy navy zip-up with a two-way zipper and embroidered PKS script.",
    sizes: [],
    colorways: [{ name: "Navy", swatch: "#26324F", images: ["zipup-navy-flat", "zipup-navy-flat-2", "detail-pks-navy"] }],
  },
  {
    slug: "grey-double-zip-up",
    storeSlug: "grey-zip-up",
    name: "Heavyweight Double Zip-Up — Grey",
    category: "zip-ups",
    price: 64.95,
    inStock: false,
    description:
      "Heavyweight boxy hood with double zippers. It's the perfect hoodie for all year round and your adventures.",
    summary: "Heavyweight, boxy heather-grey zip-up with a two-way zipper and embroidered PKS script.",
    sizes: [],
    colorways: [{ name: "Grey", swatch: "#A9A8A4", images: ["zipup-grey-flat", "zipup-grey-flat-2", "detail-pks-grey"] }],
  },
  {
    slug: "dark-grey-double-zip-up",
    storeSlug: "dark-grey-zip-up",
    name: "Heavyweight Double Zip-Up — Dark Grey",
    category: "zip-ups",
    price: 64.95,
    inStock: false,
    description:
      "Heavyweight boxy hood with double zippers. It's the perfect hoodie for all year round and your adventures.",
    summary: "Heavyweight, boxy charcoal zip-up with a two-way zipper and embroidered PKS script.",
    sizes: [],
    colorways: [{ name: "Dark Grey", swatch: "#4B4A48", images: ["zipup-darkgrey-flat", "zipup-darkgrey-flat-2", "detail-pks-darkgrey"] }],
  },
];

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const bestSellers = () => products.filter((p) => p.bestSeller);
export const categoryLabel = (c: Category) => CATEGORIES.find((x) => x.id === c)!.label;
export const formatPrice = (n: number) => `$${n.toFixed(2)}`;

export const relatedTo = (p: Product, n = 4) => {
  const same = products.filter((x) => x.slug !== p.slug && x.inStock && (x.category === p.category || (!!p.collection && x.collection === p.collection)));
  const rest = products.filter((x) => x.slug !== p.slug && x.inStock && !same.includes(x));
  return [...same, ...rest].slice(0, n);
};
