import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/PromoLanguageContext';
import PromoApp from './PromoApp';
import './sitioPromocional/styles/promo-tokens.css';
import './sitioPromocional/styles/promocional.css';
import './sitioPromocional/styles/promo-responsive.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <ThemeProvider>
        <BrowserRouter>
          <PromoApp />
        </BrowserRouter>
      </ThemeProvider>
    </LanguageProvider>
  </React.StrictMode>
);
