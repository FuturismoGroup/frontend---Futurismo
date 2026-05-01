import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

const ChartSummary = ({ summaryData = {}, hideIncome = false }) => {
  const { t } = useTranslation();

  const summaryItems = [
    {
      label: t('dashboard.chart.summary.popularTour'),
      value: summaryData.popularTour || 'N/A',
      highlight: true
    },
    ...(!hideIncome ? [{
      label: t('dashboard.chart.summary.avgPerBooking'),
      value: `S/${(summaryData.avgPerBooking || 0).toFixed(2)}`
    }] : []),
    {
      label: t('dashboard.chart.summary.bestDay'),
      value: summaryData.bestDay || 'N/A'
    }
  ];

  return (
    <div className="mt-6 pt-4 border-t border-gray-100 sm:mt-8 sm:pt-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
        {summaryItems.map((item, index) => (
          <div key={index} className="text-center p-3 bg-gray-50 rounded-lg sm:bg-transparent sm:p-0">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider sm:text-sm">{item.label}</p>
            <p
              className={`mt-1 text-base font-bold sm:text-lg ${item.highlight ? 'text-blue-600' : 'text-gray-900'} break-words`}
              title={item.value}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

ChartSummary.propTypes = {
  summaryData: PropTypes.shape({
    popularTour: PropTypes.string,
    avgPerBooking: PropTypes.number,
    bestDay: PropTypes.string,
    conversionRate: PropTypes.number
  })
};

export default ChartSummary;