import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import './utils/i18n';

// Configurar idioma para date-fns
import { setDefaultOptions } from 'date-fns';
import { es } from 'date-fns/locale';

setDefaultOptions({ locale: es });

// Suprimir warnings específicos de Recharts en desarrollo
if (import.meta.env.DEV) {
  const originalError = console.error;
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Support for defaultProps will be removed')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
}

// NOTA: React.StrictMode deshabilitado temporalmente para debugging
// StrictMode causa doble montaje de componentes que puede afectar
// hooks con efectos secundarios (API calls, setInterval, etc.)
// Una vez estabilizado el app, re-habilitar StrictMode
ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
);