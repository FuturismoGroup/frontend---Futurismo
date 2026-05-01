import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

const ExportStatsPreview = ({ stats, hideIncome = false }) => {
  const { t } = useTranslation();

  const statItems = [
    {
      value: stats.totalReservations,
      label: t('dashboard.export.stats.reservations'),
      color: 'text-primary-600'
    },
    {
      value: stats.totalTourists,
      label: t('dashboard.export.stats.tourists'),
      color: 'text-green-600'
    },
    ...(!hideIncome ? [
      {
        value: `S/. ${stats.totalRevenue.toLocaleString()}`,
        label: t('dashboard.export.stats.revenue'),
        color: 'text-purple-600'
      },
      {
        value: `S/. ${Math.round(stats.avgTicket).toLocaleString()}`,
        label: t('dashboard.export.stats.avgTicket'),
        color: 'text-orange-600'
      }
    ] : [])
  ];

  return (
    <div className="mb-4 p-3 bg-gray-50 rounded-lg sm:mb-6 sm:p-4">
      <h4 className="text-xs font-medium text-gray-700 mb-2 sm:text-sm sm:mb-3">
        {t('dashboard.export.dataPreview')}
      </h4>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {statItems.map((item, index) => (
          <div key={index} className="text-center p-2 bg-white rounded-md sm:p-0 sm:bg-transparent">
            <div className={`text-sm font-bold sm:text-lg ${item.color}`}>
              {item.value}
            </div>
            <div className="text-xs text-gray-600 mt-1">
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

ExportStatsPreview.propTypes = {
  stats: PropTypes.shape({
    totalReservations: PropTypes.number.isRequired,
    totalTourists: PropTypes.number.isRequired,
    totalRevenue: PropTypes.number.isRequired,
    avgTicket: PropTypes.number.isRequired
  }).isRequired
};

export default ExportStatsPreview;