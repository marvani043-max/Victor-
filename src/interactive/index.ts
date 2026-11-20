/*
 * Peak Side interactive elements, framework-free so the Next.js site and the
 * single-file Claude preview share one implementation.
 *
 *   <ps-spin front back label word>   drag-to-spin 360° garment viewer
 *   <ps-showcase>                     "Spin the drop" picker + viewer (JSON child)
 *   <ps-fit>                          "Trail or Tunnel?" fit finder quiz (JSON child)
 *   <ps-petals>                       cherry-blossom petals over the parent section
 *   [data-tilt]                       cards that tilt toward the cursor
 *
 * Every element respects prefers-reduced-motion and pauses when off-screen.
 */

const reduced = () => typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
const mod = (n: number, m: number) => ((n % m) + m) % m;
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
function readJSON<T>(el: HTMLElement): T | null {
  const s = el.querySelector('script[type="application/json"]');
  if (!s?.textContent) return null;
  try {
    return JSON.parse(s.textContent) as T;
  } catch {
    return null;
  }
}

const TOKENS = `:host{--ink:#11110F;--bone:#F3F0EA;--stone:#E6E2DA;--granite:#6F6C66;--sakura:#F2A3C4;--bloom:#E0558F;--ease:cubic-bezier(.22,1,.36,1)}`;
const DISPLAY = `font-variation-settings:"wdth" 62;font-weight:800;text-transform:uppercase;line-height:.86;letter-spacing:-.01em;`;
const LABEL = `font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:11px;font-weight:400;text-transform:uppercase;letter-spacing:.14em;`;
const ARROW = `<svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true"><path d="M1 8h13M9 3l5 5-5 5" stroke="currentColor" stroke-width="1.5"/></svg>`;
const ARROW_L = `<svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden="true"><path d="M15 8H2M7 3L2 8l5 5" stroke="currentColor" stroke-width="1.5"/></svg>`;

/* ------------------------------------------------------------------ */
/* <ps-spin>                                                           */
/* ------------------------------------------------------------------ */

const SPIN_CSS = `${TOKENS}
:host{display:block;position:relative;width:100%;height:100%;min-height:280px;container-type:size}
.stage{position:absolute;inset:0;overflow:hidden;background:radial-gradient(120% 95% at 50% 36%,#F4F1EB 0%,var(--stone) 52%,#D9D3C8 100%);cursor:grab;touch-action:pan-y;user-select:none;-webkit-user-select:none;outline:none;perspective:1500px}
.stage:focus-visible{box-shadow:inset 0 0 0 2px var(--bloom)}
.stage.dragging{cursor:grabbing}
.word{position:absolute;left:50%;top:43%;white-space:nowrap;font-size:min(34cqw,46cqh);${DISPLAY}color:transparent;-webkit-text-stroke:1.5px rgba(17,17,15,.12);pointer-events:none;will-change:transform}
.floor{position:absolute;left:22%;right:22%;bottom:15.5%;height:6%;border-radius:50%;background:radial-gradient(closest-side,rgba(17,17,15,.30),rgba(17,17,15,0));will-change:transform}
.spinner{position:absolute;inset:7% 9% 19%;transform-style:preserve-3d;will-change:transform}
.face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden}
.face img{width:100%;height:100%;object-fit:contain;display:block;pointer-events:none;-webkit-user-drag:none;filter:drop-shadow(0 14px 18px rgba(17,17,15,.14))}
.shade{position:absolute;inset:0;pointer-events:none}
.back{transform:rotateY(180deg)}
.tag{position:absolute;left:12px;top:12px;display:flex;gap:8px;align-items:center;${LABEL}color:var(--ink)}
.tag b{background:var(--ink);color:var(--bone);padding:4px 7px;font-weight:500}
.bar{position:absolute;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px}
.bar button{${LABEL}background:rgba(243,240,234,.6);border:1px solid rgba(17,17,15,.22);color:var(--ink);padding:10px 14px;cursor:pointer;transition:background .25s,color .25s,border-color .25s}
.bar button:hover,.bar button[aria-pressed="true"]{background:var(--ink);color:var(--bone);border-color:var(--ink)}
.bar button:focus-visible{outline:2px solid var(--bloom);outline-offset:2px}
.read{display:flex;align-items:center;gap:8px;${LABEL}color:var(--ink);font-variant-numeric:tabular-nums}
.dial{position:relative;width:24px;height:24px;border-radius:50%;border:1px solid rgba(17,17,15,.35)}
.dial i{position:absolute;left:50%;top:50%;width:6px;height:6px;margin:-3px;border-radius:50%;background:var(--bloom)}
.hint{position:absolute;left:50%;bottom:64px;display:flex;gap:8px;align-items:center;${LABEL}background:rgba(17,17,15,.88);color:var(--bone);padding:9px 13px;pointer-events:none;transform:translateX(-50%);transition:opacity .5s var(--ease),transform .5s var(--ease)}
.hint svg{animation:nudge 1.6s ease-in-out infinite}
.hint.gone{opacity:0;transform:translate(-50%,8px)}
@keyframes nudge{0%,100%{transform:translateX(-3px)}50%{transform:translateX(3px)}}
@media (prefers-reduced-motion:reduce){.hint svg{animation:none}}
`;

class PsSpin extends HTMLElement {
  static observedAttributes = ["front", "back", "word", "label"];
  private shadow?: ShadowRoot;
  private stage!: HTMLDivElement;
  private spinner!: HTMLDivElement;
  private floor!: HTMLDivElement;
  private word!: HTMLDivElement;
  private imgs!: HTMLImageElement[];
  private shades!: HTMLDivElement[];
  private deg!: HTMLSpanElement;
  private dot!: HTMLElement;
  private btns!: HTMLButtonElement[];
  private hint!: HTMLDivElement;
  private angle = 0;
  private target: number | null = null;
  private vel = 0;
  private dragging = false;
  private startX = 0;
  private startAngle = 0;
  private lastX = 0;
  private lastT = 0;
  private lastInteract = 0;
  private visible = false;
  private hovering = false;
  private autoplaying = false;
  private raf = 0;
  private prevT = 0;
  private io?: IntersectionObserver;
  private lastAria = -1;

  connectedCallback() {
    if (!this.shadow) this.build();
    this.io = new IntersectionObserver(
      ([e]) => {
        this.visible = e.isIntersecting;
        if (this.visible) this.start();
      },
      { threshold: 0.1 }
    );
    this.io.observe(this);
    this.sync(false);
    this.render();
  }

  disconnectedCallback() {
    this.io?.disconnect();
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  attributeChangedCallback(name: string) {
    if (this.shadow) this.sync(name === "front" && this.isConnected);
  }

  private get autoplay() {
    return !this.hasAttribute("no-autoplay");
  }

  private build() {
    this.shadow = this.attachShadow({ mode: "open" });
    this.shadow.innerHTML = `<style>${SPIN_CSS}</style>
<div class="stage" tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="359" aria-valuenow="0">
  <div class="word" aria-hidden="true"></div>
  <div class="floor" aria-hidden="true"></div>
  <div class="spinner">
    <div class="face front"><img alt="" draggable="false" decoding="async" loading="lazy"><div class="shade"></div></div>
    <div class="face back"><img alt="" draggable="false" decoding="async" loading="lazy"><div class="shade"></div></div>
  </div>
  <div class="tag" aria-hidden="true"><b>360°</b><span class="lbl"></span></div>
  <div class="hint" aria-hidden="true"><svg viewBox="0 0 24 12" width="22" height="11" fill="none"><path d="M5 1L1 6l4 5M19 1l4 5-4 5M1 6h22" stroke="currentColor" stroke-width="1.4"/></svg>Drag to spin</div>
  <div class="bar">
    <button type="button" data-go="0">Front</button>
    <div class="read" aria-hidden="true"><span class="dial"><i></i></span><span class="deg">000°</span></div>
    <button type="button" data-go="180">Back</button>
  </div>
</div>`;
    const $ = <T extends Element>(s: string) => this.shadow!.querySelector(s) as T;
    this.stage = $(".stage");
    this.spinner = $(".spinner");
    this.floor = $(".floor");
    this.word = $(".word");
    this.imgs = Array.from(this.shadow.querySelectorAll(".face img"));
    this.shades = Array.from(this.shadow.querySelectorAll(".shade"));
    this.deg = $(".deg");
    this.dot = $(".dial i");
    this.btns = Array.from(this.shadow.querySelectorAll(".bar button"));
    this.hint = $(".hint");

    const s = this.stage;
    s.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || (e.target as Element).closest("button")) return;
      this.dragging = true;
      this.target = null;
      this.vel = 0;
      this.startX = this.lastX = e.clientX;
      this.startAngle = this.angle;
      this.lastT = e.timeStamp;
      try {
        s.setPointerCapture(e.pointerId);
      } catch {
        /* capture is optional */
      }
      s.classList.add("dragging");
      this.touch();
    });
    s.addEventListener("pointermove", (e) => {
      if (!this.dragging) return;
      const k = 320 / Math.max(260, s.clientWidth);
      this.angle = this.startAngle + (e.clientX - this.startX) * k;
      const dt = Math.max(1, e.timeStamp - this.lastT);
      this.vel = (e.clientX - this.lastX) * k * (16.7 / dt);
      this.lastX = e.clientX;
      this.lastT = e.timeStamp;
    });
    const end = (e: PointerEvent) => {
      if (!this.dragging) return;
      this.dragging = false;
      s.classList.remove("dragging");
      if (reduced() || e.timeStamp - this.lastT > 90 || Math.abs(this.vel) < 0.35) {
        this.vel = 0;
        this.settle();
      } else this.vel = clamp(this.vel, -28, 28);
      this.touch();
    };
    s.addEventListener("pointerup", end);
    s.addEventListener("pointercancel", end);
    s.addEventListener("lostpointercapture", end);
    s.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "mouse") this.hovering = true;
    });
    s.addEventListener("pointerleave", () => {
      this.hovering = false;
      this.start();
    });
    s.addEventListener("dblclick", () => {
      this.flip();
      this.touch();
    });
    s.addEventListener("keydown", (e) => {
      const cur = this.target ?? this.angle;
      if (e.key === "ArrowRight" || e.key === "ArrowUp") this.target = cur + 20;
      else if (e.key === "ArrowLeft" || e.key === "ArrowDown") this.target = cur - 20;
      else if (e.key === "Home") this.toNearest(0);
      else if (e.key === "End") this.toNearest(180);
      else if (e.key === "Enter" || e.key === " ") this.flip();
      else return;
      e.preventDefault();
      this.touch();
    });
    this.btns.forEach((b) =>
      b.addEventListener("click", () => {
        this.toNearest(Number(b.dataset.go));
        this.touch();
      })
    );
  }

  private sync(spinIn: boolean) {
    const front = this.getAttribute("front") || "";
    const back = this.getAttribute("back") || front;
    const label = this.getAttribute("label") || "Garment";
    const urls = [front, back];
    this.imgs.forEach((img, i) => {
      if (img.getAttribute("src") !== urls[i]) img.src = urls[i];
    });
    this.shades.forEach((sh, i) => {
      const m = `url("${urls[i]}") center / contain no-repeat`;
      sh.style.setProperty("-webkit-mask", m);
      sh.style.setProperty("mask", m);
    });
    this.word.textContent = this.getAttribute("word") || "Peak Side";
    (this.shadow!.querySelector(".lbl") as HTMLElement).textContent = this.getAttribute("word") || "";
    this.stage.setAttribute("aria-label", `360 degree view of ${label}. Drag, or use the arrow keys, to turn it.`);
    if (spinIn && !reduced()) {
      // Whirl the new garment in from behind.
      this.vel = 0;
      this.angle = mod(this.angle, 360) - 540;
      this.target = 0;
      this.lastInteract = performance.now();
      this.start();
    }
  }

  private touch() {
    this.lastInteract = performance.now();
    this.hint.classList.add("gone");
    this.start();
  }

  private toNearest(base: number) {
    const cur = this.target ?? this.angle;
    const m = mod(cur - base, 360);
    this.vel = 0;
    this.target = cur - m + (m > 180 ? 360 : 0);
  }

  private flip() {
    const cur = this.target ?? this.angle;
    this.vel = 0;
    this.target = Math.round(cur / 180) * 180 + 180;
  }

  /** Avoid resting edge-on: snap to front or back when the garment stops side-on. */
  private settle() {
    const m = mod(this.angle, 180);
    if (m > 50 && m < 130) this.target = this.angle - m + (m < 90 ? 0 : 180);
  }

  private start() {
    if (!this.raf && this.isConnected && this.visible) {
      this.prevT = performance.now();
      this.raf = requestAnimationFrame(this.tick);
    }
  }

  private tick = (t: number) => {
    const dt = Math.min(64, t - this.prevT);
    const f = dt / 16.7;
    this.prevT = t;
    let moving = true;
    this.autoplaying = false;
    if (this.dragging) {
      /* angle follows the pointer */
    } else if (this.target !== null) {
      const d = this.target - this.angle;
      if (Math.abs(d) < 0.15) {
        this.angle = this.target;
        this.target = null;
      } else this.angle += d * Math.min(1, (reduced() ? 0.5 : 0.13) * f);
    } else if (Math.abs(this.vel) > 0.04) {
      this.angle += this.vel * f;
      this.vel *= Math.pow(0.945, f);
      if (Math.abs(this.vel) <= 0.04) {
        this.vel = 0;
        this.settle();
      }
    } else if (this.autoplay && !this.hovering && !reduced() && !document.hidden && t - this.lastInteract > 2600) {
      this.angle += dt * 0.028;
      this.autoplaying = true;
    } else moving = false;
    this.render();
    const keepGoing = this.visible && (moving || (this.autoplay && !reduced()));
    this.raf = keepGoing ? requestAnimationFrame(this.tick) : 0;
  };

  private render() {
    if (!this.spinner) return;
    const a = this.angle;
    const r = (a * Math.PI) / 180;
    const s = Math.sin(r);
    const c = Math.cos(r);
    this.spinner.style.transform = `rotateY(${a.toFixed(2)}deg)`;
    this.floor.style.transform = `scaleX(${(0.35 + 0.65 * Math.abs(c)).toFixed(3)})`;
    this.word.style.transform = `translate(calc(-50% + ${(-s * 7).toFixed(2)}%), -50%)`;
    const p = 50 + s * 70;
    const dark = (Math.abs(s) * 0.5).toFixed(3);
    const sheen = `linear-gradient(100deg,rgba(255,255,255,0) ${p - 14}%,rgba(255,255,255,.17) ${p}%,rgba(255,255,255,0) ${p + 14}%)`;
    this.shades[0].style.background = `linear-gradient(${s > 0 ? 90 : 270}deg,rgba(17,17,15,${dark}),rgba(17,17,15,0) 65%),${sheen}`;
    this.shades[1].style.background = `linear-gradient(${s > 0 ? 270 : 90}deg,rgba(17,17,15,${dark}),rgba(17,17,15,0) 65%),${sheen}`;
    const deg = Math.round(mod(a, 360)) % 360;
    this.deg.textContent = `${String(deg).padStart(3, "0")}°`;
    this.dot.style.transform = `rotate(${deg}deg) translateY(-8px)`;
    const view = deg <= 45 || deg >= 315 ? "front" : deg >= 135 && deg <= 225 ? "back" : "side";
    this.btns[0].setAttribute("aria-pressed", String(view === "front"));
    this.btns[1].setAttribute("aria-pressed", String(view === "back"));
    // Keep screen readers quiet during the idle auto-spin; announce user-driven changes.
    if (!this.autoplaying && Math.abs(deg - this.lastAria) >= 10) {
      this.lastAria = deg;
      this.stage.setAttribute("aria-valuenow", String(deg));
      this.stage.setAttribute("aria-valuetext", `${view} view, ${deg} degrees`);
    }
  }
}

/* ------------------------------------------------------------------ */
/* <ps-showcase>                                                        */
/* ------------------------------------------------------------------ */

type ShowItem = { name: string; price: string; colour: string; href: string; front: string; back: string; thumb: string; word: string };

const SHOW_CSS = `${TOKENS}
:host{display:block;color:var(--ink)}
.wrap{display:grid;grid-template-columns:minmax(0,1fr);gap:28px;align-items:center}
@media (min-width:1024px){.wrap{grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:64px}.viewer{order:2}}
.viewer{position:relative;width:100%;aspect-ratio:1/1;max-height:min(78vh,760px)}
ps-spin{position:absolute;inset:0;height:100%}
.eyebrow{${LABEL}color:var(--granite);margin:0}
h2{${DISPLAY}font-size:clamp(64px,11vw,150px);margin:14px 0 0;text-wrap:balance}
h2 em{font-style:normal;color:var(--bloom)}
.lead{font-size:17px;line-height:1.6;color:rgba(17,17,15,.75);max-width:30em;margin:18px 0 0}
.cur{margin-top:30px;border-top:1px solid rgba(17,17,15,.15);padding-top:18px;display:flex;justify-content:space-between;align-items:flex-end;gap:16px}
.cname{font-size:20px;font-weight:600;line-height:1.2;margin:0}
.ccol{${LABEL}color:var(--granite);margin:8px 0 0}
.cprice{font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:18px;margin:0;white-space:nowrap}
.actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px;align-items:center}
.cta{${LABEL}font-size:12px;background:var(--ink);color:var(--bone);padding:16px 22px;text-decoration:none;display:inline-flex;gap:12px;align-items:center;transition:background .3s}
.cta:hover{background:var(--bloom)}
.cta:focus-visible,.nav button:focus-visible,.thumbs button:focus-visible{outline:2px solid var(--bloom);outline-offset:3px}
.nav{display:flex;align-items:center;gap:6px;margin-left:auto}
.count{${LABEL}color:var(--granite);margin-right:8px;font-variant-numeric:tabular-nums}
.nav button{width:48px;height:48px;border:1px solid rgba(17,17,15,.25);background:transparent;color:var(--ink);display:grid;place-items:center;cursor:pointer;transition:background .25s,color .25s}
.nav button:hover{background:var(--ink);color:var(--bone)}
.thumbs{display:flex;gap:8px;overflow-x:auto;margin-top:22px;padding:2px 2px 6px;scrollbar-width:none;scroll-snap-type:x mandatory}
.thumbs::-webkit-scrollbar{display:none}
.thumbs button{flex:0 0 auto;width:74px;height:74px;background:var(--stone);border:1px solid transparent;padding:7px;cursor:pointer;scroll-snap-align:start;transition:border-color .25s,transform .35s var(--ease)}
.thumbs button:hover{transform:translateY(-3px)}
.thumbs button[aria-pressed="true"]{border-color:var(--ink)}
.thumbs img{width:100%;height:100%;object-fit:contain;display:block}
.swap{animation:swap .5s var(--ease)}
@keyframes swap{from{opacity:.2;transform:translateY(6px)}to{opacity:1;transform:none}}
`;

class PsShowcase extends HTMLElement {
  connectedCallback() {
    if (this.shadowRoot) return;
    const data = readJSON<{ items: ShowItem[] }>(this);
    if (!data?.items?.length) return;
    const items = data.items;
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `<style>${SHOW_CSS}</style>
<div class="wrap">
  <div class="viewer"><ps-spin></ps-spin></div>
  <div class="info">
    <p class="eyebrow">360° · Grab it and turn it</p>
    <h2>Spin <em>the drop.</em></h2>
    <p class="lead">Front, back and every angle in between before you buy. Drag the garment to spin it, or flick through the range.</p>
    <div class="cur" aria-live="polite"><div><p class="cname"></p><p class="ccol"></p></div><p class="cprice"></p></div>
    <div class="actions">
      <a class="cta" href="#">Shop this piece ${ARROW}</a>
      <div class="nav"><span class="count"></span>
        <button type="button" class="prev" aria-label="Previous piece">${ARROW_L}</button>
        <button type="button" class="next" aria-label="Next piece">${ARROW}</button>
      </div>
    </div>
    <div class="thumbs" role="group" aria-label="Choose a piece to spin">
      ${items.map((it, i) => `<button type="button" data-i="${i}" aria-label="${esc(`${it.name}, ${it.colour}`)}"><img src="${esc(it.thumb)}" alt="" loading="lazy" decoding="async"></button>`).join("")}
    </div>
  </div>
</div>`;
    const spin = root.querySelector("ps-spin") as HTMLElement;
    const $ = (s: string) => root.querySelector(s) as HTMLElement;
    const thumbs = Array.from(root.querySelectorAll<HTMLButtonElement>(".thumbs button"));
    const strip = $(".thumbs");
    let cur = -1;
    const select = (i: number) => {
      i = mod(i, items.length);
      if (i === cur) return;
      cur = i;
      const it = items[i];
      spin.setAttribute("label", `${it.name} in ${it.colour}`);
      spin.setAttribute("word", it.word);
      spin.setAttribute("back", it.back);
      spin.setAttribute("front", it.front);
      $(".cname").textContent = it.name;
      $(".ccol").textContent = it.colour;
      $(".cprice").textContent = it.price;
      (root.querySelector(".cta") as HTMLAnchorElement).href = it.href;
      $(".count").textContent = `${String(i + 1).padStart(2, "0")} / ${String(items.length).padStart(2, "0")}`;
      const box = $(".cur");
      box.classList.remove("swap");
      void box.offsetWidth;
      box.classList.add("swap");
      thumbs.forEach((b, j) => b.setAttribute("aria-pressed", String(j === i)));
      const t = thumbs[i];
      strip.scrollTo({ left: t.offsetLeft - strip.clientWidth / 2 + t.clientWidth / 2, behavior: reduced() ? "auto" : "smooth" });
    };
    thumbs.forEach((b) => b.addEventListener("click", () => select(Number(b.dataset.i))));
    $(".prev").addEventListener("click", () => select(cur - 1));
    $(".next").addEventListener("click", () => select(cur + 1));
    select(0);
    // Warm the cache so switching pieces is instant.
    const warm = () => items.forEach((it) => [it.front, it.back].forEach((u) => (new Image().src = u)));
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => void };
    if (w.requestIdleCallback) w.requestIdleCallback(warm);
    else setTimeout(warm, 1500);
  }
}

/* ------------------------------------------------------------------ */
/* <ps-fit>                                                             */
/* ------------------------------------------------------------------ */

type Fit = "oversized" | "boxy" | "cropped" | "classic";
type FitProduct = {
  name: string;
  price: string;
  href: string;
  img: string;
  cut: boolean;
  warmth: "cold" | "warm";
  fit: Fit;
  places: ("trail" | "tunnel")[];
  bestSeller: boolean;
};
type FitData = { trail: string; tunnel: string; products: FitProduct[] };
type Answer = Record<"place" | "weather" | "fit", string>;

const QUESTIONS: { key: keyof Answer; title: string; options: { v: string; label: string; note?: string; img?: "trail" | "tunnel" }[] }[] = [
  {
    key: "place",
    title: "Where's the day taking you?",
    options: [
      { v: "trail", label: "The trail", note: "Granite, spray, switchbacks", img: "trail" },
      { v: "tunnel", label: "The tunnel", note: "Graffiti walls, the whole crew", img: "tunnel" },
      { v: "both", label: "Bit of both", note: "Start up high, end in town" },
    ],
  },
  {
    key: "weather",
    title: "What's the sky doing?",
    options: [
      { v: "cold", label: "Snow on the ground", note: "Time to layer up" },
      { v: "warm", label: "Sun's out", note: "Keep it light" },
      { v: "any", label: "Can't call it", note: "Ready for either" },
    ],
  },
  {
    key: "fit",
    title: "How do you like it to fit?",
    options: [
      { v: "oversized", label: "Big and oversized" },
      { v: "boxy", label: "Boxy and straight" },
      { v: "cropped", label: "Cropped" },
      { v: "classic", label: "Classic" },
    ],
  },
];
const FIT_WORD: Record<Fit, string> = { oversized: "oversized", boxy: "boxy", cropped: "cropped", classic: "classic-fit" };

function score(p: FitProduct, a: Answer) {
  let s = 0;
  if (a.weather === "any") s += 1;
  else if (p.warmth === a.weather) s += 4;
  if (p.fit === a.fit) s += 3;
  else if ((p.fit === "oversized" && a.fit === "boxy") || (p.fit === "boxy" && a.fit === "oversized")) s += 1;
  if (a.place === "both") s += 1;
  else if (p.places.includes(a.place as "trail" | "tunnel")) s += 2;
  if (p.bestSeller) s += 0.5;
  return s;
}

function reason(p: FitProduct, a: Answer) {
  const bits: string[] = [];
  if (a.weather === "cold" && p.warmth === "cold") bits.push("Warm enough for snow days");
  if (a.weather === "warm" && p.warmth === "warm") bits.push("Light enough for sunny days");
  if (p.fit === a.fit) bits.push(bits.length ? `with the ${FIT_WORD[p.fit]} cut you asked for` : `The ${FIT_WORD[p.fit]} cut you asked for`);
  if (a.place !== "both" && p.places.includes(a.place as "trail" | "tunnel"))
    bits.push(a.place === "trail" ? "and right at home on the trail" : "and right at home in the tunnel");
  let text = bits.length ? bits.join(" ").replace(/^and /, "") + "." : "A versatile piece that works up high and in town.";
  text = text.charAt(0).toUpperCase() + text.slice(1);
  if (p.fit !== a.fit) text = `Nothing ${FIT_WORD[a.fit as Fit]} matches all of that yet, so here's the closest piece. ${text}`;
  return text;
}

const FIT_CSS = `${TOKENS}
:host{display:block;color:var(--ink)}
.panel{animation:in .55s var(--ease)}
@keyframes in{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.top{display:flex;align-items:center;gap:16px}
.step{${LABEL}color:var(--granite);white-space:nowrap}
.prog{flex:1;height:2px;background:rgba(17,17,15,.12);position:relative;overflow:hidden}
.prog i{position:absolute;inset:0 auto 0 0;background:var(--bloom);transition:width .6s var(--ease)}
h3{${DISPLAY}font-size:clamp(44px,7vw,92px);margin:26px 0 0;text-wrap:balance}
.opts{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr));gap:10px;margin-top:28px}
.opt{position:relative;text-align:left;border:1px solid rgba(17,17,15,.18);background:var(--bone);color:var(--ink);padding:20px;min-height:132px;cursor:pointer;display:flex;flex-direction:column;justify-content:flex-end;gap:6px;overflow:hidden;font:inherit;transition:border-color .3s,transform .45s var(--ease),background .3s}
.opt:hover{border-color:var(--ink);transform:translateY(-3px)}
.opt:focus-visible{outline:2px solid var(--bloom);outline-offset:3px}
.opt .l{${DISPLAY}font-size:clamp(30px,3.6vw,44px);position:relative}
.opt .n{${LABEL}color:var(--granite);position:relative}
.opt.pic{min-height:220px;color:var(--bone);border-color:transparent;background:#1C1C1A}
.opt.pic img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;transition:transform 1.2s var(--ease)}
.opt.pic:hover img{transform:scale(1.06)}
.opt.pic::after{content:"";position:absolute;inset:0;background:linear-gradient(to top,rgba(17,17,15,.85),rgba(17,17,15,0) 65%)}
.opt.pic .l,.opt.pic .n{z-index:1}.opt.pic .n{color:rgba(243,240,234,.75)}
.back{${LABEL}margin-top:22px;background:none;border:0;color:var(--granite);cursor:pointer;display:inline-flex;gap:8px;align-items:center;padding:8px 0}
.back:hover{color:var(--ink)}
.res{display:grid;grid-template-columns:minmax(0,1fr);gap:28px;align-items:center;margin-top:26px}
@media (min-width:860px){.res{grid-template-columns:minmax(0,5fr) minmax(0,6fr);gap:48px}}
.pic-main{position:relative;aspect-ratio:4/5;background:radial-gradient(120% 95% at 50% 36%,#F4F1EB 0%,var(--stone) 55%,#D9D3C8 100%);overflow:hidden}
.pic-main img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;animation:pop .8s var(--ease)}
.pic-main.cut img{object-fit:contain;padding:10%;box-sizing:border-box;filter:drop-shadow(0 18px 22px rgba(17,17,15,.18))}
@keyframes pop{from{opacity:0;transform:scale(.9) rotate(-4deg)}to{opacity:1;transform:none}}
.eyebrow{${LABEL}color:var(--bloom);margin:0}
.rname{${DISPLAY}font-size:clamp(44px,6vw,80px);margin:12px 0 0}
.rprice{font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:18px;margin:14px 0 0}
.why{font-size:17px;line-height:1.6;color:rgba(17,17,15,.78);max-width:32em;margin:14px 0 0}
.acts{display:flex;flex-wrap:wrap;gap:10px;margin-top:22px}
.cta{${LABEL}font-size:12px;background:var(--ink);color:var(--bone);padding:16px 22px;text-decoration:none;display:inline-flex;gap:12px;align-items:center;transition:background .3s}
.cta:hover{background:var(--bloom)}
.again{${LABEL}font-size:12px;background:transparent;color:var(--ink);border:1px solid var(--ink);padding:16px 22px;cursor:pointer;transition:background .3s,color .3s}
.again:hover{background:var(--ink);color:var(--bone)}
.cta:focus-visible,.again:focus-visible,.also a:focus-visible{outline:2px solid var(--bloom);outline-offset:3px}
.also-l{${LABEL}color:var(--granite);margin:30px 0 0}
.also{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:10px}
.also a{display:flex;gap:12px;align-items:center;text-decoration:none;color:var(--ink);border:1px solid rgba(17,17,15,.12);padding:8px;transition:border-color .3s}
.also a:hover{border-color:var(--ink)}
.also .t{width:56px;height:56px;flex:0 0 auto;background:var(--stone);display:grid;place-items:center;overflow:hidden}
.also .t img{width:100%;height:100%;object-fit:cover}.also .t.cut img{object-fit:contain;padding:5px;box-sizing:border-box}
.also b{display:block;font-size:13px;font-weight:600;line-height:1.25}
.also .pr{display:block;margin-top:2px;font-family:"IBM Plex Mono",ui-monospace,monospace;font-size:12px;color:var(--granite)}
`;

class PsFit extends HTMLElement {
  private root?: ShadowRoot;
  private data!: FitData;
  private step = 0;
  private answers: Partial<Answer> = {};

  connectedCallback() {
    if (this.root) return;
    const data = readJSON<FitData>(this);
    if (!data?.products?.length) return;
    this.data = data;
    this.root = this.attachShadow({ mode: "open" });
    this.render();
  }

  private render() {
    const root = this.root!;
    if (this.step < QUESTIONS.length) {
      const q = QUESTIONS[this.step];
      root.innerHTML = `<style>${FIT_CSS}</style>
<div class="panel">
  <div class="top"><span class="step">Question ${this.step + 1} of ${QUESTIONS.length}</span><div class="prog"><i style="width:${(this.step / QUESTIONS.length) * 100}%"></i></div></div>
  <h3>${esc(q.title)}</h3>
  <div class="opts" role="group" aria-label="${esc(q.title)}">
    ${q.options
      .map(
        (o) => `<button type="button" class="opt${o.img ? " pic" : ""}" data-v="${o.v}">
      ${o.img ? `<img src="${esc(this.data[o.img])}" alt="" loading="lazy" decoding="async">` : ""}
      <span class="l">${esc(o.label)}</span>${o.note ? `<span class="n">${esc(o.note)}</span>` : ""}</button>`
      )
      .join("")}
  </div>
  ${this.step ? `<button type="button" class="back">${ARROW_L} Back</button>` : ""}
</div>`;
      // Two frames so the width change animates from the previous step.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          const bar = root.querySelector(".prog i") as HTMLElement | null;
          if (bar) bar.style.width = `${((this.step + 1) / QUESTIONS.length) * 100}%`;
        })
      );
      root.querySelectorAll<HTMLButtonElement>(".opt").forEach((b) =>
        b.addEventListener("click", () => {
          this.answers[q.key] = b.dataset.v!;
          this.step++;
          this.render();
          (root.querySelector(".opt, .cta") as HTMLElement | null)?.focus({ preventScroll: true });
        })
      );
      root.querySelector(".back")?.addEventListener("click", () => {
        this.step--;
        this.render();
      });
      return;
    }
    const a = this.answers as Answer;
    const ranked = [...this.data.products].sort((x, y) => score(y, a) - score(x, a));
    const [top, ...rest] = ranked;
    const also = rest.slice(0, 2);
    root.innerHTML = `<style>${FIT_CSS}</style>
<div class="panel">
  <div class="top"><span class="step">Your result</span><div class="prog"><i style="width:100%"></i></div></div>
  <div class="res">
    <div class="pic-main${top.cut ? " cut" : ""}"><img src="${esc(top.img)}" alt="${esc(top.name)}"></div>
    <div>
      <p class="eyebrow">Your fit</p>
      <p class="rname">${esc(top.name)}</p>
      <p class="rprice">${esc(top.price)}</p>
      <p class="why">${esc(reason(top, a))}</p>
      <div class="acts"><a class="cta" href="${esc(top.href)}">See it ${ARROW}</a><button type="button" class="again">Start over</button></div>
      <p class="also-l">Also worth a look</p>
      <div class="also">${also
        .map((p) => `<a href="${esc(p.href)}"><span class="t${p.cut ? " cut" : ""}"><img src="${esc(p.img)}" alt="" loading="lazy"></span><span><b>${esc(p.name)}</b><span class="pr">${esc(p.price)}</span></span></a>`)
        .join("")}</div>
    </div>
  </div>
</div>`;
    root.querySelector(".again")!.addEventListener("click", () => {
      this.step = 0;
      this.answers = {};
      this.render();
    });
  }
}

/* ------------------------------------------------------------------ */
/* <ps-petals>                                                          */
/* ------------------------------------------------------------------ */

type Petal = { x: number; y: number; z: number; vx: number; vy: number; rot: number; vr: number; flip: number; vf: number; size: number; phase: number; color: string; extra: boolean };
const PETAL_COLORS = ["#F2A3C4", "#F7C4D7", "#E0558F", "#F4B4CC", "#EE8DB5"];

class PsPetals extends HTMLElement {
  private canvas?: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private petals: Petal[] = [];
  private w = 0;
  private h = 0;
  private dpr = 1;
  private raf = 0;
  private visible = false;
  private t0 = 0;
  private io?: IntersectionObserver;
  private ro?: ResizeObserver;
  private host?: HTMLElement;
  private last: { x: number; y: number; t: number } | null = null;

  connectedCallback() {
    if (this.canvas || reduced()) return;
    const root = this.attachShadow({ mode: "open" });
    root.innerHTML = `<style>:host{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:var(--petals-z,5)}canvas{width:100%;height:100%;display:block}</style><canvas aria-hidden="true"></canvas>`;
    this.canvas = root.querySelector("canvas")!;
    this.ctx = this.canvas.getContext("2d")!;
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this);
    this.io = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      if (this.visible && !this.raf) this.raf = requestAnimationFrame(this.tick);
    });
    this.io.observe(this);
    this.host = this.parentElement ?? undefined;
    this.host?.addEventListener("pointermove", this.onMove, { passive: true });
    this.host?.addEventListener("pointerdown", this.onDown, { passive: true });
  }

  disconnectedCallback() {
    this.io?.disconnect();
    this.ro?.disconnect();
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    this.host?.removeEventListener("pointermove", this.onMove);
    this.host?.removeEventListener("pointerdown", this.onDown);
  }

  private resize() {
    const r = this.getBoundingClientRect();
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = r.width;
    this.h = r.height;
    this.canvas!.width = Math.round(this.w * this.dpr);
    this.canvas!.height = Math.round(this.h * this.dpr);
    const want = Math.round(clamp((this.w * this.h) / 15000, 14, 64));
    while (this.petals.filter((p) => !p.extra).length < want) this.petals.push(this.make(Math.random() * this.w, Math.random() * this.h, false));
    this.petals = this.petals.filter((p, i) => p.extra || i < want);
  }

  private make(x: number, y: number, extra: boolean, burst = 0): Petal {
    const a = Math.random() * Math.PI * 2;
    return {
      x,
      y,
      z: 0.55 + Math.random() * 0.75,
      vx: burst ? Math.cos(a) * burst : (Math.random() - 0.5) * 0.4,
      vy: burst ? Math.sin(a) * burst - burst * 0.6 : 0,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.04,
      flip: Math.random() * Math.PI * 2,
      vf: 0.02 + Math.random() * 0.05,
      size: 5 + Math.random() * 6,
      phase: Math.random() * Math.PI * 2,
      color: PETAL_COLORS[(Math.random() * PETAL_COLORS.length) | 0],
      extra,
    };
  }

  private local(e: PointerEvent) {
    const r = this.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  private onMove = (e: PointerEvent) => {
    const p = this.local(e);
    const now = performance.now();
    if (this.last) {
      const dt = Math.max(8, now - this.last.t);
      const vx = ((p.x - this.last.x) / dt) * 16;
      const vy = ((p.y - this.last.y) / dt) * 16;
      for (const q of this.petals) {
        const d = Math.hypot(q.x - p.x, q.y - p.y);
        if (d < 150) {
          const f = (1 - d / 150) * 0.09;
          q.vx += vx * f;
          q.vy += vy * f * 0.6;
          q.vr += (Math.random() - 0.5) * 0.02;
        }
      }
    }
    this.last = { x: p.x, y: p.y, t: now };
  };

  private onDown = (e: PointerEvent) => {
    const p = this.local(e);
    for (let i = 0; i < 14; i++) this.petals.push(this.make(p.x, p.y, true, 2 + Math.random() * 4));
    if (!this.raf && this.visible) this.raf = requestAnimationFrame(this.tick);
  };

  private tick = (t: number) => {
    const f = this.t0 ? Math.min(3, (t - this.t0) / 16.7) : 1;
    this.t0 = t;
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    const time = t / 1000;
    for (const p of this.petals) {
      p.vx *= Math.pow(0.97, f);
      p.vy += (0.45 * p.z - p.vy) * 0.03 * f; // drift back to terminal fall speed
      p.x += (p.vx + Math.sin(time * 0.9 + p.phase) * 0.45 * p.z) * f;
      p.y += p.vy * f;
      p.rot += p.vr * f;
      p.flip += p.vf * f;
      if (!p.extra) {
        if (p.y > this.h + 20) {
          p.y = -20;
          p.x = Math.random() * this.w;
          p.vx = (Math.random() - 0.5) * 0.4;
        }
        if (p.x > this.w + 20) p.x = -20;
        if (p.x < -20) p.x = this.w + 20;
      }
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      const s = p.size * p.z;
      ctx.scale(s * Math.max(0.18, Math.abs(Math.cos(p.flip))), s);
      ctx.globalAlpha = 0.55 + 0.4 * p.z * 0.75;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(0, 1);
      ctx.bezierCurveTo(-0.95, 0.35, -0.75, -0.85, -0.18, -0.95);
      ctx.lineTo(0, -0.72);
      ctx.lineTo(0.18, -0.95);
      ctx.bezierCurveTo(0.75, -0.85, 0.95, 0.35, 0, 1);
      ctx.fill();
      ctx.restore();
    }
    this.petals = this.petals.filter((p) => !p.extra || (p.y < this.h + 30 && p.x > -30 && p.x < this.w + 30));
    this.raf = this.visible && !document.hidden ? requestAnimationFrame(this.tick) : 0;
    if (!this.raf) this.t0 = 0;
  };
}

/* ------------------------------------------------------------------ */
/* Card tilt                                                            */
/* ------------------------------------------------------------------ */

function initTilt() {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches || reduced()) return;
  let cur: HTMLElement | null = null;
  const reset = (el: HTMLElement) => {
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.classList.remove("is-tilting");
  };
  document.addEventListener(
    "pointermove",
    (e) => {
      const el = (e.target as Element | null)?.closest?.("[data-tilt]") as HTMLElement | null;
      if (cur && cur !== el) reset(cur);
      cur = el;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.setProperty("--ry", `${(px * 12).toFixed(2)}deg`);
      el.style.setProperty("--rx", `${(-py * 9).toFixed(2)}deg`);
      el.classList.add("is-tilting");
    },
    { passive: true }
  );
  document.documentElement.addEventListener("pointerleave", () => {
    if (cur) reset(cur);
    cur = null;
  });
}

/* ------------------------------------------------------------------ */

export function register() {
  if (typeof window === "undefined") return;
  const w = window as Window & { __psInteractive?: boolean };
  if (w.__psInteractive) return;
  w.__psInteractive = true;
  const define = (name: string, ctor: CustomElementConstructor) => {
    if (!customElements.get(name)) customElements.define(name, ctor);
  };
  define("ps-spin", PsSpin);
  define("ps-showcase", PsShowcase);
  define("ps-fit", PsFit);
  define("ps-petals", PsPetals);
  initTilt();
}

register();
