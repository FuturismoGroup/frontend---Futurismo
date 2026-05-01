/**
 * Servicio de monitoreo
 * Maneja el monitoreo en tiempo real de tours, fotos y actividad
 */

import BaseService from './baseService';

class MonitoringService extends BaseService {
  constructor() {
    super('/monitoring');
  }

  /**
   * Obtener fotos de tours
   * @param {Object} filters - Filtros opcionales
   * @param {string} filters.date - Fecha (YYYY-MM-DD)
   * @param {string} filters.guideId - ID del guía
   * @param {string} filters.tourId - ID del tour
   * @param {string} filters.agencyId - ID de la agencia
   * @param {number} filters.page - Número de página
   * @param {number} filters.limit - Fotos por página
   * @returns {Promise<Object>}
   */
  async getPhotos(filters = {}) {
    const params = {};
    if (filters.date) params.date = filters.date;
    if (filters.guideId) params.guideId = filters.guideId;
    if (filters.tourId) params.tourId = filters.tourId;
    if (filters.agencyId) params.agencyId = filters.agencyId;
    if (filters.page) params.page = filters.page;
    if (filters.limit) params.limit = filters.limit;

    return this.get('/photos', params);
  }

  /**
   * Subir nueva foto de tour
   * @param {Object} photoData - Datos de la foto
   * @param {string} photoData.tourId - ID del tour
   * @param {string} photoData.guideId - ID del guía
   * @param {string} photoData.photoUrl - URL de la foto
   * @param {string} photoData.stopName - Nombre del punto de control
   * @param {string} photoData.comment - Comentario opcional
   * @returns {Promise<Object>}
   */
  async uploadPhoto(photoData) {
    return this.post('/photos', photoData);
  }

  /**
   * Eliminar foto de tour
   * @param {string} photoId - ID de la foto
   * @returns {Promise<Object>}
   */
  async deletePhoto(photoId) {
    return this.delete(`/photos/${photoId}`);
  }

  /**
   * Obtener tours activos en tiempo real
   * @returns {Promise<Object>}
   */
  async getActiveTours() {
    return this.get('/active-tours');
  }

  /**
   * Actualizar ubicación del guía (GPS tracking)
   * @param {Object} locationData - Datos de ubicación
   * @param {number} locationData.latitude - Latitud
   * @param {number} locationData.longitude - Longitud
   * @param {number} locationData.accuracy - Precisión en metros (opcional)
   * @param {number} locationData.speed - Velocidad en m/s (opcional)
   * @param {string} locationData.reservationId - ID de reservación (opcional)
   * @returns {Promise<Object>}
   */
  async updateLocation(locationData) {
    return this.post('/location', locationData);
  }

  /**
   * Obtener alertas de monitoreo
   * @returns {Promise<Object>}
   */
  async getAlerts() {
    return this.get('/alerts');
  }
}

export default new MonitoringService();
