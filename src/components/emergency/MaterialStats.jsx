import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { 
  ArchiveBoxIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon, 
  FunnelIcon 
} from '@heroicons/react/24/outline';

const MaterialStats = ({ stats, onStatClick }) => {
  const { t } = useTranslation();

  const statCards = [
    {
      id: 'total',
      icon: ArchiveBoxIcon,
      value: stats.total,
      label: t('emergency.materials.totalMaterials'),
      bgClass: 'bg-blue-50',
      iconClass: 'text-blue-600',
      onClick: () => onStatClick('total')
    },
    {
      id: 'mandatory',
      icon: ExclamationTriangleIcon,
      value: stats.mandatory,
      label: t('emergency.materials.mandatory'),
      bgClass: 'bg-red-50',
      iconClass: 'text-red-600',
      onClick: () => onStatClick('mandatory')
    },
    {
      id: 'categories',
      icon: CheckCircleIcon,
      value: stats.categories,
      label: t('emergency.materials.categories'),
      bgClass: 'bg-green-50',
      iconClass: 'text-green-600',
      onClick: () => onStatClick('categories')
    },
    {
      id: 'filtered',
      icon: FunnelIcon,
      value: stats.filtered,
      label: t('emergency.materials.filtered'),
      bgClass: 'bg-purple-50',
      iconClass: 'text-purple-600',
      onClick: () => onStatClick('filtered')
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        {t('emergency.materials.materialsSummary')}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {statCards.map(stat => (
          <div 
            key={stat.id}
            className={`${stat.bgClass} p-4 rounded-lg cursor-pointer hover:bg-opacity-80 transition-colors`}
            onClick={stat.onClick}
          >
            <div className="flex items-center space-x-3">
              <stat.icon className={`w-8 h-8 ${stat.iconClass}`} />
              <div>
                <p className={`text-2xl font-bold ${stat.iconClass}`}>
                  {stat.value}
                </p>
                <p className="text-sm text-gray-700">
                  {stat.label}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

MaterialStats.propTypes = {
  stats: PropTypes.shape({
    total: PropTypes.number.isRequired,
    mandatory: PropTypes.number.isRequired,
    categories: PropTypes.number.isRequired,
    filtered: PropTypes.number.isRequired
  }).isRequired,
  onStatClick: PropTypes.func.isRequired
};

export default MaterialStats;