import {describe, expect, it} from 'vitest';
import {formatResult, buildLineResults} from './format';

describe('formatResult', () => {
  it('returns non-breaking space for empty string', () => {
    expect(formatResult('')).toBe('\u00A0');
  });

  it('highlights variable assignments', () => {
    const html = formatResult('x = 42');
    expect(html).toContain('x =');
    expect(html).toContain('42');
    expect(html).toContain('accent');
  });

  it('highlights error messages', () => {
    const html = formatResult('Error: division by zero');
    expect(html).toContain('Error: division by zero');
    expect(html).toContain('ef4444');
  });

  it('escapes HTML in plain results', () => {
    const html = formatResult('5 < 10');
    expect(html).toContain('&lt;');
    expect(html).not.toContain('<');
  });

  it('escapes HTML in error messages', () => {
    const html = formatResult('Error: <script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
  });

  it('returns plain result for normal output', () => {
    const html = formatResult('42');
    expect(html).toBe('42');
  });
});

describe('buildLineResults', () => {
  it('renders empty placeholder for blank lines', () => {
    const html = buildLineResults([''], [''], false);
    expect(html).toContain('\u00A0');
  });

  it('renders empty placeholder for comment lines', () => {
    const html = buildLineResults(['# comment'], [''], false);
    expect(html).toContain('\u00A0');
  });

  it('renders results for non-empty lines', () => {
    const html = buildLineResults(['42'], ['42'], false);
    expect(html).toContain('42');
  });

  it('renders ellipsis when loading', () => {
    const html = buildLineResults(['42'], [], true);
    expect(html).toContain('\u2026');
  });

  it('renders empty at low opacity for error lines', () => {
    const html = buildLineResults(['bad'], [''], false);
    expect(html).toContain('\u00A0');
  });

  it('handles visual line info for word-wrapped input', () => {
    const html = buildLineResults(
      ['hello world', 'foo'],
      ['hi', 'bar'],
      false,
      {logicalStarts: [0, 2], totalVisual: 4}
    );
    // First logical line (2 visual lines): first shows "hi", second is continuation
    expect(html).toContain('hi');
    // Second logical line
    expect(html).toContain('bar');
  });
});
