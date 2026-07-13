import type {SettingsData} from '../types';
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
];

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

  private onApply: (s: SettingsData) => void;
  private selectedTheme: string;

  private fontSizeInput!: HTMLInputElement;
  private fontFamilySelect!: CustomSelect;
  private previewEl!: HTMLDivElement;
  private updateStatusEl!: HTMLDivElement;
  private updateProgressEl!: HTMLDivElement;
  private updateProgressBarEl!: HTMLDivElement;
  private checkBtn!: HTMLButtonElement;
  private overrides: Record<string, string> = {};
  private shortcutKbds: Map<string, HTMLElement> = new Map();

  constructor(initialTheme: string, onApply: (s: SettingsData) => void) {
    this.selectedTheme = initialTheme;
    this.onApply = onApply;

    this.el = document.createElement('div');
    this.el.id = 'settings-modal';
    this.el.style.cssText =
      'position:fixed;inset:0;z-index:1000;display:none;flex-direction:column;' +
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

    const saveBtn = document.createElement('button');
    saveBtn.textContent = 'Save';
    saveBtn.style.cssText =
      'padding:6px 16px;border:none;border-radius:6px;font-size:13px;font-weight:500;cursor:pointer;' +
      'background:var(--accent);color:var(--surface);transition:opacity 0.15s;';
    saveBtn.addEventListener('mouseenter', () => { saveBtn.style.opacity = '0.85'; });
    saveBtn.addEventListener('mouseleave', () => { saveBtn.style.opacity = '1'; });
    saveBtn.addEventListener('click', () => this.save());

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

    headerActions.append(saveBtn, closeBtn);
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

    const tabs = ['General', 'Theme', 'Keyboard Shortcuts', 'About'];
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
    const tabNames = ['General', 'Theme', 'Keyboard Shortcuts', 'About'];
    const idx = tabNames.indexOf(name);

    for (const [n, btn] of this.tabButtons) {
      if (n === name) {
        btn.style.background = 'var(--accent)';
        btn.style.color = '#fff';
      } else {
        btn.style.background = 'transparent';
        btn.style.color = 'var(--text-muted)';
      }
    }
    this.tabPanels.forEach((p, i) => {
      p.style.display = i === idx ? 'block' : 'none';
    });
  }

  private styledInput(type: string, extra = ''): HTMLInputElement {
    const el = document.createElement('input');
    el.type = type;
    el.style.cssText =
      'padding:5px 10px;border:1px solid var(--border);border-radius:6px;' +
      'background:var(--surface-secondary);color:var(--text);font-size:13px;outline:none;' +
      'transition:border-color .15s;' + extra;
    el.addEventListener('focus', () => { el.style.borderColor = 'var(--accent)'; });
    el.addEventListener('blur', () => { el.style.borderColor = 'var(--border)'; });
    return el;
  }

  private styledSelect(options: string[]): CustomSelect {
    const container = document.createElement('div');
    container.style.cssText = 'position:relative;max-width:240px;';

    const display = document.createElement('div');
    display.tabIndex = 0;
    display.style.cssText =
      'padding:5px 10px;border:1px solid var(--border);border-radius:6px;' +
      'background:var(--surface-secondary);color:var(--text);font-size:13px;' +
      'cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:6px;' +
      'outline:none;user-select:none;transition:border-color .15s;';

    const label = document.createElement('span');
    label.style.flex = '1';

    const arrow = document.createElement('span');
    arrow.innerHTML =
      '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>';
    arrow.style.cssText = 'display:flex;color:var(--text-muted);flex-shrink:0;';

    display.append(label, arrow);

    const panel = document.createElement('div');
    panel.style.cssText =
      'display:none;position:absolute;top:100%;left:0;right:0;z-index:100;' +
      'margin-top:2px;border:1px solid var(--border);border-radius:6px;' +
      'background:var(--surface);box-shadow:0 8px 24px rgba(0,0,0,0.3);overflow:hidden;';

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

    options.forEach((o, idx) => {
      const item = document.createElement('div');
      item.textContent = o.split(',')[0].replace(/['"]/g, '');
      item.style.cssText =
        'padding:6px 10px;font-size:13px;color:var(--text);cursor:pointer;transition:background .1s;';
      item.addEventListener('mouseenter', () => { item.style.background = 'var(--surface-hover)'; });
      item.addEventListener('mouseleave', () => { item.style.background = 'transparent'; });
      item.addEventListener('click', () => {
        currentIndex = idx;
        label.textContent = options[idx].split(',')[0].replace(/['"]/g, '');
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

    label.textContent = options[0].split(',')[0].replace(/['"]/g, '');
    container.append(display, panel);

    return {
      el: container,
      get value() { return options[currentIndex]; },
      set value(v: string) {
        const idx = options.indexOf(v);
        if (idx >= 0) {
          currentIndex = idx;
          label.textContent = options[idx].split(',')[0].replace(/['"]/g, '');
        }
      },
      options,
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

  private buildGeneral(panel: HTMLDivElement): void {
    panel.style.cssText = 'display:flex;flex-direction:column;gap:2px;';

    const familyRow = this.fieldRow('Font Family', () => {
      const sel = this.styledSelect([
        '-apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif',
        'monospace',
        'serif',
        'sans-serif',
        'Georgia, serif',
        '\'Courier New\', monospace',
      ]);
      this.fontFamilySelect = sel;
      sel.addEventListener('change', () => this.updatePreview());
      return sel.el;
    });

    const sizeRow = this.fieldRow('Font Size', () => {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;align-items:center;gap:6px;';

      const decBtn = document.createElement('button');
      decBtn.textContent = '\u2212';
      decBtn.style.cssText =
        'display:flex;align-items:center;justify-content:center;width:26px;height:26px;' +
        'border:1px solid var(--border);border-radius:6px;background:var(--surface-secondary);' +
        'color:var(--text);font-size:14px;cursor:pointer;transition:border-color .15s;';
      decBtn.addEventListener('mouseenter', () => { decBtn.style.borderColor = 'var(--accent)'; });
      decBtn.addEventListener('mouseleave', () => { decBtn.style.borderColor = 'var(--border)'; });

      const input = this.styledInput('number', 'width:52px;text-align:center;');
      this.fontSizeInput = input;
      input.min = '10';
      input.max = '32';

      const incBtn = document.createElement('button');
      incBtn.textContent = '+';
      incBtn.style.cssText =
        'display:flex;align-items:center;justify-content:center;width:26px;height:26px;' +
        'border:1px solid var(--border);border-radius:6px;background:var(--surface-secondary);' +
        'color:var(--text);font-size:14px;cursor:pointer;transition:border-color .15s;';
      incBtn.addEventListener('mouseenter', () => { incBtn.style.borderColor = 'var(--accent)'; });
      incBtn.addEventListener('mouseleave', () => { incBtn.style.borderColor = 'var(--border)'; });

      decBtn.addEventListener('click', () => {
        let v = parseInt(input.value) || 16;
        if (v > 10) { v--; input.value = String(v); this.updatePreview(); }
      });
      incBtn.addEventListener('click', () => {
        let v = parseInt(input.value) || 16;
        if (v < 32) { v++; input.value = String(v); this.updatePreview(); }
      });
      input.addEventListener('input', () => this.updatePreview());

      wrap.append(decBtn, input, incBtn);
      return wrap;
    });

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
    panel.append(familyRow, sizeRow, previewSection);
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

  private async save(): Promise<void> {
    const settings: SettingsData = {
      theme: this.selectedTheme,
      font_size: this.fontSizeInput.value,
      font_family: this.fontFamilySelect.value,
      shortcut_overrides: JSON.stringify(this.overrides),
    };

    try {
      await serviceBindings.SaveSettings(settings);
      this.onApply(settings);
      toast.show('Settings saved', 'success');
    } catch {
      toast.show('Failed to save settings', 'error');
    }

    this.close();
  }

  async open(tab?: string): Promise<void> {
    if (this.isVisible) return;
    this.isVisible = true;

    try {
      const [settings, version] = await Promise.all([
        serviceBindings.GetSettings(),
        serviceBindings.GetAppVersion(),
      ]);

      try {
        const parsed = JSON.parse(settings.shortcut_overrides || '{}');
        if (typeof parsed === 'object' && !Array.isArray(parsed)) {
          this.overrides = parsed;
        } else {
          this.overrides = {};
        }
      } catch { this.overrides = {}; }

      this.selectedTheme = settings.theme || 'dark';
      this.fontSizeInput.value = settings.font_size || '16';
      const fontFamily = settings.font_family || '';
      if (this.fontFamilySelect.options.some(o => o === fontFamily)) {
        this.fontFamilySelect.value = fontFamily;
      }
      this.updatePreview();

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

      const verEl = this.el.querySelector('#settings-version');
      if (verEl) verEl.textContent = `Version ${version}`;

      this.shortcutKbds.forEach((kbd, id) => {
        if (this.overrides[id]) kbd.textContent = this.overrides[id];
      });
    } catch {
      toast.show('Failed to load settings', 'error');
    }

    this.el.style.display = 'flex';
    this.switchTab(tab || 'General');
  }

  close(): void {
    if (!this.isVisible) return;
    this.isVisible = false;
    this.el.style.display = 'none';
  }

  isOpen(): boolean {
    return this.isVisible;
  }

  destroy(): void {
    document.removeEventListener('keydown', this.handleKeydown);
    if (this.el.parentElement) this.el.parentElement.removeChild(this.el);
  }
}
