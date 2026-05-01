import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  SwatchIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { getIconDisplay } from '../../utils/emergencyIcons';

const EmergencyCategoryManager = ({ onCategoriesChanged }) => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    icon: '🚑',
    color: '#EF4444'
  });
  const [errors, setErrors] = useState({});

  // Iconos disponibles para emergencias
  const availableIcons = [
    { value: '🚑', label: `🚑 ${t('emergency.comp.iconOptions.medical')}` },
    { value: '⛈️', label: `⛈️ ${t('emergency.comp.iconOptions.weather')}` },
    { value: '🚗', label: `🚗 ${t('emergency.comp.iconOptions.transport')}` },
    { value: '🔍', label: `🔍 ${t('emergency.comp.iconOptions.security')}` },
    { value: '📡', label: `📡 ${t('emergency.comp.iconOptions.communication')}` },
    { value: '🔥', label: `🔥 ${t('emergency.comp.iconOptions.fire')}` },
    { value: '💧', label: `💧 ${t('emergency.comp.iconOptions.flood')}` },
    { value: '⚠️', label: `⚠️ ${t('emergency.comp.iconOptions.generalAlert')}` },
    { value: '🆘', label: `🆘 ${t('emergency.comp.iconOptions.sos')}` },
    { value: '⚡', label: `⚡ ${t('emergency.comp.iconOptions.electrical')}` }
  ];

  // Colores predefinidos
  const availableColors = [
    { value: '#EF4444', label: t('emergency.comp.colorOptions.red') },
    { value: '#F59E0B', label: t('emergency.comp.colorOptions.orange') },
    { value: '#3B82F6', label: t('emergency.comp.colorOptions.blue') },
    { value: '#10B981', label: t('emergency.comp.colorOptions.green') },
    { value: '#8B5CF6', label: t('emergency.comp.colorOptions.purple') },
    { value: '#EC4899', label: t('emergency.comp.colorOptions.pink') },
    { value: '#6B7280', label: t('emergency.comp.colorOptions.gray') },
    { value: '#14B8A6', label: t('emergency.comp.colorOptions.turquoise') }
  ];

  useEffect(() => {
    loadCategories();
  }, []);

  const getAuthHeaders = () => {
    // El token se guarda con prefijo 'futurismo_'
    const token = localStorage.getItem('futurismo_auth_token') || sessionStorage.getItem('futurismo_auth_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/emergency/categories', {
        headers: getAuthHeaders()
      });
      const result = await response.json();
      if (result.success) {
        setCategories(result.data || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error(t('emergency.comp.errorLoadingCategories'));
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = t('validation.nameFieldRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const url = editingCategory
        ? `/api/emergency/categories/${editingCategory.id}`
        : '/api/emergency/categories';

      const method = editingCategory ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        await loadCategories();
        if (onCategoriesChanged) onCategoriesChanged();
        handleCloseModal();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(t('emergency.comp.errorSavingCategory'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      icon: category.icon || '🚑',
      color: category.color || '#EF4444'
    });
    setShowModal(true);
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm(t('validation.confirmDeleteCategory'))) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/emergency/categories/${categoryId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        await loadCategories();
        if (onCategoriesChanged) onCategoriesChanged();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error(t('emergency.comp.errorDeletingCategory'));
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      icon: '🚑',
      color: '#EF4444'
    });
    setErrors({});
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {t('emergency.comp.categoriesTitle')}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {t('emergency.comp.categoriesDesc')}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          {t('emergency.comp.newCategory')}
        </button>
      </div>

      {/* Categories Grid */}
      {loading && categories.length === 0 ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">{t('emergency.comp.loadingCategories')}</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <SwatchIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{t('emergency.comp.noCategoriesCreated')}</p>
          <p className="text-sm text-gray-500 mt-1">
            {t('emergency.comp.clickNewCategory')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-xl"
                    style={{ backgroundColor: category.color }}
                  >
                    {getIconDisplay(category.icon)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {category.name}
                    </h4>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-3 border-t">
                <button
                  onClick={() => handleEdit(category)}
                  className="flex-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors flex items-center justify-center text-sm"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  {t('emergency.comp.editBtn')}
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="flex-1 px-3 py-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors flex items-center justify-center text-sm"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  {t('emergency.comp.deleteBtn')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCategory ? t('emergency.comp.editCategory') : t('emergency.comp.newCategory')}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('emergency.comp.nameLabel')} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t('emergency.comp.categoryNamePlaceholder')}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                >
                  {availableIcons.map((icon) => (
                    <option key={icon.value} value={icon.value}>
                      {icon.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('emergency.comp.colorLabel')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableColors.map((colorOption) => (
                    <button
                      key={colorOption.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: colorOption.value })}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        formData.color === colorOption.value
                          ? 'border-gray-900 scale-110'
                          : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: colorOption.value }}
                      title={colorOption.label}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {t('emergency.comp.cancelBtn')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t('emergency.comp.savingBtn') : editingCategory ? t('emergency.comp.updateBtn') : t('emergency.comp.createBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

EmergencyCategoryManager.propTypes = {
  onCategoriesChanged: PropTypes.func
};

export default EmergencyCategoryManager;
