import i18next from 'i18next';
/**
 * Servicio de Términos y Condiciones
 * Obtiene términos desde el API para mostrar en modales
 */

import { APP_CONFIG } from '../config/app.config';

class TermsService {
  constructor() {
    const isDevelopment = import.meta.env.MODE === 'development';
    this.baseURL = isDevelopment ? '/api' : APP_CONFIG.api.baseUrl;
  }

  /**
   * Obtener términos activos por tipo
   * @param {string} type - 'terms' | 'privacy' | 'cookies'
   * @returns {Promise<Object>} - { success, data: { id, type, version, title, content, ... } }
   */
  async getCurrentTerms(type = 'terms') {
    const url = `${this.baseURL}/terms/${type}/current`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: false,
            error: 'No hay términos configurados'
          };
        }
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al obtener términos:', error);
      return {
        success: false,
        error: error.message || i18next.t('errors.unexpectedError')
      };
    }
  }

  /**
   * Obtener una versión específica de términos
   * @param {string} type - 'terms' | 'privacy' | 'cookies'
   * @param {string} version - '1.0', '1.1', etc.
   */
  async getTermsByVersion(type, version) {
    const url = `${this.baseURL}/terms/${type}/version/${version}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al obtener versión de términos:', error);
      return {
        success: false,
        error: error.message || i18next.t('errors.unexpectedError')
      };
    }
  }

  /**
   * Registrar aceptación de términos (requiere autenticación)
   * @param {string} termsId - UUID del término aceptado
   * @param {string} token - Token de autenticación
   */
  async acceptTerms(termsId, token) {
    const url = `${this.baseURL}/terms/accept`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ terms_id: termsId })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al registrar aceptación:', error);
      return {
        success: false,
        error: error.message || i18next.t('errors.unexpectedError')
      };
    }
  }

  /**
   * Verificar estado de aceptación (requiere autenticación)
   * @param {string} token - Token de autenticación
   * @param {string} type - Opcional, filtrar por tipo
   */
  async getAcceptanceStatus(token, type = null) {
    let url = `${this.baseURL}/terms/acceptance/status`;
    if (type) url += `?type=${type}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error al verificar aceptación:', error);
      return {
        success: false,
        error: error.message || i18next.t('errors.unexpectedError')
      };
    }
  }
}

export default new TermsService();
