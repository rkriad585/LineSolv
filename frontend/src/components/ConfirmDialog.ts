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
      'position:fixed;inset:0;z-index:1000;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);';
    this.el.addEventListener('mousedown', (e) => {
      if (e.target === this.el) this.close();
    });
    document.body.appendChild(this.el);
  }

  show(title: string, message: string, confirmLabel: string, cb: Callback): void {
    this.callback = cb;

    const card = document.createElement('div');
    card.style.cssText =
      'background:var(--surface);border:1px solid var(--border);border-radius:var(--ui-radius-md);' +
      'padding:20px;min-width:300px;max-width:380px;box-shadow:var(--ui-shadow-lg);display:flex;flex-direction:column;gap:0;';

    // Title
    const titleEl = document.createElement('div');
    titleEl.textContent = title;
    titleEl.style.cssText = 'font-size:14px;font-weight:600;color:var(--text);';

    // Message
    const msgEl = document.createElement('div');
    msgEl.textContent = message;
    msgEl.style.cssText = 'font-size:13px;color:var(--text-muted);margin-top:8px;line-height:1.5;';

    // Toggle row
    const toggleRow = document.createElement('div');
    toggleRow.style.cssText =
      'display:flex;align-items:center;justify-content:space-between;padding:14px 0 0 0;';

    const toggleLabel = document.createElement('span');
    toggleLabel.textContent = "Don't ask again";
    toggleLabel.style.cssText =
      'font-size:12px;color:var(--text-muted);user-select:none;cursor:pointer;';

    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.checked = false;
    toggle.style.cssText = 'display:none;';

    const track = document.createElement('div');
    track.style.cssText =
      'width:32px;height:18px;border-radius:9px;cursor:pointer;position:relative;transition:background .2s;background:var(--border);flex-shrink:0;';
    const thumb = document.createElement('div');
    thumb.style.cssText =
      'width:14px;height:14px;border-radius:50%;background:#fff;position:absolute;top:2px;left:2px;transition:left .2s;box-shadow:var(--ui-shadow-sm);';
    track.append(thumb);

    const updateToggle = () => {
      track.style.background = toggle.checked ? 'var(--accent)' : 'var(--border)';
      thumb.style.left = toggle.checked ? '16px' : '2px';
    };

    track.addEventListener('click', () => {
      toggle.checked = !toggle.checked;
      updateToggle();
    });
    toggleLabel.addEventListener('click', () => {
      toggle.checked = !toggle.checked;
      updateToggle();
    });

    toggleRow.append(toggle, toggleLabel, track);

    // Button row
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;padding:16px 0 0 0;';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText =
      'padding:6px 16px;border-radius:var(--ui-radius-sm);border:1px solid var(--border);' +
      'background:transparent;color:var(--text);font-size:12px;cursor:pointer;outline:none;font-family:inherit;' +
      'transition:background 0.15s;';
    cancelBtn.addEventListener('mouseenter', () => {
      cancelBtn.style.background = 'var(--surface-hover)';
    });
    cancelBtn.addEventListener('mouseleave', () => {
      cancelBtn.style.background = 'transparent';
    });

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = confirmLabel;
    confirmBtn.style.cssText =
      'padding:6px 16px;border-radius:var(--ui-radius-sm);border:none;' +
      'background:var(--error);color:#fff;font-size:12px;font-weight:500;cursor:pointer;outline:none;font-family:inherit;' +
      'transition:opacity 0.15s;';
    confirmBtn.addEventListener('mouseenter', () => {
      confirmBtn.style.opacity = '0.85';
    });
    confirmBtn.addEventListener('mouseleave', () => {
      confirmBtn.style.opacity = '1';
    });

    cancelBtn.addEventListener('click', () => {
      this.emit({ confirmed: false, remember: false });
    });
    confirmBtn.addEventListener('click', () => {
      this.emit({ confirmed: true, remember: toggle.checked });
    });

    btnRow.append(cancelBtn, confirmBtn);
    card.append(titleEl, msgEl, toggleRow, btnRow);

    this.el.innerHTML = '';
    this.el.appendChild(card);
    this.el.style.display = 'flex';
    this.el.classList.add('lsv-modal-open');
  }

  private emit(result: ConfirmResult): void {
    this.hide();
    if (this.callback) this.callback(result);
  }

  hide(): void {
    this.el.classList.remove('lsv-modal-open');
    this.el.style.display = 'none';
    this.el.innerHTML = '';
  }

  private close(): void {
    this.emit({ confirmed: false, remember: false });
  }

  destroy(): void {
    this.el.remove();
  }
}
