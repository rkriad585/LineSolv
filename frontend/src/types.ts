export interface Note {
  id: string;
  name: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  position?: number;
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
  onToggleHistory: () => void;
  onToggleSteps: () => void;
  onTogglePlugins: () => void;
  onSwitchNote: (id: string) => void;
  onClearAll: () => void;
  onToggleFullscreen: () => void;
  onToggleSettings: () => void;
  onToggleDocs: () => void;
  onPrint: () => void;
}

export interface SettingsData {
  theme: string;
  font_size: string;
  font_family: string;
  shortcut_overrides: string;
}

export interface UpdateInfo {
  update_available: boolean;
  current_version: string;
  latest_version: string;
  download_url: string;
}

export interface ShortcutDef {
  id: string;
  keys: string;
  desc: string;
}
