/* Peak Side theme behaviour. Plain ES2017, no dependencies (works on iOS Safari 12+ / Android Chrome). */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Header: clear over hero, mobile menu ---------------- */
  var header = $('[data-header]');
  var menu = $('[data-mobile-menu]');
  var toggle = $('[data-menu-toggle]');

  function menuOpen() { return menu && !menu.hidden; }

  function updateHeader() {
    if (!header) return;
    var clear = header.hasAttribute('data-transparent') && window.scrollY < 24 && !menuOpen();
    header.classList.toggle('is-clear', clear);
  }

  function setMenu(open) {
    if (!menu || !toggle) return;
    var rect = header.getBoundingClientRect();
    menu.style.setProperty('--menu-top', Math.max(0, rect.bottom) + 'px');
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    document.documentElement.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    var label = $('[data-menu-label]', toggle);
    if (label) label.textContent = open ? label.getAttribute('data-close') : label.getAttribute('data-open');
    updateHeader();
  }

  if (toggle) toggle.addEventListener('click', function () { setMenu(!menuOpen()); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuOpen()) setMenu(false); });
  if (menu) menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  window.addEventListener('scroll', updateHeader, { passive: true });
  window.addEventListener('resize', function () { if (window.innerWidth >= 1024 && menuOpen()) setMenu(false); });
  updateHeader();

  /* ---------------- Copy discount code ---------------- */
  $$('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var original = btn.textContent;
      var done = function () {
        btn.textContent = btn.getAttribute('data-copied-label') || 'Copied';
        setTimeout(function () { btn.textContent = original; }, 2000);
      };
      var fallback = function () {
        var t = document.createElement('textarea');
        t.value = text;
        t.setAttribute('readonly', '');
        t.style.position = 'fixed';
        t.style.opacity = '0';
        document.body.appendChild(t);
        t.select();
        try { document.execCommand('copy'); done(); } catch (e) { /* the code is visible either way */ }
        document.body.removeChild(t);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
      else fallback();
    });
  });

  /* ---------------- Scroll reveal ---------------- */
  var revealEls = $$('[data-reveal]');
  if (reduced || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
    // Safety net: never leave content hidden.
    setTimeout(function () { revealEls.forEach(function (el) { el.classList.add('is-in'); }); }, 4000);
  }

  /* ---------------- Lookbook tabs ---------------- */
  $$('[data-lookbook]').forEach(function (root) {
    var tabs = $$('.look-tab', root);
    var line = $('[data-look-line]', root);
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var key = tab.getAttribute('data-tab');
        tabs.forEach(function (t) { t.setAttribute('aria-selected', String(t === tab)); });
        $$('[data-look]', root).forEach(function (panel) { panel.hidden = panel.getAttribute('data-look') !== key; });
        if (line) line.textContent = tab.getAttribute('data-line');
      });
    });
  });

  /* ---------------- Quantity steppers ---------------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-qty]');
    if (!btn) return;
    var input = btn.parentElement.querySelector('input[type="number"]');
    if (!input) return;
    var min = parseInt(input.min || '0', 10);
    var next = Math.max(min, (parseInt(input.value, 10) || 0) + parseInt(btn.getAttribute('data-qty'), 10));
    input.value = next;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  /* ---------------- Collection sort ---------------- */
  $$('[data-sort-form] select').forEach(function (select) {
    select.addEventListener('change', function () { select.form.submit(); });
  });

  /* ---------------- Cart: auto-update quantities ---------------- */
  var cartForm = $('[data-cart-form]');
  if (cartForm) {
    var timer;
    cartForm.addEventListener('change', function (e) {
      if (!e.target.matches('[data-cart-qty]')) return;
      clearTimeout(timer);
      timer = setTimeout(function () {
        var update = $('[data-cart-update]', cartForm);
        if (update) update.click();
      }, 500);
    });
  }

  /* ---------------- Product page ---------------- */
  $$('[data-product]').forEach(function (section) {
    var variantsEl = $('[data-variants]', section);
    var variants = [];
    try { variants = JSON.parse(variantsEl ? variantsEl.textContent : '[]'); } catch (e) { variants = []; }
    var form = document.getElementById(section.getAttribute('data-form-id'));
    var idInput = form ? $('[data-variant-id]', form) : null;
    var fieldsets = $$('[data-option-index]', section);
    var coming = section.getAttribute('data-coming') === 'true';

    function selectedOptions() {
      return fieldsets.map(function (fs) {
        var checked = $('input:checked', fs);
        return checked ? checked.value : null;
      });
    }

    function findVariant(opts) {
      for (var i = 0; i < variants.length; i++) {
        var v = variants[i];
        var ok = true;
        for (var j = 0; j < opts.length; j++) if (v.options[j] !== opts[j]) { ok = false; break; }
        if (ok) return v;
      }
      return null;
    }

    function markAvailability(opts) {
      fieldsets.forEach(function (fs, index) {
        $$('input', fs).forEach(function (input) {
          var test = opts.slice();
          test[index] = input.value;
          var match = variants.filter(function (v) {
            for (var j = 0; j < test.length; j++) if (v.options[j] !== test[j]) return false;
            return true;
          })[0];
          var label = input.nextElementSibling;
          if (label && label.classList.contains('opt-pill')) label.classList.toggle('is-unavailable', !match || !match.available);
        });
      });
    }

    function scrollToMedia(mediaId) {
      if (!mediaId) return;
      var rail = $('[data-rail]', section);
      var slide = rail ? $('[data-media-id="' + mediaId + '"]', rail) : null;
      if (!rail || !slide) return;
      try { rail.scrollTo({ left: slide.offsetLeft, behavior: reduced ? 'auto' : 'smooth' }); }
      catch (e) { rail.scrollLeft = slide.offsetLeft; }
    }

    function update() {
      var opts = selectedOptions();
      fieldsets.forEach(function (fs, i) {
        var label = $('[data-option-selected]', fs);
        if (label && opts[i] !== null) label.textContent = opts[i];
      });
      markAvailability(opts);
      var v = findVariant(opts);
      var buttons = $$('[data-add-button]', section);
      if (!v) {
        buttons.forEach(function (b) { b.disabled = true; var l = $('[data-add-label]', b); if (l) l.textContent = b.getAttribute('data-label-unavailable'); });
        return;
      }
      if (idInput) idInput.value = v.id;
      $$('[data-price]', section).forEach(function (el) { el.textContent = v.price; });
      var compare = $('[data-compare-price]', section);
      if (compare) { compare.hidden = !v.compare; if (v.compare) compare.textContent = v.compare; }
      var soldBadge = $('[data-sold-out-badge]', section);
      if (soldBadge) soldBadge.hidden = v.available || coming;
      buttons.forEach(function (b) {
        b.disabled = !v.available;
        var l = $('[data-add-label]', b);
        if (l) l.textContent = v.available ? b.getAttribute('data-label-add') : b.getAttribute('data-label-sold');
      });
      scrollToMedia(v.media);
      if (window.history && window.history.replaceState) {
        var url = new URL(window.location.href);
        url.searchParams.set('variant', v.id);
        window.history.replaceState({}, '', url.toString());
      }
    }

    fieldsets.forEach(function (fs) { fs.addEventListener('change', update); });
    if (fieldsets.length) markAvailability(selectedOptions());

    /* Mobile rail dots */
    var rail = $('[data-rail]', section);
    var dots = $$('[data-dots] span', section);
    if (rail && dots.length) {
      rail.addEventListener('scroll', function () {
        var k = Math.round(rail.scrollLeft / Math.max(1, rail.clientWidth));
        dots.forEach(function (d, i) {
          d.className = 'h-[3px] transition-all duration-300 ' + (i === k ? 'w-6 bg-ink' : 'w-3 bg-ink/25');
        });
      }, { passive: true });
    }

    /* Mobile 360° / photos toggle */
    var gviews = $$('.gview', section);
    gviews.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var spin = btn.getAttribute('data-gview') === 'spin';
        gviews.forEach(function (b) { b.setAttribute('aria-selected', String(b === btn)); });
        var spinPanel = $('[data-gpanel="spin"]', section);
        var photoPanel = $('[data-gpanel="photos"]', section);
        if (spinPanel) spinPanel.hidden = !spin;
        if (photoPanel) photoPanel.hidden = spin;
      });
    });

    /* Mobile sticky buy bar: shows once the main buy button scrolls out of view */
    var buyArea = $('[data-buy-area]', section);
    var sticky = $('[data-sticky-buy]', section);
    if (buyArea && sticky && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        var e = entries[0];
        sticky.hidden = e.isIntersecting || e.boundingClientRect.top > 0;
      }).observe(buyArea);
    }
  });

  /* ---------------- Product recommendations ---------------- */
  $$('[data-recommendations]').forEach(function (el) {
    var url = el.getAttribute('data-url');
    if (!url || !window.fetch) return;
    fetch(url)
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var tmp = document.createElement('div');
        tmp.innerHTML = html;
        var fresh = tmp.querySelector('[data-recommendations]');
        if (fresh && fresh.innerHTML.trim()) el.innerHTML = fresh.innerHTML;
      })
      .catch(function () { /* recommendations are optional */ });
  });
})();
