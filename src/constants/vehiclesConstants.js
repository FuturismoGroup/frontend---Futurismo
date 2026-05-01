/**
 * Constantes de Vehicles
 * Valores estáticos para el módulo
 */

export const VEHICLE_TYPES = [];

export const VEHICLE_STATUS = [];

export const FUEL_TYPES = [];

export const CAPACITY_RANGES = [];

export const MAINTENANCE_TYPES = [];

// Vehicle document types
export const VEHICLE_DOCUMENTS = {
  SOAT: 'soat',
  TECHNICAL_REVIEW: 'technicalReview',
  OWNERSHIP_CARD: 'ownershipCard',
  CIRCULATION_PERMIT: 'circulationPermit'
};

// Vehicle document labels (labelKey pattern - use t(value) in components)
export const VEHICLE_DOCUMENT_LABELS = {
  soat: 'vehicles.documentLabels.soat',
  technicalReview: 'vehicles.documentLabels.technicalReview',
  ownershipCard: 'vehicles.documentLabels.ownershipCard',
  circulationPermit: 'vehicles.documentLabels.circulationPermit'
};

// Vehicle messages for toast notifications
export const getVehicleMessages = (t) => ({
  FETCH_ERROR: t('vehicles.messages.fetchError'),
  CREATE_SUCCESS: t('vehicles.messages.createSuccess'),
  CREATE_ERROR: t('vehicles.messages.createError'),
  UPDATE_SUCCESS: t('vehicles.messages.updateSuccess'),
  UPDATE_ERROR: t('vehicles.messages.updateError'),
  DELETE_SUCCESS: t('vehicles.messages.deleteSuccess'),
  DELETE_ERROR: t('vehicles.messages.deleteError'),
  ASSIGN_SUCCESS: t('vehicles.messages.assignSuccess'),
  ASSIGN_ERROR: t('vehicles.messages.assignError'),
  AVAILABILITY_ERROR: t('vehicles.messages.availabilityError'),
  NOT_FOUND: t('vehicles.messages.notFound'),
  MAINTENANCE_SUCCESS: t('vehicles.messages.maintenanceSuccess'),
  MAINTENANCE_ERROR: t('vehicles.messages.maintenanceError')
});

/** @deprecated Use getVehicleMessages(t) instead */
export const VEHICLE_MESSAGES = {
  FETCH_ERROR: 'vehicles.messages.fetchError',
  CREATE_SUCCESS: 'vehicles.messages.createSuccess',
  CREATE_ERROR: 'vehicles.messages.createError',
  UPDATE_SUCCESS: 'vehicles.messages.updateSuccess',
  UPDATE_ERROR: 'vehicles.messages.updateError',
  DELETE_SUCCESS: 'vehicles.messages.deleteSuccess',
  DELETE_ERROR: 'vehicles.messages.deleteError',
  ASSIGN_SUCCESS: 'vehicles.messages.assignSuccess',
  ASSIGN_ERROR: 'vehicles.messages.assignError',
  AVAILABILITY_ERROR: 'vehicles.messages.availabilityError',
  NOT_FOUND: 'vehicles.messages.notFound',
  MAINTENANCE_SUCCESS: 'vehicles.messages.maintenanceSuccess',
  MAINTENANCE_ERROR: 'vehicles.messages.maintenanceError'
};

// Export default para compatibilidad
export default {
  VEHICLE_TYPES,
  VEHICLE_STATUS,
  FUEL_TYPES,
  CAPACITY_RANGES,
  MAINTENANCE_TYPES,
  VEHICLE_DOCUMENTS,
  VEHICLE_DOCUMENT_LABELS,
  VEHICLE_MESSAGES,
  getVehicleMessages
};
