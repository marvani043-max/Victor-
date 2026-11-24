const pptxgen = require("pptxgenjs");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const sharp = require("sharp");
const Fi = require("react-icons/fi");
const { applyTheme } = require("/root/.claude/skills/synced/54112f68-585d-4ee6-832b-e6164741edb4_c48cb2c2-7691-425d-8015-6c3510e5104b/pptx/scripts/apply_theme.js");

const THEME = {
  name: "Marvani",
  headFontFace: "Cambria",
  bodyFontFace: "Calibri",
  colors: {
    dk1: "16121F", // ink
    lt1: "FFFFFF",
    dk2: "2A2238", // deep plum
    lt2: "F2EFF6", // lilac mist
    accent1: "FF5A36", // vermilion
    accent2: "7B5CFA", // violet
    accent3: "C9BFE0", // lavender
    accent4: "6B6478", // muted slate
    accent5: "3A3149", // plum mid
    accent6: "FFD9CF", // blush
    hlink: "7B5CFA",
    folHlink: "6B6478",
  },
};
const H = THEME.colors;

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE"; // 13.333 x 7.5
pres.title = "Marvani: Agency Credentials";
pres.author = "Marvani";
pres.company = "Marvani";
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
const C = pres.SchemeColor;

const W = 13.333;
const M = 0.6;

async function icon(name, hex, size = 256) {
  const svg = renderToStaticMarkup(React.createElement(Fi[name], { color: "#" + hex, size }));
  const buf = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}

// ---------- Layouts ----------
function footer(dark) {
  return [
    { text: { text: "MARVANI", options: { x: M, y: 6.95, w: 3, h: 0.3, margin: 0, fontSize: 10, bold: true, charSpacing: 4, color: dark ? C.accent3 : C.accent4, fontFace: THEME.bodyFontFace } } },
  ];
}
const slideNum = (dark) => ({ x: W - M - 0.6, y: 6.95, w: 0.6, h: 0.3, fontSize: 10, color: dark ? C.accent3 : C.accent4, align: "right", margin: 0 });

pres.defineSlideMaster({
  title: "Cover",
  background: { color: C.text1 },
  objects: [
    { placeholder: { options: { name: "title", type: "title", align: "left", x: M, y: 2.2, w: 8.2, h: 2.2, fontFace: THEME.headFontFace, fontSize: 60, bold: true, color: C.background1, valign: "top", margin: 0 }, text: "" } },
    { placeholder: { options: { name: "body", type: "body", x: M, y: 4.55, w: 7.2, h: 0.9, fontSize: 20, color: C.accent3, valign: "top", margin: 0 }, text: "" } },
  ],
});

pres.defineSlideMaster({
  title: "Content Light",
  background: { color: C.background1 },
  margin: [0.5, M, 0.6, M],
  objects: [
    { placeholder: { options: { name: "kicker", type: "body", x: M, y: 0.45, w: 9, h: 0.3, fontSize: 12, bold: true, charSpacing: 3, color: C.accent1, margin: 0, valign: "top" }, text: "" } },
    { placeholder: { options: { name: "title", type: "title", align: "left", x: M, y: 0.8, w: W - 2 * M, h: 0.85, fontFace: THEME.headFontFace, fontSize: 36, bold: true, color: C.text1, margin: 0, valign: "top" }, text: "" } },
    ...footer(false),
  ],
  slideNumber: slideNum(false),
});

pres.defineSlideMaster({
  title: "Content Dark",
  background: { color: C.text1 },
  objects: [
    { placeholder: { options: { name: "kicker", type: "body", x: M, y: 0.45, w: 9, h: 0.3, fontSize: 12, bold: true, charSpacing: 3, color: C.accent1, margin: 0, valign: "top" }, text: "" } },
    { placeholder: { options: { name: "title", type: "title", align: "left", x: M, y: 0.8, w: W - 2 * M, h: 0.85, fontFace: THEME.headFontFace, fontSize: 36, bold: true, color: C.background1, margin: 0, valign: "top" }, text: "" } },
    ...footer(true),
  ],
  slideNumber: slideNum(true),
});

// Ring motif: an outlined circle, used on every slide
function ring(slide, x, y, d, color, width = 2, name = "Ring motif") {
  slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { type: "none" }, line: { color, width }, objectName: name });
}
function dot(slide, x, y, d, color, name = "Dot motif") {
  slide.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color }, line: { type: "none" }, objectName: name });
}
const txt = (slide, text, opts) => slide.addText(text, { isTextBox: true, margin: 0, valign: "top", ...opts });

(async () => {
  // ======================= 1. COVER =======================
  pres.addSection({ title: "Introduction" });
  let s = pres.addSlide({ masterName: "Cover", sectionTitle: "Introduction" });
  ring(s, 8.4, -1.2, 7.4, C.accent1, 2.5, "Cover ring large");
  ring(s, 9.9, 2.6, 4.6, C.accent5, 1.5, "Cover ring small");
  dot(s, 11.55, 1.55, 0.55, C.accent1, "Cover dot");
  txt(s, "MARVANI", { x: M, y: 0.6, w: 4, h: 0.4, fontSize: 16, bold: true, charSpacing: 8, color: C.background1, objectName: "Wordmark" });
  s.addText("Brands built to be chosen", { placeholder: "title" });
  s.addText("Strategy, design, digital and growth marketing, under one roof.", { placeholder: "body" });
  txt(s, "AGENCY CREDENTIALS  ·  2026", { x: M, y: 6.75, w: 6, h: 0.3, fontSize: 11, bold: true, charSpacing: 3, color: C.accent4, objectName: "Cover footer" });
  s.addNotes("Welcome and thank you for the time. Marvani is a full-service marketing studio. Over the next twenty minutes we'll cover why brands struggle to be chosen today, how we fix that, what working with us looks like, and the first steps.");

  // ======================= 2. WHY NOW =======================
  s = pres.addSlide({ masterName: "Content Light", sectionTitle: "Introduction" });
  s.addText("WHY NOW", { placeholder: "kicker" });
  s.addText("Being good is no longer enough to be chosen", { placeholder: "title" });
  const why = [
    ["01", "Attention is rented", "Ad costs keep climbing and algorithms change overnight. Brands that rely on paid reach alone pay more every quarter for the same result."],
    ["02", "Sameness is the default", "Templates, stock imagery and AI-written copy make categories look alike. Customers can't choose what they can't tell apart."],
    ["03", "Channels are fragmented", "Search, social, email, marketplaces and retail all need a consistent story. Most brands run them as separate projects."],
  ];
  const cw = (W - 2 * M - 2 * 0.4) / 3;
  for (let i = 0; i < 3; i++) {
    const x = M + i * (cw + 0.4);
    s.addShape(pres.shapes.RECTANGLE, { x, y: 2.1, w: cw, h: 3.9, fill: { color: C.background2 }, line: { type: "none" }, objectName: `Why card ${i + 1}` });
    ring(s, x + 0.4, 2.45, 0.95, C.accent1, 2, `Why ring ${i + 1}`);
    txt(s, why[i][0], { x: x + 0.4, y: 2.45, w: 0.95, h: 0.95, align: "center", valign: "middle", fontFace: THEME.headFontFace, fontSize: 24, bold: true, color: C.accent1, objectName: `Why number ${i + 1}` });
    txt(s, why[i][1], { x: x + 0.4, y: 3.65, w: cw - 0.8, h: 0.8, fontFace: THEME.headFontFace, fontSize: 22, bold: true, color: C.text1, objectName: `Why heading ${i + 1}` });
    txt(s, why[i][2], { x: x + 0.4, y: 4.55, w: cw - 0.8, h: 1.2, fontSize: 15, color: C.accent4, objectName: `Why body ${i + 1}` });
  }
  txt(s, [
    { text: "The opportunity: ", options: { bold: true, color: C.text1 } },
    { text: "brands with a clear position and a connected system spend less to win more.", options: { italic: true, color: C.text1 } },
  ], { x: M, y: 6.25, w: W - 2 * M, h: 0.4, fontSize: 17, objectName: "Why takeaway" });
  s.addNotes("Three shifts make this harder than it was five years ago. Paid reach is getting more expensive, categories are converging visually, and the customer journey is split across many channels. The upside is that brands that get clarity and consistency right pull ahead quickly.");

  // ======================= 3. WHO WE ARE =======================
  pres.addSection({ title: "Who we are" });
  s = pres.addSlide({ masterName: "Content Light", sectionTitle: "Who we are" });
  s.addText("WHO WE ARE", { placeholder: "kicker" });
  s.addText("A marketing studio for ambitious brands", { placeholder: "title" });
  s.addShape(pres.shapes.RECTANGLE, { x: M, y: 2.1, w: 5.6, h: 4.35, fill: { color: C.text1 }, line: { type: "none" }, objectName: "Statement panel" });
  ring(s, M + 4.35, 5.3, 0.85, C.accent1, 2, "Statement ring");
  dot(s, M + 4.635, 5.585, 0.28, C.accent1, "Statement dot");
  txt(s, "We help brands look, sound and sell like the leader in their category, then build the engine that keeps them there.", { x: M + 0.5, y: 2.55, w: 4.6, h: 2.6, fontFace: THEME.headFontFace, italic: true, fontSize: 24, color: C.background1, objectName: "Statement" });
  txt(s, "Strategists, designers, developers and media specialists working as one team.", { x: M + 0.5, y: 5.35, w: 3.4, h: 0.8, fontSize: 14, color: C.accent3, objectName: "Statement caption" });
  const pillars = [
    ["FiCompass", "Strategy-led", "Every project starts with the customer, the competition and a clear position. Creative follows the strategy, not the other way round."],
    ["FiPenTool", "Craft-obsessed", "Distinctive identities, considered websites and content people stop scrolling for, made by senior creatives."],
    ["FiTrendingUp", "Built to perform", "We tie the work to commercial goals and report on pipeline, revenue and retention, not just likes."],
  ];
  for (let i = 0; i < 3; i++) {
    const y = 2.1 + i * 1.5;
    dot(s, 6.8, y, 0.85, C.background2, `Pillar icon circle ${i + 1}`);
    s.addImage({ data: await icon(pillars[i][0], H.accent1), x: 7.03, y: y + 0.23, w: 0.4, h: 0.4, altText: pillars[i][1], objectName: `Pillar icon ${i + 1}` });
    txt(s, pillars[i][1], { x: 7.95, y: y - 0.02, w: 4.8, h: 0.4, fontSize: 20, bold: true, fontFace: THEME.headFontFace, color: C.text1, objectName: `Pillar heading ${i + 1}` });
    txt(s, pillars[i][2], { x: 7.95, y: y + 0.42, w: 4.8, h: 0.95, fontSize: 14, color: C.accent4, objectName: `Pillar body ${i + 1}` });
  }
  s.addNotes("Marvani sits between a brand consultancy and a performance agency. We do the strategic thinking, the creative craft and the growth work, so nothing gets lost in hand-offs between suppliers.");

  // ======================= 4. CAPABILITIES =======================
  s = pres.addSlide({ masterName: "Content Light", sectionTitle: "Who we are" });
  s.addText("WHAT WE DO", { placeholder: "kicker" });
  s.addText("Six capabilities, one connected system", { placeholder: "title" });
  const caps = [
    ["FiTarget", "Brand strategy", "Positioning, audience insight, messaging and naming."],
    ["FiFeather", "Identity & design", "Logos, visual systems, packaging and brand guidelines."],
    ["FiMonitor", "Websites & e-commerce", "Fast, conversion-focused sites on Shopify, Webflow and custom builds."],
    ["FiCamera", "Content & social", "Campaign concepts, photo and video direction, always-on social."],
    ["FiZap", "Paid media", "Meta, Google, TikTok and LinkedIn, planned and optimized in-house."],
    ["FiBarChart2", "Analytics & CRO", "Tracking, dashboards and testing that turn traffic into revenue."],
  ];
  const gw = (W - 2 * M - 2 * 0.3) / 3, gh = 2.05;
  for (let i = 0; i < 6; i++) {
    const col = i % 3, row = Math.floor(i / 3);
    const x = M + col * (gw + 0.3), y = 2.05 + row * (gh + 0.3);
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: gw, h: gh, fill: { color: C.background1 }, line: { color: C.accent3, width: 1 }, objectName: `Capability card ${i + 1}` });
    dot(s, x + 0.35, y + 0.35, 0.75, C.accent1, `Capability icon circle ${i + 1}`);
    s.addImage({ data: await icon(caps[i][0], "FFFFFF"), x: x + 0.535, y: y + 0.535, w: 0.38, h: 0.38, altText: caps[i][1], objectName: `Capability icon ${i + 1}` });
    txt(s, caps[i][1], { x: x + 1.3, y: y + 0.45, w: gw - 1.55, h: 0.5, fontSize: 19, bold: true, fontFace: THEME.headFontFace, color: C.text1, valign: "middle", objectName: `Capability heading ${i + 1}` });
    txt(s, caps[i][2], { x: x + 0.35, y: y + 1.25, w: gw - 0.7, h: 0.7, fontSize: 14, color: C.accent4, objectName: `Capability body ${i + 1}` });
  }
  s.addNotes("These six capabilities can be bought separately, but they work best together: the strategy informs the identity, the identity shapes the website and content, and media and analytics show us what to improve next.");

  // ======================= 5. PROCESS =======================
  pres.addSection({ title: "How we work" });
  s = pres.addSlide({ masterName: "Content Light", sectionTitle: "How we work" });
  s.addText("HOW WE WORK", { placeholder: "kicker" });
  s.addText("A clear path from insight to impact", { placeholder: "title" });
  const steps = [
    ["Discover", "Weeks 1–2", ["Stakeholder interviews", "Customer and competitor research", "Brand, site and funnel audit"]],
    ["Define", "Weeks 3–4", ["Positioning and messaging", "Audience and channel priorities", "Goals and KPIs agreed"]],
    ["Create", "Weeks 5–10", ["Identity and creative system", "Website and campaign assets", "Tracking set up before launch"]],
    ["Grow", "Ongoing", ["Launch across channels", "Test, learn and optimize", "Monthly reporting"]],
  ];
  const sw = (W - 2 * M) / 4;
  s.addShape(pres.shapes.LINE, { x: M + sw / 2, y: 2.75, w: sw * 3, h: 0, line: { color: C.accent3, width: 1.5, dashType: "dash" }, objectName: "Process connector" });
  for (let i = 0; i < 4; i++) {
    const cx = M + i * sw + sw / 2;
    const last = i === 3;
    s.addShape(pres.shapes.OVAL, { x: cx - 0.55, y: 2.2, w: 1.1, h: 1.1, fill: { color: last ? C.accent1 : C.background1 }, line: { color: C.accent1, width: 2 }, objectName: `Step circle ${i + 1}` });
    txt(s, String(i + 1).padStart(2, "0"), { x: cx - 0.55, y: 2.2, w: 1.1, h: 1.1, align: "center", valign: "middle", fontFace: THEME.headFontFace, fontSize: 26, bold: true, color: last ? C.background1 : C.accent1, objectName: `Step number ${i + 1}` });
    const tx = M + i * sw + 0.25, tw = sw - 0.5;
    txt(s, steps[i][0], { x: tx, y: 3.6, w: tw, h: 0.5, align: "center", fontFace: THEME.headFontFace, fontSize: 24, bold: true, color: C.text1, objectName: `Step name ${i + 1}` });
    txt(s, steps[i][1].toUpperCase(), { x: tx, y: 4.1, w: tw, h: 0.3, align: "center", fontSize: 12, bold: true, charSpacing: 2, color: C.accent1, objectName: `Step timing ${i + 1}` });
    s.addShape(pres.shapes.RECTANGLE, { x: tx, y: 4.6, w: tw, h: 1.85, fill: { color: C.background2 }, line: { type: "none" }, objectName: `Step card ${i + 1}` });
    txt(s, steps[i][2].map((t, j, a) => ({ text: t, options: { bullet: { indent: 14 }, breakLine: j < a.length - 1 } })), { x: tx + 0.2, y: 4.8, w: tw - 0.4, h: 1.5, fontSize: 14, color: C.text1, paraSpaceAfter: 6, objectName: `Step details ${i + 1}` });
  }
  s.addNotes("Our process has four stages. Timings are typical for a brand-plus-website engagement and flex with scope. Key point: KPIs are agreed in Define, before any creative work starts, so everyone knows what success means.");

  // ======================= 6. PRINCIPLE (dark statement) =======================
  s = pres.addSlide({ masterName: "Content Dark", sectionTitle: "How we work" });
  s.addText("WHAT WE BELIEVE", { placeholder: "kicker" });
  ring(s, 8.9, 1.4, 5.6, C.accent1, 2.5, "Belief ring large");
  ring(s, 10.4, 4.3, 2.2, C.accent5, 1.5, "Belief ring small");
  dot(s, 9.35, 5.65, 0.4, C.accent1, "Belief dot");
  txt(s, [
    { text: "Strategy without craft is invisible.", options: { color: C.background1, breakLine: true } },
    { text: "Craft without strategy is decoration.", options: { color: C.accent1 } },
  ], { x: M, y: 2.0, w: 8.6, h: 2.6, fontFace: THEME.headFontFace, fontSize: 40, bold: true, paraSpaceAfter: 12, objectName: "Belief statement" });
  txt(s, "That's why the people who write your strategy stay on the team that makes and runs the work.", { x: M, y: 4.95, w: 7.4, h: 0.9, fontSize: 18, color: C.accent3, objectName: "Belief support" });
  s.addNotes("This is the core of how we're different. Many brands buy strategy from one firm, design from another and media from a third. Each hand-off loses intent. We keep it in one team.");

  // ======================= 7. DIFFERENCE =======================
  s = pres.addSlide({ masterName: "Content Light", sectionTitle: "How we work" });
  s.addText("THE MARVANI DIFFERENCE", { placeholder: "kicker" });
  s.addText("What changes when you work with us", { placeholder: "title" });
  const rows = [
    ["Separate suppliers for brand, web and ads", "One senior team across every channel"],
    ["Juniors do the work after the pitch", "The people you meet are the people you work with"],
    ["Reports full of impressions and reach", "Reporting on leads, revenue and cost per customer"],
    ["Long retainers before you see value", "A focused sprint first, with results before you commit long term"],
    ["Assets that live in the agency's files", "You own everything: files, accounts, data and guidelines"],
  ];
  const lx = M, lw = 5.75, rx = M + lw + 0.6, rw = W - M - rx;
  txt(s, "THE TYPICAL AGENCY", { x: lx + 0.7, y: 1.95, w: lw - 0.7, h: 0.3, fontSize: 12, bold: true, charSpacing: 2, color: C.accent4, objectName: "Compare left header" });
  txt(s, "MARVANI", { x: rx + 0.7, y: 1.95, w: rw - 0.7, h: 0.3, fontSize: 12, bold: true, charSpacing: 2, color: C.accent1, objectName: "Compare right header" });
  s.addShape(pres.shapes.RECTANGLE, { x: rx, y: 2.35, w: rw, h: 4.25, fill: { color: C.background2 }, line: { type: "none" }, objectName: "Compare highlight panel" });
  const xIcon = await icon("FiX", H.accent4), cIcon = await icon("FiCheck", "FFFFFF");
  for (let i = 0; i < rows.length; i++) {
    const y = 2.5 + i * 0.82;
    s.addImage({ data: xIcon, x: lx + 0.12, y: y + 0.12, w: 0.3, h: 0.3, altText: "No", objectName: `Compare x ${i + 1}` });
    txt(s, rows[i][0], { x: lx + 0.7, y, w: lw - 0.7, h: 0.6, fontSize: 15, color: C.accent4, valign: "middle", objectName: `Compare left ${i + 1}` });
    dot(s, rx + 0.15, y + 0.08, 0.4, C.accent1, `Compare check circle ${i + 1}`);
    s.addImage({ data: cIcon, x: rx + 0.24, y: y + 0.17, w: 0.22, h: 0.22, altText: "Yes", objectName: `Compare check ${i + 1}` });
    txt(s, rows[i][1], { x: rx + 0.7, y, w: rw - 0.9, h: 0.6, fontSize: 15, bold: true, color: C.text1, valign: "middle", objectName: `Compare right ${i + 1}` });
  }
  s.addNotes("Walk through each row. The ownership point matters to a lot of clients: we set up ad accounts, analytics and design files in the client's name from day one.");

  // ======================= 8. ENGAGEMENT MODELS =======================
  pres.addSection({ title: "Working together" });
  s = pres.addSlide({ masterName: "Content Light", sectionTitle: "Working together" });
  s.addText("WAYS TO WORK TOGETHER", { placeholder: "kicker" });
  s.addText("Start focused, then scale what works", { placeholder: "title" });
  const models = [
    ["Launch Sprint", "4–6 weeks · fixed scope", "For a new brand, rebrand or website that needs to ship.", ["Discovery and positioning", "Identity or website build", "Launch plan and assets"]],
    ["Growth Partnership", "Monthly · 6-month minimum", "For brands ready to grow demand across channels.", ["Content and social calendar", "Paid media management", "Monthly reporting and testing"]],
    ["Embedded Team", "Ongoing · dedicated pod", "For teams that need senior marketing capacity.", ["Dedicated strategist and creatives", "Weekly planning with your team", "Quarterly strategy reviews"]],
  ];
  const mw = (W - 2 * M - 2 * 0.4) / 3;
  for (let i = 0; i < 3; i++) {
    const x = M + i * (mw + 0.4), y = 2.05, h = 4.5;
    const hl = i === 1;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: mw, h, fill: { color: hl ? C.text1 : C.background2 }, line: { type: "none" }, shadow: hl ? { type: "outer", color: H.dk1, opacity: 0.25, blur: 12, offset: 4, angle: 90 } : undefined, objectName: `Model card ${i + 1}` });
    if (hl) {
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x + 0.4, y: y + 0.35, w: 1.85, h: 0.34, rectRadius: 0.17, fill: { color: C.accent1 }, line: { type: "none" }, objectName: "Recommended pill" });
      txt(s, "RECOMMENDED", { x: x + 0.4, y: y + 0.35, w: 1.85, h: 0.34, align: "center", valign: "middle", fontSize: 10, bold: true, charSpacing: 2, color: C.background1, objectName: "Recommended label" });
    } else {
      ring(s, x + 0.4, y + 0.35, 0.34, C.accent1, 2, `Model ring ${i + 1}`);
    }
    const fg = hl ? C.background1 : C.text1, sub = hl ? C.accent3 : C.accent4;
    txt(s, models[i][0], { x: x + 0.4, y: y + 0.95, w: mw - 0.8, h: 0.5, fontFace: THEME.headFontFace, fontSize: 24, bold: true, color: fg, objectName: `Model name ${i + 1}` });
    txt(s, models[i][1].toUpperCase(), { x: x + 0.4, y: y + 1.5, w: mw - 0.8, h: 0.3, fontSize: 11, bold: true, charSpacing: 1, color: C.accent1, objectName: `Model terms ${i + 1}` });
    txt(s, models[i][2], { x: x + 0.4, y: y + 1.95, w: mw - 0.8, h: 0.75, fontSize: 15, color: sub, objectName: `Model summary ${i + 1}` });
    s.addShape(pres.shapes.LINE, { x: x + 0.4, y: y + 2.85, w: mw - 0.8, h: 0, line: { color: hl ? C.accent5 : C.accent3, width: 1 }, objectName: `Model divider ${i + 1}` });
    txt(s, models[i][3].map((t, j, a) => ({ text: t, options: { bullet: { indent: 14 }, breakLine: j < a.length - 1 } })), { x: x + 0.4, y: y + 3.05, w: mw - 0.8, h: 1.3, fontSize: 14, color: fg, paraSpaceAfter: 6, objectName: `Model includes ${i + 1}` });
  }
  s.addNotes("Most clients start with a Launch Sprint or go straight into a Growth Partnership. The sprint is a low-risk way to see how we work before a longer commitment. Pricing is scoped after the discovery call.");

  // ======================= 9. FIRST 90 DAYS =======================
  s = pres.addSlide({ masterName: "Content Light", sectionTitle: "Working together" });
  s.addText("YOUR FIRST 90 DAYS", { placeholder: "kicker" });
  s.addText("What a Growth Partnership looks like", { placeholder: "title" });
  const gx = M + 2.3, gwid = W - M - gx, wk = gwid / 12;
  const phases = [["Foundations", 0, 4, "1–30"], ["Launch", 4, 8, "31–60"], ["Optimize", 8, 12, "61–90"]];
  phases.forEach(([name, a, b, days], i) => {
    s.addShape(pres.shapes.RECTANGLE, { x: gx + a * wk, y: 2.0, w: (b - a) * wk - 0.08, h: 0.55, fill: { color: i === 2 ? C.accent1 : i === 1 ? C.accent5 : C.text1 }, line: { type: "none" }, objectName: `Phase ${name}` });
    txt(s, `${name}  ·  Days ${days}`, { x: gx + a * wk + 0.15, y: 2.0, w: (b - a) * wk - 0.3, h: 0.55, valign: "middle", fontSize: 13, bold: true, color: C.background1, objectName: `Phase label ${name}` });
  });
  for (let k = 0; k < 12; k++) {
    txt(s, `W${k + 1}`, { x: gx + k * wk, y: 2.7, w: wk, h: 0.25, align: "center", fontSize: 10, color: C.accent4, objectName: `Week ${k + 1}` });
  }
  const streams = [
    ["Strategy", [[0, 3, "Audit, audience and goals"]]],
    ["Creative", [[1, 5, "Campaign concept and assets"], [8, 12, "New creative from learnings"]]],
    ["Digital", [[1, 4, "Tracking and landing pages"], [6, 12, "Conversion testing"]]],
    ["Media", [[4, 12, "Launch, then scale winning ads"]]],
    ["Reporting", [[2, 4, "Baseline"], [7, 8, "Report"], [11, 12, "QBR"]]],
  ];
  streams.forEach(([name, bars], r) => {
    const y = 3.15 + r * 0.68;
    if (r % 2 === 0) s.addShape(pres.shapes.RECTANGLE, { x: M, y: y - 0.1, w: W - 2 * M, h: 0.68, fill: { color: C.background2 }, line: { type: "none" }, objectName: `Row band ${name}` });
    txt(s, name, { x: M + 0.15, y, w: 2.0, h: 0.48, valign: "middle", fontSize: 15, bold: true, color: C.text1, objectName: `Stream ${name}` });
    bars.forEach(([a, b, label], j) => {
      s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: gx + a * wk + 0.04, y: y + 0.04, w: (b - a) * wk - 0.08, h: 0.4, rectRadius: 0.2, fill: { color: C.background1 }, line: { color: C.accent1, width: 1.5 }, objectName: `Bar ${name} ${j + 1}` });
      txt(s, label, { x: gx + a * wk + 0.15, y: y + 0.04, w: (b - a) * wk - 0.3, h: 0.4, valign: "middle", align: b - a <= 1 ? "center" : "left", fontSize: 11, color: C.text1, objectName: `Bar label ${name} ${j + 1}` });
    });
  });
  s.addNotes("This is a typical first quarter. Month one builds the foundations: tracking, audience work and the campaign concept. Month two launches. Month three doubles down on what's working, and we finish with a quarterly business review to set the next 90 days.");

  // ======================= 10. MEASUREMENT =======================
  s = pres.addSlide({ masterName: "Content Light", sectionTitle: "Working together" });
  s.addText("HOW WE MEASURE", { placeholder: "kicker" });
  s.addText("We report on what moves the business", { placeholder: "title" });
  const fun = [
    ["Awareness", "Reach in target audience, branded search, share of voice"],
    ["Consideration", "Engaged sessions, email sign-ups, content saves and shares"],
    ["Conversion", "Leads or orders, conversion rate, cost per acquisition"],
    ["Loyalty", "Repeat purchase, customer lifetime value, reviews"],
  ];
  const fx = M, fw = 5.4;
  const fills = [C.accent3, C.accent2, C.accent5, C.accent1];
  for (let i = 0; i < 4; i++) {
    const inset = i * 0.45, y = 2.05 + i * 1.12;
    s.addShape(pres.shapes.RECTANGLE, { x: fx + inset, y, w: fw - 2 * inset, h: 0.95, fill: { color: fills[i] }, line: { type: "none" }, objectName: `Funnel stage ${i + 1}` });
    txt(s, fun[i][0], { x: fx + inset, y, w: fw - 2 * inset, h: 0.95, align: "center", valign: "middle", fontFace: THEME.headFontFace, fontSize: 20, bold: true, color: i === 0 ? C.text1 : C.background1, objectName: `Funnel label ${i + 1}` });
    s.addShape(pres.shapes.LINE, { x: fx + fw - inset + 0.15, y: y + 0.475, w: 6.8 - (fx + fw - inset + 0.15), h: 0, line: { color: C.accent3, width: 1, dashType: "dash" }, objectName: `Funnel leader ${i + 1}` });
    txt(s, fun[i][1], { x: 7.0, y, w: W - M - 7.0, h: 0.95, valign: "middle", fontSize: 15, color: C.text1, objectName: `Funnel KPIs ${i + 1}` });
  }
  s.addNotes("We agree a small set of KPIs at each stage of the funnel during Define. Every monthly report leads with the conversion and loyalty numbers, because those are the ones that pay for the marketing.");

  // ======================= 11. TEAM =======================
  s = pres.addSlide({ masterName: "Content Light", sectionTitle: "Working together" });
  s.addText("YOUR TEAM", { placeholder: "kicker" });
  s.addText("Senior people, one point of contact", { placeholder: "title" });
  const team = [
    ["FiUser", "Account Lead", "Your single point of contact. Owns timelines, budget and the weekly check-in."],
    ["FiCompass", "Brand Strategist", "Leads research and positioning and keeps every channel on message."],
    ["FiPenTool", "Creative Director", "Sets the creative bar across identity, content and campaigns."],
    ["FiCode", "Digital Lead", "Builds and improves your website, tracking and conversion paths."],
    ["FiActivity", "Growth Marketer", "Plans and optimizes paid media, email and the testing roadmap."],
  ];
  const tw5 = (W - 2 * M - 4 * 0.3) / 5;
  for (let i = 0; i < 5; i++) {
    const x = M + i * (tw5 + 0.3), cx = x + tw5 / 2;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 2.05, w: tw5, h: 3.75, fill: { color: i === 0 ? C.text1 : C.background2 }, line: { type: "none" }, objectName: `Team card ${i + 1}` });
    ring(s, cx - 0.65, 2.4, 1.3, C.accent1, 2, `Team ring ${i + 1}`);
    s.addImage({ data: await icon(team[i][0], i === 0 ? "FFFFFF" : H.dk1), x: cx - 0.27, y: 2.78, w: 0.54, h: 0.54, altText: team[i][1], objectName: `Team icon ${i + 1}` });
    txt(s, team[i][1], { x: x + 0.2, y: 3.85, w: tw5 - 0.4, h: 0.75, valign: "middle", align: "center", fontFace: THEME.headFontFace, fontSize: 18, bold: true, color: i === 0 ? C.background1 : C.text1, objectName: `Team role ${i + 1}` });
    txt(s, team[i][2], { x: x + 0.25, y: 4.7, w: tw5 - 0.5, h: 1.0, fontSize: 13, color: i === 0 ? C.accent3 : C.accent4, align: "center", objectName: `Team desc ${i + 1}` });
  }
  txt(s, [
    { text: "Every engagement includes ", options: { color: C.text1 } },
    { text: "a weekly check-in, a shared project board and a monthly performance report.", options: { bold: true, color: C.text1 } },
  ], { x: M, y: 6.1, w: W - 2 * M, h: 0.45, fontSize: 16, objectName: "Team takeaway" });
  s.addNotes("Team size flexes with the engagement. A Launch Sprint might use three of these roles; a Growth Partnership uses all five. Add names and headshots here before sending to a specific client.");

  // ======================= 12. CLOSE =======================
  pres.addSection({ title: "Next steps" });
  s = pres.addSlide({ masterName: "Content Dark", sectionTitle: "Next steps" });
  s.addText("NEXT STEPS", { placeholder: "kicker" });
  ring(s, 9.6, -1.6, 5.4, C.accent1, 2.5, "Close ring");
  txt(s, "Let's build the brand people choose", { x: M, y: 1.0, w: 8.4, h: 1.8, fontFace: THEME.headFontFace, fontSize: 44, bold: true, color: C.background1, objectName: "Close title" });
  const next = [
    ["Discovery call", "30 minutes", "We learn about your goals, audience and what's been tried so far."],
    ["Brand & growth audit", "Within 1 week", "A short review of your brand, website and channels with quick wins."],
    ["Proposal & roadmap", "Within 2 weeks", "A scoped plan, timeline and investment, tailored to your goals."],
  ];
  const nw = (W - 2 * M - 2 * 0.4) / 3;
  for (let i = 0; i < 3; i++) {
    const x = M + i * (nw + 0.4), y = 3.4;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: nw, h: 2.85, fill: { color: C.text2 }, line: { type: "none" }, objectName: `Next card ${i + 1}` });
    dot(s, x + 0.4, y + 0.4, 0.75, i === 0 ? C.accent1 : C.accent5, `Next circle ${i + 1}`);
    txt(s, String(i + 1), { x: x + 0.4, y: y + 0.4, w: 0.75, h: 0.75, align: "center", valign: "middle", fontFace: THEME.headFontFace, fontSize: 22, bold: true, color: C.background1, objectName: `Next number ${i + 1}` });
    txt(s, next[i][1].toUpperCase(), { x: x + 1.35, y: y + 0.4, w: nw - 1.6, h: 0.75, valign: "middle", fontSize: 11, bold: true, charSpacing: 2, color: C.accent1, objectName: `Next timing ${i + 1}` });
    txt(s, next[i][0], { x: x + 0.4, y: y + 1.35, w: nw - 0.8, h: 0.45, fontFace: THEME.headFontFace, fontSize: 21, bold: true, color: C.background1, objectName: `Next heading ${i + 1}` });
    txt(s, next[i][2], { x: x + 0.4, y: y + 1.85, w: nw - 0.8, h: 0.85, fontSize: 14, color: C.accent3, objectName: `Next body ${i + 1}` });
  }
  s.addNotes("Close by proposing a date for the discovery call. The audit is complimentary and gives the client something useful whether or not they go ahead.");

  const out = "Marvani-Agency-Credentials.pptx";
  await pres.writeFile({ fileName: out });
  await applyTheme(out, THEME);
  console.log("wrote", out);
})();
