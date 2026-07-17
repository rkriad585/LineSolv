import type { AppCallbacks } from '../types';
import { Icons } from './Icons';
import { toast } from '../utils/toast';

export class TitleBar {
  readonly el: HTMLElement;
  readonly toggleNotesBtn: HTMLButtonElement;
  readonly toggleVarsBtn: HTMLButtonElement;
  readonly settingsBtn: HTMLButtonElement;
  private menuOpen = false;
  private menuEl: HTMLDivElement | null = null;

  constructor(cb: AppCallbacks) {
    this.el = document.createElement('header');
    this.el.style.cssText =
      'display:flex;align-items:center;justify-content:center;' +
      'background:var(--surface);border-bottom:1px solid var(--border);height:34px;position:relative;' +
      '--wails-draggable:drag;-webkit-user-select:none;';

    const dragRegion = document.createElement('div');
    dragRegion.style.cssText =
      'display:flex;align-items:center;justify-content:center;gap:6px;height:100%;';
    dragRegion.innerHTML =
      `${Icons.logo(16, 16)}` +
      `<span style="font-size:11px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:var(--text-muted)">LineSolv</span>`;
    this.el.addEventListener('dblclick', (e) => {
      if ((e.target as HTMLElement).closest('button')) return;
      cb.onToggleFullscreen();
    });

    const winBtn = (
      icon: string,
      title: string,
      action: () => void,
      isClose = false,
    ): HTMLButtonElement => {
      const b = document.createElement('button');
      b.title = title;
      b.innerHTML = icon;
      b.style.cssText =
        'display:flex;align-items:center;justify-content:center;width:32px;height:100%;' +
        'border:none;background:transparent;color:var(--text-muted);cursor:default;outline:none;' +
        'transition:background 0.15s;--wails-draggable:no-drag;';
      if (isClose) {
        b.addEventListener('mouseenter', () => {
          b.style.background = '#e81123';
          b.style.color = '#fff';
        });
        b.addEventListener('mouseleave', () => {
          b.style.background = 'transparent';
          b.style.color = 'var(--text-muted)';
        });
      } else {
        b.addEventListener('mouseenter', () => {
          b.style.background = 'var(--border)';
        });
        b.addEventListener('mouseleave', () => {
          b.style.background = 'transparent';
        });
      }
      b.addEventListener('click', action);
      return b;
    };

    const closeIcon = Icons.close();
    const minIcon = Icons.minimize();
    const maxIcon = Icons.maximize();

    const closeBtn = winBtn(
      closeIcon,
      'Close',
      () => {
        try {
          window.runtime?.Quit();
        } catch {
          toast.show('Failed to close window', 'error');
        }
      },
      true,
    );
    closeBtn.setAttribute('aria-label', 'Close window');
    const minBtn = winBtn(minIcon, 'Minimize', () => {
      try {
        window.runtime?.WindowMinimise();
      } catch {
        toast.show('Failed to minimize window', 'error');
      }
    });
    minBtn.setAttribute('aria-label', 'Minimize window');
    const maxBtn = winBtn(maxIcon, 'Maximize', () => {
      try {
        window.runtime?.WindowToggleMaximise();
      } catch {
        toast.show('Failed to maximize window', 'error');
      }
    });
    maxBtn.setAttribute('aria-label', 'Maximize window');

    const controls = document.createElement('div');
    controls.style.cssText =
      'display:flex;align-items:center;height:100%;position:absolute;left:4px;top:0;z-index:1;--wails-draggable:no-drag;';
    controls.append(minBtn, maxBtn, closeBtn);

    this.el.append(controls, dragRegion);

    const btnRow = document.createElement('div');
    btnRow.style.cssText =
      'display:flex;align-items:center;gap:4px;padding-right:4px;position:absolute;right:0;top:0;height:100%;z-index:1;--wails-draggable:no-drag;';

    const iconBtn = (svg: string, title: string): [HTMLButtonElement, HTMLButtonElement] => {
      const b = document.createElement('button');
      b.title = title;
      b.innerHTML = svg;
      b.style.cssText =
        'display:flex;align-items:center;justify-content:center;width:26px;height:26px;' +
        'border:none;border-radius:4px;background:transparent;color:var(--text-muted);cursor:pointer;outline:none;--wails-draggable:no-drag;';
      return [b, b];
    };

    const [notesBtnEl, _n] = iconBtn(Icons.notesCheck(), 'Notes (⌘B)');

    const newNoteBtn = document.createElement('button');
    newNoteBtn.title = 'New Note (⌘N)';
    newNoteBtn.innerHTML = Icons.plus();
    newNoteBtn.style.cssText =
      'display:flex;align-items:center;justify-content:center;width:26px;height:26px;' +
      'border:none;border-radius:4px;background:transparent;color:var(--text-muted);cursor:pointer;outline:none;--wails-draggable:no-drag;';
    newNoteBtn.setAttribute('aria-label', 'New note');
    newNoteBtn.addEventListener('mouseenter', () => {
      newNoteBtn.style.background = 'var(--border)';
    });
    newNoteBtn.addEventListener('mouseleave', () => {
      newNoteBtn.style.background = 'transparent';
    });
    newNoteBtn.addEventListener('click', () => cb.onNewNote());
    const [varsBtnEl, _v] = iconBtn(Icons.externalLink(), 'Variables (⌘I)');
    const [historyBtnEl, _h] = iconBtn(Icons.clock(), 'History (⌘H)');
    const [stepsBtnEl, _st] = iconBtn(Icons.activity(), 'Steps (⌘S)');

    // --- "..." menu button ---
    const menuBtn = document.createElement('button');
    menuBtn.title = 'Menu';
    menuBtn.innerHTML = Icons.verticalDots();
    menuBtn.style.cssText =
      'display:flex;align-items:center;justify-content:center;width:26px;height:26px;' +
      'border:none;border-radius:4px;background:transparent;color:var(--text-muted);cursor:pointer;outline:none;--wails-draggable:no-drag;';
    menuBtn.setAttribute('aria-label', 'Open menu');

    // Dropdown menu
    const menu = document.createElement('div');
    menu.style.cssText =
      'display:none;position:absolute;top:100%;right:4px;z-index:100;min-width:180px;' +
      'background:var(--surface);border:1px solid var(--border);border-radius:8px;' +
      'box-shadow:var(--ui-shadow-md);padding:4px 0;';
    this.menuEl = menu;

    const menuItems = [
      {
        icon: Icons.fileText(),
        label: 'Documentation',
        shortcut: 'Ctrl+J',
        action: () => cb.onToggleDocs(),
      },
      {
        icon: Icons.printer(),
        label: 'Print',
        shortcut: 'Ctrl+P',
        action: () => cb.onPrint(),
      },
      {
        icon: Icons.sun(),
        label: 'Plugins',
        shortcut: 'Ctrl+U',
        action: () => cb.onTogglePlugins(),
      },
      {
        icon: Icons.settings(),
        label: 'Settings',
        shortcut: 'Ctrl+`',
        action: () => cb.onToggleSettings(),
      },
    ];

    for (const item of menuItems) {
      const row = document.createElement('div');
      row.style.cssText =
        'display:flex;align-items:center;gap:8px;padding:6px 12px;font-size:12px;color:var(--text);cursor:pointer;transition:background 0.1s;';
      row.innerHTML =
        `<span style="display:flex;color:var(--text-muted);flex-shrink:0;">${item.icon}</span>` +
        `<span style="flex:1">${item.label}</span>` +
        (item.shortcut
          ? `<span style="font-size:11px;color:var(--text-muted)">${item.shortcut}</span>`
          : '');
      row.addEventListener('mouseenter', () => {
        row.style.background = 'var(--surface-hover)';
      });
      row.addEventListener('mouseleave', () => {
        row.style.background = 'transparent';
      });
      row.addEventListener('click', () => {
        this.closeMenu();
        item.action();
      });
      menu.appendChild(row);
    }

    const closeMenu = (e: MouseEvent) => {
      if (
        !menu.contains(e.target as Node) &&
        e.target !== menuBtn &&
        !menuBtn.contains(e.target as Node)
      ) {
        this.closeMenu();
      }
    };

    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this.menuOpen) {
        this.closeMenu();
      } else {
        this.openMenu(menuBtn);
        document.addEventListener('mousedown', closeMenu, { once: true });
      }
    });

    [newNoteBtn, notesBtnEl, varsBtnEl, historyBtnEl, stepsBtnEl, menuBtn].forEach((b) => {
      b.addEventListener('mouseenter', () => (b.style.background = 'var(--border)'));
      b.addEventListener('mouseleave', () => (b.style.background = 'transparent'));
    });

    notesBtnEl.setAttribute('aria-label', 'Toggle notes panel');
    varsBtnEl.setAttribute('aria-label', 'Toggle variables panel');
    historyBtnEl.setAttribute('aria-label', 'Toggle history panel');
    stepsBtnEl.setAttribute('aria-label', 'Toggle steps panel');

    btnRow.append(newNoteBtn, notesBtnEl, varsBtnEl, historyBtnEl, stepsBtnEl, menuBtn, menu);
    this.el.append(btnRow);

    this.settingsBtn = menuBtn;
    this.toggleNotesBtn = notesBtnEl;
    this.toggleVarsBtn = varsBtnEl;

    notesBtnEl.addEventListener('click', () => cb.onToggleNotes());
    varsBtnEl.addEventListener('click', () => cb.onToggleVars());
    historyBtnEl.addEventListener('click', () => cb.onToggleHistory());
    stepsBtnEl.addEventListener('click', () => cb.onToggleSteps());
  }

  private openMenu(anchor: HTMLButtonElement): void {
    if (!this.menuEl) return;
    this.menuEl.style.display = 'block';
    this.menuOpen = true;
    anchor.style.background = 'var(--border)';
  }

  closeMenu(): void {
    if (!this.menuEl) return;
    this.menuEl.style.display = 'none';
    this.menuOpen = false;
  }
}
