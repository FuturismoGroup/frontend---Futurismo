import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { 
  ChartBarIcon, 
  CalendarIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon 
} from '@heroicons/react/24/outline';

const ExportStatsPreview = ({ stats, reservationCount }) => {
  const { t } = useTranslation();

  const statItems = [
    {
      icon: CalendarIcon,
      value: stats.totalReservations || reservationCount,
      label: 'common.export.stats.reservations',
      color: 'text-primary-600'
    },
    {
      icon: UserGroupIcon,
      value: stats.totalTourists || 0,
      label: 'common.export.stats.tourists',
      color: 'text-green-600'
    },
    {
      icon: CurrencyDollarIcon,
      value: `S/. ${(stats.totalRevenue || 0).toLocaleString()}`,
      label: 'common.export.stats.revenue',
      color: 'text-purple-600'
    },
    {
      icon: ArrowTrendingUpIcon,
      value: `$${Math.round(stats.avgTicket || 0).toLocaleString()}`,
      label: 'common.export.stats.average',
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="px-8 py-4 bg-gray-50 border-b">
      <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
        <ChartBarIcon className="w-4 h-4" />
        {t('common.export.dataPreview')}
      </h3>
      <div className="grid grid-cols-4 gap-4">
        {statItems.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="text-center">
              <div className={`flex items-center justify-center gap-1 ${stat.color} mb-1`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500">{t(stat.label)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

ExportStatsPreview.propTypes = {
  stats: PropTypes.shape({
    totalReservations: PropTypes.number,
    totalTourists: PropTypes.number,
    totalRevenue: PropTypes.number,
    avgTicket: PropTypes.number
  }),
  reservationCount: PropTypes.number.isRequired
};

export default ExportStatsPreview;