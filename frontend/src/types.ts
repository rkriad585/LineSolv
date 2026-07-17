export interface Folder {
  id: string;
  name: string;
  parentId: string;
  icon: string;
  position: number;
  createdAt: number;
  updatedAt: number;
}

export interface Note {
  id: string;
  name: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  position: number;
  folderId: string;
  icon: string;
}

export type TreeNode =
  | { type: 'folder'; folder: Folder; children: TreeNode[]; depth: number }
  | { type: 'note'; note: Note; depth: number };

export type ContextMenuItem =
  | {
      label: string;
      icon?: string;
      shortcut?: string;
      action?: () => void;
      disabled?: boolean;
      children?: ContextMenuItem[];
    }
  | {
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
  result_panel_enabled: string;
  line_wrap_enabled: string;
  ui_style: string;
  theme_manually_set: string;
  noise: string;
  context_menu_notes: string;
  context_menu_folders: string;
  drag_and_drop: string;
  confirm_dialog: string;
}

export interface AutocompleteItem {
  name: string;
  category: 'function' | 'constant' | 'unit' | 'variable' | 'plugin';
  description: string;
}
