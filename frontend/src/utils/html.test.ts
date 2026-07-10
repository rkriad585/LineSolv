import {describe, expect, it} from 'vitest';
import {escapeHtml} from './html';

describe('escapeHtml', () => {
  it('escapes < > & "', () => {
    expect(escapeHtml('<script>alert("xss")</script>'))
      .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  it('escapes & first', () => {
    expect(escapeHtml('a&b')).toBe('a&amp;b');
  });

  it('leaves safe strings unchanged', () => {
    expect(escapeHtml('hello world')).toBe('hello world');
  });

  it('handles empty string', () => {
    expect(escapeHtml('')).toBe('');
  });
});
