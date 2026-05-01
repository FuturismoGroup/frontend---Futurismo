import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Importar directamente las traducciones
import esTranslations from '../locales/es.json';
import enTranslations from '../locales/en.json';

const LANGUAGE_STORAGE_KEY = 'preferredLanguage';

const detectLanguage = () => {
  // Primero verificar localStorage
  const savedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (savedLang && ['es', 'en'].includes(savedLang)) {
    return savedLang;
  }
  // Si no hay idioma guardado, detectar del navegador
  const browserLang = navigator.language.split('-')[0];
  return browserLang === 'es' ? 'es' : 'en';
};

const resources = {
  es: { translation: esTranslations },
  en: { translation: enTranslations }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: detectLanguage(),
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage']
    },
    debug: false,
    react: {
      useSuspense: false
    }
  })
  .then(() => {})
  .catch((error) => {
    console.error('❌ Error al inicializar i18n:', error);
  });

export default i18n;
