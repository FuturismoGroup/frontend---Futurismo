/**
 * Servicio de guías
 * Maneja toda la lógica de guías con el backend
 */

import BaseService from './baseService';
import { APP_CONFIG } from '../config/app.config';


class GuidesService extends BaseService {
  constructor() {
    super('/guides');
  }

  /**
   * Obtener todos los guías
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Object>}
   */
  async getGuides(filters = {}) {
return this.get('', filters);
  }

  /**
   * Obtener guía por ID
   * @param {string} id - ID del guía
   * @returns {Promise<Object>}
   */
  async getGuideById(id) {
return this.get(`/${id}`);
  }

  /**
   * Crear nuevo guía
   * @param {Object} guideData - Datos del guía
   * @returns {Promise<Object>}
   */
  async createGuide(guideData) {
return this.post('', guideData);
  }

  /**
   * Actualizar guía
   * @param {string} id - ID del guía
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>}
   */
  async updateGuide(id, updateData) {
return this.put(`/${id}`, updateData);
  }

  /**
   * Eliminar guía
   * @param {string} id - ID del guía
   * @returns {Promise<Object>}
   */
  async deleteGuide(id) {
return this.delete(`/${id}`);
  }

  /**
   * Actualizar estado del guía
   * @param {string} id - ID del guía
   * @param {string} status - Nuevo estado
   * @returns {Promise<Object>}
   */
  async updateGuideStatus(id, status) {
return this.patch(`/${id}/status`, { status });
  }

  /**
   * Obtener agenda del guía
   * @param {string} guideId - ID del guía
   * @param {Object} params - { startDate, endDate }
   * @returns {Promise<Object>}
   */
  async getGuideAgenda(guideId, params = {}) {
return this.get(`/${guideId}/agenda`, params);
  }

  /**
   * Obtener estadísticas del guía
   * @param {string} guideId - ID del guía
   * @param {Object} params - Parámetros de filtrado
   * @returns {Promise<Object>}
   */
  async getGuideStats(guideId, params = {}) {
return this.get(`/${guideId}/stats`, params);
  }

  /**
   * Obtener certificaciones del guía
   * @param {string} guideId - ID del guía
   * @returns {Promise<Object>}
   */
  async getGuideCertifications(guideId) {
return this.get(`/${guideId}/certifications`);
  }

  /**
   * Agregar certificación al guía
   * @param {string} guideId - ID del guía
   * @param {Object} certification - Datos de la certificación
   * @returns {Promise<Object>}
   */
  async addGuideCertification(guideId, certification) {
return this.post(`/${guideId}/certifications`, certification);
  }

  /**
   * Eliminar certificación del guía
   * @param {string} guideId - ID del guía
   * @param {string} certificationId - ID de la certificación
   * @returns {Promise<Object>}
   */
  async removeGuideCertification(guideId, certificationId) {
return this.delete(`/${guideId}/certifications/${certificationId}`);
  }

  /**
   * Obtener tours asignados al guía
   * @param {string} guideId - ID del guía
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Object>}
   */
  async getGuideTours(guideId, filters = {}) {
return this.get(`/${guideId}/tours`, filters);
  }

  /**
   * Actualizar especialización del guía
   * @param {string} guideId - ID del guía
   * @param {Object} specialization - Datos de especialización
   * @returns {Promise<Object>}
   */
  async updateGuideSpecialization(guideId, specialization) {
return this.put(`/${guideId}/specialization`, specialization);
  }

  /**
   * Buscar guías por competencias
   * @param {Object} requirements - Requisitos de búsqueda
   * @returns {Promise<Object>}
   */
  async searchByCompetencies(requirements) {
return this.post('/search-competencies', requirements);
  }

  /**
   * Importar guías desde archivo
   * @param {File} file - Archivo a importar
   * @param {Function} onProgress - Callback de progreso
   * @returns {Promise<Object>}
   */
  async importGuides(file, onProgress = null) {
return this.upload('/import', file, onProgress);
  }

  /**
   * Exportar guías
   * @param {Object} filters - Filtros de exportación
   * @param {string} format - Formato de exportación (csv, excel, pdf)
   * @returns {Promise<Object>}
   */
  async exportGuides(filters = {}, format = 'excel') {
const filename = `guides_${new Date().toISOString().split('T')[0]}.${format}`;
    return this.download('/export', filename, { ...filters, format });
  }

  /**
   * Obtener resumen de guías
   * @returns {Promise<Object>}
   */
  async getGuidesSummary() {
return this.get('/summary');
  }

  /**
   * Validar disponibilidad de guías para un tour
   * @param {Object} params - { date, time, duration, languages, museums }
   * @returns {Promise<Object>}
   */
  async checkGuidesAvailability(params) {
return this.post('/check-availability', params);
  }
}

const guidesService = new GuidesService();
export default guidesService;