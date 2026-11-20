/* Peak Side: global behaviour.
   Progressive enhancement: every feature here has a working no-JS path (links, GET forms, native POST forms). */
(() => {
  const PS = (window.PeakSide = window.PeakSide || {});
  const S = PS.strings || {};
  const root = document.documentElement;

  /* ---------- Utilities ---------- */
  PS.reducedMotion = () =>
    root.dataset.motion === 'reduce' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Interaction analytics. Sent through Shopify Customer Events, which applies the store's
  // customer-privacy (consent) settings. A DOM event is also dispatched so tests and other scripts can listen.
  PS.track = (name, data = {}) => {
    document.dispatchEvent(new CustomEvent('ps:track', { detail: { name, ...data } }));
    if (!PS.publishEvents) return;
    try {
      if (window.Shopify && Shopify.analytics && typeof Shopify.analytics.publish === 'function') {
        Shopify.analytics.publish(`ps_${name}`, data);
      }
    } catch (e) { /* analytics must never break the page */ }
  };

  PS.announce = (message) => {
    const region = document.getElementById('LiveRegion');
    if (!region || !message) return;
    region.textContent = '';
    window.setTimeout(() => { region.textContent = message; }, 60);
  };

  PS.formatMoney = (cents, format = PS.moneyFormat || '${{amount}}') => {
    const value = Number(cents || 0) / 100;
    const fmt = (n, decimals, thousands = ',', decimal = '.') => {
      const [i, d] = n.toFixed(decimals).split('.');
      return i.replace(/\B(?=(\d{3})+(?!\d))/g, thousands) + (d ? decimal + d : '');
    };
    return format.replace(/\{\{\s*(\w+)\s*\}\}/, (_, key) => {
      if (key === 'amount_no_decimals') return fmt(value, 0);
      if (key === 'amount_with_comma_separator') return fmt(value, 2, '.', ',');
      if (key === 'amount_no_decimals_with_comma_separator') return fmt(value, 0, '.', ',');
      return fmt(value, 2);
    });
  };

  PS.handleize = (s) => String(s || '').toLowerCase().trim().replace(/['"]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  PS.parseHTML = (html) => new DOMParser().parseFromString(html, 'text/html');

  // Scroll lock for modal dialogs
  let lockCount = 0;
  PS.lockScroll = () => { lockCount += 1; root.style.overflow = 'hidden'; };
  PS.unlockScroll = () => { lockCount = Math.max(0, lockCount - 1); if (!lockCount) root.style.overflow = ''; };

  // Native <dialog> helpers: focus trap and Esc come from the browser; we add scroll lock,
  // backdrop click and focus return.
  PS.openDialog = (dialog, trigger) => {
    if (!dialog || dialog.open) return;
    dialog._trigger = trigger || document.activeElement;
    dialog.showModal();
    PS.lockScroll();
    if (!dialog._bound) {
      dialog._bound = true;
      dialog.addEventListener('close', () => {
        PS.unlockScroll();
        const t = dialog._trigger;
        if (t && typeof t.focus === 'function' && document.contains(t)) t.focus();
        if (t && t.hasAttribute && t.hasAttribute('aria-expanded')) t.setAttribute('aria-expanded', 'false');
      });
      dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
    }
    if (trigger && trigger.hasAttribute && trigger.hasAttribute('aria-expanded')) trigger.setAttribute('aria-expanded', 'true');
  };

  /* ---------- Motion toggle ---------- */
  class MotionToggle extends HTMLElement {
    connectedCallback() {
      this.btn = this.querySelector('[data-motion-btn]');
      if (!this.btn) return;
      const sync = () => this.btn.setAttribute('aria-pressed', String(root.dataset.motion === 'reduce' || window.matchMedia('(prefers-reduced-motion: reduce)').matches && root.dataset.motion !== 'full'));
      sync();
      this.btn.addEventListener('click', () => {
        const reduce = this.btn.getAttribute('aria-pressed') !== 'true';
        root.dataset.motion = reduce ? 'reduce' : 'full';
        try { localStorage.setItem('ps-motion', reduce ? 'reduce' : 'full'); } catch (e) {}
        sync();
        PS.track('motion_toggled', { reduce });
      });
    }
  }
  if (!customElements.get('motion-toggle')) customElements.define('motion-toggle', MotionToggle);

  /* ---------- Header: menu drawer and search panel ---------- */
  document.addEventListener('click', (e) => {
    const menuOpen = e.target.closest('[data-menu-open]');
    if (menuOpen) {
      PS.openDialog(document.querySelector('[data-menu-drawer]'), menuOpen);
      return;
    }
    if (e.target.closest('[data-menu-close]')) {
      document.querySelector('[data-menu-drawer]')?.close();
      return;
    }
    const searchOpen = e.target.closest('[data-search-open]');
    if (searchOpen) {
      const panel = document.querySelector('[data-search-panel]');
      if (!panel) return;
      e.preventDefault();
      panel.hidden = !panel.hidden;
      searchOpen.setAttribute('aria-expanded', String(!panel.hidden));
      if (!panel.hidden) panel.querySelector('input[type="search"]')?.focus();
      return;
    }
    if (e.target.closest('[data-search-close]')) {
      const panel = document.querySelector('[data-search-panel]');
      if (panel) panel.hidden = true;
      const btn = document.querySelector('[data-search-open]');
      btn?.setAttribute('aria-expanded', 'false');
      btn?.focus();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const panel = document.querySelector('[data-search-panel]');
    if (panel && !panel.hidden && panel.contains(document.activeElement)) {
      panel.hidden = true;
      document.querySelector('[data-search-open]')?.focus();
    }
  });
  const searchBtn = document.querySelector('[data-search-open]');
  if (searchBtn) { searchBtn.setAttribute('role', 'button'); searchBtn.setAttribute('aria-expanded', 'false'); searchBtn.setAttribute('aria-controls', 'HeaderSearchPanel'); }
  const searchPanel = document.querySelector('[data-search-panel]');
  if (searchPanel) searchPanel.id = 'HeaderSearchPanel';

  /* ---------- Quantity steppers ---------- */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-qty-minus], [data-qty-plus]');
    if (!btn) return;
    const input = btn.closest('[data-qty]')?.querySelector('input');
    if (!input) return;
    const min = Number(input.min || 0);
    const next = Math.max(min, Number(input.value || 0) + (btn.hasAttribute('data-qty-plus') ? 1 : -1));
    if (String(next) === input.value) return;
    input.value = next;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });

  /* ---------- Cart drawer + cart API ---------- */
  class CartDrawer extends HTMLElement {
    connectedCallback() {
      this.dialog = this.querySelector('dialog');
      document.addEventListener('click', (e) => {
        const open = e.target.closest('[data-cart-open]');
        if (open) {
          if (document.querySelector('[data-cart-page]')) return; // on /cart, follow the link
          e.preventDefault();
          this.open(open);
        }
        if (e.target.closest('[data-cart-close]')) this.dialog.close();
      });
      bindCartLines(this, () => ['cart-drawer']);
    }
    open(trigger, message) {
      PS.openDialog(this.dialog, trigger || document.querySelector('[data-cart-open]'));
      if (message) this.setStatus(message);
    }
    setStatus(message, isError = false) {
      const status = this.querySelector('[data-cart-status]');
      if (!status) return;
      status.textContent = message;
      status.classList.toggle('is-error', isError);
    }
    renderSections(sections) {
      if (!sections) return;
      if (sections['cart-drawer']) {
        const doc = PS.parseHTML(sections['cart-drawer']);
        const fresh = doc.querySelector('[data-cart-inner]');
        // Read the count before the node moves into the page
        const count = Number(fresh?.dataset.cartCountValue ?? NaN);
        const current = this.querySelector('[data-cart-inner]');
        if (fresh && current) current.replaceWith(fresh);
        if (!Number.isNaN(count)) PS.updateCartCount(count);
      }
      const page = document.querySelector('[data-cart-page]');
      if (page && sections[page.dataset.sectionId]) {
        const doc = PS.parseHTML(sections[page.dataset.sectionId]);
        const fresh = doc.querySelector('[data-cart-inner]');
        const current = page.querySelector('[data-cart-inner]');
        if (fresh && current) current.replaceWith(fresh);
      }
    }
  }
  if (!customElements.get('cart-drawer')) customElements.define('cart-drawer', CartDrawer);

  PS.updateCartCount = (count) => {
    document.querySelectorAll('[data-cart-count]').forEach((el) => {
      el.textContent = count;
      el.classList.toggle('is-empty', count === 0);
    });
    document.querySelectorAll('[data-cart-open] .visually-hidden').forEach((el) => {
      el.textContent = el.textContent.replace(/\d+ item(s)?/, `${count} item${count === 1 ? '' : 's'}`);
    });
  };

  PS.cartChange = async (line, quantity, sectionIds) => {
    const res = await fetch(`${PS.routes.cartChange}.js`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ line, quantity, sections: sectionIds, sections_url: window.location.pathname }),
    });
    const json = await res.json();
    if (!res.ok || json.status) throw new Error(json.description || json.message || S.errorGeneric);
    return json;
  };

  function bindCartLines(scope, getSections) {
    let timer;
    const run = async (line, quantity) => {
      const lines = scope.querySelector('.cart-lines');
      lines?.setAttribute('aria-busy', 'true');
      PS.announce(S.cartUpdating);
      try {
        const sectionIds = getSections();
        const page = document.querySelector('[data-cart-page]');
        if (page && !sectionIds.includes(page.dataset.sectionId)) sectionIds.push(page.dataset.sectionId);
        const json = await PS.cartChange(line, quantity, sectionIds);
        document.querySelector('cart-drawer')?.renderSections(json.sections);
        PS.updateCartCount(json.item_count);
        PS.announce(`${json.item_count} item${json.item_count === 1 ? '' : 's'}`);
      } catch (err) {
        lines?.removeAttribute('aria-busy');
        const status = scope.querySelector('[data-cart-status]');
        if (status) { status.textContent = err.message; status.classList.add('is-error'); }
        PS.announce(err.message);
      }
    };
    scope.addEventListener('change', (e) => {
      const input = e.target.closest('[data-line-qty]');
      if (!input) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => run(Number(input.dataset.lineQty), Math.max(0, Number(input.value || 0))), 350);
    });
    scope.addEventListener('click', (e) => {
      const remove = e.target.closest('[data-line-remove]');
      if (!remove) return;
      e.preventDefault();
      run(Number(remove.dataset.lineRemove), 0);
    });
  }
  const cartPage = document.querySelector('[data-cart-page]');
  if (cartPage) bindCartLines(cartPage, () => ['cart-drawer']);

  /* ---------- Form validation (contact, restock, newsletter) ----------
     Client-side checks give fast feedback; Shopify still validates on the server.
     Success messages come only from Shopify's response (form.posted_successfully?). */
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const fieldError = (input) => {
    const value = (input.value || '').trim();
    if (input.required && !value) return input.type === 'email' ? S.errorEmail : S.errorRequired;
    if (input.type === 'email' && value && !EMAIL.test(value)) return S.errorEmail;
    if (input.dataset.minlength && value.length < Number(input.dataset.minlength)) return S.errorMessageShort;
    return '';
  };
  const showFieldError = (input, message) => {
    const errorEl = document.getElementById(`${input.id}-error`);
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (errorEl) { errorEl.textContent = message; errorEl.hidden = !message; }
  };
  document.addEventListener('submit', (e) => {
    const form = e.target.closest('form[data-validate]');
    if (!form) return;
    const fields = [...form.querySelectorAll('input[required], textarea[required], [data-minlength]')];
    let firstInvalid = null;
    fields.forEach((input) => {
      const msg = fieldError(input);
      showFieldError(input, msg);
      if (msg && !firstInvalid) firstInvalid = input;
    });
    if (firstInvalid) {
      e.preventDefault();
      firstInvalid.focus();
      PS.announce(S.errorSummary);
      return;
    }
    const btn = form.querySelector('[data-submit]');
    if (btn) {
      btn.setAttribute('aria-busy', 'true');
      const label = btn.querySelector('[data-submit-label]');
      if (label) label.textContent = S.sending || 'Sending…';
    }
  });
  document.addEventListener('input', (e) => {
    const input = e.target;
    if (input.getAttribute && input.getAttribute('aria-invalid') === 'true') showFieldError(input, fieldError(input));
  });
  // After Shopify redirects back: focus the confirmation/error and record genuine successes.
  // Runs after load as well: the URL fragment Shopify adds (#FormId) makes the browser move focus after DOMContentLoaded.
  let statusTracked = false;
  const focusStatus = () => {
    const status = document.querySelector('[data-form-status]');
    if (!status) return;
    if (document.activeElement !== status) {
      status.scrollIntoView({ block: 'center', behavior: 'auto' });
      status.focus({ preventScroll: true });
    }
    const form = status.closest('form');
    if (!statusTracked && status.classList.contains('form-status--success') && form?.dataset.track) {
      statusTracked = true;
      PS.track(form.dataset.track, { confirmed: true });
    }
  };
  window.addEventListener('DOMContentLoaded', focusStatus);
  window.addEventListener('load', () => window.setTimeout(focusStatus, 0));

  /* ---------- Product card swatches ---------- */
  document.addEventListener('click', (e) => {
    const sw = e.target.closest('.card__swatches .swatch');
    if (!sw) return;
    const card = sw.closest('[data-card]');
    card.querySelectorAll('.card__swatches .swatch').forEach((b) => b.setAttribute('aria-pressed', String(b === sw)));
    const img = card.querySelector('.card__img--front');
    if (img && sw.dataset.src) {
      img.removeAttribute('srcset');
      img.src = sw.dataset.src;
      img.classList.remove('has-back');
      card.querySelector('.card__img--back')?.remove();
    }
    PS.track('card_colour_previewed', { colour: sw.textContent.trim() });
  });

  /* ---------- Fit finder ---------- */
  class FitFinder extends HTMLElement {
    connectedCallback() {
      this.addEventListener('change', (e) => {
        if (e.target.type !== 'radio') return;
        this.querySelectorAll('[data-fit-panel]').forEach((p) => p.toggleAttribute('data-active', p.dataset.fitPanel === e.target.value));
        PS.track('fit_selected', { fit: e.target.value });
      });
    }
  }
  if (!customElements.get('fit-finder')) customElements.define('fit-finder', FitFinder);

  /* ---------- Trail & Town tags ---------- */
  class LookTags extends HTMLElement {
    connectedCallback() {
      this.addEventListener('click', (e) => {
        const marker = e.target.closest('[data-look-marker]');
        if (!marker) return;
        const open = marker.getAttribute('aria-expanded') !== 'true';
        LookTags.closeAll();
        if (open) {
          marker.setAttribute('aria-expanded', 'true');
          const card = document.getElementById(marker.getAttribute('aria-controls'));
          if (card) card.hidden = false;
          PS.track('lookbook_tag_opened', { product: card?.querySelector('[data-track-look]')?.dataset.trackLook });
        }
      });
    }
    static closeAll(returnFocus = false) {
      document.querySelectorAll('[data-look-marker][aria-expanded="true"]').forEach((m) => {
        m.setAttribute('aria-expanded', 'false');
        const card = document.getElementById(m.getAttribute('aria-controls'));
        if (card) card.hidden = true;
        if (returnFocus) m.focus();
      });
    }
  }
  if (!customElements.get('look-tags')) customElements.define('look-tags', LookTags);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') LookTags.closeAll(true); });
  document.addEventListener('click', (e) => { if (!e.target.closest('look-tags')) LookTags.closeAll(); });

  /* ---------- Product recommendations (loaded near the viewport) ---------- */
  class ProductRecommendations extends HTMLElement {
    connectedCallback() {
      if (!this.dataset.url) return;
      const io = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        fetch(this.dataset.url)
          .then((r) => r.text())
          .then((html) => {
            const fresh = PS.parseHTML(html).querySelector('product-recommendations');
            if (fresh && fresh.innerHTML.trim()) this.innerHTML = fresh.innerHTML;
          })
          .catch(() => {});
      }, { rootMargin: '0px 0px 600px 0px' });
      io.observe(this);
    }
  }
  if (!customElements.get('product-recommendations')) customElements.define('product-recommendations', ProductRecommendations);

  /* ---------- Collection & search filters ---------- */
  class FacetFilters extends HTMLElement {
    connectedCallback() {
      this.sectionId = this.dataset.section;
      this.addEventListener('change', (e) => {
        if (!e.target.closest('[data-facets-form]')) return;
        window.clearTimeout(this._t);
        const delay = e.target.type === 'number' ? 600 : 0;
        this._t = window.setTimeout(() => this.submit(e.target), delay);
      });
      this.addEventListener('submit', (e) => { e.preventDefault(); this.submit(); });
      this.addEventListener('click', (e) => {
        const remove = e.target.closest('[data-facet-remove]');
        if (remove) { e.preventDefault(); this.load(new URL(remove.href, window.location.href)); return; }
        if (e.target.closest('[data-facets-open]')) this.openDrawer();
        if (e.target.closest('[data-facets-close]')) this.closeDrawer();
      });
      this.addEventListener('keydown', (e) => {
        if (!this.drawer?.classList.contains('is-open')) return;
        if (e.key === 'Escape') { this.closeDrawer(); return; }
        if (e.key === 'Tab') this.trapFocus(e);
      });
      document.addEventListener('click', (e) => {
        // The empty-state "Clear filters" link lives outside this element
        const remove = e.target.closest('[data-results] [data-facet-remove]');
        if (remove) { e.preventDefault(); this.load(new URL(remove.href, window.location.href)); }
      });
      window.addEventListener('popstate', () => this.load(new URL(window.location.href), false));
    }
    get drawer() { return this.querySelector('[data-facets-drawer]'); }
    isMobile() { return window.matchMedia('(max-width: 989px)').matches; }
    openDrawer() {
      if (!this.isMobile()) return;
      const d = this.drawer;
      d.classList.add('is-open');
      d.setAttribute('role', 'dialog');
      d.setAttribute('aria-modal', 'true');
      this.querySelector('[data-facets-open]')?.setAttribute('aria-expanded', 'true');
      PS.lockScroll();
      d.querySelector('button, input, select')?.focus();
    }
    closeDrawer() {
      const d = this.drawer;
      if (!d.classList.contains('is-open')) return;
      d.classList.remove('is-open');
      d.removeAttribute('role');
      d.removeAttribute('aria-modal');
      PS.unlockScroll();
      const btn = this.querySelector('[data-facets-open]');
      btn?.setAttribute('aria-expanded', 'false');
      btn?.focus();
    }
    trapFocus(e) {
      const items = [...this.drawer.querySelectorAll('button, input:not([disabled]), select, a[href]')].filter((el) => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    submit(changed) {
      const form = this.querySelector('[data-facets-form]');
      const params = new URLSearchParams(new FormData(form));
      [...params.keys()].forEach((k) => { if (params.get(k) === '') params.delete(k); });
      if (params.get('sort_by') === form.dataset.defaultSort) params.delete('sort_by');
      const url = new URL(form.action, window.location.href);
      url.search = params.toString();
      this.load(url, true, changed);
    }
    async load(url, push = true, changed) {
      const results = document.getElementById(`ProductGridContainer-${this.sectionId}`);
      const focusKey = changed ? { name: changed.name, value: changed.value, id: changed.id } : null;
      const wasOpen = this.drawer?.classList.contains('is-open');
      results?.setAttribute('aria-busy', 'true');
      PS.announce(S.updating);
      try {
        const fetchUrl = new URL(url);
        fetchUrl.searchParams.set('section_id', this.sectionId);
        const html = await fetch(fetchUrl).then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); });
        const doc = PS.parseHTML(html);
        const freshResults = doc.getElementById(`ProductGridContainer-${this.sectionId}`);
        const freshFacets = doc.querySelector('facet-filters');
        if (results && freshResults) results.innerHTML = freshResults.innerHTML;
        if (freshFacets) {
          this.innerHTML = freshFacets.innerHTML;
          if (wasOpen) { this.drawer.classList.add('is-open'); this.drawer.setAttribute('role', 'dialog'); this.drawer.setAttribute('aria-modal', 'true'); this.querySelector('[data-facets-open]')?.setAttribute('aria-expanded', 'true'); }
        }
        if (push) { url.searchParams.delete('section_id'); window.history.pushState({}, '', url); }
        const count = this.querySelector('[data-count]')?.textContent.trim();
        PS.announce(count);
        // Restore focus to the control that changed
        if (focusKey) {
          const sel = focusKey.id ? `#${CSS.escape(focusKey.id)}` : `[name="${CSS.escape(focusKey.name)}"][value="${CSS.escape(focusKey.value)}"]`;
          (this.querySelector(sel) || this.querySelector(`[name="${CSS.escape(focusKey.name)}"]`))?.focus();
        } else if (!wasOpen) {
          results?.querySelector('a, button')?.focus({ preventScroll: true });
        }
        PS.track('filter_applied', { query: url.searchParams.toString() });
      } catch (err) {
        window.location.href = url.toString(); // fall back to a full page load
      } finally {
        results?.removeAttribute('aria-busy');
      }
    }
  }
  if (!customElements.get('facet-filters')) customElements.define('facet-filters', FacetFilters);
})();
