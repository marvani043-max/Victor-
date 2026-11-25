# PKS winter campaign: six Instagram Reels

`videos/` holds six separate vertical videos (1080x1920, 9:16, 30 fps, 10 s, H.264, no audio):

| File | Product |
| --- | --- |
| `01_PKS_hoodie_black-pink.mp4` | Black hoodie, pink plaid |
| `02_PKS_hoodie_black-gray.mp4` | Black hoodie, gray plaid |
| `03_PKS_sweatpants_black-pink.mp4` | Black sweatpants, pink plaid (front and back) |
| `04_PKS_sweatpants_black-gray.mp4` | Black sweatpants, gray plaid (front and back) |
| `05_PKS_set_black-pink.mp4` | Pink plaid hoodie + matching pants |
| `06_PKS_set_black-gray.mp4` | Gray plaid hoodie + matching pants |

## How they are made

The videos are built from the product photographs in `source/`. Nothing is generated or redrawn, so the
garments, plaid, logos and stitching are exactly as photographed.

1. `scripts/plates.py` cuts each garment out of the photos (`scripts/masks.py` holds the hand-traced
   outlines). Only an alpha mask is computed; garment pixels are copied unchanged.
2. `scripts/render.py` moves a virtual camera over each cut-out on a charcoal studio backdrop:
   slow push-ins, pans and a pull-back reveal, with transitions that dip to the backdrop.
   Grading, vignette, grain and the light sweep touch the backdrop only.

All six share one shot grid (detail, detail, detail, reveal; same timing, light and backdrop).

```bash
pip install numpy pillow scipy        # plus ffmpeg with libx264
python3 scripts/render.py --plates    # all six -> videos/
python3 scripts/render.py 3 --stills  # preview stills for one video -> build/
```

Close-ups enlarge the source photos about 4x, so they are softer than the full-product shots.
Higher-resolution photos dropped into `source/` (same framing) give sharper close-ups.
