export class CalculatorInput {
  readonly el: HTMLDivElement;
  readonly textarea: HTMLTextAreaElement;
  readonly gutter: HTMLDivElement;
  private totalLines = 1;
  private lineHeight = 24;
  private visibleStart = 0;
  private visibleEnd = 0;
  private rafId = 0;
  private measureEl: HTMLDivElement | null = null;
  private lineInfoCache: { logicalStarts: number[]; totalVisual: number } | null = null;
  private lastText = '';

  constructor() {
    this.el = document.createElement('div');
    this.el.id = 'notepad';
    this.el.className = 'flex-1 flex min-h-0';

    this.gutter = document.createElement('div');
    this.gutter.id = 'gutter';
    this.gutter.className = 'w-[44px] shrink-0 pt-[20px] pr-3 text-sm leading-[24px] font-mono text-right select-none overflow-y-auto overflow-x-hidden';
    this.gutter.style.cssText = 'color:var(--text-subtle);background:var(--surface);';

    this.textarea = document.createElement('textarea');
    this.textarea.id = 'input-area';
    this.textarea.className = 'flex-1 resize-none bg-transparent text-sm outline-none border-none pt-[20px] pb-4 pl-2 leading-[24px] font-mono';
    this.textarea.style.cssText = 'color:var(--text);background:transparent;';
    this.textarea.spellcheck = false;
    this.textarea.autocomplete = 'off';
    this.textarea.setAttribute('autocorrect', 'off');
    this.textarea.autocapitalize = 'off';
    this.textarea.maxLength = 10000;

    this.el.appendChild(this.gutter);
    this.el.appendChild(this.textarea);

    this.textarea.addEventListener('scroll', () => this.scheduleViewportUpdate(), { passive: true });
    this.textarea.addEventListener('input', () => { this.lineInfoCache = null; }, { passive: true });
  }

  /** Get the visual start pixel of each logical line (accounts for word wrap). */
  getLineVisualInfo(): { logicalStarts: number[]; totalVisual: number } {
    if (this.lineInfoCache) return this.lineInfoCache;

    const ta = this.textarea;
    const lines = ta.value.split('\n');
    const lh = this.lineHeight;

    // Create or reuse hidden measure element
    if (!this.measureEl) {
      this.measureEl = document.createElement('div');
      const cs = getComputedStyle(ta);
      const contentWidth = ta.clientWidth - parseInt(cs.paddingLeft) - parseInt(cs.paddingRight);
      this.measureEl.style.cssText = `
        position:absolute;visibility:hidden;overflow:hidden;padding:0;margin:0;border:none;
        font-size:${cs.fontSize};
        font-family:${cs.fontFamily};
        font-weight:${cs.fontWeight};
        letter-spacing:${cs.letterSpacing};
        line-height:${lh}px;
        width:${contentWidth}px;
        white-space:${cs.whiteSpace};
        overflow-wrap:${cs.overflowWrap};
        word-wrap:${cs.overflowWrap};
        word-break:${cs.wordBreak};
        left:-9999px;top:-9999px;
      `;
      document.body.appendChild(this.measureEl);
    } else {
      const cs = getComputedStyle(ta);
      const contentWidth = ta.clientWidth - parseInt(cs.paddingLeft) - parseInt(cs.paddingRight);
      this.measureEl.style.cssText = `
        position:absolute;visibility:hidden;overflow:hidden;padding:0;margin:0;border:none;
        font-size:${cs.fontSize};
        font-family:${cs.fontFamily};
        font-weight:${cs.fontWeight};
        letter-spacing:${cs.letterSpacing};
        line-height:${lh}px;
        width:${contentWidth}px;
        white-space:${cs.whiteSpace};
        overflow-wrap:${cs.overflowWrap};
        word-wrap:${cs.overflowWrap};
        word-break:${cs.wordBreak};
        left:-9999px;top:-9999px;
      `;
    }

    const logicalStarts: number[] = [];
    let totalVisual = 0;

    for (let i = 0; i < lines.length; i++) {
      this.measureEl.textContent = lines[i] || '\u00A0';
      const h = this.measureEl.scrollHeight;
      const visualLines = Math.max(1, Math.round(h / lh));
      logicalStarts.push(totalVisual);
      totalVisual += visualLines;
    }

    this.lineInfoCache = { logicalStarts, totalVisual };
    return this.lineInfoCache;
  }

  /** Invalidate line info cache when textarea content changes. */
  private invalidateLineInfo(): void {
    this.lineInfoCache = null;
  }

  updateGutter(): void {
    const text = this.textarea.value;
    if (text !== this.lastText) {
      this.lastText = text;
      this.invalidateLineInfo();
    }

    const info = this.getLineVisualInfo();
    const count = Math.max(info.totalVisual, 1);
    const changed = count !== this.totalLines;
    this.totalLines = count;
    if (changed || (this.visibleStart === 0 && this.visibleEnd === 0 && count > 0)) {
      this.scheduleViewportUpdate();
    }
  }

  private scheduleViewportUpdate(): void {
    if (this.rafId) return;
    this.rafId = requestAnimationFrame(() => {
      this.rafId = 0;
      this.renderVisibleLines();
    });
  }

  private renderVisibleLines(): void {
    const ta = this.textarea;
    const st = ta.scrollTop;
    const vh = ta.clientHeight;
    if (vh === 0) return;
    const lh = this.lineHeight;

    const info = this.getLineVisualInfo();
    const total = info.totalVisual;
    const overscan = 5;

    const startLine = Math.max(0, Math.floor(st / lh) - overscan);
    const endLine = Math.min(total, Math.ceil((st + vh) / lh) + overscan);

    if (startLine === this.visibleStart && endLine === this.visibleEnd) return;
    this.visibleStart = startLine;
    this.visibleEnd = endLine;

    // Build new content in a DocumentFragment to avoid empty-gutter frame
    const frag = document.createDocumentFragment();

    if (startLine > 0) {
      const spacer = document.createElement('div');
      spacer.style.height = (startLine * lh) + 'px';
      spacer.style.pointerEvents = 'none';
      frag.appendChild(spacer);
    }

    // Build a lookup: which visual lines are logical starts?
    const isLogicalStart = new Set(info.logicalStarts);

    for (let vLine = startLine; vLine < endLine; vLine++) {
      const d = document.createElement('div');
      if (isLogicalStart.has(vLine)) {
        const logicalIdx = info.logicalStarts.indexOf(vLine);
        d.textContent = String(logicalIdx + 1);
      } else {
        d.textContent = '\u00B7'; // middle dot for continuation lines
      }
      d.style.height = lh + 'px';
      d.style.lineHeight = lh + 'px';
      d.style.overflow = 'hidden';
      d.style.whiteSpace = 'nowrap';
      frag.appendChild(d);
    }

    if (endLine < total) {
      const spacer = document.createElement('div');
      spacer.style.height = ((total - endLine) * lh) + 'px';
      spacer.style.pointerEvents = 'none';
      frag.appendChild(spacer);
    }

    // Single DOM replace — avoids empty-gutter flash
    this.gutter.replaceChildren(frag);
    this.gutter.scrollTop = st;
  }

  get text(): string {
    return this.textarea.value;
  }

  set text(val: string) {
    this.textarea.value = val;
    this.lastText = val;
    this.invalidateLineInfo();
  }

  /** Get the word being typed at cursor position and its start/end indices. */
  getCursorWord(): { word: string; start: number; end: number } {
    const ta = this.textarea;
    const pos = ta.selectionStart;
    const text = ta.value;
    if (pos === 0) return { word: '', start: 0, end: 0 };

    let start = pos;
    while (start > 0 && isWordChar(text[start - 1])) {
      start--;
    }
    return { word: text.slice(start, pos), start, end: pos };
  }

  /** Get pixel position of the cursor for popup placement. */
  getCursorPixelPos(): { x: number; y: number } {
    const ta = this.textarea;
    const pos = ta.selectionStart;
    const text = ta.value;
    const lines = text.substring(0, pos).split('\n');
    const lineIdx = lines.length - 1;
    const colIdx = lines[lineIdx].length;

    const cs = getComputedStyle(ta);
    const paddingTop = parseInt(cs.paddingTop) || 0;
    const paddingLeft = parseInt(cs.paddingLeft) || 0;
    const lineHeight = this.lineHeight;

    const charWidth = this.measureCharWidth();
    const x = ta.offsetLeft + paddingLeft + colIdx * charWidth + 2;
    const y = ta.offsetTop + paddingTop + (lineIdx * lineHeight) - ta.scrollTop + lineHeight + 2;

    return { x, y };
  }

  /** Replace the word at [start, end] with replacement and reposition cursor. */
  replaceWord(start: number, end: number, replacement: string): void {
    const ta = this.textarea;
    ta.focus();
    ta.setRangeText(replacement, start, end, 'end');
    ta.dispatchEvent(new Event('input', {bubbles: true}));
  }

  private measureCharWidth(): number {
    if (!this.measureEl) {
      this.measureEl = document.createElement('div');
      document.body.appendChild(this.measureEl);
    }
    const cs = getComputedStyle(this.textarea);
    this.measureEl.style.cssText = `
      position:absolute;visibility:hidden;font-size:${cs.fontSize};
      font-family:${cs.fontFamily};font-weight:${cs.fontWeight};
      letter-spacing:${cs.letterSpacing};white-space:pre;
      left:-9999px;top:-9999px;
    `;
    this.measureEl.textContent = 'M';
    return this.measureEl.getBoundingClientRect().width;
  }
}

function isWordChar(ch: string): boolean {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9') || ch === '_';
}
