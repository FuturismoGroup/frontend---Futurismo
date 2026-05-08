import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, TagIcon } from '@heroicons/react/24/outline';

const NewServiceModal = ({ isOpen, onClose, onSave, selectedCategory, categories }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Obtener nombre de la categoría para mostrar en el header
  const getCategoryName = () => {
    if (!selectedCategory || !Array.isArray(categories)) return '';
    const cat = categories.find(c => c.id === selectedCategory);
    if (!cat) return '';
    // Si el name es un key de traducción, intentar traducir
    const translated = t(cat.name, { defaultValue: '' });
    return translated || cat.name;
  };

  useEffect(() => {
    if (isOpen) {
      setFormData({ name: '', description: '' });
      setErrors({});
      setSaving(false);
    }
  }, [isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = t('providers.services.nameRequired');
    } else if (formData.name.trim().length < 2) {
      newErrors.name = t('validation.nameMinTwo');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Evitar que el submit del modal (renderizado por portal) burbujee al form padre
    e.stopPropagation();
    if (!validate()) return;

    setSaving(true);
    try {
      await onSave(formData);
      handleClose();
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      setSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', description: '' });
    setErrors({});
    setSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  const categoryName = getCategoryName();

  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <TagIcon className="w-5 h-5 mr-2 text-blue-600" />
              {t('providers.services.new')}
            </h3>
            {categoryName && (
              <p className="text-sm text-gray-500 mt-0.5 ml-7">
                {t('providers.form.fields.category')}: <span className="font-medium text-gray-700">{categoryName}</span>
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="space-y-4">
            {/* Nombre del Servicio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('providers.services.nameLabel')}
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={t('providers.services.namePlaceholder')}
                autoFocus
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name}</p>
              )}
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
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className={`px-4 py-2 text-white rounded-lg transition-colors ${
                saving
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {saving ? t('common.saving') : t('providers.services.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

NewServiceModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  selectedCategory: PropTypes.string,
  categories: PropTypes.array
};

export default NewServiceModal;
