import axios from 'axios';
import { API_ENDPOINTS, ERROR_MESSAGES } from '../utils/constants';
import { getStorageKey } from '../config/app.config';

// Crear instancia de axios con configuración base
// En desarrollo usar URL relativa para que funcione el proxy de Vite
const isDevelopment = import.meta.env.MODE === 'development';
const api = axios.create({
  baseURL: isDevelopment ? '/api' : API_ENDPOINTS.BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Variable para guardar referencia al authStore (se carga después)
let authStoreRef = null;

// Flag para prevenir múltiples redirects simultáneos
let isRedirecting = false;

// Función para obtener el token (primero del store, luego del storage)
const getAuthToken = () => {
  let token = null;

  // Intentar obtener del authStore si está disponible
  if (authStoreRef) {
    try {
      const state = authStoreRef.getState();
      token = state?.token;

      if (token) {
        return token;
      }
    } catch (error) {
      console.warn('⚠️ [Interceptor] Could not access authStore:', error.message);
    }
  }

  // Si no está en el store, buscar en storage
  const storageKey = getStorageKey('authToken');
  token = localStorage.getItem(storageKey) || sessionStorage.getItem(storageKey);

  return token;
};

// Función para registrar el authStore (se llama desde authStore)
export const setAuthStoreReference = (store) => {
  authStoreRef = store;
};

// Interceptor para agregar token a las peticiones
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Manejar errores de red
    if (!error.response) {
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }

    // Manejar errores por código de estado
    switch (error.response.status) {
      case 401:
        // Token expirado o inválido - USAR EVENTO EN LUGAR DE HARD REDIRECT
        // Solo limpiar y emitir evento si no estamos ya redirigiendo
        if (!isRedirecting) {
          isRedirecting = true;

          const tokenKey = getStorageKey('authToken');
          const userKey = getStorageKey('authUser');

          localStorage.removeItem(tokenKey);
          localStorage.removeItem(userKey);
          sessionStorage.removeItem(tokenKey);
          sessionStorage.removeItem(userKey);

          console.log('🔒 [Interceptor] Session expired - emitting event');

          // Emitir evento personalizado en lugar de hard redirect
          window.dispatchEvent(new CustomEvent('auth:session:expired'));

          // Reset flag después de un breve delay
          setTimeout(() => {
            isRedirecting = false;
          }, 1000);
        }

        throw new Error(ERROR_MESSAGES.SESSION_EXPIRED);

      case 403:
        throw new Error(ERROR_MESSAGES.UNAUTHORIZED);

      case 422:
        // Errores de validación
        const validationErrors = error.response.data.errors || {};
        throw {
          message: ERROR_MESSAGES.VALIDATION_ERROR,
          errors: validationErrors
        };

      default: {
        const payload = error.response.data || {};
        const enrichedError = new Error(
          payload.error || payload.message || ERROR_MESSAGES.GENERIC_ERROR
        );
        enrichedError.response = error.response;
        enrichedError.status = error.response.status;
        throw enrichedError;
      }
    }
  }
);

export default api;
