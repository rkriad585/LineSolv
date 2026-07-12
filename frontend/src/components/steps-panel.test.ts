import {describe, it, expect, beforeEach} from 'vitest';
import {StepsPanel} from '../components/StepsPanel';
import type {calculator} from '../../wailsjs/go/models';

type Step = calculator.Step;

function makeStep(overrides: Partial<Step> = {}): Step {
  return {
    operation: overrides.operation ?? 'add',
    expression: overrides.expression ?? '2 + 3',
    result: overrides.result ?? '5',
  };
}

describe('StepsPanel', () => {
  let panel: StepsPanel;

  beforeEach(() => {
    panel = new StepsPanel();
  });

  it('initializes closed', () => {
    expect(panel.isOpen()).toBe(false);
    expect(panel.el.style.width).toBe('0px');
  });

  it('opens and closes', () => {
    panel.open();
    expect(panel.isOpen()).toBe(true);
    expect(panel.el.style.width).toBe('220px');

    panel.close();
    expect(panel.isOpen()).toBe(false);
    expect(panel.el.style.width).toBe('0px');
  });

  it('shows placeholder when steps are empty', () => {
    panel.open();
    panel.render([], '');
    expect(panel.contentEl.textContent).toContain('Evaluate an expression to see steps');
  });

  it('shows placeholder when steps is null', () => {
    panel.open();
    panel.render(null as unknown as Step[], '');
    expect(panel.contentEl.textContent).toContain('Evaluate an expression to see steps');
  });

  it('renders step items', () => {
    panel.open();
    panel.render([
      makeStep({operation: 'naturalize', expression: '2 + 3', result: '2 + 3'}),
      makeStep({operation: 'add', expression: '2 + 3', result: '5'}),
    ], '5');
    const items = panel.contentEl.querySelectorAll('.step-item');
    expect(items.length).toBe(2);
  });

  it('displays operation label', () => {
    panel.open();
    panel.render([makeStep({operation: 'add'})], '5');
    expect(panel.contentEl.textContent).toContain('Add');
  });

  it('displays expression and result', () => {
    panel.open();
    panel.render([makeStep({operation: 'multiply', expression: '3 * 4', result: '12'})], '12');
    expect(panel.contentEl.textContent).toContain('3 * 4');
    expect(panel.contentEl.textContent).toContain('= 12');
  });

  it('uses fallback label for unknown operation', () => {
    panel.open();
    panel.render([makeStep({operation: 'unknown_op'})], '');
    expect(panel.contentEl.textContent).toContain('unknown_op');
  });

  it('renders many steps without crashing', () => {
    panel.open();
    const steps = Array.from({length: 50}, (_, i) =>
      makeStep({operation: 'add', expression: `${i} + ${i}`, result: String(i * 2)})
    );
    panel.render(steps, '98');
    expect(panel.contentEl.querySelectorAll('.step-item').length).toBe(50);
  });
});
