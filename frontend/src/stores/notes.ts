import type { Note, Folder, TreeNode } from '../types';
import { toast } from '../utils/toast';

export type SortField = 'name' | 'created' | 'updated';
export type SortDir = 'asc' | 'desc';

const EXPANDED_KEY = 'lineSolv-expanded-folders';

function loadExpandedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(EXPANDED_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {
    toast.show('Failed to load expanded folders', 'error');
  }
  return new Set<string>();
}

function saveExpandedIds(ids: Set<string>): void {
  localStorage.setItem(EXPANDED_KEY, JSON.stringify([...ids]));
}

/** Manages multiple notes in memory with active-note tracking. */
export class NotesManager {
  private notes: Note[] = [];
  private folders: Folder[] = [];
  private activeId = '';
  private sortField: SortField = 'updated';
  private sortDir: SortDir = 'desc';
  private expandedFolders: Set<string> = loadExpandedIds();

  getSortField(): SortField {
    return this.sortField;
  }
  getSortDir(): SortDir {
    return this.sortDir;
  }

  setSort(field: SortField, dir: SortDir): void {
    this.sortField = field;
    this.sortDir = dir;
    this.sortNotes();
  }

  // ── Notes ────────────────────────────────────────────────────────

  getNotes(): Note[] {
    return [...this.notes];
  }

  getActiveId(): string {
    return this.activeId;
  }

  activeNote(): Note | undefined {
    return this.notes.find((n) => n.id === this.activeId) ?? this.notes[0];
  }

  load(notes: Note[], activeId: string): void {
    this.notes = notes || [];
    this.activeId = activeId || (this.notes[0]?.id ?? '');
    this.sortNotes();
  }

  private sortNotes(): void {
    const dir = this.sortDir === 'asc' ? 1 : -1;
    this.notes.sort((a, b) => {
      switch (this.sortField) {
        case 'name':
          return dir * a.name.localeCompare(b.name);
        case 'created':
          return dir * (a.createdAt - b.createdAt);
        case 'updated':
          return dir * (a.updatedAt - b.updatedAt);
        default:
          return 0;
      }
    });
  }

  addNote(note: Note): void {
    this.notes.push(note);
    this.activeId = note.id;
    this.sortNotes();
  }

  removeNote(id: string): boolean {
    const idx = this.notes.findIndex((n) => n.id === id);
    if (idx === -1) return false;
    this.notes.splice(idx, 1);
    if (this.activeId === id) {
      this.activeId = this.notes[0]?.id ?? '';
    }
    return true;
  }

  renameNote(id: string, name: string): boolean {
    const note = this.notes.find((n) => n.id === id);
    if (!note) return false;
    note.name = name;
    this.sortNotes();
    return true;
  }

  switchNote(id: string): boolean {
    if (id === this.activeId || !this.notes.find((n) => n.id === id)) return false;
    this.activeId = id;
    return true;
  }

  setActiveContent(content: string): void {
    const note = this.activeNote();
    if (note) note.content = content;
  }

  // ── Folders ──────────────────────────────────────────────────────

  loadFolders(folders: Folder[]): void {
    this.folders = folders || [];
    this.folders.sort((a, b) => a.position - b.position);
  }

  getFolders(): Folder[] {
    return [...this.folders];
  }

  addFolder(folder: Folder): void {
    this.folders.push(folder);
    this.folders.sort((a, b) => a.position - b.position);
  }

  removeFolder(id: string): boolean {
    const idx = this.folders.findIndex((f) => f.id === id);
    if (idx === -1) return false;
    this.folders.splice(idx, 1);
    this.expandedFolders.delete(id);
    saveExpandedIds(this.expandedFolders);
    return true;
  }

  renameFolder(id: string, name: string): boolean {
    const folder = this.folders.find((f) => f.id === id);
    if (!folder) return false;
    folder.name = name;
    return true;
  }

  updateFolderIcon(id: string, icon: string): boolean {
    const folder = this.folders.find((f) => f.id === id);
    if (!folder) return false;
    folder.icon = icon;
    return true;
  }

  moveNoteToFolder(noteId: string, folderId: string): boolean {
    const note = this.notes.find((n) => n.id === noteId);
    if (!note) return false;
    note.folderId = folderId;
    return true;
  }

  moveFolder(folderId: string, newParentId: string): boolean {
    const folder = this.folders.find((f) => f.id === folderId);
    if (!folder) return false;
    folder.parentId = newParentId;
    return true;
  }

  getFolder(id: string): Folder | undefined {
    return this.folders.find((f) => f.id === id);
  }

  // ── Expanded state ───────────────────────────────────────────────

  isFolderExpanded(id: string): boolean {
    return this.expandedFolders.has(id);
  }

  toggleFolder(id: string): boolean {
    if (this.expandedFolders.has(id)) {
      this.expandedFolders.delete(id);
    } else {
      this.expandedFolders.add(id);
    }
    saveExpandedIds(this.expandedFolders);
    return this.expandedFolders.has(id);
  }

  expandFolder(id: string): void {
    this.expandedFolders.add(id);
    saveExpandedIds(this.expandedFolders);
  }

  collapseFolder(id: string): void {
    this.expandedFolders.delete(id);
    saveExpandedIds(this.expandedFolders);
  }

  getExpandedFolders(): Set<string> {
    return new Set(this.expandedFolders);
  }

  // ── Tree building ────────────────────────────────────────────────

  buildTree(): TreeNode[] {
    if (!this.folders) this.folders = [];
    if (!this.notes) this.notes = [];

    const folderMap = new Map<string, Folder[]>();
    for (const folder of this.folders) {
      const key = folder.parentId || '';
      if (!folderMap.has(key)) folderMap.set(key, []);
      folderMap.get(key)!.push(folder);
    }

    const notesByFolder = new Map<string, Note[]>();
    for (const note of this.notes) {
      const key = note.folderId || '';
      if (!notesByFolder.has(key)) notesByFolder.set(key, []);
      notesByFolder.get(key)!.push(note);
    }

    const sortDir = this.sortDir === 'asc' ? 1 : -1;

    const sortNotes = (a: Note, b: Note): number => {
      switch (this.sortField) {
        case 'name':
          return sortDir * a.name.localeCompare(b.name);
        case 'created':
          return sortDir * (a.createdAt - b.createdAt);
        case 'updated':
          return sortDir * (a.updatedAt - b.updatedAt);
        default:
          return a.position - b.position;
      }
    };

    const sortFolders = (a: Folder, b: Folder): number => {
      switch (this.sortField) {
        case 'name':
          return sortDir * a.name.localeCompare(b.name);
        case 'created':
          return sortDir * (a.createdAt - b.createdAt);
        case 'updated':
          return sortDir * (a.updatedAt - b.updatedAt);
        default:
          return a.position - b.position;
      }
    };

    const buildLevel = (parentId: string, depth: number): TreeNode[] => {
      const folders = (folderMap.get(parentId) || []).sort(sortFolders);
      const notes = (notesByFolder.get(parentId) || []).sort(sortNotes);

      const nodes: TreeNode[] = [];

      for (const folder of folders) {
        const children = this.expandedFolders.has(folder.id)
          ? buildLevel(folder.id, depth + 1)
          : [];
        nodes.push({ type: 'folder', folder, children, depth });
      }

      for (const note of notes) {
        nodes.push({ type: 'note', note, depth });
      }

      return nodes;
    };

    return buildLevel('', 0);
  }
}
