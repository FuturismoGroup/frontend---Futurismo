import React from 'react';
import { useTranslation } from 'react-i18next';
import { GlobeAltIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import useLanguageToggle from '../../hooks/useLanguageToggle';

const LanguageToggle = () => {
  const { t } = useTranslation();
  const {
    isOpen,
    languages,
    currentLanguage,
    dropdownRef,
    changeLanguage,
    toggleDropdown
  } = useLanguageToggle();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-all duration-200 text-gray-600 hover:text-gray-900 group"
        title={t('common.changeLanguage')}
        aria-label={t('common.changeLanguage')}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <GlobeAltIcon className="w-5 h-5 text-gray-500 group-hover:text-gray-700 transition-colors" />
        <span className="text-base leading-none">{currentLanguage.flag}</span>
        <ChevronDownIcon
          className={`hidden sm:block w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-all ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
          role="menu"
          aria-orientation="vertical"
        >
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => changeLanguage(language.code)}
              className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                language.code === currentLanguage.code 
                  ? 'bg-primary-50 text-primary-600' 
                  : 'text-gray-700'
              }`}
              role="menuitem"
              aria-current={language.code === currentLanguage.code ? 'true' : 'false'}
            >
              <span className="text-lg" aria-hidden="true">{language.flag}</span>
              <span className="font-medium text-sm">{language.name}</span>
              {language.code === currentLanguage.code && (
                <span 
                  className="ml-auto w-2 h-2 bg-primary-600 rounded-full" 
                  aria-label={t('common.currentLanguage')}
                ></span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageToggle;