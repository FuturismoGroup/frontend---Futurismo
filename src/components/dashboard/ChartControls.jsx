import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

const ChartControls = ({ 
  timeRange, 
  setTimeRange, 
  chartType, 
  setChartType,
  timeRangeOptions,
  chartTypeOptions 
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 mb-6 sm:mb-8 lg:flex-row lg:items-center lg:justify-between">
      <h3 className="text-lg font-bold text-gray-900 sm:text-xl">
        {t('dashboard.chart.title')}
      </h3>
      
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Time range selector */}
        <select
          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors sm:w-auto sm:px-4"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          aria-label={t('dashboard.chart.selectTimeRange')}
        >
          {timeRangeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Chart type selector */}
        <div className="flex bg-gray-100 rounded-lg p-0.5 w-full sm:w-auto" role="group" aria-label={t('dashboard.chart.selectChartType')}>
          {chartTypeOptions.map(option => (
            <button
              key={option.value}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 sm:flex-initial sm:px-4 ${
                chartType === option.value
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setChartType(option.value)}
              aria-pressed={chartType === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

ChartControls.propTypes = {
  timeRange: PropTypes.string.isRequired,
  setTimeRange: PropTypes.func.isRequired,
  chartType: PropTypes.string.isRequired,
  setChartType: PropTypes.func.isRequired,
  timeRangeOptions: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired
  })).isRequired,
  chartTypeOptions: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired
  })).isRequired
};

export default ChartControls;