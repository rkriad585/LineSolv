import {describe, expect, it} from 'vitest';
import {CalculatorStore} from './calculator';

describe('CalculatorStore', () => {
  it('starts with default state', () => {
    const s = new CalculatorStore();
    const st = s.getState();
    expect(st.input).toBe('');
    expect(st.results).toEqual([]);
    expect(st.variables).toEqual({});
    expect(st.evalState).toBe('idle');
    expect(st.error).toBeNull();
    expect(st.history).toEqual([]);
    expect(st.historyIndex).toBe(-1);
  });

  it('setInput updates input', () => {
    const s = new CalculatorStore();
    s.setInput('hello');
    expect(s.getState().input).toBe('hello');
  });

  it('setInput does not notify when value is the same', () => {
    const s = new CalculatorStore();
    let calls = 0;
    s.subscribe(() => calls++);
    s.setInput('');
    expect(calls).toBe(0);
  });

  it('setResults updates results', () => {
    const s = new CalculatorStore();
    s.setResults(['42', '84']);
    expect(s.getState().results).toEqual(['42', '84']);
  });

  it('setVariables updates variables', () => {
    const s = new CalculatorStore();
    s.setVariables({x: 10, pi: 3.14});
    expect(s.getState().variables).toEqual({x: 10, pi: 3.14});
  });

  it('setEvalState updates eval state', () => {
    const s = new CalculatorStore();
    s.setEvalState('loading');
    expect(s.getState().evalState).toBe('loading');
    s.setEvalState('error');
    expect(s.getState().evalState).toBe('error');
    s.setEvalState('idle');
    expect(s.getState().evalState).toBe('idle');
  });

  it('setError updates error', () => {
    const s = new CalculatorStore();
    s.setError('something went wrong');
    expect(s.getState().error).toBe('something went wrong');
    s.setError(null);
    expect(s.getState().error).toBeNull();
  });

  it('pushHistory adds entry and resets index', () => {
    const s = new CalculatorStore();
    s.pushHistory({input: '42', output: '42'});
    expect(s.getState().history).toHaveLength(1);
    expect(s.getState().history[0]).toEqual({input: '42', output: '42'});
    expect(s.getState().historyIndex).toBe(-1);
  });

  it('navigateHistory up/down cycles through entries', () => {
    const s = new CalculatorStore();
    s.pushHistory({input: '1', output: '1'});
    s.pushHistory({input: '2', output: '2'});
    s.pushHistory({input: '3', output: '3'});
    // Navigate up (back in time)
    expect(s.navigateHistory('up')).toBe('3');
    expect(s.navigateHistory('up')).toBe('2');
    expect(s.navigateHistory('up')).toBe('1');
    // Navigate down (forward)
    expect(s.navigateHistory('down')).toBe('2');
    expect(s.navigateHistory('down')).toBe('3');
    // Beyond end returns null
    expect(s.navigateHistory('down')).toBeNull();
  });

  it('navigateHistory returns null when empty', () => {
    const s = new CalculatorStore();
    expect(s.navigateHistory('up')).toBeNull();
    expect(s.navigateHistory('down')).toBeNull();
  });

  it('subscribe notifies listeners on state change', () => {
    const s = new CalculatorStore();
    const received: string[] = [];
    s.subscribe((st) => received.push(st.input));
    s.setInput('a');
    s.setInput('b');
    expect(received).toEqual(['a', 'b']);
  });

  it('subscribe returns unsubscribe function', () => {
    const s = new CalculatorStore();
    let calls = 0;
    const unsub = s.subscribe(() => calls++);
    s.setInput('x');
    expect(calls).toBe(1);
    unsub();
    s.setInput('y');
    expect(calls).toBe(1);
  });

  it('clearHistory resets history and index', () => {
    const s = new CalculatorStore();
    s.pushHistory({input: '42', output: '42'});
    s.clearHistory();
    expect(s.getState().history).toEqual([]);
    expect(s.getState().historyIndex).toBe(-1);
  });
});
