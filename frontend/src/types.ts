export interface Note {
  id: string;
  name: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface ContextMenuItem {
  label: string;
  icon?: string;
  action?: () => void;
  disabled?: boolean;
  children?: ContextMenuItem[];
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
