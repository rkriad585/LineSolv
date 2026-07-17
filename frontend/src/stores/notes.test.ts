import { describe, it, expect, beforeEach } from 'vitest';
import { NotesManager } from './notes';
import type { Note } from '../types';

function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    name: overrides.name ?? 'Test Note',
    content: overrides.content ?? '',
    createdAt: overrides.createdAt ?? Date.now(),
    updatedAt: overrides.updatedAt ?? Date.now(),
    position: overrides.position ?? 0,
    folderId: overrides.folderId ?? '',
    icon: overrides.icon ?? 'document',
  };
}

describe('NotesManager', () => {
  let mgr: NotesManager;

  beforeEach(() => {
    mgr = new NotesManager();
  });

  describe('load', () => {
    it('loads notes and sets active', () => {
      const notes = [makeNote({ id: 'a' }), makeNote({ id: 'b' })];
      mgr.load(notes, 'b');
      expect(mgr.getNotes()).toHaveLength(2);
      expect(mgr.getActiveId()).toBe('b');
    });

    it('falls back to first note when activeId is empty', () => {
      const notes = [makeNote({ id: 'a' }), makeNote({ id: 'b' })];
      mgr.load(notes, '');
      expect(mgr.getActiveId()).toBe('a');
    });

    it('handles empty notes array', () => {
      mgr.load([], '');
      expect(mgr.getNotes()).toHaveLength(0);
      expect(mgr.getActiveId()).toBe('');
    });
  });

  describe('activeNote', () => {
    it('returns the active note', () => {
      const note = makeNote({ id: 'a', name: 'Active' });
      mgr.load([note], 'a');
      expect(mgr.activeNote()?.name).toBe('Active');
    });

    it('returns first note when activeId is invalid', () => {
      const notes = [makeNote({ id: 'a' }), makeNote({ id: 'b' })];
      mgr.load(notes, 'nonexistent');
      expect(mgr.activeNote()?.id).toBe('a');
    });
  });

  describe('addNote', () => {
    it('adds note and sets it as active', () => {
      mgr.load([makeNote({ id: 'a' })], 'a');
      const newNote = makeNote({ id: 'b', name: 'New' });
      mgr.addNote(newNote);
      expect(mgr.getNotes()).toHaveLength(2);
      expect(mgr.getActiveId()).toBe('b');
    });
  });

  describe('removeNote', () => {
    it('removes a note by id', () => {
      mgr.load([makeNote({ id: 'a' }), makeNote({ id: 'b' })], 'a');
      expect(mgr.removeNote('b')).toBe(true);
      expect(mgr.getNotes()).toHaveLength(1);
    });

    it('returns false for nonexistent id', () => {
      mgr.load([makeNote({ id: 'a' })], 'a');
      expect(mgr.removeNote('nonexistent')).toBe(false);
      expect(mgr.getNotes()).toHaveLength(1);
    });

    it('switches active to first remaining note when active is removed', () => {
      mgr.load([makeNote({ id: 'a' }), makeNote({ id: 'b' }), makeNote({ id: 'c' })], 'a');
      mgr.removeNote('a');
      expect(mgr.getActiveId()).toBe('b');
    });

    it('sets empty activeId when all notes are removed', () => {
      mgr.load([makeNote({ id: 'a' })], 'a');
      mgr.removeNote('a');
      expect(mgr.getActiveId()).toBe('');
    });
  });

  describe('renameNote', () => {
    it('renames a note', () => {
      mgr.load([makeNote({ id: 'a', name: 'Old' })], 'a');
      expect(mgr.renameNote('a', 'New')).toBe(true);
      expect(mgr.getNotes()[0].name).toBe('New');
    });

    it('returns false for nonexistent id', () => {
      mgr.load([makeNote({ id: 'a' })], 'a');
      expect(mgr.renameNote('nonexistent', 'New')).toBe(false);
    });
  });

  describe('switchNote', () => {
    it('switches to a different note', () => {
      mgr.load([makeNote({ id: 'a' }), makeNote({ id: 'b' })], 'a');
      expect(mgr.switchNote('b')).toBe(true);
      expect(mgr.getActiveId()).toBe('b');
    });

    it('returns false when switching to already active note', () => {
      mgr.load([makeNote({ id: 'a' }), makeNote({ id: 'b' })], 'a');
      expect(mgr.switchNote('a')).toBe(false);
    });

    it('returns false for nonexistent id', () => {
      mgr.load([makeNote({ id: 'a' }), makeNote({ id: 'b' })], 'a');
      expect(mgr.switchNote('nonexistent')).toBe(false);
    });
  });

  describe('sort', () => {
    it('sorts by name ascending', () => {
      const notes = [
        makeNote({ id: 'a', name: 'Banana' }),
        makeNote({ id: 'b', name: 'Apple' }),
        makeNote({ id: 'c', name: 'Cherry' }),
      ];
      mgr.load(notes, 'a');
      mgr.setSort('name', 'asc');
      expect(mgr.getNotes().map((n) => n.name)).toEqual(['Apple', 'Banana', 'Cherry']);
    });

    it('sorts by name descending', () => {
      const notes = [
        makeNote({ id: 'a', name: 'Banana' }),
        makeNote({ id: 'b', name: 'Apple' }),
        makeNote({ id: 'c', name: 'Cherry' }),
      ];
      mgr.load(notes, 'a');
      mgr.setSort('name', 'desc');
      expect(mgr.getNotes().map((n) => n.name)).toEqual(['Cherry', 'Banana', 'Apple']);
    });

    it('sorts by created ascending', () => {
      const notes = [
        makeNote({ id: 'a', createdAt: 300 }),
        makeNote({ id: 'b', createdAt: 100 }),
        makeNote({ id: 'c', createdAt: 200 }),
      ];
      mgr.load(notes, 'a');
      mgr.setSort('created', 'asc');
      expect(mgr.getNotes().map((n) => n.id)).toEqual(['b', 'c', 'a']);
    });

    it('sorts by updated descending', () => {
      const notes = [
        makeNote({ id: 'a', updatedAt: 100 }),
        makeNote({ id: 'b', updatedAt: 300 }),
        makeNote({ id: 'c', updatedAt: 200 }),
      ];
      mgr.load(notes, 'a');
      mgr.setSort('updated', 'desc');
      expect(mgr.getNotes().map((n) => n.id)).toEqual(['b', 'c', 'a']);
    });
  });

  describe('setActiveContent', () => {
    it('setActiveContent updates active note content', () => {
      const note = makeNote({ id: 'a', content: '' });
      mgr.load([note], 'a');
      mgr.setActiveContent('new content');
      expect(mgr.activeNote()?.content).toBe('new content');
    });
  });

  describe('getSortField / getSortDir', () => {
    it('returns defaults', () => {
      expect(mgr.getSortField()).toBe('updated');
      expect(mgr.getSortDir()).toBe('desc');
    });

    it('returns updated values after setSort', () => {
      mgr.setSort('name', 'asc');
      expect(mgr.getSortField()).toBe('name');
      expect(mgr.getSortDir()).toBe('asc');
    });
  });
});
