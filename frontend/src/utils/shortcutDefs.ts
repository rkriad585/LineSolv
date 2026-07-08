export interface ShortcutDef {
  id: string;
  keys: string;
  desc: string;
}

export const ALL_SHORTCUTS: ShortcutDef[] = [
  // Navigation (native)
  {id: 'nav_move', keys: '\u2190 \u2191 \u2192 \u2193', desc: 'Move cursor'},
  {id: 'nav_jump_word', keys: 'Ctrl / Cmd + \u2190 / \u2192', desc: 'Jump word left/right'},
  {id: 'nav_home_end', keys: 'Home / End', desc: 'Start / end of line'},
  {id: 'nav_doc_home_end', keys: 'Ctrl / Cmd + Home / End', desc: 'Start / end of text'},
  {id: 'nav_page', keys: 'Page Up / Page Down', desc: 'Scroll page up/down'},
  // Text editing (native)
  {id: 'undo', keys: 'Ctrl / Cmd + Z', desc: 'Undo'},
  {id: 'redo', keys: 'Ctrl / Cmd + Shift + Z / Ctrl / Cmd + Y', desc: 'Redo'},
  {id: 'cut', keys: 'Ctrl / Cmd + X', desc: 'Cut'},
  {id: 'copy', keys: 'Ctrl / Cmd + C', desc: 'Copy'},
  {id: 'paste', keys: 'Ctrl / Cmd + V', desc: 'Paste'},
  {id: 'select_all', keys: 'Ctrl / Cmd + A', desc: 'Select all'},
  // Custom text editing
  {id: 'duplicate', keys: 'Ctrl / Cmd + D', desc: 'Duplicate line or selection'},
  {id: 'select_line', keys: 'Ctrl / Cmd + L', desc: 'Select current line'},
  {id: 'delete_line', keys: 'Ctrl / Cmd + Shift + K', desc: 'Delete current line'},
  {id: 'toggle_case', keys: 'Alt + Shift', desc: 'Toggle case (lower \u2192 UPPER \u2192 Title)'},
  {id: 'move_up', keys: 'Alt + \u2191', desc: 'Move current line up/down'},
  {id: 'move_down', keys: 'Alt + \u2193', desc: 'Move current line up/down'},
  // App actions
  {id: 'tab', keys: 'Tab', desc: 'Insert 2 spaces'},
  {id: 'force_eval', keys: 'Shift + Enter', desc: 'Force evaluate now'},
  {id: 'escape', keys: 'Escape', desc: 'Close modal / clear input / close panel'},
  {id: 'toggle_notes', keys: 'Ctrl / Cmd + B', desc: 'Toggle notes sidebar'},
  {id: 'toggle_vars', keys: 'Ctrl / Cmd + I', desc: 'Toggle variables panel'},
  {id: 'toggle_history', keys: 'Ctrl / Cmd + H', desc: 'Toggle history panel'},
  {id: 'toggle_steps', keys: 'Ctrl / Cmd + S', desc: 'Toggle step-by-step panel'},
  {id: 'toggle_settings', keys: 'Ctrl / Cmd + ,', desc: 'Open settings'},
  {id: 'clear_all', keys: 'Ctrl / Cmd + K', desc: 'Clear all (input, history, variables)'},
  {id: 'new_note', keys: 'Ctrl / Cmd + N', desc: 'Create new note'},
  {id: 'shortcut_ref', keys: '? / Cmd + /', desc: 'Show shortcuts reference'},
  {id: 'history_up', keys: 'Ctrl / Cmd + \u2191', desc: 'History: previous input'},
  {id: 'history_down', keys: 'Ctrl / Cmd + \u2193', desc: 'History: next input'},
  {id: 'search_notes', keys: 'Ctrl / Cmd + F', desc: 'Search notes'},
  {id: 'print', keys: 'Ctrl / Cmd + P', desc: 'Print current note'},
];
