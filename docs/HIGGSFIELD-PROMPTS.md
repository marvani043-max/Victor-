# Peak Side: Higgsfield asset brief

No Higgsfield connection was available during this build, so **no AI assets were generated**.
Everything on the site today is Peak Side's own photography. The prompts below are ready to run.

## Ground rules

- **Real product only.** Peak Side sells physical garments, so generated imagery must never misrepresent a product: colour, graphic placement, fit or fabric.
  Use generated footage for **atmosphere** (landscape, light, motion), and keep garments either out of frame or composited from real photos.
- **No AI people presented as customers or the founder.** The founder is a minor; do not generate likenesses of them or of the real crew.
- **Palette:** granite grey, waterfall white, pine green, graffiti colour, with cherry-blossom pink (#F2A3C4 / #E0558F) as the only accent.

## 1. Hero film: "Trail to Tunnel" (primary)

Plugs into `HERO_VIDEO` in `src/data/site.ts`.

**Specs:** 8–12 s seamless loop · 16:9 master plus a 9:16 mobile cut · 24 fps · no audio · export H.264 MP4 under 4 MB and WebM under 3 MB · 1920×1080 and 1080×1920.

**Prompt (16:9):**
> Cinematic slow push-in through a granite canyon at golden hour. Mist drifting off a tall waterfall, sunlight catching the spray, pine trees on the ridgeline, handheld 35mm film texture with soft grain. The camera glides forward and the scene cross-dissolves through a dark concrete tunnel mouth into an urban underpass covered in layered graffiti, warm late-afternoon light spilling in. Muted natural colour grade, deep blacks, a single soft pink flare. No people, no text, no logos. Calm, unhurried motion that loops cleanly to the first frame.

**Negative:** people, faces, text, logos, watermarks, fast cuts, drone whoosh, lens flares except one pink, oversaturated HDR, fisheye.

**Poster frame:** `trail-falls-wide` (already on site) or the first frame of the film.

## 2. Collection tile loops (optional)

3–4 s silent loops behind the three category tiles on the home page. Each under 1.5 MB.

| Tile | Prompt |
| --- | --- |
| Hoodies & zips | "Close macro of snow falling past a granite boulder at dusk, shallow depth of field, soft grain, no people." |
| Summer Edition | "Cherry-blossom petals drifting across a sunlit granite slab beside a mountain stream, slow motion, film grain, no people." |
| Crop tops | "Slow pan across a graffiti-covered concrete wall in warm evening light, dust in the air, film grain, no people, no readable words." |

## 3. Product photography reshoot (recommended over AI)

The biggest visual gap is that the catalogue mixes studio cut-outs with phone flat-lays on a wood floor
(White Globe Hoodie, Crewneck, all three Heavyweight Zip-Ups). This should be fixed with a **real** reshoot, not generation:

- Same seamless background for every piece: off-white #F3F0EA, or white so it blends with the existing cut-outs.
- Front, back, graphic close-up and one on-model shot per colourway.
- 2000 px on the long edge, 4:5 crop, consistent overhead light.

Drop the new files into a folder and run `SRC=that-folder npm run images` after adding them to the map in `scripts/process-images.mjs`.

## Wiring a video in

1. Put files in `public/video/`, e.g. `hero.mp4` and `hero.webm`.
2. In `src/data/site.ts`, set:
   ```ts
   export const HERO_VIDEO = { src: "/video/hero.mp4", poster: "trail-falls-wide" };
   ```
3. The hero then plays muted, inline and looped, shows the poster first, and is hidden for visitors with reduced-motion turned on.
