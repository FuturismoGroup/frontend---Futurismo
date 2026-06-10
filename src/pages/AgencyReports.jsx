import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChartBarIcon, ArrowTrendingUpIcon, CurrencyDollarIcon, UserGroupIcon, CalendarIcon, ArrowDownTrayIcon, FunnelIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { format, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  BarChart as Chart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import useAgencyStore from '../stores/agencyStore';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const AgencyReports = () => {
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reportType, setReportType] = useState('monthly'); // monthly, yearly
  const [chartType, setChartType] = useState('reservations'); // reservations, participants
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get functions from store
  const actions = useAgencyStore((state) => state.actions);

  // Obtener datos del reporte
  useEffect(() => {
    const fetchReportData = async () => {
      setLoading(true);
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      
      try {
        if (reportType === 'monthly') {
          const data = await actions.fetchMonthlyReport(year, month);
          setReportData(data);
        } else {
          const yearlyData = await actions.fetchYearlyComparison(year);
          setReportData({ yearlyData, year });
        }
      } catch {
        setReportData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [selectedDate, reportType, actions]);

  const navigateDate = (direction) => {
    if (direction === 'prev') {
      setSelectedDate(prev => reportType === 'monthly' ? subMonths(prev, 1) : new Date(prev.getFullYear() - 1, 0, 1));
    } else {
      setSelectedDate(prev => reportType === 'monthly' ? addMonths(prev, 1) : new Date(prev.getFullYear() + 1, 0, 1));
    }
  };

  // Colores para gráficos
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  // Preparar datos para gráfico de barras diario (solo para vista mensual)
  const dailyChartData = useMemo(() => {
    if (reportType !== 'monthly' || !reportData || !reportData.dailyData) return [];
    
    return reportData.dailyData.map(day => ({
      day: format(new Date(day.date), 'd MMM', { locale: es }),
      dayNumber: format(new Date(day.date), 'd'),
      date: day.date,
      reservations: day.reservations || 0,
      participants: day.participants || 0
    }));
  }, [reportData, reportType]);

  // Preparar datos para gráfico de servicios
  const serviceChartData = useMemo(() => {
    if (reportType !== 'monthly' || !reportData || !reportData.serviceBreakdown) return [];
    
    return Object.entries(reportData.serviceBreakdown).map(([service, data], index) => ({
      name: service,
      reservations: data.count,
      participants: data.participants,
      fill: colors[index % colors.length]
    }));
  }, [reportData, reportType]);

  // Preparar datos para gráfico anual
  const yearlyChartData = useMemo(() => {
    if (reportType !== 'yearly' || !reportData || !reportData.yearlyData) return [];
    
    return reportData.yearlyData.map(month => ({
      month: month.monthName,
      reservations: month.totalReservations,
      participants: month.totalParticipants
    }));
  }, [reportData, reportType]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(value);
  };

  const exportReport = () => {
    if (!reportData) {
      toast.error(t('reports.noDataToExport'));
      return;
    }

    try {
      const workbook = XLSX.utils.book_new();
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;

      if (reportType === 'monthly') {
        // === REPORTE MENSUAL ===
        const monthName = format(selectedDate, 'MMMM yyyy', { locale: es });

        // Hoja 1: Resumen
        const summaryData = [
          [`${t('reports.monthlyTitlePrefix')} ${monthName.toUpperCase()}`],
          [],
          [t('reports.metric'), t('reports.value')],
          [t('reports.totalReservations'), reportData.summary?.totalReservations || 0],
          [t('reports.totalParticipants'), reportData.summary?.totalParticipants || 0]
        ];
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        summarySheet['!cols'] = [{ wch: 30 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(workbook, summarySheet, t('reports.summary'));

        // Hoja 2: Datos Diarios
        if (reportData.dailyData && reportData.dailyData.length > 0) {
          const dailyHeaders = [[t('reports.date'), t('reports.reservations'), t('reports.participants')]];
          const dailyRows = reportData.dailyData.map(day => [
            format(new Date(day.date), 'dd/MM/yyyy', { locale: es }),
            day.reservations || 0,
            day.participants || 0
          ]);
          const dailyData = [...dailyHeaders, ...dailyRows];
          const dailySheet = XLSX.utils.aoa_to_sheet(dailyData);
          dailySheet['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
          XLSX.utils.book_append_sheet(workbook, dailySheet, t('reports.dailyData'));
        }

        // Hoja 3: Desglose por Servicios
        if (reportData.serviceBreakdown && Object.keys(reportData.serviceBreakdown).length > 0) {
          const serviceHeaders = [[t('reports.service'), t('reports.quantity'), t('reports.participants')]];
          const serviceRows = Object.entries(reportData.serviceBreakdown).map(([service, data]) => [
            service,
            data.count || 0,
            data.participants || 0
          ]);
          const serviceData = [...serviceHeaders, ...serviceRows];
          const serviceSheet = XLSX.utils.aoa_to_sheet(serviceData);
          serviceSheet['!cols'] = [{ wch: 40 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
          XLSX.utils.book_append_sheet(workbook, serviceSheet, t('reports.byServices'));
        }

        // Generar archivo
        const fileName = `Reporte_Mensual_${year}_${String(month).padStart(2, '0')}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        toast.success(t('reports.monthlyExportSuccess'));

      } else {
        // === REPORTE ANUAL ===
        const yearlyHeaders = [[t('reports.month'), t('reports.reservations'), t('reports.participants')]];
        const yearlyRows = reportData.yearlyData.map(month => [
          month.monthName,
          month.totalReservations || 0,
          month.totalParticipants || 0
        ]);

        // Agregar totales
        const totalReservations = reportData.yearlyData.reduce((sum, m) => sum + (m.totalReservations || 0), 0);
        const totalParticipants = reportData.yearlyData.reduce((sum, m) => sum + (m.totalParticipants || 0), 0);

        const yearlyData = [
          [`${t('reports.annualTitlePrefix')} ${year}`],
          [],
          ...yearlyHeaders,
          ...yearlyRows,
          [],
          [t('reports.totals'), totalReservations, totalParticipants]
        ];

        const yearlySheet = XLSX.utils.aoa_to_sheet(yearlyData);
        yearlySheet['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(workbook, yearlySheet, t('reports.annualReport'));

        // Generar archivo
        const fileName = `Reporte_Anual_${year}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        toast.success(t('reports.annualExportSuccess'));
      }

    } catch {
      toast.error(t('reports.exportError'));
    }
  };

  return (
    <div className="p-3 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
            <ChartBarIcon className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 flex-shrink-0" />
            <span className="truncate">Reportes de Reservas</span>
          </h1>
          <p className="text-xs sm:text-base text-gray-600 mt-1">
            Análisis detallado de tus reservas y rendimiento
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              <option value="monthly">Reporte Mensual</option>
              <option value="yearly">Reporte Anual</option>
            </select>
          </div>

          <button
            onClick={exportReport}
            className="px-3 sm:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 text-sm whitespace-nowrap"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Navegación de fecha */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex items-center justify-center gap-2 sm:gap-4">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            aria-label="Período anterior"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>

          <h2 className="text-base sm:text-xl font-semibold capitalize truncate">
            {reportType === 'monthly'
              ? format(selectedDate, 'MMMM yyyy', { locale: es })
              : `Año ${selectedDate.getFullYear()}`
            }
          </h2>

          <button
            onClick={() => navigateDate('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
            aria-label="Período siguiente"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Estado de carga */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      )}

      {/* Tarjetas de resumen */}
      {!loading && reportType === 'monthly' && reportData && reportData.summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 mb-4 sm:mb-6">
          <div className="bg-white p-3 sm:p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {reportData.summary.totalReservations}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 truncate">{t('dashboard.totalReservations')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-3 sm:p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <UserGroupIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold text-gray-900">
                  {reportData.summary.totalParticipants}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 truncate">{t('dashboard.totalTourists')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gráficos */}
      {!loading && reportData && (
      <div className="mb-4 sm:mb-6">
        {/* Gráfico principal */}
        <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6">
          <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4 flex-wrap">
            <h3 className="text-sm sm:text-lg font-semibold text-gray-900">
              {reportType === 'monthly' ? 'Reservas Diarias' : 'Reservas Mensuales'}
            </h3>
            <div className="flex items-center gap-2">
              {reportType === 'monthly' && (
                <>
                  {chartType === 'reservations' && <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />}
                  {chartType === 'participants' && <UserGroupIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />}
                  <select
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value)}
                    className="border border-gray-300 rounded-lg px-2 sm:px-3 py-1 text-xs sm:text-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="reservations">Reservas</option>
                    <option value="participants">Turistas</option>
                  </select>
                </>
              )}
              {reportType === 'yearly' && <ChartBarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />}
            </div>
          </div>

          <div className="h-48 sm:h-64">
            {reportType === 'monthly' && dailyChartData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <ChartBarIcon className="w-12 h-12 mb-3 text-gray-300" />
                <p className="text-sm font-medium">No hay datos de reservas para este período</p>
                <p className="text-xs mt-1 text-gray-400">Los datos aparecerán aquí cuando se registren reservas</p>
              </div>
            ) : (
            <ResponsiveContainer width="100%" height="100%">
              {reportType === 'monthly' ? (
                <Chart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => [
                      value,
                      chartType === 'reservations' ? 'Reservas' : 'Turistas'
                    ]}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Bar
                    dataKey={chartType}
                    fill={chartType === 'reservations' ? '#3B82F6' : '#10B981'}
                    radius={[4, 4, 0, 0]}
                  />
                </Chart>
            ) : (
              <LineChart data={yearlyChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [
                    value,
                    name === 'reservations' ? 'Reservas' : 'Turistas'
                  ]}
                />
                <Line type="monotone" dataKey="reservations" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="participants" stroke="#10B981" strokeWidth={2} />
              </LineChart>
              )}
            </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Tabla detallada por servicios */}
      {!loading && reportType === 'monthly' && serviceChartData.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-3 sm:p-6 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Detalle por Tipo de Servicio
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Servicio
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Reservas
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Turistas
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {serviceChartData.map((service, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div
                          className="w-3 h-3 sm:w-4 sm:h-4 rounded-full mr-2 sm:mr-3 flex-shrink-0"
                          style={{ backgroundColor: service.fill }}
                        ></div>
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {service.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {service.reservations}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {service.participants}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tabla anual */}
      {!loading && reportType === 'yearly' && reportData && reportData.yearlyData && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-3 sm:p-6 border-b border-gray-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Resumen Anual {reportData.year}
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Mes
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Reservas
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                    Turistas
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.yearlyData.map((month, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                      {month.monthName}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {month.totalReservations}
                    </td>
                    <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {month.totalParticipants}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgencyReports;