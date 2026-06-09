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
      newErrors.firstName = t('driversManagement.errors.firstNameMin');
    }

    if (!formData.lastName || formData.lastName.length < 2) {
      newErrors.lastName = t('driversManagement.errors.lastNameMin');
    }

    if (!formData.dni || formData.dni.length !== 8) {
      newErrors.dni = t('driversManagement.errors.dniLength');
    }

    if (!formData.licenseNumber) {
      newErrors.licenseNumber = t('driversManagement.errors.licenseNumberRequired');
    }

    if (!formData.licenseExpiry) {
      newErrors.licenseExpiry = t('driversManagement.errors.licenseExpiryRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(t('driversManagement.errors.fixFormErrors'));
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
    if (window.confirm(t('driversManagement.confirmDelete', { name: driver.fullName }))) {
      await deleteDriver(driver.id);
    }
  };


  // Filtrar choferes segun el searchTerm
  const filteredDrivers = drivers.filter(driver => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    const fullName = driver.fullName || `${driver.first_name || driver.firstName || ''} ${driver.last_name || driver.lastName || ''}`.trim();
    const dni = driver.dni || '';
    return fullName.toLowerCase().includes(search) || dni.includes(search);
  });

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <TruckIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-600 flex-shrink-0" />
              <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 truncate">{t('driversManagement.title')}</h1>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="bg-blue-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg hover:bg-blue-700 flex items-center justify-center text-sm sm:text-base whitespace-nowrap flex-shrink-0"
            >
              <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
              <span>{t('driversManagement.newDriver')}</span>
            </button>
          </div>
        </div>


        {/* Búsqueda simple */}
        <div className="bg-white rounded-lg shadow mb-4 sm:mb-6 p-3 sm:p-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder={t('driversManagement.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Vista mobile - Cards */}
        <div className="md:hidden space-y-3">
          {loading ? (
            <div className="bg-white rounded-lg shadow p-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredDrivers.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500 text-sm">
              {t('driversManagement.notFound')}
            </div>
          ) : (
            filteredDrivers.map((driver) => {
              const fullName = driver.fullName || `${driver.first_name || driver.firstName || ''} ${driver.last_name || driver.lastName || ''}`.trim() || t('driversManagement.noName');
              const licNum = driver.license_number || driver.licenseNumber || 'N/A';
              const licType = LICENSE_CATEGORY_LABELS[driver.license_type || driver.licenseCategory]
                ? t(LICENSE_CATEGORY_LABELS[driver.license_type || driver.licenseCategory])
                : (driver.license_type || driver.licenseCategory || 'N/A');
              const licExp = driver.license_expiry || driver.licenseExpiry;
              const created = driver.createdAt;
              return (
                <div key={driver.id} className="bg-white rounded-lg shadow border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-semibold text-gray-900 truncate">{fullName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">DNI: {driver.dni}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(driver)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
                        title={t('driversManagement.actions.edit')}
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(driver)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
                        title={t('driversManagement.actions.delete')}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm border-t border-gray-100 pt-3">
                    <div>
                      <p className="text-gray-500">{t('driversManagement.card.license')}</p>
                      <p className="text-gray-900 font-medium truncate">{licNum}</p>
                      <p className="text-xs text-gray-500 truncate">{licType}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">{t('driversManagement.card.expires')}</p>
                      <p className="text-gray-900 font-medium">{licExp ? formatDateSafe(licExp) : 'N/A'}</p>
                      <p className="text-xs text-gray-500">{created ? formatTimestampSafe(created) : ''}</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Lista de choferes - Desktop tabla */}
        <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('driversManagement.table.name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('driversManagement.table.dni')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('driversManagement.table.license')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('driversManagement.table.expiry')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('driversManagement.table.registered')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('driversManagement.table.actions')}
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
                      {t('driversManagement.notFound')}
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
                          {driver.fullName || `${driver.first_name || driver.firstName || ''} ${driver.last_name || driver.lastName || ''}`.trim() || t('driversManagement.noName')}
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
                            title={t('driversManagement.actions.edit')}
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(driver)}
                            className="text-red-600 hover:text-red-900"
                            title={t('driversManagement.actions.delete')}
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
          <div className="fixed inset-0 bg-gray-900/70 flex items-center sm:items-center justify-center p-0 sm:p-4 z-50">
            <div className="bg-white sm:rounded-xl max-w-4xl w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto flex flex-col">
              <div className="flex items-center justify-between p-4 sm:p-6 border-b sticky top-0 bg-white z-10">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                  {editingDriver ? t('driversManagement.editDriver') : t('driversManagement.newDriver')}
                </h2>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
                  aria-label={t('driversManagement.actions.close')}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 sm:p-6 flex-1">

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  {/* Información Personal */}
                  <div>
                    <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">{t('driversManagement.section.personalInfo')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('driversManagement.form.firstName')}
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
                          {t('driversManagement.form.lastName')}
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
                          {t('driversManagement.form.dni')}
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
                    <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">{t('driversManagement.section.licenseInfo')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('driversManagement.form.licenseNumber')}
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
                          {t('driversManagement.form.licenseCategory')}
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
                          {t('driversManagement.form.licenseExpiry')}
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
                  <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        resetForm();
                      }}
                      className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm sm:text-base w-full sm:w-auto"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm sm:text-base w-full sm:w-auto"
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