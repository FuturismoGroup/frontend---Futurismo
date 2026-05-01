/**
 * COMPATIBILITY LAYER - Agency
 *
 * Este archivo exporta valores por defecto para constantes de agencias.
 * Para acceder a valores dinámicos desde el backend, usa useAgenciesConfig() en componentes React.
 *
 * ⚠️ TEMPORAL: Este archivo es parte de la capa de compatibilidad.
 * RECOMENDADO: Migrar a useAgenciesConfig() para uso en componentes React.
 */

// Valores por defecto - se sobrescriben con valores del backend al usar hooks

export const AGENCY_TYPES = [];

export const AGENCY_STATUS = [];

export const BUSINESS_CATEGORIES = [];

export const SERVICE_AREAS = [];

// Date formats for agency store
export const DATE_FORMATS = {
  DATE_KEY: 'yyyy-MM-dd',
  DISPLAY: 'dd/MM/yyyy',
  DISPLAY_LONG: 'dd MMMM yyyy',
  TIME: 'HH:mm',
  DATETIME: 'dd/MM/yyyy HH:mm'
};

// Default agency configuration
export const DEFAULT_AGENCY = {
  ID: 'agency-1',
  NAME: 'Agencia Principal',
  INITIAL_POINTS: 0
};

// Storage configuration for persist middleware
export const STORAGE_CONFIG = {
  KEY: 'agency-storage',
  VERSION: 1
};

// Reservation status constants
export const RESERVATION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Export default para compatibilidad
export default {
  AGENCY_TYPES,
  AGENCY_STATUS,
  BUSINESS_CATEGORIES,
  SERVICE_AREAS,
  DATE_FORMATS,
  DEFAULT_AGENCY,
  STORAGE_CONFIG,
  RESERVATION_STATUS
};
