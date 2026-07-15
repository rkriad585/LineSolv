import type {SettingsStore, SettingsState} from '../stores/settings';
import * as serviceBindings from '../../wailsjs/go/service/AppService';
import {toast} from '../utils/toast';
import {EventsOn} from '../../wailsjs/runtime/runtime';

interface CustomSelect {
  el: HTMLElement;
  value: string;
  options: string[];
  addEventListener(type: 'change', fn: () => void): void;
}

import {ALL_SHORTCUTS} from '../utils/shortcutDefs';

const APP_REPO = 'https://github.com/rkriad585/LineSolv';

const CHECK_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

const THEMES = [
  {id: 'dark',       label: 'Dark',       bg: '#18181b', accent: '#a78bfa', text: '#f4f4f5'},
  {id: 'light',      label: 'Light',     bg: '#fafafa', accent: '#7c3aed', text: '#18181b'},
  {id: 'neon',       label: 'Neon',       bg: '#0a0a0a', accent: '#00ff41', text: '#e0e0e0'},
  {id: 'red',        label: 'Red',        bg: '#1a0a0a', accent: '#e53935', text: '#f0e0e0'},
  {id: 'obsidian',   label: 'Obsidian',  bg: '#0d0d0d', accent: '#d4a043', text: '#d4c5a9'},
  {id: 'plasma',     label: 'Plasma',    bg: '#0d0d1a', accent: '#bb86fc', text: '#e0dff0'},
  {id: 'blood',      label: 'Blood',      bg: '#0a0505', accent: '#b71c1c', text: '#e8d0d0'},
  {id: 'midnight',   label: 'Midnight',   bg: '#0f172a', accent: '#38bdf8', text: '#f1f5f9'},
  {id: 'aurora',     label: 'Aurora',     bg: '#0c0a1a', accent: '#22d3ee', text: '#e8e0ff'},
  {id: 'mono',       label: 'Mono',       bg: '#000000', accent: '#ffffff', text: '#ffffff'},
  {id: 'frost',      label: 'Frost',      bg: '#0a1628', accent: '#60a5fa', text: '#e0ecff'},
  {id: 'prism',      label: 'Prism',      bg: '#1a0a28', accent: '#c084fc', text: '#f0e8ff'},
  {id: 'lavender',   label: 'Lavender',   bg: '#1a1528', accent: '#a78bfa', text: '#eee8ff'},
  {id: 'sage',       label: 'Sage',       bg: '#0f1a14', accent: '#34d399', text: '#e8f5ec'},
  {id: 'warm-light', label: 'Warm Light', bg: '#1a1510', accent: '#fbbf24', text: '#f5efe8'},
];

const STYLES = [
  {id: 'default',   label: 'Default',   desc: 'Flat, clean, minimal',        radius: '8px',  shadow: 'none'},
  {id: 'nothing',   label: 'Nothing',   desc: 'Monochrome, industrial, Swiss', radius: '4px',  shadow: 'none'},
  {id: 'glass',     label: 'Liquid Glass', desc: 'Frosted glass, translucent', radius: '16px', shadow: '0 4px 16px rgba(0,0,0,0.15)'},
  {id: 'material',  label: 'Material 3', desc: 'Rounded, tinted, elevation', radius: '12px', shadow: '0 2px 6px rgba(0,0,0,0.15)'},
  {id: 'alivated',  label: 'Alivated',  desc: 'Soft, warm, neumorphic',      radius: '16px', shadow: '4px 4px 12px rgba(0,0,0,0.15), -4px -4px 12px rgba(255,255,255,0.04)'},
  {id: 'neon',      label: 'Neon',      desc: 'Cyberpunk, glowing borders',  radius: '4px',  shadow: '0 0 8px var(--accent)'},
];

const STYLE_THEME_DEFAULTS: Record<string, string> = {
  'default':  'dark',
  'nothing':  'mono',
  'glass':    'dark',
  'material': 'midnight',
  'alivated': 'warm-light',
  'neon':     'neon',
};

const EDIT_ICON = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>';

const CLOSE_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

const SETTINGS_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--accent)"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';

const LOGO_SVG = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--accent)"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="10" y1="9" x2="14" y2="9"/><line x1="10" y1="15" x2="14" y2="15"/></svg>';

function keyEventToCombo(e: KeyboardEvent): string {
  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('Ctrl/Cmd');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey && !['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) parts.push('Shift');
  const key = e.key === ' ' ? 'Space' : e.key;
  if (!['Control', 'Shift', 'Alt', 'Meta'].includes(key)) parts.push(key);
  return parts.join(' + ');
}

export class SettingsModal {
  readonly el: HTMLDivElement;
  private tabsEl: HTMLDivElement;
  private contentEl: HTMLDivElement;
  private headerTitleEl: HTMLDivElement;
  private isVisible = false;

  private tabButtons = new Map<string, HTMLButtonElement>();
  private tabPanels: HTMLDivElement[] = [];
  private activeTab: string | null = null;
  private onApply: (s: Partial<SettingsState>) => void;
  private settingsStore: SettingsStore;

  private selectedTheme: string;
  private selectedStyle: string;

  private fontSizeInput!: HTMLInputElement;
  private fontSizeValueEl!: HTMLSpanElement;
  private fontFamilySelect!: CustomSelect;
  private fontSelectDocClick: ((e: MouseEvent) => void) | null = null;
  private previewEl!: HTMLDivElement;
  private updateStatusEl!: HTMLDivElement;
  private updateProgressEl!: HTMLDivElement;
  private updateProgressBarEl!: HTMLDivElement;
  private checkBtn!: HTMLButtonElement;
  private overrides: Record<string, string> = {};
  private shortcutKbds: Map<string, HTMLElement> = new Map();
  private opacityInput!: HTMLInputElement;
  private opacityValueEl!: HTMLSpanElement;
  private animationsToggle!: HTMLInputElement;
  private animationsTrack!: HTMLDivElement;
  private animationsThumb!: HTMLDivElement;
  private toastToggle!: HTMLInputElement;
  private toastTrack!: HTMLDivElement;
  private toastThumb!: HTMLDivElement;
  private autocompleteToggle!: HTMLInputElement;
  private autocompleteTrack!: HTMLDivElement;
  private autocompleteThumb!: HTMLDivElement;
  private lineNumbersToggle!: HTMLInputElement;
  private lineNumbersTrack!: HTMLDivElement;
  private lineNumbersThumb!: HTMLDivElement;

  constructor(initialTheme: string, settingsStore: SettingsStore) {
    this.selectedTheme = initialTheme;
    this.selectedStyle = 'default';
    this.settingsStore = settingsStore;
    this.onApply = (partial: Partial<SettingsState>) => {
      settingsStore.update(partial);
    };

    this.el = document.createElement('div');
    this.el.id = 'settings-modal';
    this.el.className = 'lsv-modal-overlay';
    this.el.style.cssText =
      'position:fixed;inset:0;z-index:1000;display:flex;flex-direction:column;' +
      'background:var(--surface);';

    const header = document.createElement('div');
    header.style.cssText =
      'display:flex;align-items:center;justify-content:space-between;padding:12px 16px;' +
      'background:var(--surface-secondary);border-bottom:1px solid var(--border);--wails-draggable:drag;';

    this.headerTitleEl = document.createElement('div');
    this.headerTitleEl.style.cssText = 'display:flex;align-items:center;gap:8px;color:var(--text);font-weight:600;--wails-draggable:drag;';
    this.headerTitleEl.innerHTML = `${SETTINGS_ICON}<span>Settings</span>`;

    const headerActions = document.createElement('div');
    headerActions.style.cssText = 'display:flex;align-items:center;gap:8px;--wails-draggable:no-drag;';

    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Reset';
    resetBtn.title = 'Reset all settings to defaults';
    resetBtn.style.cssText =
      'padding:5px 12px;border:1px solid var(--border);border-radius:6px;font-size:12px;font-weight:500;cursor:pointer;' +
      'background:transparent;color:var(--text-muted);transition:all 0.15s;';
    resetBtn.addEventListener('mouseenter', () => { resetBtn.style.borderColor = 'var(--accent)'; resetBtn.style.color = 'var(--text)'; });
    resetBtn.addEventListener('mouseleave', () => { resetBtn.style.borderColor = 'var(--border)'; resetBtn.style.color = 'var(--text-muted)'; });
    resetBtn.addEventListener('click', () => this.resetToDefaults());

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = CLOSE_ICON;
    closeBtn.title = 'Close (Esc)';
    closeBtn.style.cssText =
      'display:flex;align-items:center;justify-content:center;width:28px;height:28px;' +
      'border:none;border-radius:6px;background:transparent;color:var(--text-muted);cursor:pointer;outline:none;' +
      'transition:background 0.15s;';
    closeBtn.addEventListener('mouseenter', () => { closeBtn.style.background = 'var(--surface-hover)'; });
    closeBtn.addEventListener('mouseleave', () => { closeBtn.style.background = 'transparent'; });
    closeBtn.addEventListener('click', () => this.close());

    headerActions.append(resetBtn, closeBtn);
    header.append(this.headerTitleEl, headerActions);

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

    body.append(this.tabsEl, this.contentEl);
    this.el.append(header, body);

    this.buildTabs();
    this.buildPanels();

    document.body.appendChild(this.el);

    document.addEventListener('keydown', this.handleKeydown);
  }

  private handleKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this.isVisible) {
      this.close();
    }
  };

  private buildTabs(): void {
    this.tabsEl.innerHTML = '';
    this.tabButtons.clear();

    const tabs = ['General', 'Theme', 'UI Style', 'Keyboard Shortcuts', 'About'];
    for (const name of tabs) {
      const btn = document.createElement('button');
      btn.textContent = name;
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
      btn.addEventListener('click', () => this.switchTab(name));
      this.tabsEl.appendChild(btn);
      this.tabButtons.set(name, btn);
    }
  }

  private buildPanels(): void {
    this.contentEl.innerHTML = '';
    this.tabPanels = [];

    const generalPanel = document.createElement('div');
    this.buildGeneral(generalPanel);
    this.tabPanels.push(generalPanel);
    this.contentEl.appendChild(generalPanel);

    const themePanel = document.createElement('div');
    themePanel.style.display = 'none';
    this.buildTheme(themePanel);
    this.tabPanels.push(themePanel);
    this.contentEl.appendChild(themePanel);

    const uiStylePanel = document.createElement('div');
    uiStylePanel.style.display = 'none';
    this.buildUiStyle(uiStylePanel);
    this.tabPanels.push(uiStylePanel);
    this.contentEl.appendChild(uiStylePanel);

    const shortcutsPanel = document.createElement('div');
    shortcutsPanel.style.display = 'none';
    this.buildShortcuts(shortcutsPanel);
    this.tabPanels.push(shortcutsPanel);
    this.contentEl.appendChild(shortcutsPanel);

    const aboutPanel = document.createElement('div');
    aboutPanel.style.display = 'none';
    this.buildAbout(aboutPanel);
    this.tabPanels.push(aboutPanel);
    this.contentEl.appendChild(aboutPanel);
  }

  private switchTab(name: string): void {
    this.activeTab = name;
    const tabNames = ['General', 'Theme', 'UI Style', 'Keyboard Shortcuts', 'About'];
    const idx = tabNames.indexOf(name);

    for (const [n, btn] of this.tabButtons) {
      if (n === name) {
        btn.style.background = 'var(--accent)';
        btn.style.color = 'var(--surface)';
      } else {
        btn.style.background = 'transparent';
        btn.style.color = 'var(--text-muted)';
      }
    }
    this.tabPanels.forEach((p, i) => {
      p.style.display = i === idx ? 'block' : 'none';
    });
  }

  private styledFontSelect(fonts: Array<{ group: string; value: string; label: string }>): CustomSelect {
    const container = document.createElement('div');
    container.style.cssText = 'position:relative;max-width:240px;';

    const display = document.createElement('div');
    display.tabIndex = 0;
    display.style.cssText =
      'padding:6px 10px;border:1px solid var(--border);border-radius:6px;' +
      'background:var(--surface-secondary);color:var(--text);font-size:13px;' +
      'cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:6px;' +
      'outline:none;user-select:none;transition:border-color .15s;';

    const label = document.createElement('span');
    label.style.cssText = 'flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';

    const arrow = document.createElement('span');
    arrow.innerHTML =
      '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>';
    arrow.style.cssText = 'display:flex;color:var(--text-muted);flex-shrink:0;';

    display.append(label, arrow);

    const panel = document.createElement('div');
    panel.style.cssText =
      'display:none;position:absolute;top:100%;left:0;right:0;z-index:100;max-height:320px;overflow-y:auto;' +
      'margin-top:2px;border:1px solid var(--border);border-radius:6px;' +
      'background:var(--surface);box-shadow:0 8px 24px rgba(0,0,0,0.3);';

    let currentIndex = 0;
    const changeCallbacks: Array<() => void> = [];

    const closePanel = () => {
      panel.style.display = 'none';
      display.style.borderColor = 'var(--border)';
    };
    const openPanel = () => {
      panel.style.display = 'block';
      display.style.borderColor = 'var(--accent)';
    };

    let lastGroup = '';
    fonts.forEach((f, idx) => {
      if (f.group !== lastGroup) {
        lastGroup = f.group;
        const header = document.createElement('div');
        header.textContent = f.group;
        header.style.cssText =
          'font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;' +
          'color:var(--text-muted);padding:8px 10px 3px;user-select:none;' +
          (panel.children.length > 0 ? 'border-top:1px solid var(--border);margin-top:2px;' : '');
        panel.appendChild(header);
      }

      const item = document.createElement('div');
      item.textContent = f.label;
      item.style.cssText =
        'padding:5px 10px;font-size:13px;color:var(--text);cursor:pointer;transition:background .1s;' +
        `font-family:${f.value};`;
      item.addEventListener('mouseenter', () => { item.style.background = 'var(--surface-hover)'; });
      item.addEventListener('mouseleave', () => { item.style.background = 'transparent'; });
      item.addEventListener('click', () => {
        currentIndex = idx;
        label.textContent = f.label;
        label.style.fontFamily = f.value;
        closePanel();
        changeCallbacks.forEach(fn => fn());
      });
      panel.appendChild(item);
    });

    display.addEventListener('click', (e) => {
      e.stopPropagation();
      if (panel.style.display === 'none') openPanel();
      else closePanel();
    });
    display.addEventListener('focus', () => {
      if (panel.style.display === 'none') display.style.borderColor = 'var(--accent)';
    });
    display.addEventListener('blur', () => {
      if (panel.style.display === 'none') display.style.borderColor = 'var(--border)';
    });

    const docClick = (e: MouseEvent) => {
      if (!container.contains(e.target as Node)) closePanel();
    };
    document.addEventListener('click', docClick);
    this.fontSelectDocClick = docClick;

    label.textContent = fonts[0].label;
    label.style.fontFamily = fonts[0].value;
    container.append(display, panel);

    return {
      el: container,
      get value() { return fonts[currentIndex].value; },
      set value(v: string) {
        const idx = fonts.findIndex(f => f.value === v);
        if (idx >= 0) {
          currentIndex = idx;
          label.textContent = fonts[idx].label;
          label.style.fontFamily = fonts[idx].value;
        }
      },
      options: fonts.map(f => f.value),
      addEventListener(type: string, fn: () => void) {
        if (type === 'change') changeCallbacks.push(fn);
      },
    };
  }

  private fieldRow(label: string, makeCtrl: () => HTMLElement): HTMLDivElement {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:9px 0;';

    const lbl = document.createElement('span');
    lbl.textContent = label;
    lbl.style.cssText = 'font-size:13px;color:var(--text);user-select:none;';

    row.append(lbl, makeCtrl());
    return row;
  }

  private toggleRow(label: string, desc: string, checked: boolean): { el: HTMLDivElement; toggle: HTMLInputElement; track: HTMLDivElement; thumb: HTMLDivElement } {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:9px 0;';

    const left = document.createElement('div');
    left.style.cssText = 'display:flex;flex-direction:column;gap:1px;';
    const lbl = document.createElement('span');
    lbl.textContent = label;
    lbl.style.cssText = 'font-size:13px;color:var(--text);user-select:none;';
    const sub = document.createElement('span');
    sub.textContent = desc;
    sub.style.cssText = 'font-size:11px;color:var(--text-muted);user-select:none;';
    left.append(lbl, sub);

    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.checked = checked;
    toggle.style.cssText = 'display:none;';

    const track = document.createElement('div');
    track.style.cssText =
      `width:36px;height:20px;border-radius:10px;cursor:pointer;position:relative;transition:background .2s;` +
      (checked ? 'background:var(--accent);' : 'background:var(--border);');
    const thumb = document.createElement('div');
    thumb.style.cssText =
      `width:16px;height:16px;border-radius:50%;background:#fff;position:absolute;top:2px;` +
      `transition:left .2s;${checked ? 'left:18px;' : 'left:2px;'}`;
    track.append(thumb);

    track.addEventListener('click', () => {
      toggle.checked = !toggle.checked;
      track.style.background = toggle.checked ? 'var(--accent)' : 'var(--border)';
      thumb.style.left = toggle.checked ? '18px' : '2px';
      toggle.dispatchEvent(new Event('change'));
    });

    row.append(left, track);
    return { el: row, toggle, track, thumb };
  }

  private updateToggleVisual(toggle: HTMLInputElement, track: HTMLDivElement, thumb: HTMLDivElement): void {
    track.style.background = toggle.checked ? 'var(--accent)' : 'var(--border)';
    thumb.style.left = toggle.checked ? '18px' : '2px';
  }

  private sectionHeader(text: string): HTMLDivElement {
    const h = document.createElement('div');
    h.textContent = text;
    h.style.cssText =
      'font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;' +
      'color:var(--text-muted);padding:12px 0 4px;border-top:1px solid var(--border);user-select:none;';
    return h;
  }

  private buildGeneral(panel: HTMLDivElement): void {
    panel.style.cssText = 'display:flex;flex-direction:column;gap:2px;';

    // --- Calculator section ---
    panel.appendChild(this.sectionHeader('Calculator'));

    const familyRow = this.fieldRow('Font Family', () => {
      const fonts = [
        { group: 'Sans-Serif', value: '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif', label: 'System Default' },
        { group: 'Sans-Serif', value: 'Inter, sans-serif', label: 'Inter' },
        { group: 'Sans-Serif', value: 'Overpass, sans-serif', label: 'Overpass' },
        { group: 'Sans-Serif', value: 'Ubuntu, sans-serif', label: 'Ubuntu' },
        { group: 'Serif', value: 'Georgia, serif', label: 'Georgia' },
        { group: 'Serif', value: '\'Times New Roman\', serif', label: 'Times New Roman' },
        { group: 'Serif', value: '\'Playfair Display\', serif', label: 'Playfair Display' },
        { group: 'Monospace', value: 'monospace', label: 'System Mono' },
        { group: 'Monospace', value: '\'JetBrains Mono\', monospace', label: 'JetBrains Mono' },
        { group: 'Monospace', value: '\'Fira Code\', monospace', label: 'Fira Code' },
        { group: 'Monospace', value: '\'Source Code Pro\', monospace', label: 'Source Code Pro' },
        { group: 'Monospace', value: '\'IBM Plex Mono\', monospace', label: 'IBM Plex Mono' },
        { group: 'Monospace', value: '\'Cascadia Code\', monospace', label: 'Cascadia Code' },
        { group: 'Monospace', value: '\'Hack\', monospace', label: 'Hack' },
        { group: 'Monospace', value: '\'Victor Mono\', monospace', label: 'Victor Mono' },
        { group: 'Monospace', value: '\'Space Mono\', monospace', label: 'Space Mono' },
        { group: 'Monospace', value: '\'Courier New\', monospace', label: 'Courier New' },
      ];
      const sel = this.styledFontSelect(fonts);
      this.fontFamilySelect = sel;
      sel.addEventListener('change', () => this.updatePreview());
      return sel.el;
    });

    const sizeRow = document.createElement('div');
    sizeRow.style.cssText = 'padding:9px 0;';

    const sizeTop = document.createElement('div');
    sizeTop.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;';

    const sizeLabel = document.createElement('span');
    sizeLabel.textContent = 'Font Size';
    sizeLabel.style.cssText = 'font-size:13px;color:var(--text);user-select:none;';

    const sizeValue = document.createElement('span');
    this.fontSizeValueEl = sizeValue;
    sizeValue.style.cssText = 'font-size:12px;color:var(--text-muted);min-width:28px;text-align:right;';
    sizeTop.append(sizeLabel, sizeValue);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '10';
    slider.max = '32';
    slider.step = '1';
    slider.value = '16';
    slider.style.cssText = 'width:100%;accent-color:var(--accent);cursor:pointer;margin:0;';
    this.fontSizeInput = slider as unknown as HTMLInputElement;
    slider.addEventListener('input', () => {
      sizeValue.textContent = slider.value + 'px';
      this.updatePreview();
    });

    const presets = document.createElement('div');
    presets.style.cssText = 'display:flex;gap:6px;margin-top:8px;';
    const sizes = [
      { label: 'S', value: '12' },
      { label: 'M', value: '16' },
      { label: 'L', value: '20' },
      { label: 'XL', value: '24' },
    ];
    for (const s of sizes) {
      const chip = document.createElement('button');
      chip.textContent = s.label;
      chip.style.cssText =
        'padding:3px 10px;border:1px solid var(--border);border-radius:4px;background:transparent;' +
        'color:var(--text-muted);font-size:11px;font-weight:500;cursor:pointer;transition:all .15s;';
      chip.addEventListener('mouseenter', () => { chip.style.borderColor = 'var(--accent)'; chip.style.color = 'var(--text)'; });
      chip.addEventListener('mouseleave', () => { chip.style.borderColor = 'var(--border)'; chip.style.color = 'var(--text-muted)'; });
      chip.addEventListener('click', () => {
        slider.value = s.value;
        sizeValue.textContent = s.value + 'px';
        this.updatePreview();
      });
      presets.appendChild(chip);
    }

    sizeValue.textContent = slider.value + 'px';
    sizeRow.append(sizeTop, slider, presets);

    const autocompleteRow = this.toggleRow(
      'Autocomplete',
      'Show keyword suggestions as you type',
      true,
    );
    this.autocompleteToggle = autocompleteRow.toggle;
    this.autocompleteTrack = autocompleteRow.track;
    this.autocompleteThumb = autocompleteRow.thumb;

    panel.append(familyRow, sizeRow, autocompleteRow.el);

    // --- Appearance section ---
    panel.appendChild(this.sectionHeader('Appearance'));

    const opacityRow = document.createElement('div');
    opacityRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:9px 0;';
    const opacityLeft = document.createElement('div');
    opacityLeft.style.cssText = 'display:flex;flex-direction:column;gap:1px;';
    const opacityLabel = document.createElement('span');
    opacityLabel.textContent = 'Opacity';
    opacityLabel.style.cssText = 'font-size:13px;color:var(--text);user-select:none;';
    const opacityDesc = document.createElement('span');
    opacityDesc.textContent = 'Window transparency level';
    opacityDesc.style.cssText = 'font-size:11px;color:var(--text-muted);user-select:none;';
    opacityLeft.append(opacityLabel, opacityDesc);
    const opacityRight = document.createElement('div');
    opacityRight.style.cssText = 'display:flex;align-items:center;gap:8px;';
    this.opacityInput = document.createElement('input');
    this.opacityInput.type = 'range';
    this.opacityInput.min = '0.3';
    this.opacityInput.max = '1';
    this.opacityInput.step = '0.05';
    this.opacityInput.value = '0.95';
    this.opacityInput.style.cssText =
      'width:100px;accent-color:var(--accent);cursor:pointer;';
    this.opacityValueEl = document.createElement('span');
    this.opacityValueEl.textContent = '95%';
    this.opacityValueEl.style.cssText = 'font-size:12px;color:var(--text-muted);min-width:32px;text-align:right;';
    this.opacityInput.addEventListener('input', () => {
      this.opacityValueEl.textContent = Math.round(parseFloat(this.opacityInput.value) * 100) + '%';
    });
    opacityRight.append(this.opacityInput, this.opacityValueEl);
    opacityRow.append(opacityLeft, opacityRight);

    const animationsRow = this.toggleRow(
      'Animations',
      'Enable smooth transitions and effects',
      true,
    );
    this.animationsToggle = animationsRow.toggle;
    this.animationsTrack = animationsRow.track;
    this.animationsThumb = animationsRow.thumb;

    panel.append(opacityRow, animationsRow.el);

    // --- Behavior section ---
    panel.appendChild(this.sectionHeader('Behavior'));

    const lineNumbersRow = this.toggleRow(
      'Line Numbers',
      'Show line numbers in the editor gutter',
      true,
    );
    this.lineNumbersToggle = lineNumbersRow.toggle;
    this.lineNumbersTrack = lineNumbersRow.track;
    this.lineNumbersThumb = lineNumbersRow.thumb;

    const toastRow = this.toggleRow(
      'Toast Notifications',
      'Show success and error messages',
      true,
    );
    this.toastToggle = toastRow.toggle;
    this.toastTrack = toastRow.track;
    this.toastThumb = toastRow.thumb;

    panel.append(lineNumbersRow.el, toastRow.el);

    // --- Preview ---
    const previewSection = document.createElement('div');
    previewSection.style.cssText =
      'margin-top:14px;padding:12px 14px;border:1px solid var(--border);' +
      'border-radius:8px;background:var(--surface);';

    const previewLabel = document.createElement('div');
    previewLabel.textContent = 'Preview';
    previewLabel.style.cssText = 'font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--text-muted);margin-bottom:6px;user-select:none;';

    this.previewEl = document.createElement('div');
    this.previewEl.textContent = 'AaBbCc 123 \u2014 The quick brown fox jumps over the lazy dog.';
    this.previewEl.style.cssText = 'font-size:14px;font-family:monospace;color:var(--text);padding:4px 0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';

    previewSection.append(previewLabel, this.previewEl);
    panel.appendChild(previewSection);

    // --- Real-time apply: wire all controls ---
    this.autocompleteToggle.addEventListener('change', () => this.applyAll());
    this.lineNumbersToggle.addEventListener('change', () => this.applyAll());
    this.toastToggle.addEventListener('change', () => this.applyAll());
    this.animationsToggle.addEventListener('change', () => this.applyAll());
    this.opacityInput.addEventListener('input', () => this.applyAll());
    this.fontSizeInput.addEventListener('input', () => this.applyAll());
    this.fontFamilySelect.addEventListener('change', () => this.applyAll());
  }

  private buildTheme(panel: HTMLDivElement): void {
    panel.style.cssText = 'display:flex;flex-direction:column;gap:2px;';

    const note = document.createElement('p');
    note.textContent = 'Select a color theme for the app.';
    note.style.cssText = 'font-size:12px;color:var(--text-muted);margin:0 0 12px;user-select:none;';

    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;';

    const thumbnails: Map<string, HTMLDivElement> = new Map();

    const addThemeCard = (t: {id: string; label: string; bg: string; accent: string; text: string}, isPlugin = false) => {
      const card = document.createElement('div');
      card.tabIndex = 0;
      (card as ThemeCardElement).themeId = t.id;
      card.style.cssText =
        'border:2px solid var(--border);border-radius:8px;cursor:pointer;' +
        'overflow:hidden;transition:border-color .15s;outline:none;';
      card.addEventListener('mouseenter', () => {
        if (t.id !== this.selectedTheme) card.style.borderColor = 'var(--text-muted)';
      });
      card.addEventListener('mouseleave', () => {
        if (t.id !== this.selectedTheme) card.style.borderColor = 'var(--border)';
      });

      const swatch = document.createElement('div');
      swatch.style.cssText = 'height:48px;display:flex;align-items:center;justify-content:center;gap:6px;';
      swatch.style.background = t.bg;
      swatch.style.color = t.accent;

      const sampleText = document.createElement('span');
      sampleText.textContent = 'Aa';
      sampleText.style.cssText = 'font-size:16px;font-weight:700;';
      sampleText.style.color = t.accent;

      const sampleBody = document.createElement('span');
      sampleBody.textContent = '123';
      sampleBody.style.cssText = 'font-size:11px;opacity:0.7;';
      sampleBody.style.color = t.text;

      const check = document.createElement('span');
      check.innerHTML = CHECK_ICON;
      check.style.cssText = 'display:none;';
      check.style.color = t.accent;

      swatch.append(sampleText, sampleBody, check);

      const label = document.createElement('div');
      label.style.cssText =
        'padding:6px 10px;font-size:12px;font-weight:500;' +
        'background:var(--surface-secondary);color:var(--text);user-select:none;display:flex;align-items:center;justify-content:space-between;';
      const labelSpan = document.createElement('span');
      labelSpan.textContent = t.label;
      label.appendChild(labelSpan);
      if (isPlugin) {
        const badge = document.createElement('span');
        badge.textContent = 'Plugin';
        badge.style.cssText = 'font-size:10px;padding:1px 6px;border-radius:8px;background:var(--accent);color:var(--surface);font-weight:500;';
        label.appendChild(badge);
      }

      card.append(swatch, label);
      grid.appendChild(card);
      thumbnails.set(t.id, card);

      card.addEventListener('click', () => {
        this.selectedTheme = t.id;
        thumbnails.forEach((c, id) => {
          c.style.borderColor = id === t.id ? 'var(--accent)' : 'var(--border)';
          const chk = c.querySelector('span:last-child') as HTMLElement;
          if (chk) chk.style.display = id === t.id ? '' : 'none';
        });
        this.settingsStore.update({ theme_manually_set: true });
        this.applyAll();
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });
    };

    THEMES.forEach((t) => addThemeCard(t));

    requestAnimationFrame(() => {
      const initial = thumbnails.get(this.selectedTheme);
      if (initial) {
        initial.style.borderColor = 'var(--accent)';
        const chk = initial.querySelector('span:last-child') as HTMLElement;
        if (chk) chk.style.display = '';
      }
    });

    serviceBindings.GetPluginThemes().then((pluginThemes) => {
      if (pluginThemes && pluginThemes.length > 0) {
        for (const pt of pluginThemes) {
          const colors = pt.colors || {};
          addThemeCard({
            id: pt.id,
            label: pt.label,
            bg: colors['--surface'] || '#18181b',
            accent: colors['--accent'] || '#a78bfa',
            text: colors['--text'] || '#f4f4f5',
          }, true);
        }
        const initial = thumbnails.get(this.selectedTheme);
        if (initial) {
          initial.style.borderColor = 'var(--accent)';
          const chk = initial.querySelector('span:last-child') as HTMLElement;
          if (chk) chk.style.display = '';
        }
      }
    }).catch(() => {});

    panel.append(note, grid);
  }

  private buildUiStyle(panel: HTMLDivElement): void {
    panel.style.cssText = 'display:flex;flex-direction:column;gap:2px;';

    const note = document.createElement('p');
    note.textContent = 'Select a UI style. Controls shape, depth, and motion.';
    note.style.cssText = 'font-size:12px;color:var(--text-muted);margin:0 0 12px;user-select:none;';

    const grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:10px;';

    const styleCards = new Map<string, HTMLDivElement>();

    const addStyleCard = (s: {id: string; label: string; desc: string; radius: string; shadow: string}) => {
      const card = document.createElement('div');
      card.tabIndex = 0;
      (card as StyleCardElement).styleId = s.id;
      card.style.cssText =
        'border:2px solid var(--border);border-radius:8px;cursor:pointer;' +
        'overflow:hidden;transition:border-color .15s;outline:none;';
      card.addEventListener('mouseenter', () => {
        if (s.id !== this.selectedStyle) card.style.borderColor = 'var(--text-muted)';
      });
      card.addEventListener('mouseleave', () => {
        if (s.id !== this.selectedStyle) card.style.borderColor = 'var(--border)';
      });

      const preview = document.createElement('div');
      preview.style.cssText = 'height:56px;display:flex;align-items:center;justify-content:center;background:var(--surface-secondary);position:relative;';

      const sample = document.createElement('div');
      sample.style.cssText =
        `width:70%;padding:8px 12px;border-radius:${s.radius};background:var(--surface);` +
        `border:1px solid var(--border);box-shadow:${s.shadow};text-align:center;` +
        `font-size:12px;color:var(--text-muted);`;

      const check = document.createElement('span');
      check.innerHTML = CHECK_ICON;
      check.style.cssText = 'display:none;position:absolute;top:6px;right:6px;color:var(--accent);';
      preview.append(sample, check);

      const label = document.createElement('div');
      label.style.cssText =
        'padding:6px 10px;font-size:12px;font-weight:500;' +
        'background:var(--surface-secondary);color:var(--text);user-select:none;display:flex;flex-direction:column;gap:1px;';
      const labelName = document.createElement('span');
      labelName.textContent = s.label;
      const labelDesc = document.createElement('span');
      labelDesc.textContent = s.desc;
      labelDesc.style.cssText = 'font-size:10px;color:var(--text-muted);font-weight:400;';
      label.append(labelName, labelDesc);

      card.append(preview, label);
      grid.appendChild(card);
      styleCards.set(s.id, card);

      card.addEventListener('click', () => {
        this.selectedStyle = s.id;
        styleCards.forEach((c, id) => {
          c.style.borderColor = id === s.id ? 'var(--accent)' : 'var(--border)';
          const chk = c.querySelector('span:last-child') as HTMLElement;
          if (chk) chk.style.display = id === s.id ? '' : 'none';
        });
        if (!this.settingsStore.getState().theme_manually_set) {
          const defaultTheme = STYLE_THEME_DEFAULTS[s.id] || 'dark';
          if (this.selectedTheme !== defaultTheme) {
            this.selectedTheme = defaultTheme;
            this.settingsStore.update({ theme: defaultTheme });
          }
        }
        this.applyAll();
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          card.click();
        }
      });
    };

    STYLES.forEach((s) => addStyleCard(s));

    requestAnimationFrame(() => {
      const initial = styleCards.get(this.selectedStyle);
      if (initial) {
        initial.style.borderColor = 'var(--accent)';
        const chk = initial.querySelector('span:last-child') as HTMLElement;
        if (chk) chk.style.display = '';
      }
    });

    panel.append(note, grid);
  }

  private buildShortcuts(panel: HTMLDivElement): void {
    const note = document.createElement('p');
    note.textContent = 'Click a key binding or the edit button to customize it.';
    note.style.cssText = 'font-size:12px;color:var(--text-muted);margin:0 0 14px;user-select:none;';

    const table = document.createElement('div');
    table.style.cssText = 'display:flex;flex-direction:column;gap:1px;';

    ALL_SHORTCUTS.forEach((s) => {
      const row = document.createElement('div');
      row.style.cssText =
        'display:flex;align-items:center;justify-content:space-between;' +
        'padding:6px 10px;border-radius:6px;transition:background .1s;';
      row.addEventListener('mouseenter', () => { row.style.background = 'var(--surface-hover)'; });
      row.addEventListener('mouseleave', () => { row.style.background = ''; });

      const descEl = document.createElement('span');
      descEl.textContent = s.desc;
      descEl.style.cssText = 'font-size:13px;color:var(--text);flex:1;user-select:none;';

      const keyWrap = document.createElement('div');
      keyWrap.style.cssText = 'display:flex;align-items:center;gap:6px;';

      const kbd = document.createElement('kbd');
      kbd.textContent = s.keys;
      kbd.style.cssText =
        'font-family:inherit;font-size:12px;padding:2px 10px;' +
        'border-radius:4px;background:var(--surface-secondary);' +
        'color:var(--accent);white-space:nowrap;cursor:pointer;' +
        'transition:background .15s,color .15s;';
      this.shortcutKbds.set(s.id, kbd);

      const capInput = document.createElement('input');
      capInput.type = 'text';
      capInput.placeholder = 'Press keys...';
      capInput.readOnly = true;
      capInput.style.cssText =
        'display:none;width:120px;padding:2px 8px;font-size:12px;' +
        'border:1px solid var(--accent);border-radius:4px;' +
        'background:var(--surface);color:var(--accent);outline:none;';

      let editing = false;
      const beginEdit = () => {
        if (editing) return;
        editing = true;
        kbd.style.display = 'none';
        capInput.style.display = '';
        capInput.value = '';
        capInput.focus();
      };
      const endEdit = (combo: string) => {
        editing = false;
        capInput.style.display = 'none';
        kbd.style.display = '';
        if (combo) {
          this.overrides[s.id] = combo;
          kbd.textContent = combo;
        }
      };

      capInput.addEventListener('keydown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        endEdit(keyEventToCombo(e));
      });
      capInput.addEventListener('blur', () => {
        if (editing) endEdit('');
      });

      const editBtn = document.createElement('button');
      editBtn.title = 'Edit shortcut';
      editBtn.innerHTML = EDIT_ICON;
      editBtn.style.cssText =
        'display:flex;align-items:center;justify-content:center;width:24px;height:24px;' +
        'border:none;border-radius:4px;background:transparent;color:var(--text-muted);cursor:pointer;flex-shrink:0;' +
        'transition:background .15s;';
      editBtn.addEventListener('mouseenter', () => { editBtn.style.background = 'var(--surface-hover)'; editBtn.style.color = 'var(--text)'; });
      editBtn.addEventListener('mouseleave', () => { editBtn.style.background = 'transparent'; editBtn.style.color = 'var(--text-muted)'; });
      editBtn.addEventListener('click', beginEdit);
      kbd.addEventListener('click', beginEdit);

      keyWrap.append(kbd, capInput, editBtn);
      row.append(descEl, keyWrap);
      table.appendChild(row);
    });

    panel.append(note, table);
  }

  private buildAbout(panel: HTMLDivElement): void {
    const center = document.createElement('div');
    center.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;padding:18px 0;';

    const logo = document.createElement('div');
    logo.innerHTML = LOGO_SVG;

    const nameEl = document.createElement('div');
    nameEl.textContent = 'LineSolv';
    nameEl.style.cssText = 'font-size:18px;font-weight:700;color:var(--text);user-select:none;';

    const versionEl = document.createElement('div');
    versionEl.id = 'settings-version';
    versionEl.style.cssText = 'font-size:13px;color:var(--text-muted);user-select:none;';

    const divider = document.createElement('div');
    divider.style.cssText = 'width:60px;height:1px;background:var(--border);margin:6px 0;';

    const authorEl = document.createElement('div');
    authorEl.style.cssText = 'font-size:13px;color:var(--text-muted);user-select:none;';
    const authorLink = document.createElement('a');
    authorLink.href = '#';
    authorLink.textContent = 'rkriad585';
    authorLink.style.cssText = 'color:var(--accent);text-decoration:none;';
    authorLink.addEventListener('click', (e) => {
      e.preventDefault();
      try { window.runtime?.BrowserOpenURL('https://www.google.com/search?q=rkriad585'); } catch { /* ignored */ }
    });
    authorEl.append('Author: ', authorLink);

    const emailEl = document.createElement('div');
    emailEl.textContent = 'Email: rkriad585@gmail.com';
    emailEl.style.cssText = 'font-size:13px;color:var(--text-muted);user-select:none;';

    const repoEl = document.createElement('div');
    repoEl.style.cssText = 'font-size:13px;user-select:none;';
    const repoLink = document.createElement('a');
    repoLink.href = '#';
    repoLink.textContent = APP_REPO;
    repoLink.style.cssText = 'color:var(--accent);text-decoration:none;';
    repoLink.addEventListener('click', (e) => {
      e.preventDefault();
      try { window.runtime?.BrowserOpenURL(APP_REPO); } catch { /* ignored */ }
    });
    repoEl.appendChild(repoLink);

    const privacyEl = document.createElement('div');
    privacyEl.style.cssText = 'font-size:13px;user-select:none;';
    const privacyLink = document.createElement('a');
    privacyLink.href = '#';
    privacyLink.textContent = 'Privacy Policy';
    privacyLink.style.cssText = 'color:var(--accent);text-decoration:none;';
    privacyLink.addEventListener('click', (e) => {
      e.preventDefault();
      try { window.runtime?.BrowserOpenURL('https://github.com/rkriad585/LineSolv/blob/main/docs/privacy-policy.md'); } catch { /* ignored */ }
    });
    privacyEl.appendChild(privacyLink);

    const updateSection = document.createElement('div');
    updateSection.style.cssText = 'margin-top:10px;display:flex;flex-direction:column;align-items:center;gap:8px;width:100%;';

    this.checkBtn = document.createElement('button');
    this.checkBtn.textContent = 'Update';
    this.checkBtn.style.cssText =
      'padding:7px 18px;border:none;border-radius:6px;font-size:13px;font-weight:500;cursor:pointer;' +
      'background:var(--accent);color:#fff;transition:opacity .15s;';
    this.checkBtn.addEventListener('mouseenter', () => { this.checkBtn.style.opacity = '0.85'; });
    this.checkBtn.addEventListener('mouseleave', () => { this.checkBtn.style.opacity = '1'; });
    this.checkBtn.addEventListener('click', () => this.performUpdate());

    this.updateProgressEl = document.createElement('div');
    this.updateProgressEl.style.cssText = 'width:100%;max-width:260px;display:none;';

    this.updateProgressBarEl = document.createElement('div');
    this.updateProgressBarEl.style.cssText =
      'height:4px;border-radius:2px;background:var(--border);overflow:hidden;width:100%;';

    const progressFill = document.createElement('div');
    progressFill.style.cssText = 'height:100%;background:var(--accent);width:0%;transition:width 0.3s;';
    progressFill.id = 'update-progress-fill';
    this.updateProgressBarEl.appendChild(progressFill);
    this.updateProgressEl.appendChild(this.updateProgressBarEl);

    this.updateStatusEl = document.createElement('div');
    this.updateStatusEl.style.cssText = 'font-size:12px;color:var(--text-muted);text-align:center;user-select:none;';

    updateSection.append(this.checkBtn, this.updateProgressEl, this.updateStatusEl);
    center.append(logo, nameEl, versionEl, divider, authorEl, emailEl, repoEl, privacyEl, updateSection);
    panel.appendChild(center);
  }

  private updatePreview(): void {
    if (!this.previewEl) return;
    const size = this.fontSizeInput.value || '16';
    this.previewEl.style.fontSize = size + 'px';
    this.previewEl.style.fontFamily = this.fontFamilySelect.value;
  }

  private setProgress(percent: number): void {
    const fill = this.updateProgressBarEl.querySelector('#update-progress-fill') as HTMLElement;
    if (fill) {
      fill.style.width = percent + '%';
    }
  }

  private async performUpdate(): Promise<void> {
    this.checkBtn.disabled = true;
    this.checkBtn.textContent = 'Checking...';
    this.updateStatusEl.textContent = '';
    this.updateProgressEl.style.display = 'none';
    this.setProgress(0);

    const removeListener = EventsOn('update-progress', (data: {status: string; message: string}) => {
      this.updateStatusEl.textContent = data.message;
      this.updateProgressEl.style.display = 'block';

      switch (data.status) {
        case 'checking':
          this.setProgress(10);
          this.checkBtn.textContent = 'Checking...';
          break;
        case 'downloading':
          this.setProgress(50);
          this.checkBtn.textContent = 'Updating...';
          break;
        case 'restarting':
          this.setProgress(100);
          this.checkBtn.textContent = 'Restarting...';
          break;
      }
    });

    try {
      const info = await serviceBindings.PerformUpdate();

      if (!info.update_available) {
        this.updateStatusEl.innerHTML =
          `<span style="color:var(--text-muted)">\u2713 You're up to date (${info.current_version})</span>`;
        this.updateProgressEl.style.display = 'none';
        this.checkBtn.textContent = 'Update';
      } else {
        this.updateStatusEl.innerHTML =
          `<span style="color:var(--accent);font-weight:600">Updated to v${info.latest_version}! Restarting...</span>`;
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.updateStatusEl.innerHTML =
        `<span style="color:var(--text-muted)">Update failed: ${msg}</span>`;
      this.updateProgressEl.style.display = 'none';
      this.checkBtn.textContent = 'Update';
    } finally {
      removeListener();
      this.checkBtn.disabled = false;
    }
  }

  private async resetToDefaults(): Promise<void> {
    this.selectedTheme = 'dark';
    this.selectedStyle = 'default';
    this.fontSizeInput.value = '16';
    this.fontSizeValueEl.textContent = '16px';
    this.fontFamilySelect.value = '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif';
    this.opacityInput.value = '0.95';
    this.opacityValueEl.textContent = '95%';
    this.animationsToggle.checked = true;
    this.toastToggle.checked = true;
    this.autocompleteToggle.checked = true;
    this.lineNumbersToggle.checked = true;
    this.updateToggleVisual(this.animationsToggle, this.animationsTrack, this.animationsThumb);
    this.updateToggleVisual(this.toastToggle, this.toastTrack, this.toastThumb);
    this.updateToggleVisual(this.autocompleteToggle, this.autocompleteTrack, this.autocompleteThumb);
    this.updateToggleVisual(this.lineNumbersToggle, this.lineNumbersTrack, this.lineNumbersThumb);
    this.overrides = {};
    this.updatePreview();
    this.settingsStore.update({ theme_manually_set: false });

    // Update theme card highlights
    const thumbGrid = this.el.querySelector('div[style*="grid-template-columns:1fr 1fr"]');
    if (thumbGrid) {
      const cards = thumbGrid.children;
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i] as ThemeCardElement;
        const themeId = card.themeId || null;
        const isActive = themeId === 'dark';
        card.style.borderColor = isActive ? 'var(--accent)' : 'var(--border)';
        const chk = card.querySelector('span:last-child') as HTMLElement;
        if (chk) chk.style.display = isActive ? '' : 'none';
      }
    }

    // Update UI Style card highlights
    const styleGrids = this.el.querySelectorAll('div[style*="grid-template-columns:1fr 1fr"]');
    if (styleGrids.length > 1) {
      const styleCards = styleGrids[1].children;
      for (let i = 0; i < styleCards.length; i++) {
        const card = styleCards[i] as StyleCardElement;
        const styleId = card.styleId || null;
        const isActive = styleId === 'default';
        card.style.borderColor = isActive ? 'var(--accent)' : 'var(--border)';
        const chk = card.querySelector('span:last-child') as HTMLElement;
        if (chk) chk.style.display = isActive ? '' : 'none';
      }
    }

    // Update shortcut displays — restore default keys
    ALL_SHORTCUTS.forEach((s) => {
      const kbd = this.shortcutKbds.get(s.id);
      if (kbd) kbd.textContent = s.keys;
    });

    this.applyAll();
    toast.show('Settings reset to defaults', 'info');
  }

  private applyAll(): void {
    this.onApply({
      theme: this.selectedTheme,
      ui_style: this.selectedStyle,
      font_size: this.fontSizeInput.value,
      font_family: this.fontFamilySelect.value,
      shortcut_overrides: JSON.stringify(this.overrides),
      autocomplete_enabled: this.autocompleteToggle.checked,
      animations_enabled: this.animationsToggle.checked,
      toast_enabled: this.toastToggle.checked,
      opacity: parseFloat(this.opacityInput.value) || 0.95,
      line_numbers_enabled: this.lineNumbersToggle.checked,
    });
  }

  async open(tab?: string): Promise<void> {
    if (this.isVisible) return;
    this.isVisible = true;

    try {
      const state = this.settingsStore.getState();
      const version = await serviceBindings.GetAppVersion();

      try {
        const parsed = JSON.parse(state.shortcut_overrides || '{}');
        if (typeof parsed === 'object' && !Array.isArray(parsed)) {
          this.overrides = parsed;
        } else {
          this.overrides = {};
        }
      } catch { this.overrides = {}; }

      this.selectedTheme = state.theme || 'dark';
      this.selectedStyle = state.ui_style || 'default';
      this.fontSizeInput.value = state.font_size || '16';
      this.fontSizeValueEl.textContent = (state.font_size || '16') + 'px';
      const fontFamily = state.font_family || '';
      if (this.fontFamilySelect.options.some(o => o === fontFamily)) {
        this.fontFamilySelect.value = fontFamily;
      }
      this.updatePreview();

      // Populate new controls
      const opacity = state.opacity || 0.95;
      this.opacityInput.value = String(opacity);
      this.opacityValueEl.textContent = Math.round(opacity * 100) + '%';
      this.animationsToggle.checked = state.animations_enabled;
      this.toastToggle.checked = state.toast_enabled;
      this.autocompleteToggle.checked = state.autocomplete_enabled;
      this.lineNumbersToggle.checked = state.line_numbers_enabled;

      const thumbGrid = this.el.querySelector('div[style*="grid-template-columns:1fr 1fr"]');
      if (thumbGrid) {
        const cards = thumbGrid.children;
        for (let i = 0; i < cards.length; i++) {
          const card = cards[i] as ThemeCardElement;
          const themeId = card.themeId || null;
          const isActive = themeId === this.selectedTheme;
          card.style.borderColor = isActive ? 'var(--accent)' : 'var(--border)';
          const chk = card.querySelector('span:last-child') as HTMLElement;
          if (chk) chk.style.display = isActive ? '' : 'none';
        }
      }

      // Update UI Style card highlights
      const styleGrids = this.el.querySelectorAll('div[style*="grid-template-columns:1fr 1fr"]');
      if (styleGrids.length > 1) {
        const styleCards = styleGrids[1].children;
        for (let i = 0; i < styleCards.length; i++) {
          const card = styleCards[i] as StyleCardElement;
          const styleId = card.styleId || null;
          const isActive = styleId === this.selectedStyle;
          card.style.borderColor = isActive ? 'var(--accent)' : 'var(--border)';
          const chk = card.querySelector('span:last-child') as HTMLElement;
          if (chk) chk.style.display = isActive ? '' : 'none';
        }
      }

      const verEl = this.el.querySelector('#settings-version');
      if (verEl) verEl.textContent = `Version ${version}`;

      this.shortcutKbds.forEach((kbd, id) => {
        if (this.overrides[id]) kbd.textContent = this.overrides[id];
      });
    } catch {
      toast.show('Failed to load settings', 'error');
    }

    this.el.classList.add('lsv-modal-open');
    if (this.fontSelectDocClick) {
      document.addEventListener('click', this.fontSelectDocClick);
    }
    this.switchTab(tab || 'General');
  }

  close(): void {
    if (!this.isVisible) return;
    this.isVisible = false;
    this.el.classList.remove('lsv-modal-open');
    if (this.fontSelectDocClick) {
      document.removeEventListener('click', this.fontSelectDocClick);
    }
  }

  isOpen(): boolean {
    return this.isVisible;
  }

  destroy(): void {
    document.removeEventListener('keydown', this.handleKeydown);
    if (this.fontSelectDocClick) {
      document.removeEventListener('click', this.fontSelectDocClick);
    }
    if (this.el.parentElement) this.el.parentElement.removeChild(this.el);
  }
}
