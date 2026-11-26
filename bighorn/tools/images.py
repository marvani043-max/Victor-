#!/usr/bin/env python3
"""Bighorn image pipeline.

Step 1 (one-off, already done): `crop` cuts the project photos out of the iPad
screenshots of Bighorn's Instagram, paints over Instagram's "1/2" badge and
mute icon, and saves masters to src/img-master/.

    python3 tools/images.py crop <folder-with-screenshots>

Step 2: `web` turns the masters into the responsive WebP files the site uses
(site/img/), at 1014, 720 and 420 px wide, plus a transparent crest.

    python3 tools/images.py web

Needs Pillow and numpy (and opencv-python-headless for step 1).
"""
import sys, os, glob
import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
MASTER = os.path.join(ROOT, 'src', 'img-master')
OUT = os.path.join(ROOT, 'src', 'static', 'img')

# Screenshot file -> crop. Coordinates are in the 2360x1640 screenshot.
# Rects are Instagram UI (slide counter, mute button) painted out before saving.
L, R = 673, 1687
CROPS = {
    'stairs-before':   ('IMG_0159.png', (L, 190, R, 1542), [(1588, 212, 1664, 277), (1600, 1457, 1664, 1522)], 0),
    'stairs-after':    ('IMG_0160.png', (L, 190, R, 1542), [(1588, 212, 1664, 277), (1600, 1457, 1664, 1522)], 0),
    'office-demo':     ('IMG_0161.png', (L, 276, R, 1037), [(1588, 298, 1664, 360), (1600, 952, 1664, 1015)], 0),
    'office-before':   ('IMG_0162.png', (L, 276, R, 1037), [(1588, 298, 1664, 360), (1600, 952, 1664, 1015)], 0),
    'sideyard-before': ('IMG_0163.png', (L, 253, R, 1605), [(1588, 275, 1664, 339), (1602, 1519, 1664, 1581)], 0),
    'sideyard-after':  ('IMG_0164.png', (L, 253, R, 1605), [(1588, 275, 1664, 339), (1602, 1519, 1664, 1581)], 0),
    'backyard-before': ('IMG_0165.png', (L, 79, R, 1451),  [(1588, 124, 1664, 183), (1602, 1365, 1664, 1428)], 110),
    'backyard-after':  ('IMG_0166.png', (L, 79, R, 1451),  [(1588, 124, 1664, 183), (1602, 1365, 1664, 1428)], 110),
    'sod-before':      ('IMG_0169.png', (L, 116, R, 1473), [(1588, 145, 1664, 207), (1602, 1386, 1664, 1452)], 95),
    'sod-after':       ('IMG_0170.png', (L, 116, R, 1473), [(1588, 145, 1664, 207), (1602, 1386, 1664, 1452)], 95),
}
CREST = ('IMG_0157.png', (777, 344, 1585, 1152))
# Not used on purpose: IMG_0168 (Instagram labels it "AI content"; it is a render,
# not a finished job) and IMG_0167 (its only "after" is that render).

WIDTHS = (1014, 720, 420)


def crop(src_dir):
    import cv2
    os.makedirs(MASTER, exist_ok=True)
    for name, (fn, (x0, y0, x1, y1), rects, trim) in CROPS.items():
        im = cv2.imread(os.path.join(src_dir, fn))
        c = im[y0:y1, x0:x1].copy()
        mask = np.zeros(c.shape[:2], np.uint8)
        for a, b, cc, d in rects:
            cv2.rectangle(mask, (a - x0, b - y0), (cc - x0, d - y0), 255, -1)
        c = cv2.inpaint(c, mask, 9, cv2.INPAINT_TELEA)[trim:]
        Image.fromarray(cv2.cvtColor(c, cv2.COLOR_BGR2RGB)).save(os.path.join(MASTER, name + '.webp'), quality=94, method=6)
    fn, (x0, y0, x1, y1) = CREST
    Image.open(os.path.join(src_dir, fn)).convert('RGB').crop((x0, y0, x1, y1)).save(os.path.join(MASTER, 'crest.png'))
    print('masters written to', MASTER)


def _label(mask):
    """4-connected component labelling without scipy/opencv."""
    h, w = mask.shape
    lab = np.zeros((h, w), np.int32); n = 0
    for y0, x0 in zip(*np.nonzero(mask)):
        if lab[y0, x0]:
            continue
        n += 1; stack = [(y0, x0)]
        while stack:
            y, x = stack.pop()
            if 0 <= y < h and 0 <= x < w and mask[y, x] and not lab[y, x]:
                lab[y, x] = n
                stack.extend(((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)))
    return lab, n


def transparent_crest(im):
    """Flood-fill the white background from the edges into alpha, with a soft edge."""
    a = np.asarray(im.convert('RGB')).astype(np.int16)
    h, w, _ = a.shape
    white = (a.min(axis=2) > 236) & ((a.max(axis=2) - a.min(axis=2)) < 22)
    # Instagram rounds the corners of every post, so the crop's corners hold the
    # app's dark background. Count those dark corner pixels as background too.
    k = 48
    for ys, xs in ((slice(0, k), slice(0, k)), (slice(0, k), slice(w - k, w)), (slice(h - k, h), slice(0, k)), (slice(h - k, h), slice(w - k, w))):
        white[ys, xs] |= a[ys, xs].max(axis=2) < 120
    bg = np.zeros((h, w), bool)
    stack = [(0, x) for x in range(w)] + [(h - 1, x) for x in range(w)] + [(y, 0) for y in range(h)] + [(y, w - 1) for y in range(h)]
    while stack:
        y, x = stack.pop()
        if y < 0 or y >= h or x < 0 or x >= w or bg[y, x] or not white[y, x]:
            continue
        bg[y, x] = True
        stack.extend(((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)))
    # white pockets enclosed by the horns are background too (upper 30% of the crest only,
    # so the white lettering lower down is untouched)
    lab, n = _label(white & ~bg)
    for i in range(1, n + 1):
        ys, xs = np.nonzero(lab == i)
        if len(ys) > 100 and ys.mean() < 0.30 * h:
            bg[ys, xs] = True
    alpha = Image.fromarray(np.where(bg, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.1))
    rgba = im.convert('RGBA'); rgba.putalpha(alpha)
    bbox = alpha.point(lambda v: 255 if v > 8 else 0).getbbox()
    return rgba.crop(bbox)


def web():
    os.makedirs(OUT, exist_ok=True)
    for f in sorted(glob.glob(os.path.join(MASTER, '*.webp'))):  # job photos
        name = os.path.basename(f)[:-5]
        im = Image.open(f).convert('RGB')
        for wdt in WIDTHS:
            r = im if im.width <= wdt else im.resize((wdt, round(im.height * wdt / im.width)), Image.LANCZOS)
            if r is not im:
                r = r.filter(ImageFilter.UnsharpMask(radius=1.0, percent=40, threshold=2))
            r.save(os.path.join(OUT, f'{name}-{wdt}.webp'), quality={1014: 70, 720: 72, 420: 75}[wdt], method=6)
        print(name, im.size)
    # Typical-detail drawings (rendered by tools/drawings.mjs at 1600x2000)
    for f in sorted(glob.glob(os.path.join(MASTER, 'dwg-*.png'))):
        name = os.path.basename(f)[:-4]
        im = Image.open(f).convert('RGB')
        for wdt in (1600,) + WIDTHS:
            r = im if im.width == wdt else im.resize((wdt, round(im.height * wdt / im.width)), Image.LANCZOS)
            r.save(os.path.join(OUT, f'{name}-{wdt}.webp'), quality=88, method=6)
        print(name, im.size)
    crest = Image.open(os.path.join(MASTER, 'crest.png'))
    t = transparent_crest(crest)
    for wdt in (640, 240, 120):
        t.resize((wdt, round(t.height * wdt / t.width)), Image.LANCZOS).save(os.path.join(OUT, f'crest-{wdt}.webp'), quality=90, method=6)
    # PNG copies for Open Graph / schema (some crawlers skip WebP) and a favicon
    t.resize((512, round(t.height * 512 / t.width)), Image.LANCZOS).save(os.path.join(OUT, 'crest-512.png'), optimize=True)
    t.resize((180, round(t.height * 180 / t.width)), Image.LANCZOS).save(os.path.join(OUT, 'crest-180.png'), optimize=True)
    og = Image.open(os.path.join(MASTER, 'backyard-after.webp')).convert('RGB')
    # 1200x630 social card: crop the after photo to the walkway and lawn
    s = 1200 / og.width
    og = og.resize((1200, round(og.height * s)), Image.LANCZOS)
    top = round(og.height * 0.34)
    og.crop((0, top, 1200, top + 630)).save(os.path.join(OUT, 'og-backyard.jpg'), quality=84, optimize=True, progressive=True)
    print('crest', t.size, '-> web images in', OUT)


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else 'web'
    if cmd == 'crop':
        crop(sys.argv[2])
    else:
        web()
