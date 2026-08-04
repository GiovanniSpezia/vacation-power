/**
 * gauge.js
 * Disegna il quadrante circolare (in stile amperometro da quadro elettrico)
 * che mostra la percentuale di potenza utilizzata rispetto al limite.
 * Usa un conic-gradient dinamico via CSS custom property, niente librerie.
 */

const Gauge = {
  el: null,
  valueEl: null,
  unitEl: null,

  init(ringEl, valueEl, unitEl) {
    this.el = ringEl;
    this.valueEl = valueEl;
    this.unitEl = unitEl;
  },

  /**
   * @param {number} percent - 0..100 (puo' superare 100, viene troncato per il disegno)
   * @param {string} status - "ok" | "warning" | "danger"
   * @param {string} centerText - testo numerico al centro
   * @param {string} unitText - etichetta sotto il numero
   */
  render(percent, status, centerText, unitText) {
    const clamped = Math.max(0, Math.min(percent, 100));
    this.el.style.setProperty("--percent", clamped);
    this.el.dataset.status = status;
    if (this.valueEl) this.valueEl.textContent = centerText;
    if (this.unitEl) this.unitEl.textContent = unitText;
  }
};
