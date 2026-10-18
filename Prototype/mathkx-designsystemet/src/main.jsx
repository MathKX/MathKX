import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { StoreProvider } from './store.jsx';
import { App } from './App.jsx';

// Follow the host's theme: data-theme="dark|light" when set explicitly, otherwise the OS setting.
const root = document.documentElement;
const syncScheme = () => {
  const th = root.getAttribute('data-theme');
  root.setAttribute('data-color-scheme', th === 'dark' || th === 'light' ? th : 'auto');
};
syncScheme();
new MutationObserver(syncScheme).observe(root, { attributes: true, attributeFilter: ['data-theme'] });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
);
