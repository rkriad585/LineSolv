import type { ShortcutMap } from './utils/shortcuts';
import type { AppCallbacks, Note } from './types';
import { CalculatorStore } from './stores/calculator';
import { NotesManager, type SortField, type SortDir } from './stores/notes';
import { SettingsStore } from './stores/settings';
import { TitleBar } from './components/TitleBar';
import { CalculatorInput } from './components/CalculatorInput';
import { ResultDisplay } from './components/ResultDisplay';
import { NotesPanel } from './components/NotesPanel';
import { VariableExplorer } from './components/VariableExplorer';
import { ConfirmDialog } from './components/ConfirmDialog';
import { ShortcutModal } from './components/ShortcutModal';
import { SettingsModal } from './components/SettingsModal';
import { DocsViewer } from './components/DocsViewer';
import { HistoryPanel } from './components/HistoryPanel';
import { loadFontForFamily } from './utils/fonts';
import { StepsPanel } from './components/StepsPanel';
import { GraphPanel } from './components/GraphPanel';
import { PluginPanel } from './components/PluginPanel';
import { ContextMenu } from './components/ContextMenu';
import { AutocompletePopup } from './components/AutocompletePopup';
import { Icons } from './components/Icons';
import type { ContextMenuItem } from './types';
import { buildLineResults } from './utils/format';
import { installGlobalShortcuts, toggleFullscreen } from './utils/shortcuts';
import { escapeHtml } from './utils/html';
import { toast, Toast } from './utils/toast';
import * as serviceBindings from '../wailsjs/go/service/AppService';

const BUILTIN_THEMES = [
  'dark',
  'light',
  'neon',
  'red',
  'obsidian',
  'plasma',
  'blood',
  'midnight',
  'aurora',
  'mono',
  'frost',
  'prism',
  'lavender',
  'sage',
  'warm-light',
  'blue-trust-dark',
  'blue-trust-light',
  'orange-energy-dark',
  'orange-energy-light',
  'green-growth-dark',
  'green-growth-light',
  'yellow-optimism-dark',
  'yellow-optimism-light',
  'purple-innovation-dark',
  'purple-innovation-light',
  'red-passion-dark',
  'red-passion-light',
];
let pluginThemeStyle: HTMLStyleElement | null = null;
let pluginThemeIds: string[] = [];

const STYLES = [
  { id: 'default', label: 'Default', desc: 'Flat, clean, minimal' },
  { id: 'glass', label: 'Liquid Glass', desc: 'Frosted glass, translucent' },
  { id: 'material', label: 'Material 3', desc: 'Rounded, tinted, elevation' },
  { id: 'alivated', label: 'Alivated', desc: 'Soft, warm, neumorphic' },
  { id: 'neon', label: 'Neon', desc: 'Cyberpunk, glowing borders' },
];

let currentStyle = 'default';

function applyUiStyle(style: string): void {
  const valid = STYLES.some((s) => s.id === style);
  currentStyle = valid ? style : 'default';
  document.documentElement.classList.remove(
    'style-default',
    'style-glass',
    'style-material',
    'style-alivated',
    'style-neon',
  );
  document.documentElement.classList.add('style-' + currentStyle);
  // Force WebKit to recalculate styles and repaint immediately
  void document.documentElement.offsetHeight;
}

function applyTheme(theme: string): void {
  const allThemes = [...BUILTIN_THEMES, ...pluginThemeIds];
  // Remove any existing theme-* classes
  const classes = Array.from(document.documentElement.classList);
  for (const cls of classes) {
    if (cls.startsWith('theme-')) document.documentElement.classList.remove(cls);
  }
  if (allThemes.includes(theme)) {
    document.documentElement.classList.add('theme-' + theme);
  } else {
    document.documentElement.classList.add('theme-dark');
  }
  // Force WebKit to recalculate styles and repaint immediately
  void document.documentElement.offsetHeight;
}

function injectPluginThemes(
  themes: Array<{ id: string; label: string; colors: Record<string, string> }>,
): void {
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

function parseColor(str: string): [number, number, number] | null {
  const hex = str.replace('#', '');
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return [
      parseInt(hex.substring(0, 2), 16),
      parseInt(hex.substring(2, 4), 16),
      parseInt(hex.substring(4, 6), 16),
    ];
  }
  const rgb = str.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgb) return [parseInt(rgb[1]), parseInt(rgb[2]), parseInt(rgb[3])];
  return null;
}

function applySurfaceOpacity(opacity: number): void {
  const root = document.documentElement;

  // Always clear stale inline overrides FIRST so getComputedStyle reads class-level values
  root.style.removeProperty('--surface');
  root.style.removeProperty('--surface-secondary');
  root.style.removeProperty('--note-bg');
  root.style.removeProperty('--border');
  root.style.removeProperty('--surface-transparency');
  document.body.style.background = '';
  root.classList.remove('surface-translucent');

  if (opacity >= 1) return;

  root.classList.add('surface-translucent');
  root.style.setProperty('--surface-transparency', String(opacity));

  // Read CSS variable values from the class-based theme rules (not inline)
  const props = ['--surface', '--surface-secondary', '--note-bg', '--border'];
  const baseSurface = getComputedStyle(root).getPropertyValue('--surface').trim();
  const baseRgb = parseColor(baseSurface) || [24, 24, 27];

  // Apply translucent body background
  document.body.style.background = `rgba(${baseRgb[0]},${baseRgb[1]},${baseRgb[2]},${opacity})`;

  // Apply to surface CSS variables so child elements are translucent too
  for (const prop of props) {
    const computed = getComputedStyle(root).getPropertyValue(prop).trim();
    const rgb = parseColor(computed);
    if (rgb) root.style.setProperty(prop, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${opacity})`);
  }
}

function applyNoise(intensity: number): void {
  const root = document.documentElement;
  if (intensity > 0) {
    root.classList.add('noise-active');
    root.style.setProperty('--noise-intensity', String(intensity / 100));
  } else {
    root.classList.remove('noise-active');
    root.style.removeProperty('--noise-intensity');
  }
}

function applySettingsState(s: {
  theme: string;
  ui_style: string;
  font_size: string;
  font_family: string;
  opacity: number;
  animations_enabled: boolean;
  toast_enabled: boolean;
  line_numbers_enabled: boolean;
  noise: number;
}): void {
  applyTheme(s.theme || 'dark');
  applyUiStyle(s.ui_style || 'default');
  const size = s.font_size || '16';
  document.documentElement.style.setProperty('--calc-font-size', size + 'px');
  document.documentElement.style.setProperty('--calc-font-family', s.font_family || 'monospace');
  loadFontForFamily(s.font_family || 'monospace');
  // Re-apply opacity after class swap so computed values reflect the new theme
  requestAnimationFrame(() => applySurfaceOpacity(s.opacity));
  if (s.animations_enabled) {
    document.documentElement.classList.remove('animations-disabled');
  } else {
    document.documentElement.classList.add('animations-disabled');
  }
  Toast.enabled = s.toast_enabled;
  applyNoise(s.noise);
}

/** Mount the LineSolv application into a root element. */
export function renderApp(root: HTMLElement): void {
  // Splash screen: shown while app loads, fades out when ready
  const splash = document.createElement('div');
  splash.id = 'splash-screen';
  splash.style.cssText =
    'position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;' +
    'background:var(--surface);transition:opacity 0.4s ease-out;';
  splash.innerHTML =
    `${Icons.logo(72, 72)}` +
    `<div style="margin-top:16px;font-size:18px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:var(--text-muted)">LineSolv</div>` +
    `<div style="margin-top:20px;width:220px;height:4px;border-radius:2px;background:var(--border);overflow:hidden;">` +
    `<div id="splash-bar" style="width:40%;height:100%;border-radius:2px;background:var(--accent);animation:splash-slide 1.2s ease-in-out infinite;"></div>` +
    `</div>`;
  document.body.appendChild(splash);

  // Inject splash animation keyframes
  const splashStyle = document.createElement('style');
  splashStyle.textContent = `@keyframes splash-slide { 0%{transform:translateX(-100%)} 50%{transform:translateX(150%)} 100%{transform:translateX(-100%)} }`;
  document.head.appendChild(splashStyle);

  // Inject SVG refraction filter for Liquid Glass style
  const svgFilter = document.createElement('div');
  svgFilter.innerHTML =
    `<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden">` +
    `<defs>` +
    `<filter id="liquid-refraction" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">` +
    `<feTurbulence type="fractalNoise" baseFrequency="0.012 0.035" numOctaves="2" seed="7" result="noise"/>` +
    `<feGaussianBlur in="noise" stdDeviation="2" result="blurred"/>` +
    `<feDisplacementMap in="SourceGraphic" in2="blurred" scale="-15" xChannelSelector="R" yChannelSelector="G"/>` +
    `</filter>` +
    `</defs>` +
    `</svg>`;
  document.body.appendChild(svgFilter);

  const store = new CalculatorStore();
  const notesMgr = new NotesManager();
  const settingsStore = new SettingsStore();

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
      } catch {
        toast.show('Note save failed', 'error');
      }
    }, 500);
  }

  // --- Core evaluation ---

  async function updateVars(): Promise<void> {
    try {
      const v = await serviceBindings.GetVariables();
      store.setVariables(v);
      varsPanel.render(v);
      scheduleKeywordRefresh();
    } catch {
      /* runtime not ready */
    }
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
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
      loadingTimeout = null;
    }
    loadingTimeout = window.setTimeout(() => {
      if (version !== evalVersion) return;
      store.setEvalState('loading');
      results.setResults(buildLineResults(lines, [], true, visualInfo));
    }, 60);

    try {
      const res = await serviceBindings.EvaluateAll(text);
      if (version !== evalVersion) return;
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
      }

      store.setEvalState('idle');
      store.setResults(res);
      // Only set results if we didn't show the loading state — otherwise we'd cause a double flash
      results.setResults(buildLineResults(lines, res, false, visualInfo));

      for (const r of res) {
        if (r) store.pushHistory({ input: text, output: r });
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
        } catch {
          /* ignore */
        }
      }

      // Auto-detect graph expressions ("plot x^2", "graph sin(x)", "y = x^2")
      if (lastExpr) {
        try {
          const graphResult = await serviceBindings.EvaluateGraph(lastExpr);
          if (graphResult && graphResult.points && graphResult.points.length > 0) {
            graphPanel.render(graphResult.points, graphResult.expression);
          }
        } catch {
          /* ignore */
        }
      }
    } catch {
      if (version !== evalVersion) return;
      if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
      }
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
    } catch {
      /* ignore */
    }
    evaluateAll();
  }

  function refreshNotesUI(): void {
    notesPanel.render(
      notesMgr.buildTree(),
      notesMgr.getActiveId(),
      notesMgr.getSortField(),
      notesMgr.getSortDir(),
    );
  }

  // --- Note operations ---

  let notesLoaded = false;

  const WELCOME_CONTENT =
    '# Type your calculations here...\n# Examples:\n2 + 2\n25 * 37\n200 with 25% discount';
  const LS_ACTIVE_KEY = 'linesolv_active_note';

  async function loadNotes(): Promise<void> {
    try {
      const notes = await serviceBindings.GetAllNotes();
      if (!notes || notes.length === 0) {
        const note = await serviceBindings.CreateNote();
        // Seed the first note with welcome content
        await serviceBindings.SaveNoteContent(note.id, WELCOME_CONTENT);
        note.content = WELCOME_CONTENT;
        notesMgr.load([note], note.id);
        input.text = WELCOME_CONTENT;
      } else {
        // Restore last active note from localStorage, fallback to first note
        const savedId = localStorage.getItem(LS_ACTIVE_KEY);
        const activeId = savedId && notes.some((n) => n.id === savedId) ? savedId : notes[0].id;
        notesMgr.load(notes, activeId);
        const content = notesMgr.activeNote()?.content ?? '';
        input.text = content || WELCOME_CONTENT;
      }
      notesLoaded = true;
      refreshNotesUI();
    } catch {
      /* runtime not ready — will use fallback */
    }
  }

  async function loadFolders(): Promise<void> {
    try {
      const folders = await serviceBindings.GetAllFolders();
      notesMgr.loadFolders(folders);
    } catch {
      /* runtime not ready */
    }
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
      folderId: '',
    };
    notesMgr.load([fallback], fallback.id);
    input.text = fallback.content;
    lastSavedContent = fallback.content;
    refreshNotesUI();
    // Try to persist via backend so it survives restart
    (async () => {
      try {
        // Check if backend already has notes before creating
        const existing = await serviceBindings.GetAllNotes();
        if (existing && existing.length > 0) {
          notesMgr.load(existing, existing[0].id);
          input.text = existing[0].content || '';
          lastSavedContent = input.text;
          refreshNotesUI();
          return;
        }
        const note = await serviceBindings.CreateNote();
        await serviceBindings.SaveNoteContent(note.id, WELCOME_CONTENT);
        note.content = WELCOME_CONTENT;
        notesMgr.load([note], note.id);
        localStorage.setItem(LS_ACTIVE_KEY, note.id);
        lastSavedContent = WELCOME_CONTENT;
        refreshNotesUI();
      } catch {
        /* backend still not ready, keep in-memory fallback */
      }
    })();
  }

  async function handleNewNote(): Promise<void> {
    if (docsViewer.isOpen()) docsViewer.close();
    if (pluginPanel.isOpen()) pluginPanel.close();
    try {
      const note = await serviceBindings.CreateNote();
      if (!note) {
        toast.show('Failed to create note', 'error');
        return;
      }
      notesMgr.addNote(note);
      input.text = '';
      lastSavedContent = '';
      refreshNotesUI();
      if (!notesPanel.isOpen()) notesPanel.open();
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
    if (!settingsStore.getState().confirm_dialog) {
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
            settingsStore.update({ confirm_dialog: false });
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
        input.text = notesMgr.activeNote()!.content;
        lastSavedContent = input.text;
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
      lastSavedContent = note.content;
      refreshNotesUI();
      clearAndEval();
      toast.show('Note imported', 'success');
    } catch {
      toast.show('Failed to import note', 'error');
    }
  }

  function handleShareNote(id: string): void {
    const note = notesMgr.getNotes().find((n) => n.id === id);
    if (!note) return;
    const text = `${note.name}\n---\n${note.content}`;
    navigator.clipboard.writeText(text).then(
      () => toast.show('Copied to clipboard', 'info'),
      () => {},
    );
  }

  // --- Folder operations ---

  async function handleNewNoteInFolder(folderId: string): Promise<void> {
    if (docsViewer.isOpen()) docsViewer.close();
    if (pluginPanel.isOpen()) pluginPanel.close();
    try {
      const note = await serviceBindings.CreateNoteInFolder(folderId);
      if (!note) {
        toast.show('Failed to create note', 'error');
        return;
      }
      notesMgr.addNote(note);
      notesMgr.expandFolder(folderId);
      input.text = '';
      lastSavedContent = '';
      refreshNotesUI();
      if (!notesPanel.isOpen()) notesPanel.open();
      clearAndEval();
      input.textarea.focus();
      toast.show('Note created', 'success');
    } catch {
      toast.show('Failed to create note', 'error');
    }
  }

  async function handleNewFolder(parentId: string): Promise<void> {
    try {
      const folder = await serviceBindings.CreateFolder('New Folder', parentId);
      notesMgr.addFolder(folder);
      notesMgr.expandFolder(parentId);
      refreshNotesUI();
    } catch {
      toast.show('Failed to create folder', 'error');
    }
  }

  async function handleRenameFolder(id: string, name: string): Promise<void> {
    try {
      await serviceBindings.RenameFolder(id, name);
      notesMgr.renameFolder(id, name);
      refreshNotesUI();
    } catch {
      toast.show('Failed to rename folder', 'error');
    }
  }

  async function handleDeleteFolder(id: string): Promise<void> {
    if (!settingsStore.getState().confirm_dialog) {
      doDeleteFolder(id);
      return;
    }
    confirmDialog.show(
      'Delete Folder',
      'Are you sure you want to delete this folder? Notes inside will be moved to the root.',
      'Delete',
      async (result) => {
        if (result.confirmed) {
          if (result.remember) {
            settingsStore.update({ confirm_dialog: false });
          }
          doDeleteFolder(id);
        }
      },
    );
  }

  async function doDeleteFolder(id: string): Promise<void> {
    try {
      await serviceBindings.DeleteFolder(id);
      notesMgr.removeFolder(id);
      const notes = await serviceBindings.GetAllNotes();
      notesMgr.load(notes, notesMgr.getActiveId());
      refreshNotesUI();
      toast.show('Folder deleted', 'info');
    } catch {
      toast.show('Failed to delete folder', 'error');
    }
  }

  // --- Shortcut callbacks ---

  const shortcuts: ShortcutMap = {
    onToggleNotes: () => {
      if (notesPanel.isOpen()) {
        notesPanel.close();
      } else {
        if (docsViewer.isOpen()) docsViewer.close();
        if (pluginPanel.isOpen()) pluginPanel.close();
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
        if (notesMgr.activeNote()) notesMgr.activeNote()!.content = '';
        lastSavedContent = '';
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
      throttledUpdateAutocomplete();
      if (notesMgr.activeNote()) {
        notesMgr.activeNote()!.content = input.text;
        scheduleSaveContent(notesMgr.activeNote()!.id, input.text);
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
        if (notesPanel.isOpen()) notesPanel.close();
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
        if (notesPanel.isOpen()) notesPanel.close();
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
      const today = new Date().toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      let rows = '';
      for (let i = 0; i < lines.length; i++) {
        const result = state.results[i] || '';
        rows += `<tr><td class="print-line">${escapeHtml(lines[i]) || '\u00A0'}</td><td class="print-result">${escapeHtml(result) || '\u00A0'}</td></tr>`;
      }

      const watermarkSvg = Icons.logo(18, 18);

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
      iframe.style.cssText =
        'position:absolute;top:-9999px;left:-9999px;width:1px;height:1px;border:none';
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
    if (docsViewer.isOpen()) docsViewer.close();
    if (pluginPanel.isOpen()) pluginPanel.close();
    // Flush pending save for old note before switching
    if (saveContentTimer) {
      clearTimeout(saveContentTimer);
      saveContentTimer = null;
      const oldNote = notesMgr.activeNote();
      if (oldNote && lastSavedContent !== input.text) {
        serviceBindings.SaveNoteContent(oldNote.id, input.text).catch(() => {
          toast.show('Failed to save note', 'error');
        });
        lastSavedContent = input.text;
      }
    }
    if (!notesMgr.switchNote(id)) return;
    const content = notesMgr.activeNote()?.content ?? '';
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
    newNoteInFolder: handleNewNoteInFolder,
    newFolder: handleNewFolder,
    renameFolder: handleRenameFolder,
    deleteFolder: handleDeleteFolder,
    toggleFolder: (id: string) => {
      notesMgr.toggleFolder(id);
      refreshNotesUI();
    },
    isFolderExpanded: (id: string) => notesMgr.isFolderExpanded(id),
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
    if (autocompleteThrottleTimer) {
      clearTimeout(autocompleteThrottleTimer);
      autocompleteThrottleTimer = null;
    }
  };

  function updateAutocomplete(): void {
    if (!settingsStore.getState().autocomplete_enabled) {
      autocomplete.hide();
      return;
    }
    const { word } = input.getCursorWord();
    if (word.length < 1) {
      autocomplete.hide();
      return;
    }
    const pos = input.getCursorPixelPos();
    autocomplete.updateFilter(word, pos.x, pos.y);
  }

  let autocompleteThrottleTimer: number | null = null;
  function throttledUpdateAutocomplete(): void {
    if (autocompleteThrottleTimer) return;
    autocompleteThrottleTimer = window.setTimeout(() => {
      autocompleteThrottleTimer = null;
      updateAutocomplete();
    }, 50);
  }

  let keywordRefreshTimer: number | null = null;
  function scheduleKeywordRefresh(): void {
    if (!settingsStore.getState().autocomplete_enabled) return;
    if (keywordRefreshTimer) return;
    keywordRefreshTimer = window.setTimeout(async () => {
      keywordRefreshTimer = null;
      try {
        allKeywords = await serviceBindings.GetAutocompleteKeywords();
        autocomplete.setItems(allKeywords as import('./types').AutocompleteItem[]);
      } catch {
        /* ignore */
      }
    }, 500);
  }

  const loadingSpinner = document.createElement('div');
  loadingSpinner.id = 'loading-spinner';
  loadingSpinner.style.cssText =
    'display:none;position:absolute;bottom:8px;left:50%;transform:translateX(-50%);z-index:50;';
  loadingSpinner.innerHTML =
    '<div style="width:16px;height:16px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin 0.6s linear infinite;"></div>';
  notepad.appendChild(loadingSpinner);

  const shortcutModal = new ShortcutModal();

  const settingsModal = new SettingsModal('dark', settingsStore);

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
  ui.style.borderRadius = 'var(--ui-radius-md)';
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

  let resizeRaf = 0;
  window.addEventListener('resize', () => {
    if (resizeRaf) return;
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0;
      if (window.innerWidth < 700 && notesPanel.isOpen()) notesPanel.close();
      if (window.innerWidth < 700 && historyPanel.isOpen()) historyPanel.close();
      if (window.innerWidth < 600 && stepsPanel.isOpen()) stepsPanel.close();
      if (window.innerWidth < 500 && varsPanel.isOpen()) varsPanel.close();
    });
  });

  installGlobalShortcuts(input.textarea, shortcuts);

  // --- Autocomplete keyboard handling ---
  input.textarea.addEventListener(
    'keydown',
    (e) => {
      if (!settingsStore.getState().autocomplete_enabled) return;
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
        if (autocompleteThrottleTimer) {
          clearTimeout(autocompleteThrottleTimer);
          autocompleteThrottleTimer = null;
        }
      }
    },
    true,
  );

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
      {
        label: 'Cut',
        icon: Icons.scissors(),
        shortcut: mod + '+X',
        action: () => {
          const ta = input.textarea;
          const start = ta.selectionStart;
          const end = ta.selectionEnd;
          if (start === end) return;
          const selected = ta.value.substring(start, end);
          navigator.clipboard.writeText(selected).then(() => {
            ta.setRangeText('', start, end, 'end');
            ta.dispatchEvent(new Event('input', { bubbles: true }));
          });
        },
        disabled: !hasSelection,
      },
      {
        label: 'Copy',
        icon: Icons.copy(),
        shortcut: mod + '+C',
        action: () => {
          const ta = input.textarea;
          const selected = ta.value.substring(ta.selectionStart, ta.selectionEnd);
          if (selected) navigator.clipboard.writeText(selected);
        },
        disabled: !hasSelection,
      },
      {
        label: 'Paste',
        icon: Icons.paste(),
        shortcut: mod + '+V',
        action: () => {
          navigator.clipboard
            .readText()
            .then((text) => {
              const ta = input.textarea;
              const start = ta.selectionStart;
              ta.setRangeText(text, start, ta.selectionEnd, 'end');
              ta.dispatchEvent(new Event('input', { bubbles: true }));
            })
            .catch(() => {
              toast.show('Failed to paste from clipboard', 'error');
            });
        },
      },
      {
        label: 'Select All',
        icon: Icons.checkSquare(),
        shortcut: mod + '+A',
        action: () => {
          input.textarea.select();
        },
      },
      { separator: true },
      {
        label: 'Format Expression',
        icon: Icons.code(),
        shortcut: mod + '+F',
        action: () => scheduleEval(),
        disabled: !hasText,
      },
      {
        label: 'Clear Line',
        icon: Icons.trash(),
        action: () => {
          input.text = '';
          forceEval();
        },
        disabled: !hasText,
      },
      { separator: true },
      {
        label: 'New Note',
        icon: Icons.filePlus(),
        shortcut: mod + '+N',
        action: handleNewNote,
      },
    ];

    if (notes.length > 1) {
      const activeId = notesMgr.getActiveId();
      const switchChildren: ContextMenuItem[] = notes.map((n) => ({
        label: n.name || 'Untitled',
        icon: n.id === activeId ? Icons.check() : undefined,
        action: () => switchNote(n.id),
      }));
      items.push({
        label: 'Switch Note',
        icon: Icons.folder(),
        children: switchChildren,
      });
    }

    items.push(
      { separator: true },
      {
        label: 'Panels',
        icon: Icons.layout(),
        children: [
          {
            label: 'Docs',
            icon: Icons.fileText(),
            action: shortcuts.onToggleDocs,
          },
          {
            label: 'Plugins',
            icon: Icons.gear(),
            action: shortcuts.onTogglePlugins,
          },
          {
            label: 'Settings',
            icon: Icons.info(),
            action: shortcuts.onToggleSettings,
          },
        ],
      },
      { separator: true },
      {
        label: 'About LineSolv',
        icon: Icons.helpCircle(),
        action: () => {
          settingsModal.open('About');
        },
      },
    );

    ctxMenu.show(items, e.clientX, e.clientY);
  });

  // Docs viewer context menu
  docsViewer.contentEl.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const notes = notesMgr.getNotes();
    const activeId = notesMgr.getActiveId();

    const items: ContextMenuItem[] = [
      {
        label: 'Select All',
        icon: Icons.checkSquare(),
        shortcut: mod + '+A',
        action: () => {
          const range = document.createRange();
          range.selectNodeContents(docsViewer.contentEl);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
        },
      },
      { separator: true },
      {
        label: 'New Note',
        icon: Icons.filePlus(),
        shortcut: mod + '+N',
        action: handleNewNote,
      },
    ];

    if (notes.length > 1) {
      const switchChildren: ContextMenuItem[] = notes.map((n) => ({
        label: n.name || 'Untitled',
        icon: n.id === activeId ? Icons.check() : undefined,
        action: () => switchNote(n.id),
      }));
      items.push({
        label: 'Switch Note',
        icon: Icons.folder(),
        children: switchChildren,
      });
    }

    items.push(
      { separator: true },
      {
        label: 'Panels',
        icon: Icons.layout(),
        children: [
          { label: 'Docs', action: shortcuts.onToggleDocs },
          { label: 'Plugins', action: shortcuts.onTogglePlugins },
          { label: 'Settings', action: shortcuts.onToggleSettings },
        ],
      },
      { separator: true },
      {
        label: 'About LineSolv',
        icon: Icons.info(),
        action: () => {
          settingsModal.open('About');
        },
      },
      { separator: true },
      {
        label: 'Select text, then press ' + mod + '+C to copy',
        icon: Icons.helpCircle(),
        disabled: true,
      },
    );

    ctxMenu.show(items, e.clientX, e.clientY);
  });

  // Plugin detail view context menu
  pluginPanel.detailContent.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const notes = notesMgr.getNotes();
    const activeId = notesMgr.getActiveId();

    const items: ContextMenuItem[] = [
      {
        label: 'Select All',
        icon: Icons.checkSquare(),
        shortcut: mod + '+A',
        action: () => {
          const range = document.createRange();
          range.selectNodeContents(pluginPanel.detailContent);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
        },
      },
      { separator: true },
      {
        label: 'New Note',
        icon: Icons.filePlus(),
        shortcut: mod + '+N',
        action: handleNewNote,
      },
    ];

    if (notes.length > 1) {
      const switchChildren: ContextMenuItem[] = notes.map((n) => ({
        label: n.name || 'Untitled',
        icon: n.id === activeId ? Icons.check() : undefined,
        action: () => switchNote(n.id),
      }));
      items.push({
        label: 'Switch Note',
        icon: Icons.folder(),
        children: switchChildren,
      });
    }

    items.push(
      { separator: true },
      {
        label: 'Panels',
        icon: Icons.layout(),
        children: [
          { label: 'Docs', action: shortcuts.onToggleDocs },
          { label: 'Plugins', action: shortcuts.onTogglePlugins },
          { label: 'Settings', action: shortcuts.onToggleSettings },
        ],
      },
      { separator: true },
      {
        label: 'About LineSolv',
        icon: Icons.info(),
        action: () => {
          settingsModal.open('About');
        },
      },
      { separator: true },
      {
        label: 'Select text, then press ' + mod + '+C to copy',
        icon: Icons.helpCircle(),
        disabled: true,
      },
    );

    ctxMenu.show(items, e.clientX, e.clientY);
  });

  let lastHistoryRef: readonly import('./stores/calculator').HistoryEntry[] | null = null;
  store.subscribe((state) => {
    loadingSpinner.style.display = state.evalState === 'loading' ? '' : 'none';
    if (historyPanel.isOpen() && state.history !== lastHistoryRef) {
      lastHistoryRef = state.history;
      historyPanel.render(state.history);
    }
  });

  // --- Init ---

  input.updateGutter();
  input.textarea.focus();
  store.setEvalState('idle');

  // Safety: force-dismiss splash after 5 seconds if init() hangs
  const splashSafetyTimeout = setTimeout(() => {
    if (splash.parentElement) {
      splash.style.opacity = '0';
      setTimeout(() => {
        splash.remove();
        splashStyle.remove();
      }, 450);
    }
  }, 5000);

  (async function init() {
    for (let i = 0; i < 20; i++) {
      try {
        await serviceBindings.EvaluateAll(input.text);
        await loadNotes();
        await loadFolders();
        refreshNotesUI();
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 100));
      }
    }
    // If notes didn't load from backend, create a local fallback
    initFallbackNote();
    try {
      const pluginThemes = await serviceBindings.GetPluginThemes();
      if (pluginThemes && pluginThemes.length > 0) {
        injectPluginThemes(
          pluginThemes as Array<{ id: string; label: string; colors: Record<string, string> }>,
        );
      }
    } catch {
      /* ignore */
    }
    try {
      const state = await settingsStore.load();
      applySettingsState(state);
      input.setLineNumbersVisible(state.line_numbers_enabled);
      results.el.style.display = state.result_panel_enabled ? '' : 'none';
      input.setLineWrap(state.line_wrap_enabled);
    } catch {
      /* ignore */
    }
    // Reveal app — fade out splash screen
    clearTimeout(splashSafetyTimeout);
    splash.style.opacity = '0';
    setTimeout(() => {
      splash.remove();
      splashStyle.remove();
    }, 450);
    settingsStore.onChanged((s) => {
      applySettingsState(s);
      if (!s.autocomplete_enabled) autocomplete.hide();
      input.setLineNumbersVisible(s.line_numbers_enabled);
      results.el.style.display = s.result_panel_enabled ? '' : 'none';
      input.setLineWrap(s.line_wrap_enabled);
      forceEval();
    });
    try {
      allKeywords = await serviceBindings.GetAutocompleteKeywords();
      autocomplete.setItems(allKeywords as import('./types').AutocompleteItem[]);
    } catch {
      /* ignore */
    }
    evaluateAll();
  })();
}
