/** Keyboard shortcut handler callbacks. */
export interface ShortcutMap {
  onToggleNotes: () => void;
  onToggleVars: () => void;
  onClearAll: () => void;
  onNewNote: () => void;
  onHistoryUp: () => string | null;
  onHistoryDown: () => string | null;
  onEscape: () => void;
  onForceEval: () => void;
  onTab: (e: Event) => void;
  onInput: () => void;
}

/** Install global keyboard shortcuts on the textarea and document. */
export function installGlobalShortcuts(
  textarea: HTMLTextAreaElement,
  cmds: ShortcutMap,
): void {
  textarea.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = textarea;
      const start = ta.selectionStart;
      ta.value = ta.value.substring(0, start) + '  ' + ta.value.substring(ta.selectionEnd);
      ta.selectionStart = ta.selectionEnd = start + 2;
      cmds.onTab(e);
      return;
    }

    if (e.shiftKey && e.key === 'Enter') {
      e.preventDefault();
      cmds.onForceEval();
      return;
    }

    if (e.key === 'Escape') {
      cmds.onEscape();
      return;
    }
  });

  textarea.addEventListener('input', () => {
    cmds.onInput();
  });

  document.addEventListener('keydown', (e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (mod && e.key === 'b') { e.preventDefault(); cmds.onToggleNotes(); }
    if (mod && e.key === 'i') { e.preventDefault(); cmds.onToggleVars(); }
    if (mod && e.key === 'k') { e.preventDefault(); cmds.onClearAll(); }
    if (mod && e.key === 'n') { e.preventDefault(); cmds.onNewNote(); }

    if (mod && e.key === 'ArrowUp') {
      e.preventDefault();
      const val = cmds.onHistoryUp();
      if (val !== null) {
        textarea.value = val;
      }
    }
    if (mod && e.key === 'ArrowDown') {
      e.preventDefault();
      const val = cmds.onHistoryDown();
      if (val !== null) {
        textarea.value = val;
      } else {
        textarea.value = '';
      }
    }
  });
}
