// Constantes de la aplicación

// Estados del servicio según el archivo leer.md
export const SERVICE_STATUS = {
  PENDING: 'pending',
  ON_WAY: 'on_way',
  IN_SERVICE: 'in_service',
  FINISHED: 'finished',
  CANCELLED: 'cancelled'
};

// Colores de estados para el mapa y badges
export const STATUS_COLORS = {
  [SERVICE_STATUS.PENDING]: '#6B7280', // gris
  [SERVICE_STATUS.ON_WAY]: '#F59E0B', // amarillo
  [SERVICE_STATUS.IN_SERVICE]: '#10B981', // verde
  [SERVICE_STATUS.FINISHED]: '#1E40AF', // azul
  [SERVICE_STATUS.CANCELLED]: '#EF4444' // rojo
};

// Tipos de servicio
export const SERVICE_TYPES = {
  TRANSFER: 'transfer',
  TOUR: 'tour',
  PACKAGE: 'package',
  CUSTOM: 'custom'
};

// Estados de formulario
export const FORM_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error'
};

// Formatos de fecha por defecto (pueden ser sobrescritos por configuración dinámica)
export const DATE_FORMATS = {
  DISPLAY: 'dd/MM/yyyy',
  DISPLAY_WITH_TIME: 'dd/MM/yyyy HH:mm',
  API: 'yyyy-MM-dd',
  TIME_ONLY: 'HH:mm'
};

// Configuración del mapa
// Zona de operación: Lima - Ica (Pisco como punto central)
export const MAP_CONFIG = {
  DEFAULT_CENTER: [-13.7167, -76.2000], // Pisco, Peru - zona Lima-Ica
  DEFAULT_ZOOM: 10, // Zoom mas amplio para ver toda la zona
  MIN_ZOOM: 8,
  MAX_ZOOM: 18,
  ATTRIBUTION: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  // Aliases en camelCase para compatibilidad con componentes que usan esa convención
  defaultCenter: [-13.7167, -76.2000],
  defaultZoom: 10,
  maxZoom: 18,
  tileLayerUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
};

// Configuración de notificaciones
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Regex para validaciones
export const REGEX_PATTERNS = {
  EMAIL: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  PHONE: /^9\d{8}$/,  // Exactamente 9 dígitos empezando con 9
  PASSPORT: /^[A-Z0-9]{6,20}$/i,
  SERVICE_CODE: /^[A-Z]{2}[0-9]{6}$/
};

// Configuración que debe ser obtenida dinámicamente desde el contexto
// Estas funciones acceden a la configuración dinámica
export const getApiConfig = () => {
  // Esta función será reemplazada por el hook useConfig
  const isDevelopment = import.meta.env.MODE === 'development';

  return {
    BASE_URL: import.meta.env.VITE_API_URL || (isDevelopment ? '/api' : undefined),
    WS_URL: import.meta.env.VITE_WS_URL
  };
};

export const getLimitsConfig = () => {
  // Esta función será reemplazada por el hook useConfig
  return {
    MIN_TOURISTS: 1,
    MAX_TOURISTS: 50,
    MIN_SERVICE_DURATION: 1, // horas
    MAX_SERVICE_DURATION: 24, // horas
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    DEBOUNCE_DELAY: 300 // ms para búsquedas
  };
};

export const getContactConfig = () => {
  return {
    WHATSAPP_NUMBER: import.meta.env.VITE_WHATSAPP_NUMBER || "+51999888777",
    WHATSAPP_MESSAGE: "Hola, necesito consultar disponibilidad para un tour fullday después de las 5 PM",
    CUTOFF_HOUR: parseInt(import.meta.env.VITE_WHATSAPP_CUTOFF_HOUR, 10) || 17 // 5 PM
  };
};

// Mensajes de error (deberían moverse a archivos de traducción)
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Error de conexión. Por favor, verifica tu internet.',
  UNAUTHORIZED: 'No tienes autorización para realizar esta acción.',
  SESSION_EXPIRED: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
  GENERIC_ERROR: 'Ocurrió un error inesperado. Por favor, intenta de nuevo.',
  VALIDATION_ERROR: 'Por favor, verifica los datos ingresados.',
  FILE_TOO_LARGE: 'El archivo es demasiado grande. Máximo 5MB.'
};

// DEPRECATED: Estas constantes han sido movidas a configuración dinámica
// Se mantienen solo para compatibilidad, usar los hooks de configuración
export const LIMITS = getLimitsConfig();
export const FULLDAY_CONFIG = getContactConfig();
export const API_ENDPOINTS = getApiConfig();