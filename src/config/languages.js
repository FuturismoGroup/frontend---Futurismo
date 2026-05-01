// Configuración centralizada de idiomas disponibles en el sistema
// FUENTE ÚNICA DE VERDAD para idiomas en todo el frontend

export const AVAILABLE_LANGUAGES = [
  // Idiomas más comunes
  { code: 'es', labelKey: 'languageNames.es', name: 'Español', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'en', labelKey: 'languageNames.en', name: 'Inglés', nativeName: 'English', flag: '🇺🇸' },
  { code: 'pt', labelKey: 'languageNames.pt', name: 'Portugués', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'fr', labelKey: 'languageNames.fr', name: 'Francés', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', labelKey: 'languageNames.de', name: 'Alemán', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', labelKey: 'languageNames.it', name: 'Italiano', nativeName: 'Italiano', flag: '🇮🇹' },

  // Idiomas asiáticos
  { code: 'zh', labelKey: 'languageNames.zh', name: 'Chino', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ja', labelKey: 'languageNames.ja', name: 'Japonés', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', labelKey: 'languageNames.ko', name: 'Coreano', nativeName: '한국어', flag: '🇰🇷' },

  // Otros idiomas europeos
  { code: 'ru', labelKey: 'languageNames.ru', name: 'Ruso', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'nl', labelKey: 'languageNames.nl', name: 'Holandés', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'pl', labelKey: 'languageNames.pl', name: 'Polaco', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'sv', labelKey: 'languageNames.sv', name: 'Sueco', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'no', labelKey: 'languageNames.no', name: 'Noruego', nativeName: 'Norsk', flag: '🇳🇴' },

  // Idiomas adicionales
  { code: 'ar', labelKey: 'languageNames.ar', name: 'Árabe', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'he', labelKey: 'languageNames.he', name: 'Hebreo', nativeName: 'עברית', flag: '🇮🇱' },
  { code: 'hi', labelKey: 'languageNames.hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'th', labelKey: 'languageNames.th', name: 'Tailandés', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'tr', labelKey: 'languageNames.tr', name: 'Turco', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'el', labelKey: 'languageNames.el', name: 'Griego', nativeName: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'quechua', labelKey: 'languageNames.quechua', name: 'Quechua', nativeName: 'Runasimi', flag: '🇵🇪' }
];

// Mapeo de nombres legacy (registro antiguo) a códigos ISO
export const LEGACY_TO_ISO = {
  spanish: 'es', english: 'en', portuguese: 'pt', french: 'fr',
  german: 'de', italian: 'it', japanese: 'ja', chinese: 'zh',
  korean: 'ko', russian: 'ru', dutch: 'nl', arabic: 'ar',
};

// Normalizar código de idioma: legacy 'spanish' → 'es', ya ISO 'es' → 'es'
export const normalizeLanguageCode = (code) => {
  if (!code) return null;
  const lower = code.toLowerCase().trim();
  return LEGACY_TO_ISO[lower] || lower;
};

// Obtener nombre en español de un idioma por cualquier código (ISO o legacy)
export const getLanguageName = (code) => {
  if (!code) return code;
  const iso = normalizeLanguageCode(code);
  const lang = AVAILABLE_LANGUAGES.find(l => l.code === iso);
  return lang?.name || code;
};

// Opciones de idiomas para formularios (checkbox/select) - primeros 9 idiomas principales
export const LANGUAGE_OPTIONS = AVAILABLE_LANGUAGES.slice(0, 9).map(l => ({
  value: l.code,
  label: l.name,
  labelKey: l.labelKey
}));

// Clave de localStorage para persistir preferencia de idioma de la UI
export const LANGUAGE_STORAGE_KEY = 'preferredLanguage';
