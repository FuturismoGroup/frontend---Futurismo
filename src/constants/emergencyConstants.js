/**
 * COMPATIBILITY LAYER - Emergency
 *
 * Este archivo exporta valores por defecto para constantes de emergencia.
 * Para acceder a valores dinámicos desde el backend, usa useEmergencyConfig() en componentes React.
 *
 * ⚠️ TEMPORAL: Este archivo es parte de la capa de compatibilidad.
 * RECOMENDADO: Migrar a useEmergencyConfig() para uso en componentes React.
 */

// Valores por defecto - se sobrescriben con valores del backend al usar hooks

export const EMERGENCY_TYPES = [];

export const SEVERITY_LEVELS = [];

export const PROTOCOL_CATEGORIES = [];

export const EMERGENCY_CONTACTS = [];

export const RESPONSE_STATUS = [];

// Priority levels (labelKey pattern - use t(value) in components)
export const PRIORITY_LEVELS = {
  critical: 'emergency.priorityLevels.critical',
  high: 'emergency.priorityLevels.high',
  medium: 'emergency.priorityLevels.medium',
  low: 'emergency.priorityLevels.low',
  default: 'emergency.priorityLevels.default'
};

// Priority colors for UI
export const PRIORITY_COLORS = {
  critical: 'bg-red-100 text-red-800 border-red-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  low: 'bg-blue-100 text-blue-800 border-blue-300',
  default: 'bg-gray-100 text-gray-800 border-gray-300'
};

// Contact types (labelKey pattern - use t(value) in components)
export const CONTACT_TYPES = {
  police: 'emergency.contactTypes.police',
  medical: 'emergency.contactTypes.medical',
  fire: 'emergency.contactTypes.fire',
  embassy: 'emergency.contactTypes.embassy',
  internal: 'emergency.contactTypes.internal',
  emergency: 'emergency.contactTypes.emergency',
  support: 'emergency.contactTypes.support',
  default: 'emergency.contactTypes.default'
};

// Emergency icons mapping
export const EMERGENCY_ICONS = {
  medical: '🏥',
  accident: '🚑',
  natural_disaster: '⚠️',
  security: '🚨',
  lost_tourist: '🔍',
  theft: '👮',
  default: '⚡'
};

// Emergency messages for toast notifications
export const getEmergencyMessages = (t) => ({
  FETCH_ERROR: t('emergency.messages.fetchError'),
  CREATE_SUCCESS: t('emergency.messages.createSuccess'),
  CREATE_ERROR: t('emergency.messages.createError'),
  UPDATE_SUCCESS: t('emergency.messages.updateSuccess'),
  UPDATE_ERROR: t('emergency.messages.updateError'),
  DELETE_SUCCESS: t('emergency.messages.deleteSuccess'),
  DELETE_ERROR: t('emergency.messages.deleteError'),
  INCIDENT_REPORTED: t('emergency.messages.incidentReported'),
  INCIDENT_ERROR: t('emergency.messages.incidentError')
});

/** @deprecated Use getEmergencyMessages(t) instead */
export const EMERGENCY_MESSAGES = {
  FETCH_ERROR: 'emergency.messages.fetchError',
  CREATE_SUCCESS: 'emergency.messages.createSuccess',
  CREATE_ERROR: 'emergency.messages.createError',
  UPDATE_SUCCESS: 'emergency.messages.updateSuccess',
  UPDATE_ERROR: 'emergency.messages.updateError',
  DELETE_SUCCESS: 'emergency.messages.deleteSuccess',
  DELETE_ERROR: 'emergency.messages.deleteError',
  INCIDENT_REPORTED: 'emergency.messages.incidentReported',
  INCIDENT_ERROR: 'emergency.messages.incidentError'
};


// Export default para compatibilidad
export default {
  EMERGENCY_TYPES,
  SEVERITY_LEVELS,
  PROTOCOL_CATEGORIES,
  EMERGENCY_CONTACTS,
  RESPONSE_STATUS,
  PRIORITY_LEVELS,
  PRIORITY_COLORS,
  CONTACT_TYPES,
  EMERGENCY_ICONS,
  EMERGENCY_MESSAGES,
  getEmergencyMessages
};
