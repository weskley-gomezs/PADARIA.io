import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Prevent expected/benign WebSocket (HMR disabled in container) and BloomFilter errors from bubbling up
window.addEventListener('unhandledrejection', (event) => {
  const reasonStr = String(event.reason?.message || event.reason || '');
  if (
    reasonStr.includes('WebSocket') ||
    reasonStr.includes('BloomFilter') ||
    event.reason?.name === 'BloomFilterError'
  ) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
