import type {Note} from '../types';
import {escapeHtml} from '../utils/html';
import {ContextMenu} from './ContextMenu';

type NoteAction = {
  rename: (id: string, name: string) => void;
  del: (id: string) => void;
  exportNote: (id: string, format: string) => void;
  share: (id: string) => void;
  importNote: () => void;
  reorder: (noteIDs: string[]) => void;
};

export class NotesPanel {
  readonly el: HTMLElement;
  readonly listEl: HTMLDivElement;
  readonly newNoteBtn: HTMLButtonElement;
  private callback: (id: string) => void;
  private ctxMenu: ContextMenu;
  private actions: NoteAction;
  private searchInput: HTMLInputElement;
  private filterText = '';
  private dirtyIds = new Set<string>();
  private lastNotes: Note[] = [];
  private lastActiveId = '';

  constructor(onSwitchNote: (id: string) => void, onNewNote: () => void, actions: NoteAction) {
    this.callback = onSwitchNote;
    this.actions = actions;

    this.ctxMenu = new ContextMenu();

    this.el = document.createElement('aside');
    this.el.id = 'notes-sidebar';
    this.el.className = 'shrink-0 flex flex-col overflow-hidden transition-all duration-150 ease-out';
    this.el.style.cssText = 'width:0;border-right:0;background:var(--surface);';
    this.el.style.borderRightWidth = '0';

    const header = document.createElement('div');
    header.className = 'px-4 py-2.5 text-[10px] font-semibold tracking-wider uppercase border-b shrink-0';
    header.style.cssText = 'color:var(--text-muted);border-color:var(--border);';
    header.textContent = 'Notes';
    this.el.appendChild(header);

    this.searchInput = document.createElement('input');
    this.searchInput.type = 'search';
    this.searchInput.placeholder = 'Search notes...';
    this.searchInput.className = 'mx-3 my-2 px-2 py-1 text-xs rounded shrink-0';
    this.searchInput.style.cssText = 'background:var(--surface-secondary);border:1px solid var(--border);color:var(--text);outline:none;';
    this.searchInput.setAttribute('aria-label', 'Search notes');
    this.searchInput.style.display = 'none';
    this.searchInput.addEventListener('input', () => {
      this.filterText = this.searchInput.value.toLowerCase();
      this.render(this.lastNotes, this.lastActiveId);
    });
    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.searchInput.value = '';
        this.filterText = '';
        this.render(this.lastNotes, this.lastActiveId);
        this.searchInput.blur();
      }
    });
    this.el.appendChild(this.searchInput);

    this.listEl = document.createElement('div');
    this.listEl.id = 'notes-list';
    this.listEl.className = 'flex-1 overflow-y-auto py-1';
    this.listEl.tabIndex = -1;
    this.el.appendChild(this.listEl);

    this.listEl.addEventListener('keydown', (e) => {
      const items = this.listEl.querySelectorAll<HTMLElement>('.note-item');
      if (items.length === 0) return;
      const focused = this.listEl.querySelector<HTMLElement>('.note-item:focus');

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        let idx = focused ? Array.from(items).indexOf(focused) : -1;
        idx = e.key === 'ArrowDown' ? Math.min(idx + 1, items.length - 1) : Math.max(idx - 1, 0);
        items[idx].focus();
        items[idx].scrollIntoView?.({block: 'nearest'});
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (focused) {
          const nid = focused.getAttribute('data-note-id');
          if (nid) this.callback(nid);
        }
      }
    });

    this.newNoteBtn = document.createElement('button');
    this.newNoteBtn.className = 'mx-3 mb-3 mt-2 py-1.5 text-xs rounded transition-colors shrink-0';
    this.newNoteBtn.style.cssText = 'color:var(--text-muted);background:var(--surface-secondary);';
    this.newNoteBtn.textContent = '+ New Note';
    this.newNoteBtn.setAttribute('aria-label', 'Create new note');
    this.el.appendChild(this.newNoteBtn);

    this.newNoteBtn.addEventListener('click', onNewNote);

    this.addHover(this.newNoteBtn);
  }

  setDirty(id: string, dirty: boolean): void {
    if (dirty) {
      this.dirtyIds.add(id);
    } else {
      this.dirtyIds.delete(id);
    }
    this.render(this.lastNotes, this.lastActiveId);
  }

  private filteredNotes(notes: Note[]): Note[] {
    if (!this.filterText) return notes;
    return notes.filter(n => n.name.toLowerCase().includes(this.filterText));
  }

  render(notes: Note[], activeId?: string): void {
    this.lastNotes = notes;
    this.lastActiveId = activeId ?? this.lastActiveId;
    const filtered = this.filteredNotes(notes);
    this.searchInput.style.display = notes.length > 1 ? '' : 'none';
    if (filtered.length === 0 && this.filterText) {
      this.listEl.innerHTML = `<div class="px-3 py-2 text-xs" style="color:var(--text-muted)">No matching notes</div>`;
      return;
    }
    let dragId: string | null = null;

    this.listEl.innerHTML = filtered
      .map(
        n => {
          const isActive = n.id === (activeId ?? '');
          const dirty = this.dirtyIds.has(n.id);
          const dot = dirty ? `<span class="note-dirty" style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--accent);margin-right:6px;flex-shrink:0;vertical-align:middle;"></span>` : '';
          return `<div class="note-item px-3 py-1.5 text-sm cursor-pointer flex items-center" draggable="true" tabindex="-1" data-note-id="${n.id}" style="color:${isActive ? 'var(--text)' : 'var(--text-muted)'};background:${isActive ? 'var(--note-bg)' : 'transparent'}">${dot}<span class="truncate">${escapeHtml(n.name)}</span></div>`;
        }
      )
      .join('');
    this.listEl.querySelectorAll('.note-item').forEach(el => {
      const e = el as HTMLElement;
      const nid = e.dataset.noteId!;
      e.addEventListener('mouseenter', () => { if (nid !== activeId) { e.style.color = 'var(--note-text)'; e.style.background = 'var(--note-hover)'; } });
      e.addEventListener('mouseleave', () => { if (nid !== activeId) { e.style.color = 'var(--text-muted)'; e.style.background = 'transparent'; } });
      e.addEventListener('click', () => this.callback(nid));
      e.addEventListener('contextmenu', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        this.showContextMenu(nid, ev.clientX, ev.clientY);
      });
      e.addEventListener('dragstart', () => {
        dragId = nid;
        e.style.opacity = '0.4';
      });
      e.addEventListener('dragend', () => {
        dragId = null;
        e.style.opacity = '';
        this.listEl.querySelectorAll('.note-item').forEach(item => {
          (item as HTMLElement).style.borderTop = '';
        });
      });
      e.addEventListener('dragover', (ev) => {
        ev.preventDefault();
      });
      e.addEventListener('dragenter', (ev) => {
        ev.preventDefault();
        if (dragId && dragId !== nid) {
          e.style.borderTop = '2px solid var(--accent)';
        }
      });
      e.addEventListener('dragleave', () => {
        e.style.borderTop = '';
      });
      e.addEventListener('drop', () => {
        e.style.borderTop = '';
        if (!dragId || dragId === nid) return;
        const ids = filtered.map(n => n.id);
        const fromIdx = ids.indexOf(dragId);
        const toIdx = ids.indexOf(nid);
        if (fromIdx === -1 || toIdx === -1) return;
        ids.splice(fromIdx, 1);
        ids.splice(toIdx, 0, dragId);
        this.actions.reorder(ids);
      });
    });
  }

  destroy(): void {
    this.ctxMenu.destroy();
  }

  private showContextMenu(id: string, x: number, y: number): void {
          const formatLabels: Record<string, string> = {
            lv: '.lv',
            txt: '.txt',
            md: '.md',
            json: '.json',
            toml: '.toml',
            pdf: '.pdf',
          };
    const exportChildren = Object.entries(formatLabels).map(([fmt, label]) => ({
      label,
      action: () => this.actions.exportNote(id, fmt),
    }));

    const icons = {
      rename: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>',
      delete: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>',
      export: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>',
      share: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/></svg>',
      import: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>',
    };

    this.ctxMenu.show([
      {
        label: 'Rename',
        icon: icons.rename,
        action: () => this.startRename(id),
      },
      {
        label: 'Delete',
        icon: icons.delete,
        action: () => this.actions.del(id),
      },
      {
        label: 'Export',
        icon: icons.export,
        children: exportChildren,
      },
      {
        label: 'Import',
        icon: icons.import,
        action: () => this.actions.importNote(),
      },
      {
        label: 'Share',
        icon: icons.share,
        action: () => this.actions.share(id),
      },
    ], x, y);
  }

  private startRename(id: string): void {
    const items = this.listEl.querySelectorAll('.note-item');
    items.forEach(el => {
      const e = el as HTMLElement;
      if (e.dataset.noteId === id) {
        const currentName = e.textContent || '';
        e.innerHTML = '';
        e.style.padding = '2px 8px';

        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.style.cssText =
          'width:100%;background:var(--surface-secondary);border:1px solid var(--accent);border-radius:4px;padding:2px 6px;font-size:13px;color:var(--text);outline:none;';
        input.select();

        const finish = () => {
          const newName = input.value.trim() || currentName;
          this.actions.rename(id, newName);
        };

        input.addEventListener('blur', finish);
        input.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter') {
            input.blur();
          } else if (ev.key === 'Escape') {
            input.value = currentName;
            input.blur();
          }
        });

        e.appendChild(input);
        input.focus();
      }
    });
  }

  focusSearch(): void {
    if (!this.isOpen()) this.open();
    this.searchInput.style.display = '';
    this.searchInput.focus();
    this.searchInput.select();
  }

  open(): void {
    this.el.style.width = '200px';
    this.el.style.borderRightWidth = '1px';
    if (this.lastNotes.length > 1) this.searchInput.style.display = '';
    this.listEl.focus();
    setTimeout(() => this.listEl.focus(), 0);
  }

  close(): void {
    this.el.style.width = '0';
    this.el.style.borderRightWidth = '0';
  }

  isOpen(): boolean {
    return this.el.style.width !== '0px';
  }

  private addHover(btn: HTMLElement): void {
    btn.addEventListener('mouseenter', () => { btn.style.background = 'var(--surface-hover)'; btn.style.color = 'var(--text)'; });
    btn.addEventListener('mouseleave', () => { btn.style.background = 'var(--surface-secondary)'; btn.style.color = 'var(--text-muted)'; });
  }
}
