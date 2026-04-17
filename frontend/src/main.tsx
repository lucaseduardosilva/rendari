import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// Aplica tema persistido antes de renderizar
const t = (() => {
  try { return JSON.parse(localStorage.getItem('rendari.theme') || '{}').state?.theme; } catch { return null; }
})();
document.documentElement.setAttribute('data-theme', t || 'dark');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
