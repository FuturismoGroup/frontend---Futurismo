import React from 'react';
import { CalendarIcon, CheckCircleIcon, ClockIcon, UserGroupIcon, CurrencyDollarIcon, ExclamationTriangleIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import StatsCard from '../components/dashboard/StatsCard';
import ServiceChart from '../components/dashboard/ServiceChart';
import ExportPanel from '../components/dashboard/ExportPanel';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuthStore } from '../stores/authStore';
import useDashboard from '../hooks/useDashboard';
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts';

const Dashboard = () => {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  
  // Hook personalizado para dashboard (reemplaza datos hardcodeados)
  const {
    stats,
    loading,
    error,
    monthlyData,
    roleSpecificStats,
    refresh
  } = useDashboard();

  // Obtener hora del día para el saludo
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.goodMorning');
    if (hour < 18) return t('dashboard.goodAfternoon');
    return t('dashboard.goodEvening');
  };

  if (loading) {
    return <LoadingSpinner text={t('dashboard.loading')} />;
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">
          {getGreeting()}, {user?.name || t('dashboard.user')} ✨
        </h1>
        <p className="page-subtitle">
          {t('dashboard.todaySummary')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid-responsive mb-8 lg:mb-12">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <div className="loading-spinner"></div>
          </div>
        ) : error ? (
          <div className="col-span-full">
            <div className="alert alert-error text-center">
              <p className="mb-4">{t('dashboard.errorPrefix')}: {error}</p>
              <button onClick={refresh} className="btn btn-error">
                {t('dashboard.retry')}
              </button>
            </div>
          </div>
        ) : (
          Object.entries(roleSpecificStats).map(([key, card]) => {
            // Función auxiliar para mapear iconos
            const getIconForType = (iconType) => {
              const iconMap = {
                calendar: CalendarIcon,
                clock: ClockIcon,
                star: CheckCircleIcon,
                dollar: CurrencyDollarIcon,
                service: ChartBarIcon,
                check: CheckCircleIcon,
                building: ExclamationTriangleIcon,
                user: UserGroupIcon
              };
              return iconMap[iconType] || CalendarIcon;
            };

            return (
              <StatsCard
                key={key}
                title={card.label}
                value={card.format === 'currency' ? `S/. ${(card.value ?? 0).toLocaleString()}` : (card.value ?? 0)}
                icon={getIconForType(card.icon)}
                trend={card.trend || null}
                color="primary"
              />
            );
          })
        )}
      </div>


      {/* Main Content - Different per role */}
      {user?.role === 'guide' ? (
        /* Guide: gráfico de ingresos a ancho completo */
        <div className="space-y-4 sm:space-y-6">
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">{t('dashboard.incomeByMonth')}</h3>
              <CurrencyDollarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
            </div>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    className="text-xs"
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickFormatter={(value) => {
                      if (value >= 1000000) {
                        return `S/${(value/1000000).toFixed(1)}M`;
                      } else if (value >= 1000) {
                        return `S/${(value/1000).toFixed(1)}k`;
                      } else {
                        return `S/${value.toFixed(0)}`;
                      }
                    }}
                    className="text-xs"
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    formatter={(value) => [`S/${value.toLocaleString()}`, t('dashboard.incomeLegend')]}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8B5CF6"
                    strokeWidth={3}
                    dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#8B5CF6', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : (
        /* Agency/Admin content */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <ServiceChart />
          </div>
          <div className="space-y-4 sm:space-y-6">
            <ExportPanel />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;