/**
 * Servicio de agenda independiente para guías
 * Maneja toda la lógica de agenda personal y tours asignados
 */

import BaseService from './baseService';
import { APP_CONFIG } from '../config/app.config';


class IndependentAgendaService extends BaseService {
  constructor() {
    // Usar endpoint vacío ya que los paths en los métodos incluyen /guides
    super('');
  }

  /**
   * Obtener eventos personales del guía
   * @param {string} guideId - ID del guía
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Object>}
   */
  async getPersonalEvents(guideId, filters = {}) {
return this.get(`/guides/${guideId}/personal-events`, filters);
  }

  /**
   * Crear evento personal
   * @param {string} guideId - ID del guía
   * @param {Object} eventData - Datos del evento
   * @returns {Promise<Object>}
   */
  async createPersonalEvent(guideId, eventData) {
return this.post(`/guides/${guideId}/personal-events`, eventData);
  }

  /**
   * Actualizar evento personal
   * @param {string} guideId - ID del guía
   * @param {string} eventId - ID del evento
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>}
   */
  async updatePersonalEvent(guideId, eventId, updateData) {
return this.put(`/guides/${guideId}/personal-events/${eventId}`, updateData);
  }

  /**
   * Eliminar evento personal
   * @param {string} guideId - ID del guía
   * @param {string} eventId - ID del evento
   * @returns {Promise<Object>}
   */
  async deletePersonalEvent(guideId, eventId) {
return this.delete(`/guides/${guideId}/personal-events/${eventId}`);
  }

  /**
   * Marcar tiempo como ocupado
   * @param {string} guideId - ID del guía
   * @param {Object} timeSlotData - Datos del slot de tiempo
   * @returns {Promise<Object>}
   */
  async markTimeAsOccupied(guideId, timeSlotData) {
return this.post(`/guides/${guideId}/occupied-time`, timeSlotData);
  }

  /**
   * Obtener tours asignados del guía
   * @param {string} guideId - ID del guía
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Object>}
   */
  async getAssignedTours(guideId, filters = {}) {
    return this.get(`/guides/${guideId}/tours`, filters);
  }

  /**
   * Asignar tour a guía (API-020)
   * POST /api/guides/:guideId/tours
   * @param {string} guideId - ID del guía
   * @param {Object} tourData - Datos del tour
   * @returns {Promise<Object>}
   */
  async assignTourToGuide(guideId, tourData) {
    return this.post(`/guides/${guideId}/tours`, tourData);
  }

  /**
   * Actualizar tour asignado
   * @param {string} guideId - ID del guía
   * @param {string} tourId - ID del tour
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>}
   */
  async updateAssignedTour(guideId, tourId, updateData) {
    return this.put(`/guides/${guideId}/tours/${tourId}`, updateData);
  }

  /**
   * Remover tour asignado
   * @param {string} guideId - ID del guía
   * @param {string} tourId - ID del tour
   * @returns {Promise<Object>}
   */
  async removeAssignedTour(guideId, tourId) {
    return this.delete(`/guides/${guideId}/tours/${tourId}`);
  }

  /**
   * Obtener horarios de trabajo del guía
   * @param {string} guideId - ID del guía
   * @returns {Promise<Object>}
   */
  async getWorkingHours(guideId) {
return this.get(`/guides/${guideId}/working-hours`);
  }

  /**
   * Actualizar horarios de trabajo
   * @param {string} guideId - ID del guía
   * @param {Object} schedule - Horarios por día
   * @returns {Promise<Object>}
   */
  async updateWorkingHours(guideId, schedule) {
return this.put(`/guides/${guideId}/working-hours`, schedule);
  }

  /**
   * Obtener disponibilidad de múltiples guías
   * @param {Array<string>} guideIds - IDs de los guías
   * @param {string} date - Fecha a consultar
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async getMultipleGuidesAvailability(guideIds, date, options = {}) {

return this.post('/guides/availability/multiple', {
      guideIds,
      date,
      ...options
    });
  }

  /**
   * Obtener agenda completa del guía
   * @param {string} guideId - ID del guía
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Object>}
   */
  async getGuideCompleteAgenda(guideId, filters = {}) {
return this.get(`/guides/${guideId}/complete-agenda`, filters);
  }

  /**
   * Obtener estadísticas del guía
   * @param {string} guideId - ID del guía
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Object>}
   */
  async getGuideStats(guideId, filters = {}) {
return this.get(`/guides/${guideId}/stats`, filters);
  }

  /**
   * Buscar slots disponibles para un tour
   * @param {Object} requirements - Requisitos del tour
   * @returns {Promise<Object>}
   */
  async findAvailableSlots(requirements) {

return this.post('/availability/search', requirements);
  }

  /**
   * Verificar conflictos de horario
   * @param {string} guideId - ID del guía
   * @param {Object} eventData - Datos del evento a verificar
   * @returns {Promise<Object>}
   */
  async checkScheduleConflicts(guideId, eventData) {

return this.post(`/guides/${guideId}/check-conflicts`, eventData);
  }

  /**
   * Exportar agenda del guía
   * @param {string} guideId - ID del guía
   * @param {Object} options - Opciones de exportación
   * @returns {Promise<Object>}
   */
  async exportAgenda(guideId, options = {}) {

return this.get(`/guides/${guideId}/export`, options);
  }

  /**
   * Sincronizar con calendario externo
   * @param {string} guideId - ID del guía
   * @param {Object} syncData - Datos de sincronización
   * @returns {Promise<Object>}
   */
  async syncWithExternalCalendar(guideId, syncData) {

return this.post(`/guides/${guideId}/sync`, syncData);
  }

  /**
   * Limpiar eventos antiguos
   * @param {string} guideId - ID del guía
   * @param {number} daysToKeep - Días a mantener
   * @returns {Promise<Object>}
   */
  async clearOldEvents(guideId, daysToKeep = 30) {
return this.delete(`/guides/${guideId}/events/old`, { daysToKeep });
  }

  /**
   * Obtener plantillas de eventos
   * @returns {Promise<Object>}
   */
  async getEventTemplates() {

return this.get('/event-templates');
  }
}

const independentAgendaService = new IndependentAgendaService();
export default independentAgendaService;