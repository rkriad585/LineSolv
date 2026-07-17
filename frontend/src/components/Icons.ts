const svg = (paths: string, w = 14, h = 14): string =>
  `<svg width="${w}" height="${h}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;

const logoSvg = (w: number, h: number): string =>
  `<svg width="${w}" height="${h}" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="10" y1="9" x2="14" y2="9"/><line x1="10" y1="15" x2="14" y2="15"/></svg>`;

export const Icons = {
  logo: (w = 14, h = 14): string => logoSvg(w, h),
  scissors: () =>
    svg(
      '<circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/>',
    ),
  copy: () =>
    svg(
      '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    ),
  paste: () =>
    svg(
      '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>',
    ),
  checkSquare: () =>
    svg(
      '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    ),
  code: () => svg('<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>'),
  trash: () =>
    svg(
      '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    ),
  filePlus: () =>
    svg(
      '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>',
    ),
  check: () => svg('<polyline points="20 6 9 17 4 12"/>'),
  folder: () =>
    svg('<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>'),
  folderOpen: () =>
    svg(
      '<path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/>',
    ),
  folderStar: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M12 11l1.5 3L16 15l-2.5 2L15 21l-3-2-3 2 .5-4L7 15l2.5-2L7 11z"/>',
    ),
  folderWork: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><rect x="8" y="13" width="8" height="5" rx="1"/><path d="M8 13V9a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v4"/><line x1="10" y1="15" x2="10" y2="13.01"/><line x1="14" y1="15" x2="14" y2="13.01"/>',
    ),
  folderStudy: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M8 12h8"/><path d="M8 16h5"/>',
    ),
  folderPersonal: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><circle cx="12" cy="14" r="3"/><path d="M8 18v.01"/>',
    ),
  folderPrivate: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><rect x="8" y="12" width="8" height="6" rx="1"/><path d="M10 12V9a2 2 0 0 1 4 0v3"/>',
    ),
  folderProjects: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M9 12l2 2 4-4"/>',
    ),
  folderArchive: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><rect x="8" y="11" width="8" height="6" rx="1"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
    ),
  folderHeart: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M12 17.5l-3.5-3.5a2.12 2.12 0 0 1 3-3L12 11.5l.5-.5a2.12 2.12 0 0 1 3 3z"/>',
    ),
  folderLock: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><rect x="9" y="13" width="6" height="4" rx="1"/><path d="M10 13v-1a2 2 0 0 1 4 0v1"/>',
    ),
  folderCloud: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M16 14h.01"/><path d="M12 18h-4a3 3 0 0 1 0-6h1a4 4 0 0 1 8 0h.01"/>',
    ),
  folderMusic: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M9 14V8l5-1v7"/><circle cx="7.5" cy="14" r="1.5"/><circle cx="15.5" cy="13" r="1.5"/>',
    ),
  folderImage: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><circle cx="10" cy="14" r="1.5"/><path d="M15 13l2 2 3-3"/>',
    ),
  folderVideo: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><polygon points="10 12 15 10 10 8 10 12"/>',
    ),
  folderCode: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><polyline points="10 13 8 15 10 17"/><polyline points="14 13 16 15 14 17"/>',
    ),
  folderMail: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><rect x="7" y="12" width="10" height="5" rx="1"/><path d="m7 13 5 3 5-3"/>',
    ),
  folderChat: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M8 13h.01"/><path d="M12 13h.01"/><path d="M16 13h.01"/>',
    ),
  folderStar2: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><polygon points="12 10 13.5 13.5 17 14 14.5 16.5 15 20 12 18 9 20 9.5 16.5 7 14 10.5 13.5"/>',
    ),
  folderFire: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M12 17c-1.5 0-3-1-3-3 0-2 3-4 3-4s3 2 3 4c0 2-1.5 3-3 3z"/>',
    ),
  folderBolt: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><polygon points="10 13 8 17 12 17 10 21 16 13 12 13"/>',
    ),
  folderGlobe: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><circle cx="12" cy="14" r="3"/><line x1="9" y1="14" x2="15" y2="14"/><path d="M12 11v6"/>',
    ),
  folderBookmark: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M10 11v6l2-2 2 2v-6"/>',
    ),
  folderPin: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M12 17v5"/><path d="M9 11l3-4 3 4"/><rect x="9" y="11" width="6" height="3" rx="1"/>',
    ),
  folderLink: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M10 13a1 1 0 0 0 1.41 1.41l2.12-2.12a3 3 0 0 1 4.24 0 3 3 0 0 1 0 4.24l-1.41 1.41"/><path d="M14 11a1 1 0 0 0-1.41-1.41l-2.12 2.12a3 3 0 0 1-4.24 0 3 3 0 0 1 0-4.24l1.41-1.41"/>',
    ),
  folderEye: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="13" r="2.5"/>',
    ),
  folderShield: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M12 17v3"/><path d="M9 11l2 2 4-4"/>',
    ),
  folderClock: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><circle cx="12" cy="14" r="3"/><path d="M12 11v3l1.5 1.5"/>',
    ),
  folderGift: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><rect x="8" y="13" width="8" height="3" rx="0.5"/><path d="M12 13v5"/><path d="M10 16c0-1 .5-2 2-2s2 1 2 2"/>',
    ),
  folderLeaf: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M12 17c-1 0-3-1-3-3 0-1.5 3-3 3-3s3 1.5 3 3c0 2-2 3-3 3z"/><path d="M12 14v5"/>',
    ),
  folderMoon: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M15 14a4 4 0 0 0-5-5 4 4 0 0 0 5 5z"/>',
    ),
  folderTarget: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><circle cx="12" cy="14" r="3"/><circle cx="12" cy="14" r="1.5"/>',
    ),
  folderCompass: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><polygon points="14 14 12 16 10 14 12 12"/>',
    ),
  folderTerminal: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><polyline points="8 14 10 16 8 18"/><line x1="12" y1="18" x2="16" y2="18"/>',
    ),
  folderDatabase: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><ellipse cx="12" cy="14" rx="4" ry="1.5"/><path d="M8 14v2c0 1 2 2 4 2s4-1 4-2v-2"/>',
    ),
  folderKey: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><circle cx="10" cy="15" r="1.5"/><path d="M12.5 13.5l1.5 1.5"/><path d="M15 12l1.5 1.5"/>',
    ),
  folderRocket: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M12 14l-1 4 3-2 3 2-1-4"/><path d="M12 14V9"/>',
    ),
  folderPalette: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><circle cx="10" cy="14" r="1" fill="currentColor" stroke="none"/><circle cx="14" cy="14" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="17" r="1" fill="currentColor" stroke="none"/>',
    ),
  folderWifi: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M8 15a5 5 0 0 1 8 0"/><path d="M10 13a2.5 2.5 0 0 1 4 0"/><circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="none"/>',
    ),
  folderLayers: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><polygon points="8 16 12 14 16 16 12 18"/>',
    ),
  folderZap: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><polygon points="10 13 8 17 12 17 10 21 16 13 12 13"/>',
    ),
  folderFlag: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M7 14l3-1v5l-3 1"/><line x1="10" y1="13" x2="17" y2="13"/><line x1="10" y1="17" x2="15" y2="17"/>',
    ),
  folderAnchor: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><circle cx="12" cy="12" r="1.5"/><line x1="12" y1="13.5" x2="12" y2="17"/><path d="M10 17h4"/>',
    ),
  folderCpu: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><rect x="10" y="13" width="4" height="3" rx="0.5"/><line x1="12" y1="11" x2="12" y2="13"/><line x1="8" y1="14.5" x2="10" y2="14.5"/><line x1="14" y1="14.5" x2="16" y2="14.5"/>',
    ),
  folderDroplet: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M12 14c-2 0-3-1-3-3 0-2 3-4 3-4s3 2 3 4c0 2-1 3-3 3z"/>',
    ),
  folderMap: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><polygon points="10 14 8 16 10 18 16 14 14 12 10 14"/>',
    ),
  folderPrint: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><rect x="8" y="13" width="8" height="3" rx="1"/><line x1="10" y1="13" x2="10" y2="16"/><line x1="14" y1="13" x2="14" y2="16"/>',
    ),
  folderWifi2: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><path d="M5 15a7 7 0 0 1 14 0"/><path d="M8.5 12a3.5 3.5 0 0 1 7 0"/><circle cx="12" cy="16" r="0.5" fill="currentColor" stroke="none"/>',
    ),
  layout: () =>
    svg(
      '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/>',
    ),
  fileText: () =>
    svg(
      '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
    ),
  gear: () =>
    svg(
      '<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/><circle cx="12" cy="12" r="3"/>',
    ),
  info: () =>
    svg(
      '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    ),
  helpCircle: () =>
    svg(
      '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    ),
  pencil: () =>
    svg('<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>'),
  trash2: () =>
    svg(
      '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
    ),
  download: () =>
    svg(
      '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
    ),
  share: () =>
    svg(
      '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" x2="15.42" y1="13.51" y2="17.49"/><line x1="15.41" x2="8.59" y1="6.51" y2="10.49"/>',
    ),
  upload: () =>
    svg(
      '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>',
    ),
  search: () => svg('<circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/>'),
  close: () => svg('<line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/>'),
  settings: () =>
    svg(
      '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    ),
  arrowRight: () =>
    svg('<line x1="5" x2="19" y1="12" y2="12"/><polyline points="12 5 19 12 12 19"/>'),
  plus: () => svg('<line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/>'),
  chevronRight: () => svg('<polyline points="9 18 15 12 9 6"/>'),
  chevronLeft: () => svg('<polyline points="15 18 9 12 15 6"/>'),
  chevronDown: () => svg('<polyline points="6 9 12 15 18 9"/>'),
  dragHandle: () =>
    svg(
      '<circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/><circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>',
    ),
  minimize: () => svg('<line x1="5" y1="12" x2="19" y2="12"/>'),
  maximize: () => svg('<rect x="5" y="5" width="14" height="14" rx="2"/>'),
  printer: () =>
    svg(
      '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    ),
  externalLink: () =>
    svg(
      '<polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/>',
    ),
  clock: () => svg('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>'),
  activity: () => svg('<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>'),
  sun: () =>
    svg(
      '<path d="M12 2v6"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h6"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v6"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h6"/><path d="m4.9 4.9 2.9 2.9"/>',
    ),
  verticalDots: () =>
    svg(
      '<circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>',
    ),
  refresh: () =>
    svg('<polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>'),
  checkCircle: () =>
    svg('<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>'),
  palette: () =>
    svg(
      '<circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/><circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" stroke="none"/><circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" stroke="none"/><circle cx="6.5" cy="12" r="0.5" fill="currentColor" stroke="none"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
    ),
  filePlus2: () =>
    svg(
      '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>',
    ),
  folderPlus: () =>
    svg(
      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" x2="12" y1="11" y2="17"/><line x1="9" x2="15" y1="14" y2="14"/>',
    ),
  notesCheck: () =>
    svg(
      '<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/>',
    ),
  star: () =>
    svg(
      '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    ),
  heart: () =>
    svg(
      '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    ),
  bookmark: () => svg('<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>'),
  tag: () =>
    svg(
      '<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
    ),
  lightbulb: () =>
    svg(
      '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>',
    ),

  // ── Communication ────────────────────────────────────────────
  mail: () =>
    svg(
      '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    ),
  message: () => svg('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'),
  phone: () =>
    svg(
      '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    ),
  atSign: () =>
    svg('<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>'),

  // ── Media ────────────────────────────────────────────────────
  image: () =>
    svg(
      '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
    ),
  music: () =>
    svg('<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>'),
  video: () =>
    svg(
      '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>',
    ),
  mic: () =>
    svg(
      '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>',
    ),
  camera: () =>
    svg(
      '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
    ),

  // ── Objects ──────────────────────────────────────────────────
  shield: () => svg('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'),
  gift: () =>
    svg(
      '<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',
    ),
  flame: () =>
    svg(
      '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    ),
  key: () =>
    svg(
      '<path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/>',
    ),
  zap: () => svg('<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>'),
  target: () =>
    svg(
      '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    ),
  anchor: () =>
    svg(
      '<circle cx="12" cy="5" r="3"/><line x1="12" y1="22" x2="12" y2="8"/><path d="M5 12H2a10 10 0 0 0 20 0h-3"/>',
    ),
  compass: () =>
    svg(
      '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',
    ),
  globe: () =>
    svg(
      '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    ),
  layers: () =>
    svg(
      '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    ),

  // ── Weather / Nature ─────────────────────────────────────────
  moon: () => svg('<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>'),
  cloud: () => svg('<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>'),
  droplet: () => svg('<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>'),
  wind: () =>
    svg(
      '<path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>',
    ),
  leaf: () =>
    svg(
      '<path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.5 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
    ),

  // ── Actions / State ──────────────────────────────────────────
  lock: () =>
    svg(
      '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    ),
  unlock: () =>
    svg(
      '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
    ),
  eye: () =>
    svg('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'),
  eyeOff: () =>
    svg(
      '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>',
    ),
  bell: () =>
    svg(
      '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    ),
  flag: () =>
    svg(
      '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
    ),

  // ── Navigation / Layout ──────────────────────────────────────
  map: () =>
    svg(
      '<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>',
    ),
  grid: () =>
    svg(
      '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
    ),
  list: () =>
    svg(
      '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
    ),
  sidebar: () =>
    svg(
      '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/>',
    ),
  menu: () =>
    svg(
      '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
    ),
  arrowUp: () => svg('<line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>'),
  arrowDown: () =>
    svg('<line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>'),
  chevronUp: () => svg('<polyline points="18 15 12 9 6 15"/>'),
  chevronsUp: () =>
    svg('<polyline points="17 11 12 6 7 11"/><polyline points="17 18 12 13 7 18"/>'),
  chevronsDown: () =>
    svg('<polyline points="7 13 12 18 17 13"/><polyline points="7 6 12 11 17 6"/>'),
  arrowLeft: () =>
    svg('<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>'),

  // ── Math / Science ───────────────────────────────────────────
  hash: () =>
    svg(
      '<line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>',
    ),
  percent: () =>
    svg(
      '<line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
    ),
  divide: () =>
    svg(
      '<circle cx="12" cy="6" r="1"/><line x1="20" y1="12" x2="4" y2="12"/><circle cx="12" cy="18" r="1"/>',
    ),
  terminal: () => svg('<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>'),
  cpu: () =>
    svg(
      '<rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>',
    ),
  database: () =>
    svg(
      '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
    ),
  wifi: () =>
    svg(
      '<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>',
    ),
  bluetooth: () => svg('<polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5"/>'),
  battery: () =>
    svg(
      '<rect x="1" y="6" width="18" height="12" rx="2" ry="2"/><line x1="23" y1="13" x2="23" y2="11"/>',
    ),

  // ── Premium Note Icons ─────────────────────────────────────────
  checkCircle2: () =>
    svg(
      '<path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/>',
    ),
  alertTriangle: () =>
    svg(
      '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    ),
  helpCircle2: () =>
    svg(
      '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    ),
  inbox: () =>
    svg(
      '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    ),
  calendar: () =>
    svg(
      '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    ),
  fileCode2: () =>
    svg(
      '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><polyline points="14 2 14 8 20 8"/><path d="m10 13-2 2 2 2"/><path d="m14 17 2-2-2-2"/>',
    ),
  trendingUp: () =>
    svg('<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>'),
  trendingDown: () =>
    svg('<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>'),
  award: () =>
    svg(
      '<circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>',
    ),
  trophy: () =>
    svg(
      '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
    ),
  gem: () =>
    svg(
      '<polygon points="6 3 18 3 22 9 12 22 2 9"/><line x1="2" y1="9" x2="22" y2="9"/><line x1="12" y1="22" x2="8" y2="9"/><line x1="12" y1="22" x2="16" y2="9"/><line x1="8" y1="9" x2="12" y2="3"/><line x1="16" y1="9" x2="12" y2="3"/>',
    ),
  sparkle: () =>
    svg(
      '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>',
    ),
  crown: () => svg('<path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>'),
  wand: () =>
    svg(
      '<path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.21 1.21 0 0 0 1.72 0L21.64 5.36a1.21 1.21 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/>',
    ),
  puzzle: () =>
    svg(
      '<path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.315 8.685a.98.98 0 0 1 .837-.276c.47.07.802.48.968.925a2.501 2.501 0 1 0 3.214-3.214c-.446-.166-.855-.497-.925-.968a.979.979 0 0 1 .276-.837l1.61-1.61A2.404 2.404 0 0 1 12 2c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z"/>',
    ),
  blocks: () =>
    svg(
      '<rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/><rect x="2" y="14" width="8" height="8" rx="1"/><rect x="14" y="14" width="8" height="8" rx="1"/>',
    ),
  dice: () =>
    svg(
      '<rect x="2" y="2" width="20" height="20" rx="4"/><circle cx="8" cy="8" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="8" r="1" fill="currentColor" stroke="none"/><circle cx="8" cy="16" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="16" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
    ),
  gamepad: () =>
    svg(
      '<line x1="6" y1="12" x2="10" y2="12"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="15" y1="13" x2="15.01" y2="13"/><line x1="18" y1="11" x2="18.01" y2="11"/><path d="M17.32 5H6.68a4 4 0 0 0-3.978 3.59c-.006.052-.01.101-.017.152C2.604 9.416 2 14.456 2 16a3 3 0 0 0 3 3c1 0 1.5-.5 2-1l1.414-1.414A2 2 0 0 1 9.828 16h4.344a2 2 0 0 1 1.414.586L17 18c.5.5 1 1 2 1a3 3 0 0 0 3-3c0-1.545-.604-6.584-.685-7.258-.007-.05-.011-.1-.017-.151A4 4 0 0 0 17.32 5z"/>',
    ),
  headphones: () =>
    svg(
      '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/>',
    ),
  volume2: () =>
    svg(
      '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
    ),
  mic2: () =>
    svg(
      '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/>',
    ),
  camera2: () =>
    svg(
      '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    ),
  film: () =>
    svg(
      '<rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/>',
    ),
  bookOpen: () =>
    svg(
      '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    ),
  penTool: () =>
    svg(
      '<path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.586 7.586"/><circle cx="11" cy="11" r="2"/>',
    ),
  scissors2: () =>
    svg(
      '<circle cx="6" cy="6" r="3"/><path d="M8.12 8.12 12 12"/><path d="M20 4 8.12 15.88"/><circle cx="6" cy="18" r="3"/><path d="M14.8 14.8 20 20"/>',
    ),
  stamp: () =>
    svg(
      '<path d="M5 22h14"/><path d="M19.27 13.73A2.5 2.5 0 0 0 17.5 13h-11A2.5 2.5 0 0 0 4 13a2.5 2.5 0 0 0 1.73 2.27 3 3 0 0 0 2.54 1.73h3.46a3 3 0 0 0 2.54-1.73z"/><path d="M12 5v4"/>',
    ),
  ruler: () =>
    svg(
      '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>',
    ),
  medal: () =>
    svg(
      '<path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15"/><path d="M11 12 5.12 2.2"/><path d="m13 12 5.88-9.8"/><path d="M8 7h8"/><circle cx="12" cy="17" r="5"/><path d="M12 18v-2h-.5"/>',
    ),
} as const;

export type IconName = keyof typeof Icons;

const FOLDER_ICON_MAP: Record<string, IconName> = {
  folder: 'folder',
  'folder-open': 'folderOpen',
  'folder-star': 'folderStar',
  'folder-work': 'folderWork',
  'folder-study': 'folderStudy',
  'folder-personal': 'folderPersonal',
  'folder-private': 'folderPrivate',
  'folder-projects': 'folderProjects',
  'folder-archive': 'folderArchive',
  'folder-heart': 'folderHeart',
  'folder-lock': 'folderLock',
  'folder-cloud': 'folderCloud',
  'folder-music': 'folderMusic',
  'folder-image': 'folderImage',
  'folder-video': 'folderVideo',
  'folder-code': 'folderCode',
  'folder-mail': 'folderMail',
  'folder-chat': 'folderChat',
  'folder-star2': 'folderStar2',
  'folder-fire': 'folderFire',
  'folder-bolt': 'folderBolt',
  'folder-globe': 'folderGlobe',
  'folder-bookmark': 'folderBookmark',
  'folder-pin': 'folderPin',
  'folder-link': 'folderLink',
  'folder-eye': 'folderEye',
  'folder-shield': 'folderShield',
  'folder-clock': 'folderClock',
  'folder-gift': 'folderGift',
  'folder-leaf': 'folderLeaf',
  'folder-moon': 'folderMoon',
  'folder-target': 'folderTarget',
  'folder-compass': 'folderCompass',
  'folder-terminal': 'folderTerminal',
  'folder-database': 'folderDatabase',
  'folder-key': 'folderKey',
  'folder-rocket': 'folderRocket',
  'folder-palette': 'folderPalette',
  'folder-wifi': 'folderWifi',
  'folder-layers': 'folderLayers',
  'folder-zap': 'folderZap',
  'folder-flag': 'folderFlag',
  'folder-anchor': 'folderAnchor',
  'folder-cpu': 'folderCpu',
  'folder-droplet': 'folderDroplet',
  'folder-map': 'folderMap',
  'folder-print': 'folderPrint',
  'folder-wifi2': 'folderWifi2',
};

export function getFolderIcon(iconId: string): string {
  const key = FOLDER_ICON_MAP[iconId] ?? 'folder';
  return Icons[key]();
}

const NOTE_ICON_MAP: Record<string, IconName> = {
  document: 'fileText',
  fileText: 'fileText',
  code: 'code',
  pencil: 'pencil',
  star: 'star',
  heart: 'heart',
  bookmark: 'bookmark',
  tag: 'tag',
  clock: 'clock',
  lightbulb: 'lightbulb',
  mail: 'mail',
  message: 'message',
  image: 'image',
  music: 'music',
  shield: 'shield',
  gift: 'gift',
  flame: 'flame',
  zap: 'zap',
  target: 'target',
  compass: 'compass',
  globe: 'globe',
  lock: 'lock',
  eye: 'eye',
  bell: 'bell',
  flag: 'flag',
  map: 'map',
  terminal: 'terminal',
  database: 'database',
  layers: 'layers',
  leaf: 'leaf',
  moon: 'moon',
  cloud: 'cloud',
  cpu: 'cpu',
  wifi: 'wifi',
  checkCircle: 'checkCircle',
  alertTriangle: 'alertTriangle',
  helpCircle: 'helpCircle',
  inbox: 'inbox',
  calendar: 'calendar',
  fileCode2: 'fileCode2',
  trendingUp: 'trendingUp',
  trendingDown: 'trendingDown',
  award: 'award',
  trophy: 'trophy',
  gem: 'gem',
  sparkle: 'sparkle',
  crown: 'crown',
  wand: 'wand',
  puzzle: 'puzzle',
  blocks: 'blocks',
  dice: 'dice',
  gamepad: 'gamepad',
  headphones: 'headphones',
  volume2: 'volume2',
  mic: 'mic',
  camera: 'camera',
  film: 'film',
  bookOpen: 'bookOpen',
  penTool: 'penTool',
  scissors: 'scissors',
  stamp: 'stamp',
  ruler: 'ruler',
  medal: 'medal',
};

export function getNoteIcon(iconId: string): string {
  const key = NOTE_ICON_MAP[iconId] ?? 'fileText';
  return Icons[key]();
}
