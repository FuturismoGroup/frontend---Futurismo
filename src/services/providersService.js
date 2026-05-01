/**
 * Servicio de proveedores
 * Maneja toda la lógica de proveedores con el backend
 */

import BaseService from './baseService';
import { APP_CONFIG } from '../config/app.config';


class ProvidersService extends BaseService {
  constructor() {
    super('/providers');
  }

  /**
   * Obtener todas las ubicaciones
   * @returns {Promise<Object>}
   */
  async getLocations() {
return this.get('/locations');
  }

  /**
   * Obtener todas las categorías
   * @returns {Promise<Object>}
   */
  async getCategories() {
return this.get('/categories');
  }

  /**
   * Obtener todos los proveedores
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Object>}
   */
  async getProviders(filters = {}) {
return this.get('', filters);
  }

  /**
   * Obtener proveedor por ID
   * @param {string} id - ID del proveedor
   * @returns {Promise<Object>}
   */
  async getProviderById(id) {
return this.get(`/${id}`);
  }

  /**
   * Crear nuevo proveedor
   * @param {Object} providerData - Datos del proveedor
   * @returns {Promise<Object>}
   */
  async createProvider(providerData) {
return this.post('', providerData);
  }

  /**
   * Actualizar proveedor
   * @param {string} id - ID del proveedor
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>}
   */
  async updateProvider(id, updateData) {
return this.put(`/${id}`, updateData);
  }

  /**
   * Eliminar proveedor (soft delete)
   * @param {string} id - ID del proveedor
   * @returns {Promise<Object>}
   */
  async deleteProvider(id) {
return this.delete(`/${id}`);
  }

  /**
   * Cambiar estado del proveedor
   * @param {string} id - ID del proveedor
   * @param {string} status - Nuevo estado
   * @returns {Promise<Object>}
   */
  async toggleProviderStatus(id, status) {
return this.patch(`/${id}/status`, { status });
  }

  /**
   * Buscar proveedores
   * @param {string} query - Término de búsqueda
   * @param {Object} filters - Filtros adicionales
   * @returns {Promise<Object>}
   */
  async searchProviders(query, filters = {}) {
return this.get('/search', { q: query, ...filters });
  }

  /**
   * Obtener proveedores por ubicación y categoría
   * @param {string} locationId - ID de la ubicación
   * @param {string} categoryId - ID de la categoría (opcional)
   * @returns {Promise<Object>}
   */
  async getProvidersByLocationAndCategory(locationId, categoryId = null) {
const params = { location: locationId };
    if (categoryId) {
      params.category = categoryId;
    }

    return this.get('', params);
  }

  /**
   * Verificar disponibilidad de proveedor
   * @param {string} providerId - ID del proveedor
   * @param {string} date - Fecha
   * @param {string} startTime - Hora de inicio
   * @param {string} endTime - Hora de fin
   * @returns {Promise<Object>}
   */
  async checkProviderAvailability(providerId, date, startTime, endTime) {
return this.post(`/${providerId}/check-availability`, {
      date,
      startTime,
      endTime
    });
  }

  /**
   * Obtener estadísticas de proveedores
   * @returns {Promise<Object>}
   */
  async getProvidersStats() {
return this.get('/stats');
  }

  /**
   * Importar proveedores desde archivo
   * @param {File} file - Archivo a importar
   * @param {Function} onProgress - Callback de progreso
   * @returns {Promise<Object>}
   */
  async importProviders(file, onProgress = null) {
return this.upload('/import', file, onProgress);
  }

  /**
   * Exportar proveedores
   * @param {Object} filters - Filtros de exportación
   * @param {string} format - Formato de exportación (csv, excel, pdf)
   * @returns {Promise<Object>}
   */
  async exportProviders(filters = {}, format = 'excel') {
const filename = `providers_${new Date().toISOString().split('T')[0]}.${format}`;
    return this.download('/export', filename, { ...filters, format });
  }

  /**
   * Calificar proveedor
   * @param {string} providerId - ID del proveedor
   * @param {Object} ratingData - Datos de calificación
   * @returns {Promise<Object>}
   */
  async rateProvider(providerId, ratingData) {
    return this.post(`/${providerId}/rate`, ratingData);
  }

  /**
   * Clonar proveedor
   * @param {string} providerId - ID del proveedor a clonar
   * @param {Object} overrides - Datos a sobrescribir
   * @returns {Promise<Object>}
   */
  async cloneProvider(providerId, overrides = {}) {
    return this.post(`/${providerId}/clone`, overrides);
  }

  /**
   * Crear nueva ubicación
   * @param {Object} locationData - Datos de la ubicación
   * @returns {Promise<Object>}
   */
  async createLocation(locationData) {
    return this.post('/locations', locationData);
  }

  /**
   * Crear nueva categoría
   * @param {Object} categoryData - Datos de la categoría
   * @returns {Promise<Object>}
   */
  async createCategory(categoryData) {
    return this.post('/categories', categoryData);
  }

  /**
   * Obtener todos los servicios
   * @returns {Promise<Object>}
   */
  async getServices() {
    return this.get('/services');
  }

  /**
   * Crear nuevo servicio
   * @param {Object} serviceData - Datos del servicio
   * @returns {Promise<Object>}
   */
  async createService(serviceData) {
    return this.post('/services', serviceData);
  }
}

const providersService = new ProvidersService();
export default providersService;