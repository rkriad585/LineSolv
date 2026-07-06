import {escapeHtml} from './html';

/** Format a single result string: assignments, errors, or plain output. */
export function formatResult(r: string): string {
  if (!r) return '\u00A0';
  if (/^\w+\s*=/.test(r)) {
    const parts = r.split('=');
    return `<span style="color:var(--text-muted)">${escapeHtml(parts[0])}=</span><span style="color:var(--accent)">${escapeHtml(parts.slice(1).join('='))}</span>`;
  }
  if (/^Error:/i.test(r)) {
    return `<span style="color:var(--error, #ef4444)">${escapeHtml(r)}</span>`;
  }
  return escapeHtml(r);
}

/** Build HTML for the result column: one entry per line, loading dots, or errors. */
export function buildLineResults(lines: string[], res: string[], loading: boolean): string {
  let html = '';
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!t || t.startsWith('#') || t.startsWith('//') || t.endsWith(':')) {
      html += '<div style="color:var(--text-subtle)">\u00A0</div>';
    } else if (loading) {
      html += '<div style="color:var(--text-muted)">\u2026</div>';
    } else {
      const r = res[i];
      html += `<div style="${r ? '' : 'color:var(--text-subtle)'}">${formatResult(r || '') || '\u00A0'}</div>`;
    }
  }
  return html;
}
