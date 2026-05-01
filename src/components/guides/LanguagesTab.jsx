import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { LEVEL_OPTIONS } from '../../constants/guidesConstants';

const LanguagesTab = ({
  register,
  languageFields,
  appendLanguage,
  removeLanguage,
  getAvailableLanguages,
  languages,
  isLoading = false
}) => {
  const { t } = useTranslation();

  // Si está cargando, mostrar indicador
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">{t('guides.comp.loadingLanguages')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-gray-900">
          {t('guides.comp.languageSpecialization')}
        </h4>
        <button
          type="button"
          onClick={() => appendLanguage({ code: '', level: 'principiante' })}
          className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
          disabled={languages.length === 0}
        >
          <PlusIcon className="w-4 h-4" />
          <span>{t('guides.comp.addLanguage')}</span>
        </button>
      </div>

      {/* Mensaje si no hay idiomas configurados */}
      {languages.length === 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <p className="text-sm text-yellow-700">
            {t('guides.comp.noLanguagesConfigured')}
          </p>
        </div>
      )}

      <div className="space-y-4">
        {languageFields.map((field, index) => {
          const availableLanguages = getAvailableLanguages(index);

          return (
            <div key={field.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('guides.comp.language')}
                  </label>
                  <select
                    {...register(`languages.${index}.code`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">{t('guides.comp.selectLanguage')}</option>
                    {availableLanguages.map(language => (
                      <option key={language.code} value={language.code}>
                        {language.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('guides.comp.proficiencyLevel')}
                  </label>
                  <select
                    {...register(`languages.${index}.level`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {LEVEL_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {t(option.labelKey)}
                      </option>
                    ))}
                  </select>
                </div>

                {languageFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLanguage(index)}
                    className="mt-8 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

LanguagesTab.propTypes = {
  register: PropTypes.func.isRequired,
  languageFields: PropTypes.array.isRequired,
  appendLanguage: PropTypes.func.isRequired,
  removeLanguage: PropTypes.func.isRequired,
  getAvailableLanguages: PropTypes.func.isRequired,
  languages: PropTypes.array.isRequired,
  isLoading: PropTypes.bool
};

export default LanguagesTab;
