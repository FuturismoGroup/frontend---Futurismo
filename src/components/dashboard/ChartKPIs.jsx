import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

const ChartKPIs = ({ kpiData, timeRange, hideIncome = false }) => {
  const { t } = useTranslation();

  // Determinar el texto de comparación según el período
  const getPreviousPeriodText = () => {
    switch (timeRange) {
      case 'week':
        return t('dashboard.chart.kpis.previousWeek');
      case 'month':
        return t('dashboard.chart.kpis.previousMonth');
      case 'quarter':
        return t('dashboard.chart.kpis.previousQuarter');
      case 'year':
        return t('dashboard.chart.kpis.previousYear');
      default:
        return t('dashboard.chart.kpis.previousPeriod');
    }
  };

  const kpiConfigs = [
    {
      key: 'totalReservas',
      label: t('dashboard.chart.kpis.totalReservations'),
      bgClass: 'bg-blue-50',
      textClass: 'text-blue',
      showCurrency: false
    },
    {
      key: 'totalTuristas',
      label: t('dashboard.chart.kpis.totalTourists'),
      bgClass: 'bg-amber-50',
      textClass: 'text-amber',
      showCurrency: false
    },
    ...(!hideIncome ? [{
      key: 'ingresosTotales',
      label: t('dashboard.chart.kpis.totalIncome'),
      bgClass: 'bg-green-50',
      textClass: 'text-green',
      showCurrency: true
    }] : [])
  ];

  return (
    <div className="grid grid-cols-1 gap-4 mb-4 sm:grid-cols-2 sm:gap-6 sm:mb-6 lg:grid-cols-3">
      {kpiConfigs.map((config) => {
        const data = kpiData[config.key] || { actual: 0, anterior: 0, crecimiento: 0 };
        const isPositive = data.crecimiento >= 0;
        
        return (
          <div key={config.key} className={`${config.bgClass} rounded-xl p-4 relative overflow-hidden sm:p-6`}>
            <div className="flex items-start justify-between mb-3 sm:items-center">
              <p className={`text-xs font-semibold ${config.textClass}-700 uppercase tracking-wider sm:text-sm`}>
                {config.label}
              </p>
              <div className={`flex items-center text-xs font-bold sm:text-sm ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {isPositive ? (
                  <ArrowTrendingUpIcon className="w-3 h-3 mr-1 sm:w-4 sm:h-4" />
                ) : (
                  <ArrowTrendingDownIcon className="w-3 h-3 mr-1 sm:w-4 sm:h-4" />
                )}
                {Math.abs(data.crecimiento)}%
              </div>
            </div>
            <p className={`text-2xl font-bold ${config.textClass}-900 sm:text-3xl`}>
              {config.showCurrency && 'S/'}
              {config.showCurrency ? data.actual.toLocaleString() : data.actual.toLocaleString()}
              {config.isPercentage && '%'}
            </p>
            <p className={`text-xs ${config.textClass}-600 mt-2 sm:text-sm`}>
              {t('dashboard.chart.kpis.vs')}{config.showCurrency ? `S/${data.anterior.toLocaleString()}` : data.anterior.toLocaleString()}
              {' '}{getPreviousPeriodText()}
            </p>
            <div className={`absolute -right-3 -bottom-3 ${config.textClass}-100 opacity-20 sm:-right-4 sm:-bottom-4`}>
              <svg className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24" fill="currentColor" viewBox="0 0 24 24">
                {config.key === 'totalReservas' && (
                  <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/>
                )}
                {config.key === 'totalTuristas' && (
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                )}
                {config.key === 'ingresosTotales' && (
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1.93.66 1.64 2.08 1.64 1.51 0 2.1-.59 2.1-1.42 0-.84-.37-1.17-2.31-1.56-2.16-.47-3.66-1.25-3.66-3.46 0-1.79 1.29-2.93 3.27-3.26V4.68h2.67v1.95c1.37.37 2.5 1.23 2.61 2.85h-1.98c-.1-.81-.6-1.44-1.76-1.44-1.26 0-1.83.47-1.83 1.21 0 .68.39 1.01 2.32 1.39 2.02.41 3.66 1.12 3.66 3.65-.01 1.94-1.39 3.04-3.19 3.4z"/>
                )}
              </svg>
            </div>
          </div>
        );
      })}
    </div>
  );
};

ChartKPIs.propTypes = {
  kpiData: PropTypes.shape({
    totalReservas: PropTypes.shape({
      actual: PropTypes.number,
      anterior: PropTypes.number,
      crecimiento: PropTypes.number
    }),
    totalTuristas: PropTypes.shape({
      actual: PropTypes.number,
      anterior: PropTypes.number,
      crecimiento: PropTypes.number
    }),
    ingresosTotales: PropTypes.shape({
      actual: PropTypes.number,
      anterior: PropTypes.number,
      crecimiento: PropTypes.number
    })
  }),
  timeRange: PropTypes.string.isRequired
};

export default ChartKPIs;