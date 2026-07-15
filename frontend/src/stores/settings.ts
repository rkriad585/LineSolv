import type { SettingsData } from '../types';
import * as serviceBindings from '../../wailsjs/go/service/AppService';
import { toast } from '../utils/toast';

export interface SettingsState {
  theme: string;
  ui_style: string;
  font_size: string;
  font_family: string;
  shortcut_overrides: string;
  autocomplete_enabled: boolean;
  animations_enabled: boolean;
  toast_enabled: boolean;
  opacity: number;
  line_numbers_enabled: boolean;
  result_panel_enabled: boolean;
  line_wrap_enabled: boolean;
  theme_manually_set: boolean;
}

type SettingsListener = (state: SettingsState) => void;

const DEFAULTS: SettingsState = {
  theme: 'dark',
  ui_style: 'default',
  font_size: '16',
  font_family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  shortcut_overrides: '{}',
  autocomplete_enabled: true,
  animations_enabled: true,
  toast_enabled: true,
  opacity: 0.95,
  line_numbers_enabled: true,
  result_panel_enabled: true,
  line_wrap_enabled: true,
  theme_manually_set: false,
};

function toBool(v: string | undefined, def: boolean): boolean {
  if (v === undefined || v === '') return def;
  return v === 'true';
}

function toFloat(v: string | undefined, def: number): number {
  if (v === undefined || v === '') return def;
  const n = parseFloat(v);
  return isNaN(n) ? def : n;
}

function fromStore(s: SettingsState): SettingsData {
  return {
    theme: s.theme,
    ui_style: s.ui_style,
    font_size: s.font_size,
    font_family: s.font_family,
    shortcut_overrides: s.shortcut_overrides,
    autocomplete_enabled: String(s.autocomplete_enabled),
    animations_enabled: String(s.animations_enabled),
    toast_enabled: String(s.toast_enabled),
    opacity: String(s.opacity),
    line_numbers_enabled: String(s.line_numbers_enabled),
    result_panel_enabled: String(s.result_panel_enabled),
    line_wrap_enabled: String(s.line_wrap_enabled),
    theme_manually_set: String(s.theme_manually_set),
  };
}

function toStore(d: SettingsData): SettingsState {
  return {
    theme: d.theme || DEFAULTS.theme,
    ui_style: d.ui_style || DEFAULTS.ui_style,
    font_size: d.font_size || DEFAULTS.font_size,
    font_family: d.font_family || DEFAULTS.font_family,
    shortcut_overrides: d.shortcut_overrides || DEFAULTS.shortcut_overrides,
    autocomplete_enabled: toBool(d.autocomplete_enabled, true),
    animations_enabled: toBool(d.animations_enabled, true),
    toast_enabled: toBool(d.toast_enabled, true),
    opacity: toFloat(d.opacity, 0.95),
    line_numbers_enabled: toBool(d.line_numbers_enabled, true),
    result_panel_enabled: toBool(d.result_panel_enabled, true),
    line_wrap_enabled: toBool(d.line_wrap_enabled, true),
    theme_manually_set: toBool(d.theme_manually_set, false),
  };
}

/** Reactive store for application settings. */
export class SettingsStore {
  private state: SettingsState = { ...DEFAULTS };
  private listeners: SettingsListener[] = [];

  getState(): Readonly<SettingsState> {
    return this.state;
  }

  onChanged(fn: SettingsListener): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter(l => l !== fn);
    };
  }

  private notify(): void {
    for (const fn of this.listeners) fn(this.state);
  }

  async load(): Promise<SettingsState> {
    try {
      const data = await serviceBindings.GetSettings();
      this.state = toStore(data as SettingsData);
    } catch {
      this.state = { ...DEFAULTS };
      toast.show('Failed to load settings', 'error');
    }
    this.notify();
    return this.state;
  }

  update(partial: Partial<SettingsState>): void {
    this.state = { ...this.state, ...partial };
    this.notify();
    this.scheduleSave();
  }

  private saveTimer: number | null = null;

  scheduleSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(async () => {
      this.saveTimer = null;
      try {
        await this.save();
      } catch {
        toast.show('Failed to save settings', 'error');
      }
    }, 50);
  }

  async save(): Promise<void> {
    const data = fromStore(this.state);
    await serviceBindings.SaveSettings(data);
  }
}
