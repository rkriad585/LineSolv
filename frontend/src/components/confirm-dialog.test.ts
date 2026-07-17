import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfirmDialog } from '../components/ConfirmDialog';

describe('ConfirmDialog', () => {
  let dialog: ConfirmDialog;

  beforeEach(() => {
    document.body.innerHTML = '';
    dialog = new ConfirmDialog();
  });

  it('initializes hidden', () => {
    expect(dialog.el.classList.contains('lsv-modal-open')).toBe(false);
    expect(dialog.el.style.display).toBe('none');
  });

  it('shows dialog when show() is called', () => {
    dialog.show('Delete Note', 'Are you sure?', 'Delete', () => {});
    expect(dialog.el.classList.contains('lsv-modal-open')).toBe(true);
    expect(dialog.el.style.display).toBe('flex');
  });

  it('displays title and message text', () => {
    dialog.show('Delete Note', 'Are you sure?', 'Delete', () => {});
    expect(dialog.el.textContent).toContain('Delete Note');
    expect(dialog.el.textContent).toContain('Are you sure?');
    expect(dialog.el.textContent).toContain('Delete');
  });

  it('shows two buttons', () => {
    dialog.show('Title', 'Message', 'OK', () => {});
    const buttons = dialog.el.querySelectorAll('button');
    expect(buttons.length).toBe(2);
    const texts = Array.from(buttons).map((b) => b.textContent);
    expect(texts).toContain('OK');
    expect(texts).toContain('Cancel');
  });

  it('shows remember checkbox', () => {
    dialog.show('Title', 'Message', 'OK', () => {});
    const checkbox = dialog.el.querySelector('input[type="checkbox"]') as HTMLInputElement;
    expect(checkbox).not.toBeNull();
    expect(checkbox.type).toBe('checkbox');
  });

  it('hide sets display to none and clears innerHTML', () => {
    dialog.show('Title', 'Message', 'OK', () => {});
    dialog.hide();
    expect(dialog.el.classList.contains('lsv-modal-open')).toBe(false);
    expect(dialog.el.innerHTML).toBe('');
  });

  it('destroy removes element from DOM', () => {
    const parent = document.createElement('div');
    parent.appendChild(dialog.el);
    dialog.destroy();
    expect(parent.children.length).toBe(0);
  });

  it('backdrop mousedown calls emit', () => {
    const cb = vi.fn();
    dialog.show('Title', 'Message', 'Delete', cb);
    dialog.el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 0, clientY: 0 }));
    expect(cb).toHaveBeenCalledWith({ confirmed: false, remember: false });
  });

  it('can be shown multiple times', () => {
    dialog.show('First', 'msg', 'OK', () => {});
    expect(dialog.el.classList.contains('lsv-modal-open')).toBe(true);
    dialog.hide();
    expect(dialog.el.classList.contains('lsv-modal-open')).toBe(false);
    dialog.show('Second', 'msg', 'OK', () => {});
    expect(dialog.el.classList.contains('lsv-modal-open')).toBe(true);
  });
});
