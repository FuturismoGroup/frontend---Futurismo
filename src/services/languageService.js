import i18next from 'i18next';
/**
 * Servicio de Idiomas
 * Gestión de idiomas del sistema
 * Endpoints: /api/languages
 */

import api from './api';

const languageService = {
  /**
   * Obtiene todos los idiomas (incluye inactivos)
   * Endpoint público
   * @returns {Promise<{success: boolean, data: Array}>}
   */
  getAllLanguages: async () => {
    try {
      const response = await api.get('/languages');
      return response.data;
    } catch (error) {
      console.error('Error al obtener idiomas:', error);
      return {
        success: false,
        error: error.response?.data?.message || i18next.t('errors.unexpectedError')
      };
    }
  },

  /**
   * Obtiene solo idiomas activos
   * Endpoint público - usado en formularios
   * @returns {Promise<{success: boolean, data: Array}>}
   */
  getActiveLanguages: async () => {
    try {
      const response = await api.get('/languages/active');
      return response.data;
    } catch (error) {
      console.error('Error al obtener idiomas activos:', error);
      return {
        success: false,
        error: error.response?.data?.message || i18next.t('errors.unexpectedError')
      };
    }
  },

  /**
   * Obtiene un idioma por ID
   * Requiere autenticación (admin)
   * @param {string} id - UUID del idioma
   * @returns {Promise<{success: boolean, data: Object}>}
   */
  getLanguageById: async (id) => {
    try {
      const response = await api.get(`/languages/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener idioma:', error);
      return {
        success: false,
        error: error.response?.data?.message || i18next.t('errors.unexpectedError')
      };
    }
  },

  /**
   * Crea un nuevo idioma
   * Requiere autenticación (admin)
   * @param {Object} data - { code, name, nativeName }
   * @returns {Promise<{success: boolean, data: Object}>}
   */
  createLanguage: async (data) => {
    try {
      const response = await api.post('/languages', data);
      return response.data;
    } catch (error) {
      console.error('Error al crear idioma:', error);
      return {
        success: false,
        error: error.response?.data?.message || i18next.t('errors.unexpectedError')
      };
    }
  },

  /**
   * Actualiza un idioma existente
   * Requiere autenticación (admin)
   * @param {string} id - UUID del idioma
   * @param {Object} data - Campos a actualizar
   * @returns {Promise<{success: boolean, data: Object}>}
   */
  updateLanguage: async (id, data) => {
    try {
      const response = await api.put(`/languages/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error al actualizar idioma:', error);
      return {
        success: false,
        error: error.response?.data?.message || i18next.t('errors.unexpectedError')
      };
    }
  },

  /**
   * Elimina un idioma (soft delete)
   * Requiere autenticación (admin)
   * @param {string} id - UUID del idioma
   * @returns {Promise<{success: boolean}>}
   */
  deleteLanguage: async (id) => {
    try {
      const response = await api.delete(`/languages/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al eliminar idioma:', error);
      return {
        success: false,
        error: error.response?.data?.message || i18next.t('errors.unexpectedError')
      };
    }
  },

  /**
   * Alterna el estado activo/inactivo de un idioma
   * Requiere autenticación (admin)
   * @param {string} id - UUID del idioma
   * @returns {Promise<{success: boolean, data: Object}>}
   */
  toggleLanguageStatus: async (id) => {
    try {
      const response = await api.patch(`/languages/${id}/toggle`);
      return response.data;
    } catch (error) {
      console.error('Error al cambiar estado del idioma:', error);
      return {
        success: false,
        error: error.response?.data?.message || i18next.t('errors.unexpectedError')
      };
    }
  }
};

export default languageService;
