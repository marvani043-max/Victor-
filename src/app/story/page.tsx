import type { Metadata } from "next";
import Link from "next/link";
import Img from "@/components/Img";
import Reveal from "@/components/Reveal";
import { Arrow, Ridge } from "@/components/Icons";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Our Story — Started at 16, Built Outside",
  description:
    "Peak Side is an outdoor clothing brand started by a 16-year-old who loves being outside. Read how a dream of owning a clothing brand turned into a community.",
  alternates: { canonical: "/story/" },
};

export default function StoryPage() {
  return (
    <>
      <section className="relative h-[78svh] min-h-[520px] overflow-hidden bg-ink text-bone">
        <Img name="trail-falls-rock" alt="Standing on granite at the foot of a waterfall in a Peak Side tee" priority className="absolute inset-0 h-full w-full object-cover" style={{ objectPosition: "50% 72%" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-ink/30" />
        <div className="wrap relative flex h-full flex-col justify-end pb-12">
          <p className="label text-bone/75">Our story</p>
          <h1 className="display mt-4 text-[18vw] sm:text-[9rem] lg:text-[11rem]">
            Started at 16.
            <br />
            <span className="text-sakura">Built outside.</span>
          </h1>
        </div>
      </section>

      <section className="wrap py-20 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-3">
            <span aria-hidden="true" className="mask-pks block h-12 w-16 text-bloom" />
            <p className="label mt-6 text-granite">In the founder&apos;s words</p>
            <Ridge className="mt-4 h-3 w-24 text-ink/40" />
          </Reveal>
          <div className="space-y-8 lg:col-span-8 lg:col-start-5">
            {/* Founder's About Us text from peak-side.com, with spelling and capitalisation corrected. */}
            <Reveal>
              <p className="display-wide text-[7vw] leading-[1.1] sm:text-4xl lg:text-[2.9rem]">
                &ldquo;I am a 16-year-old that started this brand because I love being outside, and it has been my dream to own a clothing
                brand ever since I was younger.&rdquo;
              </p>
            </Reveal>
            <Reveal delay={0.05}>
              <p className="max-w-2xl text-[18px] leading-relaxed text-ink/80">
                &ldquo;How it got to here: I had a week where I was looking at stuff from a different perspective and realized there will
                never be any opportunity like this if I don&apos;t figure out how to get there myself.&rdquo;
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <p className="max-w-2xl text-[18px] leading-relaxed text-ink/80">
                &ldquo;This brand has not only helped me but also brought the community together and has started many new
                relationships.&rdquo;
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="pb-20 sm:pb-28" aria-label="Peak Side in the wild">
        <div className="wrap grid grid-cols-2 gap-3 md:grid-cols-12">
          <Reveal className="col-span-2 md:col-span-7">
            <div className="relative aspect-[3/2] overflow-hidden bg-coal">
              <Img name="tunnel-crew" alt="The Peak Side crew wearing tees, hoodies and crop tops" sizes="(min-width:768px) 58vw, 100vw" className="h-full w-full object-cover" />
            </div>
          </Reveal>
          <Reveal className="md:col-span-5" delay={0.06}>
            <div className="relative aspect-[3/4] overflow-hidden bg-coal md:aspect-auto md:h-full">
              <Img name="trail-overlook" alt="White Summer Edition tee at a canyon overlook" sizes="(min-width:768px) 40vw, 50vw" className="h-full w-full object-cover" />
            </div>
          </Reveal>
          <Reveal className="md:hidden" delay={0.1}>
            <div className="relative aspect-[3/4] overflow-hidden bg-coal">
              <Img name="tunnel-pink-hoodie" alt="Pink faded hoodie and black hoodie against graffiti" sizes="50vw" className="h-full w-full object-cover" />
            </div>
          </Reveal>
        </div>
      </section>

      <section className="border-t border-ink/10 bg-stone py-24 sm:py-32">
        <div className="wrap grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="label text-granite">What we make</p>
            <h2 className="display mt-4 text-6xl sm:text-8xl">
              Made for
              <br />
              <span className="text-bloom">both places.</span>
            </h2>
          </div>
          <div className="space-y-6 text-[17px] leading-relaxed text-ink/80 lg:col-span-5 lg:col-start-8 lg:pt-10">
            <p>
              Hoodies made for snow days on the mountain and school days in town. Summer Edition tees and crop tops for long
              afternoons on the trail. Everything is designed to work in both places.
            </p>
            {/* PLACEHOLDER — Peak Side to supply: founder's first name (if they want it shown), hometown/region, year founded, and how pieces are made or sourced. */}
            <p className="border-l-2 border-sakura pl-4 text-[14px] text-granite">
              Placeholder: founding year, home mountains and how the pieces are made, to be supplied by Peak Side.
            </p>
            <div className="flex flex-wrap gap-3 pt-4">
              <Link href="/shop/" className="btn-ink">
                Shop the collection <Arrow />
              </Link>
              <a href={site.instagram.url} target="_blank" rel="noopener noreferrer" className="btn-line">
                Follow {site.instagram.handle}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
