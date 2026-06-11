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
import { getStorageKey } from '../../config/app.config';

const CategoryManager = ({ onCategoriesChanged }) => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'gift',
    color: '#3B82F6'
  });
  const [errors, setErrors] = useState({});

  // Iconos disponibles (usando nombres de Heroicons)
  const availableIcons = [
    { value: 'gift', emoji: '🎁', labelKey: 'rewards.categoryManager.icons.gift' },
    { value: 'device-mobile', emoji: '📱', labelKey: 'rewards.categoryManager.icons.technology' },
    { value: 'airplane', emoji: '✈️', labelKey: 'rewards.categoryManager.icons.travel' },
    { value: 'academic-cap', emoji: '🎓', labelKey: 'rewards.categoryManager.icons.education' },
    { value: 'shopping-cart', emoji: '🛒', labelKey: 'rewards.categoryManager.icons.shopping' },
    { value: 'ticket', emoji: '🎫', labelKey: 'rewards.categoryManager.icons.entertainment' },
    { value: 'heart', emoji: '❤️', labelKey: 'rewards.categoryManager.icons.wellness' },
    { value: 'home', emoji: '🏠', labelKey: 'rewards.categoryManager.icons.home' },
    { value: 'sparkles', emoji: '✨', labelKey: 'rewards.categoryManager.icons.experiences' },
    { value: 'credit-card', emoji: '💳', labelKey: 'rewards.categoryManager.icons.cards' }
  ];

  // Colores predefinidos
  const availableColors = [
    { value: '#3B82F6', labelKey: 'rewards.categoryManager.colors.blue' },
    { value: '#10B981', labelKey: 'rewards.categoryManager.colors.green' },
    { value: '#F59E0B', labelKey: 'rewards.categoryManager.colors.orange' },
    { value: '#EF4444', labelKey: 'rewards.categoryManager.colors.red' },
    { value: '#8B5CF6', labelKey: 'rewards.categoryManager.colors.purple' },
    { value: '#EC4899', labelKey: 'rewards.categoryManager.colors.pink' },
    { value: '#06B6D4', labelKey: 'rewards.categoryManager.colors.cyan' },
    { value: '#84CC16', labelKey: 'rewards.categoryManager.colors.lime' }
  ];

  useEffect(() => {
    loadCategories();
  }, []);

  const getAuthHeaders = () => {
    // Usar la clave correcta del storage con el prefijo de la app
    const token = localStorage.getItem(getStorageKey('authToken')) ||
                  sessionStorage.getItem(getStorageKey('authToken'));
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/rewards/categories', {
        headers: getAuthHeaders()
      });
      const result = await response.json();
      if (result.success) {
        setCategories(result.data || []);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error(t('errors.unexpectedError'));
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
        ? `/api/rewards/categories/${editingCategory.id}`
        : '/api/rewards/categories';

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
      toast.error(t('errors.connectionError'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon || 'gift',
      color: category.color || '#3B82F6'
    });
    setShowModal(true);
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm(t('rewards.categoryManager.confirmDelete'))) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/rewards/categories/${categoryId}`, {
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
      toast.error(t('errors.connectionError'));
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      icon: 'gift',
      color: '#3B82F6'
    });
    setErrors({});
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {t('emergency.comp.categories', { defaultValue: 'Categorías' })}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {t('emergency.comp.categoriesDesc', { defaultValue: 'Gestiona las categorías para clasificar los premios' })}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          {t('emergency.comp.newCategory')}
        </button>
      </div>

      {/* Categories Grid */}
      {loading && categories.length === 0 ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4">{t('emergency.comp.loadingCategories')}</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <SwatchIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">{t('emergency.comp.noCategories')}</p>
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
                    {category.icon === 'gift' && '🎁'}
                    {category.icon === 'device-mobile' && '📱'}
                    {category.icon === 'airplane' && '✈️'}
                    {category.icon === 'academic-cap' && '🎓'}
                    {category.icon === 'shopping-cart' && '🛒'}
                    {category.icon === 'ticket' && '🎫'}
                    {category.icon === 'heart' && '❤️'}
                    {category.icon === 'home' && '🏠'}
                    {category.icon === 'sparkles' && '✨'}
                    {category.icon === 'credit-card' && '💳'}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {category.name}
                    </h4>
                    {category.description && (
                      <p className="text-sm text-gray-500">
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-3 border-t">
                <button
                  onClick={() => handleEdit(category)}
                  className="flex-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors flex items-center justify-center text-sm"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  {t('common.edit')}
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="flex-1 px-3 py-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors flex items-center justify-center text-sm"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  {t('common.delete')}
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
                  {t('pdf.name')} *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t('emergency.comp.categoryNamePlaceholder')}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
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
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder={t('providers.services.descriptionPlaceholder')}
                />
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
                  {availableIcons.map((icon) => (
                    <option key={icon.value} value={icon.value}>
                      {icon.emoji} {t(icon.labelKey)}
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
                      title={t(colorOption.labelKey)}
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
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t('common.saving') : editingCategory ? t('common.update') : t('common.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

CategoryManager.propTypes = {
  onCategoriesChanged: PropTypes.func
};

export default CategoryManager;
