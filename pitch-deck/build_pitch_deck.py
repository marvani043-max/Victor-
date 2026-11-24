"""Client pitch deck for a marketing agency.

Run:  python3 pitch-deck/build_pitch_deck.py
Out:  pitch-deck/Agency-Pitch-Deck.pptx

The deck follows the three folders in "Marketing Stuff":
  1. Understand Client Goals
  2. Examples of things I've done for other brands
  3. How can I help this business grow
Anything in [square brackets] is meant to be filled in before a meeting.
Speaker notes on every slide say what to say and ask.
"""
import os
from PIL import Image
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(HERE, 'Agency-Pitch-Deck.pptx')
ASSETS = os.path.join(HERE, 'assets')
os.makedirs(ASSETS, exist_ok=True)

NAVY = '101D32'; PANEL = '1B2D46'; PANEL2 = '24395A'
WHITE = 'FFFFFF'; TEAL = '50DFBE'; GRAY = 'B6C2D2'; DIM = '7F8FA6'
HEAD = 'Cambria'; BODY = 'Calibri'
AGENCY = '[YOUR AGENCY NAME]'
CLIENT = '[Client Business]'

prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)


def rgb(c):
    return RGBColor.from_string(c)


def box(sl, x, y, w, h, color, shape=MSO_SHAPE.ROUNDED_RECTANGLE, line=None, name=None):
    s = sl.shapes.add_shape(shape, Inches(x), Inches(y), Inches(w), Inches(h))
    if shape == MSO_SHAPE.ROUNDED_RECTANGLE:
        s.adjustments[0] = 0.06
    if color:
        s.fill.solid(); s.fill.fore_color.rgb = rgb(color)
    else:
        s.fill.background()
    if line:
        s.line.color.rgb = rgb(line); s.line.width = Pt(1.5)
    else:
        s.line.fill.background()
    s.shadow.inherit = False
    if name:
        s.name = name
    return s


def text(sl, x, y, w, h, content, size=16, color=WHITE, bold=False, font=BODY,
         align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, space=8, italic=False):
    """content: a string (newlines = paragraphs) or a list of paragraphs, where
    each paragraph is a string or a list of (text, {size,color,bold,font,italic}) runs."""
    tb = sl.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame; tf.word_wrap = True; tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    paras = content.split('\n') if isinstance(content, str) else content
    for i, para in enumerate(paras):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align; p.space_after = Pt(space)
        runs = [(para, {})] if isinstance(para, str) else para
        for t, o in runs:
            r = p.add_run(); r.text = t
            f = r.font
            f.size = Pt(o.get('size', size)); f.bold = o.get('bold', bold)
            f.italic = o.get('italic', italic)
            f.name = o.get('font', font); f.color.rgb = rgb(o.get('color', color))
    return tb


def circle(sl, x, y, d, label, fill=TEAL, color=NAVY, size=18):
    s = box(sl, x, y, d, d, fill, MSO_SHAPE.OVAL)
    tf = s.text_frame; tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]; p.alignment = PP_ALIGN.CENTER
    r = p.add_run(); r.text = label
    r.font.size = Pt(size); r.font.bold = True; r.font.name = BODY; r.font.color.rgb = rgb(color)
    return s


def photo(sl, src, x, y, w, h):
    """Center-crop a site image to the box and place it."""
    name = os.path.splitext(os.path.basename(src))[0]
    dst = os.path.join(ASSETS, f'{name}-{int(w*100)}x{int(h*100)}.jpg')
    if not os.path.exists(dst):
        im = Image.open(src).convert('RGB')
        target = w / h; iw, ih = im.size
        if iw / ih > target:
            nw = int(ih * target); im = im.crop(((iw - nw) // 2, 0, (iw - nw) // 2 + nw, ih))
        else:
            nh = int(iw / target); im = im.crop((0, (ih - nh) // 2, iw, (ih - nh) // 2 + nh))
        im.thumbnail((1600, 1600)); im.save(dst, quality=85)
    return sl.shapes.add_picture(dst, Inches(x), Inches(y), Inches(w), Inches(h))


def slide(title, kicker, notes):
    sl = prs.slides.add_slide(prs.slide_layouts[6])
    sl.background.fill.solid(); sl.background.fill.fore_color.rgb = rgb(NAVY)
    if kicker:
        text(sl, .6, .55, 12, .3, kicker, 12, TEAL, True)
    if title:
        text(sl, .6, .95, 12.1, .9, title, 36, WHITE, True, HEAD)
    text(sl, .6, 7.0, 9, .25, f'{AGENCY}  |  Prepared for {CLIENT}', 10, DIM)
    text(sl, 12.1, 7.0, .63, .25, f'{len(prs.slides):02}', 10, DIM, align=PP_ALIGN.RIGHT)
    sl.notes_slide.notes_text_frame.text = notes
    return sl


IMG = lambda n: os.path.join(ROOT, 'public', 'images', n)

# 1. Title ----------------------------------------------------------------
sl = slide(None, AGENCY,
           'Thank them for their time. Say: "I\'ll keep this to about 20 minutes. '
           'I want to hear about your business first, show you a couple of things we\'ve built, '
           'then share a few ideas for you. Sound good?"')
text(sl, .6, 2.0, 6.6, 2.4, [f"Let's grow", f'{CLIENT} together'], 48, WHITE, True, HEAD, space=0)
text(sl, .6, 4.55, 6.2, 1.0,
     'A short look at your goals, the work we have done for other brands, '
     'and a plan made for your business.', 18, GRAY)
text(sl, .6, 5.85, 6, .35, '[Meeting date]  ·  [Your name], [Your title]', 14, TEAL, True)
photo(sl, IMG('tunnel-crop-duo-1333.webp'), 7.75, .55, 5.0, 6.15)
text(sl, 7.75, 6.78, 5, .2, 'Recent work: Peak Side', 10, DIM, align=PP_ALIGN.RIGHT)

# 2. Agenda ---------------------------------------------------------------
sl = slide("What we'll cover today", 'TODAY',
           'Walk through the three parts quickly. Make it clear the meeting starts with THEM, '
           'not with a sales pitch.')
items = [('01', 'Your goals', 'We listen first: where the business is today and where you want it to go.'),
         ('02', 'Our work', 'Real examples of what we have built for other brands, and what changed.'),
         ('03', 'Your growth plan', 'What we would do in the first 90 days, and what it costs.')]
for i, (n, h, d) in enumerate(items):
    x = .6 + i * 4.1
    box(sl, x, 2.35, 3.8, 3.9, PANEL)
    circle(sl, x + .4, 2.75, .8, n, size=20)
    text(sl, x + .4, 3.85, 3.0, .5, h, 24, WHITE, True, HEAD)
    text(sl, x + .4, 4.5, 3.0, 1.6, d, 16, GRAY)
text(sl, .6, 6.45, 12, .35, 'Then we agree on next steps together.', 14, TEAL, italic=True)

# 3. Section 1: questions -------------------------------------------------
sl = slide('First, tell us about your business', '01  ·  UNDERSTAND YOUR GOALS',
           'Ask each question and let them talk. Take notes; you will use their own words on the '
           'next slide and on the growth plan. Do not pitch yet. Good follow-up: "Why is that '
           'important to you right now?"')
qs = [('What are your goals for the next 12 months?', 'More sales, more locations, a new product?'),
      ('Who is your ideal customer?', 'Age, location, what they care about.'),
      ('Where do new customers come from today?', 'Word of mouth, Instagram, Google, walk-ins?'),
      ('What have you tried that did not work?', 'Ads, agencies, posting on your own?'),
      ('What is holding the business back?', 'Time, budget, know-how, a website that does not sell?'),
      ('What would make this a win for you?', 'The one result that would make it worth it.')]
for i, (q, hint) in enumerate(qs):
    c, r = i % 3, i // 3
    x, y = .6 + c * 4.1, 2.25 + r * 2.25
    box(sl, x, y, 3.8, 1.95, PANEL)
    text(sl, x + .3, y + .28, .5, .4, '?', 24, TEAL, True, HEAD)
    text(sl, x + .75, y + .3, 2.8, .9, q, 17, WHITE, True)
    text(sl, x + .75, y + 1.2, 2.8, .6, hint, 14, GRAY)

# 4. Today vs future ------------------------------------------------------
sl = slide('Where you are today, and where you want to be', '01  ·  UNDERSTAND YOUR GOALS',
           'Fill these in with them, live, or before the meeting from your research. The gap '
           'between the two columns is what your plan closes. Leave any row blank if they do not know.')
rows = ['Monthly revenue', 'New customers per month', 'Website visitors per month', 'Social media followers']
for col, (label, x, fill, lab_color) in enumerate([('TODAY', .6, PANEL, GRAY), ('IN 12 MONTHS', 7.23, PANEL2, TEAL)]):
    box(sl, x, 2.25, 5.5, 4.4, fill)
    text(sl, x + .4, 2.55, 4.7, .35, label, 14, lab_color, True)
    for j, r in enumerate(rows):
        yy = 3.15 + j * .85
        text(sl, x + .4, yy, 2.9, .4, r, 16, WHITE)
        text(sl, x + 3.3, yy, 1.8, .4, '[  ]', 16, lab_color, True, align=PP_ALIGN.RIGHT)
        if j < len(rows) - 1:
            ln = box(sl, x + .4, yy + .62, 4.7, .015, '33496B', MSO_SHAPE.RECTANGLE)
arrow = box(sl, 6.3, 4.1, .75, .7, TEAL, MSO_SHAPE.RIGHT_ARROW)

# 5. Case study: Peak Side ------------------------------------------------
sl = slide('Peak Side: a streetwear brand, online', '02  ·  WORK WE HAVE DONE',
           'Open the live site on your phone or laptop and let them scroll it. Point out the '
           '360° product spin and the fit finder: features most small brands do not have. '
           'Add a real result (orders, time on site, compliments from customers) before you present.')
photo(sl, IMG('night-boxy-trio-960.webp'), .6, 2.15, 3.05, 4.5)
photo(sl, IMG('tunnel-pink-hoodie-1333.webp'), 3.85, 2.15, 2.6, 2.15)
photo(sl, IMG('globe-front-960.webp'), 3.85, 4.5, 2.6, 2.15)
text(sl, 6.95, 2.15, 5.8, .3, 'THE CHALLENGE', 12, TEAL, True)
text(sl, 6.95, 2.5, 5.8, .8,
     'A growing clothing brand whose store looked like every other template site.', 16, WHITE)
text(sl, 6.95, 3.4, 5.8, .3, 'WHAT WE BUILT', 12, TEAL, True)
built = ['A custom website that looks and feels like the brand',
         'A matching Shopify store theme, ready to sell',
         '360° product spin viewer and a fit finder',
         'A Winter Drop launch page with pre-orders']
text(sl, 6.95, 3.75, 5.8, 1.7,
     [[('✓  ', {'color': TEAL, 'bold': True}), (b, {})] for b in built], 16, WHITE, space=6)
box(sl, 6.95, 5.6, 5.8, 1.05, PANEL)
text(sl, 7.25, 5.75, 5.3, .8,
     [[('RESULT  ', {'color': TEAL, 'bold': True, 'size': 12})],
      [('[Add a result, e.g. "more online orders in the first month of the Winter Drop"]', {})]],
     15, WHITE, space=2)

# 6. Case study template --------------------------------------------------
sl = slide('[Brand name]: [what kind of business]', '02  ·  WORK WE HAVE DONE',
           'Copy this slide once for each past client you want to show. Keep it to one clear story: '
           'problem, what you did, what changed. Swap the grey box for a screenshot or photo '
           '(right-click > Change Picture, or delete it and insert your own).')
ph = box(sl, .6, 2.15, 4.6, 4.5, PANEL, line='33496B')
text(sl, .6, 4.1, 4.6, .6, 'Drop a photo or screenshot here', 14, DIM, align=PP_ALIGN.CENTER)
cols = [('THE CHALLENGE', '[What problem did they come to you with?]'),
        ('WHAT WE DID', '[2–3 things you did, in plain words]'),
        ('THE RESULT', '[A number if you have one: followers, sales, bookings]')]
for i, (h, d) in enumerate(cols):
    y = 2.15 + i * 1.55
    circle(sl, 5.7, y + .1, .6, str(i + 1), size=16)
    text(sl, 6.6, y + .05, 6.1, .3, h, 12, TEAL, True)
    text(sl, 6.6, y + .4, 6.1, .9, d, 18, WHITE)

# 7. Results at a glance ---------------------------------------------------
sl = slide('Results we have delivered', '02  ·  WORK WE HAVE DONE',
           'Only use numbers you can back up. If you are just starting out, swap these for '
           '"years of experience", "brands worked with" and "posts / pages created". Or delete this slide.')
stats = [('[X]', 'brands and businesses helped'), ('[X]%', 'average growth in [sales / followers]'),
         ('[X]', 'websites and stores launched')]
for i, (n, l) in enumerate(stats):
    x = .6 + i * 4.1
    box(sl, x, 2.5, 3.8, 3.2, PANEL)
    text(sl, x + .4, 2.95, 3.0, 1.2, n, 66, TEAL, True, HEAD)
    text(sl, x + .4, 4.35, 3.0, 1.0, l, 18, WHITE)
text(sl, .6, 6.1, 12, .4,
     '"[A short quote from a happy client.]"  [Name, Business]', 16, GRAY, italic=True)

# 8. Services --------------------------------------------------------------
sl = slide('What we can do for you', '03  ·  HOW WE HELP YOU GROW',
           'Do not read all six. Point to the two or three that match what they told you on the '
           'goals slide, and say why.')
svc = [('Web', 'Websites & online stores', 'Fast, good-looking sites that turn visitors into customers.'),
       ('Social', 'Social media content', 'Posts, reels and a calendar so you show up every week.'),
       ('Ads', 'Paid ads', 'Meta, Google and TikTok ads aimed at the right local customers.'),
       ('Brand', 'Branding & design', 'Logo, colors and a look people remember.'),
       ('Email', 'Email & text marketing', 'Bring past customers back with offers and news.'),
       ('SEO', 'Google & local search', 'Show up when people nearby search for what you sell.')]
for i, (tag, h, d) in enumerate(svc):
    c, r = i % 3, i // 3
    x, y = .6 + c * 4.1, 2.25 + r * 2.25
    box(sl, x, y, 3.8, 1.95, PANEL)
    circle(sl, x + .3, y + .3, .75, tag, PANEL2, TEAL, 11)
    text(sl, x + 1.25, y + .3, 2.35, .7, h, 17, WHITE, True)
    text(sl, x + 1.25, y + 1.0, 2.35, .85, d, 14, GRAY)

# 9. 90-day plan ------------------------------------------------------------
sl = slide(f'Your 90-day growth plan', '03  ·  HOW WE HELP YOU GROW',
           'Make it feel concrete and low-risk: they see progress every month, and month one '
           'fixes the basics before any ad money is spent. Adjust the steps to what they need.')
box(sl, 1.25, 2.85, 10.9, .05, '33496B', MSO_SHAPE.RECTANGLE)
phases = [('Month 1', 'Get the basics right', ['Review your site, socials and ads', 'Fix what is costing you customers', 'Set up tracking so we can measure']),
          ('Month 2', 'Launch', ['Content calendar goes live', 'First ad campaigns running', 'Email to past customers']),
          ('Month 3', 'Grow', ['Put more behind what works', 'Cut what does not', 'Report and plan the next 90 days'])]
for i, (m, h, pts) in enumerate(phases):
    x = .6 + i * 4.1
    circle(sl, x + .35, 2.5, .75, str(i + 1), size=20)
    box(sl, x, 3.6, 3.8, 3.05, PANEL)
    text(sl, x + .35, 3.85, 3.1, .3, m.upper(), 12, TEAL, True)
    text(sl, x + .35, 4.2, 3.1, .5, h, 22, WHITE, True, HEAD)
    text(sl, x + .35, 4.85, 3.2, 1.7, [[('•  ', {'color': TEAL}), (p, {})] for p in pts], 15, GRAY, space=6)

# 10. Ideas for this client ----------------------------------------------------
sl = slide(f'Three ideas for {CLIENT}', '03  ·  HOW WE HELP YOU GROW',
           'Fill this in before every meeting. Spend 15 minutes on their website, Google profile '
           'and Instagram. Specific ideas ("your Google profile has no photos") prove you did '
           'your homework and are what wins the client.')
ideas = [('Quick win', '[Something small you noticed, e.g. "Your Google profile has no photos or hours"]', '[What it gets them, e.g. "more calls from people nearby"]'),
         ('Bigger move', '[e.g. "A booking button on your website and Instagram"]', '[e.g. "customers can book at 10pm, not just when you pick up"]'),
         ('Long-term', '[e.g. "Monthly email to past customers with a reason to come back"]', '[e.g. "repeat visits without paying for ads"]')]
for i, (tag, idea, why) in enumerate(ideas):
    y = 2.2 + i * 1.5
    box(sl, .6, y, 12.13, 1.3, PANEL)
    circle(sl, .95, y + .28, .75, str(i + 1), size=20)
    text(sl, 2.05, y + .22, 2.0, .3, tag.upper(), 12, TEAL, True)
    text(sl, 2.05, y + .55, 6.0, .7, idea, 16, WHITE, True)
    text(sl, 8.4, y + .22, 4.0, .3, 'WHAT IT DOES FOR YOU', 12, DIM, True)
    text(sl, 8.4, y + .55, 4.0, .7, why, 15, GRAY)

# 11. Packages ------------------------------------------------------------------
sl = slide('Pick the plan that fits', '03  ·  HOW WE HELP YOU GROW',
           'Set your prices before you present. Most people pick the middle option, so make it '
           'the one you want them to choose. Ask: "Which of these feels like the right fit?"')
pk = [('Starter', '[$___]', ['Social media: 3 posts a week', 'Google profile managed', 'Monthly results report'], False),
      ('Growth', '[$___]', ['Everything in Starter', 'Paid ads set up and managed', 'Email to past customers', 'Call every two weeks'], True),
      ('Premium', '[$___]', ['Everything in Growth', 'New website or online store', 'Daily social posts and reels', 'Weekly strategy call'], False)]
for i, (name, price, feats, hot) in enumerate(pk):
    x = .6 + i * 4.1
    box(sl, x, 2.2, 3.8, 4.45, PANEL2 if hot else PANEL, line=TEAL if hot else None)
    if hot:
        tag = box(sl, x + 2.15, 2.4, 1.4, .36, TEAL)
        text(sl, x + 2.15, 2.47, 1.4, .3, 'MOST POPULAR', 10, NAVY, True, align=PP_ALIGN.CENTER)
    text(sl, x + .35, 2.45, 2.0, .4, name, 22, WHITE, True, HEAD)
    text(sl, x + .35, 3.0, 3.1, .7, [[(price, {'size': 36, 'bold': True, 'color': TEAL, 'font': HEAD}),
                                     (' / month', {'size': 14, 'color': GRAY})]], 14, space=0)
    text(sl, x + .35, 4.0, 3.2, 2.5, [[('✓  ', {'color': TEAL, 'bold': True}), (f, {})] for f in feats], 15, WHITE, space=8)

# 12. Next steps ------------------------------------------------------------------
sl = slide("Let's get started", 'NEXT STEPS',
           'Ask for the decision: "Which plan would you like to start with?" If they need time, '
           'book the follow-up call before you hang up. Send this deck by email the same day.')
steps = [('Pick a plan', 'Choose the package that fits, today or after a quick follow-up.'),
         ('Kickoff call', 'A 45-minute call this week to get logins, photos and details.'),
         ('Your 30-day plan', 'Within a week you get a written plan and we start work.')]
for i, (h, d) in enumerate(steps):
    y = 2.2 + i * 1.45
    circle(sl, .6, y, .8, str(i + 1), size=22)
    text(sl, 1.7, y + .02, 5.0, .45, h, 22, WHITE, True, HEAD)
    text(sl, 1.7, y + .52, 5.0, .7, d, 16, GRAY)
box(sl, 7.4, 2.2, 5.33, 4.45, PANEL)
text(sl, 7.8, 2.55, 4.6, .3, 'GET IN TOUCH', 12, TEAL, True)
text(sl, 7.8, 3.0, 4.6, .6, '[Your name]', 28, WHITE, True, HEAD)
text(sl, 7.8, 3.65, 4.6, .4, f'{AGENCY}', 15, GRAY)
text(sl, 7.8, 4.45, 4.6, 1.8, ['[Phone number]', '[Email address]', '[Website]', '[@instagram]'], 18, WHITE, space=6)

prs.save(OUT)
print('Saved', OUT, f'({len(prs.slides)} slides)')
