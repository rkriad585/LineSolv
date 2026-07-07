export interface ShortcutMap {
  onToggleNotes: () => void;
  onToggleVars: () => void;
  onToggleHistory: () => void;
  onClearAll: () => void;
  onNewNote: () => void;
  onHistoryUp: () => string | null;
  onHistoryDown: () => string | null;
  onEscape: () => void;
  onForceEval: () => void;
  onTab: (e: Event) => void;
  onInput: () => void;
  onToggleShortcuts: () => void;
  onToggleSettings: () => void;
  onToggleFullscreen: () => void;
  onToggleDocs: () => void;
  onPrint: () => void;
}

let fullscreen = false;

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

    const mod = e.metaKey || e.ctrlKey;

    // Undo/Redo
    if (mod && e.key === 'z') {
      if (e.shiftKey) {
        e.preventDefault();
        document.execCommand('redo');
      } else {
        e.preventDefault();
        document.execCommand('undo');
      }
      return;
    }
    if (mod && e.key === 'y') {
      e.preventDefault();
      document.execCommand('redo');
      return;
    }

    if (mod && e.key === 'd') {
      e.preventDefault();
      duplicateLineOrSelection(textarea);
      cmds.onInput();
      return;
    }

    if (mod && e.key === 'l') {
      e.preventDefault();
      selectCurrentLine(textarea);
      return;
    }

    if (mod && e.shiftKey && e.key === 'K') {
      e.preventDefault();
      deleteCurrentLine(textarea);
      cmds.onInput();
      return;
    }

    if (e.altKey && e.shiftKey) {
      e.preventDefault();
      toggleCase(textarea);
      cmds.onInput();
      return;
    }

    if (e.altKey && e.key === 'ArrowUp') {
      e.preventDefault();
      moveLineUp(textarea);
      cmds.onInput();
      return;
    }

    if (e.altKey && e.key === 'ArrowDown') {
      e.preventDefault();
      moveLineDown(textarea);
      cmds.onInput();
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
    if (mod && e.key === 'h') { e.preventDefault(); cmds.onToggleHistory(); }
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

    if (e.key === '/' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      cmds.onToggleShortcuts();
    }

    if (e.key === ',' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      cmds.onToggleSettings();
    }

    if (e.key === 'p' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      cmds.onPrint();
    }

    if (!mod && e.key === 'Escape') {
      cmds.onEscape();
    }

  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'F11') {
      e.preventDefault();
      cmds.onToggleFullscreen();
    }
  }, {capture: true});
}

function getLineInfo(ta: HTMLTextAreaElement): {line: number; col: number; lineStart: number; lineEnd: number} {
  const val = ta.value;
  const pos = ta.selectionStart;
  const before = val.substring(0, pos);
  const line = before.split('\n').length - 1;
  const lines = val.split('\n');
  let lineStart = 0;
  for (let i = 0; i < line; i++) lineStart += lines[i].length + 1;
  const lineEnd = lineStart + lines[line].length;
  const col = pos - lineStart;
  return {line, col, lineStart, lineEnd};
}

function selectCurrentLine(ta: HTMLTextAreaElement): void {
  const {lineStart, lineEnd} = getLineInfo(ta);
  ta.setSelectionRange(lineStart, lineEnd);
}

function getSelectedText(ta: HTMLTextAreaElement): string {
  return ta.value.substring(ta.selectionStart, ta.selectionEnd);
}

function duplicateLineOrSelection(ta: HTMLTextAreaElement): void {
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  if (start !== end) {
    const selected = getSelectedText(ta);
    ta.setRangeText(selected + selected, start, end, 'end');
  } else {
    const {lineStart, lineEnd} = getLineInfo(ta);
    const line = ta.value.substring(lineStart, lineEnd);
    if (lineEnd >= ta.value.length) {
      ta.setRangeText('\n' + line, lineEnd, lineEnd, 'end');
    } else {
      ta.setRangeText(line + '\n', lineEnd + 1, lineEnd + 1, 'end');
    }
  }
}

function deleteCurrentLine(ta: HTMLTextAreaElement): void {
  const {line, lineStart, lineEnd} = getLineInfo(ta);
  const val = ta.value;
  const beforeLine = val.substring(0, lineStart);
  const afterLine = val.substring(lineEnd);
  const newVal = beforeLine + (line > 0 && afterLine.startsWith('\n') ? afterLine.substring(1) : afterLine);
  ta.value = newVal;
  const newPos = Math.min(lineStart, newVal.length);
  ta.setSelectionRange(newPos, newPos);
}

function toggleCase(ta: HTMLTextAreaElement): void {
  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  if (start === end) return;
  const selected = getSelectedText(ta);
  let toggled: string;
  if (selected === selected.toLowerCase()) {
    toggled = selected.toUpperCase();
  } else if (selected === selected.toUpperCase() && selected !== selected.toLowerCase()) {
    toggled = selected.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  } else {
    toggled = selected.toLowerCase();
  }
  ta.setRangeText(toggled, start, end, 'end');
  ta.setSelectionRange(start, start + toggled.length);
}

function moveLineUp(ta: HTMLTextAreaElement): void {
  const {line, lineStart, lineEnd} = getLineInfo(ta);
  if (line === 0) return;
  const val = ta.value;
  const lines = val.split('\n');
  const prevLineStart = lineStart - lines[line - 1].length - 1;
  const currentLine = lines[line];
  const prevLine = lines[line - 1];
  lines[line - 1] = currentLine;
  lines[line] = prevLine;
  ta.value = lines.join('\n');
  const newPos = prevLineStart + (lineEnd - lineStart);
  ta.setSelectionRange(newPos, newPos);
}

function moveLineDown(ta: HTMLTextAreaElement): void {
  const {line, lineStart, lineEnd} = getLineInfo(ta);
  const val = ta.value;
  const lines = val.split('\n');
  if (line >= lines.length - 1) return;
  const currentLine = lines[line];
  const nextLine = lines[line + 1];
  lines[line] = nextLine;
  lines[line + 1] = currentLine;
  ta.value = lines.join('\n');
  const newPos = lineStart + nextLine.length + 1 + (lineEnd - lineStart);
  ta.setSelectionRange(newPos, newPos);
}

export function toggleFullscreen(): void {
  fullscreen = !fullscreen;
  try {
    if (fullscreen) {
      (window as any).runtime.WindowFullscreen();
    } else {
      (window as any).runtime.WindowUnfullscreen();
    }
  } catch {}
}
