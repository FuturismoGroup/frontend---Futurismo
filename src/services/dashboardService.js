import i18next from 'i18next';
/**
 * Servicio de dashboard
 * Maneja las estadísticas y métricas del dashboard
 */

import BaseService from './baseService';

class DashboardService extends BaseService {
  constructor() {
    super('/dashboard');
  }

  /**
   * Obtener estadísticas del dashboard según el rol del usuario
   * @param {string} userId - ID del usuario
   * @param {string} role - Rol del usuario (guide, agency, admin)
   * @returns {Promise<Object>}
   */
  async getStats(userId, role) {

return this.get('/stats', { userId, role });
  }

  /**
   * Obtener datos para gráficos mensuales
   * @param {string} userId - ID del usuario
   * @param {string} role - Rol del usuario
   * @param {number} months - Número de meses hacia atrás
   * @returns {Promise<Object>}
   */
  async getMonthlyData(userId, role, months = 6) {

return this.get('/monthly-data', { userId, role, months });
  }

  // Mantener compatibilidad con métodos existentes
  async getDashboardStats(timeRange = 'month') {
    const monthlyData = await this.getMonthlyData('current', 'admin', 7);
    return {
      lineData: monthlyData.data,
      barData: [],
      pieData: [],
      kpiData: {},
      summaryData: {}
    };
  }

  async getKPIs(timeRange = 'month') {
    try {
      const result = await this.get('/kpis', { timeRange });
      return result.data;
    } catch {
      return {
        totalReservas: { actual: 0, anterior: 0, crecimiento: 0 },
        totalTuristas: { actual: 0, anterior: 0, crecimiento: 0 },
        ingresosTotales: { actual: 0, anterior: 0, crecimiento: 0 }
      };
    }
  }

  async getChartData(chartType, timeRange = 'month') {
    try {
      const result = await this.get('/chart-data', { type: chartType, timeRange });
      return result.data;
    } catch {
      return [];
    }
  }

  async getSummaryData(timeRange = 'month') {
    try {
      const result = await this.get('/summary-data', { timeRange });
      return result.data;
    } catch {
      return {
        popularTour: i18next.t('common.noData'),
        avgPerBooking: 0,
        bestDay: i18next.t('common.noData'),
        conversionRate: 0
      };
    }
  }
}

const dashboardService = new DashboardService();

export default dashboardService;