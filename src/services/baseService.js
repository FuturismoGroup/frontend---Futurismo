import i18next from 'i18next';
/**
 * Servicio base para todos los servicios de la aplicación
 * Proporciona funcionalidad común para llamadas API
 */

import axios from 'axios';
import { APP_CONFIG, getStorageKey } from '../config/app.config';

// Variable para guardar referencia al authStore (se carga después)
let authStoreRef = null;

// Función para registrar el authStore (se llama desde authStore)
export const setAuthStoreReference = (store) => {
  authStoreRef = store;
};

class BaseService {
  constructor(endpoint) {
    this.endpoint = endpoint;
    // En desarrollo usar URL relativa para que funcione el proxy de Vite
    const isDevelopment = import.meta.env.MODE === 'development';
    this.baseURL = isDevelopment ? '/api' : APP_CONFIG.api.baseUrl;
    this.isUsingMockData = APP_CONFIG.features.mockData;

    // Configurar axios instance
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: APP_CONFIG.api.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Interceptor para agregar token y manejar FormData
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Si es FormData, eliminar Content-Type para que axios lo establezca con boundary
        if (config.data instanceof FormData) {
          delete config.headers['Content-Type'];
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor para manejar errores
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expirado o inválido
          this.handleUnauthorized();
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Simular delay de red para mock services
   * @param {number} delay - Milisegundos de delay (por defecto 300-800ms)
   * @returns {Promise<void>}
   */
  async simulateNetworkDelay(delay = null) {
    if (!this.isUsingMockData) return;
    
    const actualDelay = delay || Math.random() * 500 + 300; // 300-800ms
    return new Promise(resolve => setTimeout(resolve, actualDelay));
  }

  /**
   * Formatear respuesta exitosa para mock services
   * @param {*} data - Datos a retornar
   * @returns {Object}
   */
  success(data) {
    return {
      success: true,
      data
    };
  }

  /**
   * Formatear respuesta de error para mock services
   * @param {string} message - Mensaje de error
   * @param {*} details - Detalles adicionales del error
   * @returns {Object}
   */
  error(message, details = null) {
    return {
      success: false,
      error: message,
      details
    };
  }

  /**
   * Obtener token de autenticación
   * @returns {string|null}
   */
  getAuthToken() {
    let token = null;

    // Intentar obtener del authStore si está disponible
    if (authStoreRef) {
      try {
        const state = authStoreRef.getState();
        token = state?.token;

        if (token) {
          return token;
        }
      } catch {
        // Could not access authStore
      }
    }

    // Si no está en el store, buscar en storage usando las claves correctas
    const storageKey = getStorageKey('authToken');
    token = localStorage.getItem(storageKey) || sessionStorage.getItem(storageKey);

    return token;
  }

  /**
   * Manejar error 401
   */
  handleUnauthorized() {
    // Emitir evento para que el authStore maneje el logout
    window.dispatchEvent(new CustomEvent('auth:session:expired'));
  }

  /**
   * GET request genérico
   * @param {string} path - Ruta relativa al endpoint
   * @param {Object} params - Parámetros de query
   * @returns {Promise<Object>}
   */
  async get(path = '', params = {}) {
    try {
      const response = await this.api.get(`${this.endpoint}${path}`, { params });

      // Si la respuesta ya tiene el formato {success, data}, devolverla directamente
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        return response.data;
      }

      // Si no, envolverla en el formato estándar
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * POST request genérico
   * @param {string} path - Ruta relativa al endpoint
   * @param {Object} data - Datos a enviar
   * @param {Object} config - Configuración adicional de axios (opcional)
   * @returns {Promise<Object>}
   */
  async post(path = '', data = {}, config = {}) {
    try {
      // Si es FormData, dejar que axios maneje el Content-Type automáticamente
      const requestConfig = data instanceof FormData
        ? { ...config, headers: { ...config.headers } }
        : config;

      // Para FormData, eliminar el Content-Type para que axios agregue el boundary
      if (data instanceof FormData && requestConfig.headers) {
        delete requestConfig.headers['Content-Type'];
      }

      const response = await this.api.post(`${this.endpoint}${path}`, data, requestConfig);

      // Si la respuesta ya tiene el formato {success, data}, devolverla directamente
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        return response.data;
      }

      // Si no, envolverla en el formato estándar
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * PUT request genérico
   * @param {string} path - Ruta relativa al endpoint
   * @param {Object} data - Datos a enviar
   * @returns {Promise<Object>}
   */
  async put(path = '', data = {}) {
    try {
      const response = await this.api.put(`${this.endpoint}${path}`, data);

      // Si la respuesta ya tiene el formato {success, data}, devolverla directamente
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        return response.data;
      }

      // Si no, envolverla en el formato estándar
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * PATCH request genérico
   * @param {string} path - Ruta relativa al endpoint
   * @param {Object} data - Datos a enviar
   * @returns {Promise<Object>}
   */
  async patch(path = '', data = {}) {
    try {
      const response = await this.api.patch(`${this.endpoint}${path}`, data);

      // Si la respuesta ya tiene el formato {success, data}, devolverla directamente
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        return response.data;
      }

      // Si no, envolverla en el formato estándar
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * DELETE request genérico
   * @param {string} path - Ruta relativa al endpoint
   * @returns {Promise<Object>}
   */
  async delete(path = '') {
    try {
      const response = await this.api.delete(`${this.endpoint}${path}`);

      // Si la respuesta ya tiene el formato {success, data}, devolverla directamente
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        return response.data;
      }

      // Si no, envolverla en el formato estándar
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Manejar errores de forma consistente
   * @param {Error} error
   * @returns {Object}
   */
  handleError(error) {
    const errorResponse = {
      success: false,
      error: 'Error desconocido',
      validationErrors: null
    };

    if (error.response) {
      const data = error.response.data;
      errorResponse.status = error.response.status;

      // Verificar si hay errores de validación en details o errors
      if (data?.details && Array.isArray(data.details)) {
        // Formato: { details: [{ field, message }] }
        errorResponse.validationErrors = data.details;
        const messages = data.details.map(d => d.message).filter(Boolean);
        errorResponse.error = messages.length > 0
          ? messages.join('. ')
          : data.message || data.error || 'Error de validación';
      } else if (data?.errors && Array.isArray(data.errors)) {
        // Formato alternativo: { errors: [{ field, message }] }
        errorResponse.validationErrors = data.errors;
        const messages = data.errors.map(e => e.message).filter(Boolean);
        errorResponse.error = messages.length > 0
          ? messages.join('. ')
          : data.message || data.error || 'Error de validación';
      } else {
        // Formato estándar sin validación detallada
        errorResponse.error = data?.message || data?.error || `Error ${error.response.status}`;
      }
    } else if (error.request) {
      // La petición se hizo pero no hubo respuesta
      errorResponse.error = i18next.t('errors.connectionError');
      errorResponse.networkError = true;
    } else {
      // Error al configurar la petición
      errorResponse.error = error.message;
    }

    if (APP_CONFIG.features.debugMode) {
      console.error(`[${this.endpoint}] Error:`, error);
    }

    return errorResponse;
  }

  /**
   * POST request con FormData (para subir archivos con metadatos)
   * @param {string} path - Ruta relativa al endpoint
   * @param {FormData} formData - FormData con archivo y metadatos
   * @param {Function} onProgress - Callback para progreso opcional
   * @returns {Promise<Object>}
   */
  async postFormData(path = '', formData, onProgress = null) {
    try {
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      };

      if (onProgress) {
        config.onUploadProgress = (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        };
      }

      const response = await this.api.post(`${this.endpoint}${path}`, formData, config);

      // Si la respuesta ya tiene el formato {success, data}, devolverla directamente
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
   * Upload de archivos
   * @param {string} path - Ruta relativa al endpoint
   * @param {File|FormData} file - Archivo o FormData
   * @param {Function} onProgress - Callback para progreso
   * @returns {Promise<Object>}
   */
  async upload(path, file, onProgress = null) {
    try {
      const formData = file instanceof FormData ? file : new FormData();
      if (file instanceof File) {
        formData.append('file', file);
      }

      const response = await this.api.post(`${this.endpoint}${path}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onProgress(percentCompleted);
          }
        }
      });

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Descargar archivo
   * @param {string} path - Ruta relativa al endpoint
   * @param {string} filename - Nombre del archivo
   * @returns {Promise<Object>}
   */
  async download(path, filename) {
    try {
      const response = await this.api.get(`${this.endpoint}${path}`, {
        responseType: 'blob'
      });

      // Crear link de descarga
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      return {
        success: true
      };
    } catch (error) {
      return this.handleError(error);
    }
  }
}

export default BaseService;