import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { formatters } from '../../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  const { t } = useTranslation();
  
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
        <p className="font-medium text-gray-900">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {
              entry.name === t('dashboard.chart.revenue') || entry.name === 'ingresos' 
                ? formatters.formatCurrency(entry.value) 
                : entry.value
            }
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ChartViews = ({ chartType, lineData, barData, hideIncome = false }) => {
  const { t } = useTranslation();

  return (
    <div className="h-64 sm:h-80 lg:h-96">
      {chartType === 'line' && (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={lineData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="name" 
              stroke="#6B7280" 
              fontSize={12}
              className="text-xs sm:text-sm"
            />
            <YAxis 
              stroke="#6B7280" 
              fontSize={12}
              className="text-xs sm:text-sm"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: '12px' }}
              className="text-xs sm:text-sm"
            />
            <Line 
              type="monotone" 
              dataKey="reservas" 
              stroke="#1E40AF" 
              strokeWidth={2}
              dot={{ fill: '#1E40AF', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5 }}
              name={t('dashboard.chart.reservations')}
            />
            <Line 
              type="monotone" 
              dataKey="turistas" 
              stroke="#F59E0B" 
              strokeWidth={2}
              dot={{ fill: '#F59E0B', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5 }}
              name={t('dashboard.chart.tourists')}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {chartType === 'bar' && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="tour" 
              stroke="#6B7280" 
              fontSize={12}
              className="text-xs sm:text-sm"
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              yAxisId="left" 
              stroke="#6B7280" 
              fontSize={12}
              className="text-xs sm:text-sm"
            />
            {!hideIncome && (
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#6B7280"
                fontSize={12}
                className="text-xs sm:text-sm"
                tickFormatter={(value) => `S/. ${(value/1000).toFixed(0)}k`}
              />
            )}
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              className="text-xs sm:text-sm"
            />
            <Bar yAxisId="left" dataKey="reservas" fill="#1E40AF" name={t('dashboard.chart.reservations')} />
            {!hideIncome && (
              <Bar yAxisId="right" dataKey="ingresos" fill="#10B981" name={t('dashboard.chart.revenue')} />
            )}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

ChartViews.propTypes = {
  chartType: PropTypes.oneOf(['line', 'bar']).isRequired,
  lineData: PropTypes.array.isRequired,
  barData: PropTypes.array.isRequired
};

export default ChartViews;