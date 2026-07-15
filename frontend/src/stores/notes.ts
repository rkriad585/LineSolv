import type {Note} from '../types';

export type SortField = 'name' | 'created' | 'updated';
export type SortDir = 'asc' | 'desc';

/** Manages multiple notes in memory with active-note tracking. */
export class NotesManager {
  private notes: Note[] = [];
  private activeId = '';
  private sortField: SortField = 'updated';
  private sortDir: SortDir = 'desc';

  getSortField(): SortField { return this.sortField; }
  getSortDir(): SortDir { return this.sortDir; }

  setSort(field: SortField, dir: SortDir): void {
    this.sortField = field;
    this.sortDir = dir;
    this.sortNotes();
  }

  getNotes(): Note[] {
    return [...this.notes];
  }

  getActiveId(): string {
    return this.activeId;
  }

  activeNote(): Note {
    return this.notes.find(n => n.id === this.activeId) ?? this.notes[0];
  }

  load(notes: Note[], activeId: string): void {
    this.notes = notes;
    this.activeId = activeId || (notes[0]?.id ?? '');
    this.sortNotes();
  }

  private sortNotes(): void {
    const dir = this.sortDir === 'asc' ? 1 : -1;
    this.notes.sort((a, b) => {
      switch (this.sortField) {
        case 'name': return dir * a.name.localeCompare(b.name);
        case 'created': return dir * (a.createdAt - b.createdAt);
        case 'updated': return dir * (a.updatedAt - b.updatedAt);
        default: return 0;
      }
    });
  }

  addNote(note: Note): void {
    this.notes.push(note);
    this.activeId = note.id;
    this.sortNotes();
  }

  removeNote(id: string): boolean {
    const idx = this.notes.findIndex(n => n.id === id);
    if (idx === -1) return false;
    this.notes.splice(idx, 1);
    if (this.activeId === id) {
      this.activeId = this.notes[0]?.id ?? '';
    }
    return true;
  }

  renameNote(id: string, name: string): boolean {
    const note = this.notes.find(n => n.id === id);
    if (!note) return false;
    note.name = name;
    this.sortNotes();
    return true;
  }

  switchNote(id: string): boolean {
    if (id === this.activeId || !this.notes.find(n => n.id === id)) return false;
    this.activeId = id;
    return true;
  }

  saveContent(content: string): void {
    const note = this.activeNote();
    if (note) note.content = content;
  }

  setActiveContent(content: string): void {
    const note = this.activeNote();
    if (note) note.content = content;
  }
}
