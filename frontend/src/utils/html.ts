/** Escape text to safe HTML (prevents XSS via innerHTML). */
const escapeRE = /[&<>"']/g;
const escapeMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
export function escapeHtml(t: string): string {
  return t.replace(escapeRE, ch => escapeMap[ch] || ch);
}
