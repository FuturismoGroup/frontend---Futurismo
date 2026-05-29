import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import useAuthStore from '../../stores/authStore';

const HistoryFilters = ({
  filters,
  onUpdateFilter,
  onClearFilters,
  filterOptions,
  allFilterOptions,
  serviceTypes,
  loading
}) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  // Check if user is a guide (employed or freelance) - they shouldn't see guide filter
  const isGuide = user?.role === 'guide';

  const handleSearchChange = (e) => {
    onUpdateFilter('search', e.target.value);
  };

  const handleFilterChange = (filterName, value) => {
    onUpdateFilter(filterName, value);
  };

  // Usar todas las opciones si están disponibles, sino usar las opciones por defecto
  const guidesOptions = allFilterOptions?.allGuides || [];
  const driversOptions = allFilterOptions?.allDrivers || [];
  const vehiclesOptions = allFilterOptions?.allVehicles || [];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {t('history.filters.title')}
        </h3>
        <button
          onClick={onClearFilters}
          className="inline-flex items-center px-3 py-1 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          disabled={loading}
        >
          <XMarkIcon className="w-4 h-4 mr-1" />
          {t('history.filters.clear')}
        </button>
      </div>

      {/* Búsqueda */}
      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={filters.search}
            onChange={handleSearchChange}
            placeholder={t('history.filters.searchPlaceholder')}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
        </div>
      </div>

      {/* Filtros principales */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${isGuide ? '3' : '4'} gap-4`}>
        {/* Rango de fechas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('history.filters.dateRangeLabel')}
          </label>
          <select
            value={filters.dateRange}
            onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          >
            <option value="all">{t('history.filters.dateRange.all')}</option>
            <option value="today">{t('history.filters.dateRange.today')}</option>
            <option value="week">{t('history.filters.dateRange.week')}</option>
            <option value="month">{t('history.filters.dateRange.month')}</option>
            <option value="year">{t('history.filters.dateRange.year')}</option>
          </select>
        </div>

        {/* Estado */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('history.filters.statusLabel')}
          </label>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          >
            <option value="all">{t('history.comp.all')}</option>
            <option value="pending">{t('history.comp.statusPending')}</option>
            <option value="confirmed">{t('history.comp.statusConfirmed')}</option>
            <option value="completed">{t('history.comp.statusCompleted')}</option>
            <option value="cancelled">{t('history.comp.statusCancelled')}</option>
            <option value="unassigned">{t('history.comp.statusUnassigned')}</option>
          </select>
        </div>

        {/* Tipo de servicio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('history.filters.serviceTypeLabel')}
          </label>
          <select
            value={filters.serviceType}
            onChange={(e) => handleFilterChange('serviceType', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          >
            <option value="all">{t('history.filters.serviceType.all')}</option>
            {(serviceTypes || []).map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Guía - Hidden for all guides (employed and freelance) */}
        {!isGuide && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('history.filters.guideLabel')}
            </label>
            <select
              value={filters.guide}
              onChange={(e) => handleFilterChange('guide', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
              title={t('history.comp.selectGuide')}
            >
              <option value="all">{t('history.comp.all')}</option>
              {guidesOptions.map(guide => (
                <option
                  key={guide.id}
                  value={guide.name}
                  title={guide.assigned ? t('history.comp.assigned') : t('history.comp.notAssigned')}
                >
                  {guide.assigned ? '● ' : '○ '}{guide.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Filtros secundarios */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        {/* Chofer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('history.filters.driverLabel')}
          </label>
          <select
            value={filters.driver}
            onChange={(e) => handleFilterChange('driver', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
            title={t('history.comp.selectDriver')}
          >
            <option value="all">{t('history.comp.all')}</option>
            {driversOptions.map(driver => (
              <option
                key={driver.id}
                value={driver.name}
                title={driver.assigned ? t('history.comp.assigned') : t('history.comp.notAssigned')}
              >
                {driver.assigned ? '● ' : '○ '}{driver.name}
              </option>
            ))}
          </select>
        </div>

        {/* Vehículo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('history.filters.vehicleLabel')}
          </label>
          <select
            value={filters.vehicle}
            onChange={(e) => handleFilterChange('vehicle', e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
            title={t('history.comp.selectVehicle')}
          >
            <option value="all">{t('history.comp.all')}</option>
            {vehiclesOptions.map(vehicle => (
              <option
                key={vehicle.id}
                value={vehicle.name}
                title={vehicle.assigned ? t('history.comp.assigned') : t('history.comp.notAssigned')}
              >
                {vehicle.assigned ? '● ' : '○ '}{vehicle.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

HistoryFilters.propTypes = {
  filters: PropTypes.shape({
    search: PropTypes.string.isRequired,
    dateRange: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    serviceType: PropTypes.string.isRequired,
    guide: PropTypes.string.isRequired,
    driver: PropTypes.string.isRequired,
    vehicle: PropTypes.string.isRequired
  }).isRequired,
  onUpdateFilter: PropTypes.func.isRequired,
  onClearFilters: PropTypes.func.isRequired,
  filterOptions: PropTypes.shape({
    guides: PropTypes.arrayOf(PropTypes.string).isRequired,
    drivers: PropTypes.arrayOf(PropTypes.string).isRequired,
    vehicles: PropTypes.arrayOf(PropTypes.string).isRequired
  }).isRequired,
  allFilterOptions: PropTypes.shape({
    allGuides: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      assigned: PropTypes.bool
    })),
    allDrivers: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      assigned: PropTypes.bool
    })),
    allVehicles: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      assigned: PropTypes.bool
    }))
  }),
  serviceTypes: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string,
    label: PropTypes.string,
    color: PropTypes.string
  })),
  loading: PropTypes.bool
};

HistoryFilters.defaultProps = {
  loading: false,
  allFilterOptions: { allGuides: [], allDrivers: [], allVehicles: [] },
  serviceTypes: []
};

export default HistoryFilters;