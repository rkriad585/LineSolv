import type {ShortcutMap} from './utils/shortcuts';
import type {AppCallbacks, SettingsData} from './types';
import {CalculatorStore} from './stores/calculator';
import {NotesManager} from './stores/notes';
import {TitleBar} from './components/TitleBar';
import {CalculatorInput} from './components/CalculatorInput';
import {ResultDisplay} from './components/ResultDisplay';
import {NotesPanel} from './components/NotesPanel';
import {VariableExplorer} from './components/VariableExplorer';
import {ConfirmDialog} from './components/ConfirmDialog';
import {ShortcutModal} from './components/ShortcutModal';
import {SettingsModal} from './components/SettingsModal';
import {DocsViewer} from './components/DocsViewer';
import {HistoryPanel} from './components/HistoryPanel';
import {buildLineResults} from './utils/format';
import {installGlobalShortcuts, toggleFullscreen} from './utils/shortcuts';
import * as serviceBindings from '../wailsjs/go/service/AppService';

let saveContentTimer: number | null = null;
function applyTheme(theme: string): void {
  const valid = ['dark', 'light', 'neon', 'red', 'obsidian', 'plasma', 'blood'];
  const cls = valid.includes(theme) ? theme : 'dark';
  document.documentElement.className = 'theme-' + cls;
}

function applyFontSettings(settings: SettingsData): void {
  const size = settings.font_size || '16';
  document.documentElement.style.setProperty('--calc-font-size', size + 'px');
  document.documentElement.style.setProperty('--calc-font-family', settings.font_family || 'monospace');
}

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
        refreshNotesUI();
        notesPanel.open();
      }
    },
    onToggleVars: () => {
      if (varsPanel.isOpen()) {
        varsPanel.close();
      } else {
        updateVars();
        varsPanel.open();
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
      if (docsViewer.isOpen()) {
        docsViewer.close();
      } else if (settingsModal.isOpen()) {
        settingsModal.close();
      } else if (shortcutModal.isOpen()) {
        shortcutModal.close();
      } else if (input.text.trim()) {
        input.text = '';
        if (notesMgr.activeNote()) notesMgr.activeNote().content = '';
        forceEval();
      } else if (notesPanel.isOpen()) {
        notesPanel.close();
      } else if (historyPanel.isOpen()) {
        historyPanel.close();
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
    onToggleShortcuts: () => shortcutModal.open(),
    onToggleHistory: () => {
      if (historyPanel.isOpen()) {
        historyPanel.close();
      } else {
        historyPanel.render(store.getState().history);
        historyPanel.open();
      }
    },
    onToggleSettings: () => {
      if (settingsModal.isOpen()) {
        settingsModal.close();
      } else {
        settingsModal.open();
      }
    },
    onToggleDocs: () => {
      if (docsViewer.isOpen()) {
        docsViewer.close();
      } else {
        docsViewer.open();
      }
    },
    onToggleFullscreen: toggleFullscreen,
    onPrint: () => {
      const text = input.text;
      const lines = text.split('\n');
      const state = store.getState();
      const noteName = notesMgr.activeNote()?.name || '';
      const today = new Date().toLocaleDateString(undefined, {year:'numeric',month:'short',day:'numeric'});

      let rows = '';
      for (let i = 0; i < lines.length; i++) {
        const result = state.results[i] || '';
        rows += `<tr><td class="print-line">${escapeHtml(lines[i]) || '\u00A0'}</td><td class="print-result">${escapeHtml(result) || '\u00A0'}</td></tr>`;
      }

      const watermarkSvg =
        '<svg viewBox="0 0 24 24"><polyline points="4 7 4 4 20 4 20 7"/>' +
        '<line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>' +
        '<line x1="8" y1="12" x2="16" y2="12"/><line x1="10" y1="9" x2="14" y2="9"/>' +
        '<line x1="10" y1="15" x2="14" y2="15"/></svg>';

      const printDoc = `<!DOCTYPE html><html><head><meta charset="utf-8">
<style>
  @page { size: A4 portrait; margin: 20mm 15mm 25mm 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', 'JetBrains Mono', 'Consolas', monospace;
    font-size: 10pt; line-height: 1.6; color: #000; background: #fff; padding: 0;
  }
  .print-header {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14pt; font-weight: 700; color: #1a1a1a;
    padding-bottom: 8px; margin-bottom: 12px; border-bottom: 2px solid #7c3aed;
  }
  .print-table { width: 100%; border-collapse: collapse; }
  .print-table tr { page-break-inside: avoid; }
  .print-line {
    width: 65%; padding: 2px 8px 2px 0; color: #333; text-align: left;
    vertical-align: top; border-bottom: 1px solid #e5e5e5; word-break: break-all;
  }
  .print-result {
    width: 35%; padding: 2px 0 2px 8px; color: #7c3aed; text-align: right;
    vertical-align: top; border-bottom: 1px solid #e5e5e5; word-break: break-all;
  }
  .print-watermark {
    position: fixed; bottom: 10mm; left: 15mm;
    display: flex; align-items: center; gap: 6px;
    opacity: 0.15; pointer-events: none; z-index: 9999;
  }
  .print-watermark svg { width: 18px; height: 18px; stroke: #7c3aed; stroke-width: 1.5; fill: none; stroke-linecap: round; stroke-linejoin: round; }
  .print-watermark span {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 12pt; font-weight: 700; color: #7c3aed; letter-spacing: 0.1em; text-transform: uppercase;
  }
  .print-footer {
    position: fixed; bottom: 10mm; right: 15mm;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 8pt; color: #999; z-index: 9999;
  }
</style></head><body>
<div class="print-header">${escapeHtml(noteName)}</div>
<table class="print-table">${rows}</table>
<div class="print-watermark">${watermarkSvg}<span>LineSolv</span></div>
<div class="print-footer">${today}</div>
</body></html>`;

      const iframe = document.createElement('iframe');
      iframe.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:1px;height:1px;border:none';
      document.body.appendChild(iframe);
      const idoc = iframe.contentDocument || iframe.contentWindow!.document;
      idoc.open();
      idoc.write(printDoc);
      idoc.close();
      iframe.contentWindow!.focus();
      iframe.contentWindow!.print();
      document.body.removeChild(iframe);
    },
  };

  function escapeHtml(s: string): string {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

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

  const cb: AppCallbacks = {
    onEvaluateAll: evaluateAll,
    onNewNote: handleNewNote,
    onToggleNotes: shortcuts.onToggleNotes,
    onToggleVars: shortcuts.onToggleVars,
    onToggleHistory: shortcuts.onToggleHistory,
    onSwitchNote: switchNote,
    onClearAll: shortcuts.onClearAll,
    onToggleFullscreen: toggleFullscreen,
    onToggleSettings: shortcuts.onToggleSettings,
    onToggleDocs: shortcuts.onToggleDocs,
    onPrint: shortcuts.onPrint,
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

  const shortcutModal = new ShortcutModal();

  const settingsModal = new SettingsModal(
    'dark',
    (settings) => {
      applyTheme(settings.theme || 'dark');
      applyFontSettings(settings);
    },
  );

  const historyPanel = new HistoryPanel((inputText) => {
    input.text = inputText;
    forceEval();
  });

  const docsViewer = new DocsViewer();

  const main = document.createElement('div');
  main.className = 'flex-1 flex flex-col min-w-0';
  main.appendChild(notepad);

  const content = document.createElement('div');
  content.className = 'flex flex-1 min-h-0';
  content.appendChild(historyPanel.el);
  content.appendChild(notesPanel.el);
  content.appendChild(main);
  content.appendChild(varsPanel.el);

  const ui = document.createElement('div');
  ui.className = 'h-screen w-screen flex flex-col overflow-hidden select-none';
  ui.style.borderRadius = '10px';
  ui.appendChild(titleBar.el);
  ui.appendChild(content);
  ui.appendChild(docsViewer.el);

  root.appendChild(ui);

  // --- Events ---

  input.textarea.addEventListener('scroll', () => {
    input.gutter.scrollTop = input.textarea.scrollTop;
    results.el.scrollTop = input.textarea.scrollTop;
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth < 700 && notesPanel.isOpen()) notesPanel.close();
    if (window.innerWidth < 700 && historyPanel.isOpen()) historyPanel.close();
    if (window.innerWidth < 500 && varsPanel.isOpen()) varsPanel.close();
  });

  installGlobalShortcuts(input.textarea, shortcuts);

  store.subscribe((state) => {
    if (historyPanel.isOpen()) {
      historyPanel.render(state.history);
    }
  });

  // --- Init ---

  input.updateGutter(1);
  input.textarea.focus();
  store.setEvalState('idle');

  (async function init() {
    for (let i = 0; i < 20; i++) {
      try {
        await serviceBindings.EvaluateAll(input.text);
        await loadNotes();
        break;
      } catch {
        await new Promise(r => setTimeout(r, 100));
      }
    }
    try {
      const settings = await serviceBindings.GetSettings();
      applyTheme(settings.theme || 'dark');
      applyFontSettings(settings);
    } catch { /* ignore */ }
    evaluateAll();
  })();
}
