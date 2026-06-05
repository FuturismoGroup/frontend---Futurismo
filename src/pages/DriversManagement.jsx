import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TruckIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  IdentificationIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import useDriversStore from '../stores/driversStore';
import {
  LICENSE_CATEGORIES,
  LICENSE_CATEGORY_LABELS,
  DRIVER_VALIDATIONS
} from '../constants/driversConstants';
import { formatDateSafe, formatTimestampSafe } from '../utils/dateUtils';
import toast from 'react-hot-toast';

const DriversManagement = () => {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dni: '',
    licenseNumber: '',
    licenseCategory: LICENSE_CATEGORIES.A_IIIC,
    licenseExpiry: ''
  });
  
  const [errors, setErrors] = useState({});

  // Store
  const {
    drivers,
    loading,
    fetchDrivers,
    createDriver,
    updateDriver,
    deleteDriver
  } = useDriversStore();

  // Cargar datos al montar
  useEffect(() => {
    fetchDrivers();
  }, []);

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName || formData.firstName.length < 2) {
      newErrors.firstName = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formData.lastName || formData.lastName.length < 2) {
      newErrors.lastName = 'El apellido debe tener al menos 2 caracteres';
    }

    if (!formData.dni || formData.dni.length !== 8) {
      newErrors.dni = 'El DNI debe tener 8 dígitos';
    }

    if (!formData.licenseNumber) {
      newErrors.licenseNumber = 'El número de licencia es requerido';
    }

    if (!formData.licenseExpiry) {
      newErrors.licenseExpiry = 'La fecha de vencimiento es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Por favor corrija los errores en el formulario');
      return;
    }

    try {
      console.log('💾 Guardando chofer:', {
        modo: editingDriver ? 'Actualizar' : 'Crear',
        id: editingDriver?.id,
        data: formData
      });

      if (editingDriver) {
        const result = await updateDriver(editingDriver.id, formData);
        console.log('✅ Chofer actualizado:', result);
      } else {
        const result = await createDriver(formData);
        console.log('✅ Chofer creado:', result);
      }

      setShowForm(false);
      resetForm();
      // El toast de éxito/error lo emite el store (createDriver / updateDriver)
      // para evitar duplicar mensajes en pantalla.
    } catch (error) {
      console.error('❌ Error al guardar chofer:', error);
    }
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      dni: '',
      licenseNumber: '',
      licenseCategory: LICENSE_CATEGORIES.A_IIIC,
      licenseExpiry: ''
    });
    setErrors({});
    setEditingDriver(null);
  };

  // Manejar edición
  const handleEdit = (driver) => {
    console.log('📝 Editando chofer:', driver);
    setEditingDriver(driver);

    // Soportar tanto snake_case (del backend) como camelCase
    const firstName = driver.first_name || driver.firstName || '';
    const lastName = driver.last_name || driver.lastName || '';
    const licenseNumber = driver.license_number || driver.licenseNumber || '';
    const licenseCategory = driver.license_type || driver.licenseCategory || LICENSE_CATEGORIES.A_IIIC;
    const licenseExpiry = driver.license_expiry || driver.licenseExpiry || '';

    setFormData({
      firstName,
      lastName,
      dni: driver.dni || '',
      licenseNumber,
      licenseCategory,
      licenseExpiry: licenseExpiry ? licenseExpiry.split('T')[0] : ''
    });
    setShowForm(true);
  };

  // Manejar eliminación
  const handleDelete = async (driver) => {
    if (window.confirm(`¿Está seguro de eliminar al chofer ${driver.fullName}?`)) {
      await deleteDriver(driver.id);
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <TruckIcon className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Choferes</h1>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Nuevo Chofer
            </button>
          </div>
        </div>


        {/* Búsqueda simple */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Lista de choferes */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    DNI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Licencia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimiento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registrado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : drivers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                      No se encontraron choferes
                    </td>
                  </tr>
                ) : (
                  drivers
                    .filter(driver => {
                      if (!searchTerm) return true;

                      const search = searchTerm.toLowerCase();
                      const fullName = driver.fullName || `${driver.first_name || driver.firstName || ''} ${driver.last_name || driver.lastName || ''}`.trim();
                      const dni = driver.dni || '';

                      return fullName.toLowerCase().includes(search) ||
                             dni.includes(search);
                    })
                    .map((driver) => (
                    <tr key={driver.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {driver.fullName || `${driver.first_name || driver.firstName || ''} ${driver.last_name || driver.lastName || ''}`.trim() || 'Sin nombre'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {driver.dni}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {driver.license_number || driver.licenseNumber || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {LICENSE_CATEGORY_LABELS[driver.license_type || driver.licenseCategory] ? t(LICENSE_CATEGORY_LABELS[driver.license_type || driver.licenseCategory]) : (driver.license_type || driver.licenseCategory || 'N/A')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {driver.license_expiry || driver.licenseExpiry
                            ? formatDateSafe(driver.license_expiry || driver.licenseExpiry)
                            : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {driver.createdAt
                            ? formatTimestampSafe(driver.createdAt)
                            : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEdit(driver)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Editar"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(driver)}
                            className="text-red-600 hover:text-red-900"
                            title="Eliminar"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

        {/* Modal de formulario */}
        {showForm && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-6">
                  {editingDriver ? 'Editar Chofer' : 'Nuevo Chofer'}
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Información Personal */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Información Personal</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nombre *
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className={`w-full border rounded-lg px-3 py-2 ${errors.firstName ? 'border-red-500' : ''}`}
                        />
                        {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Apellido *
                        </label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className={`w-full border rounded-lg px-3 py-2 ${errors.lastName ? 'border-red-500' : ''}`}
                        />
                        {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          DNI *
                        </label>
                        <input
                          type="text"
                          value={formData.dni}
                          onChange={(e) => {
                            const numbersOnly = e.target.value.replace(/\D/g, '');
                            setFormData({ ...formData, dni: numbersOnly });
                          }}
                          onKeyPress={(e) => {
                            if (!/[0-9]/.test(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          onPaste={(e) => {
                            e.preventDefault();
                            const pastedText = e.clipboardData.getData('text');
                            const numbersOnly = pastedText.replace(/\D/g, '').slice(0, 8);
                            setFormData({ ...formData, dni: numbersOnly });
                          }}
                          maxLength={8}
                          inputMode="numeric"
                          placeholder="12345678"
                          className={`w-full border rounded-lg px-3 py-2 ${errors.dni ? 'border-red-500' : ''}`}
                        />
                        {errors.dni && <p className="text-red-500 text-sm mt-1">{errors.dni}</p>}
                      </div>

                    </div>
                  </div>

                  {/* Información de Licencia */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Información de Licencia</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Número de Licencia *
                        </label>
                        <input
                          type="text"
                          value={formData.licenseNumber}
                          onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                          className={`w-full border rounded-lg px-3 py-2 ${errors.licenseNumber ? 'border-red-500' : ''}`}
                        />
                        {errors.licenseNumber && <p className="text-red-500 text-sm mt-1">{errors.licenseNumber}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Categoría de Licencia *
                        </label>
                        <select
                          value={formData.licenseCategory}
                          onChange={(e) => setFormData({ ...formData, licenseCategory: e.target.value })}
                          className="w-full border rounded-lg px-3 py-2"
                        >
                          {Object.entries(LICENSE_CATEGORY_LABELS).map(([value, labelKey]) => (
                            <option key={value} value={value}>{t(labelKey)}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fecha de Vencimiento *
                        </label>
                        <input
                          type="date"
                          value={formData.licenseExpiry}
                          onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                          className={`w-full border rounded-lg px-3 py-2 ${errors.licenseExpiry ? 'border-red-500' : ''}`}
                        />
                        {errors.licenseExpiry && <p className="text-red-500 text-sm mt-1">{errors.licenseExpiry}</p>}
                      </div>
                    </div>
                  </div>


                  {/* Botones */}
                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        resetForm();
                      }}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? t('common.saving') : (editingDriver ? t('common.update') : t('common.create'))}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DriversManagement;