/* GARMENT EXPLORER: colourway → view → numbered details.
   Mouse, touch and keyboard all drive the same buttons. Reduced motion: instant swaps, same information. */
(() => {
  if (customElements.get('garment-explorer')) return;
  const PS = (window.PeakSide = window.PeakSide || {});
  const track = (n, d) => PS.track && PS.track(n, d);
  const VIEW_ORDER = ['front', 'back', 'detail', 'worn'];

  class GarmentExplorer extends HTMLElement {
    connectedCallback() {
      this.slides = [...this.querySelectorAll('[data-slide]')];
      this.viewBtns = [...this.querySelectorAll('[data-view-btn]')];
      this.color = this.dataset.color || '';
      const active = this.slides.find((s) => s.hasAttribute('data-active')) || this.slides[0];
      this.view = active ? active.dataset.view : 'front';
      this.colorName = this.querySelector('[data-color-label]')?.textContent.trim() || '';
      this.activeDetail = null;

      this.querySelector('[data-views]')?.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-view-btn]');
        if (btn) this.setView(btn.dataset.viewBtn, true);
      });
      this.querySelector('[data-views]')?.addEventListener('keydown', (e) => this.onViewKey(e));

      this.addEventListener('change', (e) => {
        const input = e.target;
        if (input.name && input.name.startsWith('explorer-color-')) {
          this.setColor(input.value, input.dataset.colorName, true);
          const legend = this.querySelector('legend [data-color-name]');
          if (legend) legend.textContent = input.dataset.colorName;
        }
      });

      this.addEventListener('click', (e) => {
        const marker = e.target.closest('[data-marker]');
        if (marker) { this.toggleDetail(Number(marker.dataset.marker), 'marker'); return; }
        const item = e.target.closest('[data-detail-btn]');
        if (item) { this.toggleDetail(Number(item.dataset.detailBtn), 'list', true); return; }
        if (e.target.closest('[data-zoom]')) this.openZoom(e.target.closest('[data-zoom]'));
        if (e.target.closest('[data-zoom-close]')) this.querySelector('[data-zoom-dialog]')?.close();
      });
      this.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.activeDetail && e.target.closest('[data-marker]')) { this.clearDetail(); }
      });

      // Product page: the variant picker announces colour changes
      document.addEventListener('variant:color', (e) => {
        if (e.detail?.product !== this.dataset.product) return;
        this.setColor(e.detail.color, e.detail.name, false);
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

    matchesColor(slide, color = this.color) {
      return !color || !slide.dataset.color || slide.dataset.color === color;
    }
    viewsFor(color) {
      const set = new Set(this.slides.filter((s) => this.matchesColor(s, color)).map((s) => s.dataset.view));
      return VIEW_ORDER.filter((v) => set.has(v));
    }
    currentSlide() {
      const pool = this.slides.filter((s) => this.matchesColor(s));
      return pool.find((s) => s.dataset.view === this.view) || pool.find((s) => s.dataset.view === 'front') || pool[0] || this.slides[0];
    }

    render(announce = true) {
      const views = this.viewsFor(this.color);
      if (!views.includes(this.view)) this.view = views[0] || 'front';
      const slide = this.currentSlide();
      this.slides.forEach((s) => s.toggleAttribute('data-active', s === slide));
      // Hidden slides keep their markers out of the tab order
      this.slides.forEach((s) => s.querySelectorAll('[data-marker]').forEach((m) => { m.tabIndex = s === slide ? 0 : -1; }));
      this.viewBtns.forEach((b) => {
        const v = b.dataset.viewBtn;
        b.hidden = !views.includes(v);
        b.setAttribute('aria-pressed', String(v === this.view));
      });
      const viewBtn = this.viewBtns.find((b) => b.dataset.viewBtn === this.view);
      const viewLabel = viewBtn ? viewBtn.textContent.trim() : this.view;
      const vl = this.querySelector('[data-view-label]');
      if (vl) vl.textContent = viewLabel;
      const cl = this.querySelector('[data-color-label]');
      if (cl && this.colorName) cl.textContent = this.colorName;
      // Details list: highlight only the active detail
      this.querySelectorAll('[data-detail]').forEach((li) => li.classList.toggle('is-active', Number(li.dataset.detail) === this.activeDetail));
      slide?.querySelectorAll('[data-marker]').forEach((m) => m.setAttribute('aria-pressed', String(Number(m.dataset.marker) === this.activeDetail)));
      if (announce && PS.announce) PS.announce(`${viewLabel}${this.colorName ? `, ${this.colorName}` : ''}`);
    }

    setView(view, fromUser = false) {
      if (view === this.view) return;
      this.view = view;
      this.render(fromUser);
      if (fromUser) track('explorer_view_changed', { product: this.dataset.product, view });
    }

    setColor(color, name, fromUser = false) {
      if (color === this.color) return;
      this.color = color;
      if (name) this.colorName = name;
      this.render(fromUser);
      if (fromUser) track('explorer_colour_changed', { product: this.dataset.product, colour: name || color });
    }

    toggleDetail(n, source, fromList = false) {
      if (this.activeDetail === n && source === 'marker') { this.clearDetail(); return; }
      const item = this.querySelector(`[data-detail="${n}"]`);
      const needView = item?.dataset.detailView;
      this.activeDetail = n;
      if (needView && needView !== this.view && this.viewsFor(this.color).includes(needView)) this.view = needView;
      this.render(false);
      const label = item?.querySelector('.detail-list__label')?.textContent.trim();
      if (label && PS.announce) PS.announce(label);
      if (fromList) {
        // Keep focus on the list item; bring the photo into view on small screens
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

    onViewKey(e) {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      const visible = this.viewBtns.filter((b) => !b.hidden);
      const i = visible.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      let next = i;
      if (e.key === 'ArrowRight') next = (i + 1) % visible.length;
      if (e.key === 'ArrowLeft') next = (i - 1 + visible.length) % visible.length;
      if (e.key === 'Home') next = 0;
      if (e.key === 'End') next = visible.length - 1;
      visible[next].focus();
      this.setView(visible[next].dataset.viewBtn, true);
    }

    openZoom(trigger) {
      const dialog = this.querySelector('[data-zoom-dialog]');
      const slide = this.currentSlide();
      if (!dialog || !slide) return;
      const img = dialog.querySelector('[data-zoom-img]');
      const source = slide.querySelector('img');
      img.src = slide.dataset.zoomSrc;
      img.alt = source?.alt || '';
      if (source) { img.width = source.getAttribute('width'); img.height = source.getAttribute('height'); }
      img.classList.toggle('is-photo', slide.dataset.view === 'worn' || slide.dataset.view === 'detail');
      PS.openDialog(dialog, trigger);
      dialog.querySelector('[data-zoom-close]')?.focus();
      track('explorer_zoom_opened', { product: this.dataset.product, view: this.view });
    }
  }
  customElements.define('garment-explorer', GarmentExplorer);
})();
