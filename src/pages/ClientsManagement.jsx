import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BuildingOfficeIcon,
  UserGroupIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  GiftIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { StarIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';
import agencyService from '../services/agencyService';
import pointsService from '../services/pointsService';
import toast from 'react-hot-toast';

const AGENCY_LEVELS = {
  BRONZE: 'bronze',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum'
};

const AGENCY_LEVEL_KEYS = {
  [AGENCY_LEVELS.BRONZE]: 'clientsManagement.levels.bronze',
  [AGENCY_LEVELS.SILVER]: 'clientsManagement.levels.silver',
  [AGENCY_LEVELS.GOLD]: 'clientsManagement.levels.gold',
  [AGENCY_LEVELS.PLATINUM]: 'clientsManagement.levels.platinum'
};

const AGENCY_VALIDATIONS = {
  NAME_MIN_LENGTH: 3,
  RUC_LENGTH: 11,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^9\d{8}$/
};

const AGENCY_MESSAGE_KEYS = {
  CREATE_SUCCESS: 'clientsManagement.messages.createSuccess',
  UPDATE_SUCCESS: 'clientsManagement.messages.updateSuccess',
  DELETE_SUCCESS: 'clientsManagement.messages.deleteSuccess',
  CREATE_ERROR: 'clientsManagement.messages.createError',
  UPDATE_ERROR: 'clientsManagement.messages.updateError',
  DELETE_ERROR: 'clientsManagement.messages.deleteError',
  LOAD_ERROR: 'clientsManagement.messages.loadError'
};

const ClientsManagement = () => {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [editingAgency, setEditingAgency] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState(null);
  const [formData, setFormData] = useState({
    businessName: '',
    ruc: '',
    email: '',
    phone: '',
    address: '',
    username: '',
    password: '',
    firstName: '',
    lastName: ''
  });
  const [errors, setErrors] = useState({});
  const [deleteModal, setDeleteModal] = useState({ show: false, agency: null });
  const [pointsModal, setPointsModal] = useState({ show: false, agency: null });
  const [pointsData, setPointsData] = useState({ amount: '', reason: '' });

  // Estado local para agencias (usando API real)
  const [agencies, setAgencies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFiltersState] = useState({
    level: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  });

  // Cargar agencias desde API real (API-031: GET /api/agencies)
  const loadAgencies = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...filters
      };

      // Agregar searchTerm si hay busqueda
      if (filters.search) {
        params.searchTerm = filters.search;
      }

      const result = await agencyService.getAgencies(params);

      if (result.success) {
        setAgencies(result.data || []);
        setPagination(prev => ({
          ...prev,
          total: result.total || 0,
          totalPages: Math.ceil((result.total || 0) / prev.pageSize)
        }));
      } else {
        console.error('Error loading agencies:', result.error);
        toast.error(t(AGENCY_MESSAGE_KEYS.LOAD_ERROR));
      }
    } catch (error) {
      console.error('Error loading agencies:', error);
      toast.error(t(AGENCY_MESSAGE_KEYS.LOAD_ERROR));
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.pageSize, filters]);

  // Cargar datos al montar y cuando cambien filtros/paginacion
  useEffect(() => {
    loadAgencies();
  }, [loadAgencies]);

  // Funciones de filtros
  const setFilters = (newFilters) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFiltersState({ level: '', search: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const setPage = (page) => {
    setPagination(prev => ({ ...prev, page }));
  };

  // Estadísticas con validacion defensiva
  const stats = {
    total: Array.isArray(agencies) ? agencies.length : 0,
    active: Array.isArray(agencies) ? agencies.filter(a => a.status === 'active').length : 0,
    verified: Array.isArray(agencies) ? agencies.filter(a => a.verified).length : 0
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    if (!formData.businessName || formData.businessName.length < AGENCY_VALIDATIONS.NAME_MIN_LENGTH) {
      newErrors.businessName = t('clientsManagement.validation.nameMinLength', { min: AGENCY_VALIDATIONS.NAME_MIN_LENGTH });
    }

    if (!formData.ruc) {
      newErrors.ruc = t('clientsManagement.validation.rucRequired');
    } else if (formData.ruc.length !== AGENCY_VALIDATIONS.RUC_LENGTH || !/^\d{11}$/.test(formData.ruc)) {
      newErrors.ruc = t('clientsManagement.validation.rucLength');
    }

    if (!formData.email || !AGENCY_VALIDATIONS.EMAIL_REGEX.test(formData.email)) {
      newErrors.email = t('clientsManagement.validation.emailInvalid');
    }

    if (formData.phone && !AGENCY_VALIDATIONS.PHONE_REGEX.test(formData.phone)) {
      newErrors.phone = t('clientsManagement.validation.phoneInvalid');
    }

    // Para creacion, username y password son requeridos
    if (!editingAgency) {
      if (!formData.username || formData.username.length < 3) {
        newErrors.username = t('clientsManagement.validation.usernameMin');
      }
      if (!formData.password || formData.password.length < 8) {
        newErrors.password = t('clientsManagement.validation.passwordMin');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Manejar envio del formulario (API-033: POST /api/agencies o API-034: PUT /api/agencies/:id)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      if (editingAgency) {
        // API-034: UpdateAgency
        const updateData = {
          businessName: formData.businessName,
          agencyEmail: formData.email,
          agencyPhone: formData.phone,
          agencyAddress: formData.address
        };
        const result = await agencyService.updateAgency(editingAgency.id, updateData);
        if (result.success) {
          toast.success(t(AGENCY_MESSAGE_KEYS.UPDATE_SUCCESS));
        } else {
          throw new Error(result.error || t(AGENCY_MESSAGE_KEYS.UPDATE_ERROR));
        }
      } else {
        // API-033: CreateAgency
        const createData = {
          businessName: formData.businessName,
          ruc: formData.ruc,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          username: formData.username,
          password: formData.password,
          firstName: formData.firstName || 'Admin',
          lastName: formData.lastName || formData.businessName
        };
        const result = await agencyService.createAgency(createData);
        if (result.success) {
          toast.success(t(AGENCY_MESSAGE_KEYS.CREATE_SUCCESS));
        } else {
          throw new Error(result.error || t(AGENCY_MESSAGE_KEYS.CREATE_ERROR));
        }
      }

      // Recargar los datos despues de guardar
      await loadAgencies();

      setShowForm(false);
      resetForm();
    } catch (error) {
      toast.error(error.message || (editingAgency ? t(AGENCY_MESSAGE_KEYS.UPDATE_ERROR) : t(AGENCY_MESSAGE_KEYS.CREATE_ERROR)));
    } finally {
      setIsLoading(false);
    }
  };

  // Resetear formulario
  const resetForm = () => {
    setFormData({
      businessName: '',
      ruc: '',
      email: '',
      phone: '',
      address: '',
      username: '',
      password: '',
      firstName: '',
      lastName: ''
    });
    setErrors({});
    setEditingAgency(null);
  };

  // Editar agencia
  const handleEdit = (agency) => {
    setEditingAgency(agency);
    setFormData({
      businessName: agency.businessName || agency.name || agency.company_name || '',
      ruc: agency.ruc || agency.tax_id || '',
      email: agency.agencyEmail || agency.email || agency.contact_email || '',
      phone: agency.agencyPhone || agency.phone || agency.contact_phone || '',
      address: agency.agencyAddress || agency.address || '',
      username: '',
      password: '',
      firstName: agency.user?.first_name || '',
      lastName: agency.user?.last_name || ''
    });
    setShowForm(true);
  };

  // Mostrar modal de confirmacion para eliminar
  const showDeleteConfirmModal = (agency) => {
    setDeleteModal({ show: true, agency });
  };

  // Confirmar eliminacion
  const confirmDelete = async () => {
    if (!deleteModal.agency) return;

    setIsLoading(true);
    try {
      const result = await agencyService.deleteAgency(deleteModal.agency.id);
      if (result.success) {
        toast.success(t(AGENCY_MESSAGE_KEYS.DELETE_SUCCESS));
        await loadAgencies();
      } else {
        throw new Error(result.error || t(AGENCY_MESSAGE_KEYS.DELETE_ERROR));
      }
      setDeleteModal({ show: false, agency: null });
    } catch (error) {
      toast.error(error.message || t(AGENCY_MESSAGE_KEYS.DELETE_ERROR));
    } finally {
      setIsLoading(false);
    }
  };

  // Ver detalles
  const handleViewDetails = (agency) => {
    setSelectedAgency(agency);
    setShowDetails(true);
  };

  // Alternar verificación de la agencia (sello del admin)
  const handleToggleVerified = async (agency) => {
    const nextVerified = !agency.verified;
    const agencyName = agency.businessName || agency.name;
    const confirmMsg = nextVerified
      ? t('clientsManagement.verification.confirmVerify', { name: agencyName })
      : t('clientsManagement.verification.confirmUnverify', { name: agencyName });
    if (!window.confirm(confirmMsg)) return;

    // Optimistic update para reflejar el cambio sin esperar al fetch
    setAgencies(prev => prev.map(a =>
      a.id === agency.id ? { ...a, verified: nextVerified } : a
    ));

    try {
      const result = await agencyService.setAgencyVerified(agency.id, nextVerified);
      if (!result.success) {
        throw new Error(result.error || t('clientsManagement.verification.updateError'));
      }
      toast.success(nextVerified ? t('clientsManagement.verification.verifiedToast') : t('clientsManagement.verification.unverifiedToast'));
    } catch (error) {
      // Revertir si falló
      setAgencies(prev => prev.map(a =>
        a.id === agency.id ? { ...a, verified: !nextVerified } : a
      ));
      toast.error(error.message || t('clientsManagement.verification.updateError'));
    }
  };

  // Manejar adicion de puntos (ELM-414: POST /api/agencies/:id/points)
  const handleAddPoints = async () => {
    const amount = parseInt(pointsData.amount);

    if (!amount || amount <= 0) {
      toast.error(t('clientsManagement.points.errorInvalidAmount'));
      return;
    }

    if (!pointsData.reason || pointsData.reason.trim() === '') {
      toast.error(t('clientsManagement.points.errorReasonRequired'));
      return;
    }

    setIsLoading(true);
    try {
      // Usar pointsService para agregar puntos - POST /api/agencies/:id/points
      // Backend espera: { points, reason } segun addPointsToAgency en pointsController.js
      const result = await pointsService.addPointsToAgency(pointsModal.agency.id, {
        points: amount,
        reason: pointsData.reason
      });

      if (result.success) {
        toast.success(t('clientsManagement.points.addedSuccess', { points: amount, name: pointsModal.agency.name || pointsModal.agency.businessName }));
        setPointsModal({ show: false, agency: null });
        setPointsData({ amount: '', reason: '' });
        await loadAgencies();
      } else {
        throw new Error(result.error || t('clientsManagement.points.errorAdding'));
      }
    } catch (error) {
      toast.error(error.message || t('clientsManagement.points.errorAdding'));
    } finally {
      setIsLoading(false);
    }
  };

  // Validar RUC al cambiar
  const handleRucChange = (value) => {
    // Solo permitir digitos
    const cleanValue = value.replace(/\D/g, '').slice(0, 11);
    setFormData({ ...formData, ruc: cleanValue });

    // Limpiar error si existe
    if (errors.ruc && cleanValue.length === 11) {
      setErrors(prev => ({ ...prev, ruc: undefined }));
    }
  };

  // Obtener color del estado
  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Obtener color del nivel
  const getLevelColor = (level) => {
    const colors = {
      [AGENCY_LEVELS.BRONZE]: 'bg-amber-100 text-amber-800',
      [AGENCY_LEVELS.SILVER]: 'bg-gray-200 text-gray-700',
      [AGENCY_LEVELS.GOLD]: 'bg-yellow-100 text-yellow-800',
      [AGENCY_LEVELS.PLATINUM]: 'bg-purple-100 text-purple-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading && agencies.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('clientsManagement.title')}</h1>
          <p className="text-sm sm:text-base text-gray-600">{t('clientsManagement.subtitle')}</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>{t('clientsManagement.newAgency')}</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">{t('clientsManagement.stats.totalAgencies')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">{t('clientsManagement.stats.active')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <BuildingOfficeIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">{t('clientsManagement.stats.verified')}</p>
              <p className="text-2xl font-bold text-gray-900">{stats.verified}</p>
            </div>
          </div>
        </div>

      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <FunnelIcon className="h-5 w-5 text-gray-400 hidden sm:block" />
            <select
              value={filters.level}
              onChange={(e) => setFilters({ level: e.target.value })}
              className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="">{t('clientsManagement.filters.allLevels')}</option>
              {Object.entries(AGENCY_LEVEL_KEYS).map(([value, labelKey]) => (
                <option key={value} value={value}>{t(labelKey)}</option>
              ))}
            </select>

            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 text-center sm:text-left"
            >
              {t('clientsManagement.filters.clearFilters')}
            </button>
          </div>

          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t('clientsManagement.filters.searchPlaceholder')}
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('clientsManagement.table.agency')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('clientsManagement.table.level')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('clientsManagement.table.contact')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('clientsManagement.table.points')}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('clientsManagement.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {Array.isArray(agencies) && agencies.length > 0 ? agencies.map((agency) => (
                <tr key={agency.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 flex items-center gap-1">
                        <span>{agency.businessName || agency.name || agency.company_name}</span>
                        {agency.verified && (
                          <CheckBadgeIcon
                            className="h-4 w-4 text-blue-500"
                            title={t('clientsManagement.actions.verifiedTitle')}
                          />
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        RUC: {agency.ruc || agency.tax_id || '-'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(agency.level)}`}>
                      {AGENCY_LEVEL_KEYS[agency.level] ? t(AGENCY_LEVEL_KEYS[agency.level]) : (agency.level || t('clientsManagement.levels.bronze'))}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="flex items-center text-gray-900">
                        <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {agency.agencyEmail || agency.contact_email || agency.email || '-'}
                      </div>
                      <div className="flex items-center text-gray-500">
                        <PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {agency.agencyPhone || agency.contact_phone || agency.phone || '-'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <StarIcon className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm text-gray-900 ml-1">
                        {(agency.available_points || agency.availablePoints || 0).toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => handleViewDetails(agency)}
                        className="text-blue-600 hover:text-blue-800"
                        title={t('clientsManagement.actions.viewDetails')}
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleToggleVerified(agency)}
                        className={agency.verified
                          ? 'text-blue-600 hover:text-gray-600'
                          : 'text-gray-400 hover:text-blue-600'}
                        title={agency.verified ? t('clientsManagement.actions.unverify') : t('clientsManagement.actions.verify')}
                      >
                        {agency.verified
                          ? <CheckBadgeIcon className="h-5 w-5" />
                          : <ShieldCheckIcon className="h-5 w-5" />}
                      </button>
                      <button
                        onClick={() => {
                          setPointsModal({ show: true, agency });
                          setPointsData({ amount: '', reason: '' });
                        }}
                        className="text-purple-600 hover:text-purple-800"
                        title={t('clientsManagement.actions.addPoints')}
                      >
                        <GiftIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(agency)}
                        className="text-yellow-600 hover:text-yellow-800"
                        title={t('clientsManagement.actions.edit')}
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => showDeleteConfirmModal(agency)}
                        className="text-red-600 hover:text-red-800"
                        title={t('clientsManagement.actions.delete')}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    {t('clientsManagement.noAgencies')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-700">
              {t('clientsManagement.pagination.showing', {
                from: ((pagination?.page || 1) - 1) * (pagination?.pageSize || 20) + 1,
                to: Math.min((pagination?.page || 1) * (pagination?.pageSize || 20), pagination?.total || 0),
                total: pagination?.total || 0
              })}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage((pagination?.page || 1) - 1)}
                disabled={(pagination?.page || 1) === 1}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                {t('clientsManagement.pagination.previous')}
              </button>
              <button
                onClick={() => setPage((pagination?.page || 1) + 1)}
                disabled={(pagination?.page || 1) === (pagination?.totalPages || 1)}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                {t('clientsManagement.pagination.next')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content p-4 sm:p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">
              {editingAgency ? t('clientsManagement.editAgency') : t('clientsManagement.newAgency')}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Datos basicos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('clientsManagement.form.businessName')}
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.businessName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={t('clientsManagement.form.businessNamePlaceholder')}
                  />
                  {errors.businessName && (
                    <p className="text-sm text-red-600 mt-1">{errors.businessName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('clientsManagement.form.ruc')}
                  </label>
                  <input
                    type="text"
                    value={formData.ruc}
                    onChange={(e) => handleRucChange(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.ruc ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="20123456789"
                    maxLength="11"
                    disabled={!!editingAgency}
                  />
                  {errors.ruc && (
                    <p className="text-sm text-red-600 mt-1">{errors.ruc}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('clientsManagement.form.agencyEmail')}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={t('clientsManagement.form.agencyEmailPlaceholder')}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('clientsManagement.form.phone')}
                  </label>
                  <input
                    type="tel"
                    placeholder="9XXXXXXXX"
                    maxLength="9"
                    value={formData.phone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      if (value === '' || (value[0] === '9' && value.length <= 9)) {
                        setFormData({ ...formData, phone: value });
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
                  )}
                </div>

              </div>

              {/* Dirección */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('clientsManagement.form.address')}
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('clientsManagement.form.addressPlaceholder')}
                />
              </div>

              {/* Datos de usuario (solo para creacion) */}
              {!editingAgency && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">{t('clientsManagement.form.systemAccessData')}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('clientsManagement.form.username')}
                      </label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.username ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder={t('clientsManagement.form.usernamePlaceholder')}
                      />
                      {errors.username && (
                        <p className="text-sm text-red-600 mt-1">{errors.username}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('clientsManagement.form.password')}
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.password ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder={t('clientsManagement.form.passwordPlaceholder')}
                      />
                      {errors.password && (
                        <p className="text-sm text-red-600 mt-1">{errors.password}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isLoading ? t('common.saving') : (editingAgency ? t('common.update') : t('common.create'))}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && selectedAgency && (
        <div className="modal-overlay">
          <div className="modal-content p-4 sm:p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                {t('clientsManagement.agencyDetails')}
              </h3>
              <button
                onClick={() => {
                  setShowDetails(false);
                  setSelectedAgency(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4 sm:space-y-6">
              {/* Info basica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">{t('clientsManagement.details.generalInfo')}</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">{t('clientsManagement.details.businessName')}</span>
                      <p className="font-medium">{selectedAgency.businessName || selectedAgency.name || selectedAgency.company_name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">{t('clientsManagement.details.ruc')}</span>
                      <p className="font-medium">{selectedAgency.ruc || selectedAgency.tax_id || '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">{t('clientsManagement.details.level')}</span>
                      <p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(selectedAgency.level)}`}>
                          {AGENCY_LEVEL_KEYS[selectedAgency.level] ? t(AGENCY_LEVEL_KEYS[selectedAgency.level]) : (selectedAgency.level || t('clientsManagement.levels.bronze'))}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">{t('clientsManagement.details.status')}</span>
                      <p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedAgency.status)}`}>
                          {selectedAgency.status === 'active' ? t('clientsManagement.statusLabels.active')
                            : selectedAgency.status === 'inactive' ? t('clientsManagement.statusLabels.inactive')
                            : selectedAgency.status === 'suspended' ? t('clientsManagement.statusLabels.suspended')
                            : selectedAgency.status === 'pending' ? t('clientsManagement.statusLabels.pending')
                            : t('clientsManagement.statusLabels.active')}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">{t('clientsManagement.details.contact')}</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{selectedAgency.agencyEmail || selectedAgency.contact_email || selectedAgency.email || '-'}</span>
                    </div>
                    <div className="flex items-center">
                      <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{selectedAgency.agencyPhone || selectedAgency.contact_phone || selectedAgency.phone || '-'}</span>
                    </div>
                    {(selectedAgency.agencyAddress || selectedAgency.address) && (
                      <div className="flex items-start">
                        <MapPinIcon className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                        <span>{selectedAgency.agencyAddress || selectedAgency.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Estadísticas */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">{t('clientsManagement.details.statistics')}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">{t('clientsManagement.details.totalReservations')}</p>
                    <p className="text-lg font-semibold">{selectedAgency.total_reservations || selectedAgency.totalBookings || 0}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">{t('clientsManagement.details.totalRevenue')}</p>
                    <p className="text-lg font-semibold">
                      S/ {(selectedAgency.total_revenue || selectedAgency.totalRevenue || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">{t('clientsManagement.details.currentPoints')}</p>
                    <p className="text-lg font-semibold text-purple-600">
                      <StarIcon className="h-4 w-4 inline mr-1 text-yellow-500" />
                      {(selectedAgency.available_points || selectedAgency.availablePoints || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">{t('clientsManagement.details.totalPoints')}</p>
                    <p className="text-lg font-semibold text-purple-600">
                      {(selectedAgency.total_points || selectedAgency.totalPoints || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Fechas */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm text-gray-500 pt-4 border-t">
                <span>{t('clientsManagement.details.agencySince')} {selectedAgency.created_at || selectedAgency.createdAt ? new Date(selectedAgency.created_at || selectedAgency.createdAt).toLocaleDateString() : '-'}</span>
                <span>{t('clientsManagement.details.lastUpdate')} {selectedAgency.updated_at || selectedAgency.updatedAt ? new Date(selectedAgency.updated_at || selectedAgency.updatedAt).toLocaleDateString() : '-'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && deleteModal.agency && (
        <div className="modal-overlay">
          <div className="modal-content p-4 sm:p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">{t('clientsManagement.delete.title')}</h3>
              </div>
              <button
                onClick={() => setDeleteModal({ show: false, agency: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            <p className="text-sm sm:text-base text-gray-600 mb-6">
              {t('clientsManagement.delete.confirmText', { name: deleteModal.agency.businessName || deleteModal.agency.name })}{' '}
              {t('clientsManagement.delete.irreversible')}
            </p>

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, agency: null })}
                className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={confirmDelete}
                disabled={isLoading}
                className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300"
              >
                {isLoading ? t('clientsManagement.delete.deleting') : t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Points Modal */}
      {pointsModal.show && pointsModal.agency && (
        <div className="modal-overlay">
          <div className="modal-content p-4 sm:p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <GiftIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">{t('clientsManagement.points.title')}</h3>
              </div>
              <button
                onClick={() => {
                  setPointsModal({ show: false, agency: null });
                  setPointsData({ amount: '', reason: '' });
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                {t('clientsManagement.points.addingTo', { name: pointsModal.agency.businessName || pointsModal.agency.name })}
              </p>
              <p className="text-sm text-gray-500">
                {t('clientsManagement.points.currentBalance')} <span className="font-medium text-purple-600">
                  <StarIcon className="h-3 w-3 inline mr-1 text-yellow-500" />
                  {(pointsModal.agency.available_points || pointsModal.agency.availablePoints || 0).toLocaleString()} {t('clientsManagement.points.pointsLabel')}
                </span>
              </p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleAddPoints();
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('clientsManagement.points.amount')}
                </label>
                <input
                  type="number"
                  value={pointsData.amount}
                  onChange={(e) => setPointsData({ ...pointsData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder={t('clientsManagement.points.amountPlaceholder')}
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('clientsManagement.points.reason')}
                </label>
                <textarea
                  value={pointsData.reason}
                  onChange={(e) => setPointsData({ ...pointsData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder={t('clientsManagement.points.reasonPlaceholder')}
                  rows="3"
                  required
                />
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-blue-800">
                      {t('clientsManagement.points.infoText')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setPointsModal({ show: false, agency: null });
                    setPointsData({ amount: '', reason: '' });
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300"
                >
                  {isLoading ? t('clientsManagement.points.adding') : t('clientsManagement.points.addPointsBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsManagement;