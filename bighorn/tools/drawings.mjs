#!/usr/bin/env node
// Typical-detail construction drawings for the service pages.
// These are illustrations of how the work is usually built, labelled as such on the
// site. They are not photos and never stand in for a Bighorn job.
//
//   node tools/drawings.mjs        -> src/drawings/*.svg and src/img-master/dwg-*.png
//
// The PNG step uses Playwright (pre-installed in Claude Code cloud sessions) so the
// drawings render in the site's own fonts. Then run `python3 tools/images.py web`.

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BG = '#1e1814', LINE = '#efe8dc', SAND = '#cfb58a', CLAY = '#dd7a2f', GREEN = '#8a9663', WATER = '#9fb4ba';

// ---------------------------------------------------------------- helpers
const t = (x, y, s, cls = 't', a = 'start', extra = '') => `<text x="${x}" y="${y}" class="${cls}" text-anchor="${a}"${extra}>${s}</text>`;
function co(px, py, lx, ly, lines, a = 'start', cls = 't') {
  const dx = a === 'start' ? 16 : -16;
  return `<g class="co"><circle cx="${px}" cy="${py}" r="3.6" class="dot"/><path class="lead" d="M${px} ${py}L${lx} ${ly}h${dx}"/>${lines.map((s, i) => t(lx + dx + (a === 'start' ? 6 : -6), ly + 5 + i * 21, s, cls, a)).join('')}</g>`;
}
function dimH(x1, x2, y, label, above = true) {
  return `<g class="dim"><path d="M${x1} ${y}H${x2}M${x1} ${y - 7}v14M${x2} ${y - 7}v14M${x1 - 5} ${y + 5}l10 -10M${x2 - 5} ${y + 5}l10 -10"/>${t((x1 + x2) / 2, above ? y - 12 : y + 24, label, 't tb', 'middle')}</g>`;
}
function dimV(x, y1, y2, label, side = 'right') {
  const tx = side === 'right' ? x + 14 : x - 14;
  return `<g class="dim"><path d="M${x} ${y1}V${y2}M${x - 7} ${y1}h14M${x - 7} ${y2}h14M${x - 5} ${y1 + 5}l10 -10M${x - 5} ${y2 + 5}l10 -10"/>${t(tx, (y1 + y2) / 2 + 5, label, 't tb', side === 'right' ? 'start' : 'end')}</g>`;
}
const arrow = (x1, y1, x2, y2, cls = 'water') => {
  const a = Math.atan2(y2 - y1, x2 - x1), h = 9;
  const p1 = [x2 - h * Math.cos(a - 0.45), y2 - h * Math.sin(a - 0.45)], p2 = [x2 - h * Math.cos(a + 0.45), y2 - h * Math.sin(a + 0.45)];
  return `<path class="${cls}" d="M${x1} ${y1}L${x2} ${y2}M${p1[0].toFixed(1)} ${p1[1].toFixed(1)}L${x2} ${y2}L${p2[0].toFixed(1)} ${p2[1].toFixed(1)}"/>`;
};

function frame(no, title, sub, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000">
<style>
.l{fill:none;stroke:${LINE};stroke-opacity:.85;stroke-width:1.8;stroke-linejoin:round;stroke-linecap:round}
.l2{fill:none;stroke:${LINE};stroke-opacity:.4;stroke-width:1.1}
.hid{fill:none;stroke:${LINE};stroke-opacity:.5;stroke-width:1.3;stroke-dasharray:7 5}
.sand{stroke:${SAND};stroke-opacity:1}.clay{stroke:${CLAY};stroke-opacity:1}.grn{stroke:${GREEN};stroke-opacity:1}
.water{fill:none;stroke:${WATER};stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.t{font:500 15px 'IBM Plex Mono',monospace;fill:#b6ab9c;letter-spacing:.03em;paint-order:stroke;stroke:${BG};stroke-width:6px;stroke-linejoin:round}
.tb{fill:${LINE}}.tc{fill:#eb8b41}.ts{fill:${SAND}}.tw{fill:${WATER}}
.sm{font-size:12px;letter-spacing:.14em}
.h{font:600 30px 'Archivo',sans-serif;font-stretch:112%;fill:${LINE};letter-spacing:-.01em}
.dot{fill:${SAND}}.lead{fill:none;stroke:${SAND};stroke-width:1.2}
.dim path{fill:none;stroke:${LINE};stroke-opacity:.6;stroke-width:1.1}
</style>
<defs>
<pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".9" fill="${LINE}" fill-opacity=".07"/></pattern>
<pattern id="soil" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="12" stroke="${LINE}" stroke-opacity=".17" stroke-width="1.2"/></pattern>
<pattern id="gravel" width="34" height="26" patternUnits="userSpaceOnUse"><path d="M4 7l5-3 5 2-1 5-7 1z M20 4l6 1 2 4-3 3-5-2z M12 17l5-1 3 4-4 3-4-2z M27 16l4 1 1 4-4 1z" fill="${LINE}" fill-opacity=".06" stroke="${LINE}" stroke-opacity=".34"/></pattern>
<pattern id="conc" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="4" cy="5" r="1" fill="${LINE}" fill-opacity=".45"/><circle cx="15" cy="9" r=".8" fill="${LINE}" fill-opacity=".35"/><circle cx="9" cy="17" r="1.1" fill="${LINE}" fill-opacity=".4"/><path d="M17 16l3 4h-5z" fill="none" stroke="${LINE}" stroke-opacity=".35"/></pattern>
<pattern id="grass" width="18" height="16" patternUnits="userSpaceOnUse"><path d="M3 12l1-5M8 13l2-6M13 12l1-4" stroke="${GREEN}" stroke-opacity=".55" stroke-width="1.1" fill="none"/></pattern>
<pattern id="pav" width="36" height="24" patternUnits="userSpaceOnUse"><path d="M0 0H36M0 12H36M0 0V12M18 12V24" stroke="${LINE}" stroke-opacity=".32" stroke-width="1" fill="none"/></pattern>
<pattern id="wood" width="40" height="8" patternUnits="userSpaceOnUse"><path d="M0 4C10 2 20 6 40 4" stroke="${SAND}" stroke-opacity=".4" fill="none"/></pattern>
<pattern id="siding" width="20" height="16" patternUnits="userSpaceOnUse"><path d="M0 15.5H20" stroke="${LINE}" stroke-opacity=".28"/></pattern>
</defs>
<rect width="800" height="1000" fill="${BG}"/>
<rect width="800" height="1000" fill="url(#grid)"/>
<rect x="24" y="24" width="752" height="952" class="l2"/>
${body}
<path class="l2" d="M24 852H776M440 852V976M630 852V976"/>
${t(44, 882, 'BIGHORN CONSTRUCTION &amp; HARDSCAPE', 't ts sm')}
<text x="44" y="924" class="h">${title}</text>
${t(44, 956, sub.toUpperCase(), 't')}
${t(460, 882, 'SCALE', 't sm')}${t(460, 906, 'NOT TO SCALE', 't tb')}
${t(460, 936, 'TYPE', 't sm')}${t(460, 960, 'TYPICAL DETAIL', 't tb')}
${t(650, 882, 'DRAWING', 't sm')}
<text x="650" y="944" class="h" style="font-size:46px">${no}</text>
</svg>`;
}

// ---------------------------------------------------------------- S-01 concrete
const concrete = frame('S-01', 'Concrete walkway', 'Typical section and plan', `
${t(44, 70, 'SECTION A', 't ts sm')}
<rect x="118" y="350" width="658" height="250" fill="url(#soil)"/>
<path class="l2" d="M118 600H776" stroke-dasharray="3 6"/>
<rect x="60" y="100" width="58" height="230" fill="url(#siding)"/><path class="l" d="M60 100V330H118V100"/>
<rect x="70" y="330" width="48" height="210" fill="url(#conc)"/><rect x="48" y="540" width="104" height="44" fill="url(#conc)"/>
<path class="l" d="M70 330V540H48V584H152V540H118V330"/>
<path d="M118 370L632 382V422L118 410Z" fill="url(#gravel)"/><path class="l2" d="M118 370L632 382V422L118 410Z"/>
<path d="M124 330L620 342V382L124 370Z" fill="${BG}"/><path d="M124 330L620 342V382L124 370Z" fill="url(#conc)"/><path class="l" d="M124 330L620 342V382L124 370Z"/>
<rect x="118" y="330" width="6" height="40" fill="${SAND}" fill-opacity=".55"/>
<path class="clay l" d="M366 336L372 346L378 336"/>
<path class="l" d="M632 350H776"/>
<g fill="none" stroke="${LINE}" stroke-opacity=".5"><ellipse cx="650" cy="345" rx="9" ry="5"/><ellipse cx="671" cy="346" rx="7" ry="4"/><ellipse cx="690" cy="344" rx="10" ry="6"/></g>
${t(180, 296, 'FALL ⅛–¼ IN PER FT, AWAY FROM THE HOUSE', 't', 'start')}
${arrow(180, 308, 560, 318, 'l sand')}
${co(121, 352, 190, 150, ['ISOLATION JOINT', 'AT THE FOUNDATION'])}
${co(372, 341, 430, 205, ['CONTROL JOINT,', '¼ OF THE SLAB DEPTH'])}
${co(470, 364, 520, 470, ['4 IN CONCRETE SLAB'])}
${co(300, 404, 340, 530, ['4 IN COMPACTED', 'AGGREGATE BASE'])}
${t(560, 580, 'NATIVE SOIL, COMPACTED', 't')}
${t(44, 650, 'PLAN', 't ts sm')}
<rect x="60" y="664" width="680" height="18" fill="${LINE}" fill-opacity=".1"/><path class="l" d="M60 682H740M60 664H740"/>
${t(400, 678, 'HOUSE', 't sm', 'middle')}
<rect x="60" y="682" width="680" height="78" fill="url(#conc)"/><path class="l" d="M60 760H740M740 682V760"/>
<path class="sand l" d="M230 682V760M400 682V760M570 682V760" stroke-dasharray="6 5"/>
<path class="l2" d="M140 670V774"/><circle cx="140" cy="788" r="11" class="l2"/>${t(140, 793, 'A', 't tb sm', 'middle')}
${arrow(315, 694, 315, 746, 'l sand')}${arrow(485, 694, 485, 746, 'l sand')}
${dimH(230, 400, 800, 'JOINTS 8–10 FT APART', false)}
`);

// ---------------------------------------------------------------- S-03 backyard
const shrubs = [110, 175, 245, 320, 395, 470, 545, 620, 690].map((x) => `<circle cx="${x}" cy="763" r="13" class="grn l"/>`).join('') + [430, 500, 570, 640].map((y) => `<circle cx="100" cy="${y}" r="12" class="grn l"/>`).join('');
const posts = [];
for (let x = 60; x <= 740; x += 40) posts.push(`<rect x="${x - 3}" y="797" width="6" height="6" fill="${LINE}" fill-opacity=".6"/>`);
for (let y = 200; y <= 800; y += 40) { posts.push(`<rect x="57" y="${y - 3}" width="6" height="6" fill="${LINE}" fill-opacity=".6"/>`); if (y < 228 || y > 280) posts.push(`<rect x="737" y="${y - 3}" width="6" height="6" fill="${LINE}" fill-opacity=".6"/>`); }
const backyard = frame('S-02', 'Backyard layout', 'Typical plan', `
${t(44, 70, 'PLAN', 't ts sm')}
<g transform="translate(728 78)"><circle r="20" class="l2"/><path class="l sand" d="M0 14V-14M-7 -4L0 -15 7 -4"/>${t(0, 44, 'N', 't tb sm', 'middle')}</g>
<rect x="140" y="60" width="460" height="150" fill="${LINE}" fill-opacity=".09"/><path class="l" d="M140 60H600V210H400M330 210H140Z"/>
${t(370, 140, 'HOUSE', 't sm', 'middle')}
<path class="l2" d="M330 206H400" stroke-dasharray="4 4"/>
<path class="l" d="M140 190H60V800H740V280M740 228V190H600"/><path class="l2" d="M740 228A48 48 0 0 1 788 276" stroke-dasharray="4 4"/>
${posts.join('')}
<rect x="270" y="210" width="200" height="130" fill="url(#pav)"/><rect x="270" y="210" width="200" height="130" class="l"/>
<rect x="470" y="238" width="270" height="34" fill="url(#pav)"/><path class="l" d="M470 238H740M470 272H740"/>
<rect x="150" y="216" width="40" height="30" class="l2"/>${t(170, 236, 'AC', 't sm', 'middle')}
<path d="M210 405Q210 380 235 380H640Q690 380 690 430V650Q690 700 640 700H235Q205 700 205 670Z" fill="url(#grass)"/><path class="l grn" d="M210 405Q210 380 235 380H640Q690 380 690 430V650Q690 700 640 700H235Q205 700 205 670Z"/>
<rect x="72" y="735" width="658" height="56" fill="${GREEN}" fill-opacity=".08"/><rect x="72" y="400" width="56" height="335" fill="${GREEN}" fill-opacity=".08"/>
${shrubs}
<circle cx="175" cy="320" r="62" fill="${SAND}" fill-opacity=".06" class="l sand"/><circle cx="175" cy="320" r="40" class="l2" stroke-dasharray="3 5"/><circle cx="175" cy="320" r="4" fill="${SAND}"/>
<g transform="translate(100 560)" class="l sand"><circle r="9"/><path d="M0 -16V-13M0 13V16M-16 0H-13M13 0H16M-11 -11l2 2M9 9l2 2M-11 11l2-2M9 -9l2-2"/></g>
${t(100, 594, 'PM', 't ts sm', 'middle')}
<path class="water" d="M715 700V300" stroke-dasharray="8 6"/>${arrow(715, 330, 715, 296)}
${t(370, 280, 'PAVER PATIO', 't tb', 'middle')}
${t(605, 260, 'PATH TO SIDE GATE', 't sm', 'middle')}
${t(448, 538, 'LAWN ON SPRINKLERS', 't tb', 'middle')}
${t(448, 560, 'ZONED SEPARATELY FROM BEDS', 't sm', 'middle')}
${t(400, 724, 'PLANTING BEDS ON DRIP', 't', 'middle')}
${t(175, 400, 'SHADE TREE, WEST SIDE', 't sm', 'middle')}
<text x="703" y="560" class="t tw sm" text-anchor="middle" transform="rotate(-90 703 560)">SWALE TO SIDE YARD AND STREET</text>
${dimH(60, 740, 830, 'TYPICAL LOT ≈ 60 FT WIDE', true)}
`);

// ---------------------------------------------------------------- S-04 sprinklers
const xs = [100, 260, 420, 580], ys = [220, 420, 620];
let heads = '', circles = '';
for (const x of xs) for (const y of ys) {
  const z = x <= 260 ? CLAY : SAND;
  circles += `<circle cx="${x}" cy="${y}" r="200" fill="${z}" fill-opacity=".035" stroke="${z}" stroke-opacity=".35" stroke-width="1"/>`;
  heads += `<circle cx="${x}" cy="${y}" r="7" fill="${z}"/><circle cx="${x}" cy="${y}" r="2.2" fill="${BG}"/>`;
}
const emit = []; for (let y = 230; y <= 676; y += 32) emit.push(`<circle cx="672" cy="${y}" r="2.6" fill="${GREEN}"/>`); for (let x = 640; x >= 120; x -= 32) emit.push(`<circle cx="${x}" cy="690" r="2.6" fill="${GREEN}"/>`);
const sprinklers = frame('S-03', 'Sprinkler zones', 'Typical layout', `
${t(44, 52, 'PLAN', 't ts sm')}
<rect x="60" y="60" width="680" height="60" fill="${LINE}" fill-opacity=".09"/><path class="l" d="M60 60H740V120H60Z"/>
${t(330, 96, 'HOUSE', 't sm', 'middle')}
<rect x="80" y="90" width="26" height="22" class="l sand"/>
<rect x="722" y="128" width="26" height="16" class="l2"/><path class="l2" d="M722 128L748 144M748 128L722 144"/>
<rect x="636" y="150" width="84" height="36" class="l"/><circle cx="656" cy="168" r="6" class="l clay"/><circle cx="678" cy="168" r="6" class="l sand"/><circle cx="700" cy="168" r="6" class="l grn"/>
<path class="l2" d="M735 144V158H720"/>
<defs><clipPath id="lawn"><rect x="100" y="220" width="480" height="400"/></clipPath></defs>
<rect x="100" y="220" width="480" height="400" fill="url(#grass)"/>
<g clip-path="url(#lawn)">${circles}</g>
<rect x="100" y="220" width="480" height="400" class="l grn"/>
<path d="M620 220H720V720H100V660H620Z" fill="${GREEN}" fill-opacity=".08"/><path class="l2" d="M620 220H720V720H100V660H620Z"/>
<path class="l clay" d="M656 186V196H100V620M260 196V620" stroke-width="1.5"/>
<path class="l sand" d="M678 186V206H420V620M580 206V620" stroke-width="1.5"/>
<path class="l grn" d="M700 186V214H672V690H120" stroke-width="1.4" stroke-dasharray="2 4"/>${emit.join('')}
${heads}
${co(93, 101, 150, 150, ['CONTROLLER'])}
${co(735, 136, 600, 98, ['BACKFLOW PREVENTER'], 'end')}
${co(678, 186, 560, 160, ['VALVE BOX:', 'ONE VALVE PER ZONE'], 'end')}
${t(340, 500, 'HEAD-TO-HEAD COVERAGE', 't tb', 'middle')}
${t(340, 522, 'EACH HEAD REACHES THE NEXT', 't sm', 'middle')}
<g transform="translate(44 760)"><circle cx="8" cy="0" r="7" fill="${CLAY}"/>${t(26, 5, 'ZONE 1 · LAWN · SPRAY HEADS', 't')}</g>
<g transform="translate(44 796)"><circle cx="8" cy="0" r="7" fill="${SAND}"/>${t(26, 5, 'ZONE 2 · LAWN · SPRAY HEADS', 't')}</g>
<g transform="translate(420 760)"><path d="M0 0H18" class="l grn" stroke-dasharray="2 4"/><circle cx="9" cy="0" r="2.6" fill="${GREEN}"/>${t(30, 5, 'ZONE 3 · BEDS · DRIP', 't')}</g>
<g transform="translate(420 796)"><circle cx="9" cy="0" r="8" fill="none" stroke="${SAND}" stroke-opacity=".6"/>${t(30, 5, 'SPRAY RADIUS', 't')}</g>
`);

// ---------------------------------------------------------------- S-05 fence
const boards = (x1, x2) => { let s = ''; for (let x = x1 + 14; x < x2; x += 14) s += `M${x} 424V584`; return `<path class="l2" d="${s}"/>`; };
const post = (cx, w, depth) => `<rect x="${cx - w / 2}" y="410" width="${w}" height="190" fill="#2a221c"/><path class="l" d="M${cx - w / 2} 600V410H${cx + w / 2}V600"/><path class="l" d="M${cx - w / 2 - 3} 410L${cx} 402L${cx + w / 2 + 3} 410Z"/><path class="hid" d="M${cx - w / 2} 600V${600 + depth}H${cx + w / 2}V600"/>`;
const footing = (cx, w, depth) => `<path d="M${cx - w / 2} 604L${cx} 597L${cx + w / 2} 604V${615 + depth}H${cx - w / 2}Z" fill="${BG}"/><path d="M${cx - w / 2} 604L${cx} 597L${cx + w / 2} 604V${615 + depth}H${cx - w / 2}Z" fill="url(#conc)"/><path class="l2" d="M${cx - w / 2} 604L${cx} 597L${cx + w / 2} 604V${615 + depth}H${cx - w / 2}Z"/>`;
const gateBoards = (() => { let s = ''; for (let x = 624; x < 728; x += 14) s += `M${x} 428V594`; return `<path class="l2" d="${s}"/>`; })();
const fence = frame('S-04', 'Fence and gate', 'Typical elevation', `
${t(44, 70, 'ELEVATION, STREET SIDE', 't ts sm')}
<rect x="40" y="600" width="720" height="120" fill="url(#soil)"/><path class="l2" d="M40 720H760" stroke-dasharray="3 6"/>
${footing(120, 40, 75)}${footing(360, 40, 75)}${footing(600, 50, 90)}${footing(742, 40, 75)}
<path class="hid" d="M126 440H354M126 510H354M126 575H354M366 440H592M366 510H592M366 575H592"/>
${boards(126, 354)}${boards(366, 592)}
<rect x="126" y="414" width="228" height="10" class="l"/><rect x="366" y="414" width="226" height="10" class="l"/>
<rect x="126" y="584" width="228" height="16" fill="${SAND}" fill-opacity=".14" class="l"/><rect x="366" y="584" width="226" height="16" fill="${SAND}" fill-opacity=".14" class="l"/>
${post(120, 12, 75)}${post(360, 12, 75)}${post(600, 16, 90)}${post(742, 12, 75)}
<rect x="612" y="424" width="122" height="172" class="l"/>${gateBoards}
<path class="sand l" d="M616 436H730M616 584H730M620 584L726 436" stroke-width="3.5"/>
<rect x="602" y="446" width="22" height="8" fill="${SAND}"/><rect x="602" y="566" width="22" height="8" fill="${SAND}"/>
<rect x="724" y="500" width="18" height="9" fill="${SAND}"/>
<path class="l" d="M40 600H760"/>
${dimV(84, 420, 600, '6 FT', 'left')}
${dimH(120, 360, 372, '8 FT ON CENTER, MAX')}
${dimH(612, 734, 372, '4 FT GATE')}
${co(600, 470, 560, 228, ['GATE POST: 6×6,', 'SET DEEPER'], 'end')}
${co(674, 512, 760, 290, ['BRACE RUNS UP FROM', 'THE HINGE SIDE'], 'end')}
${co(250, 510, 210, 300, ['3 RAILS (BACK SIDE)'])}
${co(250, 592, 250, 756, ['KICKBOARD KEEPS BOARDS', 'OFF THE DIRT'])}
${co(120, 664, 64, 808, ['POSTS 24–36 IN DEEP IN', 'CONCRETE, BELOW FROST'])}
${co(600, 602, 540, 756, ['FOOTING CROWNED', 'TO SHED WATER'])}
`);

// ---------------------------------------------------------------- S-06 grading
const grading = frame('S-05', 'Grading and drainage', 'Typical section', `
${t(44, 70, 'SECTION', 't ts sm')}
<path d="M120 450L420 510L560 540L610 556L660 540L760 532V720H120Z" fill="url(#soil)"/>
<path d="M120 450L350 496L120 520Z" fill="${SAND}" fill-opacity=".1"/>
<path class="l2 sand" d="M120 470H220M120 490H310M120 510H340" stroke-dasharray="5 5"/>
<rect x="60" y="120" width="60" height="300" fill="url(#siding)"/><path class="l" d="M60 120V420H120V120"/>
<rect x="70" y="420" width="50" height="220" fill="url(#conc)"/><rect x="50" y="640" width="100" height="40" fill="url(#conc)"/>
<path class="l" d="M70 420V640H50V680H150V640H120V420"/>
<path class="l" d="M120 450L420 510L560 540L610 556L660 540L760 532" stroke-width="2.4"/>
<path class="l clay" d="M120 520L760 452" stroke-dasharray="9 7"/>
<path class="l" d="M124 140V436Q124 444 132 446L240 470" stroke-width="3"/>
${arrow(244, 471, 270, 477)}${arrow(300, 470, 350, 480)}${arrow(440, 500, 490, 510)}${arrow(560, 528, 600, 542)}
<circle cx="610" cy="548" r="7" class="water"/><circle cx="610" cy="548" r="1.6" fill="${WATER}"/>
<path class="l2" d="M120 450H440" stroke-dasharray="3 5"/>
${dimV(440, 450, 510, '≥ 6 IN FALL')}
${dimH(120, 420, 406, 'FIRST 10 FT')}
${co(190, 488, 220, 600, ['COMPACTED FILL,', 'PLACED IN LIFTS'])}
${co(170, 457, 250, 300, ['DOWNSPOUT EXTENSION', 'CARRIES ROOF WATER OUT'])}
${co(610, 548, 700, 380, ['SWALE TURNS WATER', 'TOWARD THE STREET'], 'end')}
${co(700, 459, 760, 230, ['BEFORE: GROUND FELL', 'TOWARD THE HOUSE'], 'end', 't tc')}
${t(560, 660, 'NATIVE SOIL', 't')}
${t(44, 768, 'IRC R401.3: THE GROUND SHOULD FALL AT LEAST 6 IN', 't tb')}
${t(44, 790, 'WITHIN THE FIRST 10 FT FROM THE FOUNDATION.', 't tb')}
${t(44, 820, 'VERTICAL SCALE EXAGGERATED FOR CLARITY.', 't sm')}
`);

// ---------------------------------------------------------------- S-07 stairs
let stairs = '';
const R = 60, T = 84, X0 = 140, Y0 = 720, N = 6;
for (let i = 1; i <= N; i++) {
  const xr = X0 + (i - 1) * T, yt = Y0 - i * R;
  stairs += `<rect x="${xr}" y="${yt + 8}" width="6" height="${R - 8}" fill="${LINE}" fill-opacity=".82"/><rect x="${xr}" y="${yt + 8}" width="6" height="${R - 8}" class="l"/>`;
  const w = i === N ? 220 : T + 8;
  stairs += `<path d="M${xr + w - 8} ${yt}H${xr - 4}Q${xr - 10} ${yt} ${xr - 10} ${yt + 4}Q${xr - 10} ${yt + 8} ${xr - 4} ${yt + 8}H${xr + w - 8}Z" fill="${SAND}" fill-opacity=".22"/>`;
  stairs += `<path d="M${xr + w - 8} ${yt}H${xr - 4}Q${xr - 10} ${yt} ${xr - 10} ${yt + 4}Q${xr - 10} ${yt + 8} ${xr - 4} ${yt + 8}H${xr + w - 8}" class="l"/>`;
  stairs += `<path class="hid" d="M${xr} ${yt + 10}H${xr + T}"/>`;
}
const tape = [0, 28, 56].map((d) => `<rect x="${X0 + 3 * T + 4 + d}" y="${Y0 - 4 * R - 3}" width="7" height="14" fill="${CLAY}" fill-opacity=".9"/>`).join('');
const stairsDwg = frame('S-06', 'Stair treads', 'Typical section', `
${t(44, 70, 'SECTION', 't ts sm')}
<path d="M140 728L${X0 + 5 * T} ${Y0 - N * R + 8}H${X0 + 5 * T + 212}V${Y0 - N * R + 70}L250 760H140Z" fill="url(#soil)"/>
<path class="l2" d="M250 760L${X0 + 5 * T + 212} ${Y0 - N * R + 70}"/>
<path class="l" d="M40 720H${X0}M40 728H${X0 - 4}"/>
<path class="l" d="M${X0 + 5 * T + 212} ${Y0 - N * R}V${Y0 - N * R + 70}"/>
${stairs}
${tape}
<path class="l2 sand" d="M${X0 - 8} ${Y0 - R}L${X0 + 5 * T - 8} ${Y0 - N * R}" stroke-dasharray="4 6"/>
<path class="l" d="M${X0 - 8} ${Y0 - R - 288}L${X0 + 5 * T - 8} ${Y0 - N * R - 288}" stroke-width="7" stroke-opacity=".7"/>
<path class="l2" d="M${X0 + 70} ${Y0 - R - 288 - 50}v26M${X0 + 280} ${Y0 - R - 288 - 200}v26"/>
${dimV(300, 540, 252, 'H')}
${dimV(118, 720, 660, 'R', 'left')}
${dimH(140, 224, 640, 'T')}
${co(X0 - 10, Y0 - R + 4, 70, 610, ['N'], 'start', 't tb')}
${co(262, 603, 60, 450, ['NEW TREAD WITH', 'MATCHING NOSING'])}
${co(227, 634, 60, 530, ['RISER, PAINTED'])}
${co(X0 + 3 * T + 35, Y0 - 4 * R + 4, 480, 250, ['TAPE HOLDS THE TREADS', 'WHILE THE ADHESIVE SETS'], 'start', 't tc')}
${co(330, 700, 64, 790, ['EXISTING STRINGER, CHECKED', 'AND SHIMMED LEVEL'])}
<g transform="translate(470 580)">
${t(0, 0, 'IRC R311.7 LIMITS', 't ts sm')}
${t(0, 30, 'R  RISE ≤ 7¾ IN', 't tb')}
${t(0, 54, 'T  RUN ≥ 10 IN', 't tb')}
${t(0, 78, 'N  NOSING ¾–1¼ IN', 't tb')}
${t(0, 102, 'H  HANDRAIL 34–38 IN', 't tb')}
${t(0, 132, 'STEPS IN A FLIGHT WITHIN', 't')}
${t(0, 154, '⅜ IN OF EACH OTHER', 't')}
</g>
`);

// ---------------------------------------------------------------- write + render
const drawings = { 'dwg-concrete': concrete, 'dwg-backyard': backyard, 'dwg-sprinklers': sprinklers, 'dwg-fence': fence, 'dwg-grading': grading, 'dwg-stairs': stairsDwg };
const dir = join(ROOT, 'src/drawings'); mkdirSync(dir, { recursive: true });
for (const [n, svg] of Object.entries(drawings)) writeFileSync(join(dir, n + '.svg'), svg);
console.log('SVGs written to', dir);

let chromium;
try { chromium = createRequire(import.meta.url)('playwright').chromium; } catch { console.log('Playwright not found: skipped PNG render.'); process.exit(0); }
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 800, height: 1000 }, deviceScaleFactor: 2 });
for (const [n, svg] of Object.entries(drawings)) {
  await page.setContent(`<!doctype html><html><head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,300..800&family=IBM+Plex+Mono:wght@400;500&display=block"><style>html,body{margin:0;background:${BG}}svg{display:block}</style></head><body>${svg}</body></html>`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(ROOT, 'src/img-master', n + '.png'), clip: { x: 0, y: 0, width: 800, height: 1000 } });
}
await browser.close();
console.log('PNG masters written to src/img-master/');
