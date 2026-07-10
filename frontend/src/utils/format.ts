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

/** Build HTML for the result column: one entry per visual line to match textarea word-wrap. */
export function buildLineResults(
  lines: string[],
  res: string[],
  loading: boolean,
  visualInfo?: { logicalStarts: number[]; totalVisual: number }
): string {
  if (!visualInfo || visualInfo.logicalStarts.length !== lines.length) {
    return buildLineResultsFlat(lines, res, loading);
  }
  const {logicalStarts, totalVisual} = visualInfo;
  let html = '';
  for (let i = 0; i < lines.length; i++) {
    const start = logicalStarts[i];
    const end = i + 1 < logicalStarts.length ? logicalStarts[i + 1] : totalVisual;
    const count = end - start;
    const t = lines[i].trim();
    const isEmpty = !t || t.startsWith('#') || t.startsWith('//') || t.endsWith(':');
    for (let v = 0; v < count; v++) {
      if (v === 0) {
        if (isEmpty) {
          html += '<div style="color:var(--text-subtle)">\u00A0</div>';
        } else if (loading) {
          html += '<div style="color:var(--text-muted)">\u2026</div>';
        } else {
          const r = res[i];
          html += `<div style="${r ? '' : 'color:var(--text-subtle)'}">${formatResult(r || '') || '\u00A0'}</div>`;
        }
      } else {
        // Continuation visual line (word-wrap) — empty placeholder
        html += '<div style="color:var(--text-subtle)">\u00A0</div>';
      }
    }
  }
  return html;
}

/** Fallback: one result div per logical line (no visual info available). */
function buildLineResultsFlat(lines: string[], res: string[], loading: boolean): string {
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
