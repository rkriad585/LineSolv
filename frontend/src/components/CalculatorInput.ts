export class CalculatorInput {
  readonly el: HTMLDivElement;
  readonly textarea: HTMLTextAreaElement;
  readonly gutter: HTMLDivElement;
  private gutterCount = 0;

  constructor() {
    this.el = document.createElement('div');
    this.el.id = 'notepad';
    this.el.className = 'flex-1 flex min-h-0';

    this.gutter = document.createElement('div');
    this.gutter.id = 'gutter';
    this.gutter.className = 'w-[36px] shrink-0 pt-[20px] pr-2 text-sm leading-[24px] font-mono text-right select-none overflow-y-auto';
    this.gutter.style.cssText = 'color:var(--text-subtle);background:var(--surface);';

    this.textarea = document.createElement('textarea');
    this.textarea.id = 'input-area';
    this.textarea.className = 'flex-1 resize-none bg-transparent text-sm outline-none border-none pt-[20px] pb-4 pl-2 leading-[24px] font-mono';
    this.textarea.style.cssText = 'color:var(--text);background:transparent;';
    this.textarea.spellcheck = false;
    this.textarea.autocomplete = 'off';
    (this.textarea as any).autocorrect = 'off';
    this.textarea.autocapitalize = 'off';

    this.el.appendChild(this.gutter);
    this.el.appendChild(this.textarea);
  }

  updateGutter(lineCount: number): void {
    const count = Math.max(lineCount, 1);
    const oldCount = this.gutterCount;
    if (count === oldCount) return;

    if (count > oldCount) {
      for (let i = oldCount + 1; i <= count; i++) {
        const d = document.createElement('div');
        d.textContent = String(i);
        this.gutter.appendChild(d);
      }
    } else {
      while (this.gutter.childElementCount > count) {
        this.gutter.lastChild?.remove();
      }
    }
    this.gutterCount = count;
  }

  get text(): string {
    return this.textarea.value;
  }

  set text(val: string) {
    this.textarea.value = val;
  }
}
