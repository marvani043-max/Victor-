/* GARMENT EXPLORER: colourway → photo → numbered details, driven by the product's Shopify media.
   Every photo is reachable (thumbnails, previous/next, arrow keys). Front/Back/Detail/Worn buttons appear only
   when the alt text identifies those views. Reduced motion: instant swaps, same information. */
(() => {
  if (customElements.get('garment-explorer')) return;
  const PS = (window.PeakSide = window.PeakSide || {});
  const track = (n, d) => PS.track && PS.track(n, d);

  class GarmentExplorer extends HTMLElement {
    connectedCallback() {
      this.slides = [...this.querySelectorAll('[data-slide]')];
      this.thumbs = [...this.querySelectorAll('[data-thumb]')];
      this.viewBtns = [...this.querySelectorAll('[data-view-btn]')];
      this.hasViews = this.dataset.hasViews === 'true';
      this.color = this.dataset.color || '';
      this.colorName = this.querySelector('[data-color-label]')?.textContent.trim() || '';
      this.active = this.slides.find((s) => s.hasAttribute('data-active')) || this.slides[0] || null;
      this.activeDetail = null;
      this.counterTemplate = this.querySelector('[data-view-label]')?.textContent.trim() || '';

      this.addEventListener('click', (e) => {
        const viewBtn = e.target.closest('[data-view-btn]');
        if (viewBtn) { this.setView(viewBtn.dataset.viewBtn, true); return; }
        const thumb = e.target.closest('[data-thumb]');
        if (thumb) { this.show(this.slideById(thumb.dataset.thumb), true); return; }
        if (e.target.closest('[data-prev]')) { this.step(-1); return; }
        if (e.target.closest('[data-next]')) { this.step(1); return; }
        const marker = e.target.closest('[data-marker]');
        if (marker) { this.toggleDetail(Number(marker.dataset.marker), 'marker'); return; }
        const item = e.target.closest('[data-detail-btn]');
        if (item) { this.toggleDetail(Number(item.dataset.detailBtn), 'list', true); return; }
        if (e.target.closest('[data-zoom]')) this.openZoom(e.target.closest('[data-zoom]'));
        if (e.target.closest('[data-zoom-close]')) this.querySelector('[data-zoom-dialog]')?.close();
      });
      this.addEventListener('change', (e) => {
        const input = e.target;
        if (input.name && input.name.startsWith('explorer-color-')) {
          this.setColor(input.value, input.dataset.colorName, true);
          const legend = this.querySelector('legend [data-color-name]');
          if (legend) legend.textContent = input.dataset.colorName;
        }
      });
      this.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.activeDetail && e.target.closest('[data-marker]')) { this.clearDetail(); return; }
        const inViews = e.target.closest('[data-views]');
        const inThumbs = e.target.closest('[data-thumbs]');
        if ((inViews || inThumbs) && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) this.onArrowKey(e, inViews ? this.viewBtns : this.thumbs);
      });

      // Product page: the variant picker announces colour and image changes
      document.addEventListener('variant:color', (e) => {
        if (e.detail?.product !== this.dataset.product) return;
        this.setColor(e.detail.color, e.detail.name, false);
      });
      document.addEventListener('variant:media', (e) => {
        if (e.detail?.product !== this.dataset.product) return;
        const slide = this.slideById(e.detail.mediaId);
        if (slide) this.show(slide, false);
      });

      this.render(false);
      this.intro();
    }

    intro() {
      if (PS.reducedMotion && PS.reducedMotion()) return;
      const io = new IntersectionObserver((entries) => {
        if (!entries[0].isIntersecting) return;
        io.disconnect();
        this.classList.add('is-intro');
        window.setTimeout(() => this.classList.remove('is-intro'), 1200);
      }, { threshold: 0.4 });
      io.observe(this);
    }

    slideById(id) { return this.slides.find((s) => s.dataset.mediaId === String(id)) || null; }
    matchesColor(el, color = this.color) { return !color || !el.dataset.color || el.dataset.color === color; }
    pool() {
      const p = this.slides.filter((s) => this.matchesColor(s));
      return p.length ? p : this.slides;
    }

    render(announce = true) {
      const pool = this.pool();
      if (!this.active || !pool.includes(this.active)) {
        const view = this.active?.dataset.view;
        this.active = pool.find((s) => s.dataset.view === view) || pool.find((s) => s.dataset.view === 'front') || pool[0] || null;
      }
      const active = this.active;
      this.slides.forEach((s) => {
        const on = s === active;
        s.toggleAttribute('data-active', on);
        s.querySelectorAll('[data-marker]').forEach((m) => { m.tabIndex = on ? 0 : -1; });
        if (!on) s.querySelector('video')?.pause();
      });
      // Thumbnails: only this colourway's photos
      this.thumbs.forEach((t) => {
        t.hidden = !this.matchesColor(t) && this.slides.some((s) => this.matchesColor(s));
        t.setAttribute('aria-pressed', String(!!active && t.dataset.thumb === active.dataset.mediaId));
      });
      // View buttons: only views this colourway has
      const views = new Set(pool.map((s) => s.dataset.view));
      this.viewBtns.forEach((b) => {
        b.hidden = !views.has(b.dataset.viewBtn);
        b.setAttribute('aria-pressed', String(!!active && b.dataset.viewBtn === active.dataset.view));
      });
      const single = pool.length < 2;
      this.querySelectorAll('[data-prev], [data-next]').forEach((b) => { b.hidden = single; });
      // Corner label: the view name when known, otherwise "n / total"
      const label = this.querySelector('[data-view-label]');
      let spoken = '';
      if (label && active) {
        if (this.hasViews) {
          const btn = this.viewBtns.find((b) => b.dataset.viewBtn === active.dataset.view);
          spoken = btn ? btn.textContent.trim() : active.dataset.view;
        } else {
          spoken = `${pool.indexOf(active) + 1} / ${pool.length}`;
        }
        label.textContent = spoken;
      }
      const cl = this.querySelector('[data-color-label]');
      if (cl && this.colorName) cl.textContent = this.colorName;
      this.querySelectorAll('[data-detail]').forEach((li) => li.classList.toggle('is-active', Number(li.dataset.detail) === this.activeDetail));
      active?.querySelectorAll('[data-marker]').forEach((m) => m.setAttribute('aria-pressed', String(Number(m.dataset.marker) === this.activeDetail)));
      if (announce && PS.announce) PS.announce(`${spoken}${this.colorName ? `, ${this.colorName}` : ''}`);
    }

    show(slide, fromUser = false) {
      if (!slide || slide === this.active) return;
      if (slide.dataset.color && this.color && slide.dataset.color !== this.color) this.color = slide.dataset.color;
      this.active = slide;
      this.render(fromUser);
      if (fromUser) track('explorer_view_changed', { product: this.dataset.product, view: slide.dataset.view, media: slide.dataset.mediaId });
    }

    step(dir) {
      const pool = this.pool();
      if (pool.length < 2) return;
      const i = pool.indexOf(this.active);
      this.show(pool[(i + dir + pool.length) % pool.length], true);
    }

    setView(view, fromUser = false) {
      const slide = this.pool().find((s) => s.dataset.view === view);
      if (slide) this.show(slide, fromUser);
    }

    setColor(color, name, fromUser = false) {
      if (name) this.colorName = name;
      if (color === this.color) { this.render(false); return; }
      this.color = color;
      this.active = this.pool().includes(this.active) ? this.active : null;
      if (!this.active) {
        // Prefer the same view in the new colourway
        const pool = this.pool();
        this.active = pool.find((s) => s.dataset.view === 'front') || pool[0] || null;
      }
      this.render(fromUser);
      if (fromUser) track('explorer_colour_changed', { product: this.dataset.product, colour: name || color });
    }

    toggleDetail(n, source, fromList = false) {
      if (this.activeDetail === n && source === 'marker') { this.clearDetail(); return; }
      const item = this.querySelector(`[data-detail="${n}"]`);
      const needView = item?.dataset.detailView;
      this.activeDetail = n;
      if (needView && this.active?.dataset.view !== needView) {
        const slide = this.pool().find((s) => s.dataset.view === needView && s.querySelector('[data-marker]'));
        if (slide) this.active = slide;
      }
      this.render(false);
      const label = item?.querySelector('.detail-list__label')?.textContent.trim();
      if (label && PS.announce) PS.announce(label);
      if (fromList) {
        const stage = this.querySelector('.explorer__stage');
        const rect = stage?.getBoundingClientRect();
        if (rect && (rect.bottom < 0 || rect.top > window.innerHeight)) stage.scrollIntoView({ block: 'center', behavior: PS.reducedMotion() ? 'auto' : 'smooth' });
      }
      track('explorer_detail_opened', { product: this.dataset.product, detail: label || String(n) });
    }

    clearDetail() {
      this.activeDetail = null;
      this.render(false);
    }

    onArrowKey(e, list) {
      const visible = list.filter((b) => !b.hidden);
      const i = visible.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      let next = i;
      if (e.key === 'ArrowRight') next = (i + 1) % visible.length;
      if (e.key === 'ArrowLeft') next = (i - 1 + visible.length) % visible.length;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = visible.length - 1;
      visible[next].focus();
      visible[next].click();
    }

    openZoom(trigger) {
      const dialog = this.querySelector('[data-zoom-dialog]');
      const slide = this.active;
      if (!dialog || !slide) return;
      const img = dialog.querySelector('[data-zoom-img]');
      const source = slide.querySelector('img');
      img.src = slide.dataset.zoomSrc;
      img.alt = source?.alt || '';
      if (source) { img.width = source.getAttribute('width'); img.height = source.getAttribute('height'); }
      img.classList.toggle('is-photo', slide.dataset.view === 'worn' || slide.dataset.view === 'detail');
      PS.openDialog(dialog, trigger);
      dialog.querySelector('[data-zoom-close]')?.focus();
      track('explorer_zoom_opened', { product: this.dataset.product, view: slide.dataset.view });
    }
  }
  customElements.define('garment-explorer', GarmentExplorer);
})();
