# Design system: Field Tag

All values live as tokens at the top of `theme/assets/base.css`. Components use tokens only.
Contrast figures are calculated, not judged by eye. The live table is `contrast-report.md`, regenerated with `npm run contrast`.

## 1. Three palette directions (presented at Stage A)

Emotional notes below are design hypotheses for this audience, not universal facts. No palette guarantees trust or conversions.

### A. Trail / Tunnel: ink and blossom

| Role | Hex |
| --- | --- |
| Background / surface | `#F3F0EA` / `#E6E2DA` |
| Text / muted | `#11110F` / `#5C5953` |
| Action / action text | `#11110F` / `#F3F0EA` |
| Accent (text-safe) / accent (large only) | `#A8325F` / `#E0558F` |
| Control border / focus | `#86827B` / `#A8325F` |
| Success / warning / error | `#2F6B3F` / `#8A5A00` / `#B3261E` |

- **Character:** editorial and high-contrast; the pink comes from the brand's own blossom graphic.
- **Contrast:**
  - Text 16.62 on background, 14.63 on surface.
  - Muted 6.14 / 5.40.
  - Action 16.62.
  - Accent text 5.62. Bright accent 3.15, so large text and decoration only.
  - Border 3.36. Focus 5.62.
  - Success 5.60, warning 5.21, error 5.75.
- **Similarity concern:** black and pink is common in streetwear. Distinctiveness would depend on photography.

### B. Field Tag: pine and orange (as first proposed)

| Role | Hex |
| --- | --- |
| Background / surface | `#F7F5F0` / `#ECE8E0` |
| Text / muted | `#1B1F1D` / `#545A56` |
| Action / action text | `#1F5640` / `#FFFFFF` |
| Accent text / accent fill (dark text on it) | `#B23F18` / `#E8643A` |
| Control border / focus | `#878C88` / `#B23F18` |
| Success / warning / error | `#2E6B3A` / `#8A5300` / `#B42318` |

- **Character:** practical, outdoorsy, product-first.
- **Contrast:**
  - Text 15.29 / 13.64. Muted 6.48 / 5.78.
  - Action 8.52. Accent text 5.33. Dark text on accent fill 5.01.
  - Border 3.14.
  - Success 5.88, warning 5.81, error 6.03.
- **Similarity concern:** green plus orange is a familiar outdoor-retail palette.

### C. Camera Roll: blush and hot pink

| Role | Hex |
| --- | --- |
| Background / surface | `#FFF7F9` / `#FCE4EC` |
| Text / muted | `#241A1F` / `#6A5560` |
| Action / action text | `#C2185B` / `#FFFFFF` |
| Accent | `#0E7470` |
| Control border / focus | `#A1838F` / `#0E7470` |
| Success / warning / error | `#2E7D32` / `#8D5A00` / `#B00020` |

- **Character:** playful and community-led.
- **Contrast:**
  - Text 16.03 / 14.04. Muted 6.47 / 5.66.
  - Action 5.87. Accent 5.31 on background, 4.65 on surface.
  - Border 3.24.
  - Success 4.86, warning 5.54, error 6.95.
- **Risk:** the error red sits close to the action pink, so errors always need an icon and text.

## 2. Implemented palette: B with brand blossom

The orange accent was replaced with Peak Side's own blossom pink. Pine is the trail, blossom is the town, and both appear in the actual photos and products.

| Token | Value | Used for |
| --- | --- | --- |
| `--color-background` | `#F7F5F0` | Page (paper) |
| `--color-surface` | `#ECE8E0` | Product grounds, fit-finder panel, restock box |
| `--color-surface-raised` | `#FFFFFF` | Inputs, size chips |
| `--color-text` | `#1B1F1D` | Text, links, sold-out badge |
| `--color-text-muted` | `#545A56` | Secondary text |
| `--color-action` / `-hover` / `-pressed` | `#1F5640` / `#163F2F` / `#0F2C20` | **Primary actions and selected states only** |
| `--color-action-text` | `#FFFFFF` | Text on pine |
| `--color-accent` | `#A8325F` | Numbered detail markers, section numbers, ridge line |
| `--color-accent-soft` | `#F6D3E0` | Fit notes, active detail row |
| `--color-on-accent` | `#FFFFFF` | Marker numbers and rings |
| `--color-border` | `#D8D3C9` | Decorative dividers |
| `--color-border-strong` | `#858A86` | Control boundaries |
| `--color-focus` | `#A8325F` | Focus rings on light backgrounds |
| `--color-inverse` / `-text` / `-muted` / `-border` | `#1B1F1D` / `#F7F5F0` / `#B8BDB9` / `#6B716D` | Footer, announcement bar |
| `--color-focus-inverse` | `#F6D3E0` | Focus rings in the footer |
| `--color-success` / `-bg` | `#2E6B3A` / `#E6F0E6` | In stock, confirmations |
| `--color-warning` / `-bg` | `#7A4A00` / `#FBF0DC` | Missing-content placeholders |
| `--color-error` / `-bg` | `#B42318` / `#FCEBE9` | Errors, invalid fields |

All 33 colour combinations the theme uses pass WCAG 2.2 AA. See `contrast-report.md` for each ratio.

### Directing attention

- **Primary action:** pine fill with white mono uppercase text (Add to bag, Shop the range, Check out). Pine is never used decoratively.
- **Secondary action:** ink outline on paper. **Ordinary links:** underlined text. Body text is never underlined, so it never looks clickable.
- **Blossom** marks things to explore (detail numbers) and small brand moments. It is never a button colour.
- **Status is never colour alone:**
  - Stock uses an icon plus "In stock" or "Sold out".
  - Errors use an icon, text and `aria-invalid`.
  - Sold-out sizes say "Sold out" as well as being struck through.
  - Selected swatches show a check mark.
- **Grayscale check:** a grayscale render of the home page was reviewed. Primary (solid dark), secondary (outline) and markers (white ring) all stay distinct.

### Text over imagery

There is no body text over photographs. Labels on photos (view and colour corners, TRAIL/TOWN, detail markers) sit on solid backings or carry a 2 px white ring, so their contrast doesn't depend on the photo crop.

## 3. Typography

| Role | Font | Notes |
| --- | --- | --- |
| Display / headings | Overpass Variable 800–900, uppercase, tight tracking | Road-sign heritage that reads like a trail marker |
| Body | Overpass 400, 16–17 px, line-height 1.55 | |
| Labels, prices, specs | Overpass Mono 400/600, uppercase, +0.06em | Reads like a garment tag |

Licence: SIL Open Font License 1.1, self-hosted in `theme/assets` with licence files included.
Scale tokens run from `--text-2xs` (11 px) to `--text-display` (fluid, 52–116 px). On desktop the hero headline is capped at 6.3vw so it fits its column.

## 4. Layout, spacing and shape

- **Grid:** max content width 1360 px. Side gutters are 16 px on mobile, 24 px on tablet and 40 px on desktop. Two-column splits are used for hero, product, story and FAQ.
- **Spacing:** 4 px base scale (`--space-1` to `--space-9`). Section rhythm is fluid at 56–104 px.
- **Image ratios:**
  - Product frames 4:5 on mobile, 1:1 on desktop (the studio images are square).
  - Lookbook 4:5, story 3:2.
  - Non-square product photos (floor flat-lays) fill their frame instead of floating in it.
- **Shape:** square-cornered frames, 2 px radius on controls, pill swatches and chips only. One shadow, used only on drawers.
- **Signature details:**
  - Hang-tag chips (eyelet dot plus mono text).
  - Numbered blossom markers.
  - A hand-drawn ridge line, the only ornament.

## 5. Motion

| Token | Value | Use |
| --- | --- | --- |
| `--dur-1` | 120 ms | Press, hover colour |
| `--dur-2` | 220 ms | Link underline, marker hover |
| `--dur-3` | 320 ms | Slide fade, drawers |
| `--ease-out` | `cubic-bezier(0.2, 0.7, 0.2, 1)` | Everything |

- **Reduced motion:** all durations are 0 when `prefers-reduced-motion: reduce` is set or when the footer toggle is on. The JavaScript checks the same setting.
- **No scroll hijacking:** no forced intros, no parallax, no autoplay, no custom cursor, nothing that moves continuously.

## 6. Dark mode

Not added. The products are shot on light grounds and the brand reads as daylight and outdoors. A dark theme would need its own testing pass, so it isn't included.
