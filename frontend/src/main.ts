import './style.css';
import { renderApp } from './App';
import { toast } from './utils/toast';

// Initialize Wails runtime
import { EventsOn } from '../wailsjs/runtime/runtime';

document.addEventListener('DOMContentLoaded', () => {
  const root = document.querySelector<HTMLDivElement>('#app');
  if (!root) return;
  renderApp(root);
});

// Listen for any Go-side events
EventsOn('error', (msg: string) => {
  toast.show(msg, 'error');
});
