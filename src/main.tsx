import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from '@rakuensoftware/smoothgui';
import '@rakuensoftware/smoothgui/styles';
import './site.css';
import App from './App';

const container = document.getElementById('root');
if (container == null) throw new Error('#root element is missing from index.html');

createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);
