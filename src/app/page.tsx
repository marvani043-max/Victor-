import Link from "next/link";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Lookbook from "@/components/Lookbook";
import ProductCard from "@/components/ProductCard";
import Reveal from "@/components/Reveal";
import Img from "@/components/Img";
import { Arrow, ArrowUpRight, Instagram, Ridge } from "@/components/Icons";
import { bestSellers, products, formatPrice, winterDrop } from "@/data/products";
import { site, restockMailto, BASE_PATH } from "@/data/site";
import { spinItems, fitFinderData, jsonForScript } from "@/data/interactive";
import { imageSrc } from "@/components/Img";

const hrefFor = (p: { slug: string }) => `${BASE_PATH}/shop/${p.slug}/`;

const minPrice = Math.min(...products.flatMap((p) => (p.price === null ? [] : [p.price])));

const COLLECTIONS = [
  { title: "Hoodies & zips", href: "/shop/?c=hoodies", image: "tunnel-zip-black", alt: "Black double zip hoodie worn against graffiti", note: "Oversized, faded, heavyweight" },
  { title: "Summer Edition", href: "/shop/?c=tees", image: "trail-overlook", alt: "White Summer Edition tee at a mountain overlook", note: "Tees in regular and boxy cuts" },
  { title: "Crop tops", href: "/shop/?c=crop-tops", image: "tunnel-crop-white-2", alt: "White off-shoulder crop top", note: "Off-shoulder and washed" },
];

export default function Home() {
  const sellers = bestSellers();
  const soldOut = products.filter((p) => !p.inStock && !p.comingSoon);
  const winter = winterDrop();
  return (
    <>
      <Hero />

      {/* Winter Drop: new pieces, featured first */}
      <section className="relative overflow-hidden bg-ink py-20 text-bone sm:py-28" aria-labelledby="winter-title">
        <ps-petals snow="" />
        <div className="wrap relative">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="label text-sakura">New · Coming soon</p>
              <h2 id="winter-title" className="display mt-4 text-[17vw] sm:text-8xl lg:text-[9rem]">
                The Winter <span className="text-sakura">Drop.</span>
              </h2>
            </div>
            <div className="max-w-sm">
              <p className="text-[16px] leading-relaxed text-bone/80">
                Plaid-lined hoodies and plaid-panel sweatpants in washed black, in pink or grey plaid, finished with the PKS script.
              </p>
              <Link href="/shop/" className="btn-bone mt-6">
                Shop the Winter Drop <Arrow />
              </Link>
            </div>
          </div>
          <ul className="mt-12 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4">
            {winter.map((p, i) => (
              <Reveal as="li" key={p.slug} delay={i * 0.06}>
                <ProductCard product={p} showBestSeller={false} priority />
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      <Marquee
        className="border-b border-ink/10 bg-bone py-4"
        items={[
          `Free shipping with code ${site.promo.code}`,
          `Ships in ${site.policies.processing}`,
          `${site.policies.returnWindow} returns & exchanges`,
          "PayPal Pay in 4 at checkout",
          "Sizes S to 3XL",
        ]}
      />

      {/* Intro */}
      <section className="wrap py-20 sm:py-32" aria-labelledby="intro-title">
        <div className="grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-3">
            <p className="label text-granite">Peak Side — {site.descriptor}</p>
            <Ridge className="mt-4 h-3 w-28 text-bloom" />
          </Reveal>
          <div className="lg:col-span-9">
            <Reveal>
              <h2 id="intro-title" className="display-wide text-[8.5vw] leading-[1.02] sm:text-5xl lg:text-[4.1rem]">
                Clothes for the days that start on a trail and end in town. Started by a{" "}
                <span className="whitespace-nowrap text-bloom">16-year-old</span> who&apos;d rather be outside.
              </h2>
            </Reveal>
            <Reveal delay={0.1} className="mt-14 grid grid-cols-3 gap-4 border-t border-ink/15 pt-6">
              {[
                ["16", "Founder's age at launch"],
                [String(products.length), "Pieces in the range"],
                [formatPrice(minPrice), "Starting price"],
              ].map(([n, l]) => (
                <div key={l}>
                  <p className="display text-6xl sm:text-8xl">{n}</p>
                  <p className="label mt-2 text-granite">{l}</p>
                </div>
              ))}
            </Reveal>
          </div>
        </div>
      </section>

      {/* Best sellers */}
      <section className="wrap pb-24 sm:pb-32" aria-labelledby="best-title">
        <Reveal className="flex items-end justify-between gap-6 border-b border-ink pb-5">
          <h2 id="best-title" className="display text-6xl sm:text-8xl">
            Best sellers
          </h2>
          <Link href="/shop/" className="label link-u mb-2 hidden items-center gap-2 sm:inline-flex">
            Shop all {products.length} <Arrow />
          </Link>
        </Reveal>
        <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 lg:grid-cols-4">
          {sellers.map((p, i) => (
            <Reveal as="li" key={p.slug} delay={i * 0.06}>
              <ProductCard product={p} showBestSeller={false} />
            </Reveal>
          ))}
        </ul>
        <Link href="/shop/" className="btn-line mt-10 w-full sm:hidden">
          Shop all {products.length} pieces <Arrow />
        </Link>
      </section>

      {/* Spin the drop: 360° showcase */}
      <section className="border-y border-ink/10 bg-bone py-20 sm:py-28" aria-label="Spin the drop">
        <div className="wrap">
          <ps-showcase>
            <script type="application/json" dangerouslySetInnerHTML={{ __html: jsonForScript({ items: spinItems(hrefFor, imageSrc) }) }} />
          </ps-showcase>
        </div>
      </section>

      {/* Collections */}
      <section aria-labelledby="col-title" className="pb-24 sm:pb-32">
        <h2 id="col-title" className="sr-only">
          Shop by category
        </h2>
        <div className="wrap grid gap-3 md:grid-cols-3">
          {COLLECTIONS.map((c, i) => (
            <Reveal key={c.title} delay={i * 0.08}>
              <Link href={c.href} className="group relative block aspect-[4/5] overflow-hidden bg-coal text-bone md:aspect-[2/3]">
                <Img
                  name={c.image}
                  alt={c.alt}
                  sizes="(min-width:768px) 33vw, 100vw"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.06]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <p className="label text-bone/70">{c.note}</p>
                  <div className="mt-2 flex items-end justify-between">
                    <p className="display text-5xl sm:text-6xl">{c.title}</p>
                    <span className="mb-1 grid h-10 w-10 shrink-0 place-items-center bg-bone text-ink transition-all duration-500 group-hover:bg-sakura">
                      <Arrow />
                    </span>
                  </div>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <Lookbook />

      {/* Fit finder */}
      <section className="py-20 sm:py-28" aria-labelledby="fit-title">
        <div className="wrap grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="label text-granite">Fit finder</p>
            <h2 id="fit-title" className="display mt-4 text-6xl sm:text-8xl">
              Trail or <span className="text-bloom">tunnel?</span>
            </h2>
            <p className="mt-5 max-w-sm text-[16px] leading-relaxed text-ink/75">
              Three taps and we&apos;ll point you to the piece that fits your day, your weather and the way you like to wear it.
            </p>
          </div>
          <div className="lg:col-span-8">
            <ps-fit>
              <script type="application/json" dangerouslySetInnerHTML={{ __html: jsonForScript(fitFinderData(hrefFor, imageSrc)) }} />
            </ps-fit>
          </div>
        </div>
      </section>

      {/* Summer Edition graphic */}
      <section className="relative overflow-hidden bg-[#F6EEF0] py-24 sm:py-32" aria-labelledby="se-title">
        <ps-petals />
        <div className="wrap grid items-center gap-12 lg:grid-cols-12">
          <Reveal className="relative lg:col-span-6">
            <div className="relative aspect-[4/5] overflow-hidden bg-coal">
              <Img name="detail-graphic-black" alt="Close-up of the cherry-blossom Peak Side graphic on a faded black tee" sizes="(min-width:1024px) 50vw, 100vw" className="h-full w-full object-cover" />
            </div>
          </Reveal>
          <div className="lg:col-span-5 lg:col-start-8">
            <Reveal>
              <p className="label text-granite">The graphic</p>
              <h2 id="se-title" className="display mt-4 text-7xl sm:text-8xl lg:text-[7.5rem]">
                Summer <span className="text-bloom">Edition</span>
              </h2>
              <p className="mt-6 max-w-md text-[17px] leading-relaxed text-ink/80">
                Cherry-blossom branches wrapped around the Peak Side oval: small on the chest, full-size across the back. It runs
                across tees in black and white, regular and boxy, plus the washed crop top.
              </p>
              <p className="label mt-5 text-bloom">Move your cursor or tap to shake the blossom</p>
            </Reveal>
            <Reveal delay={0.1} className="mt-8 grid grid-cols-2 gap-3">
              {["black-boxy-summer-edition-tee", "white-boxy-summer-edition-tee"].map((slug) => {
                const p = products.find((x) => x.slug === slug)!;
                return <ProductCard key={slug} product={p} showBestSeller={false} sizes="(min-width:1024px) 20vw, 50vw" />;
              })}
            </Reveal>
            <Reveal delay={0.15}>
              <Link href="/shop/?c=tees" className="btn-ink mt-8">
                Shop Summer Edition <Arrow />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Story teaser */}
      <section className="relative overflow-hidden bg-stone" aria-labelledby="story-title">
        <div className="grid lg:grid-cols-2">
          <div className="relative min-h-[60vh] lg:min-h-[86vh]">
            <Img name="tunnel-crew" alt="The Peak Side crew lined up in front of a graffiti tunnel" sizes="(min-width:1024px) 50vw, 100vw" className="absolute inset-0 h-full w-full object-cover" />
          </div>
          <div className="wrap flex flex-col justify-center py-20 lg:px-16 lg:py-24">
            <Reveal>
              <span aria-hidden="true" className="mask-pks block h-14 w-20 text-bloom" />
              <p className="label mt-8 text-granite">From the founder</p>
              <blockquote id="story-title" className="display-wide mt-5 text-3xl leading-[1.08] sm:text-[2.6rem]">
                &ldquo;I realized there will never be any opportunity like this if I don&apos;t figure out how to get there myself.&rdquo;
              </blockquote>
              <p className="mt-6 max-w-md text-[16px] leading-relaxed text-ink/75">
                Peak Side started with one teenager, a love of being outside and a long-held dream of running a clothing brand. It&apos;s
                since grown into a community of friends who wear it everywhere.
              </p>
              <Link href="/story/" className="btn-line mt-8">
                Read the story <Arrow />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Restock */}
      {soldOut.length > 0 && (
        <section className="wrap py-24 sm:py-32" aria-labelledby="restock-title">
          <div className="grid gap-10 lg:grid-cols-12">
            <Reveal className="lg:col-span-4">
              <p className="label text-granite">Sold out</p>
              <h2 id="restock-title" className="display mt-4 text-6xl sm:text-7xl">
                The heavyweight double zip-up
              </h2>
              <p className="mt-5 max-w-sm text-[16px] leading-relaxed text-ink/75">
                Our best-selling zip-up sold through in all three colours. Ask to be told the moment it&apos;s back, or grab the in-stock
                Double Zip Hoodie now.
              </p>
              <Link href="/shop/double-zip-hoodie/" className="label link-u mt-6 inline-flex items-center gap-2">
                Shop the Double Zip Hoodie <Arrow />
              </Link>
            </Reveal>
            <div className="grid grid-cols-3 gap-3 lg:col-span-8">
              {soldOut.map((p, i) => (
                <Reveal key={p.slug} delay={i * 0.06}>
                  <div className="group">
                    <Link href={`/shop/${p.slug}/`} className="relative block aspect-[3/4] overflow-hidden bg-coal">
                      <Img name={p.colorways[0].images[0]} alt={p.name} sizes="(min-width:1024px) 20vw, 33vw" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </Link>
                    <p className="mt-3 text-[13px] font-medium sm:text-[14px]">{p.colorways[0].name}</p>
                    <a href={restockMailto(p.name)} className="label mt-1 inline-flex items-center gap-1.5 text-[10px] text-bloom hover:underline sm:text-[11px]">
                      Notify me <Arrow className="h-3 w-3" />
                    </a>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Instagram */}
      <section className="border-t border-ink/10 py-20 sm:py-28" aria-labelledby="ig-title">
        <div className="wrap">
          <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="label text-granite">Drops, restocks, the crew</p>
              <h2 id="ig-title" className="display mt-3 text-6xl sm:text-8xl">
                {site.instagram.handle}
              </h2>
            </div>
            <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="btn-ink self-start sm:self-auto">
              <Instagram /> Follow on Instagram <ArrowUpRight />
            </a>
          </Reveal>
          <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ["tunnel-crop-sit", "Friends in crop tops sitting in front of graffiti"],
              ["trail-path", "White Summer Edition tee on a forest trail by a waterfall"],
              ["night-boxy-trio", "Three friends showing off the boxy tee back print at night"],
              ["trail-falls-duo", "Two friends in Peak Side tees at the foot of a waterfall"],
            ].map(([name, alt], i) => (
              <Reveal key={name} delay={i * 0.05}>
                <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="group relative block aspect-square overflow-hidden bg-coal">
                  <Img name={name} alt={alt} sizes="(min-width:768px) 25vw, 50vw" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  <span className="absolute inset-0 grid place-items-center bg-ink/0 text-bone opacity-0 transition-all duration-500 group-hover:bg-ink/40 group-hover:opacity-100">
                    <Instagram className="h-7 w-7" />
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
