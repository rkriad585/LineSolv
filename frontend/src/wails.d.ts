interface WailsRuntime {
  Quit(): void;
  WindowMinimise(): void;
  WindowToggleMaximise(): void;
  WindowFullscreen(): void;
  WindowUnfullscreen(): void;
  BrowserOpenURL(url: string): void;
  ClipboardSetText(text: string): Promise<boolean>;
  ClipboardGetText(): Promise<string>;
}

interface Window {
  runtime?: WailsRuntime;
}

interface ThemeCardElement extends HTMLDivElement {
  themeId?: string;
}

interface StyleCardElement extends HTMLDivElement {
  styleId?: string;
}
