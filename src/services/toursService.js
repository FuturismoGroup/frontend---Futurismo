/**
 * Servicio de tours
 * Maneja toda la lógica de tours con el backend
 */

import BaseService from './baseService';
import { APP_CONFIG } from '../config/app.config';


class ToursService extends BaseService {
  constructor() {
    super('/tours');
  }

  /**
   * Obtener todos los tours
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Object>}
   */
  async getTours(filters = {}) {
return this.get('', filters);
  }

  /**
   * Obtener tour por ID
   * @param {string} id - ID del tour
   * @returns {Promise<Object>}
   */
  async getTourById(id) {
return this.get(`/${id}`);
  }

  /**
   * Crear nuevo tour
   * @param {Object} tourData - Datos del tour
   * @returns {Promise<Object>}
   */
  async createTour(tourData) {
return this.post('', tourData);
  }

  /**
   * Actualizar tour
   * @param {string} id - ID del tour
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>}
   */
  async updateTour(id, updateData) {
return this.put(`/${id}`, updateData);
  }

  /**
   * Eliminar tour
   * @param {string} id - ID del tour
   * @returns {Promise<Object>}
   */
  async deleteTour(id) {
return this.delete(`/${id}`);
  }

  /**
   * Cambiar estado del tour
   * @param {string} id - ID del tour
   * @returns {Promise<Object>}
   */
  async toggleTourStatus(id) {
return this.put(`/${id}/toggle-status`);
  }

  /**
   * Destacar/Quitar destacado del tour
   * @param {string} id - ID del tour
   * @returns {Promise<Object>}
   */
  async toggleTourFeatured(id) {
return this.put(`/${id}/toggle-featured`);
  }

  /**
   * Obtener categorías de tours
   * @returns {Promise<Object>}
   */
  async getCategories() {
return this.get('/categories');
  }

  /**
   * Obtener estadísticas de tours
   * @returns {Promise<Object>}
   */
  async getStatistics() {
return this.get('/statistics');
  }

  /**
   * Obtener tours disponibles para una fecha
   * @param {Date} date - Fecha a consultar
   * @param {Object} filters - Filtros adicionales
   * @returns {Promise<Object>}
   */
  async getAvailableTours(date, filters = {}) {
return this.get('/available', { date: date.toISOString(), ...filters });
  }

  /**
   * Duplicar tour
   * @param {string} id - ID del tour a duplicar
   * @returns {Promise<Object>}
   */
  async duplicateTour(id) {
return this.post(`/${id}/duplicate`);
  }

  /**
   * Obtener idiomas disponibles
   * @returns {Promise<Object>}
   */
  async getLanguages() {
    return this.get('/languages');
  }

  /**
   * Buscar tours por texto
   * @param {string} searchTerm - Término de búsqueda
   * @param {Object} filters - Filtros adicionales
   * @returns {Promise<Object>}
   */
  async searchTours(searchTerm, filters = {}) {
return this.get('/search', { q: searchTerm, ...filters });
  }

  /**
   * Obtener itinerario detallado del tour
   * @param {string} id - ID del tour
   * @returns {Promise<Object>}
   */
  async getTourItinerary(id) {
    return this.get(`/${id}/itinerary`);
  }

  /**
   * Actualizar itinerario del tour
   * @param {string} id - ID del tour
   * @param {Array} itinerary - Nuevo itinerario
   * @returns {Promise<Object>}
   */
  async updateTourItinerary(id, itinerary) {
return this.put(`/${id}/itinerary`, { itinerary });
  }

  /**
   * Obtener precios especiales del tour
   * @param {string} id - ID del tour
   * @returns {Promise<Object>}
   */
  async getTourPricing(id) {
    return this.get(`/${id}/pricing`);
  }

  /**
   * Actualizar precios del tour
   * @param {string} id - ID del tour
   * @param {Object} pricing - Nuevos precios
   * @returns {Promise<Object>}
   */
  async updateTourPricing(id, pricing) {
return this.put(`/${id}/pricing`, pricing);
  }

  /**
   * Obtener disponibilidad del tour
   * @param {string} id - ID del tour
   * @param {Date} startDate - Fecha inicial
   * @param {Date} endDate - Fecha final
   * @returns {Promise<Object>}
   */
  async getTourAvailability(id, startDate, endDate) {
    return this.get(`/${id}/availability`, {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString()
    });
  }

  /**
   * Importar tours desde archivo
   * @param {File} file - Archivo a importar
   * @returns {Promise<Object>}
   */
  async importTours(file) {
    const formData = new FormData();
    formData.append('file', file);

    return this.post('/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  /**
   * Exportar tours
   * @param {Object} filters - Filtros para exportación
   * @returns {Promise<Blob>}
   */
  async exportTours(filters = {}) {
    const response = await this.get('/export', filters, {
      responseType: 'blob'
    });

    return response.data;
  }

  /**
   * Verificar disponibilidad de guía para un tour
   * @param {string} tourId - ID del tour
   * @param {string} guideId - ID del guía
   * @returns {Promise<Object>}
   */
  async checkGuideAvailability(tourId, guideId) {
return this.post(`/${tourId}/check-guide-availability`, { guideId });
  }

  /**
   * Verificar competencias del guía para un tour
   * @param {string} tourId - ID del tour
   * @param {string} guideId - ID del guía
   * @returns {Promise<Object>}
   */
  async checkGuideCompetences(tourId, guideId) {
return this.post(`/${tourId}/check-guide-competences`, { guideId });
  }

  /**
   * Asignar guía a tour/reserva
   * @param {string} tourId - ID del tour
   * @param {string} guideId - ID del guía
   * @param {Object} options - Opciones adicionales (reservationId, date, time)
   * @returns {Promise<Object>}
   */
  async assignGuideToTour(tourId, guideId, options = {}) {
    try {
      // Usar endpoint correcto de guides: POST /api/guides/:guideId/tours
      const response = await this.api.post(`/guides/${guideId}/tours`, {
        tourId,
        reservationId: options.reservationId,
        date: options.date || new Date().toISOString().split('T')[0],
        time: options.time || '08:00'
      });

      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        return response.data;
      }

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Asignar tour a agencia
   * @param {string} tourId - ID del tour
   * @param {string} agencyId - ID de la agencia
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Object>}
   */
  async assignTourToAgency(tourId, agencyId, options = {}) {
return this.post(`/${tourId}/assign-agency`, { agencyId, ...options });
  }

  /**
   * Obtener guías disponibles para un tour
   * @param {string} tourId - ID del tour
   * @param {string} date - Fecha del tour
   * @param {Object} options - Opciones adicionales (reservationId, includeCurrentGuide)
   * @returns {Promise<Object>}
   */
  async getAvailableGuidesForTour(tourId, date, options = {}) {
    return this.get(`/${tourId}/available-guides`, {
      date,
      reservationId: options.reservationId,
      includeCurrentGuide: options.includeCurrentGuide || true
    });
  }

  /**
   * Remover asignación de tour
   * @param {string} tourId - ID del tour
   * @param {string} assignmentType - Tipo de asignación ('guide' o 'agency')
   * @returns {Promise<Object>}
   */
  async removeAssignment(tourId, assignmentType = 'guide') {
return this.delete(`/${tourId}/assignments/${assignmentType}`);
  }

  /**
   * Obtener tours asignados a un guía específico
   * @param {string} guideId - ID del guía
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Object>}
   */
  async getGuideTours(guideId, filters = {}) {
    return this.get('/guide-tours', { guideId, ...filters });
  }

  /**
   * Actualizar estado de tour del guía
   * @param {string} tourId - ID del tour
   * @param {string} status - Nuevo estado
   * @param {string} guideId - ID del guía
   * @returns {Promise<Object>}
   */
  async updateTourStatus(tourId, status, guideId) {
    return this.put(`/${tourId}/status`, { status, guideId });
  }

  /**
   * Obtener datos para PDF de asignacion
   * @param {string} reservationId - ID de la reserva
   * @returns {Promise<Object>}
   */
  async getAssignmentPDFData(reservationId) {
    return this.get(`/reservations/${reservationId}/assignment-pdf`);
  }

  /**
   * Obtener asignaciones pendientes
   * @param {Object} filters - Filtros opcionales (page, pageSize, date, status)
   * @returns {Promise<Object>}
   */
  async getPendingAssignments(filters = {}) {
    return this.get('/assignments/pending', filters);
  }

  /**
   * Obtener progreso de un tour activo
   * @param {string} activeTourId - ID del tour activo (active_tours.id)
   * @returns {Promise<Object>}
   */
  async getTourProgress(activeTourId) {
    return this.get(`/${activeTourId}/progress`);
  }

  /**
   * Check-in en una parada del tour
   * @param {string} activeTourId - ID del tour activo
   * @param {string} stopId - ID de la parada
   * @returns {Promise<Object>}
   */
  async checkInStop(activeTourId, stopId) {
    return this.post(`/${activeTourId}/stops/${stopId}/checkin`);
  }

  /**
   * Check-out de una parada del tour
   * @param {string} activeTourId - ID del tour activo
   * @param {string} stopId - ID de la parada
   * @param {string} notes - Notas opcionales
   * @returns {Promise<Object>}
   */
  async checkOutStop(activeTourId, stopId, notes = '') {
    return this.post(`/${activeTourId}/stops/${stopId}/checkout`, { notes });
  }

  /**
   * Completar un tour activo
   * @param {string} activeTourId - ID del tour activo
   * @param {Object} data - Datos adicionales (notes, rating, feedback)
   * @returns {Promise<Object>}
   */
  async completeTour(activeTourId, data = {}) {
    return this.post(`/${activeTourId}/complete`, data);
  }

  // =====================================================
  // TOUR PHOTOS - Fotos y comentarios durante el tour
  // =====================================================

  /**
   * Subir una foto al tour activo
   * @param {string} activeTourId - ID del tour activo
   * @param {File} photoFile - Archivo de imagen
   * @param {Object} options - Opciones (tourStopId, caption, latitude, longitude)
   * @returns {Promise<Object>}
   */
  async uploadTourPhoto(activeTourId, photoFile, options = {}) {
    const formData = new FormData();
    formData.append('photo', photoFile);
    formData.append('activeTourId', activeTourId);

    if (options.tourStopId) {
      formData.append('tourStopId', options.tourStopId);
    }
    if (options.caption) {
      formData.append('caption', options.caption);
    }
    if (options.latitude !== undefined) {
      formData.append('latitude', options.latitude);
    }
    if (options.longitude !== undefined) {
      formData.append('longitude', options.longitude);
    }

    // No establecer Content-Type - axios lo detecta automáticamente para FormData
    return this.post(`/${activeTourId}/photos`, formData);
  }

  /**
   * Subir múltiples fotos al tour activo
   * @param {string} activeTourId - ID del tour activo
   * @param {FileList|Array<File>} photoFiles - Archivos de imágenes
   * @param {Object} options - Opciones (tourStopId, captions[], latitude, longitude)
   * @returns {Promise<Object>}
   */
  async uploadMultipleTourPhotos(activeTourId, photoFiles, options = {}) {
    const formData = new FormData();
    formData.append('activeTourId', activeTourId);

    for (const file of photoFiles) {
      formData.append('photos', file);
    }

    if (options.tourStopId) {
      formData.append('tourStopId', options.tourStopId);
    }
    if (options.captions && Array.isArray(options.captions)) {
      formData.append('captions', JSON.stringify(options.captions));
    }
    if (options.latitude !== undefined) {
      formData.append('latitude', options.latitude);
    }
    if (options.longitude !== undefined) {
      formData.append('longitude', options.longitude);
    }

    // No establecer Content-Type - axios lo detecta automáticamente para FormData
    return this.post(`/${activeTourId}/photos/batch`, formData);
  }

  /**
   * Obtener fotos de un tour activo
   * @param {string} activeTourId - ID del tour activo
   * @param {Object} options - Opciones (stopId, limit, offset)
   * @returns {Promise<Object>}
   */
  async getTourPhotos(activeTourId, options = {}) {
    return this.get(`/${activeTourId}/photos`, options);
  }

  /**
   * Eliminar una foto del tour
   * @param {string} activeTourId - ID del tour activo
   * @param {string} photoId - ID de la foto
   * @returns {Promise<Object>}
   */
  async deleteTourPhoto(activeTourId, photoId) {
    return this.delete(`/${activeTourId}/photos/${photoId}`);
  }

  /**
   * Agregar comentario a una parada
   * @param {string} activeTourId - ID del tour activo
   * @param {string} stopId - ID de la parada
   * @param {string} comment - Comentario
   * @returns {Promise<Object>}
   */
  async addStopComment(activeTourId, stopId, comment) {
    return this.post(`/${activeTourId}/stops/${stopId}/comments`, { comment });
  }

  // Método auxiliar para generar CSV
  generateCSV(tours) {
    const headers = ['Código', 'Nombre', 'Categoría', 'Precio', 'Duración', 'Capacidad', 'Estado'];
    const rows = tours.map(tour => [
      tour.code,
      tour.name,
      tour.category,
      tour.price,
      tour.duration,
      tour.capacity,
      tour.status
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

const toursService = new ToursService();
export default toursService;