import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { getStoredTheme } from './ref/themes';
import './index.css';
import App from './App.jsx';
import { ContextProvider } from './context/context.jsx';

document.documentElement.setAttribute('data-theme', getStoredTheme());

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ContextProvider>
      <App />
    </ContextProvider>
  </StrictMode>
);
