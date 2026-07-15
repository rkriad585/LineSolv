export interface Note {
  id: string;
  name: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  position?: number;
}

export type ContextMenuItem = {
  label: string;
  icon?: string;
  shortcut?: string;
  action?: () => void;
  disabled?: boolean;
  children?: ContextMenuItem[];
} | {
  separator: true;
};

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
  autocomplete_enabled: string;
  animations_enabled: string;
  toast_enabled: string;
  opacity: string;
  line_numbers_enabled: string;
  ui_style: string;
  theme_manually_set: string;
}

export interface UpdateInfo {
  update_available: boolean;
  current_version: string;
  latest_version: string;
  download_url: string;
}

export interface AutocompleteItem {
  name: string;
  category: 'function' | 'constant' | 'unit' | 'variable' | 'plugin';
  description: string;
}
