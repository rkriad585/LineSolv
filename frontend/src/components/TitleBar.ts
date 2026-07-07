import type {AppCallbacks} from '../types';

export class TitleBar {
  readonly el: HTMLElement;
  readonly toggleNotesBtn: HTMLButtonElement;
  readonly toggleVarsBtn: HTMLButtonElement;
  readonly settingsBtn: HTMLButtonElement;

  constructor(cb: AppCallbacks) {
    this.el = document.createElement('header');
    this.el.style.cssText =
      'display:flex;align-items:center;justify-content:center;' +
      'background:var(--surface);border-bottom:1px solid var(--border);height:34px;position:relative;';

    const dragRegion = document.createElement('div');
    dragRegion.style.cssText =
      'display:flex;align-items:center;justify-content:center;gap:6px;height:100%;' +
      '--wails-draggable:drag;-webkit-user-select:none;pointer-events:none;';
    dragRegion.innerHTML =
      `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">` +
      `<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/>` +
      `<line x1="12" y1="4" x2="12" y2="20"/><line x1="8" y1="12" x2="16" y2="12"/>` +
      `<line x1="10" y1="9" x2="14" y2="9"/><line x1="10" y1="15" x2="14" y2="15"/></svg>` +
      `<span style="font-size:11px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:var(--text-muted)">LineSolv</span>`;
    dragRegion.addEventListener('dblclick', () => cb.onToggleFullscreen());

    const winBtn = (icon: string, title: string, action: () => void, isClose = false): HTMLButtonElement => {
      const b = document.createElement('button');
      b.title = title;
      b.innerHTML = icon;
      b.style.cssText =
        'display:flex;align-items:center;justify-content:center;width:32px;height:100%;' +
        'border:none;background:transparent;color:var(--text-muted);cursor:default;outline:none;' +
        'transition:background 0.15s;';
      if (isClose) {
        b.addEventListener('mouseenter', () => { b.style.background = '#e81123'; b.style.color = '#fff'; });
        b.addEventListener('mouseleave', () => { b.style.background = 'transparent'; b.style.color = 'var(--text-muted)'; });
      } else {
        b.addEventListener('mouseenter', () => { b.style.background = 'var(--border)'; });
        b.addEventListener('mouseleave', () => { b.style.background = 'transparent'; });
      }
      b.addEventListener('click', action);
      return b;
    };

    const closeIcon = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    const minIcon = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/></svg>';
    const maxIcon = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="5" width="14" height="14" rx="2"/></svg>';

    const closeBtn = winBtn(closeIcon, 'Close', () => { try { (window as any).runtime.Quit(); } catch {}; }, true);
    const minBtn = winBtn(minIcon, 'Minimize', () => { try { (window as any).runtime.WindowMinimise(); } catch {}; });
    const maxBtn = winBtn(maxIcon, 'Maximize', () => { try { (window as any).runtime.WindowToggleMaximise(); } catch {}; });

    const controls = document.createElement('div');
    controls.style.cssText =
      'display:flex;align-items:center;height:100%;position:absolute;left:4px;top:0;z-index:1;';
    controls.append(minBtn, maxBtn, closeBtn);

    this.el.append(controls, dragRegion);

    const btnRow = document.createElement('div');
    btnRow.style.cssText =
      'display:flex;align-items:center;gap:4px;padding-right:4px;position:absolute;right:0;top:0;height:100%;z-index:1;';

    const iconBtn = (svg: string, title: string): [HTMLButtonElement, HTMLButtonElement] => {
      const b = document.createElement('button');
      b.title = title;
      b.innerHTML = svg;
      b.style.cssText =
        'display:flex;align-items:center;justify-content:center;width:26px;height:26px;' +
        'border:none;border-radius:4px;background:transparent;color:var(--text-muted);cursor:pointer;outline:none;';
      return [b, b];
    };

    const [notesBtnEl, _n] = iconBtn(
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>',
      'Notes (⌘B)'
    );
    const [varsBtnEl, _v] = iconBtn(
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>',
      'Variables (⌘I)'
    );
    const [historyBtnEl, _h] = iconBtn(
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
      'History (⌘H)'
    );
    const [settingsBtnEl, _s] = iconBtn(
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
      'Settings'
    );

    [notesBtnEl, varsBtnEl, historyBtnEl, settingsBtnEl].forEach(b => {
      b.addEventListener('mouseenter', () => b.style.background = 'var(--border)');
      b.addEventListener('mouseleave', () => b.style.background = 'transparent');
    });

    btnRow.append(notesBtnEl, varsBtnEl, historyBtnEl, settingsBtnEl);
    this.el.append(btnRow);

    this.settingsBtn = settingsBtnEl;
    this.toggleNotesBtn = notesBtnEl;
    this.toggleVarsBtn = varsBtnEl;

    notesBtnEl.addEventListener('click', () => cb.onToggleNotes());
    varsBtnEl.addEventListener('click', () => cb.onToggleVars());
    historyBtnEl.addEventListener('click', () => cb.onToggleHistory());
    settingsBtnEl.addEventListener('click', () => cb.onToggleSettings());
  }

}
