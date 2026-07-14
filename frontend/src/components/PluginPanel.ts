import * as serviceBindings from '../../wailsjs/go/service/AppService';
import {toast} from '../utils/toast';

interface RemotePlugin {
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  type: string;
  tags: string[];
  directory: string;
}

interface LocalPlugin {
  name: string;
  version: string;
  enabled: boolean;
  dir: string;
  functions?: number;
  themes?: number;
  variables?: number;
  error?: string;
}

interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  functions?: Array<{name: string; description: string; args: number; min_args: number; max_args: number; expression?: string; builtin?: string; examples?: string[]}>;
  themes?: Array<{id: string; label: string; colors: Record<string, string>}>;
  variables?: Array<{name: string; description: string; value: number}>;
}

const PLUGINS_REPO_URL = 'https://raw.githubusercontent.com/rkriad585/linesolv-plugins/main';
const PLUGINS_INDEX_URL = `${PLUGINS_REPO_URL}/plugins.json`;

const CLOSE_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
const SEARCH_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
const REFRESH_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>';
const DOWNLOAD_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
const CHECK_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
const TRASH_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
const UPDATE_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>';
const PLUGIN_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="10" y1="9" x2="14" y2="9"/><line x1="10" y1="15" x2="14" y2="15"/></svg>';
const BACK_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
const SPINNER = '<div style="width:14px;height:14px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin 0.6s linear infinite;"></div>';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const COPY_ICON = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
const CHECK_CIRCLE_ICON = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';

function md(text: string, codeBlocks?: string[]): string {
  const blocks: string[] = [];
  let processed = text.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, _lang: string, code: string) => {
    const id = `__codeblock_${blocks.length}__`;
    blocks.push(code);
    return id;
  });

  processed = processed
    .replace(/^#### (.+)$/gm, '<h4 style="font-size:14px;font-weight:600;color:var(--text);margin:16px 0 6px;">$1</h4>')
    .replace(/^### (.+)$/gm, '<h3 style="font-size:15px;font-weight:600;color:var(--text);margin:20px 0 8px;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:17px;font-weight:600;color:var(--text);margin:24px 0 8px;border-bottom:1px solid var(--border);padding-bottom:6px;">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="font-size:20px;font-weight:600;color:var(--text);margin:0 0 12px;">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>')
    .replace(/`([^`\n]+)`/g, '<code style="background:var(--surface);padding:1px 5px;border-radius:3px;font-size:12px;color:var(--accent);font-family:monospace;">$1</code>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:6px;margin:8px 0;" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:var(--accent);text-decoration:none;border-bottom:1px solid transparent;transition:border-color 0.15s;">$1</a>')
    .replace(/^> (.+)$/gm, '<blockquote style="margin:8px 0;padding:8px 16px;border-left:3px solid var(--accent);background:var(--surface-secondary);border-radius:0 6px 6px 0;font-size:13px;color:var(--text-muted);">$1</blockquote>')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--border);margin:16px 0;">')
    .replace(/^\|(.+)\|$/gm, (match) => {
      const cells = match.split('|').filter(Boolean).map(c => c.trim());
      if (cells.every(c => /^[-:]+$/.test(c))) return '';
      return '<tr>' + cells.map(c => `<td style="padding:6px 12px;border-bottom:1px solid var(--border);font-size:13px;color:var(--text-muted);">${c.trim()}</td>`).join('') + '</tr>';
    })
    .replace(/(<tr>.*<\/tr>\n?)+/gs, (match) => `<table style="width:100%;border-collapse:collapse;margin:8px 0;">${match}</table>`)
    .replace(/^[-*] (.+)$/gm, '<li style="margin:3px 0;color:var(--text-muted);font-size:13px;">$1</li>')
    .replace(/^(\d+)\. (.+)$/gm, '<li style="margin:3px 0;color:var(--text-muted);font-size:13px;list-style-type:decimal;">$2</li>')
    .replace(/(<li[^>]*>.*<\/li>\n?)+/gs, (match) => {
      const isOrdered = /list-style-type:decimal/.test(match);
      const tag = isOrdered ? 'ol' : 'ul';
      return `<${tag} style="margin:8px 0;padding-left:20px;">${match}</${tag}>`;
    });

  const paragraphs = processed.split(/\n{2,}/);
  processed = paragraphs.map(p => {
    p = p.trim();
    if (!p) return '';
    if (/^<[a-z]/.test(p) && !/^(<li|<tr|<h[1-6]|<hr|<blockquote)/.test(p)) return p;
    if (/^__codeblock_\d+__$/.test(p)) return p;
    if (/^<(li|tr|h[1-6]|hr|blockquote|ul|ol|table|pre|div)/.test(p)) return p;
    return `<p style="margin:8px 0;line-height:1.7;">${p.replace(/\n/g, '<br>')}</p>`;
  }).join('\n');

  const result = processed.replace(/__codeblock_(\d+)__/g, (_m, i: string) => {
    const idx = parseInt(i);
    const code = blocks[idx];
    const langMatch = text.match(new RegExp('```(\\w*)\\n' + code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 20)));
    const lang = langMatch ? langMatch[1] : '';
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const langLabel = lang ? `<span style="position:absolute;top:6px;right:10px;font-size:10px;color:var(--text-subtle);text-transform:uppercase;letter-spacing:0.5px;">${lang}</span>` : '';
    return `<div style="position:relative;margin:12px 0;background:var(--surface);border:1px solid var(--border);border-radius:8px;overflow:hidden;"><div style="display:flex;justify-content:flex-end;align-items:center;padding:4px 8px;border-bottom:1px solid var(--border);background:var(--surface-secondary);"><button class="md-copy-btn" data-code="${idx}" style="display:flex;align-items:center;gap:4px;padding:2px 8px;font-size:11px;color:var(--text-muted);background:transparent;border:1px solid var(--border);border-radius:4px;cursor:pointer;transition:color 0.15s,border-color 0.15s;">${COPY_ICON} Copy</button></div><pre style="margin:0;padding:12px 16px;overflow-x:auto;font-size:12px;line-height:1.6;color:var(--text-muted);font-family:monospace;"><code>${escaped}</code></pre>${langLabel}</div>`;
  });

  if (codeBlocks) {
    codeBlocks.length = 0;
    for (const b of blocks) codeBlocks.push(b);
  }
  return result;
}

export class PluginPanel {
  readonly el: HTMLDivElement;
  private isVisible = false;
  private searchInput!: HTMLInputElement;
  private pluginListEl!: HTMLElement;
  private loadingEl!: HTMLElement;
  private errorEl!: HTMLElement;
  private detailView!: HTMLElement;
  private detailContent!: HTMLElement;
  private bodyEl!: HTMLElement;
  private headerTitleEl!: HTMLElement;
  private searchWrapper!: HTMLElement;
  private currentDetail: string | null = null;

  private remotePlugins: RemotePlugin[] = [];
  private localPlugins: Map<string, LocalPlugin> = new Map();
  private searchQuery = '';
  private activeActions: Set<string> = new Set();
  private lastCodeBlocks: string[] = [];
  onPluginsChanged: (() => void) | null = null;

  constructor() {
    this.el = document.createElement('div');
    this.el.id = 'plugin-viewer';
    this.el.style.cssText =
      'position:fixed;inset:0;z-index:1000;display:none;flex-direction:column;' +
      'background:var(--surface);';
    this.build();
  }

  private build(): void {
    const header = document.createElement('div');
    header.style.cssText =
      'display:flex;align-items:center;justify-content:space-between;padding:8px 16px;' +
      'background:var(--surface-secondary);border-bottom:1px solid var(--border);--wails-draggable:drag;';
    header.addEventListener('dblclick', (e) => {
      if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
      try {
        const rt = window.runtime;
        if (rt) rt.WindowToggleMaximise();
      } catch { /* ignored */ }
    });

    this.headerTitleEl = document.createElement('div');
    this.headerTitleEl.style.cssText = 'display:flex;align-items:center;gap:8px;color:var(--text);font-weight:600;--wails-draggable:drag;';
    this.headerTitleEl.innerHTML = `${PLUGIN_ICON}<span style="font-size:13px;font-weight:600;color:var(--text-muted);letter-spacing:0.1em;text-transform:uppercase;">Plugins</span>`;

    this.searchWrapper = document.createElement('div');
    this.searchWrapper.style.cssText = 'display:flex;align-items:center;gap:8px;--wails-draggable:no-drag;';

    this.searchInput = document.createElement('input');
    this.searchInput.type = 'text';
    this.searchInput.placeholder = 'Search plugins...';
    this.searchInput.style.cssText =
      'width:250px;padding:6px 10px 6px 30px;border:1px solid var(--border);border-radius:6px;' +
      'background:var(--surface);color:var(--text);font-size:13px;outline:none;';
    this.searchInput.addEventListener('input', () => this.filterPlugins());

    const searchIconWrapper = document.createElement('div');
    searchIconWrapper.style.cssText = 'position:absolute;left:8px;top:50%;transform:translateY(-50%);color:var(--text-muted);pointer-events:none;';
    searchIconWrapper.innerHTML = SEARCH_ICON;

    const searchContainer = document.createElement('div');
    searchContainer.style.cssText = 'position:relative;--wails-draggable:no-drag;';
    searchContainer.appendChild(this.searchInput);
    searchContainer.appendChild(searchIconWrapper);

    const refreshBtn = document.createElement('button');
    refreshBtn.innerHTML = REFRESH_ICON;
    refreshBtn.title = 'Refresh';
    refreshBtn.style.cssText = this.iconBtnStyle();
    refreshBtn.addEventListener('click', async () => {
      try {
        await serviceBindings.ReloadPlugins();
        await this.loadPlugins();
        this.onPluginsChanged?.();
      } catch { /* ignore */ }
    });

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = CLOSE_ICON;
    closeBtn.title = 'Close (Esc)';
    closeBtn.style.cssText = this.iconBtnStyle();
    closeBtn.addEventListener('click', () => this.close());

    this.searchWrapper.append(searchContainer, refreshBtn, closeBtn);
    header.append(this.headerTitleEl, this.searchWrapper);

    this.bodyEl = document.createElement('div');
    this.bodyEl.style.cssText = 'flex:1;overflow-y:auto;padding:20px;';

    this.loadingEl = document.createElement('div');
    this.loadingEl.style.cssText = 'text-align:center;padding:60px;color:var(--text-muted);';
    this.loadingEl.innerHTML = '<div style="width:24px;height:24px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin 0.6s linear infinite;margin:0 auto 12px;"></div>Loading plugins...';

    this.errorEl = document.createElement('div');
    this.errorEl.style.cssText = 'text-align:center;padding:60px;color:var(--error);display:none;';

    this.pluginListEl = document.createElement('div');
    this.pluginListEl.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:16px;';
    this.pluginListEl.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('.plugin-action-btn') as HTMLButtonElement;
      if (btn && !btn.disabled) {
        const action = btn.dataset.action;
        const pluginName = btn.dataset.plugin;
        if (action && pluginName) {
          this.handleAction(action, pluginName);
        }
        return;
      }
      const toggle = (e.target as HTMLElement).closest('.plugin-toggle') as HTMLElement;
      if (toggle) {
        const pluginName = toggle.dataset.plugin;
        if (pluginName) {
          this.handleToggle(pluginName);
        }
        return;
      }
      const card = (e.target as HTMLElement).closest('.plugin-card') as HTMLElement;
      if (card && card.dataset.plugin) {
        this.showDetail(card.dataset.plugin);
      }
    });

    this.detailView = document.createElement('div');
    this.detailView.style.cssText = 'display:none;flex-direction:column;height:100%;';
    this.detailContent = document.createElement('div');
    this.detailContent.className = 'detail-content';
    this.detailContent.style.cssText = 'flex:1;overflow-y:auto;padding:20px;';
    this.detailContent.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest('.plugin-action-btn') as HTMLButtonElement;
      if (btn && !btn.disabled) {
        const action = btn.dataset.action;
        const pluginName = btn.dataset.plugin;
        if (action && pluginName) {
          this.handleAction(action, pluginName);
        }
        return;
      }
      const toggle = (e.target as HTMLElement).closest('.plugin-toggle') as HTMLElement;
      if (toggle) {
        const pluginName = toggle.dataset.plugin;
        if (pluginName) {
          this.handleToggle(pluginName);
        }
        return;
      }
      const copyBtn = (e.target as HTMLElement).closest('.md-copy-btn') as HTMLButtonElement;
      if (copyBtn) {
        const idx = parseInt(copyBtn.dataset.code || '-1');
        if (idx >= 0 && idx < this.lastCodeBlocks.length) {
          navigator.clipboard.writeText(this.lastCodeBlocks[idx]).then(() => {
            copyBtn.innerHTML = `${CHECK_CIRCLE_ICON} Copied`;
            copyBtn.style.color = 'var(--accent)';
            copyBtn.style.borderColor = 'var(--accent)';
            setTimeout(() => {
              copyBtn.innerHTML = `${COPY_ICON} Copy`;
              copyBtn.style.color = '';
              copyBtn.style.borderColor = '';
            }, 1500);
          });
        }
      }
    });
    this.detailView.appendChild(this.detailContent);

    this.bodyEl.append(this.loadingEl, this.errorEl, this.pluginListEl, this.detailView);
    this.el.append(header, this.bodyEl);

    document.addEventListener('keydown', this.handleKeydown);
  }

  private iconBtnStyle(): string {
    return 'display:flex;align-items:center;justify-content:center;width:28px;height:28px;' +
      'border:none;border-radius:6px;background:transparent;color:var(--text-muted);cursor:pointer;outline:none;' +
      'transition:background 0.15s;--wails-draggable:no-drag;';
  }

  private handleKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this.isVisible) {
      if (this.currentDetail) {
        this.hideDetail();
      } else {
        this.close();
      }
    }
  };

  async open(): Promise<void> {
    if (this.isVisible) return;
    this.isVisible = true;
    this.el.style.display = 'flex';
    this.searchInput.value = '';
    this.searchQuery = '';
    this.hideDetail();
    await this.loadPlugins();
  }

  close(): void {
    if (!this.isVisible) return;
    this.isVisible = false;
    this.el.style.display = 'none';
  }

  isOpen(): boolean {
    return this.isVisible;
  }

  private showListView(): void {
    this.loadingEl.style.display = 'none';
    this.errorEl.style.display = 'none';
    this.pluginListEl.style.display = 'grid';
    this.detailView.style.display = 'none';
    this.searchWrapper.style.display = 'flex';
    this.headerTitleEl.innerHTML = `${PLUGIN_ICON}<span>Plugins</span>`;
    this.currentDetail = null;
  }

  private showDetailView(): void {
    this.loadingEl.style.display = 'none';
    this.errorEl.style.display = 'none';
    this.pluginListEl.style.display = 'none';
    this.detailView.style.display = 'flex';
    this.searchWrapper.style.display = 'none';
  }

  private hideDetail(): void {
    this.showListView();
  }

  private async showDetail(pluginName: string): Promise<void> {
    const plugin = this.remotePlugins.find(p => p.name === pluginName);
    if (!plugin) return;

    this.currentDetail = pluginName;
    this.showDetailView();

    this.headerTitleEl.innerHTML = '';

    const backBtn = document.createElement('button');
    backBtn.innerHTML = BACK_ICON;
    backBtn.title = 'Back';
    backBtn.style.cssText = this.iconBtnStyle();
    backBtn.addEventListener('click', () => this.hideDetail());

    const titleSpan = document.createElement('span');
    titleSpan.textContent = plugin.name;
    titleSpan.style.cssText = 'font-size:16px;font-weight:600;color:var(--text);';

    this.headerTitleEl.append(backBtn, titleSpan);

    this.detailContent.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-muted);"><div style="width:24px;height:24px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin 0.6s linear infinite;margin:0 auto 12px;"></div>Loading plugin details...</div>';

    try {
      const [manifestResp, readmeResp] = await Promise.all([
        fetch(`${PLUGINS_REPO_URL}/plugins/${plugin.directory}/plugin.json`),
        fetch(`${PLUGINS_REPO_URL}/plugins/${plugin.directory}/README.md`)
      ]);

      let manifest: PluginManifest | null = null;
      if (manifestResp.ok) {
        manifest = await manifestResp.json();
      }

      let readme = '';
      if (readmeResp.ok) {
        readme = await readmeResp.text();
      }

      this.renderDetail(plugin, manifest, readme);
    } catch {
      this.detailContent.innerHTML = '<div style="text-align:center;padding:60px;color:var(--error);">Failed to load plugin details</div>';
    }
  }

  private renderDetail(plugin: RemotePlugin, manifest: PluginManifest | null, readme: string): void {
    this.detailContent.innerHTML = '';

    const local = this.localPlugins.get(plugin.name);
    const isInstalled = !!local;
    const hasUpdate = isInstalled && local && this.compareVersions(plugin.version, local.version) > 0;
    const isActive = this.activeActions.has(plugin.name);

    // Hero section
    const hero = document.createElement('div');
    hero.style.cssText = 'background:var(--surface-secondary);border:1px solid var(--border);border-radius:12px;padding:24px;margin-bottom:20px;';

    const nameRow = document.createElement('div');
    nameRow.style.cssText = 'display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap;';
    nameRow.innerHTML = `<span style="font-size:22px;font-weight:700;color:var(--text)">${esc(plugin.name)}</span>` +
      `<span style="font-size:12px;padding:3px 10px;border-radius:10px;background:var(--accent);color:var(--surface);font-weight:500">${esc(plugin.type)}</span>` +
      (hasUpdate ? `<span style="font-size:12px;padding:3px 10px;border-radius:10px;background:var(--error);color:white;font-weight:500">Update Available</span>` : '');

    const meta = document.createElement('div');
    meta.style.cssText = 'font-size:13px;color:var(--text-muted);margin-bottom:8px;';
    meta.textContent = `v${plugin.version} by ${plugin.author}`;

    const desc = document.createElement('div');
    desc.style.cssText = 'font-size:14px;color:var(--text-muted);line-height:1.6;margin-bottom:12px;';
    desc.textContent = plugin.description;

    hero.append(nameRow, meta, desc);

    if (plugin.homepage) {
      const link = document.createElement('a');
      link.href = plugin.homepage;
      link.target = '_blank';
      link.textContent = plugin.homepage;
      link.style.cssText = 'font-size:12px;color:var(--accent);text-decoration:none;display:inline-block;margin-bottom:12px;';
      hero.appendChild(link);
    }

    if (plugin.tags.length) {
      const tagsDiv = document.createElement('div');
      tagsDiv.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px;';
      for (const t of plugin.tags) {
        const span = document.createElement('span');
        span.style.cssText = 'font-size:11px;padding:3px 10px;border-radius:4px;background:var(--surface);color:var(--text-subtle);';
        span.textContent = t;
        tagsDiv.appendChild(span);
      }
      hero.appendChild(tagsDiv);
    }

    // Action buttons
    const actionsDiv = document.createElement('div');
    actionsDiv.style.cssText = 'display:flex;gap:8px;';

    if (isInstalled && local) {
      const toggle = document.createElement('div');
      toggle.className = 'plugin-toggle';
      toggle.dataset.plugin = plugin.name;
      toggle.style.cssText = 'cursor:pointer;position:relative;width:40px;height:22px;flex-shrink:0;';
      const track = document.createElement('div');
      track.style.cssText = `position:absolute;inset:0;border-radius:11px;transition:background 0.2s;${local.enabled ? 'background:var(--accent);' : 'background:var(--text-subtle);'}`;
      const thumb = document.createElement('div');
      thumb.style.cssText = `position:absolute;top:2px;left:${local.enabled ? '20px' : '2px'};width:18px;height:18px;border-radius:50%;background:white;transition:left 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.3);`;
      toggle.append(track, thumb);
      actionsDiv.appendChild(toggle);
    }

    if (!isInstalled) {
      const installBtn = document.createElement('button');
      installBtn.className = 'plugin-action-btn';
      installBtn.dataset.action = 'install';
      installBtn.dataset.plugin = plugin.name;
      installBtn.disabled = isActive;
      installBtn.style.cssText = 'flex:1;padding:10px 16px;background:var(--accent);color:var(--surface);border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:14px;display:flex;align-items:center;justify-content:center;gap:8px;';
      installBtn.innerHTML = isActive ? `${SPINNER} Installing...` : `${DOWNLOAD_ICON} Install`;
      actionsDiv.appendChild(installBtn);
    } else if (hasUpdate) {
      const updateBtn = document.createElement('button');
      updateBtn.className = 'plugin-action-btn';
      updateBtn.dataset.action = 'update';
      updateBtn.dataset.plugin = plugin.name;
      updateBtn.disabled = isActive;
      updateBtn.style.cssText = 'flex:1;padding:10px 16px;background:var(--accent);color:var(--surface);border:none;border-radius:6px;cursor:pointer;font-weight:600;font-size:14px;display:flex;align-items:center;justify-content:center;gap:8px;';
      updateBtn.innerHTML = isActive ? `${SPINNER} Updating...` : `${UPDATE_ICON} Update`;
      actionsDiv.appendChild(updateBtn);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'plugin-action-btn';
      removeBtn.dataset.action = 'remove';
      removeBtn.dataset.plugin = plugin.name;
      removeBtn.disabled = isActive;
      removeBtn.style.cssText = 'padding:10px 16px;background:transparent;color:var(--error);border:1px solid var(--error);border-radius:6px;cursor:pointer;font-weight:600;font-size:14px;display:flex;align-items:center;justify-content:center;gap:8px;';
      removeBtn.innerHTML = `${TRASH_ICON} Remove`;
      actionsDiv.appendChild(removeBtn);
    } else {
      const installedBadge = document.createElement('div');
      installedBadge.style.cssText = 'flex:1;padding:10px 16px;background:transparent;color:var(--accent);border:1px solid var(--accent);border-radius:6px;font-weight:600;font-size:14px;display:flex;align-items:center;justify-content:center;gap:8px;';
      installedBadge.innerHTML = `${CHECK_ICON} Installed`;
      actionsDiv.appendChild(installedBadge);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'plugin-action-btn';
      removeBtn.dataset.action = 'remove';
      removeBtn.dataset.plugin = plugin.name;
      removeBtn.disabled = isActive;
      removeBtn.style.cssText = 'padding:10px 16px;background:transparent;color:var(--error);border:1px solid var(--error);border-radius:6px;cursor:pointer;font-weight:600;font-size:14px;display:flex;align-items:center;justify-content:center;gap:8px;';
      removeBtn.innerHTML = `${TRASH_ICON} Remove`;
      actionsDiv.appendChild(removeBtn);
    }

    hero.appendChild(actionsDiv);
    this.detailContent.appendChild(hero);

    // Manifest details
    if (manifest) {
      if (manifest.functions && manifest.functions.length > 0) {
        const section = this.createSection('Functions');
        const table = this.createTable(['Name', 'Description', 'Args', 'Type'], manifest.functions.map(fn => [
          fn.name,
          fn.description,
          fn.max_args === -1 ? `${fn.min_args}+` : `${fn.min_args}`,
          fn.builtin ? `builtin: ${fn.builtin}` : fn.expression ? `expr: ${fn.expression}` : '-'
        ]));
        section.appendChild(table);
        if (manifest.functions.some(fn => fn.examples && fn.examples.length > 0)) {
          const exDiv = document.createElement('div');
          exDiv.style.cssText = 'margin-top:12px;';
          const exTitle = document.createElement('div');
          exTitle.style.cssText = 'font-size:13px;font-weight:600;color:var(--text);margin-bottom:6px;';
          exTitle.textContent = 'Examples';
          exDiv.appendChild(exTitle);
          for (const fn of manifest.functions) {
            if (fn.examples && fn.examples.length > 0) {
              for (const ex of fn.examples) {
                const row = document.createElement('div');
                row.style.cssText = 'display:flex;align-items:center;gap:8px;margin:4px 0;padding:6px 10px;background:var(--surface);border:1px solid var(--border);border-radius:6px;font-family:monospace;font-size:12px;color:var(--text-muted);';
                const code = document.createElement('span');
                code.style.cssText = 'flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
                code.textContent = ex;
                const copyBtn = document.createElement('button');
                copyBtn.className = 'example-copy-btn';
                copyBtn.dataset.code = ex;
                copyBtn.innerHTML = COPY_ICON;
                copyBtn.title = 'Copy';
                copyBtn.style.cssText = 'display:flex;align-items:center;justify-content:center;width:24px;height:24px;border:none;border-radius:4px;background:transparent;color:var(--text-subtle);cursor:pointer;flex-shrink:0;transition:color 0.15s,background 0.15s;';
                copyBtn.addEventListener('click', (ev) => {
                  ev.stopPropagation();
                  navigator.clipboard.writeText(ex).then(() => {
                    copyBtn.innerHTML = CHECK_CIRCLE_ICON;
                    copyBtn.style.color = 'var(--accent)';
                    setTimeout(() => {
                      copyBtn.innerHTML = COPY_ICON;
                      copyBtn.style.color = '';
                    }, 1500);
                  });
                });
                row.append(code, copyBtn);
                exDiv.appendChild(row);
              }
            }
          }
          section.appendChild(exDiv);
        }
        this.detailContent.appendChild(section);
      }

      if (manifest.variables && manifest.variables.length > 0) {
        const section = this.createSection('Variables');
        const table = this.createTable(['Name', 'Description', 'Value'], manifest.variables.map(v => [
          v.name,
          v.description,
          String(v.value)
        ]));
        section.appendChild(table);
        this.detailContent.appendChild(section);
      }

      if (manifest.themes && manifest.themes.length > 0) {
        const section = this.createSection('Themes');
        for (const theme of manifest.themes) {
          const card = document.createElement('div');
          card.style.cssText = 'background:var(--surface-secondary);border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:10px;';
          const swatch = document.createElement('div');
          swatch.style.cssText = `height:40px;border-radius:6px;margin-bottom:8px;background:${theme.colors['--surface'] || '#18181b'};display:flex;align-items:center;justify-content:center;gap:12px;padding:0 16px;`;
          const accent = document.createElement('span');
          accent.style.cssText = `font-size:16px;font-weight:700;color:${theme.colors['--accent'] || '#a78bfa'};`;
          accent.textContent = 'Aa';
          const text = document.createElement('span');
          text.style.cssText = `font-size:12px;color:${theme.colors['--text'] || '#f4f4f5'};`;
          text.textContent = '123';
          swatch.append(accent, text);
          const label = document.createElement('div');
          label.style.cssText = 'font-size:13px;font-weight:600;color:var(--text);';
          label.textContent = theme.label;
          card.append(swatch, label);
          section.appendChild(card);
        }
        this.detailContent.appendChild(section);
      }
    }

    // README section
    if (readme) {
      const readmeSection = document.createElement('div');
      readmeSection.style.cssText = 'background:var(--surface-secondary);border:1px solid var(--border);border-radius:12px;padding:24px;margin-top:20px;';
      const readmeTitle = document.createElement('div');
      readmeTitle.style.cssText = 'font-size:17px;font-weight:600;color:var(--text);margin-bottom:16px;border-bottom:1px solid var(--border);padding-bottom:8px;';
      readmeTitle.textContent = 'Documentation';
      readmeSection.appendChild(readmeTitle);
      const readmeBody = document.createElement('div');
      readmeBody.style.cssText = 'font-size:13px;color:var(--text-muted);line-height:1.7;';
      readmeBody.innerHTML = md(readme, this.lastCodeBlocks);
      readmeSection.appendChild(readmeBody);
      this.detailContent.appendChild(readmeSection);
    }
  }

  private createSection(title: string): HTMLElement {
    const section = document.createElement('div');
    section.style.cssText = 'background:var(--surface-secondary);border:1px solid var(--border);border-radius:12px;padding:20px;margin-top:16px;';
    const titleEl = document.createElement('div');
    titleEl.style.cssText = 'font-size:15px;font-weight:600;color:var(--text);margin-bottom:12px;border-bottom:1px solid var(--border);padding-bottom:6px;';
    titleEl.textContent = title;
    section.appendChild(titleEl);
    return section;
  }

  private createTable(headers: string[], rows: string[][]): HTMLElement {
    const table = document.createElement('table');
    table.style.cssText = 'width:100%;border-collapse:collapse;font-size:13px;';
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    for (const h of headers) {
      const th = document.createElement('th');
      th.style.cssText = 'text-align:left;padding:6px 10px;color:var(--text-muted);border-bottom:1px solid var(--border);font-weight:500;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;';
      th.textContent = h;
      headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    for (const row of rows) {
      const tr = document.createElement('tr');
      for (const cell of row) {
        const td = document.createElement('td');
        td.style.cssText = 'padding:6px 10px;color:var(--text-muted);border-bottom:1px solid var(--border);';
        td.textContent = cell;
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    return table;
  }

  private async loadPlugins(): Promise<void> {
    this.showListView();
    this.loadingEl.style.display = 'block';
    this.errorEl.style.display = 'none';
    this.pluginListEl.innerHTML = '';

    try {
      const [remoteResponse, localPlugins] = await Promise.all([
        fetch(PLUGINS_INDEX_URL),
        serviceBindings.GetPlugins()
      ]);

      if (!remoteResponse.ok) throw new Error('Failed to fetch plugin list');

      const remoteData = await remoteResponse.json();
      this.remotePlugins = remoteData.plugins || [];

      this.localPlugins.clear();
      if (localPlugins) {
        for (const p of localPlugins) {
          this.localPlugins.set(p.name, {
            name: p.name,
            version: p.version,
            enabled: p.enabled,
            dir: p.dir,
            functions: p.functions ? p.functions.length : 0,
            themes: p.themes ? p.themes.length : 0,
            variables: p.variables ? p.variables.length : 0,
            error: p.error
          });
        }
      }

      this.renderPlugins();
    } catch (e) {
      this.loadingEl.style.display = 'none';
      this.errorEl.style.display = 'block';
      const msg = e instanceof Error ? esc(e.message) : 'Unknown error';
      this.errorEl.innerHTML = `
        <div style="font-size:48px;margin-bottom:16px;opacity:0.3">&#9888;&#65039;</div>
        <div style="font-size:16px;font-weight:600;margin-bottom:8px">Failed to load plugins</div>
        <div style="font-size:13px;opacity:0.7">${msg}</div>
        <button style="margin-top:16px;padding:8px 16px;background:var(--accent);color:var(--surface);border:none;border-radius:6px;cursor:pointer;font-weight:500" onclick="this.closest('#plugin-viewer').dispatchEvent(new CustomEvent('plugin-retry'))">Retry</button>
      `;
      this.el.addEventListener('plugin-retry', () => this.loadPlugins(), {once: true});
    }
  }

  private renderPlugins(): void {
    this.loadingEl.style.display = 'none';
    this.pluginListEl.innerHTML = '';

    const filtered = this.filterRemotePlugins();

    if (filtered.length === 0) {
      this.pluginListEl.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:60px;color:var(--text-muted);">
          <div style="font-size:48px;margin-bottom:16px;opacity:0.3">&#128269;</div>
          <div style="font-size:16px;font-weight:600;margin-bottom:8px">No plugins found</div>
          <div style="font-size:13px;opacity:0.7">${this.searchQuery ? 'Try a different search term' : 'No plugins available yet'}</div>
        </div>
      `;
      return;
    }

    for (const plugin of filtered) {
      this.pluginListEl.appendChild(this.renderPluginCard(plugin));
    }
  }

  private filterRemotePlugins(): RemotePlugin[] {
    if (!this.searchQuery) return this.remotePlugins;
    const query = this.searchQuery.toLowerCase();
    return this.remotePlugins.filter(p =>
      p.name.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      p.author.toLowerCase().includes(query) ||
      p.tags.some(t => t.toLowerCase().includes(query))
    );
  }

  private filterPlugins(): void {
    this.searchQuery = this.searchInput.value;
    this.renderPlugins();
  }

  private renderPluginCard(plugin: RemotePlugin): HTMLElement {
    const card = document.createElement('div');
    card.className = 'plugin-card';
    card.dataset.plugin = plugin.name;
    card.style.cssText = 'background:var(--surface-secondary);border:1px solid var(--border);border-radius:10px;padding:16px;display:flex;flex-direction:column;gap:12px;cursor:pointer;transition:border-color 0.15s;';
    card.addEventListener('mouseenter', () => { card.style.borderColor = 'var(--accent)'; });
    card.addEventListener('mouseleave', () => { card.style.borderColor = 'var(--border)'; });

    const local = this.localPlugins.get(plugin.name);
    const isInstalled = !!local;
    const hasUpdate = isInstalled && local && this.compareVersions(plugin.version, local.version) > 0;
    const isActive = this.activeActions.has(plugin.name);
    const hasError = local && local.error;

    const headerRow = document.createElement('div');
    headerRow.style.cssText = 'display:flex;justify-content:space-between;align-items:flex-start;';

    const infoDiv = document.createElement('div');
    infoDiv.style.cssText = 'flex:1;';

    const nameRow = document.createElement('div');
    nameRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:4px;flex-wrap:wrap;';
    nameRow.innerHTML = `<span style="font-size:16px;font-weight:600;color:var(--text)">${esc(plugin.name)}</span>` +
      `<span style="font-size:11px;padding:2px 8px;border-radius:10px;background:var(--accent);color:var(--surface);font-weight:500">${esc(plugin.type)}</span>` +
      (hasUpdate ? `<span style="font-size:11px;padding:2px 8px;border-radius:10px;background:var(--error);color:white;font-weight:500">Update Available</span>` : '') +
      (hasError ? `<span style="font-size:11px;padding:2px 8px;border-radius:10px;background:var(--error);color:white;font-weight:500">Error</span>` : '');

    const meta = document.createElement('div');
    meta.style.cssText = 'font-size:12px;color:var(--text-muted);margin-bottom:4px;';
    meta.textContent = `v${plugin.version} by ${plugin.author}`;

    const desc = document.createElement('div');
    desc.style.cssText = 'font-size:13px;color:var(--text-muted);line-height:1.5;';
    desc.textContent = plugin.description;

    infoDiv.append(nameRow, meta, desc);

    if (isInstalled && local) {
      const caps = document.createElement('div');
      caps.style.cssText = 'display:flex;gap:12px;margin-top:4px;';
      if (local.functions && local.functions > 0) {
        caps.innerHTML += `<span style="font-size:11px;color:var(--text-subtle);">${local.functions} function${local.functions > 1 ? 's' : ''}</span>`;
      }
      if (local.variables && local.variables > 0) {
        caps.innerHTML += `<span style="font-size:11px;color:var(--text-subtle);">${local.variables} variable${local.variables > 1 ? 's' : ''}</span>`;
      }
      if (local.themes && local.themes > 0) {
        caps.innerHTML += `<span style="font-size:11px;color:var(--text-subtle);">${local.themes} theme${local.themes > 1 ? 's' : ''}</span>`;
      }
      if (hasError) {
        caps.innerHTML += `<span style="font-size:11px;color:var(--error);">${esc(local.error!)}</span>`;
      }
      infoDiv.appendChild(caps);
    }

    headerRow.appendChild(infoDiv);

    if (isInstalled && local) {
      const toggle = document.createElement('div');
      toggle.className = 'plugin-toggle';
      toggle.dataset.plugin = plugin.name;
      toggle.style.cssText = 'cursor:pointer;position:relative;width:40px;height:22px;flex-shrink:0;margin-top:2px;';
      const track = document.createElement('div');
      track.style.cssText = `position:absolute;inset:0;border-radius:11px;transition:background 0.2s;${local.enabled ? 'background:var(--accent);' : 'background:var(--text-subtle);'}`;
      const thumb = document.createElement('div');
      const thumbLeft = local.enabled ? '20px' : '2px';
      thumb.style.cssText = `position:absolute;top:2px;left:${thumbLeft};width:18px;height:18px;border-radius:50%;background:white;transition:left 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.3);`;
      toggle.append(track, thumb);
      headerRow.appendChild(toggle);
    }

    const tagsDiv = document.createElement('div');
    tagsDiv.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;';
    if (plugin.tags.length) {
      for (const t of plugin.tags) {
        const span = document.createElement('span');
        span.style.cssText = 'font-size:11px;padding:2px 8px;border-radius:4px;background:var(--surface);color:var(--text-subtle);';
        span.textContent = t;
        tagsDiv.appendChild(span);
      }
    }

    const actionsDiv = document.createElement('div');
    actionsDiv.style.cssText = 'display:flex;gap:8px;margin-top:auto;';

    if (!isInstalled) {
      const installBtn = document.createElement('button');
      installBtn.className = 'plugin-action-btn';
      installBtn.dataset.action = 'install';
      installBtn.dataset.plugin = plugin.name;
      installBtn.disabled = isActive;
      installBtn.style.cssText = 'flex:1;padding:8px 12px;background:var(--accent);color:var(--surface);border:none;border-radius:6px;cursor:pointer;font-weight:500;font-size:13px;display:flex;align-items:center;justify-content:center;gap:6px;transition:opacity 0.15s;';
      installBtn.innerHTML = isActive ? `${SPINNER} Installing...` : `${DOWNLOAD_ICON} Install`;
      actionsDiv.appendChild(installBtn);
    } else if (hasUpdate) {
      const updateBtn = document.createElement('button');
      updateBtn.className = 'plugin-action-btn';
      updateBtn.dataset.action = 'update';
      updateBtn.dataset.plugin = plugin.name;
      updateBtn.disabled = isActive;
      updateBtn.style.cssText = 'flex:1;padding:8px 12px;background:var(--accent);color:var(--surface);border:none;border-radius:6px;cursor:pointer;font-weight:500;font-size:13px;display:flex;align-items:center;justify-content:center;gap:6px;transition:opacity 0.15s;';
      updateBtn.innerHTML = isActive ? `${SPINNER} Updating...` : `${UPDATE_ICON} Update`;
      actionsDiv.appendChild(updateBtn);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'plugin-action-btn';
      removeBtn.dataset.action = 'remove';
      removeBtn.dataset.plugin = plugin.name;
      removeBtn.disabled = isActive;
      removeBtn.style.cssText = 'padding:8px 12px;background:transparent;color:var(--error);border:1px solid var(--error);border-radius:6px;cursor:pointer;font-weight:500;font-size:13px;display:flex;align-items:center;justify-content:center;gap:6px;transition:opacity 0.15s;';
      removeBtn.innerHTML = `${TRASH_ICON} Remove`;
      actionsDiv.appendChild(removeBtn);
    } else {
      const installedBadge = document.createElement('div');
      installedBadge.style.cssText = 'flex:1;padding:8px 12px;background:transparent;color:var(--accent);border:1px solid var(--accent);border-radius:6px;font-weight:500;font-size:13px;display:flex;align-items:center;justify-content:center;gap:6px;';
      installedBadge.innerHTML = `${CHECK_ICON} Installed`;
      actionsDiv.appendChild(installedBadge);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'plugin-action-btn';
      removeBtn.dataset.action = 'remove';
      removeBtn.dataset.plugin = plugin.name;
      removeBtn.disabled = isActive;
      removeBtn.style.cssText = 'padding:8px 12px;background:transparent;color:var(--error);border:1px solid var(--error);border-radius:6px;cursor:pointer;font-weight:500;font-size:13px;display:flex;align-items:center;justify-content:center;gap:6px;transition:opacity 0.15s;';
      removeBtn.innerHTML = `${TRASH_ICON} Remove`;
      actionsDiv.appendChild(removeBtn);
    }

    card.append(headerRow, tagsDiv, actionsDiv);
    return card;
  }

  private compareVersions(a: string, b: string): number {
    const pa = a.split('.').map(Number);
    const pb = b.split('.').map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const na = pa[i] || 0;
      const nb = pb[i] || 0;
      if (na > nb) return 1;
      if (na < nb) return -1;
    }
    return 0;
  }

  private async handleAction(action: string, pluginName: string): Promise<void> {
    const plugin = this.remotePlugins.find(p => p.name === pluginName);
    if (!plugin) return;

    if (action === 'remove') {
      const confirmed = await this.confirmRemove(plugin.name);
      if (!confirmed) return;
    }

    this.activeActions.add(pluginName);

    if (this.currentDetail === pluginName) {
      this.renderPlugins();
      this.showDetail(pluginName);
    } else {
      this.renderPlugins();
    }

    try {
      switch (action) {
        case 'install':
          await this.installPlugin(plugin);
          break;
        case 'update':
          await this.installPlugin(plugin);
          break;
        case 'remove':
          await this.removePlugin(plugin);
          break;
      }
    } catch (e) {
      toast.show(`Failed to ${action} plugin: ${e instanceof Error ? e.message : 'Unknown error'}`, 'error');
    } finally {
      this.activeActions.delete(pluginName);
      await this.loadPlugins();
      if (this.currentDetail === pluginName) {
        this.showDetail(pluginName);
      }
    }
  }

  private async handleToggle(pluginName: string): Promise<void> {
    const local = this.localPlugins.get(pluginName);
    if (!local) return;
    try {
      await serviceBindings.SetPluginEnabled(pluginName, !local.enabled);
      await serviceBindings.ReloadPlugins();
      toast.show(`${pluginName} ${local.enabled ? 'disabled' : 'enabled'}`, 'success');
      await this.loadPlugins();
      if (this.currentDetail === pluginName) {
        this.showDetail(pluginName);
      }
      this.onPluginsChanged?.();
    } catch (e) {
      toast.show(`Failed to toggle plugin: ${e instanceof Error ? e.message : 'Unknown error'}`, 'error');
    }
  }

  private confirmRemove(name: string): Promise<boolean> {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;z-index:2000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);';

      const dialog = document.createElement('div');
      dialog.style.cssText = 'background:var(--surface-secondary);border:1px solid var(--border);border-radius:12px;padding:24px;max-width:360px;width:90%;';

      const title = document.createElement('div');
      title.style.cssText = 'font-size:16px;font-weight:600;color:var(--text);margin-bottom:8px;';
      title.textContent = 'Remove Plugin';

      const msg = document.createElement('div');
      msg.style.cssText = 'font-size:13px;color:var(--text-muted);margin-bottom:20px;line-height:1.5;';
      msg.textContent = `Are you sure you want to remove "${name}"? This will delete the plugin from your system.`;

      const btns = document.createElement('div');
      btns.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;';

      const cancelBtn = document.createElement('button');
      cancelBtn.textContent = 'Cancel';
      cancelBtn.style.cssText = 'padding:8px 16px;background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:6px;cursor:pointer;font-size:13px;';

      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Remove';
      removeBtn.style.cssText = 'padding:8px 16px;background:var(--error);color:white;border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:500;';

      cancelBtn.addEventListener('click', () => { overlay.remove(); resolve(false); });
      removeBtn.addEventListener('click', () => { overlay.remove(); resolve(true); });
      overlay.addEventListener('click', (e) => { if (e.target === overlay) { overlay.remove(); resolve(false); } });

      btns.append(cancelBtn, removeBtn);
      dialog.append(title, msg, btns);
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);
    });
  }

  private async installPlugin(plugin: RemotePlugin): Promise<void> {
    toast.show(`Installing ${plugin.name}...`, 'info');

    const pluginJsonUrl = `${PLUGINS_REPO_URL}/plugins/${plugin.directory}/plugin.json`;
    const response = await fetch(pluginJsonUrl);
    if (!response.ok) throw new Error('Failed to download plugin');

    const manifest = await response.json();
    const pluginsDir = await serviceBindings.GetPluginsDir();

    await serviceBindings.InstallPlugin(pluginsDir, plugin.directory, JSON.stringify(manifest));

    toast.show(`${plugin.name} installed successfully`, 'success');
    this.onPluginsChanged?.();
  }

  private async removePlugin(plugin: RemotePlugin): Promise<void> {
    toast.show(`Removing ${plugin.name}...`, 'info');
    const pluginsDir = await serviceBindings.GetPluginsDir();
    await serviceBindings.RemovePlugin(pluginsDir, plugin.directory);
    toast.show(`${plugin.name} removed`, 'success');
    this.onPluginsChanged?.();
  }
}
