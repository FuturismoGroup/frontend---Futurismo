import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { AVAILABLE_LANGUAGES } from '../../config/languages';

const LanguageMultiSelect = ({ 
  value = [], 
  onChange, 
  placeholder = "Selecciona idiomas disponibles",
  error = false,
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrar idiomas según búsqueda
  const filteredLanguages = AVAILABLE_LANGUAGES.filter(lang =>
    lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.nativeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle idioma seleccionado
  const toggleLanguage = (langCode) => {
    const newValue = value.includes(langCode)
      ? value.filter(code => code !== langCode)
      : [...value, langCode];
    onChange(newValue);
  };

  // Remover idioma específico
  const removeLanguage = (langCode, e) => {
    e.stopPropagation();
    onChange(value.filter(code => code !== langCode));
  };

  // Obtener idiomas seleccionados
  const selectedLanguages = value.map(code => 
    AVAILABLE_LANGUAGES.find(lang => lang.code === code)
  ).filter(Boolean);

  return (
    <div ref={dropdownRef} className="relative">
      {/* Input principal */}
      <div
        className={`
          min-h-[42px] px-3 py-2 border rounded-lg cursor-pointer
          flex items-center justify-between gap-2
          ${error ? 'border-red-300' : 'border-gray-300'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'}
          ${isOpen ? 'ring-2 ring-blue-500 border-transparent' : ''}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex-1 flex flex-wrap gap-2">
          {selectedLanguages.length > 0 ? (
            selectedLanguages.map(lang => (
              <span
                key={lang.code}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm"
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
                {!disabled && (
                  <button
                    onClick={(e) => removeLanguage(lang.code, e)}
                    className="ml-1 hover:text-blue-600"
                  >
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        <ChevronDownIcon 
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg">
          {/* Búsqueda */}
          <div className="p-2 border-b">
            <input
              type="text"
              placeholder="Buscar idioma..."
              className="w-full px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Lista de idiomas */}
          <div className="max-h-60 overflow-y-auto">
            {filteredLanguages.length > 0 ? (
              filteredLanguages.map(lang => {
                const isSelected = value.includes(lang.code);
                return (
                  <div
                    key={lang.code}
                    className={`
                      px-3 py-2 cursor-pointer flex items-center justify-between
                      ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}
                    `}
                    onClick={() => toggleLanguage(lang.code)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{lang.flag}</span>
                      <div>
                        <div className="text-sm font-medium">{lang.name}</div>
                        <div className="text-xs text-gray-500">{lang.nativeName}</div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                No se encontraron idiomas
              </div>
            )}
          </div>

          {/* Contador de seleccionados */}
          {value.length > 0 && (
            <div className="px-3 py-2 text-xs text-gray-500 border-t">
              {value.length} idioma{value.length !== 1 ? 's' : ''} seleccionado{value.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LanguageMultiSelect;