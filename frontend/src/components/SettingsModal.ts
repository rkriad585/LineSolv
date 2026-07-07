import type {SettingsData} from '../types';
import * as serviceBindings from '../../wailsjs/go/service/AppService';

interface CustomSelect {
  el: HTMLElement;
  value: string;
  options: string[];
  addEventListener(type: 'change', fn: () => void): void;
}

interface ShortcutEntry {
  id: string;
  keys: string;
  desc: string;
}

const ALL_SHORTCUTS: ShortcutEntry[] = [
  {id: 'toggle_notes', keys: 'Ctrl/Cmd + B', desc: 'Toggle notes sidebar'},
  {id: 'toggle_vars', keys: 'Ctrl/Cmd + I', desc: 'Toggle variables panel'},
  {id: 'toggle_history', keys: 'Ctrl/Cmd + H', desc: 'Toggle history panel'},
  {id: 'toggle_settings', keys: 'Ctrl/Cmd + ,', desc: 'Open settings'},
  {id: 'clear_all', keys: 'Ctrl/Cmd + K', desc: 'Clear all'},
  {id: 'new_note', keys: 'Ctrl/Cmd + N', desc: 'Create new note'},
  {id: 'shortcut_ref', keys: '? / Cmd + /', desc: 'Show shortcuts reference'},
  {id: 'history_up', keys: 'Ctrl/Cmd + \u2191', desc: 'History: previous input'},
  {id: 'history_down', keys: 'Ctrl/Cmd + \u2193', desc: 'History: next input'},
  {id: 'force_eval', keys: 'Shift + Enter', desc: 'Force evaluate now'},
  {id: 'escape', keys: 'Escape', desc: 'Close modal / clear input / close panel'},
  {id: 'duplicate', keys: 'Ctrl/Cmd + D', desc: 'Duplicate line or selection'},
  {id: 'select_line', keys: 'Ctrl/Cmd + L', desc: 'Select current line'},
  {id: 'delete_line', keys: 'Ctrl/Cmd + Shift + K', desc: 'Delete current line'},
  {id: 'toggle_case', keys: 'Alt + Shift', desc: 'Toggle case (lower / UPPER / Title)'},
  {id: 'move_up', keys: 'Alt + \u2191', desc: 'Move line up'},
  {id: 'move_down', keys: 'Alt + \u2193', desc: 'Move line down'},
];

const APP_REPO = 'https://github.com/rkriad585/LineSolv';

const SUN_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';

const MOON_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

const EDIT_ICON = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>';

const CLOSE_ICON = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

const LOGO_SVG = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color:var(--accent)"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="10" y1="9" x2="14" y2="9"/><line x1="10" y1="15" x2="14" y2="15"/></svg>';

function platformDownloadURL(version: string): string {
  const ua = navigator.userAgent;
  const v = version.startsWith('v') ? version.slice(1) : version;
  if (ua.includes('Linux')) {
    return `https://github.com/rkriad585/LineSolv/releases/download/v${v}/linesolv-${v}-linux-amd64.deb`;
  }
  if (ua.includes('Mac')) {
    if (ua.includes('ARM64') || ua.includes('arm64')) {
      return `https://github.com/rkriad585/LineSolv/releases/download/v${v}/LineSolv-${v}-darwin-arm64.dmg`;
    }
    return `https://github.com/rkriad585/LineSolv/releases/download/v${v}/LineSolv-${v}-darwin-amd64.dmg`;
  }
  return `https://github.com/rkriad585/LineSolv/releases/download/v${v}/LineSolv-${v}-windows-amd64.exe`;
}

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
  private tabBtns: HTMLButtonElement[] = [];
  private tabPanels: HTMLDivElement[] = [];

  private onThemeToggle: () => void;
  private onApply: (s: SettingsData) => void;
  private currentTheme: 'dark' | 'light';

  private fontSizeInput!: HTMLInputElement;
  private fontFamilySelect!: CustomSelect;
  private fontColorInput!: HTMLInputElement;
  private themeBtn!: HTMLButtonElement;
  private previewEl!: HTMLDivElement;
  private updateStatusEl!: HTMLDivElement;
  private checkBtn!: HTMLButtonElement;
  private overrides: Record<string, string> = {};
  private shortcutKbds: Map<string, HTMLElement> = new Map();

  constructor(onThemeToggle: () => void, initialTheme: 'dark' | 'light', onApply: (s: SettingsData) => void) {
    this.onThemeToggle = onThemeToggle;
    this.currentTheme = initialTheme;
    this.onApply = onApply;

    this.el = document.createElement('div');
    this.el.id = 'settings-modal';
    this.el.style.cssText =
      'display:none;position:fixed;inset:0;z-index:1001;' +
      'background:rgba(0,0,0,0.5);align-items:center;justify-content:center;';
    this.el.addEventListener('click', (e) => {
      if (e.target === this.el) this.close();
    });

    const box = document.createElement('div');
    box.style.cssText =
      'background:var(--surface);border:1px solid var(--border);' +
      'border-radius:12px;width:540px;max-height:85vh;' +
      'display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.4);';

    this.buildHeader(box);
    this.buildTabBar(box);
    this.buildContent(box);
    this.buildFooter(box);

    this.el.appendChild(box);
    document.body.appendChild(this.el);
  }

  private buildHeader(box: HTMLElement): void {
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;gap:10px;padding:18px 22px 0;';

    const icon = document.createElement('span');
    icon.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--accent)">' +
      '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>';

    const title = document.createElement('h2');
    title.textContent = 'Settings';
    title.style.cssText = 'margin:0;font-size:15px;font-weight:600;color:var(--text);flex:1;user-select:none;';

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = CLOSE_ICON;
    closeBtn.style.cssText =
      'display:flex;align-items:center;justify-content:center;width:28px;height:28px;' +
      'border:none;border-radius:4px;background:transparent;color:var(--text-muted);cursor:pointer;';
    closeBtn.addEventListener('mouseenter', () => { closeBtn.style.background = 'var(--surface-hover)'; });
    closeBtn.addEventListener('mouseleave', () => { closeBtn.style.background = 'transparent'; });
    closeBtn.addEventListener('click', () => this.close());

    header.append(icon, title, closeBtn);
    box.appendChild(header);
  }

  private buildTabBar(box: HTMLElement): void {
    const bar = document.createElement('div');
    bar.style.cssText = 'display:flex;gap:4px;padding:14px 22px 0;';

    ['General', 'Keyboard Shortcuts', 'About'].forEach((label, i) => {
      const btn = document.createElement('button');
      btn.textContent = label;
      btn.style.cssText =
        `padding:6px 14px;font-size:13px;font-weight:500;cursor:pointer;` +
        `border:none;border-radius:6px;background:${i === 0 ? 'var(--surface-secondary)' : 'transparent'};` +
        `color:${i === 0 ? 'var(--text)' : 'var(--text-muted)'};` +
        `transition:background .15s,color .15s;`;
      btn.addEventListener('mouseenter', () => {
        if (i !== this.tabBtns.indexOf(btn)) btn.style.background = 'var(--surface-hover)';
      });
      btn.addEventListener('mouseleave', () => {
        if (i !== this.tabBtns.indexOf(btn)) btn.style.background = 'transparent';
      });
      btn.addEventListener('click', () => this.switchTab(i));
      bar.appendChild(btn);
      this.tabBtns.push(btn);
    });

    box.appendChild(bar);
  }

  private buildContent(box: HTMLElement): void {
    const area = document.createElement('div');
    area.style.cssText = 'flex:1;overflow-y:auto;padding:18px 22px 14px;';

    const panels: HTMLDivElement[] = [];

    const generalPanel = document.createElement('div');
    this.buildGeneral(generalPanel);
    panels.push(generalPanel);
    area.appendChild(generalPanel);

    const shortcutsPanel = document.createElement('div');
    shortcutsPanel.style.display = 'none';
    this.buildShortcuts(shortcutsPanel);
    panels.push(shortcutsPanel);
    area.appendChild(shortcutsPanel);

    const aboutPanel = document.createElement('div');
    aboutPanel.style.display = 'none';
    this.buildAbout(aboutPanel);
    panels.push(aboutPanel);
    area.appendChild(aboutPanel);

    this.tabPanels = panels;
    box.appendChild(area);
  }

  private switchTab(idx: number): void {
    this.tabBtns.forEach((btn, i) => {
      btn.style.background = i === idx ? 'var(--surface-secondary)' : 'transparent';
      btn.style.color = i === idx ? 'var(--text)' : 'var(--text-muted)';
    });
    this.tabPanels.forEach((p, i) => {
      p.style.display = i === idx ? 'block' : 'none';
    });
  }

  private buildFooter(box: HTMLElement): void {
    const footer = document.createElement('div');
    footer.style.cssText = 'display:flex;justify-content:flex-end;gap:8px;padding:12px 22px;border-top:1px solid var(--border);';

    const cancelBtn = this.createBtn('Cancel', false);
    cancelBtn.addEventListener('click', () => this.close());

    const saveBtn = this.createBtn('Save', true);
    saveBtn.addEventListener('click', () => this.save());

    footer.append(cancelBtn, saveBtn);
    box.appendChild(footer);
  }

  private createBtn(label: string, primary: boolean): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.style.cssText =
      'padding:7px 18px;border:none;border-radius:6px;font-size:13px;font-weight:500;cursor:pointer;' +
      (primary
        ? 'background:var(--accent);color:#fff;'
        : 'background:var(--surface-secondary);color:var(--text);');
    if (!primary) {
      btn.addEventListener('mouseenter', () => { btn.style.background = 'var(--surface-hover)'; });
      btn.addEventListener('mouseleave', () => { btn.style.background = 'var(--surface-secondary)'; });
    }
    return btn;
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

  private buildGeneral(panel: HTMLDivElement): void {
    panel.style.cssText = 'display:flex;flex-direction:column;gap:2px;';

    // Theme
    const themeRow = this.fieldRow('Theme', () => {
      const btn = document.createElement('button');
      this.themeBtn = btn;
      btn.style.cssText =
        'display:flex;align-items:center;gap:6px;padding:5px 14px;' +
        'border:1px solid var(--border);border-radius:6px;' +
        'background:var(--surface-secondary);color:var(--text);font-size:13px;cursor:pointer;' +
        'transition:border-color .15s,background .15s;';
      btn.addEventListener('mouseenter', () => { btn.style.borderColor = 'var(--accent)'; });
      btn.addEventListener('mouseleave', () => { btn.style.borderColor = 'var(--border)'; });
      this.updateThemeBtn();
      btn.addEventListener('click', () => {
        this.onThemeToggle();
        this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.updateThemeBtn();
      });
      return btn;
    });

    // Font Family
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

    // Font Size
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

    // Font Color
    const colorRow = this.fieldRow('Font Color', () => {
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;align-items:center;gap:8px;';

      const input = this.styledInput('color', 'width:32px;height:28px;padding:1px;cursor:pointer;');
      this.fontColorInput = input;

      const hexLabel = document.createElement('span');
      hexLabel.style.cssText = 'font-size:12px;color:var(--text-muted);font-family:monospace;';
      input.addEventListener('input', () => {
        hexLabel.textContent = input.value;
        this.updatePreview();
      });

      wrap.append(input, hexLabel);
      return wrap;
    });

    // Preview section
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

    panel.append(themeRow, familyRow, sizeRow, colorRow, previewSection);
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

  private updateThemeBtn(): void {
    if (this.themeBtn) {
      this.themeBtn.innerHTML =
        (this.currentTheme === 'dark' ? MOON_ICON + ' Dark' : SUN_ICON + ' Light');
    }
  }

  private updatePreview(): void {
    if (!this.previewEl) return;
    const size = this.fontSizeInput.value || '16';
    this.previewEl.style.fontSize = size + 'px';
    this.previewEl.style.fontFamily = this.fontFamilySelect.value;
    this.previewEl.style.color = this.fontColorInput.value;
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
    authorEl.innerHTML =
      'Author: <a href="https://github.com/rkriad585" target="_blank" style="color:var(--accent);text-decoration:none;">rkriad585</a>';
    authorEl.style.cssText = 'font-size:13px;color:var(--text-muted);user-select:none;';

    const repoEl = document.createElement('div');
    repoEl.innerHTML =
      `<a href="${APP_REPO}" target="_blank" style="color:var(--accent);text-decoration:none;">${APP_REPO}</a>`;
    repoEl.style.cssText = 'font-size:13px;user-select:none;';

    const updateSection = document.createElement('div');
    updateSection.style.cssText = 'margin-top:10px;display:flex;flex-direction:column;align-items:center;gap:8px;';

    this.checkBtn = document.createElement('button');
    this.checkBtn.textContent = 'Check for Updates';
    this.checkBtn.style.cssText =
      'padding:7px 18px;border:none;border-radius:6px;font-size:13px;font-weight:500;cursor:pointer;' +
      'background:var(--accent);color:#fff;transition:opacity .15s;';
    this.checkBtn.addEventListener('mouseenter', () => { this.checkBtn.style.opacity = '0.85'; });
    this.checkBtn.addEventListener('mouseleave', () => { this.checkBtn.style.opacity = '1'; });
    this.checkBtn.addEventListener('click', () => this.checkForUpdate());

    this.updateStatusEl = document.createElement('div');
    this.updateStatusEl.style.cssText = 'font-size:12px;color:var(--text-muted);text-align:center;user-select:none;';

    updateSection.append(this.checkBtn, this.updateStatusEl);
    center.append(logo, nameEl, versionEl, divider, authorEl, repoEl, updateSection);
    panel.appendChild(center);
  }

  private async checkForUpdate(): Promise<void> {
    this.checkBtn.disabled = true;
    this.checkBtn.textContent = 'Checking...';
    this.updateStatusEl.textContent = '';

    try {
      const info = await serviceBindings.CheckForUpdate();
      if (info.update_available) {
        const url = platformDownloadURL(info.latest_version);
        this.updateStatusEl.innerHTML =
          `<span style="color:var(--accent);font-weight:600">Update ${info.latest_version} available!</span><br>` +
          `<a href="${url}" target="_blank" style="color:var(--accent);font-size:12px;text-decoration:underline">Download for your platform</a>` +
          `<br><span style="font-size:11px;color:var(--text-muted)">or visit <a href="${info.download_url}" target="_blank" style="color:var(--text-muted);text-decoration:underline">all releases</a></span>`;
      } else {
        this.updateStatusEl.innerHTML =
          `<span style="color:var(--text-muted)">\u2713 You're up to date (${info.current_version})</span>`;
      }
    } catch {
      this.updateStatusEl.textContent = 'Failed to check for updates.';
    } finally {
      this.checkBtn.disabled = false;
      this.checkBtn.textContent = 'Check for Updates';
    }
  }

  private async save(): Promise<void> {
    const settings: SettingsData = {
      font_size: this.fontSizeInput.value,
      font_family: this.fontFamilySelect.value,
      font_color: this.fontColorInput.value,
      shortcut_overrides: JSON.stringify(this.overrides),
    };

    try {
      await serviceBindings.SaveSettings(settings);
      this.onApply(settings);
    } catch { /* ignore */ }

    this.close();
  }

  async open(): Promise<void> {
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

      this.fontSizeInput.value = settings.font_size || '16';
      const fontFamily = settings.font_family || '';
      if (this.fontFamilySelect.options.some(o => o === fontFamily)) {
        this.fontFamilySelect.value = fontFamily;
      }
      this.fontColorInput.value = settings.font_color || '#ffffff';
      this.updatePreview();

      const verEl = this.el.querySelector('#settings-version');
      if (verEl) verEl.textContent = `Version ${version}`;

      this.shortcutKbds.forEach((kbd, id) => {
        if (this.overrides[id]) kbd.textContent = this.overrides[id];
      });
    } catch { /* ignore */ }

    this.el.style.display = 'flex';
  }

  close(): void {
    this.el.style.display = 'none';
  }

  isOpen(): boolean {
    return this.el.style.display === 'flex';
  }

  destroy(): void {
    if (this.el.parentElement) this.el.parentElement.removeChild(this.el);
  }
}