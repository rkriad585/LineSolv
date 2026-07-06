import type {AppCallbacks} from '../types';

export class TitleBar {
  readonly el: HTMLElement;
  readonly toggleNotesBtn: HTMLButtonElement;
  readonly toggleVarsBtn: HTMLButtonElement;
  readonly themeBtn: HTMLButtonElement;

  constructor(cb: AppCallbacks) {
    this.el = document.createElement('header');
    this.el.setAttribute('data-wails-drag', '');
    this.el.className =
      'drag h-[34px] flex items-center shrink-0 px-4 gap-1';
    this.el.style.cssText =
      'background:var(--surface);border-bottom:1px solid var(--border);-webkit-app-region:drag;';

    this.el.innerHTML = `
      <span class="text-[11px] font-semibold tracking-[0.15em] uppercase" style="color:var(--text-muted)">LineSolv</span>
      <span class="ml-auto"></span>
      <button id="theme-btn" title="Toggle theme"
        class="flex items-center justify-center w-6 h-6 rounded transition-colors"
        style="color:var(--text-muted)">
        <svg id="theme-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      </button>
      <button id="toggle-notes-btn" title="Notes (⌘B)"
        class="flex items-center justify-center w-6 h-6 rounded transition-colors"
        style="color:var(--text-muted)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg>
      </button>
      <button id="toggle-vars-btn" title="Variables (⌘I)"
        class="flex items-center justify-center w-6 h-6 rounded transition-colors"
        style="color:var(--text-muted)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>
      </button>
    `;

    this.toggleNotesBtn = this.el.querySelector('#toggle-notes-btn') as HTMLButtonElement;
    this.toggleVarsBtn = this.el.querySelector('#toggle-vars-btn') as HTMLButtonElement;
    this.themeBtn = this.el.querySelector('#theme-btn') as HTMLButtonElement;

    this.addHover(this.toggleNotesBtn);
    this.addHover(this.toggleVarsBtn);
    this.addHover(this.themeBtn);

    this.toggleNotesBtn.addEventListener('click', () => cb.onToggleNotes());
    this.toggleVarsBtn.addEventListener('click', () => cb.onToggleVars());
    this.themeBtn.addEventListener('click', () => cb.onThemeToggle());
  }

  private addHover(btn: HTMLElement): void {
    btn.addEventListener('mouseenter', () => btn.style.color = 'var(--btn-hover)');
    btn.addEventListener('mouseleave', () => btn.style.color = 'var(--text-muted)');
  }

  updateThemeIcon(dark: boolean): void {
    const icon = this.themeBtn.querySelector('#theme-icon');
    if (icon) {
      icon.innerHTML = dark
        ? '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'
        : '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
    }
  }
}
