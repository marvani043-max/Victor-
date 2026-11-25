# Bighorn Construction & Hardscape: website concept

A pitch website by Marvani for Bighorn Construction & Hardscape (Reno, NV; owner Caleb Sharron).
It is separate from the Peak Side project in the rest of this repo.

- `index.html`: the whole site. It is a single page in Claude Artifact format (no `<html>`/`<head>`/`<body>` wrapper; the artifact host adds it).
- `img/`: project photos and the crest, as WebP.

## Where the content came from

- Services, contact details, owner name and the "licensed, insured and bonded" claim come from Bighorn's Instagram (@bighorn.build.nv).
- The 12 project photos were cut from the before/after collage Bighorn posted, then upscaled 4x with an ESRGAN model (UpscalerJS), because each frame was only about 200px wide.
- The crest was cropped from the Instagram post. Its phone-number ribbon is cut off because profile avatars cover it in the screenshot.
- The service-area map is drawn to scale from real town coordinates.

## Before this goes live on Google

1. **Replace the four sample reviews** with real Google reviews. They are labelled "Sample" on the page. Publishing invented reviews breaks the FTC's 2024 rule on fake reviews.
2. **Add the Nevada contractor license number** in the three places marked "to be added". Nevada requires contractors to show their license number in advertising.
3. **Get full-resolution originals** of the project photos from Caleb, plus a high-resolution crest (ideally a PNG with a transparent background, or an SVG).
4. **Confirm with Caleb:** the build specs in "How we build", the process steps, "no sales team, no hand-offs", "clean job site", small jobs, and the service-area towns.
5. **Remove** the `noindex` meta tag and the "Website concept by Marvani" preview bar.
6. **Wrap the page** in a full HTML document (`<!doctype html>`, `<html lang="en">`, `<head>` with the meta tags, `<body>`). Then add the final domain as `url` in the JSON-LD and as `og:url`, plus an `og:image`.
7. **Optional:** set up a Google Business Profile and link it from the page.

## Contact flow

There is no form backend. The estimate planner builds a message, then opens the visitor's texting app (`sms:`) or email app (`mailto:`) with the message filled in, or copies it to the clipboard. Nothing is sent from the page itself.
