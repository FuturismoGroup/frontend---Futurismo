/**
 * Constantes de Providers
 * Solo valores de configuración - categorías, servicios y mensajes vienen de i18n/backend
 */

export const RATING_RANGE = {
  MIN: 1,
  MAX: 5
};

// Validation messages (i18n keys)
export const VALIDATION_MESSAGES = {
  REQUIRED: 'validation.required',
  INVALID_EMAIL: 'validation.invalidEmail',
  POSITIVE_NUMBER: 'validation.positiveNumber',
  MIN_VALUE: 'validation.minValue',
  MAX_VALUE: 'validation.maxValue',
  INTEGER: 'validation.integer'
};

export default {
  RATING_RANGE,
  VALIDATION_MESSAGES
};
