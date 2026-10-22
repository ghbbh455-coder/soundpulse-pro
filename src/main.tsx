import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Auto-register service worker for instant 100% offline playback in production only
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  import('virtual:pwa-register')
    .then(({ registerSW }) => {
      registerSW({ immediate: true });
    })
    .catch(() => {});
}

createRoot(document.getElementById('root')!).render(<App />);
