"""Render the six PKS campaign videos (1080x1920, 30 fps, 10 s) from the garment plates.

Every frame is the original photograph of the garment, moved by a virtual camera
(pan / push / pull and a slight roll) over a charcoal studio backdrop. Garment pixels are
never recoloured, warped or retouched: the grade, vignette, grain and light sweep are
applied to the backdrop only.

    python3 render.py                 # all six
    python3 render.py 1 3             # selected videos
    python3 render.py --stills 2      # contact-sheet stills only
"""
import os, sys, json, subprocess
from multiprocessing import Pool
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import plates as plates_mod

OUT_W, OUT_H, FPS, DUR = 1080, 1920, 30, 10.0
N = int(FPS * DUR)
UP = 2           # plates are pre-upscaled 2x with Lanczos before the camera samples them
MARGIN = 160     # transparent margin round each plate (for the shadow), in plate px

# One timing grid shared by all six videos so the collection reads as one launch.
# (start, end) in seconds; neighbouring shots overlap by 0.5 s for the dissolve.
SLOTS = [(0.0, 2.7), (2.2, 4.9), (4.4, 7.1), (6.6, 10.0)]
FADE_IN, FADE_OUT = 0.7, 0.45

# Camera keyframes: plate name, (cx, cy) start -> end in pixels of the ORIGINAL photograph,
# visible width W start -> end in photo pixels, roll in degrees start -> end.
def shot(plate, c0, c1, w0, w1, r0=0.0, r1=0.0):
    return dict(plate=plate, c0=c0, c1=c1, w0=w0, w1=w1, r0=r0, r1=r1)

VIDEOS = {
    1: dict(name='01_PKS_hoodie_black-pink', shots=[
        shot('pink_hoodie', (852, 92), (850, 112), 250, 222, -1.2, -0.4),   # pink plaid hood lining
        shot('pink_hoodie', (877, 250), (907, 246), 236, 222, 0.6, 0.0),    # PKS chest logo
        shot('pink_hoodie', (827, 372), (847, 392), 330, 300, -0.4, 0.4),   # kangaroo pocket, plaid openings
        shot('pink_hoodie', (871, 300), (871, 282), 420, 600, 0.5, 0.0),    # reveal
    ]),
    2: dict(name='02_PKS_hoodie_black-gray', shots=[
        shot('gray_hoodie', (384, 92), (382, 112), 250, 222, -1.2, -0.4),
        shot('gray_hoodie', (414, 254), (444, 250), 236, 222, 0.6, 0.0),
        shot('gray_hoodie', (356, 376), (376, 396), 330, 300, -0.4, 0.4),
        shot('gray_hoodie', (358, 300), (358, 282), 420, 600, 0.5, 0.0),
    ]),
    3: dict(name='03_PKS_sweatpants_black-pink', shots=[
        shot('pink_pants_front', (859, 573), (865, 599), 300, 268, -0.8, 0.0),  # waistband + drawstrings
        shot('pink_pants_front', (973, 653), (1005, 739), 300, 286, 0.5, -0.2), # PKS logo -> plaid stripe
        shot('pink_pants_back', (742, 309), (610, 669), 380, 860, -0.6, 0.0),   # back pocket -> full back
        shot('pink_pants_front', (871, 863), (871, 845), 470, 560, 0.4, 0.0),   # front reveal
    ]),
    4: dict(name='04_PKS_sweatpants_black-gray', shots=[
        shot('gray_pants_front', (366, 573), (372, 599), 300, 268, -0.8, 0.0),
        shot('gray_pants_front', (494, 633), (526, 719), 300, 286, 0.5, -0.2),
        shot('gray_pants_back', (758, 320), (612, 715), 380, 860, -0.6, 0.0),
        shot('gray_pants_front', (370, 863), (370, 845), 480, 580, 0.4, 0.0),
    ]),
    5: dict(name='05_PKS_set_black-pink', shots=[
        shot('pink_set', (851, 94), (849, 118), 250, 224, -1.2, -0.4),      # hood lining
        shot('pink_set', (847, 332), (863, 562), 380, 380, 0.4, -0.2),      # chest logo + pocket -> waistband
        shot('pink_set', (915, 692), (915, 962), 400, 400, -0.3, 0.3),      # pants logo + stripes, tilt down
        shot('pink_set', (871, 642), (871, 594), 560, 760, 0.4, 0.0),       # full set reveal
    ]),
    6: dict(name='06_PKS_set_black-gray', shots=[
        shot('gray_set', (382, 92), (380, 116), 250, 224, -1.2, -0.4),
        shot('gray_set', (374, 330), (390, 560), 380, 380, 0.4, -0.2),
        shot('gray_set', (434, 690), (434, 960), 400, 400, -0.3, 0.3),
        shot('gray_set', (362, 640), (362, 592), 560, 760, 0.4, 0.0),
    ]),
}


def ease(t):
    t = min(max(t, 0.0), 1.0)
    return t * t * t * (t * (6 * t - 15) + 10)      # quintic smootherstep: no visible start/stop


# ---------------------------------------------------------------- scene preparation
def make_scene(plate):
    """Upscale a plate and bake a soft contact shadow under it. Returns premultiplied RGBA."""
    w, h = plate.size
    big = Image.new('RGBA', (w + 2 * MARGIN, h + 2 * MARGIN), (0, 0, 0, 0))
    big.paste(plate, (MARGIN, MARGIN))
    big = big.resize((big.width * UP, big.height * UP), Image.LANCZOS)
    a = np.asarray(big).astype(np.float32) / 255.0
    rgb, al = a[..., :3], a[..., 3:4]
    # shadow: light falls from the upper left, as in the original photograph
    sh = ndi.gaussian_filter(al[..., 0], 22 * UP)
    sh = ndi.shift(sh, (14 * UP, 9 * UP), order=1)
    sh = (0.55 * sh)[..., None]
    out_a = al + (1 - al) * sh
    out_rgb = rgb * al                                   # shadow colour is black, adds nothing
    return Image.fromarray((np.dstack([out_rgb, out_a]) * 255).round().astype(np.uint8), 'RGBA')


def backdrop():
    """Charcoal studio sweep: soft top-centre key, dark corners. Shared by all videos."""
    y, x = np.mgrid[0:OUT_H, 0:OUT_W].astype(np.float32)
    nx, ny = (x - OUT_W * 0.5) / OUT_W, (y - OUT_H * 0.42) / OUT_H
    r = np.sqrt((nx * 1.25) ** 2 + (ny * 0.95) ** 2)
    lift = np.exp(-(r / 0.42) ** 2)
    base = np.array([13, 13, 14], np.float32)
    key = np.array([34, 34, 37], np.float32)
    return base + lift[..., None] * key


BG = None
OFFSETS = {}
GRAIN = None


def init_worker():
    global BG, GRAIN
    BG = backdrop()
    rng = np.random.default_rng(7)
    GRAIN = rng.normal(0, 1.6, (OUT_H + 64, OUT_W + 64)).astype(np.float32)


def bg_frame(i):
    t = i / N
    y, x = np.ogrid[0:OUT_H, 0:OUT_W]
    # slow diagonal light sweep across the backdrop
    pos = -0.35 + 1.7 * t
    d = (x / OUT_W * 0.6 + y / OUT_H * 0.4) - pos
    sweep = 7.0 * np.exp(-(d / 0.16) ** 2)
    ox, oy = (i * 13) % 64, (i * 29) % 64
    g = GRAIN[oy:oy + OUT_H, ox:ox + OUT_W]
    return BG + (sweep + g)[..., None]


def camera(scene, s, u):
    """Sample the scene through the camera at progress u in [0,1] (eased)."""
    e = ease(u)
    ox0, oy0 = OFFSETS[s['plate']]
    cx = s['c0'][0] + (s['c1'][0] - s['c0'][0]) * e - ox0
    cy = s['c0'][1] + (s['c1'][1] - s['c0'][1]) * e - oy0
    W = s['w0'] * (s['w1'] / s['w0']) ** e              # geometric zoom feels linear to the eye
    rot = np.radians(s['r0'] + (s['r1'] - s['r0']) * e)
    k = (W * UP) / OUT_W                                  # scene px per output px
    cs, sn = np.cos(rot) * k, np.sin(rot) * k
    sx, sy = (cx + MARGIN) * UP, (cy + MARGIN) * UP
    ox, oy = OUT_W / 2, OUT_H / 2
    # output (x,y) -> scene: S + R*(p - O)*k
    a, b, d_, e_ = cs, -sn, sn, cs
    c = sx - a * ox - b * oy
    f = sy - d_ * ox - e_ * oy
    im = scene.transform((OUT_W, OUT_H), Image.AFFINE, (a, b, c, d_, e_, f), resample=Image.BICUBIC)
    arr = np.asarray(im).astype(np.float32)
    return arr[..., :3], arr[..., 3:4] / 255.0


def render_frame(scenes, spec, i):
    t = (i + 0.5) / FPS
    frame = bg_frame(i)
    # Transitions dip to the studio backdrop: the outgoing garment fades out over the first
    # half of the 0.5 s overlap, the next fades in over the second half. Two images of the
    # product are never superimposed, so no doubled / ghosted logos or plaid.
    for (t0, t1), s in zip(SLOTS, spec['shots']):
        if t0 - 1e-6 <= t <= t1 + 1e-6:
            op = 1.0
            if t0 > 0:
                op = min(op, ease((t - t0 - 0.25) / 0.25))
            if t1 < DUR:
                op = min(op, ease((t1 - 0.25 - t) / 0.25))
            if op <= 0:
                continue
            u = (t - t0) / (t1 - t0)
            rgb, al = camera(scenes[s['plate']], s, u)
            frame = frame * (1 - op * al) + op * rgb
    fade = min(1.0, ease(t / FADE_IN), ease((DUR - t) / FADE_OUT))
    frame = frame * fade
    return np.clip(frame + 0.5, 0, 255).astype(np.uint8)


def load_scenes(names, plate_dir):
    global OFFSETS
    with open(os.path.join(plate_dir, 'offsets.json')) as f:
        OFFSETS = json.load(f)
    return {n: make_scene(Image.open(os.path.join(plate_dir, n + '.png'))) for n in names}


def render_video(args):
    vid, plate_dir, out_dir = args
    init_worker()
    spec = VIDEOS[vid]
    scenes = load_scenes({s['plate'] for s in spec['shots']}, plate_dir)
    path = os.path.join(out_dir, spec['name'] + '.mp4')
    cmd = ['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24',
           '-s', f'{OUT_W}x{OUT_H}', '-r', str(FPS), '-i', '-',
           '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-profile:v', 'high', '-level', '4.2',
           '-pix_fmt', 'yuv420p', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709',
           '-movflags', '+faststart', '-g', str(FPS), path]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for i in range(N):
        p.stdin.write(render_frame(scenes, spec, i).tobytes())
    p.stdin.close()
    p.wait()
    return path


def stills(vid, plate_dir, out_path, times=(0.9, 1.8, 3.2, 4.2, 5.2, 6.4, 7.6, 9.3)):
    init_worker()
    spec = VIDEOS[vid]
    scenes = load_scenes({s['plate'] for s in spec['shots']}, plate_dir)
    tiles = [Image.fromarray(render_frame(scenes, spec, int(t * FPS))).resize((270, 480), Image.LANCZOS)
             for t in times]
    sheet = Image.new('RGB', (270 * len(tiles) + 6 * (len(tiles) - 1), 480), (255, 0, 255))
    for j, tl in enumerate(tiles):
        sheet.paste(tl, (j * 276, 0))
    sheet.save(out_path, quality=90)


if __name__ == '__main__':
    root = os.path.join(HERE, '..')
    plate_dir = os.path.join(root, 'build', 'plates')
    out_dir = os.path.join(root, 'videos')
    args = sys.argv[1:]
    if not os.path.isdir(plate_dir) or '--plates' in args:
        plates_mod.build(plate_dir)
    if '--stills' in args:
        for v in [int(a) for a in args if a.isdigit()] or VIDEOS:
            stills(v, plate_dir, os.path.join(root, 'build', f'stills_{v}.jpg'))
        sys.exit()
    os.makedirs(out_dir, exist_ok=True)
    vids = [int(a) for a in args if a.isdigit()] or sorted(VIDEOS)
    with Pool(min(4, len(vids))) as pool:
        for path in pool.imap_unordered(render_video, [(v, plate_dir, out_dir) for v in vids]):
            print('wrote', path)
