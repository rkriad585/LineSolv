export class Toast {
  private el: HTMLDivElement;

  constructor() {
    this.el = document.createElement('div');
    this.el.id = 'toast-container';
    this.el.className = 'fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none';
    this.el.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
    document.body.appendChild(this.el);
  }

  show(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 2500): void {
    const colors = {
      success: 'rgba(34,197,94,0.95)',
      error: 'rgba(239,68,68,0.95)',
      info: 'rgba(99,102,241,0.95)',
    };

    const t = document.createElement('div');
    t.className = 'toast-item pointer-events-auto';
    t.style.cssText = `
      padding:8px 16px;border-radius:8px;font-size:13px;font-weight:500;
      color:#fff;background:${colors[type]};
      box-shadow:0 4px 12px rgba(0,0,0,0.3);
      opacity:0;transform:translateX(100%);
      transition:opacity 0.25s ease,transform 0.25s ease;
      max-width:320px;word-break:break-word;
      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
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
