#!/usr/bin/env node
// Bighorn Construction & Hardscape: static site builder. No dependencies.
//
//   node build.mjs                      -> site/      (deployable, clean URLs, noindex preview)
//   node build.mjs --launch             -> site/      (indexable: no preview bar, robots allow)
//   node build.mjs --artifact <dir>     -> <dir>/     (flat files for the Claude Artifact preview)
//
// Environment:
//   SITE_URL       canonical origin, e.g. https://www.bighornbuildnv.com (no trailing slash)
//   FORM_ENDPOINT  optional form service URL (Formspree, Basin, etc.). Without it the quote
//                  form hands the message to the visitor's text or email app instead.

import { mkdirSync, writeFileSync, readFileSync, cpSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { biz, towns, photos, services, projects, steps, faq, projectTypes } from './src/content.mjs';

const ROOT = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const ARTIFACT = args.includes('--artifact');
const LAUNCH = args.includes('--launch');
const OUT = ARTIFACT ? args[args.indexOf('--artifact') + 1] : join(ROOT, 'site');
const SITE_URL = (process.env.SITE_URL || 'https://www.example.com').replace(/\/$/, '');
const ENDPOINT = process.env.FORM_ENDPOINT || '';
const PREVIEW = !LAUNCH;
const YEAR = new Date().getFullYear();
const todos = new Set();

// ---------------------------------------------------------------- routing
let CUR = ''; // key of the page being rendered, e.g. '' | 'about' | 'services/concrete'
const depth = (k) => (k ? k.split('/').length : 0);
const fileFor = (k) => (ARTIFACT ? (k ? k.replace(/\//g, '-') + '.html' : 'index.html') : (k === '404' ? '404.html' : k ? k + '/index.html' : 'index.html'));
const up = () => (ARTIFACT || CUR === '404' ? (CUR === '404' && !ARTIFACT ? '/' : '') : '../'.repeat(depth(CUR)));
const L = (k, hash = '') => {
  let h;
  if (ARTIFACT) h = fileFor(k);
  else if (CUR === '404') h = '/' + (k ? k + '/' : '');
  else h = up() + (k ? k + '/' : '') || './';
  if (!ARTIFACT && h === '') h = './';
  return h + (hash ? '#' + hash : '');
};
const A = (p) => up() + p; // asset path
const canonical = (k) => SITE_URL + '/' + (k && k !== '404' ? k + '/' : '');

// ---------------------------------------------------------------- helpers
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const attr = esc;
const arrow = '<svg class="arr" width="18" height="12" viewBox="0 0 18 12" aria-hidden="true"><path d="M1 6h15M11 1l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="square"/></svg>';
const todo = (t) => (todos.add(t), `<span class="todo" title="To add before launch">${esc(t)}</span>`);
const todoBox = (title, text) => (todos.add(title), `<div class="todo-box"><p class="todo-label">To add before launch</p><p class="todo-title">${esc(title)}</p><p>${esc(text)}</p></div>`);
const svcBy = (s) => services.find((x) => x.slug === s);
const projBy = (s) => projects.find((x) => x.slug === s);
const license = () => (biz.license ? `NV Lic. #${esc(biz.license)}` : `NV Lic. ${todo('license # to add')}`);

function pic(name, { alt = '', sizes = '100vw', cls = '', pos = '', eager = false, defer = false } = {}) {
  const [w, h] = photos[name];
  const widths = name.startsWith('dwg-') ? [420, 720, 1014, 1600] : [420, 720, 1014];
  const srcset = widths.map((x) => `${A(`img/${name}-${x}.webp`)} ${x}w`).join(', ');
  const src = A(`img/${name}-720.webp`);
  const s = defer ? `data-src="${src}" data-srcset="${srcset}"` : `src="${src}" srcset="${srcset}"`;
  return `<img${cls ? ` class="${cls}"` : ''} ${s} sizes="${sizes}" width="${w}" height="${h}" alt="${attr(alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async"${pos ? ` style="object-position:${pos}"` : ''}>`;
}
const crest = (w, cls = '', alt = '') => {
  const src = { 120: 'crest-120.webp', 240: 'crest-240.webp', 640: 'crest-640.webp' }[w];
  return `<img${cls ? ` class="${cls}"` : ''} src="${A('img/' + src)}" width="${w}" height="${Math.round(w * 0.985)}" alt="${attr(alt)}" decoding="async">`;
};
const btn = (href, label, cls = 'btn-clay', extra = '') => `<a class="btn ${cls}" href="${href}"${extra}>${label}${cls.includes('btn-clay') || cls.includes('btn-ink') ? ' ' + arrow : ''}</a>`;
const crumbs = (items) => `<nav class="crumbs" aria-label="Breadcrumb"><ol>${items.map(([k, label], i) => (i < items.length - 1 ? `<li><a href="${L(k)}">${esc(label)}</a></li>` : `<li aria-current="page">${esc(label)}</li>`)).join('')}</ol></nav>`;
const crumbLd = (items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([k, label], i) => ({ '@type': 'ListItem', position: i + 1, name: label, item: canonical(k) })) });

const bizLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'GeneralContractor',
  '@id': SITE_URL + '/#business',
  name: biz.name,
  slogan: biz.tagline.replace(/\.$/, ''),
  url: SITE_URL + '/',
  logo: SITE_URL + '/img/crest-512.png',
  image: SITE_URL + '/img/og-backyard.jpg',
  telephone: biz.tel.replace(/^\+1/, '+1-').replace(/(\d{3})(\d{3})(\d{4})$/, '$1-$2-$3'),
  email: biz.email,
  founder: { '@type': 'Person', name: biz.owner },
  address: { '@type': 'PostalAddress', addressLocality: biz.city, addressRegion: biz.region, addressCountry: 'US' },
  areaServed: towns.map((t) => ({ '@type': 'City', name: `${t.name}, NV` })),
  sameAs: [biz.instagram],
  priceRange: 'Free estimates',
  hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Construction and hardscape services', itemListElement: services.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.name, url: canonical('services/' + s.slug) } })) },
});

// ---------------------------------------------------------------- shared blocks
const nav = [
  ['projects', 'Projects'],
  ['process', 'Process'],
  ['about', 'About'],
  ['reviews', 'Reviews'],
  ['contact', 'Contact'],
];
const isActive = (k) => CUR === k || CUR.startsWith(k + '/');

function header() {
  const svcActive = isActive('services');
  return `
<a class="skip" href="#main">Skip to content</a>
${PREVIEW ? `<div class="preview-bar" role="note"><div class="wrap"><span class="pv-dot" aria-hidden="true"></span><span><b>Website concept by Marvani</b> for ${esc(biz.name)}</span><span class="pv-sep">Preview, not live yet. Dashed tags mark details still to add.</span></div></div>` : ''}
<header class="site-head" id="site-head">
  <div class="head-in">
    <a class="brand" href="${L('')}" aria-label="${attr(biz.name)}, home">${crest(120, 'brand-crest')}<span class="brand-txt"><b>Bighorn</b><small>Construction &amp; Hardscape</small></span></a>
    <nav class="nav" aria-label="Main">
      <div class="nav-item has-menu">
        <a class="nav-link" href="${L('services')}"${svcActive ? ' aria-current="page"' : ''}>Services</a>
        <button class="nav-caret" type="button" aria-expanded="false" aria-controls="mega"><span class="sr">Show services</span><svg width="10" height="6" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></button>
        <div class="mega" id="mega">
          <div class="mega-in">
            <ul class="mega-list">${services.map((s) => `<li><a href="${L('services/' + s.slug)}"${CUR === 'services/' + s.slug ? ' aria-current="page"' : ''}><b>${esc(s.nav)}</b><span>${esc(s.line)}</span></a></li>`).join('')}</ul>
            <a class="mega-feat" href="${L('projects/backyard-rebuild')}">${pic('backyard-after', { sizes: '260px', pos: '50% 60%', alt: '' })}<span class="mono">Featured project</span><b>Backyard rebuild</b></a>
          </div>
        </div>
      </div>
      ${nav.map(([k, label]) => `<a class="nav-link" href="${L(k)}"${isActive(k) ? ' aria-current="page"' : ''}>${label}</a>`).join('')}
    </nav>
    <a class="head-tel" href="tel:${biz.tel}">${biz.phone}</a>
    <a class="btn btn-clay head-cta" href="${L('quote')}">Free estimate</a>
    <button class="menu-btn" id="menu-btn" type="button" aria-expanded="false" aria-controls="mnav"><span class="menu-bars" aria-hidden="true"></span><span class="menu-lbl">Menu</span></button>
  </div>
</header>
<div class="mnav" id="mnav" hidden>
  <div class="mnav-in">
    <ul class="mnav-main">
      <li><a href="${L('')}">Home</a></li>
      <li><a href="${L('services')}">Services</a>
        <ul class="mnav-sub">${services.map((s) => `<li><a href="${L('services/' + s.slug)}">${esc(s.nav)}</a></li>`).join('')}</ul></li>
      ${nav.map(([k, label]) => `<li><a href="${L(k)}">${label}</a></li>`).join('')}
    </ul>
    <div class="mnav-cta">
      ${btn(L('quote'), 'Request a free estimate', 'btn-clay btn-lg')}
      <a class="btn btn-ghost btn-lg" href="tel:${biz.tel}">Call ${biz.phone}</a>
    </div>
  </div>
</div>`;
}

function footer() {
  return `
<footer class="site-foot">
  <div class="wrap">
    <div class="foot-top">
      <a class="foot-brand" href="${L('')}" aria-label="${attr(biz.name)}, home">${crest(240, 'foot-crest')}</a>
      <p class="foot-tag">${esc(biz.tagline)}</p>
    </div>
    <div class="foot-cols">
      <div><h2 class="foot-h">Services</h2><ul>${services.map((s) => `<li><a href="${L('services/' + s.slug)}">${esc(s.nav)}</a></li>`).join('')}</ul></div>
      <div><h2 class="foot-h">Company</h2><ul><li><a href="${L('projects')}">Projects</a></li><li><a href="${L('process')}">Our process</a></li><li><a href="${L('about')}">About Bighorn</a></li><li><a href="${L('reviews')}">Reviews</a></li><li><a href="${L('contact')}">Contact</a></li><li><a href="${L('quote')}">Request a quote</a></li></ul></div>
      <div><h2 class="foot-h">Contact</h2><ul class="foot-contact"><li><a href="tel:${biz.tel}">${biz.phone}</a><span>Call or text</span></li><li><a href="mailto:${biz.email}">${biz.email}</a></li><li><a href="${biz.instagram}" rel="noopener" target="_blank">Instagram ${biz.igHandle}</a></li><li>${biz.city}, Nevada</li></ul></div>
      <div><h2 class="foot-h">Service area</h2><ul class="foot-area">${towns.map((t) => `<li>${t.name}</li>`).join('')}</ul></div>
    </div>
    <div class="foot-base">
      <span>&copy; ${YEAR} ${esc(biz.name)}</span>
      <span>Licensed, insured &amp; bonded &middot; ${license()}</span>
      <span>${PREVIEW ? 'Website concept by Marvani' : 'Website by Marvani'}</span>
    </div>
  </div>
</footer>
<nav class="mbar" aria-label="Quick contact">
  <a href="tel:${biz.tel}"><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>Call</a>
  <a href="sms:${biz.tel}"><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>Text</a>
  <a class="go" href="${L('quote')}">Free estimate</a>
</nav>`;
}

function cta({ title = 'Tell us what you’re planning.', text = 'A few photos and a rough idea are plenty to start. Estimates are free, and you will talk to the owner.', service = '' } = {}) {
  const q = service ? L('quote', service) : L('quote');
  return `
<section class="band night cta-band" aria-labelledby="cta-h-${CUR.replace(/\W/g, '') || 'home'}">
  <canvas class="topo" data-topo="cta" aria-hidden="true"></canvas>
  <div class="wrap cta-grid">
    <div class="cta-copy">
      <p class="label label-sand">Free estimate</p>
      <h2 class="d-l" id="cta-h-${CUR.replace(/\W/g, '') || 'home'}">${title}</h2>
      <p class="lede on-night-2">${text}</p>
      <div class="cta-row">${btn(q, 'Request a free estimate', 'btn-clay btn-lg')}</div>
    </div>
    <dl class="direct">
      <div><dt>Call or text</dt><dd><a class="direct-val" href="tel:${biz.tel}">${biz.phone}</a><button class="copy" type="button" data-copy="${biz.phone}">Copy</button></dd></div>
      <div><dt>Email</dt><dd><a class="direct-val" href="mailto:${biz.email}">${biz.email}</a><button class="copy" type="button" data-copy="${biz.email}">Copy</button></dd></div>
      <div><dt>Instagram</dt><dd><a class="direct-val" href="${biz.instagram}" target="_blank" rel="noopener">${biz.igHandle}</a></dd></div>
    </dl>
  </div>
</section>`;
}

function compare(p, { sizes = '(min-width: 1100px) 34vw, 100vw', caption = true, big = false } = {}) {
  const bl = p.beforeLabel || 'Before', al = p.afterLabel || 'After';
  return `
<figure class="ba${big ? ' ba-big' : ''}${p.landscape ? ' ba-land' : ''}" data-ba>
  <div class="ba-grid">
    <div class="ba-pane ba-before">${pic(p.before, { alt: p.alts.before, sizes, pos: p.beforePos })}<span class="ba-tag">${bl}</span></div>
    <div class="ba-pane ba-after">${pic(p.after, { alt: p.alts.after, sizes, pos: p.afterPos })}<span class="ba-tag ba-tag-a">${al}</span></div>
  </div>
  <div class="ba-toggle" role="group" aria-label="Compare photos"><button type="button" data-show="before" aria-pressed="false">${bl}</button><button type="button" data-show="after" aria-pressed="true">${al}</button></div>
  ${caption ? `<figcaption class="fig-cap"><span class="mono">${esc(p.type)} &middot; ${esc(p.tags.join(', '))}</span><span>${esc(p.summary)}</span></figcaption>` : ''}
</figure>`;
}

function workCard(p, cls = '') {
  return `
<a class="wcard ${cls}" href="${L('projects/' + p.slug)}" data-cat="${p.category}">
  <span class="wcard-media${p.landscape ? ' is-land' : ''}">
    ${pic(p.after, { alt: p.alts.after, sizes: '(min-width: 1100px) 40vw, 100vw', pos: p.afterPos })}
    ${pic(p.before, { alt: '', cls: 'wcard-before', sizes: '(min-width: 1100px) 40vw, 100vw', pos: p.beforePos })}
    <span class="wcard-flag">${p.status === 'In progress' ? '<i class="live" aria-hidden="true"></i>In progress' : '<span class="f-a">Before &amp; after</span><span class="f-b">Before</span>'}</span>
  </span>
  <span class="wcard-meta">
    <span class="mono">${esc(p.type)} &middot; ${esc(p.tags.slice(0, 3).join(', '))}</span>
    <span class="wcard-title">${esc(p.title)} ${arrow}</span>
    <span class="wcard-sum">${esc(p.summary)}</span>
  </span>
</a>`;
}

function processSteps(compact = false) {
  return `
<ol class="steps${compact ? ' steps-compact' : ''}" data-steps>
  ${steps.map(([h, p, note], i) => `<li class="step"><span class="step-no">${String(i + 1).padStart(2, '0')}</span><h3 class="step-h">${h}</h3><p>${p}</p>${compact ? '' : `<p class="step-note mono">${note}</p>`}</li>`).join('')}
</ol>`;
}

function faqList(items, id = 'faq') {
  return `<div class="qa" id="${id}">${items.map(([q, a], i) => `<details${i === 0 ? ' open' : ''}><summary>${esc(q)}</summary><div class="qa-a"><p>${esc(a)}${q.startsWith('Are you licensed') ? ` License: ${license()}. <a href="https://www.nscb.nv.gov/" target="_blank" rel="noopener">Look up a contractor on NSCB</a>.` : ''}</p></div></details>`).join('')}</div>`;
}
const faqLd = (items) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: items.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });

function areaMap() {
  return `
<svg class="map" viewBox="0 0 1000 684" role="img" aria-labelledby="map-t map-d" data-map>
  <title id="map-t">Bighorn service area</title>
  <desc id="map-d">Map of Northern Nevada showing the service area around ${towns.map((t) => t.name).join(', ')}, connected by I-80, I-580 and US-50.</desc>
  <defs><pattern id="map-grid" width="50" height="50" patternUnits="userSpaceOnUse"><path d="M50 0H0V50" fill="none" class="map-gridline"/></pattern></defs>
  <rect width="1000" height="684" fill="url(#map-grid)"/>
  <path class="zone" d="M222 118 C 246 66, 330 56, 384 78 L 590 94 C 700 116, 908 176, 912 236 C 914 284, 764 284, 642 304 C 540 330, 432 432, 330 506 C 268 542, 236 506, 236 444 C 234 360, 216 262, 222 118 Z"/>
  <path class="lake" d="M105.8 405.1 L147.0 410.4 L173.4 402.8 L188.1 440.8 L182.2 516.8 L176.4 592.8 L152.8 638.4 L111.7 638.4 L82.3 615.6 L64.7 547.2 L64.7 463.6 L82.3 425.6 Z"/>
  <path class="lake" d="M264.5 372.4 L279.2 383.8 L279.2 410.4 L267.5 425.6 L255.7 414.2 L255.7 387.6 Z"/>
  <path class="lake" d="M634.9 235.6 L676.0 258.4 L711.3 288.8 L705.4 311.6 L670.2 288.8 L640.8 258.4 Z"/>
  <path class="river" d="M64.7 463.6 L41.2 342.0 L88.2 288.8 L129.3 235.6 L158.7 197.6 L235.1 193.8 L258.7 192.3 L323.3 197.6 L405.6 174.8 L499.7 136.8 L570.2 114.0 L546.7 60.8 L511.4 0.0"/>
  <path class="river" d="M288.1 554.8 L323.3 494.0 L393.9 410.4 L499.7 364.8 L617.3 304.0 L658.4 273.6"/>
  <path class="river" d="M705.4 281.2 L781.9 243.2 L852.4 228.0 L940.6 212.8"/>
  <path class="state" d="M147 0V410M147 410V592L178 684"/>
  <path class="road" d="M258.7 190.0 L241.0 136.8 L205.8 76.0 L158.7 0.0"/>
  <path class="road" d="M293.9 186.2 L319.0 99.5 L335.1 0.0"/>
  <path class="road" d="M586.7 130.7 L602.8 277.0 L640.8 364.8 L640.8 592.8 L640.8 684.0"/>
  <path class="road" d="M586.7 130.7 L711.3 163.4 L793.6 212.8 L865.7 232.9"/>
  <path class="road major" d="M188.1 516.8 L283.9 468.2 L386.2 412.7 L452.7 364.8 L517.3 311.6 L602.8 277.0 L705.4 250.8 L865.7 232.9 L999.4 235.6"/>
  <path class="road major" d="M258.7 190.0 L282.2 273.6 L264.5 342.0 L264.5 402.8 L283.9 468.2 L282.2 630.8 L282.2 684.0"/>
  <path class="road major" d="M0.0 199.1 L123.5 209.0 L258.7 190.0 L293.9 186.2 L382.1 167.2 L499.7 129.2 L567.3 112.5 L586.7 130.7 L705.4 76.0 L817.1 0.0"/>
  <text class="rl" x="420" y="140" transform="rotate(-17 420 140)">I-80</text>
  <text class="rl" x="292" y="300">I-580</text>
  <text class="rl" x="488" y="318" transform="rotate(-35 488 318)">US-50</text>
  <text class="rl" x="712" y="152" transform="rotate(16 712 152)">ALT 50</text>
  <text class="wl" x="124" y="528" text-anchor="middle">LAKE</text>
  <text class="wl" x="124" y="543" text-anchor="middle">TAHOE</text>
  <text class="wl" x="680" y="330">LAHONTAN RES.</text>
  <text class="wl wl-river" x="378" y="188" transform="rotate(-14 378 188)">TRUCKEE RIVER</text>
  <text class="sm" x="134" y="32" text-anchor="end">CA</text>
  <text class="sm" x="160" y="32">NV</text>
  ${towns.map((t) => `<g class="town${t.base ? ' base' : ''}" data-town="${t.id}" transform="translate(${t.x} ${t.y})"><circle class="halo" r="${t.base ? 18 : 16}"/><circle class="dot" r="${t.base ? 7 : 5.5}"/><text class="lbl" x="${t.base ? -14 : t.lx}" y="${t.base ? 5 : t.ly}"${t.base || t.end ? ' text-anchor="end"' : t.mid ? ' text-anchor="middle"' : ''}>${t.name}</text></g>`).join('')}
  <g transform="translate(955 54)"><path class="ink-line" d="M0 22V-20M-7 -10L0 -22 7 -10"/><text class="sm" x="0" y="40" text-anchor="middle">N</text></g>
  <g transform="translate(736 646)"><path class="ink-line" d="M0 0H220M0 -6V6M110 -4V4M220 -6V6"/><text class="sm" x="0" y="-12" text-anchor="middle">0</text><text class="sm" x="110" y="-12" text-anchor="middle">10</text><text class="sm" x="220" y="-12" text-anchor="middle">20 MI</text></g>
</svg>`;
}

function areaSection(heading = 'h2') {
  return `
<section class="band paper area-sec" aria-labelledby="area-h">
  <div class="wrap area">
    <figure class="map-fig">${areaMap()}<figcaption class="fig-cap"><span class="mono">Drawn to scale from real coordinates.</span><span>Dashed outline: main service area.</span></figcaption></figure>
    <div class="area-copy">
      <p class="label">Service area</p>
      <${heading} class="d-l" id="area-h">Reno, Sparks and the valleys around them.</${heading}>
      <p class="lede">Based in Reno and working across the Truckee Meadows, south to Carson City, and east along I-80 and US-50 to Fernley and Fallon.</p>
      <ul class="towns">${towns.map((t, i) => `<li><button type="button" data-town="${t.id}"${i === 0 ? ' class="on"' : ''}>${t.name}</button></li>`).join('')}</ul>
      <p class="muted small">Not on the list? Call or text <a href="tel:${biz.tel}">${biz.phone}</a> and ask.</p>
    </div>
  </div>
</section>`;
}


// quote form ------------------------------------------------------------
function quoteForm({ compact = false } = {}) {
  const id = compact ? 'cf' : 'qf';
  const typeChips = projectTypes.map(([v, l]) => `<label class="chip"><input type="checkbox" name="type" value="${attr(l)}" id="${id}-t-${v}" data-key="${v}"><span>${esc(l)}</span></label>`).join('');
  const contactFields = `
      <div class="f-row">
        <div class="field"><label for="${id}-name">Your name <i>required</i></label><input id="${id}-name" name="name" type="text" autocomplete="name" required data-label="Name"><p class="f-err" id="${id}-name-err" hidden>Add your name so Caleb knows who he is calling.</p></div>
        <div class="field"><label for="${id}-phone">Phone <i>required</i></label><input id="${id}-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" required data-label="Phone" pattern="[0-9()+.\\-\\s]{7,}"><p class="f-err" id="${id}-phone-err" hidden>Add a phone number with area code, e.g. 775-555-0123.</p></div>
      </div>
      <div class="f-row">
        <div class="field"><label for="${id}-email">Email <i>optional</i></label><input id="${id}-email" name="email" type="email" autocomplete="email" data-label="Email"><p class="f-err" id="${id}-email-err" hidden>That email address looks incomplete.</p></div>
        <fieldset class="field"><legend>Best way to reach you</legend><div class="chips">${['Call', 'Text', 'Email'].map((m, i) => `<label class="chip"><input type="radio" name="contact" value="${m}" id="${id}-c-${m.toLowerCase()}"${i === 0 ? ' checked' : ''}><span>${m}</span></label>`).join('')}</div></fieldset>
      </div>`;
  if (compact) {
    return `
<form class="qform qform-compact" id="${id}" data-qform data-endpoint="${attr(ENDPOINT)}" novalidate>
  ${contactFields}
  <div class="field"><label for="${id}-msg">What are you planning? <i>required</i></label><textarea id="${id}-msg" name="description" rows="4" required data-label="Project" placeholder="e.g. Concrete walkway down the side yard, about 6 by 40 feet, plus a gate"></textarea><p class="f-err" id="${id}-msg-err" hidden>Tell us a little about the project.</p></div>
  <div class="q-actions"><button class="btn btn-clay btn-lg" type="submit">Send message ${arrow}</button></div>
  ${sendPanel(id)}
</form>`;
  }
  return `
<form class="qform" id="${id}" data-qform data-steps-form data-endpoint="${attr(ENDPOINT)}" novalidate>
  <ol class="q-prog" aria-hidden="true"><li class="on"><span>01</span>Project</li><li><span>02</span>Details</li><li><span>03</span>Contact</li></ol>
  <p class="sr" aria-live="polite" data-step-live>Step 1 of 3: Project</p>

  <fieldset class="q-step" data-step="1">
    <legend class="q-legend">What do you need built?</legend>
    <div class="field"><p class="f-label" id="${id}-type-l">Project type <i>pick any</i></p><div class="chips" role="group" aria-labelledby="${id}-type-l" data-group="type">${typeChips}</div><p class="f-err" id="${id}-type-err" hidden>Pick at least one project type, or choose “Something else”.</p></div>
    <div class="f-row">
      <div class="field"><label for="${id}-town">Project location</label><select id="${id}-town" name="town" data-label="Town">${towns.map((t) => `<option>${t.name}</option>`).join('')}<option value="Other (nearby)">Somewhere else nearby</option></select></div>
      <div class="field"><label for="${id}-prop">Property</label><select id="${id}-prop" name="property" data-label="Property"><option>Home</option><option>Business</option><option>Rental / investment</option></select></div>
    </div>
    <fieldset class="field"><legend>Timing</legend><div class="chips">${['As soon as possible', 'In 1–3 months', 'Later this year', 'Just planning'].map((t, i) => `<label class="chip"><input type="radio" name="timing" value="${t}" id="${id}-w-${i}"${i === 1 ? ' checked' : ''}><span>${t}</span></label>`).join('')}</div></fieldset>
  </fieldset>

  <fieldset class="q-step" data-step="2" hidden>
    <legend class="q-legend">Tell us about it.</legend>
    <div class="field"><label for="${id}-desc">Project description <i>required</i></label><textarea id="${id}-desc" name="description" rows="5" required data-label="Description" placeholder="What you want done, rough size, anything that is bugging you about the space now."></textarea><p class="f-err" id="${id}-desc-err" hidden>A sentence or two is enough. What would you like built or fixed?</p></div>
    <div class="f-row">
      <div class="field"><label for="${id}-size">Rough size <i>optional</i></label><select id="${id}-size" name="size" data-label="Size"><option value="">Not sure</option><option>Small (under 200 sq ft)</option><option>Medium (200–600 sq ft)</option><option>Large (over 600 sq ft)</option><option>Whole yard</option></select></div>
      <div class="field"><label for="${id}-budget">Estimated budget <i>optional</i></label><select id="${id}-budget" name="budget" data-label="Budget"><option value="">Prefer not to say</option><option>Under $5,000</option><option>$5,000–$15,000</option><option>$15,000–$40,000</option><option>$40,000+</option></select></div>
    </div>
    <p class="f-hint">Photos help. After you send this, reply to Caleb’s text or email with a few pictures of the space.</p>
  </fieldset>

  <fieldset class="q-step" data-step="3" hidden>
    <legend class="q-legend">How should Caleb reach you?</legend>
    ${contactFields}
    <div class="field"><label for="${id}-addr">Street address <i>optional</i></label><input id="${id}-addr" name="address" type="text" autocomplete="street-address" data-label="Address"></div>
  </fieldset>

  <div class="q-actions">
    <button class="btn btn-ghost-ink" type="button" data-back hidden>Back</button>
    <button class="btn btn-clay btn-lg" type="button" data-next>Continue ${arrow}</button>
    <button class="btn btn-clay btn-lg" type="submit" data-submit hidden>Send request ${arrow}</button>
  </div>
  ${sendPanel(id)}
</form>`;
}

function sendPanel(id) {
  return `
  <div class="q-done" data-done hidden tabindex="-1">
    <div data-mode="handoff">
      <p class="label">Almost done</p>
      <h3 class="d-m">Send it to Caleb.</h3>
      <p>Nothing has been sent yet. Pick how you want to send your request. Your text or email app opens with everything filled in, ready to send.</p>
      <pre class="q-msg" data-msg></pre>
      <div class="q-send">
        <a class="btn btn-clay" data-sms href="sms:${biz.tel}">Text it to ${biz.phone} ${arrow}</a>
        <a class="btn btn-ghost-ink" data-mail href="mailto:${biz.email}">Email it</a>
        <button class="btn btn-ghost-ink" type="button" data-copy-msg>Copy message</button>
      </div>
      <p class="q-status" data-status role="status">If no app opens, copy the message and send it to ${biz.phone} or ${biz.email}.</p>
      <button class="text-btn" type="button" data-edit>Edit my answers</button>
    </div>
    <div data-mode="sent" hidden>
      <p class="label">Request sent</p>
      <h3 class="d-m">Thanks. Caleb has your request.</h3>
      <p data-sent-text>He’ll reach out soon.</p>
    </div>
  </div>`;
}

// ---------------------------------------------------------------- pages
const pages = [];
const page = (key, def) => pages.push({ key, ...def });

// HOME ------------------------------------------------------------------
page('', {
  title: `${biz.name} | Concrete, Pavers & Hardscape in Reno, NV`,
  desc: 'Concrete, paver patios, backyard design, sod and sprinklers, fencing, dirt work and remodels in Reno, Sparks and Northern Nevada. Owner-run, licensed, insured and bonded. Free estimates: 775-440-3757.',
  ld: () => [bizLd(), { '@context': 'https://schema.org', '@type': 'WebSite', name: biz.name, url: SITE_URL + '/' }],
  render() {
    const slides = [projBy('backyard-rebuild'), projBy('sod-install'), projBy('side-yard-concrete')];
    const why = [
      ['The owner', 'You deal with Caleb.', 'The person who walks your yard and prices the job is the person running it. Questions get answered by someone who knows your project.'],
      ['The paperwork', 'Licensed, insured and bonded.', `Bighorn carries a Nevada contractor’s license, insurance and a bond: ${license()}. You can look up any Nevada contractor on the <a href="https://www.nscb.nv.gov/" target="_blank" rel="noopener">NSCB website</a>.`],
      ['The whole yard', 'One crew from dirt to finish.', 'Dirt work, concrete, pavers, sprinklers, sod and fencing on one schedule, with one person accountable for all of it.'],
      ['The finish', 'Clean work, clean site.', 'Straight edges, tight joints and level surfaces, and a job site cleaned up before the final walkthrough.'],
    ];
    return `
<section class="hero" aria-labelledby="hero-h">
  <canvas class="topo hero-topo" data-topo="hero" aria-hidden="true"></canvas>
  <div class="hero-copy">
    <p class="label label-sand hero-kicker">Construction &amp; hardscape &middot; Reno, Nevada</p>
    <h1 class="d-xl hero-h" id="hero-h"><span class="ln"><span>Good work starts</span></span> <span class="ln"><span>below the surface.</span></span></h1>
    <p class="lede hero-lede">Concrete, pavers, lawns, fences and remodels for homes and businesses across Reno, Sparks and Northern Nevada. Owner-run, licensed, insured and bonded.</p>
    <div class="cta-row hero-cta">${btn(L('quote'), 'Request a free estimate', 'btn-clay btn-lg')}<a class="btn btn-ghost btn-lg" href="${L('projects')}">See the work</a></div>
    <dl class="hero-facts">
      <div><dt>Call or text</dt><dd><a href="tel:${biz.tel}">${biz.phone}</a></dd></div>
      <div><dt>Estimates</dt><dd>Free, on site</dd></div>
      <div><dt>Projects</dt><dd>Homes &amp; businesses</dd></div>
    </dl>
  </div>
  <figure class="hero-media" data-cycle aria-label="Before and after photos from recent Bighorn projects">
    <div class="cyc-stage">
      ${slides.map((p, i) => `<a class="cyc${i === 0 ? ' is-on' : ''}" href="${L('projects/' + p.slug)}" data-name="${attr(p.title)}" tabindex="${i === 0 ? 0 : -1}"${i ? ' aria-hidden="true"' : ''}>${pic(p.after, { alt: p.alts.after, sizes: '(min-width: 1000px) 48vw, 100vw', cls: 'cyc-after', pos: p.afterPos, eager: i === 0, defer: i > 0 })}${pic(p.before, { alt: '', sizes: '(min-width: 1000px) 48vw, 100vw', cls: 'cyc-before', pos: p.beforePos, defer: true })}<span class="cyc-edge" aria-hidden="true"></span></a>`).join('')}
    </div>
    <figcaption class="cyc-bar">
      <span class="cyc-state"><b class="cyc-tag" data-cyc-tag>After</b><span data-cyc-name>${esc(slides[0].title)}</span></span>
      <span class="cyc-ctrl">${slides.map((p, i) => `<button type="button" class="cyc-dot" data-go="${i}" aria-label="Show ${attr(p.title)}"${i === 0 ? ' aria-current="true"' : ''}><span>${String(i + 1).padStart(2, '0')}</span><i></i></button>`).join('')}<button type="button" class="cyc-pause" data-pause aria-label="Pause slideshow"><svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path class="i-pause" d="M3 1v10M9 1v10" stroke="currentColor" stroke-width="2"/><path class="i-play" d="M2 1l9 5-9 5z" fill="currentColor"/></svg></button></span>
    </figcaption>
  </figure>
</section>

<section class="proof-strip" aria-label="At a glance">
  <ul class="wrap proof">
    <li><b>Licensed, insured &amp; bonded</b><span>Nevada contractor &middot; ${license()}</span></li>
    <li><b>Free estimates</b><span>On site, no obligation</span></li>
    <li><b>Owner-run</b><span>You deal with Caleb</span></li>
    <li><b>Homes &amp; businesses</b><span>Residential and commercial work</span></li>
  </ul>
</section>

<section class="band paper intro" aria-labelledby="intro-h">
  <div class="wrap g12">
    <p class="label c-3" id="intro-h">The company</p>
    <div class="c-9 intro-body">
      <p class="statement" data-rise>Bighorn is a Reno construction and hardscape company owned and run by Caleb Sharron. We build the ground around your home or business: <span class="hl-sand">concrete, pavers, lawns and fences</span>, and the dirt work underneath all of it.</p>
      <div class="intro-split">
        <figure class="intro-crest" data-rise>${crest(640, '', `${biz.name} crest: a bighorn ram above desert mountains`)}</figure>
        <figure class="pull" data-rise>
          <blockquote><p>“${esc(biz.ownerQuote)}”</p></blockquote>
          <figcaption><b>${esc(biz.owner)}</b><span>Owner, ${esc(biz.name)}</span></figcaption>
          <a class="link-arrow" href="${L('about')}">More about Bighorn ${arrow}</a>
        </figure>
      </div>
    </div>
  </div>
</section>

<section class="band concrete svc-sec" aria-labelledby="svc-h">
  <div class="wrap">
    <div class="sec-head split">
      <div><p class="label">Services</p><h2 class="d-l" id="svc-h">From the first cut of dirt to the last paver.</h2></div>
      <div class="sec-aside"><p>Most outdoor projects need dirt work, a solid base, the surface, water and a fence. Bighorn does all of it, so you are not lining up three contractors and hoping they show up in the right order.</p><a class="link-arrow" href="${L('services')}">All services ${arrow}</a></div>
    </div>
    <ul class="svc-list" data-preview-list>
      ${services.map((s) => `<li><a class="svc-row" href="${L('services/' + s.slug)}" data-preview="${A(`img/${s.card || s.image}-720.webp`)}" data-preview-pos="${s.card ? s.cardPos : s.imagePos}"><span class="svc-name">${esc(s.name)}</span><span class="svc-line">${esc(s.line)}</span><span class="svc-thumb">${pic(s.card || s.image, { alt: '', sizes: '96px', pos: s.card ? s.cardPos : s.imagePos })}</span>${arrow}</a></li>`).join('')}
    </ul>
  </div>
  <div class="float-preview" aria-hidden="true"><img alt="" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" width="360" height="450"></div>
</section>

<section class="band night work-sec" aria-labelledby="work-h">
  <div class="wrap">
    <div class="sec-head split">
      <div><p class="label label-sand">Selected work</p><h2 class="d-l" id="work-h">Before and after, straight from the job site.</h2></div>
      <div class="sec-aside on-night-2"><p>Every photo here is from a Bighorn job, shot on site with a phone. No stock photography.</p><a class="link-arrow" href="${L('projects')}">All projects ${arrow}</a></div>
    </div>
    <article class="feat">
      ${compare(projBy('backyard-rebuild'), { big: true, caption: false, sizes: '(min-width: 1100px) 36vw, 100vw' })}
      <div class="feat-copy">
        <p class="mono on-night-2">Residential &middot; Pavers, lawn, planter wall</p>
        <h3 class="d-m"><a href="${L('projects/backyard-rebuild')}">Backyard rebuild</a></h3>
        <p class="on-night-2">${esc(projBy('backyard-rebuild').summary)} In Caleb’s words on Instagram: “${esc(projBy('backyard-rebuild').quote)}”</p>
        <a class="link-arrow" href="${L('projects/backyard-rebuild')}">Read the project ${arrow}</a>
      </div>
    </article>
    <div class="work-grid">
      ${workCard(projBy('side-yard-concrete'), 'w-a')}
      ${workCard(projBy('sod-install'), 'w-b')}
      ${workCard(projBy('office-remodel'), 'w-c')}
      ${workCard(projBy('staircase-renovation'), 'w-d')}
    </div>
  </div>
</section>

<section class="band paper why-sec" aria-labelledby="why-h">
  <div class="wrap why">
    <div class="why-head"><p class="label">Why Bighorn</p><h2 class="d-l" id="why-h">Why people call Bighorn.</h2><p class="lede">A young company with an old-school way of working: show up, do it properly, clean up.</p></div>
    <ul class="why-list">${why.map(([k, h, p]) => `<li data-rise><p class="mono why-k">${k}</p><h3 class="d-m">${h}</h3><p>${p}</p></li>`).join('')}</ul>
  </div>
</section>

<section class="band night-2 process-sec" aria-labelledby="proc-h">
  <div class="wrap">
    <div class="sec-head split">
      <div><p class="label label-sand">How it works</p><h2 class="d-l" id="proc-h">From first call to final walkthrough.</h2></div>
      <div class="sec-aside on-night-2"><p>No sales team and no hand-offs. Five steps, the same on a gate repair as on a full backyard.</p><a class="link-arrow" href="${L('process')}">Our process ${arrow}</a></div>
    </div>
    ${processSteps(true)}
  </div>
</section>

<section class="band concrete reviews-sec" aria-labelledby="rev-h">
  <div class="wrap rev-grid">
    <div><p class="label">Reviews</p><h2 class="d-l" id="rev-h">In our clients’ words.</h2><p class="lede">Real reviews from Bighorn clients, published with their permission.</p><a class="link-arrow" href="${L('reviews')}">All reviews ${arrow}</a></div>
    <div class="rev-slot">
      <span class="rev-mark" aria-hidden="true">“</span>
      ${todoBox('A real client review', 'Paste one or two Google reviews here (with the client’s first name, town and project). We will not publish made-up reviews.')}
    </div>
  </div>
</section>

${areaSection()}
${cta()}`;
  },
});

// SERVICES INDEX -------------------------------------------------------
page('services', {
  title: `Services | ${biz.name}, Reno NV`,
  desc: 'Concrete, pavers and hardscape, backyard design, sod and sprinkler systems, fencing and gates, dirt work and excavation, and remodels in Reno, Sparks and Northern Nevada.',
  crumbs: [['', 'Home'], ['services', 'Services']],
  render() {
    return `
<section class="page-head night">
  <canvas class="topo" data-topo="head" aria-hidden="true"></canvas>
  <div class="wrap ph-grid">
    <div class="ph-copy">
      ${crumbs(this.crumbs)}
      <p class="label label-sand">Services</p>
      <h1 class="d-xl">Everything from the dirt up.</h1>
      <p class="lede on-night-2">Seven kinds of work, one contractor. Most projects use three or four of them, which is why it helps when the same crew does all of it.</p>
    </div>
  </div>
</section>
<section class="band paper svc-index">
  <div class="wrap">
    ${services.map((s, i) => `
    <article class="svc-block${i % 2 ? ' flip' : ''}" id="${s.slug}">
      <a class="svc-block-media${s.card ? ' is-dwg' : ''}" href="${L('services/' + s.slug)}" tabindex="-1" aria-hidden="true">${pic(s.card || s.image, { alt: '', sizes: '(min-width: 1000px) 40vw, 100vw', pos: s.card ? s.cardPos : s.imagePos })}${s.card ? '<span class="dwg-tag">Typical detail drawing</span>' : ''}</a>
      <div class="svc-block-copy">
        <p class="mono svc-count">${String(i + 1).padStart(2, '0')} / ${String(services.length).padStart(2, '0')}</p>
        <h2 class="d-l"><a href="${L('services/' + s.slug)}">${esc(s.name)}</a></h2>
        <p class="lede">${esc(s.lede)}</p>
        <ul class="tick-list">${s.includes.slice(0, 6).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        <div class="cta-row">${btn(L('services/' + s.slug), `More on ${s.nav.toLowerCase()}`, 'btn-ink')}<a class="btn btn-ghost-ink" href="${L('quote', s.slug)}">Get a quote</a></div>
      </div>
    </article>`).join('')}
  </div>
</section>
${cta()}`;
  },
});

// SERVICE PAGES --------------------------------------------------------
services.forEach((s, idx) => {
  page('services/' + s.slug, {
    title: `${s.seoTitle} | ${biz.short} Construction & Hardscape`,
    desc: s.seoDesc,
    crumbs: [['', 'Home'], ['services', 'Services'], ['services/' + s.slug, s.name]],
    ld() {
      return [{ '@context': 'https://schema.org', '@type': 'Service', name: s.name, serviceType: s.name, description: s.lede, provider: { '@id': SITE_URL + '/#business' }, areaServed: towns.map((t) => `${t.name}, NV`), url: canonical('services/' + s.slug) }, faqLd(s.faq)];
    },
    render() {
      const p = projBy(s.project);
      const others = services.filter((x) => x.slug !== s.slug);
      return `
<section class="page-head night svc-head">
  <canvas class="topo" data-topo="head" aria-hidden="true"></canvas>
  <div class="wrap ph-grid ph-media-grid">
    <div class="ph-copy">
      ${crumbs(this.crumbs)}
      <p class="label label-sand">${esc(s.name)}</p>
      <h1 class="d-xl d-xl-s">${esc(s.h1)}</h1>
      <p class="lede on-night-2">${esc(s.lede)}</p>
      <div class="cta-row">${btn(L('quote', s.slug), 'Get a free estimate', 'btn-clay btn-lg')}<a class="btn btn-ghost btn-lg" href="tel:${biz.tel}">Call ${biz.phone}</a></div>
    </div>
    <figure class="ph-figure"><span class="ph-frame" data-parallax>${pic(s.image, { alt: s.alt, sizes: '(min-width: 1000px) 40vw, 100vw', pos: s.imagePos, eager: true })}</span><figcaption class="fig-cap"><span class="mono">Bighorn job photo</span><a href="${L('projects/' + p.slug)}">${esc(p.title)} ${arrow}</a></figcaption></figure>
  </div>
</section>

<section class="band paper">
  <div class="wrap g12 svc-detail">
    <div class="c-5 svc-incl">
      <p class="label">What’s included</p>
      <ul class="incl-list">${s.includes.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    </div>
    <div class="c-7 prose">
      <p class="statement statement-s">${esc(s.body[0])}</p>
      <p>${esc(s.body[1])}</p>
    </div>
  </div>
</section>

<section class="band concrete">
  <div class="wrap">
    <div class="sec-head"><p class="label">How we do it</p><h2 class="d-l">The order of work.</h2></div>
    <ol class="method">${s.steps.map(([h, t], i) => `<li data-rise><span class="method-no mono">${String(i + 1).padStart(2, '0')}</span><h3 class="d-s">${esc(h)}</h3><p>${esc(t)}</p></li>`).join('')}</ol>
  </div>
</section>

${s.drawing ? `
<section class="band paper dwg-sec" aria-labelledby="dwg-h">
  <div class="wrap dwg-grid">
    <figure class="dwg-fig">${pic(s.drawing.img, { alt: s.drawing.alt, sizes: '(min-width: 1000px) 52vw, 100vw' })}<figcaption class="fig-cap"><span class="mono">Drawing ${s.drawing.no} &middot; typical detail</span><span>An illustration of how this work is usually built, not a photo of a specific job.</span></figcaption></figure>
    <div class="dwg-copy">
      <p class="label">Typical detail</p>
      <h2 class="d-l" id="dwg-h">${esc(s.drawing.h)}</h2>
      <dl class="spec spec-ink spec-1">${s.drawing.notes.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      <p class="muted small">Typical numbers for Northern Nevada homes. Your soil, slope and use set the final specs, and they are written into your estimate.</p>
    </div>
  </div>
</section>` : ''}


<section class="band night-2 proj-feature" aria-labelledby="pf-h">
  <div class="wrap pf-grid">
    ${compare(p, { caption: false, sizes: '(min-width: 1100px) 30vw, 100vw' })}
    <div class="pf-copy">
      <p class="label label-sand">${s.slug === p.services[0] ? 'Project' : 'Related project'}</p>
      <h2 class="d-l" id="pf-h">${esc(p.title)}</h2>
      <p class="on-night-2">${esc(p.summary)}</p>
      <ul class="tag-list">${p.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      <a class="link-arrow" href="${L('projects/' + p.slug)}">See the full project ${arrow}</a>
    </div>
  </div>
</section>

<section class="band paper">
  <div class="wrap g12">
    <div class="c-4"><p class="label">Questions</p><h2 class="d-l">${esc(s.nav.charAt(0).toUpperCase() + s.nav.slice(1))}, answered.</h2><p class="muted">Something else? Call or text <a href="tel:${biz.tel}">${biz.phone}</a>.</p></div>
    <div class="c-8">${faqList(s.faq, 'faq-' + s.slug)}</div>
  </div>
</section>

<section class="band concrete other-svc" aria-labelledby="os-h">
  <div class="wrap">
    <p class="label" id="os-h">Other services</p>
    <ul class="other-list">${others.map((o) => `<li><a href="${L('services/' + o.slug)}"><span>${esc(o.name)}</span>${arrow}</a></li>`).join('')}</ul>
  </div>
</section>
${cta({ title: `Planning ${s.slug === 'remodels' ? 'a remodel' : s.nav.toLowerCase().startsWith('sod') ? 'a lawn or sprinklers' : 'a ' + s.nav.toLowerCase().replace(/ &.*$/, '') + ' project'}?`, service: s.slug })}`;
    },
  });
});

// PROJECTS INDEX ---------------------------------------------------------
page('projects', {
  title: `Projects: Before & After | ${biz.name}`,
  desc: 'Before and after photos of real Bighorn Construction & Hardscape projects in Northern Nevada: pavers, concrete, sod, staircases and commercial remodels.',
  crumbs: [['', 'Home'], ['projects', 'Projects']],
  render() {
    const cats = [['all', 'All'], ['hardscape', 'Hardscape'], ['concrete', 'Concrete'], ['lawn', 'Lawn'], ['interior', 'Interior'], ['commercial', 'Commercial']];
    return `
<section class="page-head night">
  <canvas class="topo" data-topo="head" aria-hidden="true"></canvas>
  <div class="wrap ph-grid">
    <div class="ph-copy">
      ${crumbs(this.crumbs)}
      <p class="label label-sand">Projects</p>
      <h1 class="d-xl">The work, before and after.</h1>
      <p class="lede on-night-2">Real Bighorn jobs, photographed on site. Pick one to see the full story: what was there, what we built, and how it turned out.</p>
    </div>
  </div>
</section>
<section class="band paper proj-index">
  <div class="wrap">
    <div class="filter" role="group" aria-label="Filter projects">${cats.map(([v, l], i) => `<button type="button" data-filter="${v}" aria-pressed="${i === 0}">${l}</button>`).join('')}</div>
    <p class="sr" aria-live="polite" data-filter-live></p>
    <div class="proj-list">
      ${projects.map((p, i) => `
      <article class="proj-row${i % 2 ? ' flip' : ''}" data-cat="${p.category}">
        <a class="proj-row-media${p.landscape ? ' is-land' : ''}" href="${L('projects/' + p.slug)}" aria-label="${attr(p.title)}">
          <span class="pr-after">${pic(p.after, { alt: p.alts.after, sizes: '(min-width: 1000px) 34vw, 100vw', pos: p.afterPos })}</span>
          <span class="pr-before">${pic(p.before, { alt: p.alts.before, sizes: '(min-width: 1000px) 20vw, 50vw', pos: p.beforePos })}<span class="ba-tag">${p.beforeLabel || 'Before'}</span></span>
        </a>
        <div class="proj-row-copy">
          <p class="mono">${String(i + 1).padStart(2, '0')} &middot; ${esc(p.type)}${p.date ? ' &middot; ' + esc(p.date) : ''}${p.status === 'In progress' ? ' &middot; <span class="live-tag"><i class="live" aria-hidden="true"></i>In progress</span>' : ''}</p>
          <h2 class="d-l"><a href="${L('projects/' + p.slug)}">${esc(p.title)}</a></h2>
          <p class="lede">${esc(p.summary)}</p>
          <ul class="tag-list tag-list-ink">${p.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
          <a class="link-arrow" href="${L('projects/' + p.slug)}">See the project ${arrow}</a>
        </div>
      </article>`).join('')}
    </div>
    <div class="more-ig"><p>More jobs, as they happen, on Instagram.</p><a class="btn btn-ghost-ink" href="${biz.instagram}" target="_blank" rel="noopener">${biz.igHandle}</a></div>
  </div>
</section>
${cta()}`;
  },
});

// PROJECT PAGES ---------------------------------------------------------
projects.forEach((p, idx) => {
  const next = projects[(idx + 1) % projects.length];
  page('projects/' + p.slug, {
    title: `${p.long} | ${biz.name}`,
    desc: `${p.summary} A ${p.type.toLowerCase()} project by ${biz.name}, Northern Nevada.`,
    crumbs: [['', 'Home'], ['projects', 'Projects'], ['projects/' + p.slug, p.title]],
    ogImage: `img/${p.after}-1014.webp`,
    render() {
      const svcLinks = p.services.map((k) => `<a href="${L('services/' + k)}">${esc(svcBy(k).name)}</a>`).join(', ');
      return `
<section class="page-head night proj-head">
  <div class="wrap ph-grid ph-media-grid">
    <div class="ph-copy">
      ${crumbs(this.crumbs)}
      <p class="label label-sand">${esc(p.type)} project${p.status === 'In progress' ? ' &middot; <span class="live-tag"><i class="live" aria-hidden="true"></i>In progress</span>' : ''}</p>
      <h1 class="d-xl d-xl-s">${esc(p.long)}</h1>
      <p class="lede on-night-2">${esc(p.summary)}</p>
      <dl class="spec">
        <div><dt>Type</dt><dd>${esc(p.type)}</dd></div>
        <div><dt>Location</dt><dd>${p.location ? esc(p.location) : todo('town to confirm')}</dd></div>
        <div><dt>Status</dt><dd>${esc(p.status)}</dd></div>
        <div><dt>Posted</dt><dd>${p.date ? esc(p.date) : todo('date to confirm')}</dd></div>
        <div class="spec-wide"><dt>Services</dt><dd>${svcLinks}</dd></div>
      </dl>
    </div>
    <figure class="ph-figure${p.landscape ? ' is-land' : ''}"><span class="ph-frame" data-parallax>${pic(p.after, { alt: p.alts.after, sizes: '(min-width: 1000px) 44vw, 100vw', pos: p.afterPos, eager: true })}</span><figcaption class="fig-cap"><span class="mono">${p.afterLabel || 'After'}</span><span>Bighorn job photo</span></figcaption></figure>
  </div>
</section>

<section class="band paper">
  <div class="wrap g12">
    <div class="c-4"><p class="label">Overview</p></div>
    <div class="c-8 prose">
      <p class="statement statement-s">${esc(p.challenge)}</p>
      ${p.quote ? `<figure class="pull pull-inline"><blockquote><p>“${esc(p.quote)}”</p></blockquote><figcaption><b>${esc(biz.owner)}</b><span>on Instagram</span></figcaption></figure>` : ''}
    </div>
  </div>
</section>

<section class="band night ba-sec" aria-labelledby="ba-h">
  <div class="wrap">
    <div class="sec-head split"><div><p class="label label-sand">${p.landscape ? 'Progress' : 'Before &amp; after'}</p><h2 class="d-l" id="ba-h">${p.landscape ? 'Where it stands.' : 'What changed.'}</h2></div><div class="sec-aside on-night-2"><p>${p.landscape ? 'Photos from the first phase. Finished photos will go up when the remodel is complete.' : 'Same property, photographed before the work started and after it was finished.'}</p></div></div>
    ${compare(p, { big: true, caption: false, sizes: '(min-width: 1100px) 44vw, 100vw' })}
  </div>
</section>

<section class="band paper">
  <div class="wrap case">
    <div class="case-block"><p class="label">The challenge</p><p>${esc(p.challenge)}</p></div>
    <div class="case-block"><p class="label">What we did</p><p>${esc(p.solution)}</p></div>
    <div class="case-block"><p class="label">The result</p><p>${esc(p.result)}</p></div>
    <div class="case-block"><p class="label">Scope of work</p><ul class="tick-list">${p.scope.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
    <div class="case-block"><p class="label">Materials</p>${p.materials.length ? `<ul class="tick-list">${p.materials.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : `<p class="muted">To be listed when the remodel is finished.</p>`}<p class="case-todo">${todo('confirm materials, size and timeline with Caleb')}</p></div>
  </div>
</section>

<section class="band concrete gallery-sec" aria-labelledby="gal-h">
  <div class="wrap">
    <div class="sec-head split"><div><p class="label">Gallery</p><h2 class="d-l" id="gal-h">Photos from the job.</h2></div><div class="sec-aside"><p>The full set is on Instagram. Higher-resolution originals will replace these phone screenshots before launch.</p></div></div>
    <div class="gallery${p.landscape ? ' gallery-land' : ''}">
      <figure class="g-item">${pic(p.before, { alt: p.alts.before, sizes: '(min-width: 1000px) 40vw, 100vw', pos: p.beforePos })}<figcaption class="fig-cap"><span class="mono">${p.beforeLabel || 'Before'}</span></figcaption></figure>
      <figure class="g-item">${pic(p.after, { alt: p.alts.after, sizes: '(min-width: 1000px) 40vw, 100vw', pos: p.afterPos })}<figcaption class="fig-cap"><span class="mono">${p.afterLabel || 'After'}</span></figcaption></figure>
      <a class="g-more" href="${biz.instagram}" target="_blank" rel="noopener"><span class="mono">More photos</span><b>See this job on Instagram</b>${arrow}</a>
    </div>
  </div>
</section>

<section class="band paper next-proj">
  <div class="wrap">
    <a class="next-link" href="${L('projects/' + next.slug)}">
      <span class="mono">Next project</span>
      <span class="d-l">${esc(next.title)} ${arrow}</span>
      <span class="next-thumb">${pic(next.after, { alt: '', sizes: '200px', pos: next.afterPos })}</span>
    </a>
  </div>
</section>
${cta({ title: 'Want results like this?', service: p.services[0] })}`;
    },
  });
});

// PROCESS ---------------------------------------------------------------
page('process', {
  title: `Our Process | ${biz.name}`,
  desc: 'How a Bighorn project runs, from the first call to the final walkthrough: walkthrough, free estimate, build and cleanup. Plus answers to common questions.',
  crumbs: [['', 'Home'], ['process', 'Our process']],
  ld: () => [faqLd(faq)],
  render() {
    return `
<section class="page-head night">
  <canvas class="topo" data-topo="head" aria-hidden="true"></canvas>
  <div class="wrap ph-grid">
    <div class="ph-copy">
      ${crumbs(this.crumbs)}
      <p class="label label-sand">Our process</p>
      <h1 class="d-xl">From first call to final walkthrough.</h1>
      <p class="lede on-night-2">The same five steps on a gate repair and on a full backyard. You talk to the owner the whole way through.</p>
    </div>
  </div>
</section>
<section class="band paper">
  <div class="wrap">
    ${processSteps(false)}
  </div>
</section>
<section class="band concrete">
  <div class="wrap g12">
    <div class="c-5"><p class="label">Before the walkthrough</p><h2 class="d-l">What helps us price it right.</h2></div>
    <div class="c-7"><ul class="ready-list">
      <li><b>Photos of the space</b><span>Wide shots from a few angles, plus anything that worries you: cracks, pooling, slopes.</span></li>
      <li><b>Rough measurements</b><span>Pacing it off is fine. We measure properly on site.</span></li>
      <li><b>What you want to use it for</b><span>Dinners outside, a place for the dog, parking a trailer. It changes the build.</span></li>
      <li><b>A budget range, if you have one</b><span>It lets us suggest the right materials instead of guessing.</span></li>
    </ul></div>
  </div>
</section>
<section class="band paper" aria-labelledby="faq-h">
  <div class="wrap g12">
    <div class="c-4"><p class="label">Questions</p><h2 class="d-l" id="faq-h">Before you call.</h2><p class="muted">Don’t see yours? Call or text <a href="tel:${biz.tel}">${biz.phone}</a>.</p></div>
    <div class="c-8">${faqList(faq)}</div>
  </div>
</section>
${cta()}`;
  },
});

// ABOUT ----------------------------------------------------------------
page('about', {
  title: `About Bighorn | ${biz.name}, Reno NV`,
  desc: `${biz.name} is owned and run by ${biz.owner}, a Reno contractor with a strong work ethic and hands-on experience. Licensed, insured and bonded in Nevada.`,
  crumbs: [['', 'Home'], ['about', 'About']],
  render() {
    return `
<section class="page-head night about-head">
  <canvas class="topo" data-topo="head" aria-hidden="true"></canvas>
  <div class="wrap ph-grid ph-media-grid">
    <div class="ph-copy">
      ${crumbs(this.crumbs)}
      <p class="label label-sand">About Bighorn</p>
      <h1 class="d-xl d-xl-s">A young company with an old-school work ethic.</h1>
      <p class="lede on-night-2">Bighorn Construction &amp; Hardscape is owned and run by ${esc(biz.owner)}. When you call, you talk to him. When the work starts, he is the one accountable for it.</p>
    </div>
    <div class="about-photo">${todoBox('Photo of Caleb on a job', 'A real photo of Caleb, ideally on site with tools or equipment. Portrait orientation works best here.')}</div>
  </div>
</section>
<section class="band paper">
  <div class="wrap g12">
    <div class="c-4"><p class="label">The story</p></div>
    <div class="c-8 prose">
      <p class="statement statement-s">In his own words: “${esc(biz.ownerIntro)}”</p>
      <p>Caleb started Bighorn to do the kind of work he would want done at his own house: concrete that drains, pavers that stay flat, lawns that take, and fences that stay straight. The company covers the whole yard, from dirt work and excavation to concrete, pavers, sprinklers, sod and fencing, plus remodels and commercial work.</p>
      <p>Bighorn is licensed, insured and bonded in Nevada (${license()}). Estimates are free.</p>
    </div>
  </div>
</section>
<section class="band concrete">
  <div class="wrap">
    <figure class="pull pull-xl" data-rise><blockquote><p>“${esc(biz.ownerQuote)}”</p></blockquote><figcaption><b>${esc(biz.owner)}</b><span>Owner</span></figcaption></figure>
  </div>
</section>
<section class="band paper values-sec">
  <div class="wrap">
    <div class="sec-head"><p class="label">How we work</p><h2 class="d-l">Three things we will not cut corners on.</h2></div>
    <ul class="values">
      <li data-rise><h3 class="d-m">Clean work</h3><p>Straight lines, tight joints, level surfaces. And a site that is cleaned up every time, not just at the end.</p></li>
      <li data-rise><h3 class="d-m">Straight answers</h3><p>Clear scope and price before work starts. If something is not a fit for us, we will tell you.</p></li>
      <li data-rise><h3 class="d-m">Pride in the result</h3><p>Outdoor spaces people are proud of. That is the goal on every job, small or large.</p></li>
    </ul>
  </div>
</section>
<section class="band night name-sec">
  <div class="wrap g12 name-grid">
    <figure class="c-5 name-crest">${crest(640, '', `${biz.name} crest`)}</figure>
    <div class="c-7">
      <p class="label label-sand">The name</p>
      <h2 class="d-l">Why a bighorn.</h2>
      <p class="lede on-night-2">The desert bighorn sheep is Nevada’s state animal. It lives on the roughest, steepest ground in the state and thrives there. That seemed like the right standard for a company that spends its days in rocky high-desert soil.</p>
      <p class="on-night-2">${esc(biz.tagline)}</p>
    </div>
  </div>
</section>
<section class="band paper">
  <div class="wrap g12">
    <figure class="c-7 about-job">${pic('office-demo', { alt: projBy('office-remodel').alts.after, sizes: '(min-width: 1000px) 56vw, 100vw' })}<figcaption class="fig-cap"><span class="mono">October 2026</span><span>A Bighorn crew member on a commercial remodel in progress.</span></figcaption></figure>
    <div class="c-5 about-cred">
      <p class="label">Credentials</p>
      <dl class="spec spec-ink">
        <div><dt>License</dt><dd>${license()}</dd></div>
        <div><dt>Insurance</dt><dd>Insured &amp; bonded</dd></div>
        <div><dt>Based in</dt><dd>${biz.city}, Nevada</dd></div>
        <div><dt>Work</dt><dd>Residential &amp; commercial</dd></div>
      </dl>
      <p class="muted small">Check any Nevada contractor’s license on the <a href="https://www.nscb.nv.gov/" target="_blank" rel="noopener">Nevada State Contractors Board</a> website.</p>
    </div>
  </div>
</section>
${cta()}`;
  },
});

// REVIEWS -------------------------------------------------------------
page('reviews', {
  title: `Reviews | ${biz.name}`,
  desc: `What clients say about ${biz.name}: concrete, pavers, backyards and remodels in Reno, Sparks and Northern Nevada.`,
  crumbs: [['', 'Home'], ['reviews', 'Reviews']],
  render() {
    return `
<section class="page-head night">
  <canvas class="topo" data-topo="head" aria-hidden="true"></canvas>
  <div class="wrap ph-grid">
    <div class="ph-copy">
      ${crumbs(this.crumbs)}
      <p class="label label-sand">Reviews</p>
      <h1 class="d-xl">What clients say.</h1>
      <p class="lede on-night-2">Real reviews from Bighorn clients, shown with their first name, town and project. We never publish reviews we did not receive.</p>
    </div>
  </div>
</section>
<section class="band paper">
  <div class="wrap rev-wall">
    ${todoBox('Featured review', 'The strongest Google review, shown large. Include the client’s first name, town and what was built.')}
    ${todoBox('Review 2', 'A second real review, ideally about a different kind of project.')}
    ${todoBox('Review 3', 'A third real review. Three is enough to start; add more as they come in.')}
    <div class="rev-cta">
      <p class="label">Worked with Bighorn?</p>
      <h2 class="d-m">Leave a review.</h2>
      <p>It helps neighbors find a contractor they can trust, and it means a lot to a small business.</p>
      ${biz.googleReviews ? `<a class="btn btn-ink" href="${biz.googleReviews}" target="_blank" rel="noopener">Review us on Google ${arrow}</a>` : `<p>${todo('Google review link to add')}</p>`}
    </div>
  </div>
</section>
<section class="band night work-sec">
  <div class="wrap">
    <div class="sec-head split"><div><p class="label label-sand">The work speaks too</p><h2 class="d-l">Judge it for yourself.</h2></div><div class="sec-aside on-night-2"><a class="link-arrow" href="${L('projects')}">All projects ${arrow}</a></div></div>
    <div class="work-grid work-grid-3">
      ${workCard(projBy('backyard-rebuild'), 'w-a')}
      ${workCard(projBy('side-yard-concrete'), 'w-b')}
      ${workCard(projBy('sod-install'), 'w-e')}
    </div>
  </div>
</section>
${cta()}`;
  },
});

// CONTACT ---------------------------------------------------------------
page('contact', {
  title: `Contact | ${biz.name}, Reno NV`,
  desc: `Call or text ${biz.phone} or email ${biz.email}. ${biz.name} serves Reno, Sparks, Carson City, Fernley, Fallon and nearby. Free estimates.`,
  crumbs: [['', 'Home'], ['contact', 'Contact']],
  render() {
    return `
<section class="page-head night contact-head">
  <canvas class="topo" data-topo="head" aria-hidden="true"></canvas>
  <div class="wrap ph-grid contact-grid">
    <div class="ph-copy">
      ${crumbs(this.crumbs)}
      <p class="label label-sand">Contact</p>
      <h1 class="d-xl">Talk to the owner.</h1>
      <p class="lede on-night-2">Call or text any time and Caleb will get back to you. For a full estimate request, the <a class="u-link" href="${L('quote')}">quote form</a> takes about two minutes.</p>
      <dl class="direct direct-xl">
        <div><dt>Call or text</dt><dd><a class="direct-val" href="tel:${biz.tel}">${biz.phone}</a><button class="copy" type="button" data-copy="${biz.phone}">Copy</button></dd></div>
        <div><dt>Email</dt><dd><a class="direct-val" href="mailto:${biz.email}">${biz.email}</a><button class="copy" type="button" data-copy="${biz.email}">Copy</button></dd></div>
        <div><dt>Instagram</dt><dd><a class="direct-val" href="${biz.instagram}" target="_blank" rel="noopener">${biz.igHandle}</a></dd></div>
        <div><dt>Based in</dt><dd><span class="direct-val">${biz.city}, Nevada</span></dd></div>
      </dl>
    </div>
    <div class="form-card">
      <p class="label">Send a message</p>
      <h2 class="d-m">Quick question or a small job?</h2>
      ${quoteForm({ compact: true })}
    </div>
  </div>
</section>
${areaSection()}
<section class="band concrete">
  <div class="wrap g12">
    <div class="c-4"><p class="label">Questions</p><h2 class="d-l">Common questions.</h2></div>
    <div class="c-8">${faqList(faq.slice(0, 5), 'faq-contact')}</div>
  </div>
</section>`;
  },
});

// QUOTE -----------------------------------------------------------------
page('quote', {
  title: `Request a Free Estimate | ${biz.name}`,
  desc: 'Request a free estimate from Bighorn Construction & Hardscape. Three short steps: project, details, contact. Concrete, pavers, backyards, sod, fencing, dirt work and remodels.',
  crumbs: [['', 'Home'], ['quote', 'Request a quote']],
  render() {
    return `
<section class="page-head night quote-head">
  <div class="wrap ph-grid">
    <div class="ph-copy">
      ${crumbs(this.crumbs)}
      <p class="label label-sand">Free estimate</p>
      <h1 class="d-xl">Tell us what you’re planning.</h1>
      <p class="lede on-night-2">Three short steps, about two minutes. Caleb will follow up to set up a walkthrough.</p>
    </div>
  </div>
</section>
<section class="band paper quote-sec">
  <div class="wrap quote-grid">
    <div class="form-card form-card-lg">${quoteForm()}</div>
    <aside class="quote-side">
      <p class="label">What happens next</p>
      <ol class="next-steps">
        <li><b>Caleb reviews your request</b><span>and gets back to you the way you asked.</span></li>
        <li><b>A walkthrough on site</b><span>to measure and talk options. Free.</span></li>
        <li><b>Your estimate</b><span>with the scope and price spelled out.</span></li>
      </ol>
      <div class="side-direct">
        <p class="label">Rather talk?</p>
        <a class="side-tel" href="tel:${biz.tel}">${biz.phone}</a>
        <p class="muted small">Call or text. Or email <a href="mailto:${biz.email}">${biz.email}</a>.</p>
      </div>
      <p class="side-cred">${crest(120, '', '')}<span>Licensed, insured &amp; bonded<br>${license()}</span></p>
    </aside>
  </div>
</section>`;
  },
});

// 404 ------------------------------------------------------------------
page('404', {
  title: `Page not found | ${biz.name}`,
  desc: 'This page does not exist.',
  noindex: true,
  render() {
    return `
<section class="page-head night nf">
  <canvas class="topo" data-topo="head" aria-hidden="true"></canvas>
  <div class="wrap ph-grid">
    <div class="ph-copy">
      <p class="label label-sand">404</p>
      <h1 class="d-xl">Nothing built here yet.</h1>
      <p class="lede on-night-2">The page you were looking for does not exist. Try one of these instead.</p>
      <div class="cta-row">${btn(L(''), 'Home', 'btn-clay btn-lg')}<a class="btn btn-ghost btn-lg" href="${L('projects')}">Projects</a><a class="btn btn-ghost btn-lg" href="${L('services')}">Services</a></div>
    </div>
  </div>
</section>`;
  },
});

// ---------------------------------------------------------------- render
function headFor(pg) {
  const ld = [...(pg.ld ? pg.ld() : []), ...(pg.crumbs ? [crumbLd(pg.crumbs)] : [])];
  if (pg.key !== '' && !pg.ld) ld.unshift({ ...bizLd(), '@context': 'https://schema.org' });
  const og = SITE_URL + '/' + (pg.ogImage || 'img/og-backyard.jpg');
  // The Claude Artifact preview keeps the gallery name it already has.
  return `<title>${esc(ARTIFACT && pg.key === '' ? biz.name : pg.title)}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="${attr(pg.desc)}">
${PREVIEW || pg.noindex ? '<meta name="robots" content="noindex, nofollow">' : '<meta name="robots" content="index, follow, max-image-preview:large">'}
${pg.key === '404' ? '' : `<link rel="canonical" href="${canonical(pg.key)}">`}
<meta property="og:type" content="website">
<meta property="og:site_name" content="${attr(biz.name)}">
<meta property="og:title" content="${attr(pg.title)}">
<meta property="og:description" content="${attr(pg.desc)}">
<meta property="og:url" content="${canonical(pg.key)}">
<meta property="og:image" content="${og}">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#16120F">
<link rel="icon" href="${A('img/crest-120.webp')}" type="image/webp">
<link rel="apple-touch-icon" href="${A('img/crest-180.png')}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,300..800&family=IBM+Plex+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="${A('assets/site.css')}">
${ld.map((x) => `<script type="application/ld+json">${JSON.stringify(x)}</script>`).join('\n')}`;
}

function renderPage(pg) {
  CUR = pg.key;
  const main = pg.render.call(pg);
  const head = headFor(pg);
  const body = `${header()}
<main id="main" class="site-main" data-page="${pg.key || 'home'}">
${main}
</main>
${footer()}
<script src="${A('assets/site.js')}" defer></script>`;
  if (ARTIFACT && pg.key === '') return `${head}\n<div class="site">${body}</div>\n`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${head}
</head>
<body>
<div class="site">${body}</div>
</body>
</html>
`;
}

// ---------------------------------------------------------------- write
if (!ARTIFACT && existsSync(OUT)) rmSync(OUT, { recursive: true });
mkdirSync(OUT, { recursive: true });
for (const pg of pages) {
  if (ARTIFACT && pg.key === '404') continue;
  const f = join(OUT, fileFor(pg.key));
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, renderPage(pg));
}
cpSync(join(ROOT, 'src/static/img'), join(OUT, 'img'), { recursive: true });
mkdirSync(join(OUT, 'assets'), { recursive: true });
writeFileSync(join(OUT, 'assets/site.css'), readFileSync(join(ROOT, 'src/site.css'), 'utf8'));
writeFileSync(join(OUT, 'assets/site.js'), readFileSync(join(ROOT, 'src/site.js'), 'utf8'));
if (!ARTIFACT) {
  const urls = pages.filter((p) => p.key !== '404').map((p) => `  <url><loc>${canonical(p.key)}</loc></url>`).join('\n');
  writeFileSync(join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  writeFileSync(join(OUT, 'robots.txt'), PREVIEW ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
}
console.log(`Built ${pages.length - (ARTIFACT ? 1 : 0)} pages -> ${OUT}${PREVIEW ? ' (preview: noindex)' : ''}`);
if (todos.size) {
  console.log(`\n${todos.size} item(s) still marked "to add" on the pages:`);
  for (const t of todos) console.log('  - ' + t);
  if (LAUNCH) console.log('\nWARNING: launching with placeholders still on the page.');
}
if (SITE_URL.includes('example.com')) console.log('\nNote: SITE_URL is not set, so canonical and Open Graph URLs use https://www.example.com.');
