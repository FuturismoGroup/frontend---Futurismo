import React, { useState, useEffect } from 'react';
import {
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UserIcon,
  MapPinIcon,
  ClockIcon,
  PhoneIcon,
  CalendarDaysIcon,
  UsersIcon,
  CurrencyDollarIcon,
  ChevronUpDownIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useToursStore } from '../../stores/toursStore';
import { useAuthStore } from '../../stores/authStore';
import useModulesConfigStore from '../../stores/modulesConfigStore';
// import Pagination from '../common/Pagination';

// Status badge para tours (activo/inactivo) - uses t() passed as param
const getStatusBadge = (status, t) => {
  const isActive = status === 'activo' || status === 'active' || status === true;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
      isActive
        ? 'bg-green-100 text-green-800 border-green-200'
        : 'bg-gray-100 text-gray-800 border-gray-200'
    }`}>
      {isActive ? t('providers.status.active') : t('providers.status.inactive')}
    </span>
  );
};

const ServicesList = ({
  onEdit,
  onDelete,
  onView,
  onCreate,
  showFilters = true,
  compact = false,
  showPagination = true,
  showHeader = true,
  maxItems = null,
  title = null
}) => {
  const { t } = useTranslation();
  const {
    tours: services,
    isLoading,
    error,
    pagination,
    filters,
    loadTours,
    setFilters,
    clearFilters,
    setPage,
    deleteTour
  } = useToursStore();

  const { user } = useAuthStore();
  const { modules } = useModulesConfigStore();

  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  // Obtener tipos de servicio desde la configuración
  const serviceTypes = modules?.serviceTypes?.serviceTypes || [];

  useEffect(() => {
    // Solo cargar tours si hay usuario autenticado
    if (user?.id) {
      loadTours();
    }
  }, [user?.id]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedServices = () => {
    if (!Array.isArray(services)) return [];

    let sortedServices = [...services];

    // Aplicar límite de items si se especifica
    if (maxItems && maxItems > 0) {
      sortedServices = sortedServices.slice(0, maxItems);
    }

    sortedServices.sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      if (aVal < bVal) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aVal > bVal) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    return sortedServices;
  };

  const handleFilterChange = (filterKey, value) => {
    setFilters({ [filterKey]: value });
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('common.noData');
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return t('common.noData');
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return timeString?.slice(0, 5) || '--:--';
  };

  const formatDuration = (hours) => {
    if (!hours) return '--';
    return `${hours}h`;
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{title || t('services.management')}</h2>
            <p className="mt-1 text-sm text-gray-600">
              {Array.isArray(services) ? services.length : 0} {t('services.totalServices')}
            </p>
          </div>
          {onCreate && user?.role !== 'agency' && (
            <button
              onClick={onCreate}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              {t('services.newService')}
            </button>
          )}
        </div>
      )}

      {/* Filtros */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t('dashboard.status')}
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t('search.allStatuses')}</option>
                <option value="activo">{t('providers.status.active')}</option>
                <option value="inactivo">{t('providers.status.inactive')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t('providers.form.fields.category')}
              </label>
              <select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t('providers.filters.allCategories')}</option>
                {serviceTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t('settings.tours.defaultDuration')}
              </label>
              <select
                value={filters.duration || ''}
                onChange={(e) => handleFilterChange('duration', e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t('search.allStatuses')}</option>
                <option value="short">1-3h</option>
                <option value="medium">4-6h</option>
                <option value="long">7+h</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t('search.searchByTour')}
              </label>
              <input
                type="text"
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Nombre del tour..."
                className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                {t('search.clear')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center">
                    {t('search.code')}
                    <ChevronUpDownIcon className="ml-1 h-4 w-4" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    {t('pdf.name')}
                    <ChevronUpDownIcon className="ml-1 h-4 w-4" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('pdf.pickupPoint')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('settings.tours.defaultDuration')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('settings.tours.maxCapacity')}
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center">
                    {t('reservations.comp.pricePerPerson')}
                    <ChevronUpDownIcon className="ml-1 h-4 w-4" />
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-3 text-gray-500">{t('common.loading')}</span>
                    </div>
                  </td>
                </tr>
              ) : getSortedServices().length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        {t('common.noData')}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        {t('providers.empty.filterHint')}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                getSortedServices().map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    {/* Código */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {service.code || 'N/A'}
                      </div>
                    </td>

                    {/* Título del Servicio */}
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {service.name || t('common.noData')}
                      </div>
                      {service.description && (
                        <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                          {service.description}
                        </div>
                      )}
                    </td>

                    {/* Destino / Punto de encuentro */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <MapPinIcon className="h-4 w-4 text-gray-400 mr-1" />
                        {service.meeting_point || service.meetingPoint || service.destination || t('common.noData')}
                      </div>
                    </td>

                    {/* Duración */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <ClockIcon className="h-4 w-4 text-gray-400 mr-1" />
                        {formatDuration(service.duration)}
                      </div>
                    </td>

                    {/* Capacidad */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <UsersIcon className="h-4 w-4 text-gray-400 mr-1" />
                        {service.max_capacity || service.maxCapacity || service.max_group_size || '--'}
                      </div>
                    </td>

                    {/* Precio Base */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm font-medium text-gray-900">
                        <CurrencyDollarIcon className="h-4 w-4 text-gray-400 mr-1" />
                        {parseFloat(service.price || 0).toFixed(2)}
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {onView && (
                          <button
                            onClick={() => onView(service)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title={t('common.view')}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        )}
                        {onEdit && user?.role !== 'agency' && (
                          <button
                            onClick={() => onEdit(service)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                            title={t('common.edit')}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                        )}
                        {onDelete && user?.role !== 'agency' && (
                          <button
                            onClick={() => onDelete(service)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title={t('common.delete')}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {showPagination && !isLoading && Array.isArray(services) && services.length > 0 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 text-center text-sm text-gray-500">
            {t('search.showing')} {maxItems ? Math.min(services.length, maxItems) : services.length} {t('services.totalServices')}
          </div>
        )}
      </div>
    </div>
  );
};

export default ServicesList;