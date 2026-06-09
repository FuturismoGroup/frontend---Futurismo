import { useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, MapPinIcon } from '@heroicons/react/24/outline';

// Tipos de ubicacion segun TBL-018 (locations) - values only, labels via i18n
const LOCATION_TYPE_VALUES = ['country', 'region', 'city', 'district', 'zone'];

const NewLocationModal = ({ isOpen, onClose, onSave, locations }) => {
  const { t } = useTranslation();

  const LOCATION_TYPES = LOCATION_TYPE_VALUES.map(value => ({
    value,
    label: t(`providers.form.locationType.${value}`, { defaultValue: value })
  }));
  const [formData, setFormData] = useState({
    name: '',
    type: 'city',
    parentId: ''
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = t('validation.nameFieldRequired');
    }
    if (!formData.type) {
      newErrors.type = t('validation.required');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Evitar que el submit del modal (renderizado por portal) burbujee al form padre
    e.stopPropagation();
    if (validate()) {
      try {
        await onSave(formData);
        // Solo cerrar si onSave fue exitoso
        handleClose();
      } catch (error) {
        console.error('Error en handleSubmit:', error);
        // No cerrar el modal si hay error, para que el usuario pueda corregir
      }
    }
  };

  const handleClose = () => {
    setFormData({ name: '', type: 'city', parentId: '' });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-stretch sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white sm:rounded-lg shadow-xl w-full max-w-md h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b sticky top-0 bg-white z-10">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center min-w-0">
            <MapPinIcon className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0" />
            <span className="truncate">{t('providers.form.fields.location')}</span>
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 -mr-2 min-h-[40px] min-w-[40px] flex items-center justify-center flex-shrink-0"
          >
            <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-3 sm:py-4 flex-1 flex flex-col">
          <div className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('pdf.name')} *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ej: Cusco Centro, Miraflores, etc."
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Ubicación Padre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('providers.form.fields.location')}
              </label>
              <select
                value={formData.parentId}
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('common.select')}</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {t('common.select')}
              </p>
            </div>

            {/* Tipo de ubicacion - requerido por TBL-018 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('providers.form.fields.location')} *
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.type ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                {LOCATION_TYPES.map(locType => (
                  <option key={locType.value} value={locType.value}>
                    {locType.label}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="text-sm text-red-600 mt-1">{errors.type}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {t('providers.stats.locations')}
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base w-full sm:w-auto"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
            >
              {t('common.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

NewLocationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  locations: PropTypes.array.isRequired
};

export default NewLocationModal;
