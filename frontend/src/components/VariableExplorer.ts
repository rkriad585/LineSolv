import { escapeHtml } from '../utils/html';
import { Icons } from './Icons';

export class VariableExplorer {
  readonly el: HTMLElement;
  readonly contentEl: HTMLDivElement;
  private lastVars: Record<string, number> | null = null;
  private needsRender = true;

  constructor() {
    this.el = document.createElement('aside');
    this.el.id = 'vars-panel';
    this.el.className =
      'shrink-0 flex flex-col overflow-hidden transition-all duration-150 ease-out';
    this.el.style.cssText = 'width:0px;border-left:0;background:var(--surface);';
    this.el.style.borderLeftWidth = '0';

    const header = document.createElement('div');
    header.className =
      'px-4 py-2.5 text-[10px] font-semibold tracking-wider uppercase border-b shrink-0 flex items-center justify-between';
    header.style.cssText = 'color:var(--text-muted);border-color:var(--border);';
    const headerTitle = document.createElement('span');
    headerTitle.textContent = 'Variables';
    const closeHeaderBtn = document.createElement('button');
    closeHeaderBtn.innerHTML = Icons.close();
    closeHeaderBtn.title = 'Close variables';
    closeHeaderBtn.style.cssText =
      'display:flex;align-items:center;justify-content:center;width:18px;height:18px;' +
      'border:none;border-radius:3px;background:transparent;color:var(--text-muted);cursor:pointer;outline:none;';
    closeHeaderBtn.addEventListener('click', () => this.close());
    header.append(headerTitle, closeHeaderBtn);
    this.el.appendChild(header);

    this.contentEl = document.createElement('div');
    this.contentEl.id = 'vars-content';
    this.contentEl.className = 'flex-1 overflow-y-auto p-4';
    this.contentEl.tabIndex = -1;
    this.el.appendChild(this.contentEl);
  }

  render(vars: Record<string, number>): void {
    this.lastVars = vars;
    if (!this.isOpen()) {
      this.needsRender = true;
      return;
    }
    this.buildDOM(vars);
  }

  private buildDOM(vars: Record<string, number>): void {
    const entries = Object.entries(vars);
    if (entries.length === 0) {
      this.contentEl.innerHTML =
        '<div class="text-xs" style="color:var(--text-muted)">No variables</div>';
      return;
    }
    this.contentEl.innerHTML = entries
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => {
        const val = Number.isInteger(v) ? String(v) : parseFloat(v.toFixed(6));
        return `<div class="flex justify-between text-xs py-1"><span style="color:var(--accent)">${escapeHtml(k)}</span><span style="color:var(--text-muted)">${val}</span></div>`;
      })
      .join('');
    this.needsRender = false;
  }

  open(): void {
    if (this.needsRender && this.lastVars !== null) {
      this.buildDOM(this.lastVars);
    }
    this.el.style.width = '180px';
    this.el.style.borderLeftWidth = '1px';
    this.contentEl.focus();
  }

  close(): void {
    this.el.style.width = '0px';
    this.el.style.borderLeftWidth = '0';
  }

  isOpen(): boolean {
    return this.el.style.width !== '0px';
  }
}
