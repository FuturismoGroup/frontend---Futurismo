import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';

const StatsCard = ({
  title,
  value,
  icon: Icon,
  trend,
  color = 'primary',
  subtitle = null,
  loading = false,
  showTrendComparison = false
}) => {
  const { t } = useTranslation();
  
  const colorClasses = {
    primary: 'bg-gradient-to-br from-secondary-100 to-secondary-200 text-secondary-700',
    secondary: 'bg-gradient-to-br from-accent-100 to-accent-200 text-accent-700',
    success: 'bg-gradient-to-br from-success-100 to-success-200 text-success-700',
    warning: 'bg-gradient-to-br from-warning-100 to-warning-200 text-warning-700',
    danger: 'bg-gradient-to-br from-error-100 to-error-200 text-error-700',
    neutral: 'bg-gradient-to-br from-neutral-100 to-neutral-200 text-neutral-700'
  };

  const isPositiveTrend = trend && trend.startsWith('+');

  if (loading) {
    return (
      <div className="card !p-4 sm:!p-5">
        <div className="flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0 space-y-2 sm:space-y-3">
            <div className="skeleton-modern h-3 sm:h-4 w-24"></div>
            <div className="skeleton-modern h-6 sm:h-8 w-32"></div>
            <div className="skeleton-modern h-3 sm:h-4 w-40"></div>
          </div>
          <div className="skeleton-modern h-12 w-12 sm:h-16 sm:w-16 rounded-2xl flex-shrink-0"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card hover-lift group !p-4 sm:!p-5">
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-semibold text-neutral-600 mb-1 truncate tracking-wide" title={title}>{title}</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-neutral-900 mb-1 sm:mb-2 truncate gradient-text" title={String(value)}>{value}</p>

          {subtitle && (
            <p className="text-xs sm:text-sm text-neutral-500 mb-1 truncate" title={subtitle}>{subtitle}</p>
          )}

          {trend && (
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-wrap">
              <div className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${
                isPositiveTrend ? 'bg-success-100 text-success-700' : 'bg-error-100 text-error-700'
              }`}>
                {isPositiveTrend ? (
                  <ArrowTrendingUpIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                ) : (
                  <ArrowTrendingDownIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                )}
                <span className="text-xs sm:text-sm font-semibold flex-shrink-0">
                  {trend}
                </span>
              </div>
              {showTrendComparison && (
                <span className="text-xs sm:text-sm text-neutral-500 truncate hidden sm:inline" title={t('dashboard.stats.vsPreviousMonth', 'vs mes anterior')}>
                  {t('dashboard.stats.vsPreviousMonth', 'vs mes anterior')}
                </span>
              )}
            </div>
          )}
        </div>

        <div className={`p-2.5 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl flex-shrink-0 shadow-soft group-hover:shadow-glow transition-all duration-1000 ${colorClasses[color]}`}>
          <Icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 transition-all duration-1000 group-hover:scale-110" />
        </div>
      </div>
    </div>
  );
};

StatsCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.elementType.isRequired,
  trend: PropTypes.string,
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'danger', 'warning', 'neutral']),
  subtitle: PropTypes.string,
  loading: PropTypes.bool,
  showTrendComparison: PropTypes.bool
};

export default StatsCard;