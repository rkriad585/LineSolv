import type {Note, AppCallbacks} from './types';
import {TitleBar} from './components/TitleBar';
import {CalculatorInput} from './components/CalculatorInput';
import {ResultDisplay} from './components/ResultDisplay';
import {NotesPanel} from './components/NotesPanel';
import {VariableExplorer} from './components/VariableExplorer';
import * as serviceBindings from '../wailsjs/go/service/AppService';

export function renderApp(root: HTMLElement): void {
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

  async function evaluateAll(): Promise<void> {
    const version = ++evalVersion;
    const text = input.text;
    const note = activeNote();
    note.content = text;

    const lines = text.split('\n');
    input.updateGutter(lines.length);

    let resultsHtml = '';
    for (const line of lines) {
      const t = line.trim();
      if (!t || t.startsWith('#') || t.startsWith('//') || t.endsWith(':')) {
        resultsHtml += '<div style="color:var(--text-subtle)">\u00A0</div>';
      } else {
        resultsHtml += '<div style="color:var(--text-muted)">\u2026</div>';
      }
    }
    results.setResults(resultsHtml);

    try {
      const res = await serviceBindings.EvaluateAll(text);
      if (version !== evalVersion) return;

      resultsHtml = '';
      for (const r of res) {
        resultsHtml += `<div style="${r ? '' : 'color:var(--text-subtle)'}">${formatResult(r) || '\u00A0'}</div>`;
      }
      results.setResults(resultsHtml);
    } catch {
      // runtime not ready yet
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
      varsPanel.render(v);
    } catch {}
  }

  const cb: AppCallbacks = {
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
      clearAndEval();
    },
    onThemeToggle: () => {
      darkMode = !darkMode;
      document.documentElement.classList.toggle('light', !darkMode);
      titleBar.updateThemeIcon(darkMode);
    },
  };

  // --- Build DOM (matching original working layout) ---
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
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth < 700 && notesPanel.isOpen()) notesPanel.close();
    if (window.innerWidth < 500 && varsPanel.isOpen()) varsPanel.close();
  });

  // --- Init ---
  notesPanel.render(notes, activeNoteId);
  input.updateGutter(1);
  input.textarea.focus();

  // Retry evaluation until Wails runtime is ready
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
