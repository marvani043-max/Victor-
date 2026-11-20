/* Product form: variant picker, availability, add to bag (AJAX with real Shopify confirmation),
   restock form visibility, size guide and the mobile sticky buy bar. Without JS the form posts to /cart/add. */
(() => {
  if (customElements.get('product-form')) return;
  const PS = (window.PeakSide = window.PeakSide || {});
  const S = PS.strings || {};

  class ProductForm extends HTMLElement {
    connectedCallback() {
      this.form = this.querySelector('form');
      this.data = JSON.parse(this.querySelector('[data-product-json]')?.textContent || '{}');
      this.idInput = this.form.querySelector('[data-variant-id]');
      this.button = this.form.querySelector('[data-add-button]');
      this.label = this.form.querySelector('[data-add-label]');
      this.errorBox = this.form.querySelector('[data-form-error]');
      this.section = this.closest('[data-section-id]');
      this.optionNames = (this.data.options || []).map((o) => (typeof o === 'string' ? o : o.name));
      this.colorPos = this.optionNames.findIndex((n) => /^colou?r$/i.test(n)) + 1;
      this.sizePos = this.optionNames.findIndex((n) => /^size$/i.test(n)) + 1;

      this.form.addEventListener('change', (e) => {
        if (e.target.matches('[data-option-position]')) this.onOptionChange(e.target);
      });
      this.form.addEventListener('submit', (e) => this.onSubmit(e));

      this.setupSizeGuide();
      this.setupSticky();
    }

    selectedOptions() {
      return this.optionNames.map((_, i) => {
        const pos = i + 1;
        const checked = this.form.querySelector(`input[data-option-position="${pos}"]:checked`);
        if (checked) return checked.value;
        const select = this.form.querySelector(`select[data-option-position="${pos}"]`);
        return select ? select.value : null;
      });
    }

    findVariant(options) {
      return (this.data.variants || []).find((v) => v.options.every((o, i) => o === options[i]));
    }

    onOptionChange(input) {
      const pos = Number(input.dataset.optionPosition);
      const options = this.selectedOptions();
      const valueLabel = this.form.querySelector(`[data-option-value="${pos}"]`);
      if (valueLabel) valueLabel.textContent = input.value;

      if (pos === this.colorPos) {
        this.updateSizeStates(input.value);
        document.dispatchEvent(new CustomEvent('variant:color', {
          detail: { product: this.data.handle, color: PS.handleize(input.value), name: input.value },
        }));
        PS.track('explorer_colour_changed', { product: this.data.handle, colour: input.value, source: 'variant_picker' });
      }

      const variant = this.findVariant(options);
      this.variant = variant;
      this.updateState(variant);
      if (pos === this.sizePos) PS.track('size_selected', { product: this.data.handle, size: input.value });
    }

    updateSizeStates(colorValue) {
      if (!this.sizePos) return;
      this.form.querySelectorAll(`input[data-option-position="${this.sizePos}"]`).forEach((input) => {
        const match = (this.data.variants || []).find((v) =>
          v.options[this.sizePos - 1] === input.value && (!this.colorPos || v.options[this.colorPos - 1] === colorValue));
        const available = !!(match && match.available);
        const chip = input.closest('.size-chip');
        chip?.classList.toggle('is-unavailable', !available);
        const state = chip?.querySelector('[data-size-state]');
        if (state) state.textContent = available ? '' : S.soldOut;
      });
    }

    updateState(variant) {
      const stock = this.section?.querySelector('[data-stock]');
      const price = this.section?.querySelector('.product__price-row [data-price]');
      const restock = this.section?.querySelector('[data-restock]');
      const stickyPrice = this.section?.querySelector('[data-sticky-price]');
      const stickyVariant = this.section?.querySelector('[data-sticky-variant]');
      const stickyBtn = this.section?.querySelector('[data-sticky-add]');
      const stickyLabel = this.section?.querySelector('[data-sticky-label]');
      this.hideError();

      if (!variant) {
        this.setButton(false, S.unavailable);
        if (stock) { stock.classList.add('stock--out'); stock.querySelector('span').textContent = S.unavailable; }
        if (restock) restock.hidden = true;
        if (stickyBtn) { stickyBtn.disabled = true; stickyLabel.textContent = S.unavailable; }
        PS.announce(S.unavailable);
        return;
      }

      this.idInput.value = variant.id;
      const money = PS.formatMoney(variant.price);
      if (price) price.lastChild.textContent = money;
      if (price) price.classList.toggle('price--sold-out', !variant.available);
      if (stock) {
        stock.classList.toggle('stock--out', !variant.available);
        stock.querySelector('span').textContent = variant.available ? S.inStock : S.soldOut;
      }
      this.setButton(variant.available, variant.available ? S.addToBag : S.soldOut);
      if (restock) restock.hidden = variant.available;
      if (stickyPrice) stickyPrice.textContent = money;
      if (stickyVariant) stickyVariant.textContent = variant.title;
      if (stickyBtn) { stickyBtn.disabled = !variant.available; stickyLabel.textContent = variant.available ? S.addToBag : S.soldOut; }
      PS.announce(`${variant.title}, ${money}, ${variant.available ? S.inStock : S.soldOut}`);

      const url = new URL(window.location.href);
      url.searchParams.set('variant', variant.id);
      window.history.replaceState({}, '', url);
    }

    setButton(enabled, text) {
      this.button.disabled = !enabled;
      this.button.setAttribute('aria-disabled', String(!enabled));
      this.label.textContent = text;
    }

    showError(message) {
      if (!this.errorBox) return;
      this.errorBox.hidden = false;
      this.errorBox.querySelector('[data-form-error-text]').textContent = message;
    }
    hideError() { if (this.errorBox) this.errorBox.hidden = true; }

    async onSubmit(e) {
      e.preventDefault();
      if (this.button.disabled || this.button.getAttribute('aria-busy') === 'true') return;
      this.hideError();
      const stickyBtn = this.section?.querySelector('[data-sticky-add]');
      this.button.setAttribute('aria-busy', 'true');
      stickyBtn?.setAttribute('aria-busy', 'true');
      this.label.textContent = S.adding;
      PS.announce(S.adding);

      const body = new FormData(this.form);
      body.append('sections', 'cart-drawer');
      body.append('sections_url', window.location.pathname);
      try {
        const res = await fetch(`${PS.routes.cartAdd}.js`, {
          method: 'POST',
          headers: { Accept: 'application/javascript', 'X-Requested-With': 'XMLHttpRequest' },
          body,
        });
        const json = await res.json();
        if (!res.ok || json.status) throw new Error(json.description || json.message || S.errorGeneric);
        // Shopify confirmed the add: only now update the bag and confirm to the visitor.
        const drawer = document.querySelector('cart-drawer');
        drawer?.renderSections(json.sections);
        const trigger = e.submitter || this.button;
        drawer?.open(trigger, `${S.added}: ${json.product_title || json.title || ''}`.trim());
        PS.announce(S.added);
      } catch (err) {
        this.showError(err.message || S.errorGeneric);
        PS.announce(err.message || S.errorGeneric);
      } finally {
        this.button.removeAttribute('aria-busy');
        stickyBtn?.removeAttribute('aria-busy');
        this.label.textContent = this.button.disabled ? S.soldOut : S.addToBag;
      }
    }

    setupSizeGuide() {
      const dialog = this.section?.querySelector('[data-size-guide]');
      if (!dialog) return;
      this.section.addEventListener('click', (e) => {
        const open = e.target.closest('[data-size-guide-open]');
        if (open) {
          PS.openDialog(dialog, open);
          dialog.querySelector('[data-size-guide-close]')?.focus();
          PS.track('size_guide_opened', { product: this.data.handle });
        }
        if (e.target.closest('[data-size-guide-close]')) dialog.close();
      });
    }

    setupSticky() {
      const bar = this.section?.querySelector('[data-sticky-buy]');
      const target = this.form.querySelector('.product-form__buy');
      if (!bar || !target) return;
      // A scroll check (not IntersectionObserver alone) so jumps past the button, e.g. via anchors, are caught too.
      let queued = false;
      const update = () => {
        queued = false;
        bar.hidden = !(target.getBoundingClientRect().bottom < 0);
      };
      const onScroll = () => { if (!queued) { queued = true; window.requestAnimationFrame(update); } };
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
      update();
    }
  }
  customElements.define('product-form', ProductForm);
})();
