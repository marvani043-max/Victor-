/* Bighorn Construction & Hardscape: site behaviour. No dependencies. */
(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var PHONE = '+17754403757', PHONE_TXT = '775-440-3757', EMAIL = 'bighorn.build@gmail.com';
  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function onScroll(fn) { var t = false; window.addEventListener('scroll', function () { if (!t) { t = true; requestAnimationFrame(function () { t = false; fn(); }); } }, { passive: true }); window.addEventListener('resize', fn); fn(); }

  /* ---------------- header, mega menu, mobile menu ---------------- */
  var head = $('#site-head');
  if (head) onScroll(function () { head.classList.toggle('scrolled', window.scrollY > 10); });

  $$('.has-menu').forEach(function (item) {
    var caret = $('.nav-caret', item);
    if (!caret) return;
    caret.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !item.classList.contains('open');
      item.classList.toggle('open', open);
      caret.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', function (e) { if (!item.contains(e.target)) { item.classList.remove('open'); caret.setAttribute('aria-expanded', 'false'); } });
    item.addEventListener('keydown', function (e) { if (e.key === 'Escape') { item.classList.remove('open'); caret.setAttribute('aria-expanded', 'false'); caret.focus(); } });
  });

  var menuBtn = $('#menu-btn'), mnav = $('#mnav');
  function setMenu(open) {
    if (!menuBtn || !mnav) return;
    menuBtn.setAttribute('aria-expanded', String(open));
    $('.menu-lbl', menuBtn).textContent = open ? 'Close' : 'Menu';
    mnav.hidden = !open;
    mnav.classList.toggle('open', open);
    doc.classList.toggle('menu-open', open);
    doc.style.overflow = open ? 'hidden' : '';
  }
  if (menuBtn && mnav) {
    menuBtn.addEventListener('click', function () { setMenu(mnav.hidden); });
    $$('a', mnav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !mnav.hidden) { setMenu(false); menuBtn.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth > 1180 && !mnav.hidden) setMenu(false); });
  }

  /* ---------------- topographic contours (marching squares over value noise) ---------------- */
  function Topo(canvas, o) {
    var ctx = canvas.getContext && canvas.getContext('2d'); if (!ctx) return null;
    var perm = new Uint8Array(512), s = o.seed, i, j, t;
    for (i = 0; i < 256; i++) perm[i] = i;
    for (i = 255; i > 0; i--) { s = (s * 16807) % 2147483647; j = s % (i + 1); t = perm[i]; perm[i] = perm[j]; perm[j] = t; }
    for (i = 0; i < 256; i++) perm[i + 256] = perm[i];
    function vn(x, y) {
      var X = Math.floor(x), Y = Math.floor(y), xf = x - X, yf = y - Y, xi = X & 255, yi = Y & 255;
      var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
      var a = perm[perm[xi] + yi], b = perm[perm[xi + 1] + yi], c = perm[perm[xi] + yi + 1], d = perm[perm[xi + 1] + yi + 1];
      var top = a + (b - a) * u, bot = c + (d - c) * u; return (top + (bot - top) * v) / 255;
    }
    function fbm(x, y) { var v = 0, a = 0.5, f = 1; for (var k = 0; k < 4; k++) { v += a * vn(x * f, y * f); f *= 2.03; a *= 0.5; } return v; }
    var lastW = 0, lastH = 0;
    function draw() {
      var w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
      if (Math.abs(w - lastW) < 2 && Math.abs(h - lastH) < 2) return; lastW = w; lastH = h;
      var dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h);
      var cell = 10, cols = Math.ceil(w / cell) + 1, rows = Math.ceil(h / cell) + 1, sc = o.scale;
      var F = new Float32Array(cols * rows), mn = 1e9, mx = -1e9, x, y;
      for (y = 0; y < rows; y++) for (x = 0; x < cols; x++) {
        var px = x * cell, py = y * cell;
        var val = fbm(px * sc + o.ox, py * sc + o.oy) + o.tilt * (px / Math.max(w, 900)) - o.tilt * 0.3 * (py / Math.max(h, 500));
        F[y * cols + x] = val; if (val < mn) mn = val; if (val > mx) mx = val;
      }
      var levels = o.levels, step = (mx - mn) / levels;
      for (var L = 1; L < levels; L++) {
        var th = mn + L * step; ctx.beginPath();
        for (y = 0; y < rows - 1; y++) for (x = 0; x < cols - 1; x++) {
          var a = F[y * cols + x], b = F[y * cols + x + 1], c = F[(y + 1) * cols + x + 1], d = F[(y + 1) * cols + x];
          var idx = (a > th ? 8 : 0) | (b > th ? 4 : 0) | (c > th ? 2 : 0) | (d > th ? 1 : 0);
          if (idx === 0 || idx === 15) continue;
          var X0 = x * cell, Y0 = y * cell;
          var T = [X0 + cell * (th - a) / (b - a), Y0], R = [X0 + cell, Y0 + cell * (th - b) / (c - b)],
            B = [X0 + cell * (th - d) / (c - d), Y0 + cell], Lf = [X0, Y0 + cell * (th - a) / (d - a)], sg;
          switch (idx) {
            case 1: case 14: sg = [Lf, B]; break;
            case 2: case 13: sg = [B, R]; break;
            case 3: case 12: sg = [Lf, R]; break;
            case 4: case 11: sg = [T, R]; break;
            case 6: case 9: sg = [T, B]; break;
            case 7: case 8: sg = [Lf, T]; break;
            case 5: sg = [Lf, T, B, R]; break;
            case 10: sg = [T, R, Lf, B]; break;
          }
          for (var k = 0; k < sg.length; k += 2) { ctx.moveTo(sg[k][0], sg[k][1]); ctx.lineTo(sg[k + 1][0], sg[k + 1][1]); }
        }
        var index = L % 5 === 0;
        ctx.strokeStyle = index ? o.index : o.line; ctx.lineWidth = index ? 1.1 : 0.7; ctx.stroke();
      }
    }
    draw();
    var tid, ro = 'ResizeObserver' in window ? new ResizeObserver(function () { clearTimeout(tid); tid = setTimeout(draw, 140); }) : null;
    if (ro) ro.observe(canvas); else window.addEventListener('resize', function () { clearTimeout(tid); tid = setTimeout(draw, 160); });
    return { draw: draw };
  }
  var topoCfg = {
    hero: { seed: 11, scale: 0.0042, ox: 3.1, oy: 7.4, tilt: 0.35, levels: 20, line: 'rgba(239,232,220,0.07)', index: 'rgba(207,181,138,0.3)' },
    head: { seed: 4, scale: 0.0036, ox: 9.2, oy: 1.3, tilt: 0.25, levels: 18, line: 'rgba(239,232,220,0.06)', index: 'rgba(207,181,138,0.22)' },
    cta: { seed: 23, scale: 0.0038, ox: 1.7, oy: 4.9, tilt: 0.25, levels: 18, line: 'rgba(239,232,220,0.06)', index: 'rgba(207,181,138,0.24)' }
  };
  function initTopo() { $$('canvas[data-topo]').forEach(function (c) { var cfg = topoCfg[c.getAttribute('data-topo')]; if (cfg) Topo(c, cfg); }); }
  if ('requestIdleCallback' in window) requestIdleCallback(initTopo, { timeout: 1200 }); else setTimeout(initTopo, 200);

  /* ---------------- hero: background jobs with a project switcher ---------------- */
  var hero = $('[data-hero]');
  if (hero) (function () {
    var slides = $$('.hero-slide', hero), items = $$('.hp-item', hero), link = $('[data-hero-link]', hero);
    var cur = 0, timer = 0, DUR = 7000, visible = true;
    hero.style.setProperty('--cyc-dur', DUR + 'ms');
    function loadAll() { $$('img[data-src]', hero).forEach(function (img) { img.srcset = img.getAttribute('data-srcset'); img.src = img.getAttribute('data-src'); img.removeAttribute('data-src'); img.removeAttribute('data-srcset'); }); }
    function running() { return !reduce && visible && !document.hidden; }
    function show(i) {
      cur = (i + slides.length) % slides.length;
      slides.forEach(function (sl, k) { sl.classList.toggle('is-on', k === cur); });
      items.forEach(function (b, k) { if (k === cur) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
      if (link && items[cur]) link.href = items[cur].getAttribute('data-href');
      hero.classList.remove('cycling'); void hero.offsetWidth; if (running()) hero.classList.add('cycling');
      clearTimeout(timer); if (running()) timer = setTimeout(function () { show(cur + 1); }, DUR);
    }
    items.forEach(function (b, k) { b.addEventListener('click', function () { loadAll(); show(k); }); });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) show(cur); else { clearTimeout(timer); hero.classList.remove('cycling'); } }, { threshold: 0.2 }).observe(hero);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) show(cur); else clearTimeout(timer); });
    function boot() { loadAll(); show(0); }
    if (document.readyState === 'complete') boot(); else window.addEventListener('load', boot);
  })();

  /* ---------------- project spotlight carousel ---------------- */
  $$('[data-spot]').forEach(function (spot) {
    var slides = $$('.spot-slide', spot), n = $('[data-spot-n]', spot), cur = 0;
    if (slides.length < 2) return;
    function show(i, animate) {
      cur = (i + slides.length) % slides.length;
      slides.forEach(function (sl, k) { sl.hidden = k !== cur; sl.classList.toggle('enter', !!animate && k === cur); });
      if (n) n.textContent = String(cur + 1).padStart(2, '0');
    }
    $('[data-spot-prev]', spot).addEventListener('click', function () { show(cur - 1, true); });
    $('[data-spot-next]', spot).addEventListener('click', function () { show(cur + 1, true); });
    spot.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') show(cur - 1, true); if (e.key === 'ArrowRight') show(cur + 1, true); });
    var x0 = null, stage = $('.spot-stage', spot);
    stage.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend', function (e) { if (x0 === null) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1), true); x0 = null; }, { passive: true });
    show(0, false);
  });

  /* ---------------- floating preview on the services list ---------------- */
  var plist = $('[data-preview-list]'), fp = $('.float-preview');
  if (plist && fp && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var fimg = $('img', fp), fx = 0, fy = 0;
    plist.addEventListener('mousemove', function (e) {
      var w = fp.offsetWidth, h = fp.offsetHeight;
      fx = clamp(e.clientX + 32, 16, window.innerWidth - w - 16);
      fy = clamp(e.clientY - h / 2, 16 + (head ? head.offsetHeight : 0), window.innerHeight - h - 16);
      fp.style.setProperty('--fx', fx + 'px'); fp.style.setProperty('--fy', fy + 'px');
    });
    $$('[data-preview]', plist).forEach(function (row) {
      row.addEventListener('mouseenter', function () {
        var src = row.getAttribute('data-preview');
        if (fimg.getAttribute('src') !== src) fimg.src = src;
        fimg.style.objectPosition = row.getAttribute('data-preview-pos') || '50% 50%';
        fp.classList.add('on');
      });
    });
    plist.addEventListener('mouseleave', function () { fp.classList.remove('on'); });
  }

  /* ---------------- before/after toggles (phones) ---------------- */
  $$('[data-ba]').forEach(function (ba) {
    ba.setAttribute('data-show', 'after');
    $$('.ba-toggle button', ba).forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-show');
        ba.setAttribute('data-show', v);
        $$('.ba-toggle button', ba).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      });
    });
  });

  /* ---------------- process progress ---------------- */
  $$('[data-steps]').forEach(function (steps) {
    var items = $$('.step', steps);
    onScroll(function () {
      var r = steps.getBoundingClientRect(), vh = window.innerHeight;
      var vertical = getComputedStyle(steps).gridTemplateColumns.split(' ').length < 2;
      var p = clamp((vh * 0.75 - r.top) / (r.height * (vertical ? 1 : 1.5) + 1), 0, 1);
      steps.style.setProperty('--p', p.toFixed(3));
      items.forEach(function (s, i) {
        var at = vertical ? (s.offsetTop + 30) / (r.height || 1) : i / Math.max(1, items.length - 1);
        s.classList.toggle('reached', p >= at - 0.001);
      });
    });
  });

  /* ---------------- service-area map ---------------- */
  $$('.area').forEach(function (area) {
    var btns = $$('.towns button', area), gs = $$('.map .town', area);
    function sel(id) { btns.forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-town') === id); }); gs.forEach(function (g) { g.classList.toggle('on', g.getAttribute('data-town') === id); }); }
    btns.forEach(function (b) { ['click', 'mouseenter', 'focus'].forEach(function (ev) { b.addEventListener(ev, function () { sel(b.getAttribute('data-town')); }); }); });
    gs.forEach(function (g) { ['click', 'pointerenter'].forEach(function (ev) { g.addEventListener(ev, function () { sel(g.getAttribute('data-town')); }); }); });
    sel('reno');
  });

  /* ---------------- project filter ---------------- */
  var filter = $('.filter');
  if (filter) {
    var rows = $$('.proj-row'), live = $('[data-filter-live]');
    $$('button', filter).forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-filter'), n = 0;
        $$('button', filter).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        rows.forEach(function (r) {
          var show = v === 'all' || r.getAttribute('data-cat') === v;
          r.hidden = !show; r.classList.remove('is-in');
          if (show) { n++; void r.offsetWidth; r.classList.add('is-in'); }
        });
        if (live) live.textContent = n + (n === 1 ? ' project' : ' projects') + ' shown';
      });
    });
  }

  /* ---------------- parallax on page-head photos ---------------- */
  var px = $$('[data-parallax]');
  if (px.length && !reduce) onScroll(function () {
    var vh = window.innerHeight;
    px.forEach(function (el) {
      var r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return;
      var c = (r.top + r.height / 2 - vh / 2) / vh;
      el.style.setProperty('--py', (c * -36).toFixed(1) + 'px');
    });
  });

  /* ---------------- copy buttons ---------------- */
  function copyText(text, onDone, selectEl) {
    function fallback() {
      if (selectEl) { var r = document.createRange(); r.selectNodeContents(selectEl); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }
      onDone(false);
    }
    try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { onDone(true); }, fallback); else fallback(); } catch (e) { fallback(); }
  }
  $$('.copy[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var label = b.getAttribute('data-label') || b.textContent; b.setAttribute('data-label', label);
      copyText(b.getAttribute('data-copy'), function (ok) {
        b.textContent = ok ? 'Copied' : 'Selected'; b.classList.toggle('done', ok);
        setTimeout(function () { b.textContent = label; b.classList.remove('done'); }, 1800);
      }, b.parentNode.querySelector('.direct-val'));
    });
  });

  /* ---------------- reveal on scroll ---------------- */
  var rise = $$('[data-rise]');
  if (!reduce && 'IntersectionObserver' in window) {
    var rio = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); rio.unobserve(x.target); } }); }, { rootMargin: '0px 0px -6% 0px' });
    rise.forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < window.innerHeight) el.classList.add('in'); else rio.observe(el); });
  } else rise.forEach(function (el) { el.classList.add('in'); });

  /* ---------------- quote + contact forms ---------------- */
  var SVC_TO_TYPE = { 'concrete': 'concrete', 'pavers-hardscape': 'pavers', 'backyard-design': 'backyard', 'sod-sprinklers': 'sod', 'fencing-gates': 'fencing', 'excavation-grading': 'dirt', 'remodels': 'remodel' };
  $$('[data-qform]').forEach(function (form) {
    var stepped = form.hasAttribute('data-steps-form');
    var stepsEls = $$('.q-step', form), prog = $$('.q-prog li', form), live = $('[data-step-live]', form);
    var back = $('[data-back]', form), next = $('[data-next]', form), submit = $('[data-submit]', form) || $('button[type="submit"]', form);
    var actions = $('.q-actions', form), done = $('[data-done]', form), stepIdx = 0;
    var names = ['Project', 'Details', 'Contact'];

    // preselect a project type from the link (e.g. quote/#concrete)
    var key = SVC_TO_TYPE[(location.hash || '').slice(1)];
    if (key) { var chip = form.querySelector('input[data-key="' + key + '"]'); if (chip) chip.checked = true; }

    function errFor(el) { return document.getElementById(el.id + '-err'); }
    function setErr(el, on) {
      var e = errFor(el); if (!e) return;
      e.hidden = !on;
      if (on) { el.setAttribute('aria-invalid', 'true'); el.setAttribute('aria-describedby', e.id); }
      else { el.removeAttribute('aria-invalid'); el.removeAttribute('aria-describedby'); }
    }
    function validate(scope) {
      var bad = [];
      $$('input[required], textarea[required]', scope).forEach(function (el) {
        var v = el.value.trim(), ok = !!v;
        if (ok && el.type === 'tel') ok = (v.replace(/\D/g, '').length >= 7);
        setErr(el, !ok); if (!ok) bad.push(el);
      });
      $$('input[type="email"]', scope).forEach(function (el) {
        var v = el.value.trim(), ok = !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
        setErr(el, !ok); if (!ok) bad.push(el);
      });
      var group = $('[data-group="type"]', scope);
      if (group) {
        var any = $$('input:checked', group).length > 0, ge = document.getElementById(form.id + '-type-err');
        group.classList.toggle('invalid', !any); if (ge) ge.hidden = any;
        if (!any) bad.push($('input', group));
      }
      if (bad.length) bad[0].focus();
      return !bad.length;
    }
    $$('input, textarea', form).forEach(function (el) {
      el.addEventListener('input', function () { if (el.getAttribute('aria-invalid')) setErr(el, false); });
    });
    $$('[data-group="type"] input', form).forEach(function (el) {
      el.addEventListener('change', function () { var g = el.closest('[data-group]'); g.classList.remove('invalid'); var ge = document.getElementById(form.id + '-type-err'); if (ge) ge.hidden = true; });
    });

    function goStep(i, focus) {
      stepIdx = i;
      stepsEls.forEach(function (s, k) { s.hidden = k !== i; s.classList.toggle('enter', k === i); });
      prog.forEach(function (p, k) { p.classList.toggle('on', k === i); p.classList.toggle('done', k < i); });
      if (back) back.hidden = i === 0;
      if (next) next.hidden = i === stepsEls.length - 1;
      if (submit) submit.hidden = i !== stepsEls.length - 1;
      if (live) live.textContent = 'Step ' + (i + 1) + ' of ' + stepsEls.length + ': ' + names[i];
      if (focus) { var lg = $('.q-legend', stepsEls[i]); if (lg) { lg.setAttribute('tabindex', '-1'); lg.focus({ preventScroll: true }); } var top = form.getBoundingClientRect().top + window.scrollY - (head ? head.offsetHeight : 0) - 24; if (form.getBoundingClientRect().top < 0) window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' }); }
    }
    if (stepped) {
      goStep(0, false);
      next.addEventListener('click', function () { if (validate(stepsEls[stepIdx])) goStep(stepIdx + 1, true); });
      back.addEventListener('click', function () { goStep(stepIdx - 1, true); });
      form.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && e.target.tagName === 'INPUT' && stepIdx < stepsEls.length - 1) { e.preventDefault(); next.click(); }
      });
    }

    function val(n) { var el = form.elements[n]; if (!el) return ''; if (el.length !== undefined && !el.tagName) { for (var i = 0; i < el.length; i++) if (el[i].checked) return el[i].value; return ''; } return (el.value || '').trim(); }
    function data() {
      return {
        name: val('name'), phone: val('phone'), email: val('email'), contact: val('contact') || 'Call',
        types: $$('input[name="type"]:checked', form).map(function (i) { return i.value; }),
        town: val('town'), property: val('property'), timing: val('timing'), size: val('size'), budget: val('budget'),
        description: val('description'), address: val('address')
      };
    }
    function compose(d) {
      var L = [];
      L.push('Hi Bighorn, this is ' + (d.name || 'a homeowner') + '. ' + (stepped ? 'I would like a free estimate.' : 'I have a question about a project.'));
      if (d.types.length) L.push('Project: ' + d.types.join(', '));
      if (d.town) L.push('Location: ' + d.town + (d.property ? ' (' + d.property.toLowerCase() + ')' : ''));
      if (d.timing) L.push('Timing: ' + d.timing);
      if (d.size) L.push('Size: ' + d.size);
      if (d.budget) L.push('Budget: ' + d.budget);
      if (d.description) L.push('Details: ' + d.description);
      if (d.address) L.push('Address: ' + d.address);
      L.push('Phone: ' + d.phone);
      if (d.email) L.push('Email: ' + d.email);
      L.push('Best way to reach me: ' + d.contact.toLowerCase());
      L.push('(Sent from the Bighorn website)');
      return L.join('\n');
    }
    function showDone(mode, d, msg) {
      stepsEls.forEach(function (s) { s.hidden = true; });
      $$('.f-row, .field', form).forEach(function (f) { if (!f.closest('.q-step') && !f.closest('[data-done]')) f.hidden = true; });
      if (actions) actions.hidden = true;
      prog.forEach(function (p) { p.classList.add('done'); p.classList.remove('on'); });
      done.hidden = false;
      $('[data-mode="handoff"]', done).hidden = mode !== 'handoff';
      $('[data-mode="sent"]', done).hidden = mode !== 'sent';
      if (mode === 'handoff') {
        $('[data-msg]', done).textContent = msg;
        var subj = (stepped ? 'Free estimate request' : 'Question from the website') + (d.types.length ? ': ' + d.types.slice(0, 2).join(', ') : '');
        $('[data-sms]', done).href = 'sms:' + PHONE + (isIOS ? '&' : '?') + 'body=' + encodeURIComponent(msg);
        $('[data-mail]', done).href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(msg);
      } else {
        var how = d.contact === 'Email' && d.email ? 'email you at ' + d.email : (d.contact === 'Text' ? 'text you at ' : 'call you at ') + d.phone;
        $('[data-sent-text]', done).textContent = 'We will ' + how + '. If it is urgent, call or text ' + PHONE_TXT + '.';
      }
      done.focus({ preventScroll: true });
      var top = done.getBoundingClientRect().top + window.scrollY - (head ? head.offsetHeight : 0) - 32;
      window.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
    }
    function restore() {
      done.hidden = true;
      $$('.f-row, .field', form).forEach(function (f) { f.hidden = false; });
      if (actions) actions.hidden = false;
      if (stepped) goStep(stepsEls.length - 1, true); else { var f = $('input', form); if (f) f.focus(); }
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (stepped) { for (var i = 0; i < stepsEls.length; i++) { if (!validate(stepsEls[i])) { goStep(i, false); validate(stepsEls[i]); return; } } }
      else if (!validate(form)) return;
      var d = data(), msg = compose(d), endpoint = form.getAttribute('data-endpoint');
      if (!endpoint) { showDone('handoff', d, msg); return; }
      submit.disabled = true; var old = submit.innerHTML; submit.textContent = 'Sending…';
      fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(Object.assign({ message: msg }, d)) })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); showDone('sent', d, msg); })
        .catch(function () {
          showDone('handoff', d, msg);
          var st = $('[data-status]', done); st.classList.add('warn');
          st.textContent = 'Your request could not be sent from this page just now. Send it by text or email instead; everything is filled in.';
        })
        .then(function () { submit.disabled = false; submit.innerHTML = old; });
    });
    var edit = $('[data-edit]', form); if (edit) edit.addEventListener('click', restore);
    var cm = $('[data-copy-msg]', form);
    if (cm) cm.addEventListener('click', function () {
      var pre = $('[data-msg]', form), st = $('[data-status]', form);
      copyText(pre.textContent, function (ok) {
        st.classList.remove('warn');
        st.textContent = ok ? 'Copied. Paste it into a text to ' + PHONE_TXT + ' or an email to ' + EMAIL + '.' : 'Copying is blocked here. The message is selected: press Ctrl+C or Cmd+C.';
      }, pre);
    });
    $$('[data-sms], [data-mail]', form).forEach(function (a) {
      a.addEventListener('click', function () { var st = $('[data-status]', form); st.classList.remove('warn'); st.textContent = 'Your app should open with the message filled in. Press send there. If nothing opened, copy the message instead.'; });
    });
  });
})();
