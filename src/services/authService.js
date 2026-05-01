import i18next from 'i18next';
/**
 * Servicio de autenticación CORREGIDO
 * Usa fetch en lugar de axios para evitar problemas de CORS
 */

import { APP_CONFIG, getStorageKey } from '../config/app.config';

class AuthService {
  constructor() {
    // En desarrollo usar URL relativa para que funcione el proxy de Vite
    const isDevelopment = import.meta.env.MODE === 'development';
    this.baseURL = isDevelopment ? '/api' : APP_CONFIG.api.baseUrl;
    this.isUsingMockData = APP_CONFIG.features.mockData;
  }

  /**
   * Iniciar sesión
   * @param {Object} credentials - { email, password, rememberMe }
   * @returns {Promise<Object>} - { success, data: { token, user } }
   */
  async login(credentials) {
    const url = `${this.baseURL}/auth/login`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error HTTP ${response.status}`);
      }

      const data = await response.json();

      // El backend responde con { accessToken, refreshToken, user, expiresIn }
      // No tiene campo "success", si llegamos aquí con status 200 es exitoso
      if (!data.accessToken) {
        throw new Error(data.error || data.message || 'Login failed');
      }

      return {
        success: true,
        data: {
          token: data.accessToken,
          refreshToken: data.refreshToken,
          expiresIn: data.expiresIn,
          user: data.user
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message || i18next.t('errors.unexpectedError')
      };
    }
  }

  /**
   * Cerrar sesión
   */
  async logout() {
    try {
      const token = localStorage.getItem(getStorageKey('authToken')) ||
                    sessionStorage.getItem(getStorageKey('authToken'));
      const response = await fetch(`${this.baseURL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      await response.json();

      return { success: true };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener usuario actual
   */
  async getCurrentUser() {
    try {
      const token = localStorage.getItem(getStorageKey('authToken')) ||
                    sessionStorage.getItem(getStorageKey('authToken'));
      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch(`${this.baseURL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        data: data.data
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verificar si el token es válido
   */
  async verifyToken(token) {
    try {
      const response = await fetch(`${this.baseURL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: response.ok,
        valid: response.ok
      };

    } catch (error) {
      return {
        success: false,
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Refrescar token
   */
  async refreshToken(token) {
    // Por ahora, simplemente verificar el token existente
    return this.verifyToken(token);
  }

  /**
   * Cambiar contraseña del usuario autenticado
   * @param {Object} data - { currentPassword, newPassword, confirmPassword }
   * @returns {Promise<Object>} - { success, message, error }
   */
  async changePassword(data) {
    const url = `${this.baseURL}/auth/change-password`;

    try {
      const token = localStorage.getItem(getStorageKey('authToken')) ||
                    sessionStorage.getItem(getStorageKey('authToken'));

      if (!token) {
        throw new Error('No token found');
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
          confirmPassword: data.confirmPassword
        })
      });

      const responseData = await response.json();

      if (!response.ok) {
        let errorMessage = responseData.message || i18next.t('errors.unexpectedError');
        if (responseData.details && responseData.details.length > 0) {
          errorMessage = responseData.details.map(d => d.message).join('. ');
        }
        return {
          success: false,
          error: errorMessage
        };
      }

      return {
        success: true,
        message: responseData.message || 'Contraseña actualizada correctamente'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message || i18next.t('errors.unexpectedError')
      };
    }
  }

  /**
   * Registrar nuevo guía freelancer
   * @param {Object} data - Datos del formulario de registro
   * @returns {Promise<Object>} - { success, data, error }
   */
  async registerFreelancer(data) {
    const url = `${this.baseURL}/auth/register-freelancer`;

    try {
      const formData = new FormData();
      const nameParts = (data.name || '').trim().split(/\s+/);
      const firstName = nameParts[0] || data.firstName || '';
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : (data.lastName || firstName);
      formData.append('firstName', firstName);
      formData.append('lastName', lastName);
      formData.append('email', data.email);
      formData.append('phone', data.phone);
      formData.append('documentType', data.documentType || 'dni');
      formData.append('documentNumber', data.documentNumber || data.dni);
      formData.append('password', data.password);
      formData.append('languages', JSON.stringify(data.languages || []));
      formData.append('specialties', JSON.stringify(data.specialties || []));
      formData.append('experience', data.experience || 0);
      formData.append('museums', JSON.stringify(data.museums || []));
      if (data.licenseNumber) formData.append('licenseNumber', data.licenseNumber);
      if (data.city) formData.append('city', data.city);

      // Adjuntar foto si es un File
      if (data.profileImage instanceof File) {
        formData.append('photo', data.profileImage);
      }

      const response = await fetch(url, {
        method: 'POST',
        body: formData
      });

      const responseData = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: responseData.message || i18next.t('errors.unexpectedError')
        };
      }

      return {
        success: true,
        data: responseData.data,
        message: responseData.message
      };

    } catch (error) {
      return {
        success: false,
        error: error.message || i18next.t('errors.unexpectedError')
      };
    }
  }
}

// Crear y exportar instancia
const authService = new AuthService();
export default authService;