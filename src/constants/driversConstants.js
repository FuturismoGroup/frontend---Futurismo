/**
 * COMPATIBILITY LAYER - Drivers
 *
 * Este archivo exporta valores por defecto para constantes de choferes.
 * Para acceder a valores dinámicos desde el backend, usa useDriversConfig() en componentes React.
 *
 * ⚠️ TEMPORAL: Este archivo es parte de la capa de compatibilidad.
 * RECOMENDADO: Migrar a useDriversConfig() para uso en componentes React.
 */

// Valores por defecto - se sobrescriben con valores del backend al usar hooks

export const DRIVER_STATUS = [];

export const LICENSE_TYPES = [];

export const EMPLOYMENT_TYPES = [];

export const VEHICLE_CATEGORIES = [];

// License categories (Peru driver's license categories)
export const LICENSE_CATEGORIES = {
  A_I: 'A-I',
  A_IIA: 'A-IIA',
  A_IIB: 'A-IIB',
  A_IIIA: 'A-IIIA',
  A_IIIB: 'A-IIIB',
  A_IIIC: 'A-IIIC',
  B_I: 'B-I',
  B_IIA: 'B-IIA',
  B_IIB: 'B-IIB',
  B_IIC: 'B-IIC'
};

// License category labels for display (labelKey pattern - use t(value) in components)
export const LICENSE_CATEGORY_LABELS = {
  'A-I': 'drivers.licenseCategories.A1',
  'A-IIA': 'drivers.licenseCategories.A2A',
  'A-IIB': 'drivers.licenseCategories.A2B',
  'A-IIIA': 'drivers.licenseCategories.A3A',
  'A-IIIB': 'drivers.licenseCategories.A3B',
  'A-IIIC': 'drivers.licenseCategories.A3C',
  'B-I': 'drivers.licenseCategories.B1',
  'B-IIA': 'drivers.licenseCategories.B2A',
  'B-IIB': 'drivers.licenseCategories.B2B',
  'B-IIC': 'drivers.licenseCategories.B2C'
};

// Driver validation rules
export const DRIVER_VALIDATIONS = {
  DNI_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  PHONE_LENGTH: 9,
  LICENSE_MIN_LENGTH: 5
};

// Driver messages for toast notifications
export const getDriverMessages = (t) => ({
  FETCH_ERROR: t('drivers.messages.fetchError'),
  CREATE_SUCCESS: t('drivers.messages.createSuccess'),
  CREATE_ERROR: t('drivers.messages.createError'),
  UPDATE_SUCCESS: t('drivers.messages.updateSuccess'),
  UPDATE_ERROR: t('drivers.messages.updateError'),
  DELETE_SUCCESS: t('drivers.messages.deleteSuccess'),
  DELETE_ERROR: t('drivers.messages.deleteError'),
  ASSIGN_SUCCESS: t('drivers.messages.assignSuccess'),
  ASSIGN_ERROR: t('drivers.messages.assignError'),
  AVAILABILITY_ERROR: t('drivers.messages.availabilityError'),
  NOT_FOUND: t('drivers.messages.notFound')
});

/** @deprecated Use getDriverMessages(t) instead */
export const DRIVER_MESSAGES = {
  FETCH_ERROR: 'drivers.messages.fetchError',
  CREATE_SUCCESS: 'drivers.messages.createSuccess',
  CREATE_ERROR: 'drivers.messages.createError',
  UPDATE_SUCCESS: 'drivers.messages.updateSuccess',
  UPDATE_ERROR: 'drivers.messages.updateError',
  DELETE_SUCCESS: 'drivers.messages.deleteSuccess',
  DELETE_ERROR: 'drivers.messages.deleteError',
  ASSIGN_SUCCESS: 'drivers.messages.assignSuccess',
  ASSIGN_ERROR: 'drivers.messages.assignError',
  AVAILABILITY_ERROR: 'drivers.messages.availabilityError',
  NOT_FOUND: 'drivers.messages.notFound'
};

// Export default para compatibilidad
export default {
  DRIVER_STATUS,
  LICENSE_TYPES,
  EMPLOYMENT_TYPES,
  VEHICLE_CATEGORIES,
  LICENSE_CATEGORIES,
  LICENSE_CATEGORY_LABELS,
  DRIVER_VALIDATIONS,
  DRIVER_MESSAGES,
  getDriverMessages
};
