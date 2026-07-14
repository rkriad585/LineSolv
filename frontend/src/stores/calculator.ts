import type { AutocompleteItem } from '../types';

export interface HistoryEntry {
  input: string;
  output: string;
}

export type EvalState = 'idle' | 'loading' | 'error';

export interface StoreState {
  input: string;
  results: string[];
  variables: Record<string, number>;
  evalState: EvalState;
  error: string | null;
  history: HistoryEntry[];
  historyIndex: number;
  autocompleteItems: AutocompleteItem[];
  autocompleteVisible: boolean;
  autocompleteIndex: number;
  autocompleteFilter: string;
}

type Listener = (state: StoreState) => void;

/** Reactive store for calculator state (input, results, variables, history). */
export class CalculatorStore {
  private state: StoreState = {
    input: '',
    results: [],
    variables: {},
    evalState: 'idle',
    error: null,
    history: [],
    historyIndex: -1,
    autocompleteItems: [],
    autocompleteVisible: false,
    autocompleteIndex: 0,
    autocompleteFilter: '',
  };

  private listeners = new Set<Listener>();

  getState(): StoreState {
    return this.state;
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify(): void {
    const st = this.state;
    this.listeners.forEach(fn => fn(st));
  }

  setInput(val: string): void {
    if (val === this.state.input) return;
    this.state = { ...this.state, input: val };
    this.notify();
  }

  setResults(val: string[]): void {
    this.state = { ...this.state, results: val };
    this.notify();
  }

  setVariables(val: Record<string, number>): void {
    this.state = { ...this.state, variables: val };
    this.notify();
  }

  setEvalState(val: EvalState): void {
    this.state = { ...this.state, evalState: val };
    this.notify();
  }

  setError(val: string | null): void {
    this.state = { ...this.state, error: val };
    this.notify();
  }

  pushHistory(entry: HistoryEntry): void {
    this.state = {
      ...this.state,
      history: [...this.state.history, entry],
      historyIndex: -1,
    };
    this.notify();
  }

  private setHistoryIndex(val: number): void {
    this.state = { ...this.state, historyIndex: val };
    this.notify();
  }

  navigateHistory(dir: 'up' | 'down'): string | null {
    const { history, historyIndex } = this.state;
    if (history.length === 0) return null;
    let idx = historyIndex;
    if (dir === 'up') {
      idx = Math.min(idx + 1, history.length - 1);
    } else {
      idx = Math.max(idx - 1, -1);
    }
    this.setHistoryIndex(idx);
    if (idx === -1) return null;
    return history[history.length - 1 - idx].input;
  }

  clearHistory(): void {
    this.state = { ...this.state, history: [], historyIndex: -1 };
    this.notify();
  }

  setAutocompleteItems(items: AutocompleteItem[]): void {
    this.state = { ...this.state, autocompleteItems: items };
  }

  setAutocompleteVisible(visible: boolean): void {
    this.state = { ...this.state, autocompleteVisible: visible };
    this.notify();
  }

  setAutocompleteIndex(index: number): void {
    this.state = { ...this.state, autocompleteIndex: index };
    this.notify();
  }

  setAutocompleteFilter(filter: string): void {
    this.state = { ...this.state, autocompleteFilter: filter };
  }
}
