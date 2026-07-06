export interface Note {
  id: string;
  name: string;
  content: string;
}

export interface AppCallbacks {
  onEvaluateAll: () => Promise<void>;
  onNewNote: () => void;
  onToggleNotes: () => void;
  onToggleVars: () => void;
  onSwitchNote: (id: string) => void;
  onClearAll: () => void;
  onThemeToggle: () => void;
}
