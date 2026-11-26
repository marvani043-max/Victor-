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
const up = () => (ARTIFACT ? '' : CUR === '404' ? '/' : '../'.repeat(depth(CUR)));
const L = (k, hash = '') => {
  let h;
  if (ARTIFACT) h = fileFor(k);
  else if (CUR === '404') h = '/' + (k ? k + '/' : '');
  else h = up() + (k ? k + '/' : '') || './';
  return h + (hash ? '#' + hash : '');
};
const A = (p) => up() + p; // asset path
const canonical = (k) => SITE_URL + '/' + (k && k !== '404' ? k + '/' : '');

// ---------------------------------------------------------------- helpers
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const attr = esc;
const arrow = '<svg class="arr" width="18" height="12" viewBox="0 0 18 12" aria-hidden="true"><path d="M1 6h15M11 1l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="square"/></svg>';
const todo = (t) => (todos.add(t), `<span class="todo" title="To add before launch">${esc(t)}</span>`);
const todoBox = (title, text) => (todos.add(title), `<div class="todo-box"><p class="todo-label">To add before launch</p><p class="todo-title">${esc(title)}</p><p>${esc(text)}</p></div>`);
const svcBy = (s) => services.find((x) => x.slug === s);
const projBy = (s) => projects.find((x) => x.slug === s);
const license = () => (biz.license ? `NV Lic. #${esc(biz.license)}` : `NV Lic. ${todo('license # to add')}`);
const rule = '<span class="rule-line" aria-hidden="true"></span>';

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
  return `<img${cls ? ` class="${cls}"` : ''} src="${A('img/' + src)}" width="${w}" height="${w}" alt="${attr(alt)}" decoding="async">`;
};
const btn = (href, label, cls = 'btn-clay', extra = '') => `<a class="btn ${cls}" href="${href}"${extra}>${label}</a>`;
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
  telephone: '+1-775-440-3757',
  email: biz.email,
  address: { '@type': 'PostalAddress', addressLocality: biz.city, addressRegion: biz.region, addressCountry: 'US' },
  areaServed: towns.map((t) => ({ '@type': 'City', name: `${t.name}, NV` })),
  sameAs: [biz.instagram],
  priceRange: 'Free estimates',
  hasOfferCatalog: { '@type': 'OfferCatalog', name: 'Construction and hardscape services', itemListElement: services.map((s) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s.name, url: canonical('services/' + s.slug) } })) },
});

// ---------------------------------------------------------------- line icons + line art
const ICON = {
  concrete: '<path d="M14 3l7 7-8 3-2-2z"/><path d="M11 11l-7 7"/><path d="M3 21l1-1"/>',
  pavers: '<rect x="3" y="3" width="18" height="18"/><path d="M3 9h18M3 15h18M10 3v6M15 9v6M8 15v6"/>',
  tree: '<circle cx="12" cy="9" r="6"/><path d="M12 15v6M8 21h8M10 9l2 2 2-3"/>',
  drop: '<path d="M12 3c3.5 4.5 6 7.6 6 10.5a6 6 0 0 1-12 0C6 10.6 8.5 7.5 12 3z"/><path d="M9.5 14a2.5 2.5 0 0 0 2.5 2.5"/>',
  fence: '<path d="M5 21V7l2-3 2 3v14M15 21V7l2-3 2 3v14M3 10h18M3 17h18"/>',
  shovel: '<path d="M20 4l-8.5 8.5"/><path d="M18 2l4 4"/><path d="M11.5 12.5l-6 1.5-2 6.5 6.5-2 1.5-6z"/>',
  stairs: '<path d="M3 20h5v-4h4v-4h4V8h5"/>',
  building: '<rect x="5" y="3" width="14" height="18"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M11 21v-3h2v3"/>',
  mail: '<rect x="3" y="5" width="18" height="14"/><path d="M3 6l9 7 9-7"/>',
  phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  pin: '<path d="M12 21s-6-6.2-6-11a6 6 0 0 1 12 0c0 4.8-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/>',
  license: '<rect x="5" y="3" width="14" height="18"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  shield: '<path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6z"/><path d="M9 12l2 2 4-4"/>',
  seal: '<circle cx="12" cy="9" r="5.5"/><path d="M9 14l-2 7 5-3 5 3-2-7"/>',
  insta: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/>',
};
const icon = (k, size = 40, sw = 1.1) => `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;
const SVC_ICON = { concrete: 'concrete', 'pavers-hardscape': 'pavers', 'backyard-design': 'tree', 'sod-sprinklers': 'drop', 'fencing-gates': 'fence', 'excavation-grading': 'shovel', remodels: 'stairs' };
const ticks = (x1, x2, step, y, d = 'l2 -7') => { let s = ''; for (let x = x1; x <= x2; x += step) s += `M${x} ${y}${d}`; return s; };
const ART = {
  hardscape: `<path d="M0 236H420"/><path d="M14 236V98L84 58L154 98V236"/><path d="M6 103L84 52L162 103"/><rect x="38" y="124" width="42" height="46"/><path d="M59 124v46M38 147h42"/><rect x="104" y="152" width="40" height="84"/><path d="M124 152v84"/><path d="M196 236V126M392 236V126M186 126H404M186 118H404"/><path d="${ticks(200, 392, 24, 118, 'v-8')}"/><path d="M154 236L178 212H420M166 224H420"/><path d="${(() => { let s = ''; for (let x = 206; x <= 420; x += 30) s += `M${x} 212L${x - 14} 236`; return s; })()}"/><rect x="292" y="184" width="88" height="28"/><path d="M292 198H380M322 184V198M352 198V212"/><circle cx="306" cy="176" r="9"/><circle cx="328" cy="174" r="10"/><circle cx="352" cy="176" r="9"/><circle cx="371" cy="177" r="7"/>`,
  backyard: `<path d="M0 236H420"/><path d="M252 160H420M252 176H420"/><path d="${ticks(254, 420, 16, 152, 'V236')}"/><rect x="20" y="112" width="200" height="124"/><path d="M8 114L120 50L232 114"/><rect x="40" y="136" width="46" height="40"/><path d="M63 136v40M40 156h46"/><rect x="112" y="152" width="72" height="84"/><path d="M148 152v84"/><path d="M330 236V172"/><circle cx="330" cy="130" r="44"/><path d="M308 120a24 24 0 0 1 30-14M318 148a20 20 0 0 0 26-6"/><path d="${ticks(232, 410, 14, 236)}"/><circle cx="244" cy="226" r="10"/><circle cx="264" cy="228" r="8"/>`,
  commercial: `<path d="M0 236H420"/><rect x="60" y="40" width="300" height="196"/><path d="M52 40H368M52 32H368M52 32V40M368 32V40"/><path d="M60 122H360M60 130H360"/>${[84, 154, 224, 294].map((x) => `<rect x="${x}" y="62" width="50" height="46"/><path d="M${x + 25} 62v46"/>`).join('')}<rect x="84" y="146" width="194" height="90"/><path d="M132 146v90M180 146v90M228 146v90"/><rect x="298" y="154" width="40" height="82"/><path d="M290 146H346L340 136H296Z"/><path d="M30 236V204"/><circle cx="30" cy="190" r="16"/><path d="M394 236V204"/><circle cx="394" cy="190" r="16"/>`,
};
const art = (k, cls = 'entry-art') => `<svg class="${cls}" viewBox="0 0 420 240" fill="none" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round" aria-hidden="true" preserveAspectRatio="xMidYMax meet">${ART[k]}</svg>`;

// ---------------------------------------------------------------- shared blocks
const isActive = (k) => (k === '' ? CUR === '' : CUR === k || CUR.startsWith(k + '/'));
const navLink = ([k, label]) => `<a class="nav-link" href="${L(k)}"${isActive(k) ? ' aria-current="page"' : ''}>${label}</a>`;

function header() {
  const over = CUR === '';
  return `
<a class="skip" href="#main">Skip to content</a>
${PREVIEW ? `<div class="preview-bar" role="note"><div class="wrap"><span class="pv-dot" aria-hidden="true"></span><span><b>Website concept by Marvani</b> for ${esc(biz.name)}</span><span class="pv-sep">Preview, not live yet. Dashed tags mark details still to add.</span></div></div>` : ''}
<header class="site-head${over ? ' is-over' : ''}" id="site-head">
  <div class="head-in">
    <nav class="nav nav-l" aria-label="Main">
      ${navLink(['', 'Home'])}
      <div class="nav-item has-menu">
        <a class="nav-link" href="${L('services')}"${isActive('services') ? ' aria-current="page"' : ''}>Services</a>
        <button class="nav-caret" type="button" aria-expanded="false" aria-controls="mega"><span class="sr">Show services</span><svg width="10" height="6" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.4"/></svg></button>
        <div class="mega" id="mega">
          <ul class="mega-list">${services.map((s) => `<li><a href="${L('services/' + s.slug)}"${CUR === 'services/' + s.slug ? ' aria-current="page"' : ''}>${icon(SVC_ICON[s.slug], 26, 1.3)}<span><b>${esc(s.name)}</b><small>${esc(s.line)}</small></span></a></li>`).join('')}</ul>
        </div>
      </div>
      ${navLink(['projects', 'Projects'])}
      ${navLink(['process', 'Process'])}
    </nav>
    <a class="brand" href="${L('')}" aria-label="${attr(biz.name)}, home">${crest(120, 'brand-crest')}<span class="brand-txt"><b>Bighorn</b><small>Construction &amp; Hardscape</small></span></a>
    <nav class="nav nav-r" aria-label="Company">
      ${navLink(['about', 'About'])}
      ${navLink(['reviews', 'Reviews'])}
      ${navLink(['contact', 'Contact'])}
      <a class="btn btn-clay head-cta" href="tel:${biz.tel}">${biz.phone}</a>
    </nav>
    <button class="menu-btn" id="menu-btn" type="button" aria-expanded="false" aria-controls="mnav"><span class="menu-bars" aria-hidden="true"></span><span class="menu-lbl">Menu</span></button>
  </div>
</header>
<div class="mnav" id="mnav" hidden>
  <div class="mnav-in">
    <ul class="mnav-main">
      <li><a href="${L('')}">Home</a></li>
      <li><a href="${L('services')}">Services</a>
        <ul class="mnav-sub">${services.map((s) => `<li><a href="${L('services/' + s.slug)}">${esc(s.nav)}</a></li>`).join('')}</ul></li>
      ${[['projects', 'Projects'], ['process', 'Process'], ['about', 'About'], ['reviews', 'Reviews'], ['contact', 'Contact']].map(([k, l]) => `<li><a href="${L(k)}">${l}</a></li>`).join('')}
    </ul>
    <div class="mnav-cta">
      ${btn(L('quote'), 'Request a free estimate', 'btn-clay btn-lg')}
      <a class="btn btn-ghost btn-lg" href="tel:${biz.tel}">Call ${biz.phone}</a>
    </div>
  </div>
</div>`;
}

function footer() {
  const card = (href, ic, h, v) => `<a class="foot-card" href="${href}">${icon(ic, 40)}<span class="fc-h">${h}</span><span class="fc-v">${v}</span>${arrow}</a>`;
  return `
<footer class="site-foot">
  <div class="wrap">
    <div class="foot-cards">
      ${card(`mailto:${biz.email}`, 'mail', 'Email', esc(biz.email))}
      ${card(`tel:${biz.tel}`, 'phone', 'Call or text', biz.phone)}
      ${card(L('contact'), 'pin', 'Service area', 'Reno, Sparks and surrounding areas')}
    </div>
    <div class="foot-cols">
      <div class="foot-brand">
        <a href="${L('')}" aria-label="${attr(biz.name)}, home">${crest(240, 'foot-crest')}</a>
        <p class="foot-tag">${esc(biz.tagline)}</p>
        <p class="foot-lic">Licensed, insured &amp; bonded<br>${license()}</p>
        <a class="foot-ig" href="${biz.instagram}" target="_blank" rel="noopener" aria-label="Bighorn on Instagram">${icon('insta', 22, 1.4)}</a>
      </div>
      <div><h2 class="foot-h">Pages</h2><ul><li><a href="${L('')}">Home</a></li><li><a href="${L('about')}">About</a></li><li><a href="${L('projects')}">Projects</a></li><li><a href="${L('process')}">Our process</a></li><li><a href="${L('reviews')}">Reviews</a></li><li><a href="${L('contact')}">Contact</a></li><li><a href="${L('quote')}">Free estimate</a></li></ul></div>
      <div><h2 class="foot-h">Services</h2><ul>${services.map((s) => `<li><a href="${L('services/' + s.slug)}">${esc(s.nav.charAt(0).toUpperCase() + s.nav.slice(1))}</a></li>`).join('')}</ul></div>
      <div><h2 class="foot-h">Contact</h2><ul class="foot-contact"><li><a href="tel:${biz.tel}">${biz.phone}</a><span>Call or text</span></li><li><a href="mailto:${biz.email}">${biz.email}</a></li><li>${biz.city}, Nevada</li><li><span>Estimates are always free</span></li></ul></div>
    </div>
    <div class="foot-base">
      <span>&copy; ${YEAR} ${esc(biz.name)}. All rights reserved.</span>
      <span>${PREVIEW ? 'Website concept by Marvani' : 'Website by Marvani'}</span>
    </div>
  </div>
</footer>
<nav class="mbar" aria-label="Quick contact">
  <a href="tel:${biz.tel}">${icon('phone', 16, 1.8)}Call</a>
  <a href="sms:${biz.tel}"><svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>Text</a>
  <a class="go" href="${L('quote')}">Free estimate</a>
</nav>`;
}

function pageHead({ crumbs: cr, label, title, lede, image, pos = '50% 50%', extra = '' }) {
  return `
<section class="page-head${image ? '' : ' no-img'}">
  ${image ? `<div class="ph-bg" data-parallax aria-hidden="true">${pic(image, { alt: '', sizes: '100vw', pos, eager: true })}</div>` : '<canvas class="topo" data-topo="head" aria-hidden="true"></canvas>'}
  <div class="wrap ph-in">
    ${cr ? crumbs(cr) : ''}
    ${label ? `<p class="label label-sand">${label}</p>` : ''}
    <h1 class="d-xl">${title}</h1>
    ${rule}
    ${lede ? `<p class="lede">${lede}</p>` : ''}
    ${extra}
  </div>
</section>`;
}

function cta({ title = 'Ready to start your project?', text = 'Estimates are free. Call, text or send a few details and we will set up a walkthrough.', service = '' } = {}) {
  const id = 'cta-' + (CUR.replace(/\W/g, '') || 'home');
  return `
<section class="cta2" aria-labelledby="${id}">
  ${crest(640, 'cta2-mark')}
  <div class="wrap cta2-in">
    <h2 class="d-l" id="${id}">${title}</h2>
    <p class="cta2-sub">${text}</p>
    <div class="cta-row">${btn(service ? L('quote', service) : L('quote'), 'Get a free estimate', 'btn-clay btn-lg')}<a class="btn btn-ghost btn-lg" href="tel:${biz.tel}">Call ${biz.phone}</a></div>
  </div>
</section>`;
}

const secHead = (label, title, id, sub = '', dark = false) => `<div class="sec-center"><p class="label${dark ? ' label-sand' : ''}">${label}</p><h2 class="d-l" id="${id}">${title}</h2>${rule}${sub ? `<p class="sec-sub">${sub}</p>` : ''}</div>`;

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

function tile(p) {
  return `
<a class="tile${p.landscape ? ' is-land' : ''}" href="${L('projects/' + p.slug)}">
  ${pic(p.after, { alt: p.alts.after, sizes: '(min-width: 1000px) 34vw, 100vw', pos: p.afterPos })}
  ${pic(p.before, { alt: '', cls: 'tile-before', sizes: '(min-width: 1000px) 34vw, 100vw', pos: p.beforePos })}
  <span class="tile-flag">${p.status === 'In progress' ? '<i class="live" aria-hidden="true"></i>In progress' : '<span class="f-a">After</span><span class="f-b">Before</span>'}</span>
  <span class="tile-meta"><span class="mono">${esc(p.type)} &middot; ${esc(p.tags.slice(0, 2).join(', '))}</span><span class="tile-t">${esc(p.title)}</span></span>
</a>`;
}

function processSteps() {
  return `
<ol class="steps" data-steps>
  ${steps.map(([h, p, note], i) => `<li class="step"><span class="step-no">${String(i + 1).padStart(2, '0')}</span><h3 class="step-h">${h}</h3><p>${p}</p><p class="step-note">${note}</p></li>`).join('')}
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

function areaSection() {
  return `
<section class="band concrete area-sec" aria-labelledby="area-h">
  <div class="wrap area">
    <figure class="map-fig">${areaMap()}<figcaption class="fig-cap"><span class="mono">Drawn to scale</span><span>Dashed outline: main service area.</span></figcaption></figure>
    <div class="area-copy">
      <p class="label">Service area</p>
      <h2 class="d-l" id="area-h">Reno, Sparks and the valleys around them</h2>
      ${rule}
      <p>Based in Reno and working across the Truckee Meadows, south to Carson City, and east along I-80 and US-50 to Fernley and Fallon.</p>
      <ul class="towns">${towns.map((t, i) => `<li><button type="button" data-town="${t.id}"${i === 0 ? ' class="on"' : ''}>${t.name}</button></li>`).join('')}</ul>
      <p class="muted small">Not on the list? Call or text <a href="tel:${biz.tel}">${biz.phone}</a> and ask.</p>
    </div>
  </div>
</section>`;
}

// quote form ------------------------------------------------------------
function quoteForm({ compact = false } = {}) {
  const id = compact ? (CUR === '' ? 'hf' : 'cf') : 'qf';
  const typeChips = projectTypes.map(([v, l]) => `<label class="chip"><input type="checkbox" name="type" value="${attr(l)}" id="${id}-t-${v}" data-key="${v}"><span>${esc(l)}</span></label>`).join('');
  const contactFields = `
      <div class="f-row">
        <div class="field"><label for="${id}-name">Your name <i>required</i></label><input id="${id}-name" name="name" type="text" autocomplete="name" required data-label="Name"><p class="f-err" id="${id}-name-err" hidden>Add your name so we know who to ask for.</p></div>
        <div class="field"><label for="${id}-phone">Phone <i>required</i></label><input id="${id}-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" required data-label="Phone"><p class="f-err" id="${id}-phone-err" hidden>Add a phone number with area code, e.g. 775-555-0123.</p></div>
      </div>
      <div class="f-row">
        <div class="field"><label for="${id}-email">Email <i>optional</i></label><input id="${id}-email" name="email" type="email" autocomplete="email" data-label="Email"><p class="f-err" id="${id}-email-err" hidden>That email address looks incomplete.</p></div>
        <fieldset class="field"><legend>Best way to reach you</legend><div class="chips">${['Call', 'Text', 'Email'].map((m, i) => `<label class="chip"><input type="radio" name="contact" value="${m}" id="${id}-c-${m.toLowerCase()}"${i === 0 ? ' checked' : ''}><span>${m}</span></label>`).join('')}</div></fieldset>
      </div>`;
  if (compact) {
    return `
<form class="qform qform-compact" id="${id}" data-qform data-endpoint="${attr(ENDPOINT)}" novalidate>
  ${contactFields}
  <div class="field"><label for="${id}-msg">Project details <i>required</i></label><textarea id="${id}-msg" name="description" rows="4" required data-label="Project" placeholder="e.g. Concrete walkway down the side yard, about 6 by 40 feet, plus a gate"></textarea><p class="f-err" id="${id}-msg-err" hidden>Tell us a little about the project.</p></div>
  <div class="q-actions"><button class="btn btn-clay btn-lg" type="submit">Send message</button></div>
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
    <p class="f-hint">Photos help. After you send this, reply to our text or email with a few pictures of the space.</p>
  </fieldset>

  <fieldset class="q-step" data-step="3" hidden>
    <legend class="q-legend">How should we reach you?</legend>
    ${contactFields}
    <div class="field"><label for="${id}-addr">Street address <i>optional</i></label><input id="${id}-addr" name="address" type="text" autocomplete="street-address" data-label="Address"></div>
  </fieldset>

  <div class="q-actions">
    <button class="btn btn-ghost-ink" type="button" data-back hidden>Back</button>
    <button class="btn btn-clay btn-lg" type="button" data-next>Continue</button>
    <button class="btn btn-clay btn-lg" type="submit" data-submit hidden>Send request</button>
  </div>
  ${sendPanel(id)}
</form>`;
}

function sendPanel(id) {
  return `
  <div class="q-done" data-done hidden tabindex="-1">
    <div data-mode="handoff">
      <p class="label">Almost done</p>
      <h3 class="d-m">Send it to Bighorn.</h3>
      <p>Nothing has been sent yet. Pick how you want to send your request. Your text or email app opens with everything filled in, ready to send.</p>
      <pre class="q-msg" data-msg></pre>
      <div class="q-send">
        <a class="btn btn-clay" data-sms href="sms:${biz.tel}">Text it to ${biz.phone}</a>
        <a class="btn btn-ghost-ink" data-mail href="mailto:${biz.email}">Email it</a>
        <button class="btn btn-ghost-ink" type="button" data-copy-msg>Copy message</button>
      </div>
      <p class="q-status" data-status role="status">If no app opens, copy the message and send it to ${biz.phone} or ${biz.email}.</p>
      <button class="text-btn" type="button" data-edit>Edit my answers</button>
    </div>
    <div data-mode="sent" hidden>
      <p class="label">Request sent</p>
      <h3 class="d-m">Thanks. We have your request.</h3>
      <p data-sent-text>We will reach out soon.</p>
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
    const slides = [['backyard-after', '50% 62%'], ['sod-after', '50% 55%'], ['sideyard-after', '50% 60%']];
    const entries = [
      ['services/pavers-hardscape', 'hardscape', 'pavers', 'Hardscape &amp; concrete'],
      ['services/backyard-design', 'backyard', 'tree', 'Backyards &amp; landscaping'],
      ['services/remodels', 'commercial', 'building', 'Remodels &amp; commercial'],
    ];
    const ring = (ic, h, p) => `<li class="ring" data-ring><span class="ring-c"><svg class="ring-svg" viewBox="0 0 120 120" aria-hidden="true"><circle class="ring-track" cx="60" cy="60" r="56"/><circle class="ring-bar" cx="60" cy="60" r="56"/></svg>${icon(ic, 40, 1.2)}</span><h3 class="d-s">${h}</h3><p>${p}</p></li>`;
    return `
<section class="hero" data-hero aria-labelledby="hero-h">
  <div class="hero-bg" aria-hidden="true">
    ${slides.map(([img, pos], i) => `<div class="hero-slide${i === 0 ? ' is-on' : ''}">${pic(img, { alt: '', sizes: '100vw', pos, eager: i === 0, defer: i > 0 })}</div>`).join('')}
  </div>
  <div class="hero-in">
    <h1 class="hero-h" id="hero-h"><span class="hn-1">Bighorn</span><span class="hn-2">Construction &amp; Hardscape</span></h1>
    <p class="hero-tag">Concrete <i>&middot;</i> Pavers <i>&middot;</i> Landscaping <i>&middot;</i> Remodels <span>in Reno, Sparks &amp; Northern Nevada</span></p>
    <div class="cta-row">${btn(L('quote'), 'Request a free estimate', 'btn-ghost btn-lg')}</div>
  </div>
</section>

<section class="entry" aria-label="What we build">
  <div class="wrap entry-grid">
    ${entries.map(([href, a, ic, t]) => `<a class="entry-card" href="${L(href)}">${art(a)}${icon(ic, 46, 1)}<span class="entry-t">${t}</span></a>`).join('')}
  </div>
</section>

<section class="band paper intro2" aria-labelledby="intro-h">
  <div class="wrap two-col">
    <div class="intro2-l" data-rise>
      <h2 class="d-strong" id="intro-h">Tough work.<br>Flawless results.</h2>
      ${rule}
      <blockquote class="owner-q"><p>“${esc(biz.ownerQuote)}”</p></blockquote>
      <p class="owner-sig">The owner <span>&middot; ${esc(biz.name)}</span></p>
    </div>
    <div class="intro2-r" data-rise>
      <p>${esc(biz.name)} is an owner-run company in Reno, Nevada. We build the ground around homes and businesses: concrete walkways and pads, paver patios, sod and sprinkler systems, fences and gates, and the dirt work underneath all of it.</p>
      <p>We are licensed, insured and bonded. Estimates are free, and the person you talk to on the phone is the person responsible for your job.</p>
      ${btn(L('about'), 'About us')}
    </div>
  </div>
</section>

<section class="svc2" aria-labelledby="svc-h">
  ${art('backyard', 'svc2-bg')}
  <div class="wrap">
    ${secHead('Our services', 'From the ground up', 'svc-h', '', true)}
    <ul class="svc2-grid">
      ${services.map((s) => `<li><a class="svc2-item" href="${L('services/' + s.slug)}">${icon(SVC_ICON[s.slug], 38, 1.1)}<span class="svc2-t">${esc(s.name)}</span><span class="svc2-d">${esc(s.line)}</span></a></li>`).join('')}
    </ul>
  </div>
</section>

<section class="band paper big-sec" aria-labelledby="big-h">
  <div class="wrap">
    <div class="big-stage"><span class="big-word" aria-hidden="true">Free</span><h2 class="big-title" id="big-h">Estimates on every job</h2></div>
    <ul class="rings">
      ${ring('license', 'Licensed', `A Nevada contractor’s license: ${license()}.`)}
      ${ring('shield', 'Insured', 'Insured for the work we do on your property, big job or small.')}
      ${ring('seal', 'Bonded', 'A contractor’s bond backs our license, as Nevada requires.')}
    </ul>
  </div>
</section>

${cta()}

<section class="band paper split2" aria-labelledby="split-h">
  <div class="wrap two-col">
    <div class="split2-copy" data-rise>
      <h2 class="d-strong" id="split-h">The whole yard,<br>one crew.</h2>
      ${rule}
      <p>Most outdoor projects need dirt work, a solid base, the surface, water and a fence. We do all of it on one schedule, so you are not lining up three contractors and hoping they show up in the right order.</p>
      <p>We work across Reno, Sparks, Sun Valley, Spanish Springs, Carson City, Fernley, Fallon and the towns between.</p>
      ${btn(L('services'), 'Our services')}
    </div>
    <figure class="split2-fig"><span class="vlabel" aria-hidden="true">Reno &middot; Sparks</span>${pic('sod-after', { alt: projBy('sod-install').alts.after, sizes: '(min-width: 1000px) 46vw, 100vw', pos: '50% 60%' })}</figure>
  </div>
</section>

<section class="band concrete tiles-sec" aria-labelledby="work-h">
  <div class="wrap">
    ${secHead('Our work', 'Before &amp; after', 'work-h', 'Photos from our own jobs. Hover a project to see where it started.')}
    <div class="tiles">
      ${['backyard-rebuild', 'side-yard-concrete', 'sod-install', 'staircase-renovation', 'office-remodel'].map((k) => tile(projBy(k))).join('')}
    </div>
    <div class="center-row">${btn(L('projects'), 'All projects', 'btn-ink')}</div>
  </div>
</section>

<section class="quote-band" aria-labelledby="rev-h">
  <div class="qb-bg" data-parallax aria-hidden="true">${pic('backyard-after', { alt: '', sizes: '100vw', pos: '50% 40%' })}</div>
  <div class="wrap qb-in">
    <h2 class="d-xl" id="rev-h">What clients say</h2>
    ${todoBox('A real client review', 'Paste a Google review here, with the client’s first name, town and project. We will not publish made-up reviews.')}
    <a class="link-arrow" href="${L('reviews')}">All reviews ${arrow}</a>
  </div>
</section>

<section class="band paper contact2" aria-labelledby="ct-h">
  <div class="wrap contact2-in">
    ${secHead('Contact', 'Tell us about your project', 'ct-h', `Or call or text <a href="tel:${biz.tel}">${biz.phone}</a>. Estimates are free.`)}
    ${quoteForm({ compact: true })}
  </div>
</section>`;
  },
});

// SERVICES INDEX -------------------------------------------------------
page('services', {
  title: `Services | ${biz.name}, Reno NV`,
  desc: 'Concrete, pavers and hardscape, backyard design, sod and sprinkler systems, fencing and gates, dirt work and excavation, and remodels in Reno, Sparks and Northern Nevada.',
  crumbs: [['', 'Home'], ['services', 'Services']],
  render() {
    return `
${pageHead({ crumbs: this.crumbs, label: 'Our services', title: 'Everything from the dirt up', lede: 'Seven kinds of work, one contractor. Most projects use three or four of them, which is why it helps when the same crew does all of it.', image: 'backyard-after', pos: '50% 60%' })}
<section class="band paper svc-index">
  <div class="wrap">
    ${services.map((s, i) => `
    <article class="svc-block${i % 2 ? ' flip' : ''}" id="${s.slug}">
      <a class="svc-block-media${s.card ? ' is-dwg' : ''}" href="${L('services/' + s.slug)}" tabindex="-1" aria-hidden="true">${pic(s.card || s.image, { alt: '', sizes: '(min-width: 1000px) 40vw, 100vw', pos: s.card ? s.cardPos : s.imagePos })}${s.card ? '<span class="dwg-tag">Typical detail drawing</span>' : ''}</a>
      <div class="svc-block-copy">
        <span class="svc-ico">${icon(SVC_ICON[s.slug], 40, 1.1)}</span>
        <h2 class="d-strong"><a href="${L('services/' + s.slug)}">${esc(s.name)}</a></h2>
        ${rule}
        <p>${esc(s.lede)}</p>
        <ul class="tick-list">${s.includes.slice(0, 6).map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
        <div class="cta-row">${btn(L('services/' + s.slug), 'Learn more', 'btn-ink')}<a class="btn btn-ghost-ink" href="${L('quote', s.slug)}">Get a quote</a></div>
      </div>
    </article>`).join('')}
  </div>
</section>
${cta()}`;
  },
});

// SERVICE PAGES --------------------------------------------------------
services.forEach((s) => {
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
${pageHead({ crumbs: this.crumbs, label: 'Reno &amp; Sparks, Nevada', title: esc(s.name), lede: esc(s.lede), image: s.image, pos: s.imagePos, extra: `<div class="cta-row">${btn(L('quote', s.slug), 'Get a free estimate', 'btn-clay btn-lg')}<a class="btn btn-ghost btn-lg" href="tel:${biz.tel}">Call ${biz.phone}</a></div>` })}

<section class="band paper">
  <div class="wrap g12 svc-detail">
    <div class="c-7 prose">
      <h2 class="d-strong">${esc(s.h1)}</h2>
      ${rule}
      <p class="statement">${esc(s.body[0])}</p>
      <p>${esc(s.body[1])}</p>
    </div>
    <div class="c-5 svc-incl">
      <p class="label">What’s included</p>
      <ul class="incl-list">${s.includes.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
    </div>
  </div>
</section>

<section class="band concrete">
  <div class="wrap">
    ${secHead('How we do it', 'The order of work', 'method-h')}
    <ol class="method">${s.steps.map(([h, t], i) => `<li data-rise><span class="method-no">${String(i + 1).padStart(2, '0')}</span><h3 class="d-s">${esc(h)}</h3><p>${esc(t)}</p></li>`).join('')}</ol>
  </div>
</section>

${s.drawing ? `
<section class="band paper dwg-sec" aria-labelledby="dwg-h">
  <div class="wrap dwg-grid">
    <figure class="dwg-fig">${pic(s.drawing.img, { alt: s.drawing.alt, sizes: '(min-width: 1000px) 52vw, 100vw' })}<figcaption class="fig-cap"><span class="mono">Drawing ${s.drawing.no} &middot; typical detail</span><span>An illustration of how this work is usually built, not a photo of a specific job.</span></figcaption></figure>
    <div class="dwg-copy">
      <p class="label">Typical detail</p>
      <h2 class="d-strong" id="dwg-h">${esc(s.drawing.h)}</h2>
      ${rule}
      <dl class="spec spec-ink spec-1">${s.drawing.notes.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      <p class="muted small">Typical numbers for Northern Nevada homes. Your soil, slope and use set the final specs, and they are written into your estimate.</p>
    </div>
  </div>
</section>` : ''}

<section class="band night proj-feature" aria-labelledby="pf-h">
  <div class="wrap pf-grid">
    ${compare(p, { caption: false, sizes: '(min-width: 1100px) 30vw, 100vw' })}
    <div class="pf-copy">
      <p class="label label-sand">${s.slug === p.services[0] ? 'Project' : 'Related project'}</p>
      <h2 class="d-strong" id="pf-h">${esc(p.title)}</h2>
      ${rule}
      <p>${esc(p.summary)}</p>
      <ul class="tag-list">${p.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      <a class="link-arrow" href="${L('projects/' + p.slug)}">See the full project ${arrow}</a>
    </div>
  </div>
</section>

<section class="band paper">
  <div class="wrap g12">
    <div class="c-4"><p class="label">Questions</p><h2 class="d-strong">Common questions</h2>${rule}<p class="muted">Something else? Call or text <a href="tel:${biz.tel}">${biz.phone}</a>.</p></div>
    <div class="c-8">${faqList(s.faq, 'faq-' + s.slug)}</div>
  </div>
</section>

<section class="band concrete other-svc" aria-labelledby="os-h">
  <div class="wrap">
    <p class="label" id="os-h">Other services</p>
    <ul class="other-list">${others.map((o) => `<li><a href="${L('services/' + o.slug)}">${icon(SVC_ICON[o.slug], 26, 1.3)}<span>${esc(o.name)}</span>${arrow}</a></li>`).join('')}</ul>
  </div>
</section>
${cta({ service: s.slug })}`;
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
${pageHead({ crumbs: this.crumbs, label: 'Our work', title: 'Projects', lede: 'Real Bighorn jobs, photographed on site. Pick one to see what was there, what we built, and how it turned out.', image: 'sod-after', pos: '50% 55%' })}
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
          <p class="mono">${esc(p.type)}${p.date ? ' &middot; ' + esc(p.date) : ''}${p.status === 'In progress' ? ' &middot; <span class="live-tag"><i class="live" aria-hidden="true"></i>In progress</span>' : ''}</p>
          <h2 class="d-strong"><a href="${L('projects/' + p.slug)}">${esc(p.title)}</a></h2>
          ${rule}
          <p>${esc(p.summary)}</p>
          <ul class="tag-list tag-list-ink">${p.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
          ${btn(L('projects/' + p.slug), 'View project', 'btn-ink')}
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
${pageHead({ crumbs: this.crumbs, label: `${esc(p.type)} project${p.status === 'In progress' ? ' &middot; <span class="live-tag"><i class="live" aria-hidden="true"></i>In progress</span>' : ''}`, title: esc(p.title), lede: esc(p.summary), image: p.after, pos: p.afterPos })}

<section class="band paper">
  <div class="wrap g12">
    <div class="c-4">
      <p class="label">Project details</p>
      <dl class="spec spec-ink spec-1">
        <div><dt>Type</dt><dd>${esc(p.type)}</dd></div>
        <div><dt>Location</dt><dd>${p.location ? esc(p.location) : todo('town to confirm')}</dd></div>
        <div><dt>Status</dt><dd>${esc(p.status)}</dd></div>
        <div><dt>Posted</dt><dd>${p.date ? esc(p.date) : todo('date to confirm')}</dd></div>
        <div><dt>Services</dt><dd>${svcLinks}</dd></div>
      </dl>
    </div>
    <div class="c-8 prose">
      <h2 class="d-strong">${esc(p.long)}</h2>
      ${rule}
      <p class="statement">${esc(p.challenge)}</p>
      ${p.quote ? `<figure class="pull"><blockquote><p>“${esc(p.quote)}”</p></blockquote><figcaption>${esc(biz.name)} <span>&middot; on Instagram</span></figcaption></figure>` : ''}
    </div>
  </div>
</section>

<section class="band night ba-sec" aria-labelledby="ba-h">
  <div class="wrap">
    ${secHead(p.landscape ? 'Progress' : 'Before &amp; after', p.landscape ? 'Where it stands' : 'What changed', 'ba-h', p.landscape ? 'Photos from the first phase. Finished photos will go up when the remodel is complete.' : 'Same property, photographed before the work started and after it was finished.', true)}
    ${compare(p, { big: true, caption: false, sizes: '(min-width: 1100px) 44vw, 100vw' })}
  </div>
</section>

<section class="band paper">
  <div class="wrap case">
    <div class="case-block"><p class="label">The challenge</p><p>${esc(p.challenge)}</p></div>
    <div class="case-block"><p class="label">What we did</p><p>${esc(p.solution)}</p></div>
    <div class="case-block"><p class="label">The result</p><p>${esc(p.result)}</p></div>
    <div class="case-block"><p class="label">Scope of work</p><ul class="tick-list">${p.scope.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>
    <div class="case-block"><p class="label">Materials</p>${p.materials.length ? `<ul class="tick-list">${p.materials.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : `<p class="muted">To be listed when the remodel is finished.</p>`}<p class="case-todo">${todo('confirm materials, size and timeline')}</p></div>
  </div>
</section>

<section class="band concrete gallery-sec" aria-labelledby="gal-h">
  <div class="wrap">
    ${secHead('Gallery', 'Photos from the job', 'gal-h', 'The full set is on Instagram. Higher-resolution originals will replace these before launch.')}
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
      <span class="d-strong">${esc(next.title)} ${arrow}</span>
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
${pageHead({ crumbs: this.crumbs, label: 'How it works', title: 'Our process', lede: 'The same five steps on a gate repair and on a full backyard. You talk to the owner the whole way through.', image: 'sod-before', pos: '50% 55%' })}
<section class="band paper">
  <div class="wrap">
    ${secHead('Five steps', 'From first call to final walkthrough', 'steps-h')}
    ${processSteps()}
  </div>
</section>
<section class="band concrete">
  <div class="wrap g12">
    <div class="c-5"><p class="label">Before the walkthrough</p><h2 class="d-strong">What helps us price it right</h2>${rule}</div>
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
    <div class="c-4"><p class="label">Questions</p><h2 class="d-strong" id="faq-h">Before you call</h2>${rule}<p class="muted">Don’t see yours? Call or text <a href="tel:${biz.tel}">${biz.phone}</a>.</p></div>
    <div class="c-8">${faqList(faq)}</div>
  </div>
</section>
${cta()}`;
  },
});

// ABOUT ----------------------------------------------------------------
page('about', {
  title: `About Bighorn | ${biz.name}, Reno NV`,
  desc: `${biz.name} is an owner-run Reno contractor with a strong work ethic and hands-on experience in the trade. Licensed, insured and bonded in Nevada.`,
  crumbs: [['', 'Home'], ['about', 'About']],
  render() {
    return `
${pageHead({ crumbs: this.crumbs, label: 'About us', title: 'About Bighorn', lede: 'An owner-run Reno company with an old-school work ethic: show up, do it properly, clean up.', image: 'sideyard-after', pos: '50% 60%' })}
<section class="band paper">
  <div class="wrap two-col about-story">
    <div class="about-photo">${todoBox('Photo of the owner on a job', 'A real photo of the owner on site, ideally with tools or equipment. Portrait orientation works best here.')}</div>
    <div class="prose">
      <p class="label">Our story</p>
      <h2 class="d-strong">A young company with an old-school work ethic.</h2>
      ${rule}
      <p class="statement">Bighorn is run by a young contractor with a strong work ethic and a lot of hands-on experience in the trade.</p>
      <p>The company was started to do the kind of work you would want done at your own house: concrete that drains, pavers that stay flat, lawns that take, and fences that stay straight. We cover the whole yard, from dirt work and excavation to concrete, pavers, sprinklers, sod and fencing, plus remodels and commercial work.</p>
      <p>When you call, you talk to the owner, and the owner is accountable for the work. Bighorn is licensed, insured and bonded in Nevada (${license()}), and estimates are free.</p>
    </div>
  </div>
</section>
<section class="band concrete">
  <div class="wrap">
    <figure class="pull pull-xl" data-rise><blockquote><p>“${esc(biz.ownerQuote)}”</p></blockquote><figcaption>The owner <span>&middot; ${esc(biz.name)}</span></figcaption></figure>
  </div>
</section>
<section class="band paper values-sec">
  <div class="wrap">
    ${secHead('How we work', 'Three things we won’t cut corners on', 'values-h')}
    <ul class="values">
      <li data-rise><h3 class="d-s">Clean work</h3><p>Straight lines, tight joints, level surfaces. And a site that is cleaned up every time, not just at the end.</p></li>
      <li data-rise><h3 class="d-s">Straight answers</h3><p>Clear scope and price before work starts. If something is not a fit for us, we will tell you.</p></li>
      <li data-rise><h3 class="d-s">Pride in the result</h3><p>Outdoor spaces people are proud of. That is the goal on every job, small or large.</p></li>
    </ul>
  </div>
</section>
<section class="band night name-sec">
  <div class="wrap two-col name-grid">
    <figure class="name-crest">${crest(640, '', `${biz.name} crest`)}</figure>
    <div>
      <p class="label label-sand">The name</p>
      <h2 class="d-strong">Why a bighorn</h2>
      ${rule}
      <p class="on-night-2">The desert bighorn sheep is Nevada’s state animal. It lives on the roughest, steepest ground in the state and thrives there. That seemed like the right standard for a company that spends its days in rocky high-desert soil.</p>
      <p class="on-night-2">${esc(biz.tagline)}</p>
    </div>
  </div>
</section>
<section class="band paper">
  <div class="wrap g12">
    <figure class="c-7 about-job">${pic('office-demo', { alt: projBy('office-remodel').alts.after, sizes: '(min-width: 1000px) 56vw, 100vw' })}<figcaption class="fig-cap"><span class="mono">October 2026</span><span>A Bighorn crew member on a commercial remodel in progress.</span></figcaption></figure>
    <div class="c-5 about-cred">
      <p class="label">Credentials</p>
      <dl class="spec spec-ink spec-1">
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
${pageHead({ crumbs: this.crumbs, label: 'Reviews', title: 'What clients say', lede: 'Real reviews from Bighorn clients, shown with their first name, town and project. We never publish reviews we did not receive.', image: 'stairs-after', pos: '50% 45%' })}
<section class="band paper">
  <div class="wrap rev-wall">
    ${todoBox('Featured review', 'The strongest Google review, shown large. Include the client’s first name, town and what was built.')}
    ${todoBox('Review 2', 'A second real review, ideally about a different kind of project.')}
    ${todoBox('Review 3', 'A third real review. Three is enough to start; add more as they come in.')}
    <div class="rev-cta">
      <p class="label">Worked with Bighorn?</p>
      <h2 class="d-strong">Leave a review</h2>
      ${rule}
      <p>It helps neighbors find a contractor they can trust, and it means a lot to a small business.</p>
      ${biz.googleReviews ? `<a class="btn btn-ink" href="${biz.googleReviews}" target="_blank" rel="noopener">Review us on Google</a>` : `<p>${todo('Google review link to add')}</p>`}
    </div>
  </div>
</section>
<section class="band night work-sec">
  <div class="wrap">
    ${secHead('The work speaks too', 'Judge it for yourself', 'judge-h', '', true)}
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
${pageHead({ crumbs: this.crumbs, label: 'Contact', title: 'Talk to the owner', lede: `Call or text any time and we will get back to you. For a full estimate request, the <a class="u-link" href="${L('quote')}">quote form</a> takes about two minutes.`, image: 'backyard-after', pos: '50% 35%' })}
<section class="band paper">
  <div class="wrap two-col contact-grid">
    <div class="contact-direct">
      <p class="label">Reach us directly</p>
      <h2 class="d-strong">Call, text or email</h2>
      ${rule}
      <dl class="direct direct-ink">
        <div><dt>Call or text</dt><dd><a class="direct-val" href="tel:${biz.tel}">${biz.phone}</a><button class="copy" type="button" data-copy="${biz.phone}">Copy</button></dd></div>
        <div><dt>Email</dt><dd><a class="direct-val" href="mailto:${biz.email}">${biz.email}</a><button class="copy" type="button" data-copy="${biz.email}">Copy</button></dd></div>
        <div><dt>Instagram</dt><dd><a class="direct-val" href="${biz.instagram}" target="_blank" rel="noopener">${biz.igHandle}</a></dd></div>
        <div><dt>Based in</dt><dd><span class="direct-val">${biz.city}, Nevada</span></dd></div>
      </dl>
    </div>
    <div class="form-card">
      <p class="label">Send a message</p>
      <h2 class="d-strong">Quick question or a small job?</h2>
      ${rule}
      ${quoteForm({ compact: true })}
    </div>
  </div>
</section>
${areaSection()}
<section class="band paper">
  <div class="wrap g12">
    <div class="c-4"><p class="label">Questions</p><h2 class="d-strong">Common questions</h2>${rule}</div>
    <div class="c-8">${faqList(faq.slice(0, 5), 'faq-contact')}</div>
  </div>
</section>`;
  },
});

// QUOTE -----------------------------------------------------------------
page('quote', {
  title: `Request a Free Estimate | ${biz.name}`,
  desc: 'Request a free estimate from Bighorn Construction & Hardscape. Three short steps: project, details, contact. Concrete, pavers, backyards, sod, fencing, dirt work and remodels.',
  crumbs: [['', 'Home'], ['quote', 'Free estimate']],
  render() {
    return `
${pageHead({ crumbs: this.crumbs, label: 'Free estimate', title: 'Request a quote', lede: 'Three short steps, about two minutes. We will follow up to set up a walkthrough.', image: 'backyard-before', pos: '50% 50%' })}
<section class="band paper quote-sec">
  <div class="wrap quote-grid">
    <div class="form-card form-card-lg">${quoteForm()}</div>
    <aside class="quote-side">
      <p class="label">What happens next</p>
      <ol class="next-steps">
        <li><b>We review your request</b><span>and get back to you the way you asked.</span></li>
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
${pageHead({ label: '404', title: 'Nothing built here yet', lede: 'The page you were looking for does not exist. Try one of these instead.', extra: `<div class="cta-row">${btn(L(''), 'Home', 'btn-clay btn-lg')}<a class="btn btn-ghost btn-lg" href="${L('projects')}">Projects</a><a class="btn btn-ghost btn-lg" href="${L('services')}">Services</a></div>` })}`;
  },
});

// ---------------------------------------------------------------- render
function headFor(pg) {
  const ld = [...(pg.ld ? pg.ld() : []), ...(pg.crumbs ? [crumbLd(pg.crumbs)] : [])];
  if (pg.key !== '' && !pg.ld) ld.unshift(bizLd());
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
<meta name="theme-color" content="#1c1c1c">
<link rel="icon" href="${A('img/crest-120.webp')}" type="image/webp">
<link rel="apple-touch-icon" href="${A('img/crest-180.png')}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Jost:wght@200;300;400;500;600&family=Mulish:ital,wght@0,300;0,400;0,600;1,400&display=swap">
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
