import {describe, expect, it, vi, beforeEach} from 'vitest';
import {AutocompletePopup} from './AutocompletePopup';
import type {AutocompleteItem} from '../types';

const ITEMS: AutocompleteItem[] = [
  {name: 'sin', category: 'function', description: 'Sine'},
  {name: 'cos', category: 'function', description: 'Cosine'},
  {name: 'sqrt', category: 'function', description: 'Square root'},
  {name: 'pi', category: 'constant', description: 'Pi'},
  {name: 'km', category: 'unit', description: 'Kilometer'},
  {name: 'meter', category: 'unit', description: 'Meter'},
];

describe('AutocompletePopup', () => {
  let popup: AutocompletePopup;

  beforeEach(() => {
    popup = new AutocompletePopup();
    document.body.appendChild(popup.el);
    popup.setItems(ITEMS);
  });

  it('creates popup element', () => {
    expect(popup.el).toBeTruthy();
    expect(popup.el.classList.contains('autocomplete-popup')).toBe(true);
  });

  it('is not visible by default', () => {
    expect(popup.isVisible()).toBe(false);
  });

  it('shows filtered items by prefix', () => {
    popup.show(0, 0, 'si');
    expect(popup.isVisible()).toBe(true);
    const filtered = popup.getFiltered();
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('sin');
  });

  it('shows all items when filter is empty', () => {
    popup.show(0, 0, '');
    const filtered = popup.getFiltered();
    expect(filtered.length).toBe(ITEMS.length);
  });

  it('hides when no matches', () => {
    popup.show(0, 0, 'zzz');
    expect(popup.isVisible()).toBe(false);
  });

  it('filters case-insensitively', () => {
    popup.show(0, 0, 'SQRT');
    const filtered = popup.getFiltered();
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('sqrt');
  });

  it('moveSelection cycles through items', () => {
    popup.show(0, 0, 's');
    const filtered = popup.getFiltered();
    expect(filtered.length).toBe(2); // sin, sqrt
    expect(popup.getSelectedIndex()).toBe(0);
    popup.moveSelection(1);
    expect(popup.getSelectedIndex()).toBe(1);
    popup.moveSelection(1);
    expect(popup.getSelectedIndex()).toBe(0); // wraps
    popup.moveSelection(-1);
    expect(popup.getSelectedIndex()).toBe(1); // wraps back
  });

  it('selectCurrent calls onSelect', () => {
    const onSelect = vi.fn();
    popup.onSelect = onSelect;
    popup.show(0, 0, 'si');
    popup.selectCurrent();
    expect(onSelect).toHaveBeenCalledWith(ITEMS[0]); // sin
  });

  it('hide clears state', () => {
    popup.show(0, 0, 'si');
    expect(popup.isVisible()).toBe(true);
    popup.hide();
    expect(popup.isVisible()).toBe(false);
    expect(popup.getFiltered()).toEqual([]);
  });

  it('updateFilter changes results dynamically', () => {
    popup.show(0, 0, 's');
    expect(popup.getFiltered().length).toBe(2); // sin, sqrt
    popup.updateFilter('sq', 0, 0);
    expect(popup.getFiltered().length).toBe(1);
    expect(popup.getFiltered()[0].name).toBe('sqrt');
  });

  it('updateFilter hides when no matches', () => {
    popup.show(0, 0, 's');
    popup.updateFilter('zzz', 0, 0);
    expect(popup.isVisible()).toBe(false);
  });

  it('limits results to 8 items', () => {
    const manyItems: AutocompleteItem[] = [];
    for (let i = 0; i < 20; i++) {
      manyItems.push({name: `func${i}`, category: 'function', description: `Function ${i}`});
    }
    popup.setItems(manyItems);
    popup.show(0, 0, 'f');
    expect(popup.getFiltered().length).toBe(8);
  });

  it('returns empty filtered before any show/setItems', () => {
    const fresh = new AutocompletePopup();
    expect(fresh.getFiltered()).toEqual([]);
  });
});
