import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { DataProvider } from './context/DataContext.tsx';
import './index.css';

// Prevent expected/benign WebSocket (HMR disabled in container), BloomFilter, and Quota errors from bubbling up
window.addEventListener('unhandledrejection', (event) => {
  const reasonStr = String(event.reason?.message || event.reason || '');
  if (
    reasonStr.includes('WebSocket') ||
    reasonStr.includes('BloomFilter') ||
    reasonStr.includes('Quota limit exceeded') ||
    event.reason?.name === 'BloomFilterError' ||
    event.reason?.name === 'FirebaseError'
  ) {
    event.preventDefault();
  }
});

// Register Service Worker for PWA installability
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('PWA Service Worker registration warning:', err);
    });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DataProvider>
      <App />
    </DataProvider>
  </StrictMode>,
);
