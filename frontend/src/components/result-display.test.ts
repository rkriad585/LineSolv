import {describe, it, expect, beforeEach} from 'vitest';
import {ResultDisplay} from '../components/ResultDisplay';

describe('ResultDisplay', () => {
  let display: ResultDisplay;

  beforeEach(() => {
    display = new ResultDisplay();
  });

  it('creates element with correct id', () => {
    expect(display.el.id).toBe('results-column');
  });

  it('initializes with non-breaking space entity', () => {
    expect(display.el.innerHTML).toContain('&nbsp;');
  });

  it('setResults replaces innerHTML', () => {
    display.setResults('<div>42</div>');
    expect(display.el.innerHTML).toBe('<div>42</div>');
  });

  it('setResults preserves scroll position', () => {
    display.el.style.height = '50px';
    display.el.style.overflow = 'auto';
    display.el.innerHTML = '<div style="height:200px">tall</div>';
    display.el.scrollTop = 100;
    const scrollBefore = display.el.scrollTop;
    display.setResults('<div style="height:200px">tall</div>');
    expect(display.el.scrollTop).toBe(scrollBefore);
  });

  it('setResults with empty string clears content', () => {
    display.setResults('<div>hello</div>');
    display.setResults('');
    expect(display.el.innerHTML).toBe('');
  });

  it('setResults with HTML entities renders correctly', () => {
    display.setResults('<div>&lt;script&gt;alert(1)&lt;/script&gt;</div>');
    expect(display.el.textContent).toBe('<script>alert(1)</script>');
  });
});
