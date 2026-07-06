import type {Note} from '../types';

export class NotesPanel {
  readonly el: HTMLElement;
  readonly listEl: HTMLDivElement;
  readonly newNoteBtn: HTMLButtonElement;
  private callback: (id: string) => void;

  constructor(onSwitchNote: (id: string) => void, onNewNote: () => void) {
    this.callback = onSwitchNote;

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

    this.listEl = document.createElement('div');
    this.listEl.id = 'notes-list';
    this.listEl.className = 'flex-1 overflow-y-auto py-1';
    this.el.appendChild(this.listEl);

    this.newNoteBtn = document.createElement('button');
    this.newNoteBtn.className = 'mx-3 mb-3 mt-2 py-1.5 text-xs rounded transition-colors shrink-0';
    this.newNoteBtn.style.cssText = 'color:var(--text-muted);background:var(--surface-secondary);';
    this.newNoteBtn.textContent = '+ New Note';
    this.el.appendChild(this.newNoteBtn);

    this.newNoteBtn.addEventListener('click', onNewNote);

    this.addHover(this.newNoteBtn);
  }

  render(notes: Note[], activeId: string): void {
    this.listEl.innerHTML = notes
      .map(
        n =>
          `<div class="note-item px-3 py-1.5 text-sm cursor-pointer" data-note-id="${n.id}" style="color:${n.id === activeId ? 'var(--text)' : 'var(--text-muted)'};background:${n.id === activeId ? 'var(--note-bg)' : 'transparent'}">${this.escape(n.name)}</div>`
      )
      .join('');
    this.listEl.querySelectorAll('.note-item').forEach(el => {
      const e = el as HTMLElement;
      e.addEventListener('mouseenter', () => { if (e.dataset.noteId !== activeId) { e.style.color = 'var(--note-text)'; e.style.background = 'var(--note-hover)'; } });
      e.addEventListener('mouseleave', () => { if (e.dataset.noteId !== activeId) { e.style.color = 'var(--text-muted)'; e.style.background = 'transparent'; } });
      e.addEventListener('click', () => this.callback(e.dataset.noteId!));
    });
  }

  open(): void {
    this.el.style.width = '200px';
    this.el.style.borderRightWidth = '1px';
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

  private escape(t: string): string {
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
  }
}
