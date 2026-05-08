import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { api } from '../../services';

// Función para convertir texto a slug (ID)
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9\s-]/g, '') // Solo letras, números, espacios y guiones
    .replace(/\s+/g, '_') // Espacios a guiones bajos
    .replace(/-+/g, '_') // Guiones a guiones bajos
    .replace(/^_+|_+$/g, ''); // Eliminar guiones bajos al inicio/final
};

// Colores predefinidos para tipos de servicio
const PREDEFINED_COLORS = [
  { value: '#8B5CF6', label: 'Violeta' },
  { value: '#F59E0B', label: 'Naranja' },
  { value: '#6B7280', label: 'Gris' },
  { value: '#3B82F6', label: 'Azul' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#10B981', label: 'Verde' },
  { value: '#6366F1', label: 'Indigo' },
  { value: '#F97316', label: 'Naranja Oscuro' },
  { value: '#22C55E', label: 'Verde Claro' },
  { value: '#EF4444', label: 'Rojo' }
];

const ServiceTypesSettings = () => {
  const { t } = useTranslation();
  const [serviceTypes, setServiceTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingType, setEditingType] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    value: '',
    label: '',
    description: '',
    color: '#6B7280'
  });

  // Autogenerar el valor (ID) cuando cambia la etiqueta
  const handleLabelChange = (e) => {
    const newLabel = e.target.value;
    setFormData(prev => ({
      ...prev,
      label: newLabel,
      // Solo autogenerar si no estamos editando
      value: editingType ? prev.value : generateSlug(newLabel)
    }));
  };

  // Cargar tipos de servicio
  useEffect(() => {
    loadServiceTypes();
  }, []);

  const loadServiceTypes = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/config/service-types');

      if (response.data.success) {
        setServiceTypes(response.data.data.serviceTypes || []);
      } else {
        toast.error(t('errors.unexpectedError'));
      }
    } catch (error) {
      console.error('Error loading service types:', error);
      toast.error(t('errors.connectionError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.value || !formData.label) {
      toast.error(t('validation.required'));
      return;
    }

    try {
      let response;

      if (editingType) {
        response = await api.put(`/config/service-types/${editingType.value}`, formData);
      } else {
        response = await api.post('/config/service-types', formData);
      }

      if (response.data.success) {
        toast.success(editingType ? t('common.update') : t('common.create'));
        loadServiceTypes();
        resetForm();
      } else {
        toast.error(response.data.error || t('errors.unexpectedError'));
      }
    } catch (error) {
      console.error('Error saving service type:', error);
      toast.error(t('errors.unexpectedError'));
    }
  };

  const handleDelete = async (value) => {
    if (!confirm(t('validation.confirmDeleteServiceType'))) {
      return;
    }

    try {
      const response = await api.delete(`/config/service-types/${value}`);

      if (response.data.success) {
        toast.success(t('common.delete'));
        loadServiceTypes();
      } else {
        toast.error(response.data.error || t('errors.unexpectedError'));
      }
    } catch (error) {
      console.error('Error deleting service type:', error);
      toast.error(t('errors.unexpectedError'));
    }
  };

  const handleEdit = (type) => {
    setEditingType(type);
    setFormData({
      value: type.value,
      label: type.label,
      description: type.description || '',
      color: type.color || '#6B7280'
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      value: '',
      label: '',
      description: '',
      color: '#6B7280'
    });
    setEditingType(null);
    setShowForm(false);
  };

  if (isLoading) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm border">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t('services.management')}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {t('settings.tours.description')}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? (
            <>
              <XMarkIcon className="w-5 h-5" />
              {t('common.cancel')}
            </>
          ) : (
            <>
              <PlusIcon className="w-5 h-5" />
              {t('services.newService')}
            </>
          )}
        </button>
      </div>

      {/* Formulario de creación/edición */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-md font-semibold text-gray-900 mb-4">
            {editingType ? t('services.editService') : t('services.newService')}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('profile.payment.label')} *
              </label>
              <input
                type="text"
                value={formData.label}
                onChange={handleLabelChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Tour Privado"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('pdf.name')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ID
              </label>
              <input
                type="text"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${!editingType ? 'bg-gray-100 text-gray-600' : ''}`}
                placeholder="tour_privado"
                required
                readOnly={!editingType}
              />
              <p className="text-xs text-gray-500 mt-1">
                ID
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('providers.services.descriptionLabel')}
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descripción del tipo de servicio"
                rows="2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('emergency.comp.colorLabel')}
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
                <div className="flex-1 flex flex-wrap items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg bg-white">
                  {PREDEFINED_COLORS.map(color => {
                    const isSelected = (formData.color || '').toLowerCase() === color.value.toLowerCase();
                    return (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: color.value })}
                        title={color.label}
                        aria-label={color.label}
                        className={`w-7 h-7 rounded-full border-2 transition-all ${
                          isSelected
                            ? 'border-gray-900 scale-110 ring-2 ring-offset-1 ring-gray-400'
                            : 'border-gray-200 hover:border-gray-400'
                        }`}
                        style={{ backgroundColor: color.value }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <CheckIcon className="w-5 h-5" />
              {editingType ? t('common.update') : t('common.create')}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      )}

      {/* Lista de tipos de servicio */}
      <div className="space-y-3">
        {serviceTypes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>{t('common.noData')}</p>
            <p className="text-sm mt-1">{t('services.newService')}</p>
          </div>
        ) : (
          serviceTypes.map((type) => (
            <div
              key={type.value}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg"
                    style={{ backgroundColor: type.color || '#6B7280' }}
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">{type.label}</h4>
                    <p className="text-sm text-gray-600">{type.description}</p>
                    <div className="flex gap-3 mt-1">
                      <span className="text-xs text-gray-500">
                        ID: <code className="bg-gray-100 px-1 rounded">{type.value}</code>
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        Color:
                        <span
                          className="w-4 h-4 rounded inline-block border border-gray-300"
                          style={{ backgroundColor: type.color || '#6B7280' }}
                        ></span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleEdit(type)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title={t('common.edit')}
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleDelete(type.value)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title={t('common.delete')}
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ServiceTypesSettings;
