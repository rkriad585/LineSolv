interface WailsRuntime {
  Quit(): void;
  WindowMinimise(): void;
  WindowToggleMaximise(): void;
  WindowFullscreen(): void;
  WindowUnfullscreen(): void;
  BrowserOpenURL(url: string): void;
}

interface Window {
  runtime?: WailsRuntime;
}

interface ThemeCardElement extends HTMLDivElement {
  themeId?: string;
}
