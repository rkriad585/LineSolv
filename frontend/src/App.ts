import type {Note} from './types';
import {CalculatorStore} from './stores/calculator';
import {TitleBar} from './components/TitleBar';
import {CalculatorInput} from './components/CalculatorInput';
import {ResultDisplay} from './components/ResultDisplay';
import {NotesPanel} from './components/NotesPanel';
import {VariableExplorer} from './components/VariableExplorer';
import * as serviceBindings from '../wailsjs/go/service/AppService';

export function renderApp(root: HTMLElement): void {
  const store = new CalculatorStore();

  let notes: Note[] = [{id: '1', name: 'Untitled', content: ''}];
  let activeNoteId = '1';
  let darkMode = true;
  let pendingEval: number | null = null;
  let evalVersion = 0;

  function activeNote(): Note {
    return notes.find(n => n.id === activeNoteId) ?? notes[0];
  }

  function escapeHtml(t: string): string {
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
  }

  function formatResult(r: string): string {
    if (!r) return '\u00A0';
    if (/^\w+\s*=/.test(r)) {
      const parts = r.split('=');
      return `<span style="color:var(--text-muted)">${escapeHtml(parts[0])}=</span><span style="color:var(--accent)">${escapeHtml(parts.slice(1).join('='))}</span>`;
    }
    return escapeHtml(r);
  }

  function buildLineResults(lines: string[], res: string[]): string {
    let html = '';
    for (let i = 0; i < lines.length; i++) {
      const t = lines[i].trim();
      if (!t || t.startsWith('#') || t.startsWith('//') || t.endsWith(':')) {
        html += '<div style="color:var(--text-subtle)">\u00A0</div>';
      } else if (store.getState().evalState === 'loading') {
        html += '<div style="color:var(--text-muted)">\u2026</div>';
      } else {
        const r = res[i];
        html += `<div style="${r ? '' : 'color:var(--text-subtle)'}">${formatResult(r || '') || '\u00A0'}</div>`;
      }
    }
    return html;
  }

  async function evaluateAll(): Promise<void> {
    const version = ++evalVersion;
    const text = input.text;
    const note = activeNote();
    note.content = text;

    const lines = text.split('\n');
    input.updateGutter(lines.length);

    store.setInput(text);
    store.setEvalState('loading');
    results.setResults(buildLineResults(lines, []));

    try {
      const res = await serviceBindings.EvaluateAll(text);
      if (version !== evalVersion) return;

      store.setResults(res);
      store.setEvalState('idle');
      results.setResults(buildLineResults(lines, res));

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

  function clearAndEval(): void {
    (async () => {
      try {
        await serviceBindings.ClearVariables();
      } catch {}
      evaluateAll();
    })();
  }

  async function updateVars(): Promise<void> {
    try {
      const v = await serviceBindings.GetVariables();
      store.setVariables(v);
      varsPanel.render(v);
    } catch {}
  }

  const cb = {
    onEvaluateAll: evaluateAll,
    onNewNote: () => {
      const id = String(Date.now());
      notes.push({id, name: `Note ${notes.length + 1}`, content: ''});
      activeNoteId = id;
      input.text = '';
      notesPanel.render(notes, activeNoteId);
      clearAndEval();
      input.textarea.focus();
    },
    onToggleNotes: () => {
      if (notesPanel.isOpen()) {
        notesPanel.close();
      } else {
        notesPanel.open();
        notesPanel.render(notes, activeNoteId);
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
    onSwitchNote: (id: string) => {
      if (id === activeNoteId) return;
      activeNoteId = id;
      input.text = activeNote().content;
      notesPanel.render(notes, activeNoteId);
      clearAndEval();
    },
    onClearAll: () => {
      input.text = '';
      store.clearHistory();
      clearAndEval();
    },
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
  const notesPanel = new NotesPanel(cb.onSwitchNote, cb.onNewNote);
  const varsPanel = new VariableExplorer();

  const notepad = document.createElement('div');
  notepad.id = 'notepad-wrapper';
  notepad.className = 'flex-1 flex min-h-0';
  notepad.appendChild(input.el);
  notepad.appendChild(results.el);

  const main = document.createElement('main');
  main.className = 'flex-1 flex flex-col min-w-0';
  main.appendChild(notepad);

  const content = document.createElement('div');
  content.className = 'flex flex-1 min-h-0';
  content.appendChild(notesPanel.el);
  content.appendChild(main);
  content.appendChild(varsPanel.el);

  const ui = document.createElement('div');
  ui.className = 'h-screen w-screen flex flex-col overflow-hidden select-none';
  ui.style.background = 'var(--surface)';
  ui.appendChild(titleBar.el);
  ui.appendChild(content);

  root.appendChild(ui);

  // --- Events ---

  input.textarea.addEventListener('input', () => {
    scheduleEval();
    activeNote().content = input.text;
  });

  input.textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = input.textarea;
      const start = ta.selectionStart;
      ta.value = ta.value.substring(0, start) + '  ' + ta.value.substring(ta.selectionEnd);
      ta.selectionStart = ta.selectionEnd = start + 2;
      scheduleEval();
      return;
    }

    if (e.shiftKey && e.key === 'Enter') {
      e.preventDefault();
      forceEval();
      return;
    }

    if (e.key === 'Escape') {
      if (input.text.trim()) {
        input.text = '';
        activeNote().content = '';
        forceEval();
      } else if (notesPanel.isOpen()) {
        notesPanel.close();
      } else if (varsPanel.isOpen()) {
        varsPanel.close();
      }
      return;
    }
  });

  input.textarea.addEventListener('scroll', () => {
    input.gutter.scrollTop = input.textarea.scrollTop;
    results.el.scrollTop = input.textarea.scrollTop;
  });

  document.addEventListener('keydown', (e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key === 'b') { e.preventDefault(); cb.onToggleNotes(); }
    if (mod && e.key === 'i') { e.preventDefault(); cb.onToggleVars(); }
    if (mod && e.key === 'k') { e.preventDefault(); cb.onClearAll(); }
    if (mod && e.key === 'n') { e.preventDefault(); cb.onNewNote(); }

    // History navigation
    if (mod && e.key === 'ArrowUp') {
      e.preventDefault();
      const val = store.navigateHistory('up');
      if (val !== null) {
        input.text = val;
        activeNote().content = val;
        input.updateGutter(val.split('\n').length);
      }
    }
    if (mod && e.key === 'ArrowDown') {
      e.preventDefault();
      const val = store.navigateHistory('down');
      if (val !== null) {
        input.text = val;
        activeNote().content = val;
        input.updateGutter(val.split('\n').length);
      } else {
        input.text = '';
        activeNote().content = '';
      }
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth < 700 && notesPanel.isOpen()) notesPanel.close();
    if (window.innerWidth < 500 && varsPanel.isOpen()) varsPanel.close();
  });

  // --- Init ---
  notesPanel.render(notes, activeNoteId);
  input.updateGutter(1);
  input.textarea.focus();
  store.setEvalState('idle');

  (async function init() {
    for (let i = 0; i < 20; i++) {
      try {
        await serviceBindings.EvaluateAll(input.text);
        evaluateAll();
        return;
      } catch {
        await new Promise(r => setTimeout(r, 100));
      }
    }
    evaluateAll();
  })();
}
