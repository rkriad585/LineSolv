import * as serviceBindings from '../../wailsjs/go/service/AppService';
import {escapeHtml} from '../utils/html';

function renderMarkdown(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];
  let inCodeBlock = false;
  let codeBuf: string[] = [];
  let inTable = false;
  let tableBuf: string[] = [];

  function flushTable(): void {
    if (tableBuf.length === 0) return;
    const rows = tableBuf.map(r => {
      const cells = r.split('|').filter(c => c.trim()).map(c => `<td>${inlineMd(c.trim())}</td>`);
      return `<tr>${cells.join('')}</tr>`;
    });
    out.push(`<table>${rows.join('')}</table>`);
    tableBuf = [];
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (inCodeBlock) {
      if (line.startsWith('```')) {
        inCodeBlock = false;
        out.push(`<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`);
        codeBuf = [];
      } else {
        codeBuf.push(line);
      }
      continue;
    }

    if (line.startsWith('```')) {
      inCodeBlock = true;
      continue;
    }

    if (inTable) {
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        tableBuf.push(line);
        continue;
      } else {
        inTable = false;
        flushTable();
      }
    }

    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const pipeCount = (line.match(/\|/g) || []).length;
      if (pipeCount >= 3) {
        const nextLine = lines[i + 1];
        if (nextLine && nextLine.trim().startsWith('|') && /^[\s|:\-]+$/.test(nextLine.trim())) {
          inTable = true;
          tableBuf.push(line);
          i++;
          continue;
        }
      }
      if (!inTable) {
        tableBuf.push(line);
        inTable = true;
        continue;
      }
    }

    const trimmed = line.trim();

    if (trimmed === '') {
      out.push('<div class="doc-para-break"></div>');
      continue;
    }

    if (trimmed.startsWith('---')) {
      out.push('<hr>');
      continue;
    }

    if (/^#{1,6}\s/.test(trimmed)) {
      const level = trimmed.match(/^(#+)/)![1].length;
      const text = inlineMd(trimmed.replace(/^#+\s*/, ''));
      out.push(`<h${level}>${text}</h${level}>`);
      continue;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      out.push(`<li>${inlineMd(trimmed.replace(/^[-*]\s*/, ''))}</li>`);
      continue;
    }

    if (/^\d+\.\s/.test(trimmed)) {
      out.push(`<li>${inlineMd(trimmed.replace(/^\d+\.\s*/, ''))}</li>`);
      continue;
    }

    if (trimmed.startsWith('> ')) {
      out.push(`<blockquote><p>${inlineMd(trimmed.replace(/^>\s*/, ''))}</p></blockquote>`);
      continue;
    }

    out.push(`<p>${inlineMd(line)}</p>`);
  }

  if (inCodeBlock) {
    out.push(`<pre><code>${escapeHtml(codeBuf.join('\n'))}</code></pre>`);
  }
  if (inTable) flushTable();

  return out.join('\n');
}

function inlineMd(s: string): string {
  let r = escapeHtml(s);

  // inline code
  r = r.replace(/`([^`]+)`/g, '<code>$1</code>');

  // bold
  r = r.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // italic
  r = r.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // links [text](url)
  r = r.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

  return r;
}

export class DocsViewer {
  readonly el: HTMLDivElement;
  private tabsEl: HTMLDivElement;
  private contentEl: HTMLDivElement;
  private docNames: string[] = [];
  private activeTab: string | null = null;
  private loadedCache = new Map<string, string>();
  private tabButtons = new Map<string, HTMLButtonElement>();
  private isVisible = false;
  private loadingEl: HTMLDivElement;

  constructor() {
    this.el = document.createElement('div');
    this.el.id = 'docs-viewer';
    this.el.style.cssText =
      'position:fixed;inset:0;z-index:1000;display:none;flex-direction:column;' +
      'background:var(--surface);';

    const header = document.createElement('div');
    header.style.cssText =
      'display:flex;align-items:center;justify-content:space-between;' +
      'padding:8px 12px;border-bottom:1px solid var(--border);' +
      'background:var(--surface-secondary);';

    const title = document.createElement('span');
    title.style.cssText = 'font-size:13px;font-weight:600;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;';
    title.textContent = 'Documentation';

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    closeBtn.title = 'Close (Escape)';
    closeBtn.style.cssText =
      'display:flex;align-items:center;justify-content:center;width:26px;height:26px;' +
      'border:none;border-radius:4px;background:transparent;color:var(--text-muted);cursor:pointer;outline:none;';
    closeBtn.addEventListener('mouseenter', () => closeBtn.style.background = 'var(--border)');
    closeBtn.addEventListener('mouseleave', () => closeBtn.style.background = 'transparent');
    closeBtn.addEventListener('click', () => this.close());
    header.append(title, closeBtn);

    const body = document.createElement('div');
    body.style.cssText = 'display:flex;flex:1;min-height:0;';

    this.tabsEl = document.createElement('div');
    this.tabsEl.style.cssText =
      'width:200px;flex-shrink:0;overflow-y:auto;border-right:1px solid var(--border);' +
      'background:var(--surface-secondary);padding:8px 0;';

    this.contentEl = document.createElement('div');
    this.contentEl.style.cssText =
      'flex:1;overflow-y:auto;padding:24px 32px;' +
      'font-size:14px;line-height:1.6;color:var(--text);';

    this.loadingEl = document.createElement('div');
    this.loadingEl.style.cssText =
      'display:flex;align-items:center;justify-content:center;height:100%;' +
      'font-size:13px;color:var(--text-muted);';
    this.loadingEl.textContent = 'Loading...';

    body.append(this.tabsEl, this.contentEl);
    this.el.append(header, body);
  }

  async open(): Promise<void> {
    if (this.isVisible) return;
    this.isVisible = true;
    this.el.style.display = 'flex';
    this.contentEl.innerHTML = '';
    this.contentEl.appendChild(this.loadingEl);

    try {
      const names = await serviceBindings.GetDocList();
      this.docNames = names;
      this.renderTabs();
      if (names.length > 0) {
        const defaultDoc = names.find(n => n === 'user-guide.md') || names[0];
        await this.selectTab(defaultDoc);
      }
    } catch {
      this.contentEl.innerHTML = '<p style="color:var(--error);padding:20px;">Failed to load documentation.</p>';
    }

    document.addEventListener('keydown', this.handleKeydown);
  }

  close(): void {
    if (!this.isVisible) return;
    this.isVisible = false;
    this.el.style.display = 'none';
    document.removeEventListener('keydown', this.handleKeydown);
  }

  isOpen(): boolean {
    return this.isVisible;
  }

  private handleKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') {
      this.close();
    }
  };

  private renderTabs(): void {
    this.tabsEl.innerHTML = '';
    this.tabButtons.clear();
    for (const name of this.docNames) {
      const display = name.replace(/\.md$/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const btn = document.createElement('button');
      btn.textContent = display;
      btn.title = name;
      btn.style.cssText =
        'display:block;width:100%;padding:8px 16px;border:none;background:transparent;' +
        'color:var(--text-muted);cursor:pointer;font-size:13px;text-align:left;outline:none;' +
        'transition:background 0.15s,color 0.15s;';
      btn.addEventListener('mouseenter', () => {
        if (this.activeTab !== name) btn.style.background = 'var(--surface-hover)';
      });
      btn.addEventListener('mouseleave', () => {
        if (this.activeTab !== name) btn.style.background = 'transparent';
      });
      btn.addEventListener('click', () => this.selectTab(name));
      this.tabsEl.appendChild(btn);
      this.tabButtons.set(name, btn);
    }
  }

  private async selectTab(name: string): Promise<void> {
    this.activeTab = name;

    for (const [n, btn] of this.tabButtons) {
      if (n === name) {
        btn.style.background = 'var(--accent)';
        btn.style.color = '#fff';
      } else {
        btn.style.background = 'transparent';
        btn.style.color = 'var(--text-muted)';
      }
    }

    this.contentEl.innerHTML = '';
    this.contentEl.appendChild(this.loadingEl);

    try {
      let content = this.loadedCache.get(name);
      if (!content) {
        content = await serviceBindings.GetDocContent(name);
        if (content) this.loadedCache.set(name, content);
      }
      if (content) {
        this.contentEl.innerHTML = renderMarkdown(content);
      } else {
        this.contentEl.innerHTML = '<p style="color:var(--text-muted);padding:20px;">Document not found.</p>';
      }
    } catch {
      this.contentEl.innerHTML = '<p style="color:var(--error);padding:20px;">Failed to load document.</p>';
    }
  }
}
