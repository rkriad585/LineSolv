/** Escape text to safe HTML (prevents XSS via innerHTML). */
export function escapeHtml(t: string): string {
  const d = document.createElement('div');
  d.textContent = t;
  return d.innerHTML;
}
