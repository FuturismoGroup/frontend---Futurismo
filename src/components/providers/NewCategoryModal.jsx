import { useState } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, TagIcon } from '@heroicons/react/24/outline';

const ICON_OPTIONS = [
  { value: 'utensils', label: '🍽️ Restaurante' },
  { value: 'building', label: '🏨 Hotel' },
  { value: 'truck', label: '🚚 Transporte' },
  { value: 'ticket', label: '🎫 Actividad' },
  { value: 'briefcase', label: '💼 Servicios' },
  { value: 'camera', label: '📷 Fotografía' },
  { value: 'shopping-bag', label: '🛍️ Compras' },
  { value: 'coffee', label: '☕ Cafetería' },
  { value: 'star', label: '⭐ Atracción' }
];

const NewCategoryModal = ({ isOpen, onClose, onSave }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    icon: 'tag',
    description: ''
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = t('validation.nameFieldRequired');
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
    setFormData({ name: '', icon: 'tag', description: '' });
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
            <TagIcon className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0" />
            <span className="truncate">{t('providers.categories.new')}</span>
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
                placeholder="Ej: Spa, Tours guiados, etc."
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name}</p>
              )}
            </div>

            {/* Icono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('emergency.comp.iconLabel')}
              </label>
              <select
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {ICON_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('providers.services.descriptionLabel')}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder={t('providers.services.descriptionPlaceholder')}
              />
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

NewCategoryModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};

export default NewCategoryModal;
