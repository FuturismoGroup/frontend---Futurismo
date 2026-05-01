/**
 * COMPATIBILITY LAYER - Auth
 *
 * Este archivo exporta valores por defecto para constantes de autenticación.
 * Para acceder a valores dinámicos desde el backend, usa useAuthConfig() en componentes React.
 *
 * ⚠️ TEMPORAL: Este archivo es parte de la capa de compatibilidad.
 * RECOMENDADO: Migrar a useAuthConfig() para uso en componentes React.
 */

// Valores por defecto - se sobrescriben con valores del backend al usar hooks

export const USER_ROLES = [];

export const GUIDE_TYPES = [];

export const USER_STATUS = [];

export const AUTH_STATES = ['idle', 'loading', 'authenticated', 'unauthenticated', 'error'];

export const SESSION_CONFIG = {
  CHECK_INTERVAL: 5 * 60 * 1000, // 5 minutos - verificar token cada 5 min
  TOKEN_REFRESH_THRESHOLD: 2 * 60 * 1000, // 2 minutos antes de expirar
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

// Initial state for auth store
export const INITIAL_STATE = {
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  rememberMe: false
};

// Error messages (labelKey pattern - use t(value) in components)
export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'auth.errorMessages.invalidCredentials',
  EMAIL_EXISTS: 'auth.errorMessages.emailExists',
  UPDATE_PROFILE_ERROR: 'auth.errorMessages.updateProfileError',
  NETWORK_ERROR: 'auth.errorMessages.networkError',
  UNAUTHORIZED: 'auth.errorMessages.unauthorized',
  SESSION_EXPIRED: 'auth.errorMessages.sessionExpired'
};

// Auth events for custom events
export const AUTH_EVENTS = {
  LOGIN_SUCCESS: 'auth:login:success',
  LOGIN_FAILURE: 'auth:login:failure',
  LOGOUT: 'auth:logout',
  SESSION_EXPIRED: 'auth:session:expired',
  TOKEN_REFRESHED: 'auth:token:refreshed'
};

// Export default para compatibilidad
export default {
  USER_ROLES,
  GUIDE_TYPES,
  USER_STATUS,
  AUTH_STATES,
  SESSION_CONFIG,
  INITIAL_STATE,
  ERROR_MESSAGES,
  AUTH_EVENTS
};
