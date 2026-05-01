/**
 * Servicio para la gestión de choferes
 */

import BaseService from './baseService';

import { APP_CONFIG } from '../config/app.config';

class DriversService extends BaseService {
  constructor() {
    super('/drivers');
  }

  /**
   * Obtener lista de choferes
   * @param {Object} params - Parámetros de búsqueda y paginación
   * @returns {Promise<Object>}
   */
  async getDrivers(params = {}) {
return this.get('', params);
  }

  /**
   * Obtener un chofer por ID
   * @param {string} id - ID del chofer
   * @returns {Promise<Object>}
   */
  async getDriverById(id) {
return this.get(`/${id}`);
  }

  /**
   * Crear un nuevo chofer
   * @param {Object} driverData - Datos del chofer
   * @returns {Promise<Object>}
   */
  async createDriver(driverData) {
return this.post('', driverData);
  }

  /**
   * Actualizar un chofer
   * @param {string} id - ID del chofer
   * @param {Object} driverData - Datos actualizados
   * @returns {Promise<Object>}
   */
  async updateDriver(id, driverData) {
return this.put(`/${id}`, driverData);
  }

  /**
   * Eliminar un chofer
   * @param {string} id - ID del chofer
   * @returns {Promise<Object>}
   */
  async deleteDriver(id) {
return this.delete(`/${id}`);
  }

  /**
   * Verificar disponibilidad de un chofer
   * @param {string} driverId - ID del chofer
   * @param {string} date - Fecha a verificar
   * @param {number} duration - Duración en horas
   * @returns {Promise<Object>}
   */
  async checkAvailability(driverId, date, duration = 8) {
return this.post(`/${driverId}/availability`, { date, duration });
  }

  /**
   * Obtener choferes disponibles para una fecha
   * @param {string} date - Fecha
   * @param {string} vehicleType - Tipo de vehículo (opcional)
   * @param {string} excludeReservationId - ID de reserva a excluir (para pre-cargar asignados)
   * @returns {Promise<Object>}
   */
  async getAvailableDrivers(date, vehicleType = null, excludeReservationId = null) {
    return this.get('/available', { date, vehicleType, excludeReservationId });
  }

  /**
   * Asignar chofer a un tour/servicio
   * @param {string} driverId - ID del chofer
   * @param {Object} assignmentData - Datos de la asignación
   * @returns {Promise<Object>}
   */
  async assignDriver(driverId, assignmentData) {
return this.post(`/${driverId}/assignments`, assignmentData);
  }

  /**
   * Obtener estadísticas de choferes
   * @returns {Promise<Object>}
   */
  async getDriversStatistics() {
return this.get('/statistics');
  }

  /**
   * Actualizar documentos del chofer
   * @param {string} driverId - ID del chofer
   * @param {Object} documents - Documentos actualizados
   * @returns {Promise<Object>}
   */
  async updateDocuments(driverId, documents) {
return this.patch(`/${driverId}/documents`, documents);
  }

  /**
   * Obtener historial de asignaciones
   * @param {string} driverId - ID del chofer
   * @param {Object} params - Parámetros de búsqueda
   * @returns {Promise<Object>}
   */
  async getAssignmentHistory(driverId, params = {}) {

return this.get(`/${driverId}/assignments`, params);
  }

  /**
   * Subir foto del chofer
   * @param {string} driverId - ID del chofer
   * @param {File} file - Archivo de imagen
   * @param {Function} onProgress - Callback de progreso
   * @returns {Promise<Object>}
   */
  async uploadPhoto(driverId, file, onProgress) {

return this.upload(`/${driverId}/photo`, file, onProgress);
  }
}

export default new DriversService();