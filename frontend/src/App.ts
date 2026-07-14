import type {ShortcutMap} from './utils/shortcuts';
import type {AppCallbacks, Note, SettingsData} from './types';
import {CalculatorStore} from './stores/calculator';
import {NotesManager, type SortField, type SortDir} from './stores/notes';
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
import {StepsPanel} from './components/StepsPanel';
import {GraphPanel} from './components/GraphPanel';
import {PluginPanel} from './components/PluginPanel';
import {ContextMenu} from './components/ContextMenu';
import {AutocompletePopup} from './components/AutocompletePopup';
import type {ContextMenuItem} from './types';
import {buildLineResults} from './utils/format';
import {installGlobalShortcuts, toggleFullscreen} from './utils/shortcuts';
import {escapeHtml} from './utils/html';
import {toast} from './utils/toast';
import * as serviceBindings from '../wailsjs/go/service/AppService';

const BUILTIN_THEMES = ['dark', 'light', 'neon', 'red', 'obsidian', 'plasma', 'blood'];
let pluginThemeStyle: HTMLStyleElement | null = null;
let pluginThemeIds: string[] = [];

function applyTheme(theme: string): void {
  if (BUILTIN_THEMES.includes(theme)) {
    document.documentElement.className = 'theme-' + theme;
  } else if (pluginThemeIds.includes(theme)) {
    document.documentElement.className = 'theme-' + theme;
  } else {
    document.documentElement.className = 'theme-dark';
  }
}

function injectPluginThemes(themes: Array<{id: string; label: string; colors: Record<string, string>}>): void {
  if (pluginThemeStyle) {
    pluginThemeStyle.remove();
  }
  pluginThemeStyle = document.createElement('style');
  pluginThemeStyle.id = 'plugin-themes';
  let css = '';
  pluginThemeIds = [];
  for (const theme of themes) {
    pluginThemeIds.push(theme.id);
    css += `:root.theme-${theme.id} {\n`;
    for (const [key, value] of Object.entries(theme.colors)) {
      css += `  ${key}: ${value};\n`;
    }
    css += '}\n';
  }
  pluginThemeStyle.textContent = css;
  document.head.appendChild(pluginThemeStyle);
}

function applyFontSettings(settings: SettingsData): void {
  const size = settings.font_size || '16';
  document.documentElement.style.setProperty('--calc-font-size', size + 'px');
  document.documentElement.style.setProperty('--calc-font-family', settings.font_family || 'monospace');
}

/** Mount the LineSolv application into a root element. */
export function renderApp(root: HTMLElement): void {
  const store = new CalculatorStore();
  const notesMgr = new NotesManager();

  let pendingEval: number | null = null;
  let evalVersion = 0;
  let saveContentTimer: number | null = null;
  let lastSavedContent = '';

  function setNoteDirty(dirty: boolean): void {
    const id = notesMgr.getActiveId();
    if (id) notesPanel.setDirty(id, dirty);
  }

  function scheduleSaveContent(noteId: string, content: string): void {
    if (saveContentTimer) clearTimeout(saveContentTimer);
    saveContentTimer = window.setTimeout(async () => {
      saveContentTimer = null;
      try {
        await serviceBindings.SaveNoteContent(noteId, content);
        lastSavedContent = content;
        if (noteId === notesMgr.getActiveId()) {
          notesPanel.setDirty(noteId, false);
        }
      } catch { /* ignore */ }
    }, 500);
  }

  // --- Core evaluation ---

  async function updateVars(): Promise<void> {
    try {
      const v = await serviceBindings.GetVariables();
      store.setVariables(v);
      varsPanel.render(v);
      scheduleKeywordRefresh();
    } catch { /* runtime not ready */ }
  }

  let loadingTimeout: number | null = null;

  async function evaluateAll(): Promise<void> {
    const version = ++evalVersion;
    const text = input.text;

    const activeNote = notesMgr.activeNote();
    if (activeNote) {
      activeNote.content = text;
      scheduleSaveContent(activeNote.id, text);
    }

    const lines = text.split('\n');
    input.updateGutter();

    store.setInput(text);

    // Defer loading state — only show if eval takes > 60ms (avoids "..." flicker for fast evals)
    const visualInfo = input.getLineVisualInfo();
    loadingTimeout = window.setTimeout(() => {
      if (version !== evalVersion) return;
      store.setEvalState('loading');
      results.setResults(buildLineResults(lines, [], true, visualInfo));
    }, 60);

    try {
      const res = await serviceBindings.EvaluateAll(text);
      if (version !== evalVersion) return;
      if (loadingTimeout) { clearTimeout(loadingTimeout); loadingTimeout = null; }

      store.setEvalState('idle');
      store.setResults(res);
      // Only set results if we didn't show the loading state — otherwise we'd cause a double flash
      results.setResults(buildLineResults(lines, res, false, visualInfo));

      for (const r of res) {
        if (r) store.pushHistory({input: text, output: r});
      }

      // Fetch steps for the last evaluated expression
      let lastExpr = '';
      for (let i = lines.length - 1; i >= 0; i--) {
        const t = lines[i].trim();
        if (t && !t.startsWith('#') && !t.startsWith('//') && !t.endsWith(':')) {
          lastExpr = t;
          break;
        }
      }
      if (lastExpr && stepsPanel.isOpen()) {
        try {
          const detail = await serviceBindings.GetSteps(lastExpr);
          stepsPanel.render(detail.steps, detail.result);
        } catch { /* ignore */ }
      }

      // Auto-detect graph expressions ("plot x^2", "graph sin(x)", "y = x^2")
      if (lastExpr) {
        try {
          const graphResult = await serviceBindings.EvaluateGraph(lastExpr);
          if (graphResult && graphResult.points && graphResult.points.length > 0) {
            graphPanel.render(graphResult.points, graphResult.expression);
          }
        } catch { /* ignore */ }
      }
    } catch {
      if (version !== evalVersion) return;
      if (loadingTimeout) { clearTimeout(loadingTimeout); loadingTimeout = null; }
      store.setEvalState('error');
      store.setError('Connection error');
      toast.show('Connection error — backend may be restarting', 'error');
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
    notesPanel.render(notesMgr.getNotes(), notesMgr.getActiveId(), notesMgr.getSortField(), notesMgr.getSortDir());
  }

  // --- Note operations ---

  let notesLoaded = false;

  const WELCOME_CONTENT = '# Type your calculations here...\n# Examples:\n2 + 2\n25 * 37\n200 with 25% discount';
  const LS_ACTIVE_KEY = 'linesolv_active_note';

  async function loadNotes(): Promise<void> {
    try {
      const notes = await serviceBindings.GetAllNotes();
      if (notes.length === 0) {
        const note = await serviceBindings.CreateNote();
        // Seed the first note with welcome content
        await serviceBindings.SaveNoteContent(note.id, WELCOME_CONTENT);
        note.content = WELCOME_CONTENT;
        notesMgr.load([note], note.id);
        input.text = WELCOME_CONTENT;
      } else {
        // Restore last active note from localStorage, fallback to first note
        const savedId = localStorage.getItem(LS_ACTIVE_KEY);
        const activeId = savedId && notes.some(n => n.id === savedId) ? savedId : notes[0].id;
        notesMgr.load(notes, activeId);
        const content = notesMgr.activeNote().content;
        input.text = content || WELCOME_CONTENT;
      }
      notesLoaded = true;
      refreshNotesUI();
    } catch { /* runtime not ready — will use fallback */ }
  }

  /** Create a local in-memory fallback note when backend is unavailable. */
  function initFallbackNote(): void {
    if (notesLoaded) return;
    const fallback: Note = {
      id: 'local-fallback',
      name: 'Welcome',
      content: WELCOME_CONTENT,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      position: 0,
    };
    notesMgr.load([fallback], fallback.id);
    input.text = fallback.content;
    refreshNotesUI();
    // Try to persist via backend so it survives restart
    (async () => {
      try {
        const note = await serviceBindings.CreateNote();
        await serviceBindings.SaveNoteContent(note.id, WELCOME_CONTENT);
        note.content = WELCOME_CONTENT;
        notesMgr.load([note], note.id);
        localStorage.setItem(LS_ACTIVE_KEY, note.id);
        refreshNotesUI();
      } catch { /* backend still not ready, keep in-memory fallback */ }
    })();
  }

  async function handleNewNote(): Promise<void> {
    try {
      const note = await serviceBindings.CreateNote();
      notesMgr.addNote(note);
      input.text = '';
      lastSavedContent = '';
      refreshNotesUI();
      clearAndEval();
      input.textarea.focus();
      toast.show('Note created', 'success');
    } catch {
      toast.show('Failed to create note', 'error');
    }
  }

  async function handleRenameNote(id: string, name: string): Promise<void> {
    try {
      await serviceBindings.RenameNote(id, name);
      notesMgr.renameNote(id, name);
      refreshNotesUI();
      toast.show('Note renamed', 'success');
    } catch {
      toast.show('Failed to rename note', 'error');
    }
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
            try { await serviceBindings.SetDeleteWithoutConfirm(true); } catch { toast.show('Failed to save preference', 'error'); }
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
      notesPanel.setDirty(id, false);
      if (wasActive && notesMgr.activeNote()) {
        input.text = notesMgr.activeNote().content;
      }
      refreshNotesUI();
      if (notesMgr.getNotes().length === 0) {
        handleNewNote();
      } else {
        clearAndEval();
      }
      toast.show('Note deleted', 'info');
    } catch {
      toast.show('Failed to delete note', 'error');
    }
  }

  async function handleExportNote(id: string, format: string): Promise<void> {
    try {
      const result = await serviceBindings.ExportNoteToFile(id, format);
      if (result) {
        toast.show('Note exported', 'success');
      }
    } catch {
      toast.show('Failed to export note', 'error');
    }
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
      toast.show('Note imported', 'success');
    } catch {
      toast.show('Failed to import note', 'error');
    }
  }

  function handleShareNote(id: string): void {
    const note = notesMgr.getNotes().find(n => n.id === id);
    if (!note) return;
    const text = `${note.name}\n---\n${note.content}`;
    navigator.clipboard.writeText(text).then(
      () => toast.show('Copied to clipboard', 'info'),
      () => {},
    );
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
      if (autocomplete.isVisible()) {
        autocomplete.hide();
        return;
      }
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
      } else if (stepsPanel.isOpen()) {
        stepsPanel.close();
      } else if (varsPanel.isOpen()) {
        varsPanel.close();
      } else if (pluginPanel.isOpen()) {
        pluginPanel.close();
      }
    },
    onForceEval: forceEval,
    onTab: () => scheduleEval(),
    onInput: () => {
      scheduleEval();
      updateAutocomplete();
      if (notesMgr.activeNote()) {
        notesMgr.activeNote().content = input.text;
        scheduleSaveContent(notesMgr.activeNote().id, input.text);
        if (input.text !== lastSavedContent) {
          setNoteDirty(true);
        }
      }
    },
    onToggleShortcuts: () => shortcutModal.open(),
    onToggleHistory: () => {
      if (historyPanel.isOpen()) {
        historyPanel.close();
        historyPanel.clearFilter();
      } else {
        historyPanel.clearFilter();
        historyPanel.render(store.getState().history);
        historyPanel.open();
        historyPanel.focusSearch();
      }
    },
    onToggleSteps: () => {
      if (stepsPanel.isOpen()) {
        stepsPanel.close();
      } else {
        stepsPanel.render([], '');
        stepsPanel.open();
        forceEval();
      }
    },
    onTogglePlugins: () => {
      if (pluginPanel.isOpen()) {
        pluginPanel.close();
      } else {
        pluginPanel.open();
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
    onSearchNotes: () => notesPanel.focusSearch(),
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

  // --- Callbacks for components ---

  const switchNote = (id: string) => {
    if (!notesMgr.switchNote(id)) return;
    const content = notesMgr.activeNote().content;
    input.text = content;
    lastSavedContent = content;
    const activeId = notesMgr.getActiveId();
    if (activeId) {
      notesPanel.setDirty(activeId, false);
      localStorage.setItem(LS_ACTIVE_KEY, activeId);
    }
    refreshNotesUI();
    clearAndEval();
  };

  const noteActions = {
    rename: handleRenameNote,
    del: handleDeleteNote,
    exportNote: handleExportNote,
    share: handleShareNote,
    importNote: handleImportNote,
    sort: (field: SortField, dir: SortDir) => {
      notesMgr.setSort(field, dir);
      refreshNotesUI();
    },
  };

  const cb: AppCallbacks = {
    onEvaluateAll: evaluateAll,
    onNewNote: handleNewNote,
    onToggleNotes: shortcuts.onToggleNotes,
    onToggleVars: shortcuts.onToggleVars,
    onToggleHistory: shortcuts.onToggleHistory,
    onToggleSteps: shortcuts.onToggleSteps,
    onTogglePlugins: shortcuts.onTogglePlugins,
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
  notepad.style.position = 'relative';
  notepad.appendChild(input.el);
  notepad.appendChild(results.el);

  // --- Autocomplete ---
  const autocomplete = new AutocompletePopup();
  document.body.appendChild(autocomplete.el);
  let allKeywords: Array<{ name: string; category: string; description: string }> = [];

  autocomplete.onSelect = (item) => {
    const { start, end } = input.getCursorWord();
    const suffix = item.category === 'function' ? '()' : '';
    const replacement = item.name + suffix;
    input.replaceWord(start, end, replacement);
    if (item.category === 'function') {
      const ta = input.textarea;
      ta.selectionStart = ta.selectionEnd - 1;
      ta.selectionEnd = ta.selectionEnd - 1;
    }
  };

  function updateAutocomplete(): void {
    const { word } = input.getCursorWord();
    if (word.length < 1) {
      autocomplete.hide();
      return;
    }
    const pos = input.getCursorPixelPos();
    autocomplete.updateFilter(word, pos.x, pos.y);
  }

  let keywordRefreshTimer: number | null = null;
  function scheduleKeywordRefresh(): void {
    if (keywordRefreshTimer) return;
    keywordRefreshTimer = window.setTimeout(async () => {
      keywordRefreshTimer = null;
      try {
        allKeywords = await serviceBindings.GetAutocompleteKeywords();
        autocomplete.setItems(allKeywords as import('./types').AutocompleteItem[]);
      } catch { /* ignore */ }
    }, 500);
  }

  const loadingSpinner = document.createElement('div');
  loadingSpinner.id = 'loading-spinner';
  loadingSpinner.style.cssText = 'display:none;position:absolute;bottom:8px;left:50%;transform:translateX(-50%);z-index:50;';
  loadingSpinner.innerHTML = '<div style="width:16px;height:16px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin 0.6s linear infinite;"></div>';
  notepad.appendChild(loadingSpinner);

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

  const stepsPanel = new StepsPanel();
  const graphPanel = new GraphPanel();
  const pluginPanel = new PluginPanel();
  pluginPanel.onPluginsChanged = () => scheduleKeywordRefresh();

  const docsViewer = new DocsViewer();

  const main = document.createElement('div');
  main.className = 'flex-1 flex flex-col min-w-0';
  main.appendChild(notepad);
  main.appendChild(graphPanel.el);

  const content = document.createElement('div');
  content.className = 'flex flex-1 min-h-0';
  content.appendChild(historyPanel.el);
  content.appendChild(notesPanel.el);
  content.appendChild(main);
  content.appendChild(stepsPanel.el);
  content.appendChild(varsPanel.el);

  const ui = document.createElement('div');
  ui.className = 'h-screen w-screen flex flex-col overflow-hidden select-none';
  ui.style.borderRadius = '10px';
  ui.appendChild(titleBar.el);
  ui.appendChild(content);
  ui.appendChild(docsViewer.el);
  ui.appendChild(pluginPanel.el);

  root.appendChild(ui);

  // --- Events ---

  input.textarea.addEventListener('scroll', () => {
    input.gutter.scrollTop = input.textarea.scrollTop;
    results.el.scrollTop = input.textarea.scrollTop;
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth < 700 && notesPanel.isOpen()) notesPanel.close();
    if (window.innerWidth < 700 && historyPanel.isOpen()) historyPanel.close();
    if (window.innerWidth < 600 && stepsPanel.isOpen()) stepsPanel.close();
    if (window.innerWidth < 500 && varsPanel.isOpen()) varsPanel.close();
  });

  installGlobalShortcuts(input.textarea, shortcuts);

  // --- Autocomplete keyboard handling ---
  input.textarea.addEventListener('keydown', (e) => {
    if (!autocomplete.isVisible()) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      autocomplete.moveSelection(1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      autocomplete.moveSelection(-1);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      autocomplete.selectCurrent();
    }
  }, true);

  // Dismiss autocomplete on blur (with small delay for click handling)
  input.textarea.addEventListener('blur', () => {
    setTimeout(() => autocomplete.hide(), 150);
  });

  // --- Context Menu ---

  const ctxMenu = new ContextMenu();

  const mod = navigator.platform.includes('Mac') ? '⌘' : 'Ctrl';

  input.textarea.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const hasSelection = input.textarea.selectionStart !== input.textarea.selectionEnd;
    const hasText = input.text.length > 0;
    const notes = notesMgr.getNotes();

    const items: ContextMenuItem[] = [
      {label: 'Cut', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/></svg>', shortcut: mod + '+X', action: () => {
        const ta = input.textarea;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        if (start === end) return;
        const selected = ta.value.substring(start, end);
        navigator.clipboard.writeText(selected).then(() => {
          ta.setRangeText('', start, end, 'end');
          ta.dispatchEvent(new Event('input', {bubbles: true}));
        });
      }, disabled: !hasSelection},
      {label: 'Copy', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>', shortcut: mod + '+C', action: () => {
        const ta = input.textarea;
        const selected = ta.value.substring(ta.selectionStart, ta.selectionEnd);
        if (selected) navigator.clipboard.writeText(selected);
      }, disabled: !hasSelection},
      {label: 'Paste', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>', shortcut: mod + '+V', action: () => {
        navigator.clipboard.readText().then(text => {
          const ta = input.textarea;
          const start = ta.selectionStart;
          ta.setRangeText(text, start, ta.selectionEnd, 'end');
          ta.dispatchEvent(new Event('input', {bubbles: true}));
        }).catch(() => {});
      }},
      {label: 'Select All', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>', shortcut: mod + '+A', action: () => { input.textarea.select(); }},
      {separator: true},
      {label: 'Format Expression', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>', shortcut: mod + '+F', action: () => scheduleEval(), disabled: !hasText},
      {label: 'Clear Line', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>', action: () => { input.text = ''; forceEval(); }, disabled: !hasText},
      {separator: true},
      {label: 'New Note', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>', shortcut: mod + '+N', action: handleNewNote},
    ];

    if (notes.length > 1) {
      const switchChildren: ContextMenuItem[] = notes.map(n => ({
        label: n.name || 'Untitled',
        action: () => switchNote(n.id),
      }));
      items.push({label: 'Switch Note', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>', children: switchChildren});
    }

    items.push(
      {separator: true},
      {label: 'Panels', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>', children: [
        {label: 'Docs', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>', action: shortcuts.onToggleDocs},
        {label: 'Plugins', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/><circle cx="12" cy="12" r="3"/></svg>', action: shortcuts.onTogglePlugins},
        {label: 'Settings', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>', action: shortcuts.onToggleSettings},
      ]},
      {separator: true},
      {label: 'About LineSolv', icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>', action: () => { settingsModal.open('About'); }},
    );

    ctxMenu.show(items, e.clientX, e.clientY);
  });

  store.subscribe((state) => {
    loadingSpinner.style.display = state.evalState === 'loading' ? '' : 'none';
    if (historyPanel.isOpen()) {
      historyPanel.render(state.history);
    }
  });

  // --- Init ---

  input.updateGutter();
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
    // If notes didn't load from backend, create a local fallback
    initFallbackNote();
    try {
      const pluginThemes = await serviceBindings.GetPluginThemes();
      if (pluginThemes && pluginThemes.length > 0) {
        injectPluginThemes(pluginThemes as Array<{id: string; label: string; colors: Record<string, string>}>);
      }
    } catch { /* ignore */ }
    try {
      const settings = await serviceBindings.GetSettings();
      applyTheme(settings.theme || 'dark');
      applyFontSettings(settings);
    } catch { /* ignore */ }
    try {
      allKeywords = await serviceBindings.GetAutocompleteKeywords();
      autocomplete.setItems(allKeywords as import('./types').AutocompleteItem[]);
    } catch { /* ignore */ }
    evaluateAll();
  })();
}
