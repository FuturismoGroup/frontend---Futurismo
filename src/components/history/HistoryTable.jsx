import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  EyeIcon,
  StarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import StarRating from '../common/StarRating';
import useAuthStore from '../../stores/authStore';

const HistoryTable = ({
  services,
  sort,
  onSort,
  loading,
  onViewDetails,
  onRate,
  serviceTypes
}) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  // Check if user is an employed guide (guía de planta)
  const isEmployedGuide = user?.role === 'guide' && user?.guide_type === 'employed';

  const getSortIcon = (field) => {
    if (sort.field !== field) {
      return <ChevronUpIcon className="w-4 h-4 text-gray-400" />;
    }
    return sort.direction === 'asc' 
      ? <ChevronUpIcon className="w-4 h-4 text-gray-900" />
      : <ChevronDownIcon className="w-4 h-4 text-gray-900" />;
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        label: t('history.table.status.completed')
      },
      confirmed: {
        bg: 'bg-blue-100',
        text: 'text-blue-800',
        label: t('history.comp.statusConfirmed')
      },
      cancelled: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        label: t('history.table.status.cancelled')
      },
      pending: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-800',
        label: t('history.table.status.pending')
      }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getServiceTypeBadge = (type) => {
    // Buscar el tipo en el catálogo dinámico creado por el admin
    const dynamicType = Array.isArray(serviceTypes)
      ? serviceTypes.find(st => st.value === type)
      : null;

    if (dynamicType) {
      const color = dynamicType.color || '#6B7280';
      return (
        <span
          className="inline-flex px-2 py-1 text-xs font-medium rounded"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {dynamicType.label}
        </span>
      );
    }

    // Sin tipo definido o tipo desconocido
    return (
      <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-600">
        {type || t('common.noData')}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex space-x-4 mb-3">
              <div className="h-4 bg-gray-200 rounded flex-1"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                <button
                  className="flex items-center space-x-1 hover:text-gray-700"
                  onClick={() => onSort('date')}
                >
                  <span>{t('history.table.headers.date')}</span>
                  {getSortIcon('date')}
                </button>
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                <button
                  className="flex items-center space-x-1 hover:text-gray-700"
                  onClick={() => onSort('serviceName')}
                >
                  <span>{t('history.table.headers.service')}</span>
                  {getSortIcon('serviceName')}
                </button>
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                <button
                  className="flex items-center space-x-1 hover:text-gray-700"
                  onClick={() => onSort('clientName')}
                >
                  <span>{t('history.table.headers.client')}</span>
                  {getSortIcon('clientName')}
                </button>
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                {t('history.table.headers.type')}
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                {t('history.table.headers.status')}
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                <button
                  className="flex items-center space-x-1 hover:text-gray-700"
                  onClick={() => onSort('guide')}
                >
                  <span>{t('history.table.headers.guide')}</span>
                  {getSortIcon('guide')}
                </button>
              </th>
              {!isEmployedGuide && (
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  <button
                    className="flex items-center space-x-1 hover:text-gray-700"
                    onClick={() => onSort('amount')}
                  >
                    <span>{t('history.table.headers.amount')}</span>
                    {getSortIcon('amount')}
                  </button>
                </th>
              )}
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                {t('history.table.headers.rating')}
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                {t('history.table.headers.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {services.length === 0 ? (
              <tr>
                <td colSpan={isEmployedGuide ? "8" : "9"} className="px-3 sm:px-6 py-8 sm:py-12 text-center text-gray-500">
                  <DocumentTextIcon className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-400" />
                  <p className="text-sm sm:text-lg font-medium">{t('history.table.noResults')}</p>
                  <p className="text-xs sm:text-sm">{t('history.table.noResultsDescription')}</p>
                </td>
              </tr>
            ) : (
              services.map((service) => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(service.date)}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {service.serviceName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {service.duration}h • {service.passengers} pax
                      </div>
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {service.clientName}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    {getServiceTypeBadge(service.serviceType)}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(service.status)}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">{service.guide}</div>
                      {service.driver && (
                        <div className="text-xs text-gray-500">
                          {t('history.table.driver')}: {service.driver}
                        </div>
                      )}
                    </div>
                  </td>
                  {!isEmployedGuide && (
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(service.amount)}
                    </td>
                  )}
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    {service.rating ? (
                      <StarRating rating={service.rating} size="sm" showValue />
                    ) : (service.status === 'completed' || service.status === 'confirmed') ? (
                      <span className="text-xs text-gray-400">{t('history.table.notRated')}</span>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onViewDetails(service)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title={t('history.table.actions.viewDetails')}
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      {(service.status === 'completed' || service.status === 'confirmed') && onRate && (
                        service.rating ? (
                          <button
                            onClick={() => onRate(service)}
                            className="text-yellow-500 hover:text-yellow-700 p-1 rounded hover:bg-yellow-50"
                            title={t('history.table.actions.viewRating', 'Ver calificación')}
                          >
                            <StarIconSolid className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => onRate(service)}
                            className="text-yellow-600 hover:text-yellow-900 p-1 rounded hover:bg-yellow-50"
                            title={t('history.table.actions.rate')}
                          >
                            <StarIcon className="w-4 h-4" />
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

HistoryTable.propTypes = {
  services: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    serviceName: PropTypes.string.isRequired,
    clientName: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    serviceType: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    guide: PropTypes.string.isRequired,
    driver: PropTypes.string,
    amount: PropTypes.number.isRequired,
    duration: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    passengers: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    rating: PropTypes.number
  })).isRequired,
  sort: PropTypes.shape({
    field: PropTypes.string.isRequired,
    direction: PropTypes.string.isRequired
  }).isRequired,
  onSort: PropTypes.func.isRequired,
  onViewDetails: PropTypes.func.isRequired,
  onRate: PropTypes.func,
  serviceTypes: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string,
    label: PropTypes.string,
    color: PropTypes.string
  })),
  loading: PropTypes.bool
};

HistoryTable.defaultProps = {
  loading: false,
  serviceTypes: []
};

export default HistoryTable;