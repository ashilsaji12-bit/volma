/**
 * Modal Manager
 */

class ModalService {
  #overlay = null;
  #titleElem = null;
  #bodyElem = null;
  #footerElem = null;
  #closeBtn = null;
  #onCloseCallback = null;

  constructor() {
    this.#init();
  }

  #init() {
    let overlay = document.getElementById('app-modal-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'app-modal-overlay';
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal-content" role="dialog" aria-modal="true">
          <div class="modal-header">
            <h3 class="modal-title" id="modal-title">Dialog</h3>
            <button class="btn-icon modal-close-btn" aria-label="Close modal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:18px;height:18px">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div class="modal-body" id="modal-body"></div>
          <div class="modal-footer" id="modal-footer"></div>
        </div>
      `;
      document.body.appendChild(overlay);
    }

    this.#overlay = overlay;
    this.#titleElem = overlay.querySelector('#modal-title');
    this.#bodyElem = overlay.querySelector('#modal-body');
    this.#footerElem = overlay.querySelector('#modal-footer');
    this.#closeBtn = overlay.querySelector('.modal-close-btn');

    this.#closeBtn.addEventListener('click', () => this.close());
    this.#overlay.addEventListener('click', (e) => {
      if (e.target === this.#overlay) this.close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen()) {
        this.close();
      }
    });
  }

  isOpen() {
    return this.#overlay.classList.contains('open');
  }

  /**
   * Open the modal with custom title, body HTML, and footer buttons
   * @param {Object} options
   * @param {string} options.title
   * @param {string|HTMLElement} options.body
   * @param {Array<{ label: string, className?: string, onClick: Function }>} [options.buttons]
   * @param {Function} [options.onClose]
   */
  open({ title, body, buttons = [], onClose = null }) {
    this.#titleElem.textContent = title;
    this.#onCloseCallback = onClose;

    if (typeof body === 'string') {
      this.#bodyElem.innerHTML = body;
    } else if (body instanceof HTMLElement) {
      this.#bodyElem.innerHTML = '';
      this.#bodyElem.appendChild(body);
    }

    this.#footerElem.innerHTML = '';
    if (buttons.length > 0) {
      buttons.forEach(btnConfig => {
        const btn = document.createElement('button');
        btn.className = `btn ${btnConfig.className || 'btn-secondary'}`;
        btn.textContent = btnConfig.label;
        btn.addEventListener('click', (e) => {
          if (btnConfig.onClick) {
            btnConfig.onClick(e, this);
          }
        });
        this.#footerElem.appendChild(btn);
      });
      this.#footerElem.style.display = 'flex';
    } else {
      this.#footerElem.style.display = 'none';
    }

    this.#overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.#overlay.classList.remove('open');
    document.body.style.overflow = '';
    if (this.#onCloseCallback) {
      this.#onCloseCallback();
      this.#onCloseCallback = null;
    }
  }

  /**
   * Convenience confirm dialog
   * @param {string} title
   * @param {string} message
   * @param {Function} onConfirm
   */
  confirm({ title = 'Confirm Action', message, confirmText = 'Confirm', confirmClass = 'btn-danger', onConfirm }) {
    this.open({
      title,
      body: `<p style="font-size:0.95rem; line-height: 1.5; color: var(--text-muted);">${message}</p>`,
      buttons: [
        {
          label: 'Cancel',
          className: 'btn-secondary',
          onClick: () => this.close()
        },
        {
          label: confirmText,
          className: confirmClass,
          onClick: () => {
            this.close();
            if (onConfirm) onConfirm();
          }
        }
      ]
    });
  }
}

export const modal = new ModalService();
