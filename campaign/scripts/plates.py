"""Cut each garment out of the original photographs into an RGBA "plate".

Garment pixels are copied from the photos untouched; only the alpha channel is computed.
"""
import os, sys, json
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from masks import GRAY_HOODIE, PINK_HOODIE, GRAY_PANTS, PINK_PANTS

SRC = os.path.join(HERE, '..', 'source')


def poly_mask(size, pts):
    m = Image.new('L', size, 0)
    ImageDraw.Draw(m).polygon(pts, fill=255)
    return np.asarray(m) > 127


def smoothstep(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def front_alpha(size, spec, halo=5.0, ramp=12.0):
    sil = poly_mask(size, spec['sil'])
    out = ndi.distance_transform_edt(~sil)          # distance outside the silhouette
    a_sil = 1 - smoothstep((out - halo) / ramp)      # soft falloff into the floor
    cut = poly_mask(size, spec['cut'])
    inside = ndi.distance_transform_edt(cut)         # distance inside the hard cut
    a_cut = np.clip(inside / 2.0, 0, 1)              # 2px edge, exactly 0 at neighbours
    return a_sil * a_cut


GAP_SEEDS = [(355, 835), (875, 810)]   # floor between the gray / pink pant legs
# Hand-traced outlines of the concrete visible between the legs. Inside these only, darker
# floor is also removed (threshold 34); the outline stops the fill reaching the fabric.
GAP_POLYS = [
    [(312,735),(378,735),(400,790),(405,860),(390,920),(368,975),(345,940),(330,860),(318,790)],
    [(830,738),(905,738),(925,800),(922,880),(900,950),(878,1010),(860,960),(840,880),(825,800)],
]


def floor_mask(img, specs, thresh=48, seed_dist=14):
    """Lit concrete next to the garments: bright pixels reachable from open floor without
    crossing dark fabric. Every garment edge in this photo is bounded by black fabric, so the
    fill stops there. thresh=48 was checked by eye: lower values leak into the pink stripe."""
    L = np.asarray(img.convert('L').filter(ImageFilter.MedianFilter(3))).astype(float)
    union = np.zeros(L.shape, bool)
    for s in specs:
        union |= poly_mask(img.size, s['sil'])
    dout = ndi.distance_transform_edt(~union)
    seed = dout > seed_dist
    lab, _ = ndi.label((L > thresh) | seed)
    ids = np.unique(lab[seed]); ids = ids[ids > 0]
    floor = np.isin(lab, ids)
    # Concrete visible between the legs is enclosed by fabric, so seed it explicitly.
    # A seed is used only if its bright region stays small (i.e. did not leak into fabric).
    gaps = np.zeros(L.shape, bool)
    for sx, sy in GAP_SEEDS:
        lab2, _ = ndi.label(L > thresh)
        comp = lab2 == lab2[sy, sx]
        if L[sy, sx] > thresh and comp.sum() < 20000:
            gaps |= comp
    for poly, (sx, sy) in zip(GAP_POLYS, GAP_SEEDS):
        lab3, _ = ndi.label((L > 34) & poly_mask(img.size, poly))
        gaps |= lab3 == lab3[sy, sx]
    return np.maximum(ndi.gaussian_filter(floor.astype(float), 1.2),
                      ndi.gaussian_filter(gaps.astype(float), 2.5))


def back_alpha(img):
    a = np.asarray(img).astype(np.int16)
    mn, mx = a.min(2), a.max(2)
    bg = (mn >= 236) & ((mx - mn) < 14)
    lab, n = ndi.label(bg)
    sizes = ndi.sum(bg, lab, range(1, n + 1))
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    keep_bg = np.zeros(n + 1, bool)
    for i in range(1, n + 1):
        if i in border or sizes[i - 1] > 15000:      # outside, or the gap between the legs
            keep_bg[i] = True
    background = keep_bg[lab]
    # The leg gap holds shaded off-white the pure-white key misses. Grow only the enclosed
    # gap (never the outside, where the gray plaid stripe touches the edge) into pale pixels.
    gap = background & ~np.isin(lab, list(border))
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    pale = (a.mean(2) > 120) & ((mx - mn) < 40)
    warm_shadow = (r - b >= 13) & (g - b >= 4) & (a.mean(2) > 45)   # beige shadow; fabric is neutral
    pale |= warm_shadow
    lab_p, _ = ndi.label(pale | gap)
    ids = np.unique(lab_p[gap]); ids = ids[ids > 0]
    background |= np.isin(lab_p, ids)
    # Same beige shadow fringes the outer edge: remove it only within 25px of the outside.
    near_out = ndi.distance_transform_edt(~background) <= 25
    lab_w, _ = ndi.label((warm_shadow & near_out) | background)
    ids = np.unique(lab_w[background]); ids = ids[ids > 0]
    background |= np.isin(lab_w, ids) & near_out
    garment = ~background
    lab2, n2 = ndi.label(garment)                    # drop the phone scrollbar etc.
    sizes2 = ndi.sum(garment, lab2, range(1, n2 + 1))
    garment = lab2 == (1 + int(np.argmax(sizes2)))
    garment = ndi.binary_opening(garment, iterations=1)
    inside = ndi.distance_transform_edt(garment)
    return np.clip((inside - 0.5) / 1.5, 0, 1)


def to_plate(img, alpha, pad=0):
    rgba = np.dstack([np.asarray(img), (alpha * 255).round().astype(np.uint8)])
    ys, xs = np.nonzero(alpha > 0.004)
    box = (max(xs.min() - pad, 0), max(ys.min() - pad, 0), xs.max() + 1 + pad, ys.max() + 1 + pad)
    return Image.fromarray(rgba, 'RGBA').crop(box), box


def build(out_dir):
    os.makedirs(out_dir, exist_ok=True)
    front = Image.open(os.path.join(SRC, 'flatlay-sets-front.jpg')).convert('RGB')
    plates = {}
    specs = {'gray_hoodie': GRAY_HOODIE, 'pink_hoodie': PINK_HOODIE,
             'gray_pants_front': GRAY_PANTS, 'pink_pants_front': PINK_PANTS}
    floor = floor_mask(front, specs.values())
    alphas = {k: front_alpha(front.size, v) * (1 - floor) for k, v in specs.items()}
    alphas['gray_set'] = np.maximum(alphas['gray_hoodie'], alphas['gray_pants_front'])
    alphas['pink_set'] = np.maximum(alphas['pink_hoodie'], alphas['pink_pants_front'])
    for k, a in alphas.items():
        plates[k] = to_plate(front, a)
    for k, f in (('gray_pants_back', 'gray-pants-back.jpg'), ('pink_pants_back', 'pink-pants-back.jpg')):
        im = Image.open(os.path.join(SRC, f)).convert('RGB')
        plates[k] = to_plate(im, back_alpha(im))
    offsets = {}
    for k, (p, box) in plates.items():
        p.save(os.path.join(out_dir, k + '.png'))
        offsets[k] = [int(box[0]), int(box[1])]
        print(k, p.size, 'from', tuple(int(b) for b in box))
    with open(os.path.join(out_dir, 'offsets.json'), 'w') as f:
        json.dump(offsets, f, indent=1)
    return plates


if __name__ == '__main__':
    build(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', 'build', 'plates'))
