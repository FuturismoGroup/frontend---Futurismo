import React, { useState, useEffect, useCallback } from 'react';
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

const AGENCY_LEVEL_LABELS = {
  [AGENCY_LEVELS.BRONZE]: 'Bronce',
  [AGENCY_LEVELS.SILVER]: 'Plata',
  [AGENCY_LEVELS.GOLD]: 'Oro',
  [AGENCY_LEVELS.PLATINUM]: 'Platino'
};

const AGENCY_VALIDATIONS = {
  NAME_MIN_LENGTH: 3,
  RUC_LENGTH: 11,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^9\d{8}$/
};

const AGENCY_MESSAGES = {
  CREATE_SUCCESS: 'Agencia creada exitosamente',
  UPDATE_SUCCESS: 'Agencia actualizada exitosamente',
  DELETE_SUCCESS: 'Agencia eliminada exitosamente',
  CREATE_ERROR: 'Error al crear agencia',
  UPDATE_ERROR: 'Error al actualizar agencia',
  DELETE_ERROR: 'Error al eliminar agencia',
  LOAD_ERROR: 'Error al cargar agencias'
};

const ClientsManagement = () => {
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
        toast.error(AGENCY_MESSAGES.LOAD_ERROR);
      }
    } catch (error) {
      console.error('Error loading agencies:', error);
      toast.error(AGENCY_MESSAGES.LOAD_ERROR);
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

  // Estadisticas con validacion defensiva
  const stats = {
    total: Array.isArray(agencies) ? agencies.length : 0,
    active: Array.isArray(agencies) ? agencies.filter(a => a.status === 'active').length : 0,
    verified: Array.isArray(agencies) ? agencies.filter(a => a.verified).length : 0
  };

  // Validar formulario
  const validateForm = () => {
    const newErrors = {};

    if (!formData.businessName || formData.businessName.length < AGENCY_VALIDATIONS.NAME_MIN_LENGTH) {
      newErrors.businessName = `El nombre debe tener al menos ${AGENCY_VALIDATIONS.NAME_MIN_LENGTH} caracteres`;
    }

    if (!formData.ruc) {
      newErrors.ruc = 'El RUC es requerido';
    } else if (formData.ruc.length !== AGENCY_VALIDATIONS.RUC_LENGTH || !/^\d{11}$/.test(formData.ruc)) {
      newErrors.ruc = 'El RUC debe tener 11 digitos';
    }

    if (!formData.email || !AGENCY_VALIDATIONS.EMAIL_REGEX.test(formData.email)) {
      newErrors.email = 'Ingrese un email valido';
    }

    if (formData.phone && !AGENCY_VALIDATIONS.PHONE_REGEX.test(formData.phone)) {
      newErrors.phone = 'El telefono debe tener 9 digitos y empezar con 9';
    }

    // Para creacion, username y password son requeridos
    if (!editingAgency) {
      if (!formData.username || formData.username.length < 3) {
        newErrors.username = 'El usuario debe tener al menos 3 caracteres';
      }
      if (!formData.password || formData.password.length < 8) {
        newErrors.password = 'La contrasena debe tener al menos 8 caracteres';
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
          toast.success(AGENCY_MESSAGES.UPDATE_SUCCESS);
        } else {
          throw new Error(result.error || AGENCY_MESSAGES.UPDATE_ERROR);
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
          toast.success(AGENCY_MESSAGES.CREATE_SUCCESS);
        } else {
          throw new Error(result.error || AGENCY_MESSAGES.CREATE_ERROR);
        }
      }

      // Recargar los datos despues de guardar
      await loadAgencies();

      setShowForm(false);
      resetForm();
    } catch (error) {
      toast.error(error.message || (editingAgency ? AGENCY_MESSAGES.UPDATE_ERROR : AGENCY_MESSAGES.CREATE_ERROR));
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
        toast.success(AGENCY_MESSAGES.DELETE_SUCCESS);
        await loadAgencies();
      } else {
        throw new Error(result.error || AGENCY_MESSAGES.DELETE_ERROR);
      }
      setDeleteModal({ show: false, agency: null });
    } catch (error) {
      toast.error(error.message || AGENCY_MESSAGES.DELETE_ERROR);
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
    const confirmMsg = nextVerified
      ? `¿Marcar a "${agency.businessName || agency.name}" como verificada?`
      : `¿Quitar la verificación a "${agency.businessName || agency.name}"?`;
    if (!window.confirm(confirmMsg)) return;

    // Optimistic update para reflejar el cambio sin esperar al fetch
    setAgencies(prev => prev.map(a =>
      a.id === agency.id ? { ...a, verified: nextVerified } : a
    ));

    try {
      const result = await agencyService.setAgencyVerified(agency.id, nextVerified);
      if (!result.success) {
        throw new Error(result.error || 'Error al actualizar verificación');
      }
      toast.success(nextVerified ? 'Agencia verificada' : 'Verificación retirada');
    } catch (error) {
      // Revertir si falló
      setAgencies(prev => prev.map(a =>
        a.id === agency.id ? { ...a, verified: !nextVerified } : a
      ));
      toast.error(error.message || 'Error al actualizar verificación');
    }
  };

  // Manejar adicion de puntos (ELM-414: POST /api/agencies/:id/points)
  const handleAddPoints = async () => {
    const amount = parseInt(pointsData.amount);

    if (!amount || amount <= 0) {
      toast.error('Ingrese una cantidad valida de puntos');
      return;
    }

    if (!pointsData.reason || pointsData.reason.trim() === '') {
      toast.error('Ingrese un motivo para agregar puntos');
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
        toast.success(`Se agregaron ${amount} puntos a ${pointsModal.agency.name || pointsModal.agency.businessName}`);
        setPointsModal({ show: false, agency: null });
        setPointsData({ amount: '', reason: '' });
        await loadAgencies();
      } else {
        throw new Error(result.error || 'Error al agregar puntos');
      }
    } catch (error) {
      toast.error(error.message || 'Error al agregar puntos');
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
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Gestión de Agencias</h1>
          <p className="text-sm sm:text-base text-gray-600">Administra agencias y empresas</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Nueva Agencia</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Agencias</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Activos</p>
              <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <BuildingOfficeIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Verificadas</p>
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
              <option value="">Todos los niveles</option>
              {Object.entries(AGENCY_LEVEL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 text-center sm:text-left"
            >
              Limpiar filtros
            </button>
          </div>

          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nombre o RUC..."
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
                  Agencia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nivel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Puntos
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
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
                            title="Agencia verificada"
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
                      {AGENCY_LEVEL_LABELS[agency.level] || agency.level || 'Bronce'}
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
                        title="Ver detalles"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleToggleVerified(agency)}
                        className={agency.verified
                          ? 'text-blue-600 hover:text-gray-600'
                          : 'text-gray-400 hover:text-blue-600'}
                        title={agency.verified ? 'Quitar verificación' : 'Verificar agencia'}
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
                        title="Agregar puntos"
                      >
                        <GiftIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(agency)}
                        className="text-yellow-600 hover:text-yellow-800"
                        title="Editar"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => showDeleteConfirmModal(agency)}
                        className="text-red-600 hover:text-red-800"
                        title="Eliminar"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No hay agencias disponibles
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
              Mostrando {((pagination?.page || 1) - 1) * (pagination?.pageSize || 20) + 1} a{' '}
              {Math.min((pagination?.page || 1) * (pagination?.pageSize || 20), pagination?.total || 0)} de{' '}
              {pagination?.total || 0} resultados
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage((pagination?.page || 1) - 1)}
                disabled={(pagination?.page || 1) === 1}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((pagination?.page || 1) + 1)}
                disabled={(pagination?.page || 1) === (pagination?.totalPages || 1)}
                className="px-3 py-1 border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Siguiente
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
              {editingAgency ? 'Editar Agencia' : 'Nueva Agencia'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Datos basicos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Razon Social / Nombre Comercial *
                  </label>
                  <input
                    type="text"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.businessName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Ej: Turismo Peru SAC"
                  />
                  {errors.businessName && (
                    <p className="text-sm text-red-600 mt-1">{errors.businessName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RUC *
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
                    Email de la Agencia *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="contacto@agencia.com"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600 mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefono
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

              {/* Direccion */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Direccion
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Av. Principal 123, Lima"
                />
              </div>

              {/* Datos de usuario (solo para creacion) */}
              {!editingAgency && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Datos de acceso al sistema</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Usuario *
                      </label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.username ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="usuario_agencia"
                      />
                      {errors.username && (
                        <p className="text-sm text-red-600 mt-1">{errors.username}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contrasena *
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          errors.password ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Minimo 8 caracteres"
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
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Guardando...' : (editingAgency ? 'Actualizar' : 'Crear')}
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
                Detalles de la Agencia
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
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Informacion General</h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-600">Razon Social:</span>
                      <p className="font-medium">{selectedAgency.businessName || selectedAgency.name || selectedAgency.company_name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">RUC:</span>
                      <p className="font-medium">{selectedAgency.ruc || selectedAgency.tax_id || '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Nivel:</span>
                      <p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(selectedAgency.level)}`}>
                          {AGENCY_LEVEL_LABELS[selectedAgency.level] || selectedAgency.level || 'Bronce'}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600">Estado:</span>
                      <p>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedAgency.status)}`}>
                          {selectedAgency.status === 'active' ? 'Activo' : selectedAgency.status === 'inactive' ? 'Inactivo' : selectedAgency.status === 'suspended' ? 'Suspendido' : selectedAgency.status === 'pending' ? 'Pendiente' : 'Activo'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Contacto</h4>
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

              {/* Estadisticas */}
              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">Estadisticas</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Total Reservas</p>
                    <p className="text-lg font-semibold">{selectedAgency.total_reservations || selectedAgency.totalBookings || 0}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Ingresos Totales</p>
                    <p className="text-lg font-semibold">
                      S/ {(selectedAgency.total_revenue || selectedAgency.totalRevenue || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Puntos Actuales</p>
                    <p className="text-lg font-semibold text-purple-600">
                      <StarIcon className="h-4 w-4 inline mr-1 text-yellow-500" />
                      {(selectedAgency.available_points || selectedAgency.availablePoints || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600">Puntos Totales</p>
                    <p className="text-lg font-semibold text-purple-600">
                      {(selectedAgency.total_points || selectedAgency.totalPoints || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Fechas */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm text-gray-500 pt-4 border-t">
                <span>Agencia desde: {selectedAgency.created_at || selectedAgency.createdAt ? new Date(selectedAgency.created_at || selectedAgency.createdAt).toLocaleDateString() : '-'}</span>
                <span>Ultima actualizacion: {selectedAgency.updated_at || selectedAgency.updatedAt ? new Date(selectedAgency.updated_at || selectedAgency.updatedAt).toLocaleDateString() : '-'}</span>
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
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Confirmar Eliminacion</h3>
              </div>
              <button
                onClick={() => setDeleteModal({ show: false, agency: null })}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            <p className="text-sm sm:text-base text-gray-600 mb-6">
              Esta seguro de que desea eliminar a <span className="font-semibold">{deleteModal.agency.businessName || deleteModal.agency.name}</span>?
              Esta accion no se puede deshacer.
            </p>

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={() => setDeleteModal({ show: false, agency: null })}
                className="w-full sm:w-auto px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                disabled={isLoading}
                className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-300"
              >
                {isLoading ? 'Eliminando...' : 'Eliminar'}
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
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Agregar Puntos</h3>
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
                Agregando puntos a: <span className="font-semibold">{pointsModal.agency.businessName || pointsModal.agency.name}</span>
              </p>
              <p className="text-sm text-gray-500">
                Balance actual: <span className="font-medium text-purple-600">
                  <StarIcon className="h-3 w-3 inline mr-1 text-yellow-500" />
                  {(pointsModal.agency.available_points || pointsModal.agency.availablePoints || 0).toLocaleString()} puntos
                </span>
              </p>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleAddPoints();
            }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad de puntos
                </label>
                <input
                  type="number"
                  value={pointsData.amount}
                  onChange={(e) => setPointsData({ ...pointsData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ej: 1000"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Motivo
                </label>
                <textarea
                  value={pointsData.reason}
                  onChange={(e) => setPointsData({ ...pointsData, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Ej: Bonificacion por meta cumplida"
                  rows="3"
                  required
                />
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-blue-800">
                      Los puntos se agregaran inmediatamente al balance de la agencia y podran ser canjeados en la tienda de premios.
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
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-300"
                >
                  {isLoading ? 'Agregando...' : 'Agregar Puntos'}
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