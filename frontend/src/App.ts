import type {ShortcutMap} from './utils/shortcuts';
import {CalculatorStore} from './stores/calculator';
import {NotesManager} from './stores/notes';
import {TitleBar} from './components/TitleBar';
import {CalculatorInput} from './components/CalculatorInput';
import {ResultDisplay} from './components/ResultDisplay';
import {NotesPanel} from './components/NotesPanel';
import {VariableExplorer} from './components/VariableExplorer';
import {ConfirmDialog} from './components/ConfirmDialog';
import {buildLineResults} from './utils/format';
import {installGlobalShortcuts} from './utils/shortcuts';
import * as serviceBindings from '../wailsjs/go/service/AppService';

let saveContentTimer: number | null = null;

function scheduleSaveContent(noteId: string, content: string): void {
  if (saveContentTimer) clearTimeout(saveContentTimer);
  saveContentTimer = window.setTimeout(async () => {
    saveContentTimer = null;
    try {
      await serviceBindings.SaveNoteContent(noteId, content);
    } catch { /* ignore */ }
  }, 500);
}

/** Mount the LineSolv application into a root element. */
export function renderApp(root: HTMLElement): void {
  const store = new CalculatorStore();
  const notesMgr = new NotesManager();

  let darkMode = true;
  let pendingEval: number | null = null;
  let evalVersion = 0;

  // --- Core evaluation ---

  async function updateVars(): Promise<void> {
    try {
      const v = await serviceBindings.GetVariables();
      store.setVariables(v);
      varsPanel.render(v);
    } catch { /* runtime not ready */ }
  }

  async function evaluateAll(): Promise<void> {
    const version = ++evalVersion;
    const text = input.text;

    const activeNote = notesMgr.activeNote();
    if (activeNote) {
      activeNote.content = text;
      scheduleSaveContent(activeNote.id, text);
    }

    const lines = text.split('\n');
    input.updateGutter(lines.length);

    store.setInput(text);
    store.setEvalState('loading');
    results.setResults(buildLineResults(lines, [], true));

    try {
      const res = await serviceBindings.EvaluateAll(text);
      if (version !== evalVersion) return;

      store.setResults(res);
      store.setEvalState('idle');
      results.setResults(buildLineResults(lines, res, false));

      for (const r of res) {
        if (r) store.pushHistory({input: text, output: r});
      }
    } catch {
      if (version !== evalVersion) return;
      store.setEvalState('error');
      store.setError('Connection error');
    }

    updateVars();
  }

  function scheduleEval(): void {
    if (pendingEval) clearTimeout(pendingEval);
    pendingEval = window.setTimeout(() => {
      pendingEval = null;
      evaluateAll();
    }, 150);
  }

  function forceEval(): void {
    if (pendingEval) clearTimeout(pendingEval);
    pendingEval = null;
    evaluateAll();
  }

  async function clearAndEval(): Promise<void> {
    try {
      await serviceBindings.ClearVariables();
    } catch { /* ignore */ }
    evaluateAll();
  }

  function refreshNotesUI(): void {
    notesPanel.render(notesMgr.getNotes(), notesMgr.getActiveId());
  }

  // --- Note operations ---

  async function loadNotes(): Promise<void> {
    try {
      const notes = await serviceBindings.GetAllNotes();
      if (notes.length === 0) {
        const note = await serviceBindings.CreateNote();
        notesMgr.load([note], note.id);
        input.text = '';
      } else {
        notesMgr.load(notes, notes[0].id);
        input.text = notesMgr.activeNote().content;
      }
      refreshNotesUI();
    } catch { /* runtime not ready */ }
  }

  async function handleNewNote(): Promise<void> {
    try {
      const note = await serviceBindings.CreateNote();
      notesMgr.addNote(note);
      input.text = '';
      refreshNotesUI();
      clearAndEval();
      input.textarea.focus();
    } catch { /* ignore */ }
  }

  async function handleRenameNote(id: string, name: string): Promise<void> {
    try {
      await serviceBindings.RenameNote(id, name);
      notesMgr.renameNote(id, name);
      refreshNotesUI();
    } catch { /* ignore */ }
  }

  const confirmDialog = new ConfirmDialog();

  async function handleDeleteNote(id: string): Promise<void> {
    let skip = false;
    try {
      skip = await serviceBindings.GetDeleteWithoutConfirm();
    } catch { /* ignore */ }
    if (skip) {
      doDelete(id);
      return;
    }
    confirmDialog.show(
      'Delete Note',
      'Are you sure you want to delete this note? This action cannot be undone.',
      'Delete',
      async (result) => {
        if (result.confirmed) {
          if (result.remember) {
            try { await serviceBindings.SetDeleteWithoutConfirm(true); } catch { /* ignore */ }
          }
          doDelete(id);
        }
      },
    );
  }

  async function doDelete(id: string): Promise<void> {
    try {
      await serviceBindings.DeleteNote(id);
      const wasActive = id === notesMgr.getActiveId();
      notesMgr.removeNote(id);
      if (wasActive && notesMgr.activeNote()) {
        input.text = notesMgr.activeNote().content;
      }
      refreshNotesUI();
      if (notesMgr.getNotes().length === 0) {
        handleNewNote();
      } else {
        clearAndEval();
      }
    } catch { /* ignore */ }
  }

  async function handleExportNote(id: string, format: string): Promise<void> {
    try {
      await serviceBindings.ExportNoteToFile(id, format);
    } catch { /* ignore */ }
  }

  async function handleImportNote(): Promise<void> {
    try {
      const note = await serviceBindings.ImportNoteFromFile();
      if (!note) return;
      notesMgr.addNote(note);
      notesMgr.switchNote(note.id);
      input.text = note.content;
      refreshNotesUI();
      clearAndEval();
    } catch { /* ignore */ }
  }

  function handleShareNote(id: string): void {
    const note = notesMgr.getNotes().find(n => n.id === id);
    if (!note) return;
    const text = `${note.name}\n---\n${note.content}`;
    navigator.clipboard.writeText(text).catch(() => {});
  }

  // --- Shortcut callbacks ---

  const shortcuts: ShortcutMap = {
    onToggleNotes: () => {
      if (notesPanel.isOpen()) {
        notesPanel.close();
      } else {
        notesPanel.open();
        refreshNotesUI();
      }
    },
    onToggleVars: () => {
      if (varsPanel.isOpen()) {
        varsPanel.close();
      } else {
        varsPanel.open();
        updateVars();
      }
    },
    onClearAll: () => {
      input.text = '';
      store.clearHistory();
      clearAndEval();
    },
    onNewNote: handleNewNote,
    onHistoryUp: () => {
      const val = store.navigateHistory('up');
      return val !== null ? val : null;
    },
    onHistoryDown: () => {
      return store.navigateHistory('down');
    },
    onEscape: () => {
      if (input.text.trim()) {
        input.text = '';
        if (notesMgr.activeNote()) notesMgr.activeNote().content = '';
        forceEval();
      } else if (notesPanel.isOpen()) {
        notesPanel.close();
      } else if (varsPanel.isOpen()) {
        varsPanel.close();
      }
    },
    onForceEval: forceEval,
    onTab: () => scheduleEval(),
    onInput: () => {
      scheduleEval();
      if (notesMgr.activeNote()) {
        notesMgr.activeNote().content = input.text;
        scheduleSaveContent(notesMgr.activeNote().id, input.text);
      }
    },
  };

  // --- Callbacks for components ---

  const switchNote = (id: string) => {
    if (!notesMgr.switchNote(id)) return;
    input.text = notesMgr.activeNote().content;
    refreshNotesUI();
    clearAndEval();
  };

  const noteActions = {
    rename: handleRenameNote,
    del: handleDeleteNote,
    exportNote: handleExportNote,
    share: handleShareNote,
    importNote: handleImportNote,
  };

  const cb = {
    onEvaluateAll: evaluateAll,
    onNewNote: handleNewNote,
    onToggleNotes: shortcuts.onToggleNotes,
    onToggleVars: shortcuts.onToggleVars,
    onSwitchNote: switchNote,
    onClearAll: shortcuts.onClearAll,
    onThemeToggle: () => {
      darkMode = !darkMode;
      document.documentElement.classList.toggle('light', !darkMode);
      titleBar.updateThemeIcon(darkMode);
    },
  };

  // --- Build DOM ---

  const titleBar = new TitleBar(cb);
  const input = new CalculatorInput();
  const results = new ResultDisplay();
  const notesPanel = new NotesPanel(cb.onSwitchNote, cb.onNewNote, noteActions);
  const varsPanel = new VariableExplorer();

  const notepad = document.createElement('div');
  notepad.id = 'notepad-wrapper';
  notepad.className = 'flex-1 flex min-h-0';
  notepad.appendChild(input.el);
  notepad.appendChild(results.el);

  const main = document.createElement('div');
  main.className = 'flex-1 flex flex-col min-w-0';
  main.appendChild(notepad);

  const content = document.createElement('div');
  content.className = 'flex flex-1 min-h-0';
  content.appendChild(notesPanel.el);
  content.appendChild(main);
  content.appendChild(varsPanel.el);

  const ui = document.createElement('div');
  ui.className = 'h-screen w-screen flex flex-col overflow-hidden select-none';
  ui.style.borderRadius = '10px';
  ui.appendChild(titleBar.el);
  ui.appendChild(content);

  root.appendChild(ui);

  // --- Events ---

  input.textarea.addEventListener('scroll', () => {
    input.gutter.scrollTop = input.textarea.scrollTop;
    results.el.scrollTop = input.textarea.scrollTop;
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth < 700 && notesPanel.isOpen()) notesPanel.close();
    if (window.innerWidth < 500 && varsPanel.isOpen()) varsPanel.close();
  });

  installGlobalShortcuts(input.textarea, shortcuts);

  // --- Init ---

  input.updateGutter(1);
  input.textarea.focus();
  store.setEvalState('idle');

  (async function init() {
    for (let i = 0; i < 20; i++) {
      try {
        await serviceBindings.EvaluateAll(input.text);
        await loadNotes();
        evaluateAll();
        return;
      } catch {
        await new Promise(r => setTimeout(r, 100));
      }
    }
    await loadNotes();
    evaluateAll();
  })();
}
