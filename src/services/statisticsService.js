import i18next from 'i18next';
/**
 * Servicio de estadísticas
 * Maneja toda la lógica de estadísticas y reportes con el backend
 */

import BaseService from './baseService';
import { APP_CONFIG } from '../config/app.config';


class StatisticsService extends BaseService {
  constructor() {
    super('/statistics');
  }

  /**
   * Obtener estadísticas diarias
   * @param {Date} date - Fecha específica
   * @returns {Promise<Object>}
   */
  async getDailyStatistics(date = new Date()) {
return this.get('/daily', { date: date.toISOString() });
  }

  /**
   * Obtener estadísticas semanales
   * @param {Date} startDate - Fecha de inicio de la semana
   * @returns {Promise<Object>}
   */
  async getWeeklyStatistics(startDate = new Date()) {
return this.get('/weekly', { startDate: startDate.toISOString() });
  }

  /**
   * Obtener estadísticas mensuales
   * @param {number} year - Año
   * @param {number} month - Mes (1-12)
   * @returns {Promise<Object>}
   */
  async getMonthlyStatistics(year = new Date().getFullYear(), month = new Date().getMonth() + 1) {
return this.get('/monthly', { year, month });
  }

  /**
   * Obtener estadísticas anuales
   * @param {number} year - Año
   * @returns {Promise<Object>}
   */
  async getYearlyStatistics(year = new Date().getFullYear()) {
return this.get('/yearly', { year });
  }

  /**
   * Obtener estadísticas personalizadas por rango de fechas
   * @param {Date} startDate - Fecha inicial
   * @param {Date} endDate - Fecha final
   * @param {string} groupBy - Agrupación (day, week, month)
   * @returns {Promise<Object>}
   */
  async getCustomStatistics(startDate, endDate, groupBy = 'day') {
return this.get('/custom', {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      groupBy
    });
  }

  /**
   * Obtener estadísticas por tour
   * @param {string} tourId - ID del tour
   * @param {string} period - Período (day, week, month, year)
   * @returns {Promise<Object>}
   */
  async getTourStatistics(tourId, period = 'month') {
return this.get(`/tour/${tourId}`, { period });
  }

  /**
   * Obtener estadísticas por guía
   * @param {string} guideId - ID del guía
   * @param {string} period - Período (day, week, month, year)
   * @returns {Promise<Object>}
   */
  async getGuideStatistics(guideId, period = 'month') {
return this.get(`/guide/${guideId}`, { period });
  }

  /**
   * Obtener estadísticas de ocupación
   * @param {string} period - Período (week, month)
   * @returns {Promise<Object>}
   */
  async getOccupancyStatistics(period = 'week') {
return this.get('/occupancy', { period });
  }

  /**
   * Obtener KPIs principales
   * @returns {Promise<Object>}
   */
  async getKPIs() {
return this.get('/kpis');
  }

  /**
   * Obtener proyecciones futuras
   * @param {number} months - Número de meses a proyectar
   * @returns {Promise<Object>}
   */
  async getProjections(months = 3) {
return this.get('/projections', { months });
  }

  /**
   * Obtener comparación con período anterior
   * @param {string} metric - Métrica a comparar
   * @param {string} period - Período (day, week, month, year)
   * @returns {Promise<Object>}
   */
  async getComparison(metric, period = 'month') {

return this.get('/comparison', { metric, period });
  }

  /**
   * Obtener dashboard de estadísticas
   * Usa API-018: GET /api/dashboard/summary
   * @returns {Promise<Object>}
   */
  async getDashboard() {
    // Llama al endpoint real del backend: /api/dashboard/summary
    // El baseURL ya incluye /api, pero /dashboard es una ruta raiz, no de /statistics
    try {
      const response = await this.api.get('/dashboard/summary');

      if (response.data && typeof response.data === 'object') {
        // Mapear respuesta del backend al formato esperado por el store
        const data = response.data;
        return {
          success: true,
          data: {
            kpis: {
              totalReservations: data.totalReservations || 0,
              totalRevenue: data.totalRevenue || 0,
              totalClients: data.totalClients || 0,
              totalGuides: data.totalGuides || 0,
              averageGroupSize: data.averageGroupSize || 0
            },
            daily: null,
            weekly: null,
            monthly: {
              topDestinations: data.topDestinations || [],
              topGuides: data.topGuides || [],
              revenueByMonth: data.revenueByMonth || [],
              reservationsByStatus: data.reservationsByStatus || {}
            }
          }
        };
      }

      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || i18next.t('errors.unexpectedError')
      };
    }
  }

  /**
   * Generar reporte en PDF
   * @param {Object} options - Opciones del reporte
   * @returns {Promise<Blob>}
   */
  async generateReport(options = {}) {

const response = await this.post('/report', options, {
      responseType: 'blob'
    });

    return response.data;
  }

  /**
   * Exportar estadísticas a Excel
   * @param {Object} filters - Filtros para exportación
   * @returns {Promise<Blob>}
   */
  async exportToExcel(filters = {}) {

const response = await this.get('/export', filters, {
      responseType: 'blob'
    });

    return response.data;
  }

  /**
   * Obtener tendencias históricas
   * @param {string} metric - Métrica a analizar
   * @param {number} months - Número de meses hacia atrás
   * @returns {Promise<Object>}
   */
  async getHistoricalTrends(metric, months = 6) {

return this.get('/trends', { metric, months });
  }

  /**
   * Obtener análisis de temporada
   * @param {number} year - Año a analizar
   * @returns {Promise<Object>}
   */
  async getSeasonalAnalysis(year = new Date().getFullYear()) {

return this.get('/seasonal', { year });
  }
}

const statisticsService = new StatisticsService();
export default statisticsService;