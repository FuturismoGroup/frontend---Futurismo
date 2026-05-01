import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import dashboardService from '../services/dashboardService';

const useServiceChart = () => {
  const [chartType, setChartType] = useState('line');
  
  // Validar chartType para asegurar que no sea 'pie'
  useEffect(() => {
    if (chartType === 'pie') {
      setChartType('line');
    }
  }, [chartType]);
  const [timeRange, setTimeRange] = useState('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  // Estados para los datos - INICIALIZADOS VACÍOS, NO HARDCODEADOS
  const [lineData, setLineData] = useState([]);
  const [barData, setBarData] = useState([]);
  const [kpiData, setKpiData] = useState({
    totalReservas: { actual: 0, anterior: 0, crecimiento: 0 },
    totalTuristas: { actual: 0, anterior: 0, crecimiento: 0 },
    ingresosTotales: { actual: 0, anterior: 0, crecimiento: 0 }
  });
  const [summaryData, setSummaryData] = useState({
    popularTour: t('common.noData'),
    avgPerBooking: 0,
    bestDay: t('common.noData'),
    conversionRate: 0
  });

  // Cargar datos cuando cambia el timeRange
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Obtener datos básicos de la nueva API
        const [stats, kpis, chartData, summary] = await Promise.all([
          dashboardService.getDashboardStats(timeRange),
          dashboardService.getKPIs(timeRange),
          dashboardService.getChartData('line', timeRange),
          dashboardService.getSummaryData(timeRange)
        ]);

        // Usar datos obtenidos desde la API (ya con fallbacks en el backend)
        setLineData(Array.isArray(chartData) ? chartData : []);

        // Obtener barData desde el mismo endpoint o usar fallback vacío
        const barResult = await dashboardService.getChartData('bar', timeRange);
        setBarData(Array.isArray(barResult) ? barResult : []);

        setKpiData(kpis || {
          totalReservas: { actual: 0, anterior: 0, crecimiento: 0 },
          totalTuristas: { actual: 0, anterior: 0, crecimiento: 0 },
          ingresosTotales: { actual: 0, anterior: 0, crecimiento: 0 }
        });
        setSummaryData(summary || {
          popularTour: t('common.noData'),
          avgPerBooking: 0,
          bestDay: t('common.noData'),
          conversionRate: 0
        });
      } catch (err) {
        setError(err.message);
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange, t]);

  const timeRangeOptions = [
    { value: 'week', label: t('dashboard.chart.timeRange.week') },
    { value: 'month', label: t('dashboard.chart.timeRange.month') },
    { value: 'quarter', label: t('dashboard.chart.timeRange.quarter') },
    { value: 'year', label: t('dashboard.chart.timeRange.year') }
  ];

  const chartTypeOptions = [
    { value: 'line', label: t('dashboard.chart.types.line') },
    { value: 'bar', label: t('dashboard.chart.types.bar') }
  ];

  return {
    chartType,
    setChartType,
    timeRange,
    setTimeRange,
    lineData,
    barData,
    kpiData,
    summaryData,
    timeRangeOptions,
    chartTypeOptions,
    loading,
    error
  };
};

export default useServiceChart;