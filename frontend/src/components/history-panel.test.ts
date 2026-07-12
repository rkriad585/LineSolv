import {describe, it, expect, beforeEach, vi} from 'vitest';
import {HistoryPanel} from '../components/HistoryPanel';
import type {HistoryEntry} from '../stores/calculator';

function makeEntries(count: number): HistoryEntry[] {
  return Array.from({length: count}, (_, i) => ({
    input: `input ${i}`,
    output: `result ${i}`,
  }));
}

describe('HistoryPanel', () => {
  let panel: HistoryPanel;
  let restoreFn: (input: string) => void;

  beforeEach(() => {
    restoreFn = vi.fn() as unknown as (input: string) => void;
    panel = new HistoryPanel(restoreFn);
  });

  it('initializes closed', () => {
    expect(panel.isOpen()).toBe(false);
    expect(panel.el.style.width).toBe('0px');
  });

  it('opens and closes', () => {
    panel.open();
    expect(panel.isOpen()).toBe(true);
    expect(panel.el.style.width).toBe('200px');

    panel.close();
    expect(panel.isOpen()).toBe(false);
    expect(panel.el.style.width).toBe('0px');
  });

  it('renders history entries when open', () => {
    panel.open();
    panel.render(makeEntries(3));
    const items = panel.contentEl.querySelectorAll('.history-item');
    expect(items.length).toBe(3);
  });

  it('does not render DOM when closed', () => {
    panel.render(makeEntries(3));
    const items = panel.contentEl.querySelectorAll('.history-item');
    expect(items.length).toBe(0);
  });

  it('filters entries by input text', () => {
    panel.open();
    panel.render(makeEntries(5));
    panel.searchInput.value = 'input 2';
    panel.searchInput.dispatchEvent(new Event('input'));
    const items = panel.contentEl.querySelectorAll('.history-item');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('input 2');
  });

  it('filters entries by output text', () => {
    panel.open();
    panel.render(makeEntries(5));
    panel.searchInput.value = 'result 3';
    panel.searchInput.dispatchEvent(new Event('input'));
    const items = panel.contentEl.querySelectorAll('.history-item');
    expect(items.length).toBe(1);
  });

  it('shows no matching history message when filter has no results', () => {
    panel.open();
    panel.render(makeEntries(3));
    panel.searchInput.value = 'nonexistent';
    panel.searchInput.dispatchEvent(new Event('input'));
    expect(panel.contentEl.textContent).toContain('No matching history');
  });

  it('shows no history message when list is empty', () => {
    panel.open();
    panel.render([]);
    expect(panel.contentEl.textContent).toContain('No history');
  });

  it('calls onRestore when item is clicked', () => {
    panel.open();
    panel.render(makeEntries(2));
    const item = panel.contentEl.querySelector('.history-item') as HTMLElement;
    item.click();
    expect(restoreFn).toHaveBeenCalledWith('input 0');
  });

  it('clearFilter resets search input', () => {
    panel.open();
    panel.searchInput.value = 'test';
    panel.clearFilter();
    expect(panel.searchInput.value).toBe('');
  });

  it('truncates long input to 40 chars', () => {
    panel.open();
    const longInput = 'a'.repeat(100);
    panel.render([{input: longInput, output: '42'}]);
    const item = panel.contentEl.querySelector('.history-item') as HTMLElement;
    expect(item.textContent).toContain('...');
    expect(item.textContent).not.toContain(longInput);
  });
});
