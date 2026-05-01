/**
 * Constantes de Profile
 * Valores estáticos para el módulo
 */

// Payment method types
export const PAYMENT_METHOD_TYPES = {
  BANK_TRANSFER: 'bank_transfer',
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  CASH: 'cash',
  YAPE: 'yape',
  PLIN: 'plin'
};

// Labels legibles para cada tipo (labelKey pattern - use t(value) in components)
export const PAYMENT_METHOD_LABELS = {
  [PAYMENT_METHOD_TYPES.BANK_TRANSFER]: 'profile.paymentMethods.bankTransfer',
  [PAYMENT_METHOD_TYPES.CREDIT_CARD]: 'profile.paymentMethods.creditCard',
  [PAYMENT_METHOD_TYPES.DEBIT_CARD]: 'profile.paymentMethods.debitCard',
  [PAYMENT_METHOD_TYPES.CASH]: 'profile.paymentMethods.cash',
  [PAYMENT_METHOD_TYPES.YAPE]: 'profile.paymentMethods.yape',
  [PAYMENT_METHOD_TYPES.PLIN]: 'profile.paymentMethods.plin'
};

// Campos requeridos por tipo
export const PAYMENT_METHOD_REQUIRED_FIELDS = {
  [PAYMENT_METHOD_TYPES.BANK_TRANSFER]: ['holderName'],
  [PAYMENT_METHOD_TYPES.CREDIT_CARD]: ['holderName'],
  [PAYMENT_METHOD_TYPES.DEBIT_CARD]: ['holderName'],
  [PAYMENT_METHOD_TYPES.CASH]: [],
  [PAYMENT_METHOD_TYPES.YAPE]: ['phoneNumber', 'holderName'],
  [PAYMENT_METHOD_TYPES.PLIN]: ['phoneNumber', 'holderName']
};

// Campos visibles por tipo
export const PAYMENT_METHOD_VISIBLE_FIELDS = {
  [PAYMENT_METHOD_TYPES.BANK_TRANSFER]: ['bank', 'accountNumber', 'cci', 'holderName', 'currency', 'accountType'],
  [PAYMENT_METHOD_TYPES.CREDIT_CARD]: ['bank', 'cardNumber', 'holderName', 'cardType', 'expiryDate'],
  [PAYMENT_METHOD_TYPES.DEBIT_CARD]: ['bank', 'cardNumber', 'holderName', 'cardType', 'expiryDate'],
  [PAYMENT_METHOD_TYPES.CASH]: ['holderName', 'description'],
  [PAYMENT_METHOD_TYPES.YAPE]: ['phoneNumber', 'holderName'],
  [PAYMENT_METHOD_TYPES.PLIN]: ['phoneNumber', 'holderName']
};

// Account types (as objects for component usage)
export const ACCOUNT_TYPES = {
  CHECKING: 'checking',
  SAVINGS: 'savings',
  CTS: 'cts'
};

// Card types (as objects for component usage)
export const CARD_TYPES = {
  VISA: 'visa',
  MASTERCARD: 'mastercard',
  AMEX: 'amex',
  DINERS: 'diners'
};

export const DOCUMENT_TYPES = [];

export const DOCUMENT_STATUS = [];

export const MAX_FILE_SIZE = 5242880;

export const ACCEPTED_FILE_TYPES = {};

export const RATING_LEVELS = [];

export const CONTACT_TYPES = [];

// Currencies
export const CURRENCIES = {
  PEN: 'PEN',
  USD: 'USD',
  EUR: 'EUR'
};

// Profile validation rules
export const PROFILE_VALIDATIONS = {
  NAME_MIN_LENGTH: 3,
  NAME_MAX_LENGTH: 100,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^9\d{8}$/,
  DNI_LENGTH: 8,
  RUC_LENGTH: 11,
  PASSWORD_MIN_LENGTH: 8,
  BIO_MAX_LENGTH: 500
};

// Profile messages
export const getProfileMessages = (t) => ({
  UPDATE_SUCCESS: t('profile.messages.updateSuccess'),
  UPDATE_ERROR: t('profile.messages.updateError'),
  PHOTO_UPLOAD_SUCCESS: t('profile.messages.photoUploadSuccess'),
  PHOTO_UPLOAD_ERROR: t('profile.messages.photoUploadError'),
  PASSWORD_CHANGED: t('profile.messages.passwordChanged'),
  PASSWORD_ERROR: t('profile.messages.passwordError'),
  DOCUMENT_UPLOADED: t('profile.messages.documentUploaded'),
  DOCUMENT_ERROR: t('profile.messages.documentError'),
  PAYMENT_METHOD_ADDED: t('profile.messages.paymentMethodAdded'),
  PAYMENT_METHOD_REMOVED: t('profile.messages.paymentMethodRemoved'),
  PAYMENT_METHOD_ERROR: t('profile.messages.paymentMethodError')
});

/** @deprecated Use getProfileMessages(t) instead */
export const PROFILE_MESSAGES = {
  UPDATE_SUCCESS: 'profile.messages.updateSuccess',
  UPDATE_ERROR: 'profile.messages.updateError',
  PHOTO_UPLOAD_SUCCESS: 'profile.messages.photoUploadSuccess',
  PHOTO_UPLOAD_ERROR: 'profile.messages.photoUploadError',
  PASSWORD_CHANGED: 'profile.messages.passwordChanged',
  PASSWORD_ERROR: 'profile.messages.passwordError',
  DOCUMENT_UPLOADED: 'profile.messages.documentUploaded',
  DOCUMENT_ERROR: 'profile.messages.documentError',
  PAYMENT_METHOD_ADDED: 'profile.messages.paymentMethodAdded',
  PAYMENT_METHOD_REMOVED: 'profile.messages.paymentMethodRemoved',
  PAYMENT_METHOD_ERROR: 'profile.messages.paymentMethodError'
};

// Export default para compatibilidad
export default {
  PAYMENT_METHOD_TYPES,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHOD_REQUIRED_FIELDS,
  PAYMENT_METHOD_VISIBLE_FIELDS,
  ACCOUNT_TYPES,
  CARD_TYPES,
  DOCUMENT_TYPES,
  DOCUMENT_STATUS,
  MAX_FILE_SIZE,
  ACCEPTED_FILE_TYPES,
  RATING_LEVELS,
  CONTACT_TYPES,
  CURRENCIES,
  PROFILE_VALIDATIONS,
  PROFILE_MESSAGES,
  getProfileMessages
};
