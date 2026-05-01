import { create } from 'zustand';
import i18next from 'i18next';
import statisticsService from '../services/statisticsService';

const useStatisticsStore = create((set, get) => ({
  // Estado
  dailyStats: null,
  weeklyStats: null,
  monthlyStats: null,
  yearlyStats: null,
  kpis: null,
  customStats: null,
  tourStats: {},
  guideStats: {},
  occupancyStats: null,
  projections: null,
  selectedPeriod: 'month',
  isLoading: false,
  error: null,

  // Acciones para cargar estadísticas
  loadDailyStatistics: async (date = new Date()) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await statisticsService.getDailyStatistics(date);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({
        dailyStats: result.data,
        isLoading: false
      });
      
      return result.data;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  loadWeeklyStatistics: async (startDate = new Date()) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await statisticsService.getWeeklyStatistics(startDate);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({
        weeklyStats: result.data,
        isLoading: false
      });
      
      return result.data;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  loadMonthlyStatistics: async (year = new Date().getFullYear(), month = new Date().getMonth() + 1) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await statisticsService.getMonthlyStatistics(year, month);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({
        monthlyStats: result.data,
        isLoading: false
      });
      
      return result.data;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  loadYearlyStatistics: async (year = new Date().getFullYear()) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await statisticsService.getYearlyStatistics(year);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({
        yearlyStats: result.data,
        isLoading: false
      });
      
      return result.data;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  loadCustomStatistics: async (startDate, endDate, groupBy = 'day') => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await statisticsService.getCustomStatistics(startDate, endDate, groupBy);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({
        customStats: result.data,
        isLoading: false
      });
      
      return result.data;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  loadTourStatistics: async (tourId, period = 'month') => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await statisticsService.getTourStatistics(tourId, period);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set((state) => ({
        tourStats: {
          ...state.tourStats,
          [tourId]: result.data
        },
        isLoading: false
      }));
      
      return result.data;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  loadGuideStatistics: async (guideId, period = 'month') => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await statisticsService.getGuideStatistics(guideId, period);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set((state) => ({
        guideStats: {
          ...state.guideStats,
          [guideId]: result.data
        },
        isLoading: false
      }));
      
      return result.data;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  loadOccupancyStatistics: async (period = 'week') => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await statisticsService.getOccupancyStatistics(period);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({
        occupancyStats: result.data,
        isLoading: false
      });
      
      return result.data;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  loadKPIs: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await statisticsService.getKPIs();
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({
        kpis: result.data,
        isLoading: false
      });
      
      return result.data;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  loadProjections: async (months = 3) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await statisticsService.getProjections(months);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({
        projections: result.data,
        isLoading: false
      });
      
      return result.data;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  // Cargar dashboard completo
  loadDashboard: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await statisticsService.getDashboard();
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({
        dailyStats: result.data.daily,
        weeklyStats: result.data.weekly,
        monthlyStats: result.data.monthly,
        kpis: result.data.kpis,
        isLoading: false
      });
      
      return result.data;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  // Obtener comparación con período anterior
  getComparison: async (metric, period = 'month') => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await statisticsService.getComparison(metric, period);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({ isLoading: false });
      
      return result.data;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  // Obtener tendencias históricas
  getHistoricalTrends: async (metric, months = 6) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await statisticsService.getHistoricalTrends(metric, months);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({ isLoading: false });
      
      return result.data;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  // Obtener análisis de temporada
  getSeasonalAnalysis: async (year = new Date().getFullYear()) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await statisticsService.getSeasonalAnalysis(year);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({ isLoading: false });
      
      return result.data;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  // Generar reporte PDF
  generateReport: async (options = {}) => {
    set({ isLoading: true, error: null });
    
    try {
      const blob = await statisticsService.generateReport(options);
      
      set({ isLoading: false });
      
      return blob;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  // Exportar a Excel
  exportToExcel: async (filters = {}) => {
    set({ isLoading: true, error: null });
    
    try {
      const blob = await statisticsService.exportToExcel(filters);
      
      set({ isLoading: false });
      
      return blob;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  // Establecer período seleccionado
  setSelectedPeriod: (period) => set({ selectedPeriod: period }),

  // Obtener resumen de estadísticas actuales
  getCurrentStats: () => {
    const { dailyStats, weeklyStats, monthlyStats, yearlyStats, selectedPeriod } = get();
    
    switch (selectedPeriod) {
      case 'day':
        return dailyStats;
      case 'week':
        return weeklyStats;
      case 'month':
        return monthlyStats;
      case 'year':
        return yearlyStats;
      default:
        return monthlyStats;
    }
  },

  // Obtener estadísticas para gráficos
  getChartData: (metric, period = 'month') => {
    const stats = get().getCurrentStats();
    
    if (!stats) return null;
    
    // Transformar datos según el métrico solicitado
    switch (metric) {
      case 'revenue':
        return {
          labels: stats.data?.map(d => d.date) || [],
          values: stats.data?.map(d => d.revenue) || []
        };
      case 'reservations':
        return {
          labels: stats.data?.map(d => d.date) || [],
          values: stats.data?.map(d => d.reservations) || []
        };
      case 'tourists':
        return {
          labels: stats.data?.map(d => d.date) || [],
          values: stats.data?.map(d => d.tourists) || []
        };
      default:
        return null;
    }
  },

  // Limpiar estadísticas
  clearStatistics: () => {
    set({
      dailyStats: null,
      weeklyStats: null,
      monthlyStats: null,
      yearlyStats: null,
      kpis: null,
      customStats: null,
      tourStats: {},
      guideStats: {},
      occupancyStats: null,
      projections: null
    });
  },

  // Establecer estado de carga
  setLoading: (isLoading) => set({ isLoading }),

  // Establecer error
  setError: (error) => set({ error }),

  // Limpiar error
  clearError: () => set({ error: null }),

  // Limpiar store
  clearStore: () => {
    set({
      dailyStats: null,
      weeklyStats: null,
      monthlyStats: null,
      yearlyStats: null,
      kpis: null,
      customStats: null,
      tourStats: {},
      guideStats: {},
      occupancyStats: null,
      projections: null,
      selectedPeriod: 'month',
      isLoading: false,
      error: null
    });
  }
}));

export { useStatisticsStore };
export default useStatisticsStore;