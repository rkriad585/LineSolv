export class Toast {
  private el: HTMLDivElement;
  static enabled = true;

  constructor() {
    this.el = document.createElement('div');
    this.el.id = 'toast-container';
    this.el.className = 'fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none';
    this.el.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
    document.body.appendChild(this.el);
  }

  show(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 2500): void {
    if (!Toast.enabled) return;
    const colors = {
      success: 'var(--success)',
      error: 'var(--error)',
      info: 'var(--accent)',
    };

    const t = document.createElement('div');
    t.className = 'toast-item pointer-events-auto';
    t.style.cssText = `
      padding:8px 16px;border-radius:var(--ui-radius-md);font-size:13px;font-weight:500;
      color:var(--text);background:${colors[type]};opacity:0.95;
      box-shadow:var(--ui-shadow-sm);
      opacity:0;transform:translateX(100%);
      transition:opacity 0.25s ease,transform 0.25s ease;
      max-width:320px;word-break:break-word;
      font-family:var(--ui-font-display, -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif);
    `;
    t.textContent = message;
    this.el.appendChild(t);

    requestAnimationFrame(() => {
      t.style.opacity = '1';
      t.style.transform = 'translateX(0)';
    });

    setTimeout(() => {
      t.style.opacity = '0';
      t.style.transform = 'translateX(100%)';
      setTimeout(() => t.remove(), 250);
    }, duration);
  }
}

export const toast = new Toast();
