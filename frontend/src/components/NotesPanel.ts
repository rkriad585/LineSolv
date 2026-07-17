import type { TreeNode, ContextMenuItem } from '../types';
import type { SortField, SortDir } from '../stores/notes';
import { escapeHtml } from '../utils/html';
import { ContextMenu } from './ContextMenu';
import { Icons, getFolderIcon, getNoteIcon } from './Icons';

type NoteAction = {
  rename: (id: string, name: string) => void;
  del: (id: string) => void;
  exportNote: (id: string, format: string) => void;
  share: (id: string) => void;
  importNote: () => void;
  newNoteInFolder: (folderId: string) => void;
  newFolder: (parentId: string) => void;
  renameFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  toggleFolder: (id: string) => void;
  isFolderExpanded: (id: string) => boolean;
  sort?: (field: SortField, dir: SortDir) => void;
  moveNoteToFolder?: (noteId: string, folderId: string) => void;
  moveFolder?: (folderId: string, newParentId: string) => void;
  reorderNotes?: (noteIds: string[]) => void;
  reorderFolders?: (folderIds: string[]) => void;
  updateFolderIcon?: (folderId: string, icon: string) => void;
  duplicateNote?: (noteId: string) => void;
  duplicateFolder?: (folderId: string) => void;
  updateNoteIcon?: (noteId: string, icon: string) => void;
  getNotes?: () => Array<{ id: string; folderId: string }>;
  getFolders?: () => Array<{ id: string; name: string; parentId: string; icon: string }>;
  isDragAndDropEnabled?: () => boolean;
  isContextMenuNotesEnabled?: () => boolean;
  isContextMenuFoldersEnabled?: () => boolean;
};

export class NotesPanel {
  readonly el: HTMLElement;
  readonly listEl: HTMLDivElement;
  readonly newNoteBtn: HTMLButtonElement;
  readonly newFolderBtn: HTMLButtonElement;
  private callback: (id: string) => void;
  private ctxMenu: ContextMenu;
  private actions: NoteAction;
  private searchInput: HTMLInputElement;
  private filterText = '';
  private dirtyIds = new Set<string>();
  private lastTree: TreeNode[] = [];
  private lastActiveId = '';
  private needsRender = true;
  private sortField: SortField = 'updated';
  private sortDir: SortDir = 'desc';
  private sortBtn: HTMLButtonElement;
  private searchTimer = 0;

  constructor(onSwitchNote: (id: string) => void, onNewNote: () => void, actions: NoteAction) {
    this.callback = onSwitchNote;
    this.actions = actions;

    this.ctxMenu = new ContextMenu();

    this.el = document.createElement('aside');
    this.el.id = 'notes-sidebar';
    this.el.className =
      'shrink-0 flex flex-col overflow-hidden transition-all duration-150 ease-out';
    this.el.style.cssText = 'width:0px;border-right:0;background:var(--surface);position:relative;';
    this.el.style.borderRightWidth = '0';

    const header = document.createElement('div');
    header.className =
      'px-4 py-2.5 text-[10px] font-semibold tracking-wider uppercase border-b shrink-0 flex items-center justify-between';
    header.style.cssText = 'color:var(--text-muted);border-color:var(--border);';
    const headerTitle = document.createElement('span');
    headerTitle.textContent = 'Notes';
    const closeHeaderBtn = document.createElement('button');
    closeHeaderBtn.innerHTML = Icons.close();
    closeHeaderBtn.title = 'Close notes';
    closeHeaderBtn.style.cssText =
      'display:flex;align-items:center;justify-content:center;width:18px;height:18px;' +
      'border:none;border-radius:3px;background:transparent;color:var(--text-muted);cursor:pointer;outline:none;';
    closeHeaderBtn.addEventListener('click', () => this.close());
    header.append(headerTitle, closeHeaderBtn);
    this.el.appendChild(header);

    this.searchInput = document.createElement('input');
    this.searchInput.type = 'search';
    this.searchInput.placeholder = 'Search notes...';
    this.searchInput.className = 'mx-3 my-2 px-2 py-1 text-xs rounded shrink-0 no-focus-ring';
    this.searchInput.style.cssText =
      'background:var(--surface-secondary);border:1px solid var(--border);color:var(--text);outline:none;';
    this.searchInput.setAttribute('aria-label', 'Search notes');
    this.searchInput.style.display = 'none';
    this.searchInput.addEventListener('input', () => {
      this.filterText = this.searchInput.value.toLowerCase();
      this.needsRender = true;
      if (this.searchTimer) clearTimeout(this.searchTimer);
      this.searchTimer = window.setTimeout(() => {
        this.searchTimer = 0;
        if (this.isOpen()) this.renderNow();
      }, 100);
    });
    this.searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.searchInput.value = '';
        this.filterText = '';
        this.needsRender = true;
        if (this.isOpen()) this.renderNow();
        this.searchInput.blur();
      }
    });
    this.el.appendChild(this.searchInput);

    // Sort button
    this.sortBtn = document.createElement('button');
    this.sortBtn.className =
      'mx-3 mb-1.5 px-2 py-1 text-[10px] rounded transition-colors shrink-0 flex items-center gap-1';
    this.sortBtn.style.cssText = 'color:var(--text-muted);background:var(--surface-secondary);';
    this.sortBtn.setAttribute('aria-label', 'Sort notes');
    this.updateSortButtonLabel();
    this.el.appendChild(this.sortBtn);

    this.sortBtn.addEventListener('click', () => this.cycleSort());
    this.addHover(this.sortBtn);

    this.listEl = document.createElement('div');
    this.listEl.id = 'notes-list';
    this.listEl.className = 'flex-1 overflow-y-auto py-1';
    this.listEl.tabIndex = -1;
    this.el.appendChild(this.listEl);

    // Resize handle
    const resizeHandle = document.createElement('div');
    resizeHandle.style.cssText =
      'position:absolute;top:0;right:0;width:4px;height:100%;cursor:col-resize;z-index:10;' +
      'transition:background 0.15s;';
    resizeHandle.addEventListener('mouseenter', () => {
      resizeHandle.style.background = 'var(--accent)';
    });
    resizeHandle.addEventListener('mouseleave', () => {
      resizeHandle.style.background = 'transparent';
    });
    let dragging = false;
    let startX = 0;
    let startWidth = 0;
    resizeHandle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      dragging = true;
      startX = e.clientX;
      startWidth = this.el.offsetWidth;
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      const onMouseMove = (ev: MouseEvent) => {
        if (!dragging) return;
        const delta = ev.clientX - startX;
        const newWidth = Math.min(400, Math.max(150, startWidth + delta));
        this.el.style.width = newWidth + 'px';
      };
      const onMouseUp = () => {
        dragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    });
    this.el.appendChild(resizeHandle);

    this.listEl.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      // Folder click — toggle expand/collapse
      const folderItem = target.closest('.folder-item') as HTMLElement | null;
      if (folderItem) {
        const folderId = folderItem.dataset.folderId;
        if (folderId) {
          this.actions.toggleFolder(folderId);
          // Re-focus the folder item after re-render
          requestAnimationFrame(() => {
            const el = this.listEl.querySelector(
              `[data-folder-id="${folderId}"]`,
            ) as HTMLElement | null;
            if (el) el.focus();
          });
        }
        return;
      }

      // Note click — switch to note
      const noteItem = target.closest('.note-item') as HTMLElement | null;
      if (noteItem) {
        const nid = noteItem.dataset.noteId;
        if (nid) this.callback(nid);
      }
    });

    this.listEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const target = e.target as HTMLElement;

      // Folder context menu
      const folderItem = target.closest('.folder-item') as HTMLElement | null;
      if (folderItem) {
        const folderId = folderItem.dataset.folderId;
        if (folderId) this.showFolderContextMenu(folderId, e.clientX, e.clientY);
        return;
      }

      // Note context menu
      const noteItem = target.closest('.note-item') as HTMLElement | null;
      if (noteItem) {
        const nid = noteItem.dataset.noteId;
        if (nid) this.showContextMenu(nid, e.clientX, e.clientY);
      }
    });

    this.listEl.addEventListener('mouseover', () => {
      // Hover styles handled by CSS (.note-item:hover, .folder-item:hover)
    });

    this.listEl.addEventListener('mouseout', () => {
      // Hover styles handled by CSS (.note-item:hover, .folder-item:hover)
    });

    this.listEl.addEventListener('keydown', (e) => {
      const items = this.listEl.querySelectorAll<HTMLElement>('.note-item, .folder-item');
      if (items.length === 0) return;
      const focused = this.listEl.querySelector<HTMLElement>(
        '.note-item:focus, .folder-item:focus',
      );

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        let idx = focused ? Array.from(items).indexOf(focused) : -1;
        idx = e.key === 'ArrowDown' ? Math.min(idx + 1, items.length - 1) : Math.max(idx - 1, 0);
        items[idx].focus();
        items[idx].scrollIntoView?.({ block: 'nearest' });
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (focused && focused.classList.contains('folder-item')) {
          const folderId = focused.dataset.folderId;
          if (folderId && !this.actions.isFolderExpanded(folderId)) {
            this.actions.toggleFolder(folderId);
            requestAnimationFrame(() => {
              const el = this.listEl.querySelector(
                `[data-folder-id="${folderId}"]`,
              ) as HTMLElement | null;
              if (el) el.focus();
            });
          }
        }
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (focused && focused.classList.contains('folder-item')) {
          const folderId = focused.dataset.folderId;
          if (folderId && this.actions.isFolderExpanded(folderId)) {
            this.actions.toggleFolder(folderId);
            requestAnimationFrame(() => {
              const el = this.listEl.querySelector(
                `[data-folder-id="${folderId}"]`,
              ) as HTMLElement | null;
              if (el) el.focus();
            });
          }
        }
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (focused) {
          if (focused.classList.contains('folder-item')) {
            const folderId = focused.dataset.folderId;
            if (folderId) {
              this.actions.toggleFolder(folderId);
              requestAnimationFrame(() => {
                const el = this.listEl.querySelector(
                  `[data-folder-id="${folderId}"]`,
                ) as HTMLElement | null;
                if (el) el.focus();
              });
            }
          } else {
            const nid = focused.getAttribute('data-note-id');
            if (nid) this.callback(nid);
          }
        }
      }
    });

    // New Note button
    this.newNoteBtn = document.createElement('button');
    this.newNoteBtn.className =
      'mx-3 mb-1.5 mt-2 py-1.5 text-xs rounded transition-colors shrink-0';
    this.newNoteBtn.style.cssText = 'color:var(--text-muted);background:var(--surface-secondary);';
    this.newNoteBtn.textContent = '+ New Note';
    this.newNoteBtn.setAttribute('aria-label', 'Create new note');
    this.el.appendChild(this.newNoteBtn);
    this.newNoteBtn.addEventListener('click', onNewNote);
    this.addHover(this.newNoteBtn);

    // New Folder button
    this.newFolderBtn = document.createElement('button');
    this.newFolderBtn.className = 'mx-3 mb-3 py-1.5 text-xs rounded transition-colors shrink-0';
    this.newFolderBtn.style.cssText =
      'color:var(--text-muted);background:var(--surface-secondary);';
    this.newFolderBtn.textContent = '+ New Folder';
    this.newFolderBtn.setAttribute('aria-label', 'Create new folder');
    this.el.appendChild(this.newFolderBtn);
    this.newFolderBtn.addEventListener('click', () => this.actions.newFolder(''));
    this.addHover(this.newFolderBtn);

    // ── Drag-and-Drop ──────────────────────────────────────────────
    let draggedId = '';
    let draggedType: 'note' | 'folder' = 'note';

    this.listEl.addEventListener('dragstart', (e) => {
      if (this.actions.isDragAndDropEnabled && !this.actions.isDragAndDropEnabled()) return;
      const target = e.target as HTMLElement;
      const noteItem = target.closest('.note-item') as HTMLElement | null;
      const folderItem = target.closest('.folder-item') as HTMLElement | null;
      if (!noteItem && !folderItem) return;

      if (noteItem) {
        draggedId = noteItem.dataset.noteId || '';
        draggedType = 'note';
      } else {
        draggedId = folderItem!.dataset.folderId || '';
        draggedType = 'folder';
      }
      if (!draggedId) return;

      e.dataTransfer!.effectAllowed = 'move';
      e.dataTransfer!.setData('text/plain', draggedId);
      requestAnimationFrame(() => {
        if (noteItem) noteItem.classList.add('dragging');
        else folderItem!.classList.add('dragging');
      });
    });

    this.listEl.addEventListener('dragover', (e) => {
      if (this.actions.isDragAndDropEnabled && !this.actions.isDragAndDropEnabled()) return;
      if (!draggedId) return;
      const target = e.target as HTMLElement;
      const folderItem = target.closest('.folder-item') as HTMLElement | null;

      // Clear all previous drag-over indicators
      this.listEl.querySelectorAll('.drag-over').forEach((el) => el.classList.remove('drag-over'));

      if (folderItem) {
        const targetId = folderItem.dataset.folderId || '';
        // Don't allow dropping onto self
        if (targetId !== draggedId) {
          e.preventDefault();
          e.dataTransfer!.dropEffect = 'move';
          folderItem.classList.add('drag-over');
        }
      } else {
        // Allow drop to root (the list itself)
        e.preventDefault();
        e.dataTransfer!.dropEffect = 'move';
      }
    });

    this.listEl.addEventListener('dragleave', (e) => {
      const target = e.target as HTMLElement;
      const folderItem = target.closest('.folder-item') as HTMLElement | null;
      if (folderItem) folderItem.classList.remove('drag-over');
    });

    this.listEl.addEventListener('drop', (e) => {
      e.preventDefault();
      this.listEl.querySelectorAll('.drag-over').forEach((el) => el.classList.remove('drag-over'));
      if (!draggedId) return;

      const target = e.target as HTMLElement;
      const folderItem = target.closest('.folder-item') as HTMLElement | null;
      const noteItem = target.closest('.note-item') as HTMLElement | null;
      const targetFolderId = folderItem?.dataset.folderId || '';

      if (draggedType === 'note') {
        if (folderItem) {
          // Dropped on a folder → move note into that folder
          this.actions.moveNoteToFolder?.(draggedId, targetFolderId);
        } else if (noteItem && noteItem.dataset.noteId !== draggedId) {
          // Dropped on another note → reorder
          const targetNoteId = noteItem.dataset.noteId || '';
          const targetFolderId = noteItem.dataset.folderId || '';
          // Move note to target's folder first, then reorder
          this.actions.moveNoteToFolder?.(draggedId, targetFolderId);
          // Build new order: place dragged note before target note
          const allNotes = this.actions.getNotes ? this.actions.getNotes() : [];
          const siblings = allNotes.filter((n) => n.folderId === targetFolderId);
          const draggedIdx = siblings.findIndex((n) => n.id === draggedId);
          const targetIdx = siblings.findIndex((n) => n.id === targetNoteId);
          if (draggedIdx !== -1 && targetIdx !== -1 && draggedIdx !== targetIdx) {
            const reordered = [...siblings];
            const [moved] = reordered.splice(draggedIdx, 1);
            const insertIdx = draggedIdx < targetIdx ? targetIdx - 1 : targetIdx;
            reordered.splice(insertIdx, 0, moved);
            this.actions.reorderNotes?.(reordered.map((n) => n.id));
          }
        } else {
          // Dropped on root → move to root
          this.actions.moveNoteToFolder?.(draggedId, '');
        }
      } else if (draggedType === 'folder') {
        if (folderItem && folderItem.dataset.folderId !== draggedId) {
          const targetParentId = folderItem.dataset.parentId || '';
          const draggedParentId =
            (folderItem.closest('.folder-item') as HTMLElement | null)?.dataset.parentId || '';
          // Same parent → reorder
          if (targetParentId === draggedParentId) {
            const allFolders = this.actions.getFolders ? this.actions.getFolders() : [];
            const siblings = allFolders.filter((f) => f.parentId === targetParentId);
            const draggedIdx = siblings.findIndex((f) => f.id === draggedId);
            const targetIdx = siblings.findIndex((f) => f.id === folderItem.dataset.folderId);
            if (draggedIdx !== -1 && targetIdx !== -1 && draggedIdx !== targetIdx) {
              const reordered = [...siblings];
              const [moved] = reordered.splice(draggedIdx, 1);
              const insertIdx = draggedIdx < targetIdx ? targetIdx - 1 : targetIdx;
              reordered.splice(insertIdx, 0, moved);
              this.actions.reorderFolders?.(reordered.map((f) => f.id));
            }
          } else {
            // Different parent → move as child (with circular reference guard)
            if (!this.isDescendant(folderItem.dataset.folderId || '', draggedId)) {
              this.actions.moveFolder?.(draggedId, folderItem.dataset.folderId || '');
            }
          }
        } else {
          // Dropped on root → move to root
          this.actions.moveFolder?.(draggedId, '');
        }
      }

      draggedId = '';
      draggedType = 'note';
    });

    this.listEl.addEventListener('dragend', () => {
      this.listEl.querySelectorAll('.dragging').forEach((el) => el.classList.remove('dragging'));
      this.listEl.querySelectorAll('.drag-over').forEach((el) => el.classList.remove('drag-over'));
      draggedId = '';
      draggedType = 'note';
    });
  }

  setSort(field: SortField, dir: SortDir): void {
    this.sortField = field;
    this.sortDir = dir;
    this.updateSortButtonLabel();
    this.needsRender = true;
    if (this.isOpen()) this.renderNow();
  }

  private updateSortButtonLabel(): void {
    const labels: Record<string, string> = {
      name: 'Name',
      created: 'Created',
      updated: 'Updated',
    };
    const arrow = this.sortDir === 'asc' ? '\u2191' : '\u2193';
    this.sortBtn.textContent = `${labels[this.sortField] || 'Updated'} ${arrow}`;
  }

  private cycleSort(): void {
    const fields: SortField[] = ['updated', 'name', 'created'];
    const dirs: SortDir[] = ['desc', 'asc'];
    const fieldIdx = fields.indexOf(this.sortField);
    const dirIdx = dirs.indexOf(this.sortDir);
    // Cycle: field changes first, then direction toggles when wrapping
    let nextFieldIdx = fieldIdx;
    let nextDirIdx = dirIdx;
    if (dirIdx === 0) {
      // Current direction is desc, switch to asc for same field
      nextDirIdx = 1;
    } else {
      // Current direction is asc, move to next field with desc
      nextFieldIdx = (fieldIdx + 1) % fields.length;
      nextDirIdx = 0;
    }
    this.sortField = fields[nextFieldIdx];
    this.sortDir = dirs[nextDirIdx];
    this.updateSortButtonLabel();
    if (this.actions.sort) {
      this.actions.sort(this.sortField, this.sortDir);
    }
  }

  setDirty(id: string, dirty: boolean): void {
    if (dirty) {
      this.dirtyIds.add(id);
    } else {
      this.dirtyIds.delete(id);
    }
    this.needsRender = true;
    if (this.isOpen()) this.renderNow();
  }

  private filterTree(tree: TreeNode[]): TreeNode[] {
    if (!this.filterText) return tree;
    const results: TreeNode[] = [];
    for (const node of tree) {
      if (node.type === 'note') {
        if (node.note.name.toLowerCase().includes(this.filterText)) {
          results.push(node);
        }
      } else {
        const filteredChildren = this.filterTree(node.children);
        if (
          filteredChildren.length > 0 ||
          node.folder.name.toLowerCase().includes(this.filterText)
        ) {
          results.push({
            type: 'folder',
            folder: node.folder,
            children: filteredChildren,
            depth: node.depth,
          });
        }
      }
    }
    return results;
  }

  private countNotesInTree(tree: TreeNode[]): number {
    let count = 0;
    for (const node of tree) {
      if (node.type === 'note') count++;
      else count += this.countNotesInTree(node.children);
    }
    return count;
  }

  render(tree: TreeNode[], activeId?: string, sortField?: SortField, sortDir?: SortDir): void {
    this.lastTree = tree;
    this.lastActiveId = activeId ?? this.lastActiveId;
    if (sortField) this.sortField = sortField;
    if (sortDir) this.sortDir = sortDir;
    this.updateSortButtonLabel();
    if (!this.isOpen()) {
      this.needsRender = true;
      return;
    }
    this.renderNow();
  }

  private renderNow(): void {
    this.needsRender = false;
    const tree = this.lastTree;
    const activeId = this.lastActiveId;
    const filtered = this.filterTree(tree);
    const totalNotes = this.countNotesInTree(tree);
    this.searchInput.style.display = totalNotes >= 1 ? '' : 'none';

    if (filtered.length === 0 && this.filterText) {
      this.listEl.innerHTML = `<div class="px-3 py-2 text-xs" style="color:var(--text-muted)">No matching notes</div>`;
      return;
    }

    if (filtered.length === 0 && !this.filterText) {
      this.listEl.innerHTML = `<div class="px-3 py-2 text-xs" style="color:var(--text-muted)">No notes yet</div>`;
      return;
    }

    this.listEl.innerHTML = this.renderNodes(filtered, activeId);
  }

  private renderNodes(nodes: TreeNode[], activeId: string): string {
    let html = '';
    for (const node of nodes) {
      if (node.type === 'folder') {
        html += this.renderFolder(node, activeId);
      } else {
        html += this.renderNote(node, activeId);
      }
    }
    return html;
  }

  private renderFolder(node: Extract<TreeNode, { type: 'folder' }>, activeId: string): string {
    const { folder, children, depth } = node;
    const isExpanded = this.actions.isFolderExpanded(folder.id);
    const chevron = isExpanded ? Icons.chevronDown() : Icons.chevronRight();
    const icon = getFolderIcon(folder.icon);
    const noteCount = this.countNotesInTree(children);
    const countBadge =
      noteCount > 0
        ? `<span class="ml-auto mr-2 text-[10px] px-1.5 py-0.5 rounded" style="color:var(--text-muted);background:var(--surface-secondary);">${noteCount}</span>`
        : '';
    const paddingLeft = 12 + depth * 16;
    const isDraggable = this.actions.isDragAndDropEnabled
      ? this.actions.isDragAndDropEnabled()
      : true;

    const childrenHtml = isExpanded ? this.renderNodes(children, activeId) : '';

    return `<div class="folder-item px-2 py-1.5 text-sm cursor-pointer flex items-center" tabindex="-1" data-folder-id="${folder.id}" data-parent-id="${folder.parentId || ''}" draggable="${isDraggable}" style="padding-left:${paddingLeft}px;color:var(--text-muted);">
      <span class="drag-handle" style="width:14px;height:14px;display:flex;align-items:center;cursor:grab;opacity:0;transition:opacity 0.15s;flex-shrink:0;margin-right:2px;">${Icons.dragHandle()}</span>
      <span class="folder-chevron mr-1 flex-shrink-0" style="width:14px;height:14px;display:flex;align-items:center;">${chevron}</span>
      <span class="folder-icon mr-1.5 flex-shrink-0" style="width:14px;height:14px;display:flex;align-items:center;color:var(--accent);">${icon}</span>
      <span class="truncate flex-1">${escapeHtml(folder.name)}</span>
      ${countBadge}
    </div>
    ${childrenHtml}`;
  }

  private renderNote(node: Extract<TreeNode, { type: 'note' }>, activeId: string): string {
    const { note, depth } = node;
    const isActive = note.id === activeId;
    const dirty = this.dirtyIds.has(note.id);
    const dot = dirty
      ? `<span class="note-dirty" style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--accent);margin-right:6px;flex-shrink:0;vertical-align:middle;"></span>`
      : '';
    const paddingLeft = 12 + depth * 16;
    const isDraggable = this.actions.isDragAndDropEnabled
      ? this.actions.isDragAndDropEnabled()
      : true;
    const icon = note.icon ? getNoteIcon(note.icon) : '';

    return `<div class="note-item px-3 py-1.5 text-sm cursor-pointer flex items-center" tabindex="-1" data-note-id="${note.id}" data-folder-id="${note.folderId || ''}" draggable="${isDraggable}" style="padding-left:${paddingLeft}px;color:${isActive ? 'var(--text)' : 'var(--text-muted)'};background:${isActive ? 'var(--note-bg)' : 'transparent'}"><span class="drag-handle" style="width:14px;height:14px;display:flex;align-items:center;cursor:grab;opacity:0;transition:opacity 0.15s;flex-shrink:0;margin-right:2px;">${Icons.dragHandle()}</span>${icon ? `<span class="note-icon mr-1.5 flex-shrink-0" style="width:14px;height:14px;display:flex;align-items:center;color:var(--accent);">${icon}</span>` : ''}${dot}<span class="truncate">${escapeHtml(note.name)}</span></div>`;
  }

  private isDescendant(childFolderId: string, ancestorFolderId: string): boolean {
    const folders = this.actions.getFolders ? this.actions.getFolders() : [];
    const map = new Map(folders.map((f) => [f.id, f]));
    let current = map.get(childFolderId);
    while (current) {
      if (current.id === ancestorFolderId) return true;
      current = current.parentId ? map.get(current.parentId) : undefined;
    }
    return false;
  }

  destroy(): void {
    this.ctxMenu.destroy();
  }

  private showContextMenu(id: string, x: number, y: number): void {
    if (this.actions.isContextMenuNotesEnabled && !this.actions.isContextMenuNotesEnabled()) return;

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

    const folders = this.actions.getFolders ? this.actions.getFolders() : [];
    const moveToChildren: Array<{ label: string; icon?: string; action: () => void }> = folders.map(
      (f) => ({
        label: f.name,
        icon: getFolderIcon(f.icon),
        action: () => this.actions.moveNoteToFolder?.(id, f.id),
      }),
    );
    moveToChildren.unshift({
      label: 'Root',
      icon: Icons.folder(),
      action: () => this.actions.moveNoteToFolder?.(id, ''),
    });

    const iconOptions = [
      { id: 'document', label: 'Document', icon: Icons.fileText() },
      { id: 'code', label: 'Code', icon: Icons.code() },
      { id: 'pencil', label: 'Note', icon: Icons.pencil() },
      { id: 'star', label: 'Star', icon: Icons.star() },
      { id: 'heart', label: 'Heart', icon: Icons.heart() },
      { id: 'bookmark', label: 'Bookmark', icon: Icons.bookmark() },
      { id: 'tag', label: 'Tag', icon: Icons.tag() },
      { id: 'clock', label: 'Clock', icon: Icons.clock() },
      { id: 'lightbulb', label: 'Idea', icon: Icons.lightbulb() },
      { id: 'mail', label: 'Mail', icon: Icons.mail() },
      { id: 'message', label: 'Message', icon: Icons.message() },
      { id: 'image', label: 'Image', icon: Icons.image() },
      { id: 'music', label: 'Music', icon: Icons.music() },
      { id: 'shield', label: 'Shield', icon: Icons.shield() },
      { id: 'gift', label: 'Gift', icon: Icons.gift() },
      { id: 'flame', label: 'Fire', icon: Icons.flame() },
      { id: 'zap', label: 'Bolt', icon: Icons.zap() },
      { id: 'target', label: 'Target', icon: Icons.target() },
      { id: 'compass', label: 'Compass', icon: Icons.compass() },
      { id: 'globe', label: 'Globe', icon: Icons.globe() },
      { id: 'lock', label: 'Lock', icon: Icons.lock() },
      { id: 'eye', label: 'Eye', icon: Icons.eye() },
      { id: 'bell', label: 'Bell', icon: Icons.bell() },
      { id: 'flag', label: 'Flag', icon: Icons.flag() },
      { id: 'map', label: 'Map', icon: Icons.map() },
      { id: 'terminal', label: 'Terminal', icon: Icons.terminal() },
      { id: 'database', label: 'Database', icon: Icons.database() },
      { id: 'layers', label: 'Layers', icon: Icons.layers() },
      { id: 'leaf', label: 'Leaf', icon: Icons.leaf() },
      { id: 'moon', label: 'Moon', icon: Icons.moon() },
      { id: 'cloud', label: 'Cloud', icon: Icons.cloud() },
      { id: 'cpu', label: 'CPU', icon: Icons.cpu() },
      { id: 'wifi', label: 'Wifi', icon: Icons.wifi() },
      { id: 'checkCircle', label: 'Check', icon: Icons.checkCircle() },
      { id: 'alertTriangle', label: 'Alert', icon: Icons.alertTriangle() },
      { id: 'helpCircle', label: 'Help', icon: Icons.helpCircle2() },
      { id: 'inbox', label: 'Inbox', icon: Icons.inbox() },
      { id: 'calendar', label: 'Calendar', icon: Icons.calendar() },
      { id: 'fileCode2', label: 'Code File', icon: Icons.fileCode2() },
      { id: 'trendingUp', label: 'Trending Up', icon: Icons.trendingUp() },
      { id: 'trendingDown', label: 'Trending Down', icon: Icons.trendingDown() },
      { id: 'award', label: 'Award', icon: Icons.award() },
      { id: 'trophy', label: 'Trophy', icon: Icons.trophy() },
      { id: 'gem', label: 'Gem', icon: Icons.gem() },
      { id: 'sparkle', label: 'Sparkle', icon: Icons.sparkle() },
      { id: 'crown', label: 'Crown', icon: Icons.crown() },
      { id: 'wand', label: 'Magic', icon: Icons.wand() },
      { id: 'puzzle', label: 'Puzzle', icon: Icons.puzzle() },
      { id: 'blocks', label: 'Blocks', icon: Icons.blocks() },
      { id: 'dice', label: 'Dice', icon: Icons.dice() },
      { id: 'gamepad', label: 'Game', icon: Icons.gamepad() },
      { id: 'headphones', label: 'Audio', icon: Icons.headphones() },
      { id: 'volume2', label: 'Volume', icon: Icons.volume2() },
      { id: 'mic', label: 'Mic', icon: Icons.mic2() },
      { id: 'camera', label: 'Camera', icon: Icons.camera2() },
      { id: 'film', label: 'Film', icon: Icons.film() },
      { id: 'bookOpen', label: 'Book', icon: Icons.bookOpen() },
      { id: 'penTool', label: 'Design', icon: Icons.penTool() },
      { id: 'scissors', label: 'Edit', icon: Icons.scissors2() },
      { id: 'stamp', label: 'Stamp', icon: Icons.stamp() },
      { id: 'ruler', label: 'Measure', icon: Icons.ruler() },
      { id: 'medal', label: 'Medal', icon: Icons.medal() },
    ];
    const iconChildren: Array<{ label: string; icon?: string; action: () => void }> =
      iconOptions.map((opt) => ({
        label: opt.label,
        icon: opt.icon,
        action: () => this.actions.updateNoteIcon?.(id, opt.id),
      }));

    const items: ContextMenuItem[] = [
      {
        label: 'Rename',
        icon: Icons.pencil(),
        action: () => this.startRename(id),
      },
      {
        label: 'Duplicate',
        icon: Icons.copy(),
        action: () => this.actions.duplicateNote?.(id),
      },
      {
        label: 'Change Icon',
        icon: Icons.palette(),
        children: iconChildren,
      },
      {
        label: 'Move to...',
        icon: Icons.arrowRight(),
        children: moveToChildren,
      },
      { separator: true },
      {
        label: 'Export',
        icon: Icons.download(),
        children: exportChildren,
      },
      {
        label: 'Import',
        icon: Icons.upload(),
        action: () => this.actions.importNote(),
      },
      {
        label: 'Share',
        icon: Icons.share(),
        action: () => this.actions.share(id),
      },
      { separator: true },
      {
        label: 'Delete',
        icon: Icons.trash2(),
        action: () => this.actions.del(id),
      },
    ];

    this.ctxMenu.show(items, x, y);
  }

  private showFolderContextMenu(folderId: string, x: number, y: number): void {
    if (this.actions.isContextMenuFoldersEnabled && !this.actions.isContextMenuFoldersEnabled()) {
      return;
    }

    const iconOptions = [
      { id: 'folder', label: 'Default', icon: Icons.folder() },
      { id: 'folder-open', label: 'Open', icon: Icons.folderOpen() },
      { id: 'folder-star', label: 'Starred', icon: Icons.folderStar() },
      { id: 'folder-work', label: 'Work', icon: Icons.folderWork() },
      { id: 'folder-study', label: 'Study', icon: Icons.folderStudy() },
      { id: 'folder-personal', label: 'Personal', icon: Icons.folderPersonal() },
      { id: 'folder-private', label: 'Private', icon: Icons.folderPrivate() },
      { id: 'folder-projects', label: 'Projects', icon: Icons.folderProjects() },
      { id: 'folder-archive', label: 'Archive', icon: Icons.folderArchive() },
      { id: 'folder-heart', label: 'Heart', icon: Icons.folderHeart() },
      { id: 'folder-lock', label: 'Locked', icon: Icons.folderLock() },
      { id: 'folder-cloud', label: 'Cloud', icon: Icons.folderCloud() },
      { id: 'folder-music', label: 'Music', icon: Icons.folderMusic() },
      { id: 'folder-image', label: 'Images', icon: Icons.folderImage() },
      { id: 'folder-video', label: 'Video', icon: Icons.folderVideo() },
      { id: 'folder-code', label: 'Code', icon: Icons.folderCode() },
      { id: 'folder-mail', label: 'Mail', icon: Icons.folderMail() },
      { id: 'folder-chat', label: 'Chat', icon: Icons.folderChat() },
      { id: 'folder-fire', label: 'Fire', icon: Icons.folderFire() },
      { id: 'folder-bolt', label: 'Bolt', icon: Icons.folderBolt() },
      { id: 'folder-globe', label: 'Globe', icon: Icons.folderGlobe() },
      { id: 'folder-bookmark', label: 'Bookmark', icon: Icons.folderBookmark() },
      { id: 'folder-pin', label: 'Pinned', icon: Icons.folderPin() },
      { id: 'folder-link', label: 'Link', icon: Icons.folderLink() },
      { id: 'folder-eye', label: 'Visible', icon: Icons.folderEye() },
      { id: 'folder-shield', label: 'Shield', icon: Icons.folderShield() },
      { id: 'folder-clock', label: 'Time', icon: Icons.folderClock() },
      { id: 'folder-gift', label: 'Gift', icon: Icons.folderGift() },
      { id: 'folder-leaf', label: 'Nature', icon: Icons.folderLeaf() },
      { id: 'folder-moon', label: 'Moon', icon: Icons.folderMoon() },
      { id: 'folder-target', label: 'Target', icon: Icons.folderTarget() },
      { id: 'folder-compass', label: 'Compass', icon: Icons.folderCompass() },
      { id: 'folder-terminal', label: 'Terminal', icon: Icons.folderTerminal() },
      { id: 'folder-database', label: 'Database', icon: Icons.folderDatabase() },
      { id: 'folder-key', label: 'Key', icon: Icons.folderKey() },
      { id: 'folder-rocket', label: 'Rocket', icon: Icons.folderRocket() },
      { id: 'folder-palette', label: 'Palette', icon: Icons.folderPalette() },
      { id: 'folder-wifi', label: 'Wifi', icon: Icons.folderWifi() },
      { id: 'folder-layers', label: 'Layers', icon: Icons.folderLayers() },
      { id: 'folder-zap', label: 'Zap', icon: Icons.folderZap() },
      { id: 'folder-flag', label: 'Flag', icon: Icons.folderFlag() },
      { id: 'folder-anchor', label: 'Anchor', icon: Icons.folderAnchor() },
      { id: 'folder-cpu', label: 'CPU', icon: Icons.folderCpu() },
      { id: 'folder-droplet', label: 'Droplet', icon: Icons.folderDroplet() },
      { id: 'folder-map', label: 'Map', icon: Icons.folderMap() },
      { id: 'folder-print', label: 'Print', icon: Icons.folderPrint() },
    ];
    const iconChildren: Array<{ label: string; icon?: string; action: () => void }> =
      iconOptions.map((opt) => ({
        label: opt.label,
        icon: opt.icon,
        action: () => this.actions.updateFolderIcon?.(folderId, opt.id),
      }));

    const folders = this.actions.getFolders ? this.actions.getFolders() : [];
    const moveToChildren: Array<{ label: string; icon?: string; action: () => void }> = folders
      .filter((f) => f.id !== folderId)
      .map((f) => ({
        label: f.name,
        icon: getFolderIcon(f.icon),
        action: () => this.actions.moveFolder?.(folderId, f.id),
      }));
    moveToChildren.unshift({
      label: 'Root',
      icon: Icons.folder(),
      action: () => this.actions.moveFolder?.(folderId, ''),
    });

    this.ctxMenu.show(
      [
        {
          label: 'New Note',
          icon: Icons.filePlus(),
          action: () => this.actions.newNoteInFolder(folderId),
        },
        {
          label: 'New Subfolder',
          icon: Icons.folderPlus(),
          action: () => this.actions.newFolder(folderId),
        },
        { separator: true },
        {
          label: 'Rename',
          icon: Icons.pencil(),
          action: () => this.startFolderRename(folderId),
        },
        {
          label: 'Change Icon',
          icon: Icons.palette(),
          children: iconChildren,
        },
        {
          label: 'Move to...',
          icon: Icons.arrowRight(),
          children: moveToChildren,
        },
        { separator: true },
        {
          label: 'Delete',
          icon: Icons.trash2(),
          action: () => this.actions.deleteFolder(folderId),
        },
      ],
      x,
      y,
    );
  }

  private startRename(id: string): void {
    const items = this.listEl.querySelectorAll('.note-item');
    items.forEach((el) => {
      const e = el as HTMLElement;
      if (e.dataset.noteId === id) {
        const currentName = e.textContent || '';
        const prevPaddingLeft = e.style.paddingLeft;
        e.innerHTML = '';
        e.style.paddingTop = '2px';
        e.style.paddingBottom = '2px';
        e.style.paddingRight = '8px';

        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.className = 'rename-input';
        input.style.cssText =
          'width:100%;background:var(--surface-secondary);border:1px solid var(--accent);border-radius:4px;padding:2px 6px;font-size:13px;color:var(--text);';
        input.select();

        let cancelled = false;
        const finish = () => {
          input.removeEventListener('blur', finish);
          if (cancelled) return;
          const newName = input.value.trim() || currentName;
          this.actions.rename(id, newName);
        };

        input.addEventListener('blur', finish);
        input.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter') {
            input.blur();
          } else if (ev.key === 'Escape') {
            cancelled = true;
            input.removeEventListener('blur', finish);
            e.style.paddingLeft = prevPaddingLeft;
            this.needsRender = true;
            if (this.isOpen()) this.renderNow();
          }
        });

        e.appendChild(input);
        input.focus();
      }
    });
  }

  private startFolderRename(id: string): void {
    const items = this.listEl.querySelectorAll('.folder-item');
    items.forEach((el) => {
      const e = el as HTMLElement;
      if (e.dataset.folderId === id) {
        const nameSpan = e.querySelector('.truncate');
        if (!nameSpan) return;
        const currentName = nameSpan.textContent || '';
        nameSpan.textContent = '';

        const input = document.createElement('input');
        input.type = 'text';
        input.value = currentName;
        input.className = 'rename-input';
        input.style.cssText =
          'width:100%;background:var(--surface-secondary);border:1px solid var(--accent);border-radius:4px;padding:2px 6px;font-size:13px;color:var(--text);';
        input.select();

        let cancelled = false;
        const finish = () => {
          input.removeEventListener('blur', finish);
          if (cancelled) return;
          const newName = input.value.trim() || currentName;
          this.actions.renameFolder(id, newName);
        };

        input.addEventListener('blur', finish);
        input.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter') {
            input.blur();
          } else if (ev.key === 'Escape') {
            cancelled = true;
            input.removeEventListener('blur', finish);
            nameSpan.textContent = currentName;
          }
        });

        nameSpan.appendChild(input);
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
    if (this.needsRender) this.renderNow();
    this.el.style.width = '200px';
    this.el.style.borderRightWidth = '1px';
    if (this.countNotesInTree(this.lastTree) >= 1) this.searchInput.style.display = '';
    this.listEl.focus();
    setTimeout(() => this.listEl.focus(), 0);
  }

  close(): void {
    this.el.style.width = '0px';
    this.el.style.borderRightWidth = '0';
  }

  isOpen(): boolean {
    return this.el.style.width !== '0px';
  }

  private addHover(btn: HTMLElement): void {
    btn.addEventListener('mouseenter', () => {
      btn.style.background = 'var(--surface-hover)';
      btn.style.color = 'var(--text)';
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'var(--surface-secondary)';
      btn.style.color = 'var(--text-muted)';
    });
  }
}
