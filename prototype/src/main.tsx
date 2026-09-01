import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Rubik is the production face, and it carries Latin and Arabic in one family — which is why
// the two locales hold the same texture instead of pairing two unrelated typefaces.
import '@fontsource/rubik/400.css';
import '@fontsource/rubik/500.css';
import '@fontsource/rubik/600.css';
import '@fontsource/rubik/700.css';
import '@fontsource/rubik/arabic-400.css';
import '@fontsource/rubik/arabic-500.css';
import '@fontsource/rubik/arabic-700.css';
import './styles/world.css';
import './styles/components.css';
import './styles/screens.css';
import './styles/order.css';
import './styles/account.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
