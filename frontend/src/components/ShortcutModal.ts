import {ALL_SHORTCUTS} from '../utils/shortcutDefs';

export class ShortcutModal {
  readonly el: HTMLDivElement;

  constructor() {
    this.el = document.createElement('div');
    this.el.id = 'shortcut-modal';
    this.el.style.cssText = `
      display: none; position: fixed; inset: 0; z-index: 1000;
      background: rgba(0,0,0,0.5); align-items: center; justify-content: center;
    `;
    this.el.addEventListener('click', (e) => {
      if (e.target === this.el) this.close();
    });

    const box = document.createElement('div');
    box.style.cssText = `
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 12px; padding: 24px; min-width: 400px; max-height: 80vh; overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    `;

    const title = document.createElement('h2');
    title.textContent = 'Keyboard Shortcuts';
    title.style.cssText = `
      margin: 0 0 16px; font-size: 15px; font-weight: 600;
      color: var(--text); user-select: none;
    `;

    const table = document.createElement('div');
    table.style.cssText = 'display: flex; flex-direction: column; gap: 4px;';

    for (const s of ALL_SHORTCUTS) {
      const row = document.createElement('div');
      row.style.cssText = `
        display: flex; justify-content: space-between; align-items: center;
        padding: 5px 8px; border-radius: 6px; user-select: none;
      `;
      row.addEventListener('mouseenter', () => row.style.background = 'var(--surface-hover)');
      row.addEventListener('mouseleave', () => row.style.background = '');

      const keyEl = document.createElement('kbd');
      keyEl.textContent = s.keys;
      keyEl.style.cssText = `
        font-family: inherit; font-size: 12px; padding: 2px 8px;
        border-radius: 4px; background: var(--surface-secondary);
        color: var(--accent); white-space: nowrap;
      `;

      const descEl = document.createElement('span');
      descEl.textContent = s.desc;
      descEl.style.cssText = 'font-size: 13px; color: var(--text-muted); margin-left: 16px; text-align: right;';

      row.appendChild(keyEl);
      row.appendChild(descEl);
      table.appendChild(row);
    }

    box.appendChild(title);
    box.appendChild(table);
    this.el.appendChild(box);
    document.body.appendChild(this.el);
  }

  open(): void {
    this.el.style.display = 'flex';
  }

  close(): void {
    this.el.style.display = 'none';
  }

  isOpen(): boolean {
    return this.el.style.display === 'flex';
  }
}
