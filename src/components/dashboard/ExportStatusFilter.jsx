import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { FunnelIcon } from '@heroicons/react/24/outline';
import exportService from '../../services/exportService';

const ExportStatusFilter = ({
  statusOptions,
  selectedStatus,
  onStatusChange
}) => {
  const { t } = useTranslation();
  const [optionStats, setOptionStats] = useState({});

  // Cargar estadísticas para cada opción de estado
  useEffect(() => {
    const loadAllStats = async () => {
      const stats = {};
      for (const option of statusOptions) {
        try {
          const result = await exportService.getFilteredStats(option.value);
          stats[option.value] = result;
        } catch (error) {
          stats[option.value] = { totalReservations: 0 };
        }
      }
      setOptionStats(stats);
    };
    loadAllStats();
  }, [statusOptions]);

  return (
    <div className="mb-4 sm:mb-6">
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <FunnelIcon className="w-3 h-3 text-gray-600 sm:w-4 sm:h-4" />
        <span className="text-xs font-medium text-gray-700 sm:text-sm">
          {t('dashboard.export.filterByStatus')}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
        {statusOptions.map((option) => {
          const stats = optionStats[option.value] || { totalReservations: 0 };
          return (
            <button
              key={option.value}
              onClick={() => onStatusChange(option.value)}
              className={`p-3 rounded-lg border-2 transition-all active:scale-95 ${
                selectedStatus === option.value
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1 sm:gap-3">
                  <option.icon className={`w-4 h-4 flex-shrink-0 sm:w-5 sm:h-5 ${option.color}`} />
                  <span className="text-xs font-medium text-gray-900 sm:text-sm" title={option.label}>
                    {option.label}
                  </span>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs font-bold text-gray-700">
                    {stats.totalReservations}
                  </div>
                  <div className="text-xs text-gray-500 hidden sm:block">
                    {t('dashboard.export.reservations')}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Active filter info */}
      <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg sm:mt-3 sm:p-3">
        <p className="text-xs text-blue-800 sm:text-sm">
          <span className="font-medium">📋 {t('dashboard.export.activeFilter')}:</span>{' '}
          <span className="hidden sm:inline">
            {statusOptions.find(opt => opt.value === selectedStatus)?.label}
            {selectedStatus !== 'all' && (
              <span className="ml-2">
                • {t('dashboard.export.filterNote', { status: selectedStatus })}
              </span>
            )}
          </span>
          <span className="sm:hidden truncate" title={statusOptions.find(opt => opt.value === selectedStatus)?.label}>
            {statusOptions.find(opt => opt.value === selectedStatus)?.label}
          </span>
        </p>
      </div>
    </div>
  );
};

ExportStatusFilter.propTypes = {
  statusOptions: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.elementType.isRequired,
    color: PropTypes.string.isRequired
  })).isRequired,
  selectedStatus: PropTypes.string.isRequired,
  onStatusChange: PropTypes.func.isRequired
};

export default ExportStatusFilter;