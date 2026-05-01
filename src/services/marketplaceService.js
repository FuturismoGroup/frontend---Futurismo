/**
 * Servicio de marketplace
 * Maneja toda la lógica del marketplace de guías con el backend
 */

import BaseService from './baseService';
import { APP_CONFIG } from '../config/app.config';


class MarketplaceService extends BaseService {
  constructor() {
    super('/marketplace');
  }

  /**
   * Obtener guías freelance disponibles
   * @param {Object} filters - Filtros de búsqueda
   * @returns {Promise<Object>}
   */
  async getFreelanceGuides(filters = {}) {
return this.get('/guides', filters);
  }

  /**
   * Obtener perfil completo de un guía
   * @param {string} guideId - ID del guía
   * @returns {Promise<Object>}
   */
  async getGuideProfile(guideId) {
return this.get(`/guides/${guideId}`);
  }

  /**
   * Obtener reseñas de un guía
   * @param {string} guideId - ID del guía
   * @param {Object} params - Parámetros de paginación
   * @returns {Promise<Object>}
   */
  async getGuideReviews(guideId, params = {}) {
return this.get(`/guides/${guideId}/reviews`, params);
  }

  /**
   * Crear solicitud de servicio
   * @param {Object} requestData - Datos de la solicitud
   * @returns {Promise<Object>}
   */
  async createServiceRequest(requestData) {
return this.post('/service-requests', requestData);
  }

  /**
   * Obtener solicitudes de servicio
   * @param {Object} filters - Filtros
   * @returns {Promise<Object>}
   */
  async getServiceRequests(filters = {}) {
return this.get('/service-requests', filters);
  }

  /**
   * Obtener solicitud de servicio por ID
   * @param {string} requestId - ID de la solicitud
   * @returns {Promise<Object>}
   */
  async getServiceRequestById(requestId) {
return this.get(`/service-requests/${requestId}`);
  }

  /**
   * Actualizar solicitud de servicio
   * @param {string} requestId - ID de la solicitud
   * @param {Object} updates - Actualizaciones
   * @returns {Promise<Object>}
   */
  async updateServiceRequest(requestId, updates) {
return this.patch(`/service-requests/${requestId}`, updates);
  }

  /**
   * Responder a solicitud de servicio (guía)
   * @param {string} requestId - ID de la solicitud
   * @param {Object} response - { accepted, message, proposedRate }
   * @returns {Promise<Object>}
   */
  async respondToServiceRequest(requestId, response) {
return this.post(`/service-requests/${requestId}/respond`, response);
  }

  /**
   * Cancelar solicitud de servicio
   * @param {string} requestId - ID de la solicitud
   * @param {string} reason - Razón de cancelación
   * @returns {Promise<Object>}
   */
  async cancelServiceRequest(requestId, reason) {
return this.post(`/service-requests/${requestId}/cancel`, { reason });
  }

  /**
   * Completar servicio
   * @param {string} requestId - ID de la solicitud
   * @param {Object} completionData - Datos de finalización
   * @returns {Promise<Object>}
   */
  async completeService(requestId, completionData) {
return this.post(`/service-requests/${requestId}/complete`, completionData);
  }

  /**
   * Crear reseña
   * @param {Object} reviewData - Datos de la reseña
   * @returns {Promise<Object>}
   */
  async createReview(reviewData) {
return this.post('/reviews', reviewData);
  }

  /**
   * Obtener estadísticas del marketplace
   * @returns {Promise<Object>}
   */
  async getMarketplaceStats() {
return this.get('/stats');
  }

  /**
   * Obtener estadísticas de un guía
   * @param {string} guideId - ID del guía
   * @returns {Promise<Object>}
   */
  async getGuideStats(guideId) {
return this.get(`/guides/${guideId}/stats`);
  }

  /**
   * Actualizar perfil de marketplace del guía
   * @param {string} guideId - ID del guía
   * @param {Object} profileData - Datos del perfil
   * @returns {Promise<Object>}
   */
  async updateGuideMarketplaceProfile(guideId, profileData) {
return this.put(`/guides/${guideId}/profile`, profileData);
  }

  /**
   * Actualizar tarifa por persona del guía freelance
   */
  async updateGuideRate(guideId, data) {
    return this.put(`/guides/${guideId}/rate`, data);
  }

  /**
   * Verificar disponibilidad del guía en una fecha
   */
  async checkDateAvailability(guideId, date) {
    return this.get(`/guides/${guideId}/check-date-availability`, { date });
  }

  /**
   * Toggle disponibilidad online/offline del guía freelance
   */
  async toggleGuideOnline(guideId, online) {
    return this.put(`/guides/${guideId}/online`, { online });
  }

  /**
   * Verificar guía
   * @param {string} guideId - ID del guía
   * @param {Object} verificationData - Datos de verificación
   * @returns {Promise<Object>}
   */
  async verifyGuide(guideId, verificationData) {
return this.post(`/guides/${guideId}/verify`, verificationData);
  }

  /**
   * Suspender guía del marketplace
   * @param {string} guideId - ID del guía
   * @param {Object} suspensionData - { reason, until }
   * @returns {Promise<Object>}
   */
  async suspendGuide(guideId, suspensionData) {
return this.post(`/guides/${guideId}/suspend`, suspensionData);
  }

  /**
   * Reactivar guía en marketplace
   * @param {string} guideId - ID del guía
   * @returns {Promise<Object>}
   */
  async reactivateGuide(guideId) {
return this.post(`/guides/${guideId}/reactivate`);
  }

  /**
   * Obtener guías destacados
   * @returns {Promise<Object>}
   */
  async getFeaturedGuides() {
return this.get('/guides/featured');
  }

  /**
   * Buscar guías por competencias
   * @param {Object} requirements - { museums, languages, tourTypes, etc }
   * @returns {Promise<Object>}
   */
  async searchGuidesByCompetencies(requirements) {
return this.post('/guides/search-competencies', requirements);
  }
}

const marketplaceService = new MarketplaceService();
export default marketplaceService;