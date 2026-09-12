import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { loadAnalytics } from './analytics';
import './styles.css';

// Vite's base ('/verbs-trainer/' in the build) is what the router must use as
// its basename, so /login resolves to /verbs-trainer/login on GitHub Pages.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

loadAnalytics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
