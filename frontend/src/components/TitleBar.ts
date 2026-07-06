import type {AppCallbacks} from '../types';

export class TitleBar {
  readonly el: HTMLElement;
  readonly toggleNotesBtn: HTMLButtonElement;
  readonly toggleVarsBtn: HTMLButtonElement;
  readonly themeBtn: HTMLButtonElement;

  constructor(cb: AppCallbacks) {
    this.el = document.createElement('header');
    this.el.className =
      'flex items-center shrink-0 px-2 gap-1';
    this.el.style.cssText =
      'background:var(--surface);border-bottom:1px solid var(--border);height:34px;';

    const dragRegion = document.createElement('div');
    dragRegion.style.cssText = 'flex:1;height:100%;--wails-draggable:drag;-webkit-user-select:none;';
    dragRegion.innerHTML = `<span class="text-[11px] font-semibold tracking-[0.15em] uppercase ml-2" style="color:var(--text-muted);pointer-events:none">LineSolv</span>`;

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
    controls.style.cssText = 'display:flex;align-items:center;height:100%;';
    controls.append(minBtn, maxBtn, closeBtn);

    this.el.append(controls, dragRegion);

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;align-items:center;gap:4px;padding-right:4px;';

    const iconBtn = (svg: string, title: string): [HTMLButtonElement, HTMLButtonElement] => {
      const b = document.createElement('button');
      b.title = title;
      b.innerHTML = svg;
      b.style.cssText =
        'display:flex;align-items:center;justify-content:center;width:26px;height:26px;' +
        'border:none;border-radius:4px;background:transparent;color:var(--text-muted);cursor:pointer;outline:none;';
      return [b, b];
    };

    const [themeBtnEl, _t] = iconBtn(
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
      'Toggle theme'
    );
    const [notesBtnEl, _n] = iconBtn(
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>',
      'Notes (⌘B)'
    );
    const [varsBtnEl, _v] = iconBtn(
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>',
      'Variables (⌘I)'
    );

    [themeBtnEl, notesBtnEl, varsBtnEl].forEach(b => {
      b.addEventListener('mouseenter', () => b.style.background = 'var(--border)');
      b.addEventListener('mouseleave', () => b.style.background = 'transparent');
    });

    btnRow.append(notesBtnEl, varsBtnEl, themeBtnEl);
    this.el.append(btnRow);

    this.themeBtn = themeBtnEl;
    this.toggleNotesBtn = notesBtnEl;
    this.toggleVarsBtn = varsBtnEl;

    notesBtnEl.addEventListener('click', () => cb.onToggleNotes());
    varsBtnEl.addEventListener('click', () => cb.onToggleVars());
    themeBtnEl.addEventListener('click', () => cb.onThemeToggle());
  }

  updateThemeIcon(dark: boolean): void {
    const icon = this.themeBtn.querySelector('svg');
    if (icon) {
      icon.innerHTML = dark
        ? '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'
        : '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
    }
  }
}
