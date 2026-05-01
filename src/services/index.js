/**
 * Exportación centralizada de servicios
 * Todos los servicios de la aplicación en un solo lugar
 */

// Servicios principales
export { default as authService } from './authService';
export { default as reservationsService } from './reservationsService';

// Servicio base
export { default as BaseService } from './baseService';

// Servicios existentes (a refactorizar)
export { default as api } from './api';
export { default as webSocketService } from './websocket';
export { default as exportService } from './exportService';
export { default as mapService } from './mapService';

// Configuración de interceptores globales
import axios from 'axios';
import { APP_CONFIG } from '../config/app.config';

// Configurar defaults de axios
axios.defaults.timeout = APP_CONFIG.api.timeout;

// Interceptor global para errores
axios.interceptors.response.use(
  response => response,
  error => {
    // Log de errores en desarrollo
    if (APP_CONFIG.features.debugMode) {
      console.error('API Error:', error);
    }
    
    // Manejar errores de red
    if (!error.response) {
      console.error('Network error:', error.message);
    }
    
    return Promise.reject(error);
  }
);