export class ResultDisplay {
  readonly el: HTMLDivElement;

  constructor() {
    this.el = document.createElement('div');
    this.el.id = 'results-column';
    this.el.className = 'min-w-[120px] shrink-0 pt-[20px] pb-4 pl-3 pr-4 text-sm leading-[24px] font-mono text-right overflow-y-auto';
    this.el.style.cssText = 'color:var(--accent);background:var(--surface);border-left:1px solid var(--border);';
    this.el.innerHTML = '<div style="color:var(--text-subtle)">&nbsp;</div>';
  }

  setResults(html: string): void {
    this.el.innerHTML = html;
  }
}
