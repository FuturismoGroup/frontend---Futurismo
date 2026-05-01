/**
 * Servicio de emergencias
 * Maneja toda la lógica de protocolos de emergencia con el backend
 */

import BaseService from './baseService';
import { APP_CONFIG } from '../config/app.config';


class EmergencyService extends BaseService {
  constructor() {
    super('/emergency');
  }

  /**
   * Obtener todas las categorías
   * @returns {Promise<Object>}
   */
  async getCategories() {
return this.get('/categories');
  }

  /**
   * Obtener todos los protocolos
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Object>}
   */
  async getProtocols(filters = {}) {
return this.get('/protocols', filters);
  }

  /**
   * Obtener protocolo por ID
   * @param {string} id - ID del protocolo
   * @returns {Promise<Object>}
   */
  async getProtocolById(id) {
return this.get(`/protocols/${id}`);
  }

  /**
   * Crear nuevo protocolo
   * @param {Object} protocolData - Datos del protocolo
   * @returns {Promise<Object>}
   */
  async createProtocol(protocolData) {
return this.post('/protocols', protocolData);
  }

  /**
   * Actualizar protocolo
   * @param {string} id - ID del protocolo
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>}
   */
  async updateProtocol(id, updateData) {
return this.put(`/protocols/${id}`, updateData);
  }

  /**
   * Eliminar protocolo
   * @param {string} id - ID del protocolo
   * @returns {Promise<Object>}
   */
  async deleteProtocol(id) {
return this.delete(`/protocols/${id}`);
  }

  /**
   * Obtener todos los materiales
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Object>}
   */
  async getMaterials(filters = {}) {
return this.get('/materials', filters);
  }

  /**
   * Obtener material por ID
   * @param {string} id - ID del material
   * @returns {Promise<Object>}
   */
  async getMaterialById(id) {
return this.get(`/materials/${id}`);
  }

  /**
   * Crear nuevo material
   * @param {Object} materialData - Datos del material
   * @returns {Promise<Object>}
   */
  async createMaterial(materialData) {
return this.post('/materials', materialData);
  }

  /**
   * Actualizar material
   * @param {string} id - ID del material
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>}
   */
  async updateMaterial(id, updateData) {
return this.put(`/materials/${id}`, updateData);
  }

  /**
   * Eliminar material
   * @param {string} id - ID del material
   * @returns {Promise<Object>}
   */
  async deleteMaterial(id) {
return this.delete(`/materials/${id}`);
  }

  /**
   * Marcar material como revisado
   * @param {string} id - ID del material
   * @param {string} checkedBy - ID del usuario que revisa
   * @returns {Promise<Object>}
   */
  async checkMaterial(id, checkedBy) {
return this.post(`/materials/${id}/check`, { checkedBy });
  }

  /**
   * Obtener todos los incidentes
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Object>}
   */
  async getIncidents(filters = {}) {
return this.get('/incidents', filters);
  }

  /**
   * Obtener incidente por ID
   * @param {string} id - ID del incidente
   * @returns {Promise<Object>}
   */
  async getIncidentById(id) {
return this.get(`/incidents/${id}`);
  }

  /**
   * Crear nuevo incidente
   * @param {Object} incidentData - Datos del incidente
   * @returns {Promise<Object>}
   */
  async createIncident(incidentData) {
return this.post('/incidents', incidentData);
  }

  /**
   * Actualizar incidente
   * @param {string} id - ID del incidente
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>}
   */
  async updateIncident(id, updateData) {
return this.put(`/incidents/${id}`, updateData);
  }

  /**
   * Cerrar incidente
   * @param {string} id - ID del incidente
   * @param {string} resolution - Resolución del incidente
   * @returns {Promise<Object>}
   */
  async closeIncident(id, resolution) {
return this.post(`/incidents/${id}/close`, { resolution });
  }

  /**
   * Obtener estadísticas de emergencias
   * @returns {Promise<Object>}
   */
  async getEmergencyStats() {
return this.get('/stats');
  }

  /**
   * Buscar protocolos
   * @param {string} query - Término de búsqueda
   * @returns {Promise<Object>}
   */
  async searchProtocols(query) {
return this.get('/protocols/search', { q: query });
  }

  /**
   * Obtener protocolos por categoría
   * @param {string} category - Categoría
   * @returns {Promise<Object>}
   */
  async getProtocolsByCategory(category) {
return this.get('/protocols', { category });
  }

  /**
   * Obtener materiales por categoría
   * @param {string} category - Categoría
   * @returns {Promise<Object>}
   */
  async getMaterialsByCategory(category) {
return this.get('/materials', { category });
  }

  /**
   * Obtener materiales obligatorios
   * @returns {Promise<Object>}
   */
  async getMandatoryMaterials() {
return this.get('/materials', { mandatory: true });
  }

  /**
   * Exportar protocolos como PDF
   * @returns {Promise<Object>}
   */
  async exportProtocolsPDF() {
const filename = `protocols_${new Date().toISOString().split('T')[0]}.pdf`;
    return this.download('/protocols/export/pdf', filename);
  }

  /**
   * Exportar checklist de materiales
   * @returns {Promise<Object>}
   */
  async exportMaterialsChecklist() {
const filename = `materials_checklist_${new Date().toISOString().split('T')[0]}.pdf`;
    return this.download('/materials/export/checklist', filename);
  }

  /**
   * Exportar reporte de incidentes
   * @param {Object} filters - Filtros para el reporte
   * @returns {Promise<Object>}
   */
  async exportIncidentsReport(filters = {}) {
const filename = `incidents_report_${new Date().toISOString().split('T')[0]}.pdf`;
    return this.download('/incidents/export/report', filename, filters);
  }

  /**
   * Obtener historial de revisiones de material
   * @param {string} materialId - ID del material
   * @returns {Promise<Object>}
   */
  async getMaterialCheckHistory(materialId) {

return this.get(`/materials/${materialId}/checks`);
  }

  /**
   * Obtener timeline de incidente
   * @param {string} incidentId - ID del incidente
   * @returns {Promise<Object>}
   */
  async getIncidentTimeline(incidentId) {

return this.get(`/incidents/${incidentId}/timeline`);
  }

  /**
   * Duplicar protocolo
   * @param {string} protocolId - ID del protocolo a duplicar
   * @param {Object} overrides - Datos a sobrescribir
   * @returns {Promise<Object>}
   */
  async duplicateProtocol(protocolId, overrides = {}) {

return this.post(`/protocols/${protocolId}/duplicate`, overrides);
  }
}

const emergencyService = new EmergencyService();
export default emergencyService;