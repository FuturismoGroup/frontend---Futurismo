/**
 * Constantes de ReservationFilters
 * Valores estáticos para el módulo
 */

// Default filter values
export const DEFAULT_FILTER_VALUES = {
  SEARCH_TERM: '',
  STATUS: 'all',
  DATE_FROM: '',
  DATE_TO: '',
  CUSTOMER: '',
  MIN_PASSENGERS: '',
  MAX_PASSENGERS: '',
  CURRENT_PAGE: 1
};

// Filter limits
export const FILTER_LIMITS = {
  MAX_PASSENGERS: 100,
  MIN_PASSENGERS: 1,
  MAX_SEARCH_LENGTH: 100
};

// Pagination config
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
};

// Status options (must match backend DB values)
export const STATUS_OPTIONS = {
  ALL: 'all',
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed'
};

// Date configuration
export const DATE_CONFIG = {
  END_OF_DAY_HOURS: 23,
  END_OF_DAY_MINUTES: 59,
  END_OF_DAY_SECONDS: 59,
  END_OF_DAY_MILLISECONDS: 999
};

// Export default para compatibilidad
export default {
  DEFAULT_FILTER_VALUES,
  FILTER_LIMITS,
  PAGINATION_CONFIG,
  STATUS_OPTIONS,
  DATE_CONFIG
};
