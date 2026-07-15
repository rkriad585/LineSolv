import type { AutocompleteItem } from '../types';

const MAX_VISIBLE = 8;
const ITEM_HEIGHT = 36;
const POPUP_MAX_HEIGHT = MAX_VISIBLE * ITEM_HEIGHT;

const CATEGORY_COLORS: Record<string, string> = {
  function: '#a78bfa',
  constant: '#60a5fa',
  unit: '#34d399',
  variable: '#fbbf24',
  plugin: '#f472b6',
  keyword: '#fb923c',
};

const CATEGORY_LABELS: Record<string, string> = {
  function: 'fn',
  constant: 'const',
  unit: 'unit',
  variable: 'var',
  plugin: 'plugin',
  keyword: 'kw',
};

export class AutocompletePopup {
  readonly el: HTMLDivElement;
  private listEl: HTMLDivElement;
  private items: AutocompleteItem[] = [];
  private filtered: AutocompleteItem[] = [];
  private selectedIndex = 0;
  private filter = '';
  private visible = false;

  onSelect: ((item: AutocompleteItem) => void) | null = null;
  onDismiss: (() => void) | null = null;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'autocomplete-popup';
    this.el.style.cssText = `
      display:none;position:fixed;z-index:9999;
      background:var(--surface-secondary);border:1px solid var(--border);
      border-radius:8px;box-shadow:0 8px 24px rgba(0,0,0,0.4);
      overflow:hidden;min-width:260px;max-width:420px;
    `;

    this.listEl = document.createElement('div');
    this.listEl.style.cssText = `
      max-height:${POPUP_MAX_HEIGHT}px;overflow-y:auto;overflow-x:hidden;
    `;
    this.el.appendChild(this.listEl);

    this.listEl.addEventListener('mousedown', (e) => {
      const target = (e.target as HTMLElement).closest('.ac-item') as HTMLElement | null;
      if (target) {
        const idx = parseInt(target.dataset.index ?? '-1', 10);
        if (idx >= 0 && idx < this.filtered.length) {
          this.selectItem(idx);
        }
      }
      e.preventDefault();
    });
  }

  setItems(items: AutocompleteItem[]): void {
    this.items = items;
    this.applyFilter();
  }

  show(anchorX: number, anchorY: number, filter: string): void {
    this.filter = filter;
    this.applyFilter();
    if (this.filtered.length === 0) {
      this.hide();
      return;
    }
    this.visible = true;
    this.el.style.display = 'block';
    this.position(anchorX, anchorY);
  }

  hide(): void {
    this.visible = false;
    this.el.style.display = 'none';
    this.filtered = [];
    this.selectedIndex = 0;
  }

  isVisible(): boolean {
    return this.visible;
  }

  getFiltered(): AutocompleteItem[] {
    return this.filtered;
  }

  getSelectedIndex(): number {
    return this.selectedIndex;
  }

  moveSelection(delta: number): void {
    if (this.filtered.length === 0) return;
    this.selectedIndex = (this.selectedIndex + delta + this.filtered.length) % this.filtered.length;
    this.render();
    this.scrollSelectedIntoView();
  }

  selectCurrent(): void {
    if (this.filtered.length > 0) {
      this.selectItem(this.selectedIndex);
    }
  }

  updateFilter(filter: string, anchorX: number, anchorY: number): void {
    this.filter = filter;
    this.applyFilter();
    if (this.filtered.length === 0) {
      this.hide();
      return;
    }
    if (!this.visible) {
      this.visible = true;
      this.el.style.display = 'block';
    }
    this.position(anchorX, anchorY);
    this.render();
  }

  private applyFilter(): void {
    const f = this.filter.toLowerCase();
    this.filtered = f === ''
      ? this.items.slice(0, MAX_VISIBLE)
      : this.items.filter(item => item.name.toLowerCase().startsWith(f)).slice(0, MAX_VISIBLE);
    this.selectedIndex = 0;
    this.render();
  }

  private selectItem(index: number): void {
    const item = this.filtered[index];
    if (!item) return;
    this.onSelect?.(item);
    this.hide();
  }

  private position(x: number, y: number): void {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const popupH = Math.min(this.filtered.length * ITEM_HEIGHT + 8, POPUP_MAX_HEIGHT + 8);
    const popupW = 360;

    let left = x;
    let top = y;

    if (left + popupW > vw) left = vw - popupW - 8;
    if (left < 8) left = 8;

    if (top + popupH > vh) {
      top = y - popupH - 28;
    }
    if (top < 8) top = 8;

    this.el.style.left = left + 'px';
    this.el.style.top = top + 'px';
  }

  private render(): void {
    const frag = document.createDocumentFragment();

    for (let i = 0; i < this.filtered.length; i++) {
      const item = this.filtered[i];
      const row = document.createElement('div');
      row.className = 'ac-item';
      row.dataset.index = String(i);
      row.style.cssText = `
        display:flex;align-items:center;gap:8px;
        padding:4px 10px;cursor:pointer;height:${ITEM_HEIGHT}px;
        ${i === this.selectedIndex ? 'background:var(--accent);color:var(--text);' : ''}
      `;

      const badge = document.createElement('span');
      badge.style.cssText = `
        font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;
        padding:1px 5px;border-radius:3px;white-space:nowrap;
        background:${i === this.selectedIndex ? 'rgba(255,255,255,0.2)' : (CATEGORY_COLORS[item.category] ?? '#666')}22;
        color:${i === this.selectedIndex ? '#fff' : (CATEGORY_COLORS[item.category] ?? '#999')};
      `;
      badge.textContent = CATEGORY_LABELS[item.category] ?? item.category;
      row.appendChild(badge);

      const nameSpan = document.createElement('span');
      nameSpan.style.cssText = 'font-family:monospace;font-size:13px;white-space:nowrap;';
      if (this.filter) {
        const matchEnd = this.filter.length;
        const match = item.name.slice(0, matchEnd);
        const rest = item.name.slice(matchEnd);
        nameSpan.innerHTML = `<b>${escapeHtml(match)}</b>${escapeHtml(rest)}`;
      } else {
        nameSpan.textContent = item.name;
      }
      row.appendChild(nameSpan);

      if (item.description) {
        const desc = document.createElement('span');
        desc.style.cssText = `
          font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
          color:${i === this.selectedIndex ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)'};
          margin-left:auto;flex-shrink:0;max-width:180px;
        `;
        desc.textContent = item.description;
        row.appendChild(desc);
      }

      frag.appendChild(row);
    }

    this.listEl.replaceChildren(frag);
  }

  private scrollSelectedIntoView(): void {
    const selected = this.listEl.querySelector('[data-index="' + this.selectedIndex + '"]') as HTMLElement | null;
    if (selected && typeof selected.scrollIntoView === 'function') {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
