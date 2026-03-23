import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ArenaProvider } from './state/ArenaContext';
import './styles.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element not found.');
}

createRoot(container).render(
  <StrictMode>
    <ArenaProvider>
      <App />
    </ArenaProvider>
  </StrictMode>
);
