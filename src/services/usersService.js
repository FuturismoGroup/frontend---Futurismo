/**
 * Servicio de usuarios
 * Maneja toda la lógica de usuarios con el backend
 */

import BaseService from './baseService';
import { APP_CONFIG } from '../config/app.config';


class UsersService extends BaseService {
  constructor() {
    super('/users');
  }

  /**
   * Obtener todos los usuarios
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Object>}
   */
  async getUsers(filters = {}) {
return this.get('', filters);
  }

  /**
   * Obtener usuario por ID
   * @param {string} id - ID del usuario
   * @returns {Promise<Object>}
   */
  async getUserById(id) {
return this.get(`/${id}`);
  }

  /**
   * Crear nuevo usuario
   * @param {Object} userData - Datos del usuario
   * @returns {Promise<Object>}
   */
  async createUser(userData) {
return this.post('', userData);
  }

  /**
   * Actualizar usuario
   * @param {string} id - ID del usuario
   * @param {Object} updateData - Datos a actualizar
   * @returns {Promise<Object>}
   */
  async updateUser(id, updateData) {
return this.put(`/${id}`, updateData);
  }

  /**
   * Eliminar usuario (soft delete)
   * @param {string} id - ID del usuario
   * @returns {Promise<Object>}
   */
  async deleteUser(id) {
    return this.delete(`/${id}`);
  }

  /**
   * Restaurar usuario eliminado
   * @param {string} id - ID del usuario
   * @returns {Promise<Object>}
   */
  async restoreUser(id) {
    return this.post(`/${id}/restore`);
  }

  /**
   * Cambiar estado del usuario (activar/desactivar)
   * @param {string} id - ID del usuario
   * @param {string} status - Nuevo estado
   * @returns {Promise<Object>}
   */
  async toggleUserStatus(id, status) {
return this.patch(`/${id}/status`, { status });
  }

  /**
   * Resetear contraseña de usuario
   * @param {string} id - ID del usuario
   * @returns {Promise<Object>}
   */
  async resetUserPassword(id) {
return this.post(`/${id}/reset-password`);
  }

  /**
   * Cambiar contraseña de usuario
   * @param {string} id - ID del usuario
   * @param {Object} passwordData - { currentPassword, newPassword }
   * @returns {Promise<Object>}
   */
  async changeUserPassword(id, passwordData) {
return this.post(`/${id}/change-password`, passwordData);
  }

  /**
   * Actualizar rol del usuario
   * @param {string} id - ID del usuario
   * @param {string} roleId - ID del nuevo rol
   * @returns {Promise<Object>}
   */
  async updateUserRole(id, roleId) {
return this.put(`/${id}/role`, { roleId });
  }

  /**
   * Obtener roles disponibles
   * @returns {Promise<Object>}
   */
  async getRoles() {
return this.get('/roles/list');
  }

  /**
   * Buscar usuarios
   * @param {string} query - Término de búsqueda
   * @returns {Promise<Object>}
   */
  async searchUsers(query) {
return this.get('/search', { q: query });
  }

  /**
   * Obtener actividad del usuario
   * @param {string} id - ID del usuario
   * @param {Object} params - Parámetros de filtrado
   * @returns {Promise<Object>}
   */
  async getUserActivity(id, params = {}) {
return this.get(`/${id}/activity`, params);
  }

  /**
   * Obtener estadísticas de usuarios
   * @returns {Promise<Object>}
   */
  async getUsersStats() {
return this.get('/stats');
  }

  /**
   * Verificar email único
   * @param {string} email - Email a verificar
   * @param {string} excludeId - ID de usuario a excluir (para edición)
   * @returns {Promise<Object>}
   */
  async checkEmailUnique(email, excludeId = null) {
return this.post('/check-email', { email, excludeId });
  }

  /**
   * Invitar usuario por email
   * @param {Object} inviteData - { email, role, permissions }
   * @returns {Promise<Object>}
   */
  async inviteUser(inviteData) {
return this.post('/invite', inviteData);
  }

  /**
   * Reenviar invitación
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>}
   */
  async resendInvitation(userId) {
return this.post(`/${userId}/resend-invitation`);
  }

  /**
   * Importar usuarios desde archivo
   * @param {File} file - Archivo a importar
   * @param {Function} onProgress - Callback de progreso
   * @returns {Promise<Object>}
   */
  async importUsers(file, onProgress = null) {
return this.upload('/import', file, onProgress);
  }

  /**
   * Exportar usuarios
   * @param {Object} filters - Filtros de exportación
   * @param {string} format - Formato de exportación (csv, excel, pdf)
   * @returns {Promise<Object>}
   */
  async exportUsers(filters = {}, format = 'excel') {
const filename = `users_${new Date().toISOString().split('T')[0]}.${format}`;
    return this.download('/export', filename, { ...filters, format });
  }

  /**
   * Obtener sesiones activas del usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>}
   */
  async getUserSessions(userId) {
return this.get(`/${userId}/sessions`);
  }

  /**
   * Terminar sesión específica del usuario
   * @param {string} userId - ID del usuario
   * @param {string} sessionId - ID de la sesión
   * @returns {Promise<Object>}
   */
  async terminateUserSession(userId, sessionId) {
return this.delete(`/${userId}/sessions/${sessionId}`);
  }

  /**
   * Terminar todas las sesiones del usuario
   * @param {string} userId - ID del usuario
   * @returns {Promise<Object>}
   */
  async terminateAllUserSessions(userId) {
return this.delete(`/${userId}/sessions`);
  }
}

const usersService = new UsersService();
export default usersService;