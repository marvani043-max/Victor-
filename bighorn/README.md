# Bighorn Construction & Hardscape: website

A multi-page website by Marvani for Bighorn Construction & Hardscape (Reno, NV).
It is separate from the Peak Side project in the rest of this repo.

- **`site/`** is the finished website: plain HTML, CSS and images, ready to upload to any static host.
- **`src/`** is what you edit. `build.mjs` turns it into `site/`.

## Design

Modelled on the layout of a Reno general contractor's site the client pointed to (full-screen photo hero with the
company name in thin capitals, centred split navigation, dark service cards, a services grid with line icons, a
quote band and contact cards in the footer), in Bighorn's own colours and copy. The site never names the owner.

## Pages

| Page | URL |
| --- | --- |
| Home | `/` |
| Services, plus 7 service pages | `/services/`, `/services/concrete/`, `/services/pavers-hardscape/`, `/services/backyard-design/`, `/services/sod-sprinklers/`, `/services/fencing-gates/`, `/services/excavation-grading/`, `/services/remodels/` |
| Projects, plus 5 case studies | `/projects/`, `/projects/backyard-rebuild/`, `/projects/side-yard-concrete/`, `/projects/sod-install/`, `/projects/staircase-renovation/`, `/projects/office-remodel/` |
| Our process | `/process/` |
| About | `/about/` |
| Reviews | `/reviews/` |
| Contact | `/contact/` |
| Request a quote | `/quote/` |
| Not found | `/404.html` |

Every page has its own title, meta description, canonical URL, Open Graph tags and JSON-LD
(`GeneralContractor` business data, `Service` on service pages, `FAQPage` where there are FAQs, and breadcrumbs).
The build also writes `sitemap.xml` and `robots.txt`.

## Build

Needs Node 18 or later. No `npm install`; there are no dependencies.

```bash
cd bighorn
node build.mjs                                   # preview build: noindex, "concept" bar at the top
SITE_URL=https://www.yourdomain.com node build.mjs --launch   # live build: indexable, no preview bar
node build.mjs --artifact /some/folder           # flat files for the Claude Artifact preview
```

| Variable | Purpose |
| --- | --- |
| `SITE_URL` | The real domain, for canonical URLs, the sitemap and social previews. Until it is set, they use `https://www.example.com`. |
| `FORM_ENDPOINT` | Optional. A form service URL (Formspree, Basin, Getform…). With it, the quote and contact forms post there and only show "Request sent" when the service confirms. Without it, the forms build the message and open the visitor's text or email app, ready to send. Nothing is ever shown as sent when it was not. |

The build lists every placeholder still on the pages. `--launch` warns if any are left.

### Deploying

Upload the contents of `site/` to Netlify, Cloudflare Pages, Vercel or any web host. Configure the host to serve
`404.html` for missing pages (Netlify and Cloudflare do this automatically).

## Editing

- **Words and facts:** `src/content.mjs` (business details, services, projects, process, FAQ, towns).
- **Page layouts:** `build.mjs`.
- **Design:** `src/site.css`. Colours and fonts are tokens at the top.
- **Behaviour:** `src/site.js` (hero before/after cycle, menus, service previews, before/after toggles,
  map, project filter, forms).
- **Photos:** `tools/images.py`. Masters live in `src/img-master/`; run `python3 tools/images.py web` to remake
  the 420/720/1014 px WebP files in `src/static/img/`, then rebuild.
- **Drawings:** `tools/drawings.mjs` draws the six typical-detail construction drawings (concrete, backyard plan,
  sprinkler zones, fence and gate, grading, stairs) as SVG in `src/drawings/` and renders them with Playwright to
  `src/img-master/dwg-*.png`. Then run `python3 tools/images.py web` and rebuild.

## Where the content came from

- Phone, email, the services list, "licensed, insured and bonded", free estimates and the owner's quote come from Bighorn's Instagram (@bighorn.build.nv). The tagline and service-area towns carry over from the
  first concept.
- **Photos** are cut from iPad screenshots of Bighorn's Instagram posts (about 1014 px wide), with Instagram's
  slide counter and mute icon painted out. Nothing is AI-generated or stock.
- **Drawings** on the service pages are illustrations of typical construction, labelled "typical detail" on
  the drawing and in the caption. They show how the work is usually built, never a specific job, so they can sit
  next to the real photos without misleading anyone. Fake job photos and a fake photo of the owner were ruled out for
  that reason. The code figures on them (IRC R401.3 grading, R311.7 stairs) are the model-code numbers; confirm
  the concrete, fence and sprinkler numbers with the owner along with the method steps.
- **Left out on purpose:** the lit paver patio "after" photo (June post, Sparks). Instagram labels that post
  "AI content" and it is a rendering, not a finished job, so it cannot be shown as Bighorn's work. Its "before"
  photo was dropped with it. The first concept used that render in its hero; this version does not.
- The commercial office post shows **demolition** (the glass partition coming out), so it is presented as an
  in-progress remodel, not as a glass partition Bighorn installed.
- No reviews are invented. The reviews section and page show clearly marked slots until real ones are added.

## Before this goes live

1. **Reviews:** add 2–3 real Google reviews (first name, town, project) in `build.mjs` (home and reviews page),
   and the Google review link as `googleReviews` in `src/content.mjs`.
2. **License number:** set `license` in `src/content.mjs`. Nevada requires it in advertising.
3. **Photos:** get full-resolution originals from the owner (these are phone screenshots), more photos per project,
   and a real photo of the owner for the About page.
4. **Confirm with the owner:**
   - The staircase post also carries Instagram's "AI content" label. The photos look like real job photos, but
     confirm they are unedited originals before launch, or drop that project.
   - Project towns, dates, sizes and materials (marked "to confirm" on the project pages).
   - The method steps on each service page and the process steps.
   - Service-area towns, and that the sod job took "a day of work on site".
   - Whether snow removal and landscape lighting (on the first concept) are real services. They are not on this
     version because nothing in his posts shows them.
5. **Domain and form:** set `SITE_URL`, optionally `FORM_ENDPOINT`, and build with `--launch`.
6. **Google:** set up a Google Business Profile, then submit `sitemap.xml` in Search Console.
