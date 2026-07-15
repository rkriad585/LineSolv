import { Chart, LineController, LineElement, PointElement, LinearScale } from 'chart.js';
import type {calculator} from '../../wailsjs/go/models';

type Point = calculator.Point;

Chart.register(LineController, LineElement, PointElement, LinearScale);

export class GraphPanel {
  readonly el: HTMLElement;
  readonly titleEl: HTMLSpanElement;
  private canvas: HTMLCanvasElement;
  private chart: Chart | null = null;

  constructor() {
    this.el = document.createElement('div');
    this.el.id = 'graph-panel';
    this.el.style.cssText =
      'display:none;height:220px;min-height:220px;border-top:1px solid var(--border);' +
      'background:var(--surface);position:relative;flex-shrink:0;';

    const header = document.createElement('div');
    header.style.cssText =
      'display:flex;align-items:center;justify-content:space-between;' +
      'padding:4px 12px;border-bottom:1px solid var(--border);';

    this.titleEl = document.createElement('span');
    this.titleEl.style.cssText = 'font-size:11px;color:var(--text-muted);font-weight:600;text-transform:uppercase;letter-spacing:0.05em;';
    this.titleEl.textContent = 'Graph';
    header.appendChild(this.titleEl);

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    closeBtn.style.cssText = 'border:none;background:transparent;color:var(--text-muted);cursor:pointer;padding:2px;display:flex;border-radius:4px;';
    closeBtn.setAttribute('aria-label', 'Close graph');
    closeBtn.addEventListener('mouseenter', () => { closeBtn.style.background = 'var(--surface-secondary)'; });
    closeBtn.addEventListener('mouseleave', () => { closeBtn.style.background = 'transparent'; });
    closeBtn.addEventListener('click', () => this.hide());
    header.appendChild(closeBtn);

    this.el.appendChild(header);

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'flex:1;position:relative;padding:4px;';

    this.canvas = document.createElement('canvas');
    wrapper.appendChild(this.canvas);
    this.el.appendChild(wrapper);
  }

  private cssColor(name: string): string {
    return getComputedStyle(this.el).getPropertyValue(name).trim() || '#888';
  }

  render(points: Point[], expression: string): void {
    this.titleEl.textContent = 'Graph: ' + expression;

    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    if (!points || points.length === 0) return;

    this.el.style.display = 'flex';
    this.el.style.flexDirection = 'column';

    const accent = this.cssColor('--accent');
    const border = this.cssColor('--border');
    const muted = this.cssColor('--text-muted');

    this.chart = new Chart(this.canvas, {
      type: 'line',
      data: {
        datasets: [{
          label: expression,
          data: points.map(p => ({x: p.x, y: p.y})),
          borderColor: accent,
          backgroundColor: 'transparent',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.1,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {legend: {display: false}},
        scales: {
          x: {
            type: 'linear',
            grid: {color: border},
            ticks: {color: muted, font: {size: 10}},
          },
          y: {
            type: 'linear',
            grid: {color: border},
            ticks: {color: muted, font: {size: 10}},
          },
        },
      },
    });
  }

  show(): void {
    this.el.style.display = 'flex';
  }

  hide(): void {
    this.el.style.display = 'none';
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  isVisible(): boolean {
    return this.el.style.display !== 'none';
  }

  destroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }
}
