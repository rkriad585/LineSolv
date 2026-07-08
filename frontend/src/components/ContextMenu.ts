import type {ContextMenuItem} from '../types';
import {escapeHtml} from '../utils/html';

export class ContextMenu {
  readonly el: HTMLDivElement;
  private onClose: (() => void) | null = null;

  constructor() {
    this.el = document.createElement('div');
    this.el.className = 'context-menu';
    this.el.setAttribute('role', 'menu');
    this.el.style.cssText =
      'position:fixed;z-index:9999;min-width:160px;background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:4px 0;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:none;';
    document.body.appendChild(this.el);

    const close = (e: Event) => {
      if (this.el.contains(e.target as Node)) return;
      this.hide();
    };
    document.addEventListener('click', close);
    document.addEventListener('contextmenu', close);
    this.onClose = () => {
      document.removeEventListener('click', close);
      document.removeEventListener('contextmenu', close);
    };
  }

  show(items: ContextMenuItem[], x: number, y: number): void {
    this.el.innerHTML = '';
    this.el.style.display = 'block';
    this.el.style.left = x + 'px';
    this.el.style.top = y + 'px';

    for (const item of items) {
      if (item.children) {
        this.renderSubmenu(item);
      } else {
        this.renderItem(item);
      }
    }

    const rect = this.el.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      this.el.style.left = (x - rect.width) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
      this.el.style.top = (y - rect.height) + 'px';
    }
  }

  hide(): void {
    this.el.style.display = 'none';
    this.el.innerHTML = '';
  }

  private renderItem(item: ContextMenuItem): void {
    const div = document.createElement('div');
    div.className = 'context-menu-item';
    div.style.cssText =
      'padding:6px 16px;font-size:13px;cursor:pointer;display:flex;align-items:center;gap:8px;color:var(--text);';
    if (item.disabled) {
      div.style.opacity = '0.4';
      div.style.cursor = 'default';
    }
    div.innerHTML = this.itemContent(item.label, item.icon);
    div.addEventListener('mouseenter', () => {
      if (!item.disabled) div.style.background = 'var(--surface-hover)';
    });
    div.addEventListener('mouseleave', () => {
      div.style.background = 'transparent';
    });
    div.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!item.disabled && item.action) {
        item.action();
        this.hide();
      }
    });
    this.el.appendChild(div);
  }

  private renderSubmenu(item: ContextMenuItem): void {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:relative;';

    const trigger = document.createElement('div');
    trigger.className = 'context-menu-item';
    trigger.style.cssText =
      'padding:6px 16px;font-size:13px;cursor:pointer;display:flex;align-items:center;gap:8px;color:var(--text);';
    trigger.innerHTML = this.itemContent(item.label, item.icon) +
      '<span style="margin-left:auto;font-size:10px;color:var(--text-muted)">▶</span>';

    const sub = document.createElement('div');
    sub.style.cssText =
      'position:absolute;left:100%;top:0;min-width:120px;background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:4px 0;box-shadow:0 4px 12px rgba(0,0,0,0.3);display:none;z-index:10000;';

    for (const child of item.children!) {
      const childDiv = document.createElement('div');
      childDiv.className = 'context-menu-item';
      childDiv.style.cssText =
        'padding:6px 16px;font-size:13px;cursor:pointer;display:flex;align-items:center;gap:8px;color:var(--text);';
      childDiv.innerHTML = child.icon
        ? `<span class="ctx-icon">${child.icon}</span>${escapeHtml(child.label)}`
        : escapeHtml(child.label);
      childDiv.addEventListener('mouseenter', () => {
        childDiv.style.background = 'var(--surface-hover)';
      });
      childDiv.addEventListener('mouseleave', () => {
        childDiv.style.background = 'transparent';
      });
      childDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        if (child.action) {
          child.action();
          this.hide();
        }
      });
      sub.appendChild(childDiv);
    }

    wrapper.appendChild(trigger);
    wrapper.appendChild(sub);

    let showTimeout: number | null = null;
    let hideTimeout: number | null = null;

    const showSub = () => {
      if (hideTimeout) clearTimeout(hideTimeout);
      showTimeout = window.setTimeout(() => {
        sub.style.display = 'block';
        const subRect = sub.getBoundingClientRect();
        if (subRect.right > window.innerWidth) {
          sub.style.left = 'auto';
          sub.style.right = '100%';
        }
        if (subRect.bottom > window.innerHeight) {
          sub.style.top = (window.innerHeight - subRect.height - 10) + 'px';
        }
      }, 100);
    };

    const hideSub = () => {
      if (showTimeout) clearTimeout(showTimeout);
      hideTimeout = window.setTimeout(() => {
        sub.style.display = 'none';
      }, 200);
    };

    trigger.addEventListener('mouseenter', showSub);
    trigger.addEventListener('mouseleave', hideSub);
    sub.addEventListener('mouseenter', () => {
      if (hideTimeout) clearTimeout(hideTimeout);
    });
    sub.addEventListener('mouseleave', hideSub);

    this.el.appendChild(wrapper);
  }

  private itemContent(label: string, icon?: string): string {
    const labelEscaped = escapeHtml(label);
    if (!icon) return labelEscaped;
    return `<span class="ctx-icon">${icon}</span>${labelEscaped}`;
  }

  destroy(): void {
    this.hide();
    if (this.onClose) this.onClose();
    this.el.remove();
  }
}
