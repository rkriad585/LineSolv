import './style.css';
import { renderApp } from './App';
import { toast } from './utils/toast';

// Initialize Wails runtime
import { EventsOn } from '../wailsjs/runtime/runtime';

// Global error handler — surface unhandled rejections as toasts
window.addEventListener('unhandledrejection', (e) => {
  const msg = e.reason instanceof Error ? e.reason.message : 'An unexpected error occurred';
  toast.show(msg, 'error');
});

window.addEventListener('error', (e) => {
  const msg = e.error instanceof Error ? e.error.message : 'An unexpected error occurred';
  toast.show(msg, 'error');
});

document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector<HTMLDivElement>('#app');
  if (!root) return;
  renderApp(root);
});

// Listen for any Go-side events
EventsOn('error', (msg: string) => {
  toast.show(msg, 'error');
});
