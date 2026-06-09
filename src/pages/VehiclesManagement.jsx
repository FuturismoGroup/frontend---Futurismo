import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TruckIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentTextIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import useVehiclesStore from '../stores/vehiclesStore';
import { 
  VEHICLE_DOCUMENTS,
  VEHICLE_DOCUMENT_LABELS
} from '../constants/vehiclesConstants';
import toast from 'react-hot-toast';

const VehiclesManagement = () => {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Helper para formatear fechas sin problemas de timezone
  const formatDateLocal = (dateString) => {
    if (!dateString) return t('vehiclesManagement.noRegistered');

    // Si la fecha viene en formato ISO, extraer solo la parte de la fecha
    const datePart = dateString.split('T')[0];
    const [year, month, day] = datePart.split('-');

    // Crear fecha en zona local sin conversión UTC
    return new Date(year, month - 1, day).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };
  
  const [formData, setFormData] = useState({
    plate: '',
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    capacity: ''
  });

  const [documentFormData, setDocumentFormData] = useState({
    [VEHICLE_DOCUMENTS.SOAT]: { number: '', expiry: '' },
    [VEHICLE_DOCUMENTS.TECHNICAL_REVIEW]: { number: '', expiry: '' }
  });
  
  const [errors, setErrors] = useState({});

  // Store
  const {
    vehicles,
    loading,
    filters,
    fetchVehicles,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    setFilters
  } = useVehiclesStore();

  // Cargar datos al montar
  useEffect(() => {
    fetchVehicles();
  }, []);

  // Recargar cuando cambien filtros
  useEffect(() => {
    fetchVehicles();
  }, [filters]);

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    if (!formData.plate || formData.plate.length < 6) {
      newErrors.plate = t('vehiclesManagement.errors.plateRequired');
    } else if (!/^[A-Z0-9]{3}-?[A-Z0-9]{3}$/.test(formData.plate)) {
      newErrors.plate = t('vehiclesManagement.errors.plateInvalid');
    }

    if (!formData.brand) {
      newErrors.brand = t('vehiclesManagement.errors.brandRequired');
    }

    if (!formData.model) {
      newErrors.model = t('vehiclesManagement.errors.modelRequired');
    }

    const capacityNum = parseInt(formData.capacity, 10);
    if (!formData.capacity || isNaN(capacityNum) || capacityNum < 1) {
      newErrors.capacity = t('vehiclesManagement.errors.capacityRequired');
    } else if (capacityNum > 100) {
      newErrors.capacity = t('vehiclesManagement.errors.capacityMax');
    }

    // Validar documentos
    if (!documentFormData[VEHICLE_DOCUMENTS.SOAT].expiry) {
      newErrors.soatExpiry = t('vehiclesManagement.errors.soatExpiryRequired');
    }

    if (!documentFormData[VEHICLE_DOCUMENTS.TECHNICAL_REVIEW].expiry) {
      newErrors.technicalExpiry = t('vehiclesManagement.errors.techExpiryRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error(t('vehiclesManagement.errors.fixFormErrors'));
      return;
    }

    try {
      // Preparar datos con documentos
      const vehicleData = {
        ...formData,
        capacity: parseInt(formData.capacity, 10),
        documents: documentFormData
      };

      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, vehicleData);
      } else {
        await createVehicle(vehicleData);
      }

      setShowForm(false);
      resetForm();
    } catch (error) {
      console.error('Error al guardar vehículo:', error);
    }
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      plate: '',
      brand: '',
      model: '',
      year: new Date().getFullYear(),
      capacity: ''
    });
    setDocumentFormData({
      [VEHICLE_DOCUMENTS.SOAT]: { number: '', expiry: '' },
      [VEHICLE_DOCUMENTS.TECHNICAL_REVIEW]: { number: '', expiry: '' }
    });
    setErrors({});
    setEditingVehicle(null);
  };

  // Manejar edición
  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      plate: vehicle.plate,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      capacity: vehicle.capacity ?? ''
    });
    
    // Preparar documentos
    const docs = {};
    docs[VEHICLE_DOCUMENTS.SOAT] = vehicle.documents?.[VEHICLE_DOCUMENTS.SOAT] || { number: '', expiry: '' };
    docs[VEHICLE_DOCUMENTS.TECHNICAL_REVIEW] = vehicle.documents?.[VEHICLE_DOCUMENTS.TECHNICAL_REVIEW] || { number: '', expiry: '' };
    
    if (docs[VEHICLE_DOCUMENTS.SOAT].expiry) {
      docs[VEHICLE_DOCUMENTS.SOAT].expiry = docs[VEHICLE_DOCUMENTS.SOAT].expiry.split('T')[0];
    }
    if (docs[VEHICLE_DOCUMENTS.TECHNICAL_REVIEW].expiry) {
      docs[VEHICLE_DOCUMENTS.TECHNICAL_REVIEW].expiry = docs[VEHICLE_DOCUMENTS.TECHNICAL_REVIEW].expiry.split('T')[0];
    }
    
    setDocumentFormData(docs);
    setShowForm(true);
  };

  // Manejar eliminación
  const handleDelete = async (vehicle) => {
    if (window.confirm(t('vehiclesManagement.confirmDelete', { plate: vehicle.plate }))) {
      await deleteVehicle(vehicle.id);
    }
  };

  // Ver detalles
  const handleViewDetails = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDetails(true);
  };

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <TruckIcon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-blue-600 flex-shrink-0" />
              <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 truncate">{t('vehiclesManagement.title')}</h1>
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
              className="bg-blue-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg hover:bg-blue-700 flex items-center justify-center text-sm sm:text-base whitespace-nowrap flex-shrink-0"
            >
              <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
              <span>{t('vehiclesManagement.newVehicle')}</span>
            </button>
          </div>
        </div>

        {/* Búsqueda */}
        <div className="bg-white rounded-lg shadow mb-4 sm:mb-6 p-3 sm:p-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder={t('vehiclesManagement.searchPlaceholder')}
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
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
          ) : vehicles.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500 text-sm">
              {t('vehiclesManagement.notFound')}
            </div>
          ) : (
            vehicles.map((vehicle) => {
              const soat = vehicle.documents?.[VEHICLE_DOCUMENTS.SOAT];
              const rev = vehicle.documents?.[VEHICLE_DOCUMENTS.TECHNICAL_REVIEW];
              return (
                <div key={vehicle.id} className="bg-white rounded-lg shadow border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold text-gray-900 tracking-wide">{vehicle.plate}</p>
                      <p className="text-sm text-gray-700 mt-0.5 truncate">{vehicle.brand} {vehicle.model}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{t('vehiclesManagement.yearLabel', { year: vehicle.year })}{vehicle.capacity != null && ` · ${t('vehiclesManagement.capacityPax', { count: vehicle.capacity })}`}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleViewDetails(vehicle)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
                        title={t('vehiclesManagement.actions.viewDetails')}
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(vehicle)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
                        title={t('vehiclesManagement.actions.edit')}
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(vehicle)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
                        title={t('vehiclesManagement.actions.delete')}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm border-t border-gray-100 pt-3">
                    <div>
                      <p className="text-gray-500">{t('vehiclesManagement.soat')}</p>
                      {soat ? (
                        <>
                          <p className="text-gray-900 font-medium truncate">{soat.number || 'N/A'}</p>
                          <p className="text-xs text-gray-500">{t('vehiclesManagement.expires')}: {formatDateLocal(soat.expiry)}</p>
                        </>
                      ) : (
                        <p className="text-gray-400">{t('vehiclesManagement.noRegistered')}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-500">{t('vehiclesManagement.technicalReview')}</p>
                      {rev ? (
                        <>
                          <p className="text-gray-900 font-medium truncate">{rev.number || 'N/A'}</p>
                          <p className="text-xs text-gray-500">{t('vehiclesManagement.expires')}: {formatDateLocal(rev.expiry)}</p>
                        </>
                      ) : (
                        <p className="text-gray-400">{t('vehiclesManagement.noRegistered')}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Lista de vehículos - Desktop tabla */}
        <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('vehiclesManagement.table.plate')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('vehiclesManagement.table.vehicle')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('vehiclesManagement.table.soat')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('vehiclesManagement.table.technicalReview')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('vehiclesManagement.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : vehicles.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      {t('vehiclesManagement.notFound')}
                    </td>
                  </tr>
                ) : (
                  vehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {vehicle.plate}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {vehicle.brand} {vehicle.model}
                        </div>
                        <div className="text-sm text-gray-500">
                          {t('vehiclesManagement.yearColon')} {vehicle.year} {vehicle.capacity != null && `· ${t('vehiclesManagement.capacityColon')} ${t('vehiclesManagement.capacityPax', { count: vehicle.capacity })}`}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {vehicle.documents?.[VEHICLE_DOCUMENTS.SOAT] ? (
                          <div>
                            <div className="text-sm text-gray-900">
                              {vehicle.documents[VEHICLE_DOCUMENTS.SOAT].number || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {t('vehiclesManagement.expires')}: {formatDateLocal(vehicle.documents[VEHICLE_DOCUMENTS.SOAT].expiry)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">{t('vehiclesManagement.noRegistered')}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {vehicle.documents?.[VEHICLE_DOCUMENTS.TECHNICAL_REVIEW] ? (
                          <div>
                            <div className="text-sm text-gray-900">
                              {vehicle.documents[VEHICLE_DOCUMENTS.TECHNICAL_REVIEW].number || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {t('vehiclesManagement.expires')}: {formatDateLocal(vehicle.documents[VEHICLE_DOCUMENTS.TECHNICAL_REVIEW].expiry)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">{t('vehiclesManagement.noRegistered')}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleViewDetails(vehicle)}
                            className="text-blue-600 hover:text-blue-900"
                            title={t('vehiclesManagement.actions.viewDetails')}
                          >
                            <EyeIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleEdit(vehicle)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title={t('vehiclesManagement.actions.edit')}
                          >
                            <PencilIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(vehicle)}
                            className="text-red-600 hover:text-red-900"
                            title={t('vehiclesManagement.actions.delete')}
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
          <div className="fixed inset-0 bg-gray-900/70 flex items-center justify-center p-0 sm:p-4 z-50">
            <div className="bg-white sm:rounded-xl max-w-md w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto flex flex-col">
              <div className="flex items-center justify-between p-4 sm:p-6 border-b sticky top-0 bg-white z-10">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                  {editingVehicle ? t('vehiclesManagement.editVehicle') : t('vehiclesManagement.newVehicle')}
                </h2>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); resetForm(); }}
                  className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg min-h-[40px] min-w-[40px] flex items-center justify-center"
                  aria-label={t('vehiclesManagement.actions.close')}
                >
                  <XCircleIcon className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 sm:p-6 flex-1">

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Información del Vehículo */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('vehiclesManagement.form.plate')}
                      </label>
                      <input
                        type="text"
                        value={formData.plate}
                        onChange={(e) => {
                          // Solo permitir letras, números y guión
                          const cleaned = e.target.value.replace(/[^A-Za-z0-9-]/g, '').toUpperCase();
                          setFormData({ ...formData, plate: cleaned });
                        }}
                        onKeyPress={(e) => {
                          // Bloquear caracteres no permitidos
                          if (!/[A-Za-z0-9-]/.test(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const pastedText = e.clipboardData.getData('text');
                          const cleaned = pastedText.replace(/[^A-Za-z0-9-]/g, '').toUpperCase();
                          setFormData({ ...formData, plate: cleaned });
                        }}
                        maxLength={7}
                        placeholder="ABC-123"
                        className={`w-full border rounded-lg px-3 py-2 ${errors.plate ? 'border-red-500' : ''}`}
                      />
                      {errors.plate && <p className="text-red-500 text-sm mt-1">{errors.plate}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('vehiclesManagement.form.brand')}
                      </label>
                      <input
                        type="text"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        className={`w-full border rounded-lg px-3 py-2 ${errors.brand ? 'border-red-500' : ''}`}
                      />
                      {errors.brand && <p className="text-red-500 text-sm mt-1">{errors.brand}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('vehiclesManagement.form.model')}
                      </label>
                      <input
                        type="text"
                        value={formData.model}
                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                        className={`w-full border rounded-lg px-3 py-2 ${errors.model ? 'border-red-500' : ''}`}
                      />
                      {errors.model && <p className="text-red-500 text-sm mt-1">{errors.model}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('vehiclesManagement.form.year')}
                      </label>
                      <input
                        type="number"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                        min={2000}
                        max={new Date().getFullYear() + 1}
                        className="w-full border rounded-lg px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('vehiclesManagement.form.maxCapacity')}
                      </label>
                      <input
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                        min={1}
                        max={100}
                        placeholder={t('vehiclesManagement.form.capacityPlaceholder')}
                        className={`w-full border rounded-lg px-3 py-2 ${errors.capacity ? 'border-red-500' : ''}`}
                      />
                      {errors.capacity && <p className="text-red-500 text-sm mt-1">{errors.capacity}</p>}
                    </div>
                  </div>

                  {/* Documentos */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">{t('vehiclesManagement.documents')}</h3>
                    <div className="space-y-4">
                      {/* SOAT */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('vehiclesManagement.form.soatNumber')}
                        </label>
                        <input
                          type="text"
                          value={documentFormData[VEHICLE_DOCUMENTS.SOAT].number}
                          onChange={(e) => setDocumentFormData({
                            ...documentFormData,
                            [VEHICLE_DOCUMENTS.SOAT]: {
                              ...documentFormData[VEHICLE_DOCUMENTS.SOAT],
                              number: e.target.value
                            }
                          })}
                          className="w-full border rounded-lg px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('vehiclesManagement.form.soatExpiry')}
                        </label>
                        <input
                          type="date"
                          value={documentFormData[VEHICLE_DOCUMENTS.SOAT].expiry}
                          onChange={(e) => setDocumentFormData({
                            ...documentFormData,
                            [VEHICLE_DOCUMENTS.SOAT]: {
                              ...documentFormData[VEHICLE_DOCUMENTS.SOAT],
                              expiry: e.target.value
                            }
                          })}
                          className={`w-full border rounded-lg px-3 py-2 ${errors.soatExpiry ? 'border-red-500' : ''}`}
                        />
                        {errors.soatExpiry && <p className="text-red-500 text-sm mt-1">{errors.soatExpiry}</p>}
                      </div>

                      {/* Revisión Técnica */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('vehiclesManagement.form.techNumber')}
                        </label>
                        <input
                          type="text"
                          value={documentFormData[VEHICLE_DOCUMENTS.TECHNICAL_REVIEW].number}
                          onChange={(e) => setDocumentFormData({
                            ...documentFormData,
                            [VEHICLE_DOCUMENTS.TECHNICAL_REVIEW]: {
                              ...documentFormData[VEHICLE_DOCUMENTS.TECHNICAL_REVIEW],
                              number: e.target.value
                            }
                          })}
                          className="w-full border rounded-lg px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {t('vehiclesManagement.form.techExpiry')}
                        </label>
                        <input
                          type="date"
                          value={documentFormData[VEHICLE_DOCUMENTS.TECHNICAL_REVIEW].expiry}
                          onChange={(e) => setDocumentFormData({
                            ...documentFormData,
                            [VEHICLE_DOCUMENTS.TECHNICAL_REVIEW]: {
                              ...documentFormData[VEHICLE_DOCUMENTS.TECHNICAL_REVIEW],
                              expiry: e.target.value
                            }
                          })}
                          className={`w-full border rounded-lg px-3 py-2 ${errors.technicalExpiry ? 'border-red-500' : ''}`}
                        />
                        {errors.technicalExpiry && <p className="text-red-500 text-sm mt-1">{errors.technicalExpiry}</p>}
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
                      {loading ? t('common.saving') : (editingVehicle ? t('common.update') : t('common.create'))}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal de detalles */}
        {showDetails && selectedVehicle && (
          <div className="fixed inset-0 bg-gray-900/70 flex items-center justify-center p-0 sm:p-4 z-50">
            <div className="bg-white sm:rounded-xl max-w-md w-full h-full sm:h-auto sm:max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">{t('vehiclesManagement.details.title')}</h2>
                  <button
                    onClick={() => {
                      setShowDetails(false);
                      setSelectedVehicle(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Información del vehículo */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium mb-2">{t('vehiclesManagement.details.generalInfo')}</h3>
                    <dl className="space-y-2">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">{t('vehiclesManagement.details.plate')}</dt>
                        <dd className="text-sm text-gray-900 font-bold">{selectedVehicle.plate}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">{t('vehiclesManagement.details.vehicle')}</dt>
                        <dd className="text-sm text-gray-900">{selectedVehicle.brand} {selectedVehicle.model}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">{t('vehiclesManagement.details.year')}</dt>
                        <dd className="text-sm text-gray-900">{selectedVehicle.year}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">{t('vehiclesManagement.details.maxCapacity')}</dt>
                        <dd className="text-sm text-gray-900">
                          {selectedVehicle.capacity != null ? t('vehiclesManagement.passengersDetail', { count: selectedVehicle.capacity }) : t('vehiclesManagement.noRegisteredFem')}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">{t('vehiclesManagement.documents')}</h3>
                    <dl className="space-y-3">
                      {selectedVehicle.documents?.[VEHICLE_DOCUMENTS.SOAT] && (
                        <div className="border-l-4 border-blue-500 pl-3">
                          <dt className="text-sm font-medium text-gray-700">{t('vehiclesManagement.soat')}</dt>
                          <dd className="text-sm text-gray-600">
                            {t('vehiclesManagement.details.numberLabel')} {selectedVehicle.documents[VEHICLE_DOCUMENTS.SOAT].number || 'N/A'}
                          </dd>
                          <dd className="text-sm text-gray-600">
                            {t('vehiclesManagement.details.expiresLabel')} {formatDateLocal(selectedVehicle.documents[VEHICLE_DOCUMENTS.SOAT].expiry)}
                          </dd>
                        </div>
                      )}

                      {selectedVehicle.documents?.[VEHICLE_DOCUMENTS.TECHNICAL_REVIEW] && (
                        <div className="border-l-4 border-green-500 pl-3">
                          <dt className="text-sm font-medium text-gray-700">{t('vehiclesManagement.technicalReview')}</dt>
                          <dd className="text-sm text-gray-600">
                            {t('vehiclesManagement.details.numberLabel')} {selectedVehicle.documents[VEHICLE_DOCUMENTS.TECHNICAL_REVIEW].number || 'N/A'}
                          </dd>
                          <dd className="text-sm text-gray-600">
                            {t('vehiclesManagement.details.expiresLabel')} {formatDateLocal(selectedVehicle.documents[VEHICLE_DOCUMENTS.TECHNICAL_REVIEW].expiry)}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehiclesManagement;