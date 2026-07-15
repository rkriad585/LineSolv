const FONT_URLS: Record<string, string> = {
  'Cascadia Code': 'https://fonts.googleapis.com/css2?family=Cascadia+Code&display=swap',
  'Fira Code': 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&display=swap',
  'Hack': 'https://fonts.googleapis.com/css2?family=Hack&display=swap',
  'IBM Plex Mono': 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap',
  'Inter': 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
  'JetBrains Mono': 'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap',
  'Overpass': 'https://fonts.googleapis.com/css2?family=Overpass:wght@400;500;600&display=swap',
  'Playfair Display': 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&display=swap',
  'Source Code Pro': 'https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@400;500;600&display=swap',
  'Space Mono': 'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap',
  'Ubuntu': 'https://fonts.googleapis.com/css2?family=Ubuntu:wght@400;500;700&display=swap',
  'Victor Mono': 'https://fonts.googleapis.com/css2?family=Victor+Mono:wght@400;500;600&display=swap',
};

const loaded = new Set<string>();

function extractFamilyName(cssFamily: string): string | null {
  const first = cssFamily.split(',')[0]?.trim().replace(/['"]/g, '') ?? '';
  return FONT_URLS[first] ? first : null;
}

export function loadFontForFamily(cssFamily: string): void {
  const name = extractFamilyName(cssFamily);
  if (!name || loaded.has(name)) return;
  loaded.add(name);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = FONT_URLS[name];
  document.head.appendChild(link);
}
