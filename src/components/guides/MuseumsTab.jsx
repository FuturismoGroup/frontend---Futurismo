import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { PlusIcon, TrashIcon, ArrowUpTrayIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';

const MuseumsTab = ({
  register,
  museumFields,
  appendMuseum,
  removeMuseum,
  setValue,
  watch
}) => {
  const { t } = useTranslation();
  const [uploadingCertificate, setUploadingCertificate] = useState({});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-medium text-gray-900">
          {t('guides.comp.museumKnowledge')}
        </h4>
        <button
          type="button"
          onClick={() => appendMuseum({
            name: '',
            expertise: 'basico',
            years: 1,
            certificates: []
          })}
          className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
        >
          <PlusIcon className="w-4 h-4" />
          <span>{t('guides.comp.addMuseum')}</span>
        </button>
      </div>

      <div className="space-y-4">
        {museumFields.map((field, index) => (
          <div key={field.id} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
            {/* Header con botón eliminar */}
            <div className="flex items-start justify-between mb-4">
              <h5 className="text-base font-medium text-gray-900">
                {t('guides.comp.museumNumber', { number: index + 1 })}
              </h5>
              {museumFields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMuseum(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Campos principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Nombre del museo */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('guides.comp.museumName')} *
                </label>
                <input
                  {...register(`museums.${index}.name`)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('guides.comp.museumPlaceholder')}
                />
              </div>

              {/* Años de experiencia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('guides.comp.yearsOfExperience')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    {...register(`museums.${index}.years`)}
                    min="0"
                    max="50"
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-sm text-gray-600">
                    {t('guides.comp.years')}
                  </span>
                </div>
              </div>

              {/* Nivel de expertise */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('guides.comp.expertiseLevel')}
                </label>
                <select
                  {...register(`museums.${index}.expertise`)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="basico">{t('guides.comp.basicLevel')}</option>
                  <option value="intermedio">{t('guides.comp.intermediateLevel')}</option>
                  <option value="avanzado">{t('guides.comp.advancedLevel')}</option>
                  <option value="experto">{t('guides.comp.expertLevel')}</option>
                </select>
              </div>
            </div>

            {/* Sección de certificados */}
            <div className="border-t pt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('guides.comp.certificates')}
              </label>

              {/* Lista de certificados subidos */}
              {watch(`museums.${index}.certificates`)?.length > 0 && (
                <div className="mb-3 space-y-2">
                  {watch(`museums.${index}.certificates`).map((cert, certIndex) => (
                    <div key={certIndex} className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2">
                        <DocumentIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{cert.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const currentCerts = watch(`museums.${index}.certificates`) || [];
                          setValue(
                            `museums.${index}.certificates`,
                            currentCerts.filter((_, i) => i !== certIndex)
                          );
                        }}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Botón para subir certificado */}
              <div className="flex items-center gap-2">
                <label className="relative">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setUploadingCertificate({ ...uploadingCertificate, [index]: true });

                        // Simulación de subida - En producción aquí iría la lógica real de upload
                        setTimeout(() => {
                          const currentCerts = watch(`museums.${index}.certificates`) || [];
                          setValue(`museums.${index}.certificates`, [
                            ...currentCerts,
                            {
                              name: file.name,
                              url: URL.createObjectURL(file),
                              uploadedAt: new Date().toISOString()
                            }
                          ]);
                          setUploadingCertificate({ ...uploadingCertificate, [index]: false });
                        }, 1000);
                      }
                    }}
                  />
                  <div className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer flex items-center gap-2">
                    {uploadingCertificate[index] ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        <span className="text-sm text-gray-600">{t('guides.comp.uploading')}</span>
                      </>
                    ) : (
                      <>
                        <ArrowUpTrayIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-700">{t('guides.comp.uploadCertificate')}</span>
                      </>
                    )}
                  </div>
                </label>
                <span className="text-xs text-gray-500">
                  {t('guides.comp.fileFormats')}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

MuseumsTab.propTypes = {
  register: PropTypes.func.isRequired,
  museumFields: PropTypes.array.isRequired,
  appendMuseum: PropTypes.func.isRequired,
  removeMuseum: PropTypes.func.isRequired,
  setValue: PropTypes.func.isRequired,
  watch: PropTypes.func.isRequired
};

export default MuseumsTab;
