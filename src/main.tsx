import { createRoot } from 'react-dom/client';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/plus-jakarta-sans/800.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
import '@fontsource/jetbrains-mono/700.css';
import App from './App.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './index.css';

if (import.meta.env.DEV) {
  window.addEventListener('error', (e) => {
    if (e?.message?.includes('WebSocket')) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  });
  window.addEventListener('unhandledrejection', (e) => {
    if (e?.reason && String(e.reason).includes('WebSocket')) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
