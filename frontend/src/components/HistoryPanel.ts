import type {HistoryEntry} from '../stores/calculator';
import {escapeHtml} from '../utils/html';

export class HistoryPanel {
  readonly el: HTMLElement;
  readonly contentEl: HTMLDivElement;
  readonly searchInput: HTMLInputElement;
  private onRestore: (input: string) => void;
  private allEntries: HistoryEntry[] = [];

  constructor(onRestore: (input: string) => void) {
    this.onRestore = onRestore;
    this.el = document.createElement('aside');
    this.el.id = 'history-panel';
    this.el.className = 'shrink-0 flex flex-col overflow-hidden transition-all duration-150 ease-out';
    this.el.style.cssText = 'width:0;border-right:0;background:var(--surface);order:-1;';
    this.el.style.borderRightWidth = '0';

    const header = document.createElement('div');
    header.className = 'px-4 py-2 text-[10px] font-semibold tracking-wider uppercase border-b shrink-0';
    header.style.cssText = 'color:var(--text-muted);border-color:var(--border);';
    header.textContent = 'History';
    this.el.appendChild(header);

    this.searchInput = document.createElement('input');
    this.searchInput.type = 'text';
    this.searchInput.placeholder = 'Filter history\u2026';
    this.searchInput.setAttribute('aria-label', 'Filter history');
    this.searchInput.style.cssText =
      'width:100%;padding:5px 8px;font-size:11px;background:var(--surface-secondary);' +
      'color:var(--text);border:1px solid var(--border);border-radius:4px;outline:none;' +
      'box-sizing:border-box;';
    this.searchInput.addEventListener('input', () => this.applyFilter());
    this.searchInput.addEventListener('click', (e) => e.stopPropagation());
    this.el.appendChild(this.searchInput);

    this.contentEl = document.createElement('div');
    this.contentEl.id = 'history-content';
    this.contentEl.className = 'flex-1 overflow-y-auto p-2';
    this.contentEl.tabIndex = -1;
    this.el.appendChild(this.contentEl);

    this.contentEl.addEventListener('click', (e) => {
      const item = (e.target as HTMLElement).closest('.history-item') as HTMLElement | null;
      if (item) {
        this.activateItem(item);
      }
    });

    this.contentEl.addEventListener('keydown', (e) => {
      const items = Array.from(this.contentEl.querySelectorAll<HTMLElement>('.history-item'));
      if (items.length === 0) return;
      const focused = this.contentEl.querySelector<HTMLElement>('.history-item:focus');

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        let idx = focused ? items.indexOf(focused) : -1;
        idx = e.key === 'ArrowDown' ? Math.min(idx + 1, items.length - 1) : Math.max(idx - 1, 0);
        items[idx].focus();
        items[idx].scrollIntoView?.({block: 'nearest'});
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (focused) this.activateItem(focused);
      }
    });
  }

  private activateItem(item: HTMLElement): void {
    const input = item.getAttribute('data-history-input') || '';
    this.onRestore(input);
  }

  render(entries: HistoryEntry[]): void {
    this.allEntries = entries;
    this.applyFilter();
  }

  private applyFilter(): void {
    const q = this.searchInput.value.toLowerCase().trim();
    const filtered = q ? this.allEntries.filter(e =>
      e.input.toLowerCase().includes(q) || e.output.toLowerCase().includes(q)
    ) : this.allEntries;

    if (filtered.length === 0) {
      this.contentEl.innerHTML = '<div class="text-xs p-2" style="color:var(--text-muted)">' +
        (q ? 'No matching history' : 'No history') + '</div>';
      return;
    }
    const html = filtered.map((e) => {
      const shortInput = e.input.length > 40 ? e.input.slice(0, 40) + '...' : e.input;
      return `
        <div data-history-input="${escapeHtml(e.input)}" class="history-item" tabindex="-1" style="padding:6px 8px;border-radius:6px;cursor:pointer;margin-bottom:2px;">
          <div style="font-size:12px;color:var(--text);white-space:pre;overflow:hidden;text-overflow:ellipsis;font-family:monospace">${escapeHtml(shortInput)}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:pre">${escapeHtml(e.output)}</div>
        </div>`;
    }).join('');
    this.contentEl.innerHTML = html;
  }

  open(): void {
    this.el.style.width = '200px';
    this.el.style.borderRightWidth = '1px';
    this.contentEl.focus();
    setTimeout(() => { this.contentEl.focus(); }, 0);
  }

  close(): void {
    this.el.style.width = '0';
    this.el.style.borderRightWidth = '0';
  }

  focusSearch(): void {
    this.searchInput.focus();
    this.searchInput.select();
  }

  clearFilter(): void {
    this.searchInput.value = '';
  }

  isOpen(): boolean {
    return this.el.style.width !== '0px';
  }
}
