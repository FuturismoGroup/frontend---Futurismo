import React from 'react';
import { useTranslation } from 'react-i18next';
import useServiceChart from '../../hooks/useServiceChart';
import { useAuthStore } from '../../stores/authStore';
import ChartControls from './ChartControls';
import ChartKPIs from './ChartKPIs';
import ChartViews from './ChartViews';
import ChartSummary from './ChartSummary';

const ServiceChart = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const hideIncome = user?.role === 'agency';
  const {
    chartType,
    setChartType,
    timeRange,
    setTimeRange,
    lineData,
    barData,
    pieData,
    kpiData,
    summaryData,
    timeRangeOptions,
    chartTypeOptions,
    loading,
    error
  } = useServiceChart();

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-6 sm:h-8 sm:mb-8"></div>
          <div className="grid grid-cols-1 gap-4 mb-4 sm:grid-cols-2 sm:gap-6 sm:mb-6 lg:grid-cols-3">
            <div className="h-24 bg-gray-200 rounded-xl sm:h-32"></div>
            <div className="h-24 bg-gray-200 rounded-xl sm:h-32"></div>
            <div className="h-24 bg-gray-200 rounded-xl sm:h-32"></div>
          </div>
          <div className="h-48 bg-gray-200 rounded sm:h-64"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8">
        <div className="text-center text-red-600">
          <p className="text-sm sm:text-base">{t('dashboard.chart.loadError')}: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 lg:p-8">
      <ChartControls
        timeRange={timeRange}
        setTimeRange={setTimeRange}
        chartType={chartType}
        setChartType={setChartType}
        timeRangeOptions={timeRangeOptions}
        chartTypeOptions={chartTypeOptions}
      />

      <ChartKPIs kpiData={kpiData} timeRange={timeRange} hideIncome={hideIncome} />

      <ChartViews
        chartType={chartType}
        lineData={lineData}
        barData={barData}
        hideIncome={hideIncome}
      />

      <ChartSummary summaryData={summaryData} hideIncome={hideIncome} />
    </div>
  );
};

export default ServiceChart;