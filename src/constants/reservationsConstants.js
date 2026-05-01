/**
 * Constantes de Reservations
 * Valores estáticos para el módulo
 */

export const RESERVATION_STATUS = [];

export const PAYMENT_STATUS = [];

export const PAYMENT_METHODS = [];

export const BOOKING_TYPES = [];

export const CANCELLATION_REASONS = [];

// Wizard steps for reservation flow
export const WIZARD_STEPS = {
  TOUR_SELECTION: 'tour_selection',
  CLIENT_INFO: 'client_info',
  ADDITIONAL_SERVICES: 'additional_services',
  PAYMENT: 'payment',
  CONFIRMATION: 'confirmation'
};

// Service types
export const SERVICE_TYPES = {
  HALFDDAY: 'halfday',
  FULLDAY: 'fullday',
  MULTIDAY: 'multiday',
  CUSTOM: 'custom'
};

// Maximum persons per group
export const MAX_PERSONS_PER_GROUP = 50;

// Form steps for reservation store
export const FORM_STEPS = {
  SERVICE: 1,
  TOURISTS: 2,
  CONFIRMATION: 3,
  MIN_STEP: 1,
  MAX_STEP: 3
};

// Initial form data
export const INITIAL_FORM_DATA = {
  serviceType: '',
  date: '',
  time: '',
  tourName: '',
  pickupLocation: '',
  origin: '',
  destination: '',
  packageName: '',
  accommodation: '',
  touristsCount: 1,
  tourists: [],
  specialRequests: ''
};

// Validation messages
export const getReservationValidationMessages = (t) => ({
  SERVICE_TYPE_REQUIRED: t('reservations.validationMessages.serviceTypeRequired'),
  DATE_REQUIRED: t('reservations.validationMessages.dateRequired'),
  TIME_REQUIRED: t('reservations.validationMessages.timeRequired'),
  ORIGIN_REQUIRED: t('reservations.validationMessages.originRequired'),
  DESTINATION_REQUIRED: t('reservations.validationMessages.destinationRequired'),
  TOUR_NAME_REQUIRED: t('reservations.validationMessages.tourNameRequired'),
  PICKUP_LOCATION_REQUIRED: t('reservations.validationMessages.pickupLocationRequired'),
  PACKAGE_NAME_REQUIRED: t('reservations.validationMessages.packageNameRequired'),
  ACCOMMODATION_REQUIRED: t('reservations.validationMessages.accommodationRequired'),
  TOURISTS_REQUIRED: t('reservations.validationMessages.touristsRequired'),
  TOURISTS_COUNT_MISMATCH: t('reservations.validationMessages.touristsCountMismatch'),
  TOURIST_NAME_REQUIRED: t('reservations.validationMessages.touristNameRequired'),
  TOURIST_PASSPORT_REQUIRED: t('reservations.validationMessages.touristPassportRequired'),
  TOURIST_EMAIL_REQUIRED: t('reservations.validationMessages.touristEmailRequired')
});

/** @deprecated Use getReservationValidationMessages(t) instead */
export const VALIDATION_MESSAGES = {
  SERVICE_TYPE_REQUIRED: 'reservations.validationMessages.serviceTypeRequired',
  DATE_REQUIRED: 'reservations.validationMessages.dateRequired',
  TIME_REQUIRED: 'reservations.validationMessages.timeRequired',
  ORIGIN_REQUIRED: 'reservations.validationMessages.originRequired',
  DESTINATION_REQUIRED: 'reservations.validationMessages.destinationRequired',
  TOUR_NAME_REQUIRED: 'reservations.validationMessages.tourNameRequired',
  PICKUP_LOCATION_REQUIRED: 'reservations.validationMessages.pickupLocationRequired',
  PACKAGE_NAME_REQUIRED: 'reservations.validationMessages.packageNameRequired',
  ACCOMMODATION_REQUIRED: 'reservations.validationMessages.accommodationRequired',
  TOURISTS_REQUIRED: 'reservations.validationMessages.touristsRequired',
  TOURISTS_COUNT_MISMATCH: 'reservations.validationMessages.touristsCountMismatch',
  TOURIST_NAME_REQUIRED: 'reservations.validationMessages.touristNameRequired',
  TOURIST_PASSPORT_REQUIRED: 'reservations.validationMessages.touristPassportRequired',
  TOURIST_EMAIL_REQUIRED: 'reservations.validationMessages.touristEmailRequired'
};

// Export default para compatibilidad
export default {
  RESERVATION_STATUS,
  PAYMENT_STATUS,
  PAYMENT_METHODS,
  BOOKING_TYPES,
  CANCELLATION_REASONS,
  WIZARD_STEPS,
  SERVICE_TYPES,
  MAX_PERSONS_PER_GROUP,
  FORM_STEPS,
  INITIAL_FORM_DATA,
  VALIDATION_MESSAGES,
  getReservationValidationMessages
};
