import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AVAILABLE_LANGUAGES,
  LANGUAGE_STORAGE_KEY
} from '../config/languages';

/**
 * Hook personalizado para manejar el cambio de idioma
 * @returns {Object} Estado y funciones para el selector de idioma
 */
const useLanguageToggle = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Filtrar solo los idiomas actualmente soportados (ES y EN)
  const languages = useMemo(() => 
    AVAILABLE_LANGUAGES.filter(lang => ['es', 'en'].includes(lang.code)),
    []
  );

  const currentLanguage = useMemo(() => 
    languages.find(lang => lang.code === i18n.language) || languages[0],
    [i18n.language, languages]
  );

  /**
   * Cierra el dropdown cuando se hace clic fuera
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  /**
   * Cambia el idioma de la aplicación
   * @param {string} languageCode - Código del idioma
   */
  const changeLanguage = useCallback((languageCode) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
    // Persistir preferencia de idioma
    localStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
  }, [i18n]);

  /**
   * Alterna la visibilidad del dropdown
   */
  const toggleDropdown = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  return {
    // Estado
    isOpen,
    languages,
    currentLanguage,
    dropdownRef,
    
    // Acciones
    changeLanguage,
    toggleDropdown
  };
};

export default useLanguageToggle;