"""Make transparent cut-outs of studio product shots for the 360° spin viewer and card flips.

Reads the ORIGINAL studio shots (pure #FFFFFF background), removes only the white background
that touches the image border (so white garments stay intact), trims the anti-aliased edge,
and writes public/images/<name>-cut-<w>.webp plus a "<name>-cut" entry in
src/data/image-manifest.json. Source ids come from the MAP in scripts/process-images.mjs.

    SRC=/path/to/originals python3 scripts/make-cutouts.py
"""
import json
import os
import re
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

NAMES = [
    "hoodie-faded-black-front", "hoodie-faded-black-back",
    "hoodie-both-black-front", "hoodie-both-black-back",
    "zip-black-front", "zip-black-back", "zip-navy-front", "zip-navy-back",
    "zip-grey-front", "zip-grey-back",
    "tee-black-alt", "tee-black-front", "tee-black-boxy-alt", "tee-black-boxy-front",
    "tee-white-front", "tee-white-back", "tee-white-boxy-front", "tee-white-boxy-back",
    "crop-black-front", "crop-black-plain", "crop-white-front", "crop-white-plain",
    "crop-grey-front", "crop-grey-back",
]
IMG = "public/images"
MANIFEST = "src/data/image-manifest.json"
WIDTHS = [480, 960]
THRESH = 255  # upper bound; the real cut-off is measured per image from its border
SRC = os.environ.get("SRC")
if not SRC:
    sys.exit("Set SRC to the folder holding the original images.")
IDS = dict(re.findall(r'"([a-z0-9-]+)": \["([0-9a-f]{8})"', open("scripts/process-images.mjs").read()))
FILES = os.listdir(SRC)

manifest = json.load(open(MANIFEST))

for name in NAMES:
    src = Image.open(os.path.join(SRC, next(f for f in FILES if f.startswith(IDS[name])))).convert("RGB")
    a = np.asarray(src)
    h, w, _ = a.shape

    # Each studio shot has a slightly different backdrop (pure white, 253-254, or a light grey
    # gradient). Take the darkest backdrop level found along the border as the cut-off.
    edge = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]]).min(axis=1)
    thresh = min(THRESH, int(np.percentile(edge, 0.5)) - 1)
    # Binary map of backdrop-coloured pixels, then flood-fill from every border pixel.
    white = (a.min(axis=2) >= thresh).astype(np.uint8) * 255
    m = Image.fromarray(white, "L")
    draw = ImageDraw.Draw(m)
    border = [(x, 0) for x in range(w)] + [(x, h - 1) for x in range(w)] + [(0, y) for y in range(h)] + [(w - 1, y) for y in range(h)]
    for xy in border:
        if m.getpixel(xy) == 255:
            ImageDraw.floodfill(m, xy, 128)
    bg = np.asarray(m) == 128
    # Grow the background by ~1.5px to drop the white anti-aliased ring around dark garments.
    bg = np.asarray(Image.fromarray((bg * 255).astype(np.uint8), "L").filter(ImageFilter.MaxFilter(3))) > 0

    alpha = np.where(bg, 0, 255).astype(np.uint8)
    alpha_img = Image.fromarray(alpha, "L").filter(ImageFilter.GaussianBlur(0.8))
    rgba = src.copy()
    rgba.putalpha(alpha_img)

    # Trim to content with a small margin so the garment fills the stage consistently.
    bbox = Image.fromarray(alpha, "L").getbbox()
    pad = int(0.04 * max(w, h))
    x0, y0, x1, y1 = bbox
    side = max(x1 - x0, y1 - y0) + 2 * pad
    cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
    box = (cx - side // 2, cy - side // 2, cx - side // 2 + side, cy - side // 2 + side)
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.paste(rgba.crop((max(0, box[0]), max(0, box[1]), min(w, box[2]), min(h, box[3]))), (max(0, -box[0]), max(0, -box[1])))

    widths = []
    for tw in WIDTHS + [min(1200, side)]:
        if tw > side or tw in widths:
            continue
        out = canvas.resize((tw, tw), Image.LANCZOS)
        out.save(f"{IMG}/{name}-cut-{tw}.webp", "WEBP", quality=82, alpha_quality=90, method=6)
        widths.append(tw)
    manifest[f"{name}-cut"] = {"w": side, "h": side, "kind": "cut", "widths": sorted(widths), "color": "rgb(0,0,0)"}
    print(f"{name}: cut-off {thresh}, {len(widths)} sizes, {100 * bg.mean():.0f}% background removed")

json.dump(manifest, open(MANIFEST, "w"), indent=1)
