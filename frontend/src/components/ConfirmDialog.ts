export interface ConfirmResult {
  confirmed: boolean;
  remember: boolean;
}

type Callback = (result: ConfirmResult) => void;

export class ConfirmDialog {
  readonly el: HTMLDivElement;
  private callback: Callback | null = null;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'lsv-modal-overlay';
    this.el.style.cssText =
      'position:fixed;inset:0;z-index:10000;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);';
    this.el.addEventListener('mousedown', (e) => {
      if (e.target === this.el) this.close();
    });
    document.body.appendChild(this.el);
  }

  show(
    title: string,
    message: string,
    confirmLabel: string,
    cb: Callback,
  ): void {
    this.callback = cb;

    this.el.innerHTML = `
      <div style="background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:0;min-width:300px;max-width:380px;box-shadow:0 8px 24px rgba(0,0,0,0.4);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <div style="padding:16px 20px 0 20px;">
          <div style="font-size:14px;font-weight:600;color:var(--text);">${title}</div>
          <div style="font-size:13px;color:var(--text-muted);margin-top:8px;line-height:1.5;">${message}</div>
        </div>
        <label style="display:flex;align-items:center;gap:8px;padding:14px 20px 0 20px;font-size:12px;color:var(--text-muted);cursor:pointer;-webkit-user-select:none;">
          <input type="checkbox" id="confirm-remember" style="accent-color:var(--accent);" />
          Don't ask again
        </label>
        <div style="display:flex;gap:6px;justify-content:flex-end;padding:14px 20px 16px 20px;">
          <button id="confirm-cancel" style="padding:5px 14px;border-radius:6px;border:1px solid var(--border);background:transparent;color:var(--text);font-size:12px;cursor:default;outline:none;font-family:inherit;">Cancel</button>
          <button id="confirm-ok" style="padding:5px 14px;border-radius:6px;border:none;background:var(--error);color:#fff;font-size:12px;cursor:default;outline:none;font-weight:500;font-family:inherit;">${confirmLabel}</button>
        </div>
      </div>
    `;
    this.el.classList.add('lsv-modal-open');

    const ok = this.el.querySelector('#confirm-ok') as HTMLButtonElement | null;
    const cancel = this.el.querySelector('#confirm-cancel') as HTMLButtonElement | null;
    const remember = this.el.querySelector('#confirm-remember') as HTMLInputElement | null;

    ok?.addEventListener('click', () => {
      this.emit({confirmed: true, remember: remember?.checked ?? false});
    });
    cancel?.addEventListener('click', () => {
      this.emit({confirmed: false, remember: false});
    });
    if (ok) {
      ok.addEventListener('mouseenter', () => { ok.style.opacity = '0.8'; });
      ok.addEventListener('mouseleave', () => { ok.style.opacity = '1'; });
    }
    if (cancel) {
      cancel.addEventListener('mouseenter', () => { cancel.style.background = 'var(--surface-hover)'; });
      cancel.addEventListener('mouseleave', () => { cancel.style.background = 'transparent'; });
    }
  }

  private emit(result: ConfirmResult): void {
    this.hide();
    if (this.callback) this.callback(result);
  }

  hide(): void {
    this.el.classList.remove('lsv-modal-open');
    this.el.innerHTML = '';
  }

  private close(): void {
    this.emit({confirmed: false, remember: false});
  }

  destroy(): void {
    this.el.remove();
  }
}
