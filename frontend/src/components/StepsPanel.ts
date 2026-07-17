import type { calculator } from '../../wailsjs/go/models';
import { escapeHtml } from '../utils/html';
import { Icons } from './Icons';

type Step = calculator.Step;

const stepStyles: Record<string, string> = {
  naturalize: 'color:var(--text-subtle);font-style:italic;',
  constant: 'color:var(--text-muted);',
  variable: 'color:var(--text-muted);',
  function: 'color:var(--accent);',
  negate: '',
  add: '',
  subtract: '',
  multiply: '',
  divide: '',
  power: '',
  modulo: '',
  factorial: '',
  percent: 'color:var(--text-muted);',
  convert: 'color:var(--text-muted);',
  'date-math': 'color:var(--text-muted);',
  age: 'color:var(--text-muted);',
};

const operatorLabels: Record<string, string> = {
  naturalize: 'Preprocessed',
  constant: 'Constant',
  variable: 'Variable',
  function: 'Function',
  negate: 'Negate',
  add: 'Add',
  subtract: 'Subtract',
  multiply: 'Multiply',
  divide: 'Divide',
  power: 'Power',
  modulo: 'Modulo',
  factorial: 'Factorial',
  percent: 'Percentage',
  convert: 'Conversion',
  'date-math': 'Date',
  age: 'Age',
};

export class StepsPanel {
  readonly el: HTMLElement;
  readonly contentEl: HTMLDivElement;

  constructor() {
    this.el = document.createElement('aside');
    this.el.id = 'steps-panel';
    this.el.className =
      'shrink-0 flex flex-col overflow-hidden transition-all duration-150 ease-out';
    this.el.style.cssText = 'width:0px;border-left:0;background:var(--surface);';

    const header = document.createElement('div');
    header.className =
      'px-4 py-2.5 text-[10px] font-semibold tracking-wider uppercase border-b shrink-0 flex items-center justify-between';
    header.style.cssText = 'color:var(--text-muted);border-color:var(--border);';
    const headerTitle = document.createElement('span');
    headerTitle.textContent = 'Steps';
    const closeHeaderBtn = document.createElement('button');
    closeHeaderBtn.innerHTML = Icons.close();
    closeHeaderBtn.title = 'Close steps';
    closeHeaderBtn.style.cssText =
      'display:flex;align-items:center;justify-content:center;width:18px;height:18px;' +
      'border:none;border-radius:3px;background:transparent;color:var(--text-muted);cursor:pointer;outline:none;';
    closeHeaderBtn.addEventListener('click', () => this.close());
    header.append(headerTitle, closeHeaderBtn);
    this.el.appendChild(header);

    this.contentEl = document.createElement('div');
    this.contentEl.id = 'steps-content';
    this.contentEl.className = 'flex-1 overflow-y-auto p-2';
    this.contentEl.tabIndex = -1;
    this.el.appendChild(this.contentEl);
  }

  render(steps: Step[], _result: string): void {
    if (!steps || steps.length === 0) {
      this.contentEl.innerHTML =
        '<div class="text-xs p-2" style="color:var(--text-muted)">Evaluate an expression to see steps</div>';
      return;
    }

    const html = steps
      .map((s) => {
        const extra = stepStyles[s.operation] || '';
        const label = operatorLabels[s.operation] || s.operation;
        const isParse = !['naturalize', 'convert', 'percent', 'date-math', 'age'].includes(
          s.operation,
        );
        const exprStyle =
          'font-size:12px;font-family:monospace;white-space:pre;overflow:hidden;text-overflow:ellipsis;' +
          extra;
        return `
        <div class="step-item" style="padding:5px 8px;border-radius:var(--ui-radius-sm);margin-bottom:3px;${isParse ? 'border-left:2px solid var(--accent);' : ''}">
          <div style="font-size:10px;color:var(--text-subtle);margin-bottom:2px;text-transform:uppercase;letter-spacing:0.05em;">${escapeHtml(label)}</div>
          <div style="${exprStyle}">${escapeHtml(s.expression)}</div>
          <div style="font-size:11px;color:var(--accent);margin-top:1px;font-family:monospace;">= ${escapeHtml(s.result)}</div>
        </div>`;
      })
      .join('');

    this.contentEl.innerHTML = html;
  }

  open(): void {
    this.el.style.width = '220px';
    this.el.style.borderLeftWidth = '1px';
    this.contentEl.focus();
    setTimeout(() => {
      this.contentEl.focus();
    }, 0);
  }

  close(): void {
    this.el.style.width = '0px';
    this.el.style.borderLeftWidth = '0';
  }

  isOpen(): boolean {
    return this.el.style.width !== '0px';
  }
}
