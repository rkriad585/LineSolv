import {describe, it, expect, beforeEach} from 'vitest';
import {VariableExplorer} from '../components/VariableExplorer';

describe('VariableExplorer', () => {
  let panel: VariableExplorer;

  beforeEach(() => {
    panel = new VariableExplorer();
  });

  it('initializes closed', () => {
    expect(panel.isOpen()).toBe(false);
    expect(panel.el.style.width).toBe('0px');
  });

  it('opens and closes', () => {
    panel.open();
    expect(panel.isOpen()).toBe(true);
    expect(panel.el.style.width).toBe('180px');

    panel.close();
    expect(panel.isOpen()).toBe(false);
    expect(panel.el.style.width).toBe('0px');
  });

  it('shows no variables message when empty', () => {
    panel.open();
    panel.render({});
    expect(panel.contentEl.textContent).toContain('No variables');
  });

  it('renders variables sorted by name', () => {
    panel.open();
    panel.render({z: 26, a: 1, m: 13});
    const text = panel.contentEl.textContent ?? '';
    const aPos = text.indexOf('a');
    const mPos = text.indexOf('m');
    const zPos = text.indexOf('z');
    expect(aPos).toBeLessThan(mPos);
    expect(mPos).toBeLessThan(zPos);
  });

  it('displays integer values without decimals', () => {
    panel.open();
    panel.render({x: 42});
    expect(panel.contentEl.textContent).toContain('42');
  });

  it('displays float values rounded to 6 decimals', () => {
    panel.open();
    panel.render({pi: 3.141592653589793});
    const text = panel.contentEl.textContent ?? '';
    expect(text).toContain('3.141593');
  });

  it('defers rendering when closed', () => {
    panel.render({x: 1});
    // Content should not be built yet
    expect(panel.contentEl.textContent).toBe('');

    // Opening should trigger deferred render
    panel.open();
    expect(panel.contentEl.textContent).toContain('x');
  });

  it('handles many variables', () => {
    panel.open();
    const vars: Record<string, number> = {};
    for (let i = 0; i < 100; i++) {
      vars[`var${i}`] = i;
    }
    panel.render(vars);
    const entries = panel.contentEl.querySelectorAll('[class*="flex justify-between"]');
    expect(entries.length).toBe(100);
  });
});
