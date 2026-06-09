/**
 * Servicio de notificaciones
 * Maneja toda la lógica de notificaciones con el backend
 */

import BaseService from './baseService';
import { APP_CONFIG } from '../config/app.config';


class NotificationsService extends BaseService {
  constructor() {
    super('/notifications');
  }

  /**
   * Obtener notificaciones del usuario
   * @param {string} userId - ID del usuario
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Object>}
   */
  async getNotifications(userId, filters = {}) {
return this.get(`/user/${userId}`, filters);
  }

  /**
   * Obtener notificación por ID
   * @param {string} id - ID de la notificación
   * @returns {Promise<Object>}
   */
  async getNotificationById(id) {
return this.get(`/${id}`);
  }

  /**
   * Crear nueva notificación
   * @param {Object} notificationData - Datos de la notificación
   * @returns {Promise<Object>}
   */
  async createNotification(notificationData) {
return this.post('', notificationData);
  }

  /**
   * Marcar notificación como leída
   * @param {string} id - ID de la notificación
   * @returns {Promise<Object>}
   */
  async markAsRead(id) {
return this.patch(`/${id}/read`);
  }

  /**
   * Marcar todas las notificaciones como leídas
   * @returns {Promise<Object>}
   */
  async markAllAsRead() {
return this.post('/mark-all-read');
  }

  /**
   * Eliminar notificación
   * @param {string} id - ID de la notificación
   * @returns {Promise<Object>}
   */
  async deleteNotification(id) {
return this.delete(`/${id}`);
  }

  /**
   * Limpiar todas las notificaciones del usuario
   * @returns {Promise<Object>}
   */
  async clearAll() {
return this.delete('/all');
  }

  /**
   * Obtener preferencias de notificación del usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>}
   */
  async getUserPreferences(userId) {
return this.get(`/user/${userId}/preferences`);
  }

  /**
   * Actualizar preferencias de notificación del usuario
   * @param {string} userId - ID del usuario
   * @param {Object} preferences - Nuevas preferencias
   * @returns {Promise<Object>}
   */
  async updateUserPreferences(userId, preferences) {
return this.put(`/user/${userId}/preferences`, preferences);
  }

  /**
   * Obtener plantillas de notificación
   * @returns {Promise<Object>}
   */
  async getNotificationTemplates() {
return this.get('/templates');
  }

  /**
   * Crear notificación desde plantilla
   * @param {string} templateId - ID de la plantilla
   * @param {Object} params - Parámetros para la plantilla
   * @returns {Promise<Object>}
   */
  async createFromTemplate(templateId, params = {}) {
return this.post(`/templates/${templateId}`, params);
  }

  /**
   * Obtener estadísticas de notificaciones
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>}
   */
  async getNotificationStats(userId) {
return this.get(`/user/${userId}/stats`);
  }

  /**
   * Suscribirse a notificaciones push
   * @param {string} userId - ID del usuario
   * @param {Object} subscription - Datos de suscripción push
   * @returns {Promise<Object>}
   */
  async subscribeToPush(userId, subscription) {
return this.post(`/user/${userId}/push-subscribe`, subscription);
  }

  /**
   * Desuscribirse de notificaciones push
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>}
   */
  async unsubscribeFromPush(userId) {
return this.delete(`/user/${userId}/push-unsubscribe`);
  }

  /**
   * Enviar notificación masiva (admin)
   * @param {Object} notificationData - Datos de la notificación
   * @param {Array<string>} userIds - IDs de usuarios destinatarios
   * @returns {Promise<Object>}
   */
  async sendBulkNotification(notificationData, userIds) {
return this.post('/bulk', {
      notification: notificationData,
      recipients: userIds
    });
  }

  /**
   * Enviar notificación de prueba
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>}
   */
  async sendTestNotification(userId) {

return this.post(`/user/${userId}/test`);
  }

  /**
   * Obtener categorías de notificación disponibles
   * @returns {Promise<Object>}
   */
  async getNotificationCategories() {

return this.get('/categories');
  }

  /**
   * Buscar notificaciones
   * @param {string} userId - ID del usuario
   * @param {string} query - Texto de búsqueda
   * @returns {Promise<Object>}
   */
  async searchNotifications(userId, query) {

return this.get(`/user/${userId}/search`, { q: query });
  }

  /**
   * Archivar notificación
   * @param {string} id - ID de la notificación
   * @returns {Promise<Object>}
   */
  async archiveNotification(id) {

return this.put(`/${id}/archive`);
  }

  /**
   * Obtener notificaciones archivadas
   * @param {string} userId - ID del usuario
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Object>}
   */
  async getArchivedNotifications(userId, filters = {}) {

return this.get(`/user/${userId}/archived`, filters);
  }
}

const notificationsService = new NotificationsService();
export default notificationsService;