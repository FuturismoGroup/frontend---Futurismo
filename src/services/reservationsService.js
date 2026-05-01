/**
 * Servicio de reservaciones
 * Maneja toda la lógica de reservaciones con el backend
 */

import BaseService from './baseService';
import { APP_CONFIG } from '../config/app.config';


class ReservationsService extends BaseService {
  constructor() {
    super('/reservations');
  }

  /**
   * Crear nueva reservación
   * @param {Object} reservationData - Datos de la reservación
   * @returns {Promise<Object>}
   */
  async createReservation(reservationData) {
return this.post('', reservationData);
  }

  /**
   * Obtener todas las reservaciones
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Object>}
   */
  async getReservations(filters = {}) {
return this.get('', filters);
  }

  /**
   * Obtener reservación por ID
   * @param {string} id - ID de la reservación
   * @returns {Promise<Object>}
   */
  async getReservationById(id) {
return this.get(`/${id}`);
  }

  /**
   * Cambiar estado de reservación
   * @param {string} id - ID de la reservación
   * @param {string} status - Nuevo estado
   * @param {string} cancellationReason - Razón de cancelación (requerida si status es 'cancelled')
   * @returns {Promise<Object>}
   */
  async updateStatus(id, status, cancellationReason = null) {
    const payload = { status };
    if (cancellationReason) {
      payload.cancellationReason = cancellationReason;
    }
    return this.patch(`/${id}/status`, payload);
  }

  /**
   * Cancelar reservación
   * @param {string} id - ID de la reservación
   * @param {string} reason - Razón de cancelación
   * @returns {Promise<Object>}
   */
  async cancelReservation(id, reason) {
    return this.patch(`/${id}/status`, {
      status: 'cancelled',
      cancellationReason: reason
    });
  }

  /**
   * Asignar guía a reservación
   * @param {string} reservationId - ID de la reservación
   * @param {string} guideId - ID del guía
   * @returns {Promise<Object>}
   */
  async assignGuide(reservationId, guideId) {
    return this.patch(`/${reservationId}/assign-guide`, { guideId });
  }

  /**
   * Generar voucher para reservación
   * @param {string} id - ID de la reservación
   * @returns {Promise<Object>}
   */
  async generateVoucher(id) {
return this.get(`/${id}/voucher`);
  }

  /**
   * Descargar voucher PDF
   * @param {string} id - ID de la reservación
   * @returns {Promise<Object>}
   */
  async downloadVoucherPDF(id) {
return this.download(`/${id}/voucher/pdf`, `voucher_${id}.pdf`);
  }

  /**
   * Obtener estadísticas de reservaciones
   * @param {Object} params - Parámetros de filtrado
   * @returns {Promise<Object>}
   */
  async getReservationStats(params = {}) {
return this.get('/stats', params);
  }

  /**
   * Buscar reservaciones
   * @param {string} query - Término de búsqueda
   * @param {Object} filters - Filtros adicionales
   * @returns {Promise<Object>}
   */
  async searchReservations(query, filters = {}) {
return this.get('/search', { q: query, ...filters });
  }

  /**
   * Validar disponibilidad
   * @param {Object} params - { serviceType, date, time, touristsCount }
   * @returns {Promise<Object>}
   */
  async checkAvailability(params) {
return this.post('/check-availability', params);
  }

  /**
   * Obtener tours disponibles para una fecha
   * @param {string} date - Fecha en formato YYYY-MM-DD
   * @returns {Promise<Object>}
   */
  async getAvailableTours(date) {
return this.get('/available-tours', { date });
  }

  /**
   * Duplicar reservación
   * @param {string} id - ID de la reservación a duplicar
   * @param {Object} newData - Datos nuevos para la copia
   * @returns {Promise<Object>}
   */
  async duplicateReservation(id, newData = {}) {
return this.post(`/${id}/duplicate`, newData);
  }

  /**
   * Exportar reservaciones
   * @param {Object} filters - Filtros de exportación
   * @param {string} format - Formato de exportación (csv, excel, pdf)
   * @returns {Promise<Object>}
   */
  async exportReservations(filters = {}, format = 'excel') {
const filename = `reservations_${new Date().toISOString().split('T')[0]}.${format}`;
    return this.download('/export', filename, { ...filters, format });
  }

  /**
   * Obtener historial de ejecución de un servicio
   * Incluye: progreso de paradas, fotos, notas del guía
   * @param {string} id - ID de la reservación
   * @returns {Promise<Object>}
   */
  async getExecutionHistory(id) {
    return this.get(`/${id}/execution-history`);
  }
}

const reservationsService = new ReservationsService();
export default reservationsService;